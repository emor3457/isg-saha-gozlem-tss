import db from '../database/db';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * KKD (Kişisel Koruyucu Donanım) Yönetim Servisi
 * 
 * Modüller:
 *   - Çalışan Yönetimi (employees)
 *   - KKD Katalog / Tür Yönetimi (ppeTypes)
 *   - Zimmet İşlemleri (ppeAssignments)
 *   - PDF Zimmet Tutanağı
 *   - Miad / Ömür Uyarıları
 */

const PPE_CATEGORIES = [
    { value: 'head', label: 'Baş Koruyucu', icon: '🪖' },
    { value: 'eye', label: 'Göz / Yüz Koruyucu', icon: '🥽' },
    { value: 'ear', label: 'Kulak Koruyucu', icon: '🎧' },
    { value: 'respiratory', label: 'Solunum Koruyucu', icon: '😷' },
    { value: 'hand', label: 'El Koruyucu', icon: '🧤' },
    { value: 'foot', label: 'Ayak Koruyucu', icon: '👢' },
    { value: 'body', label: 'Vücut Koruyucu', icon: '🦺' },
    { value: 'fall', label: 'Düşme Önleyici', icon: '🪢' },
    { value: 'other', label: 'Diğer KKD', icon: '🛡️' },
];

const DEPARTMENTS = [
    'Bakım', 'Üretim', 'Hangar', 'Pist', 'Depo', 'Ofis', 'Kalite', 'İSG', 'İdari', 'Taşeron'
];

class PpeService {
    getCategories() { return PPE_CATEGORIES; }
    getDepartments() { return DEPARTMENTS; }
    getCategoryInfo(val) { return PPE_CATEGORIES.find(c => c.value === val) || { label: val, icon: '🛡️' }; }

    // ═══ EMPLOYEES ═══
    async getEmployees() {
        return await db.employees.toArray();
    }

    async getActiveEmployees() {
        return (await db.employees.toArray()).filter(e => e.status === 'active');
    }

    async addEmployee(employee) {
        return await db.employees.add({
            ...employee,
            status: 'active',
            createdAt: new Date().toISOString()
        });
    }

    async updateEmployee(id, changes) {
        return await db.employees.update(id, changes);
    }

    async deleteEmployee(id) {
        return await db.employees.delete(id);
    }

    // ═══ PPE TYPES (Katalog) ═══
    async getPpeTypes() {
        return await db.ppeTypes.toArray();
    }

    async addPpeType(ppe) {
        return await db.ppeTypes.add({
            ...ppe,
            createdAt: new Date().toISOString()
        });
    }

    async updatePpeType(id, changes) {
        return await db.ppeTypes.update(id, changes);
    }

    async deletePpeType(id) {
        return await db.ppeTypes.delete(id);
    }

    // ═══ ASSIGNMENTS (Zimmet) ═══
    async getAssignments() {
        return await db.ppeAssignments.orderBy('assignmentDate').reverse().toArray();
    }

    async getActiveAssignments() {
        return (await db.ppeAssignments.toArray()).filter(a => a.status === 'active');
    }

    async getAssignmentsByEmployee(employeeId) {
        return await db.ppeAssignments.where('employeeId').equals(Number(employeeId)).toArray();
    }

    async assignPpe(data) {
        // Miad hesapla
        const ppeType = await db.ppeTypes.get(data.ppeTypeId);
        let nextReplacementDate = null;
        if (ppeType && ppeType.lifespanMonths) {
            const d = new Date();
            d.setMonth(d.getMonth() + ppeType.lifespanMonths);
            nextReplacementDate = d.toISOString();
        }

        return await db.ppeAssignments.add({
            ...data,
            status: 'active',
            condition: 'new',
            assignmentDate: new Date().toISOString(),
            nextReplacementDate,
        });
    }

    async returnPpe(assignmentId, condition, note) {
        return await db.ppeAssignments.update(assignmentId, {
            status: condition === 'damaged' ? 'damaged' : 'returned',
            returnCondition: condition,
            returnNote: note || '',
            returnDate: new Date().toISOString()
        });
    }

