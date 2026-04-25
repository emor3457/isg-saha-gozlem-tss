import db from '../database/db';

/**
 * Taşeron ve Yüklenici Güvenlik Portalı Servisi
 * 
 * Modüller:
 *   - Firma Yönetimi (contractors)
 *   - Personel Yönetimi (contractorPersonnel)
 *   - Evrak / Doküman Takibi (contractorDocuments)
 *   - Evrak Geçerlilik Uyarıları
 *   - Saha Giriş Yasağı Kontrolleri
 */

const DOCUMENT_TYPES = [
    { value: 'sgk_bildirge', label: 'SGK İşe Giriş Bildirgesi', icon: '📋', critical: true },
    { value: 'isg_egitim', label: 'İSG Temel Eğitim Belgesi', icon: '🎓', critical: true },
    { value: 'saglik_raporu', label: 'Sağlık Raporu', icon: '🏥', critical: true },
    { value: 'mesleki_yeterlilik', label: 'Mesleki Yeterlilik Belgesi', icon: '📜', critical: false },
    { value: 'is_sozlesmesi', label: 'İş Sözleşmesi', icon: '📝', critical: false },
    { value: 'risk_degerlendirme', label: 'Risk Değerlendirme Raporu', icon: '⚠️', critical: true },
    { value: 'sigorta_police', label: 'İş Kazası Sigorta Poliçesi', icon: '🛡️', critical: true },
    { value: 'acil_durum_plani', label: 'Acil Durum Planı', icon: '🚨', critical: false },
    { value: 'ekipman_kontrol', label: 'Ekipman Kontrol Belgesi', icon: '🔧', critical: false },
    { value: 'kkd_teslim', label: 'KKD Teslim Tutanağı', icon: '🦺', critical: false },
    { value: 'calisma_izni', label: 'Çalışma İzin Belgesi', icon: '📑', critical: true },
    { value: 'diger', label: 'Diğer Belge', icon: '📄', critical: false },
];

const WORK_SCOPES = [
    'Genel Bakım', 'Elektrik', 'Mekanik', 'İnşaat', 'Boya/Kaplama',
    'Temizlik', 'Catering', 'Güvenlik', 'Nakliye', 'IT/Yazılım',
    'Çevre/Atık', 'İskele/Kalıp', 'Kaynak', 'İzolasyon', 'Diğer'
];

class ContractorService {
    getDocumentTypes() { return DOCUMENT_TYPES; }
    getWorkScopes() { return WORK_SCOPES; }
    getDocTypeInfo(val) { return DOCUMENT_TYPES.find(d => d.value === val) || { label: val, icon: '📄', critical: false }; }

    // ═══ FİRMALAR ═══
    async getContractors() {
        return await db.contractors.orderBy('name').toArray();
    }

    async getContractorById(id) {
        return await db.contractors.get(id);
    }

    async addContractor(contractor) {
        return await db.contractors.add({
            ...contractor,
            status: 'active',
            createdAt: new Date().toISOString()
        });
    }

    async updateContractor(id, changes) {
        return await db.contractors.update(id, { ...changes, updatedAt: new Date().toISOString() });
    }

    async deleteContractor(id) {
        // İlgili personel ve belgeler de silinir
        const personnel = await db.contractorPersonnel.where('contractorId').equals(id).toArray();
        const personnelIds = personnel.map(p => p.id);
        await db.contractorDocuments.where('contractorId').equals(id).delete();
        if (personnelIds.length) {
            for (const pid of personnelIds) {
                await db.contractorDocuments.where('personnelId').equals(pid).delete();
            }
        }
        await db.contractorPersonnel.where('contractorId').equals(id).delete();
        return await db.contractors.delete(id);
    }

    // ═══ PERSONEL ═══
    async getPersonnel() {
        return await db.contractorPersonnel.toArray();
    }

    async getPersonnelByContractor(contractorId) {
        return await db.contractorPersonnel.where('contractorId').equals(Number(contractorId)).toArray();
    }

    async addPersonnel(personnel) {
        return await db.contractorPersonnel.add({
            ...personnel,
            siteAccess: 'allowed', // allowed, restricted, banned
            createdAt: new Date().toISOString()
        });
    }

    async updatePersonnel(id, changes) {
        return await db.contractorPersonnel.update(id, changes);
    }

    async deletePersonnel(id) {
        await db.contractorDocuments.where('personnelId').equals(id).delete();
        return await db.contractorPersonnel.delete(id);
    }

    async updateSiteAccess(personnelId, accessStatus, reason) {
        return await db.contractorPersonnel.update(personnelId, {
            siteAccess: accessStatus,
            accessChangeReason: reason,
            accessChangedAt: new Date().toISOString()
        });
    }

    // ═══ EVRAKLAR / DOKÜMANLAR ═══
    async getDocuments(contractorId) {
        return await db.contractorDocuments.where('contractorId').equals(Number(contractorId)).toArray();
    }

