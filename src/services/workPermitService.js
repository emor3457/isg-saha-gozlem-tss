import db from '../database/db';

/**
 * İş İzin Sistemi (Permit to Work) Servisi
 * 
 * Onay Akışı:
 *   draft → pending_validation → pending_approval → approved → active → closed / rejected
 * 
 * Roller:
 *   applicant  : İzin talep eden kişi
 *   validator  : Alan sorumlusu (teknik kontrol)
 *   approver   : İSG Uzmanı (nihai onay)
 */

const PERMIT_TYPES = [
    { value: 'hot_work', label: 'Sıcak Çalışma (Kaynak, Kesme)', color: '#EF4444', icon: '🔥' },
    { value: 'height_work', label: 'Yüksekte Çalışma', color: '#F97316', icon: '🏗️' },
    { value: 'confined_space', label: 'Kapalı Alan Girişi', color: '#A855F7', icon: '🚧' },
    { value: 'electrical', label: 'Elektrik Çalışması', color: '#EAB308', icon: '⚡' },
    { value: 'excavation', label: 'Kazı Çalışması', color: '#84CC16', icon: '🏗️' },
    { value: 'lifting', label: 'Kaldırma / Taşıma', color: '#06B6D4', icon: '🏋️' },
    { value: 'chemical', label: 'Kimyasal Madde Kullanımı', color: '#EC4899', icon: '☣️' },
    { value: 'loto', label: 'LOTO (Etiketle-Kilitle)', color: '#6366F1', icon: '🔒' },
    { value: 'general', label: 'Genel Tehlikeli İş', color: '#64748B', icon: '⚠️' },
];

const STATUS_FLOW = {
    draft:              { next: 'pending_validation', prev: null,                  label: 'Taslak',            color: '#64748B', action: 'Doğrulamaya Gönder' },
    pending_validation: { next: 'pending_approval',   prev: 'draft',               label: 'Doğrulama Bekliyor',color: '#3B82F6', action: 'Doğrula' },
    pending_approval:   { next: 'approved',           prev: 'pending_validation',   label: 'Onay Bekliyor',     color: '#F59E0B', action: 'Onayla' },
    approved:           { next: 'active',             prev: 'pending_approval',     label: 'Onaylandı',         color: '#10B981', action: 'İşi Başlat' },
    active:             { next: 'closed',             prev: null,                   label: 'Aktif (Sahada)',    color: '#22C55E', action: 'İşi Kapat' },
    closed:             { next: null,                 prev: null,                   label: 'Kapatıldı',         color: '#6B7280', action: null },
    rejected:           { next: null,                 prev: null,                   label: 'Reddedildi',        color: '#EF4444', action: null },
};

const APPROVAL_STEPS = [
    { key: 'draft',              label: 'Taslak Oluştur',   role: 'applicant'  },
    { key: 'pending_validation', label: 'Alan Doğrulaması',  role: 'validator'  },
    { key: 'pending_approval',   label: 'İSG Uzmanı Onayı', role: 'approver'   },
    { key: 'approved',           label: 'Onaylandı',        role: 'approver'   },
    { key: 'active',             label: 'Sahada Aktif',     role: 'applicant'  },
    { key: 'closed',             label: 'Kapatıldı',        role: 'applicant'  },
];

class WorkPermitService {
    getPermitTypes() {
        return PERMIT_TYPES;
    }

    getStatusFlow() {
        return STATUS_FLOW;
    }

    getApprovalSteps() {
        return APPROVAL_STEPS;
    }

    async getPermits() {
        return await db.workPermits.orderBy('createdAt').reverse().toArray();
    }

    async getPermitById(id) {
        return await db.workPermits.get(id);
    }

    async getPermitsByStatus(status) {
        return await db.workPermits.where('status').equals(status).toArray();
    }

    async getActivePermits() {
        return await db.workPermits.where('status').anyOf(['approved', 'active', 'pending_approval', 'pending_validation']).toArray();
    }

    async addPermit(permit) {
        const permitData = {
            ...permit,
            status: 'draft',
            approvalHistory: [{
                status: 'draft',
                by: permit.applicant || 'Sistem',
                at: new Date().toISOString(),
                note: 'İş izni talebi oluşturuldu.'
            }],
            qrCode: this.generatePermitQR(),
            createdAt: new Date().toISOString()
        };
        return await db.workPermits.add(permitData);
    }

    async updatePermit(id, changes) {
        return await db.workPermits.update(id, {
            ...changes,
            lastModifiedAt: new Date().toISOString()
        });
    }

    async advanceStatus(id, userId, note = '') {
        const permit = await this.getPermitById(id);
        if (!permit) throw new Error('İş izni bulunamadı.');

        const currentFlow = STATUS_FLOW[permit.status];
        if (!currentFlow || !currentFlow.next) throw new Error('Bu izin ilerletilemez.');

        const newStatus = currentFlow.next;
        const history = [...(permit.approvalHistory || []), {
            status: newStatus,
            by: userId || 'Sistem',
            at: new Date().toISOString(),
            note: note || `Durum ${currentFlow.label} → ${STATUS_FLOW[newStatus].label} olarak güncellendi.`
        }];

        await db.workPermits.update(id, {
            status: newStatus,
            approvalHistory: history,
            lastModifiedBy: userId,
            lastModifiedAt: new Date().toISOString()
        });
        return newStatus;
    }

    async rejectPermit(id, userId, reason) {
        const permit = await this.getPermitById(id);
        if (!permit) throw new Error('İş izni bulunamadı.');

        const history = [...(permit.approvalHistory || []), {
            status: 'rejected',
            by: userId || 'Sistem',
            at: new Date().toISOString(),
            note: reason || 'Reddedildi.'
        }];

        await db.workPermits.update(id, {
            status: 'rejected',
            approvalHistory: history,
            rejectedBy: userId,
            rejectedAt: new Date().toISOString(),
            rejectReason: reason
        });
    }

    async deletePermit(id) {
        return await db.workPermits.delete(id);
    }

    async verifyByQR(qrCode) {
        const permits = await db.workPermits.toArray();
        const permit = permits.find(p => p.qrCode === qrCode);
        if (!permit) return { valid: false, message: 'Bu QR koduna ait iş izni bulunamadı.' };

        const isExpired = permit.endDate && new Date(permit.endDate) < new Date();
        const isActive = ['approved', 'active'].includes(permit.status);

        return {
            valid: isActive && !isExpired,
            permit,
            message: isExpired
                ? '⛔ Bu iş izninin süresi dolmuş!'
                : isActive
                    ? '✅ Geçerli iş izni.'
                    : `⚠️ İzin durumu: ${STATUS_FLOW[permit.status]?.label || permit.status}`
        };
    }

    generatePermitQR() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'PTW-';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async getStats() {
        const all = await this.getPermits();
        return {
            total: all.length,
            draft: all.filter(p => p.status === 'draft').length,
            pendingPermits: all.filter(p => ['pending_validation', 'pending_approval'].includes(p.status)).length,
            activePermits: all.filter(p => ['approved', 'active'].includes(p.status)).length,
            approvedPermits: all.filter(p => p.status === 'approved').length,
            closed: all.filter(p => p.status === 'closed').length,
            rejected: all.filter(p => p.status === 'rejected').length,
        };
    }
}

export const workPermitService = new WorkPermitService();