    async deleteAssignment(id) {
        return await db.ppeAssignments.delete(id);
    }

    // ═══ ENRICHMENT (ID → İsim dönüşümleri) ═══
    async enrichAssignments(assignments) {
        const employees = await this.getEmployees();
        const ppeTypes = await this.getPpeTypes();
        const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
        const ppeMap = Object.fromEntries(ppeTypes.map(p => [p.id, p]));

        return assignments.map(a => ({
            ...a,
            employeeName: empMap[a.employeeId]?.name || `#${a.employeeId}`,
            employeeDepartment: empMap[a.employeeId]?.department || '-',
            employeeSgkNo: empMap[a.employeeId]?.sgkNo || '-',
            ppeName: ppeMap[a.ppeTypeId]?.name || `#${a.ppeTypeId}`,
            ppeCategory: ppeMap[a.ppeTypeId]?.category || 'other',
            ppeStandard: ppeMap[a.ppeTypeId]?.standard || '-',
        }));
    }

    // ═══ MİAD UYARILARI ═══
    async getExpiringAssignments(daysAhead = 30) {
        const actives = await this.getActiveAssignments();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const expiring = actives.filter(a => {
            if (!a.nextReplacementDate) return false;
            const repDate = new Date(a.nextReplacementDate);
            return repDate <= futureDate;
        });

        return this.enrichAssignments(expiring);
    }

    async getExpiredAssignments() {
        const actives = await this.getActiveAssignments();
        const now = new Date();
        const expired = actives.filter(a => {
            if (!a.nextReplacementDate) return false;
            return new Date(a.nextReplacementDate) <= now;
        });
        return this.enrichAssignments(expired);
    }

    // ═══ İSTATİSTİKLER ═══
    async getStats() {
        const [employees, ppeTypes, assignments] = await Promise.all([
            this.getEmployees(),
            this.getPpeTypes(),
            this.getAssignments()
        ]);
        const actives = assignments.filter(a => a.status === 'active');
        const now = new Date();
        const expiredCount = actives.filter(a => a.nextReplacementDate && new Date(a.nextReplacementDate) <= now).length;
        const soonExpiring = actives.filter(a => {
            if (!a.nextReplacementDate) return false;
            const d = new Date(a.nextReplacementDate);
            const future = new Date(); future.setDate(future.getDate() + 30);
            return d > now && d <= future;
        }).length;

        return {
            employeeCount: employees.filter(e => e.status === 'active').length,
            ppeTypeCount: ppeTypes.length,
            activeAssignments: actives.length,
            returnedCount: assignments.filter(a => a.status === 'returned').length,
            damagedCount: assignments.filter(a => a.status === 'damaged').length,
            expiredCount,
            soonExpiring,
        };
    }