    async getDocumentsByPersonnel(personnelId) {
        return await db.contractorDocuments.where('personnelId').equals(Number(personnelId)).toArray();
    }

    async getAllDocuments() {
        return await db.contractorDocuments.toArray();
    }

    async addDocument(doc) {
        return await db.contractorDocuments.add({
            ...doc,
            status: this.calculateDocStatus(doc.expiryDate),
            uploadedAt: new Date().toISOString()
        });
    }

    async updateDocument(id, changes) {
        return await db.contractorDocuments.update(id, {
            ...changes,
            status: changes.expiryDate ? this.calculateDocStatus(changes.expiryDate) : undefined,
        });
    }

    async deleteDocument(id) {
        return await db.contractorDocuments.delete(id);
    }

    calculateDocStatus(expiryDate) {
        if (!expiryDate) return 'valid';
        const now = new Date();
        const exp = new Date(expiryDate);
        const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'expired';
        if (daysLeft <= 30) return 'expiring_soon';
        return 'valid';
    }

    // ═══ EVRAK GEÇERLİLİK KONTROL ═══
    async getExpiringDocuments(daysAhead = 30) {
        const docs = await this.getAllDocuments();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return docs.filter(d => {
            if (!d.expiryDate) return false;
            const exp = new Date(d.expiryDate);
            return exp <= futureDate;
        });
    }

    async getExpiredDocuments() {
        const docs = await this.getAllDocuments();
        const now = new Date();
        return docs.filter(d => d.expiryDate && new Date(d.expiryDate) <= now);
    }

    // ═══ SAHA GİRİŞ YASAĞI KONTROLÜ ═══
    async getBannedPersonnel() {
        const personnel = await this.getPersonnel();
        return personnel.filter(p => p.siteAccess === 'banned');
    }

    async getRestrictedPersonnel() {
        const personnel = await this.getPersonnel();
        return personnel.filter(p => p.siteAccess === 'restricted' || p.siteAccess === 'banned');
    }

    // Eksik kritik evrakı olan personeli kontrol et
    async getPersonnelWithMissingCriticalDocs() {
        const personnel = await this.getPersonnel();
        const docs = await this.getAllDocuments();
        const criticalTypes = DOCUMENT_TYPES.filter(d => d.critical).map(d => d.value);
        const now = new Date();

        const results = [];
        for (const p of personnel) {
            const personDocs = docs.filter(d => d.personnelId === p.id);
            const missingDocs = [];
            const expiredDocs = [];

            for (const ct of criticalTypes) {
                const doc = personDocs.find(d => d.type === ct);
                if (!doc) {
                    missingDocs.push(ct);
                } else if (doc.expiryDate && new Date(doc.expiryDate) <= now) {
                    expiredDocs.push(ct);
                }
            }

            if (missingDocs.length > 0 || expiredDocs.length > 0) {
                results.push({ ...p, missingDocs, expiredDocs });
            }
        }
        return results;
    }

    // ═══ ZENGİNLEŞTİRME ═══
    async enrichContractors(contractors) {
        const personnel = await this.getPersonnel();
        const docs = await this.getAllDocuments();
        const now = new Date();

        return contractors.map(c => {
            const firmPersonnel = personnel.filter(p => p.contractorId === c.id);
            const firmDocs = docs.filter(d => d.contractorId === c.id);
            const expiredDocs = firmDocs.filter(d => d.expiryDate && new Date(d.expiryDate) <= now);
            const bannedCount = firmPersonnel.filter(p => p.siteAccess === 'banned').length;

            return {
                ...c,
                personnelCount: firmPersonnel.length,
                activePersonnel: firmPersonnel.filter(p => p.siteAccess === 'allowed').length,
                bannedCount,
                totalDocs: firmDocs.length,
                expiredDocsCount: expiredDocs.length,
                hasIssues: expiredDocs.length > 0 || bannedCount > 0,
            };
        });
    }

    // ═══ İSTATİSTİKLER ═══
    async getStats() {
        const [contractors, personnel, docs] = await Promise.all([
            this.getContractors(),
            this.getPersonnel(),
            this.getAllDocuments(),
        ]);
        const now = new Date();
        const expiredDocs = docs.filter(d => d.expiryDate && new Date(d.expiryDate) <= now);
        const soonExpiring = docs.filter(d => {
            if (!d.expiryDate) return false;
            const exp = new Date(d.expiryDate);
            const future = new Date(); future.setDate(future.getDate() + 30);
            return exp > now && exp <= future;
        });

        return {
            contractorCount: contractors.filter(c => c.status === 'active').length,
            personnelCount: personnel.length,
            allowedPersonnel: personnel.filter(p => p.siteAccess === 'allowed').length,
            bannedPersonnel: personnel.filter(p => p.siteAccess === 'banned').length,
            restrictedPersonnel: personnel.filter(p => p.siteAccess === 'restricted').length,
            totalDocs: docs.length,
            expiredDocs: expiredDocs.length,
            soonExpiringDocs: soonExpiring.length,
        };
    }
}

export const contractorService = new ContractorService();