    // ═══ PDF ZİMMET TUTANAĞI ═══
    async generateAssignmentPDF(assignmentId) {
        const assignment = await db.ppeAssignments.get(assignmentId);
        if (!assignment) throw new Error('Zimmet kaydı bulunamadı.');

        const employee = await db.employees.get(assignment.employeeId);
        const ppeType = await db.ppeTypes.get(assignment.ppeTypeId);

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(255, 140, 0);
        doc.rect(0, 0, pageWidth, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('KKD ZİMMET TUTANAĞI', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('ISO 45001 Uyumlu · Kişisel Koruyucu Donanım Teslim Belgesi', pageWidth / 2, 23, { align: 'center' });
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, 29, { align: 'center' });

        // Info table
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
            startY: 40,
            head: [['Alan', 'Bilgi']],
            body: [
                ['Çalışan Adı', employee?.name || '-'],
                ['Departman', employee?.department || '-'],
                ['SGK No', employee?.sgkNo || '-'],
                ['Unvan', employee?.title || '-'],
                ['KKD Türü', ppeType?.name || '-'],
                ['Kategori', this.getCategoryInfo(ppeType?.category)?.label || '-'],
                ['Standart', ppeType?.standard || '-'],
                ['Teslim Tarihi', new Date(assignment.assignmentDate).toLocaleDateString('tr-TR')],
                ['Ömrü (Ay)', ppeType?.lifespanMonths || '-'],
                ['Sonraki Değişim', assignment.nextReplacementDate ? new Date(assignment.nextReplacementDate).toLocaleDateString('tr-TR') : '-'],
                ['Durum', assignment.status === 'active' ? 'Sahada (Aktif)' : assignment.status === 'returned' ? 'İade Edildi' : 'Hasarlı'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 140, 0], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        });

        // Taahhüt metni
        const y = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const text = 'Yukarıda belirtilen kişisel koruyucu donanımı, kullanım talimatına uygun şekilde teslim aldığımı, ' +
            'kullanım süresi boyunca bakım ve kontrolünü yapacağımı, hasarlı veya arızalı hale gelmesi durumunda ' +
            'derhal İSG birimine bildireceğimi taahhüt ederim.';
        doc.text(text, 15, y, { maxWidth: pageWidth - 30 });

        // İmza alanları
        const sigY = y + 25;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Teslim Alan:', 25, sigY);
        doc.text('Teslim Eden:', pageWidth - 65, sigY);
        doc.setFont(undefined, 'normal');
        doc.line(15, sigY + 15, 85, sigY + 15);
        doc.line(pageWidth - 75, sigY + 15, pageWidth - 15, sigY + 15);
        doc.setFontSize(8);
        doc.text(employee?.name || '____________', 25, sigY + 20);
        doc.text('İSG Birimi', pageWidth - 55, sigY + 20);

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        doc.text('Bu belge ISG Saha Gözlem Sistemi tarafından otomatik oluşturulmuştur. ISO 45001 uyumludur.', pageWidth / 2, 285, { align: 'center' });

        // Download
        const fileName = `KKD_Zimmet_${(employee?.name || 'calisani').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        return fileName;
    }

    // Toplu PDF (Seçili bir çalışanın tüm aktif zimmetleri)
    async generateEmployeePDF(employeeId) {
        const employee = await db.employees.get(employeeId);
        if (!employee) throw new Error('Çalışan bulunamadı.');

        const assignments = await this.getAssignmentsByEmployee(employeeId);
        const actives = assignments.filter(a => a.status === 'active');
        const enriched = await this.enrichAssignments(actives);

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;

        doc.setFillColor(255, 140, 0);
        doc.rect(0, 0, pageWidth, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KKD ZİMMET ÖZETİ', pageWidth / 2, 14, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`${employee.name} — ${employee.department || ''}`, pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, 29, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.autoTable({
            startY: 40,
            head: [['#', 'KKD Adı', 'Kategori', 'Standart', 'Teslim Tarihi', 'Son Değişim']],
            body: enriched.map((a, i) => [
                i + 1,
                a.ppeName,
                this.getCategoryInfo(a.ppeCategory)?.label || '-',
                a.ppeStandard,
                new Date(a.assignmentDate).toLocaleDateString('tr-TR'),
                a.nextReplacementDate ? new Date(a.nextReplacementDate).toLocaleDateString('tr-TR') : '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [255, 140, 0] },
            styles: { fontSize: 9 },
        });

        const fileName = `KKD_Ozet_${employee.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        return fileName;
    }

    // ═══ İSTATİSTİKLER ═══
    async getStats() {
        const [employees, ppeTypes, assignments] = await Promise.all([
            db.employees.toArray(),
            db.ppeTypes.toArray(),
            db.ppeAssignments.toArray(),
        ]);
        const now = new Date();
        const future = new Date(); future.setDate(future.getDate() + 30);
        const active = assignments.filter(a => a.status === 'active');
        const expiringSoon = active.filter(a => a.nextReplacementDate && new Date(a.nextReplacementDate) <= future);
        const expired = active.filter(a => a.nextReplacementDate && new Date(a.nextReplacementDate) <= now);

        return {
            activeEmployees: employees.filter(e => e.status === 'active').length,
            ppeTypeCount: ppeTypes.length,
            activeAssignments: active.length,
            expiringSoon: expiringSoon.length,
            expired: expired.length,
        };
    }
}

export const ppeService = new PpeService();

