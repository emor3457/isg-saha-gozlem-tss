import db from '../database/db';

/**
 * İSG Kurulları ve Toplantı Yönetimi Servisi
 * 
 * Modüller:
 *   - Kurul Tanımlama ve Yönetimi (committees)
 *   - Toplantı Planlama ve Kayıt (committeeMeetings)
 *   - Karar Yönetimi (meetingDecisions)
 *   - DÖF (Düzeltici/Önleyici Faaliyet) Bağlantısı (actions tablosu)
 *   - İstatistikler
 */

const COMMITTEE_TYPES = [
    { value: 'main', label: 'Ana İSG Kurulu', icon: '🏛️' },
    { value: 'workplace', label: 'İşyeri İSG Kurulu', icon: '🏢' },
    { value: 'emergency', label: 'Acil Durum Ekibi', icon: '🚨' },
    { value: 'audit', label: 'İç Denetim Kurulu', icon: '🔍' },
    { value: 'training', label: 'Eğitim Komitesi', icon: '🎓' },
    { value: 'risk', label: 'Risk Değerlendirme Ekibi', icon: '⚠️' },
    { value: 'other', label: 'Diğer Kurul', icon: '📋' },
];

const MEETING_FREQUENCIES = [
    { value: 'monthly', label: 'Aylık' },
    { value: 'bimonthly', label: '2 Ayda Bir' },
    { value: 'quarterly', label: '3 Ayda Bir' },
    { value: 'biannual', label: '6 Ayda Bir' },
    { value: 'annual', label: 'Yıllık' },
    { value: 'asNeeded', label: 'Gerektiğinde' },
];

const DECISION_PRIORITIES = [
    { value: 'critical', label: 'Kritik', color: '#EF4444' },
    { value: 'high', label: 'Yüksek', color: '#F59E0B' },
    { value: 'medium', label: 'Orta', color: '#3B82F6' },
    { value: 'low', label: 'Düşük', color: '#22C55E' },
];

const DECISION_STATUSES = [
    { value: 'open', label: 'Açık', color: '#F59E0B' },
    { value: 'in_progress', label: 'Devam Ediyor', color: '#3B82F6' },
    { value: 'completed', label: 'Tamamlandı', color: '#22C55E' },
    { value: 'overdue', label: 'Gecikmiş', color: '#EF4444' },
    { value: 'cancelled', label: 'İptal', color: '#6B7280' },
];

class CommitteeService {
    getCommitteeTypes() { return COMMITTEE_TYPES; }
    getMeetingFrequencies() { return MEETING_FREQUENCIES; }
    getDecisionPriorities() { return DECISION_PRIORITIES; }
    getDecisionStatuses() { return DECISION_STATUSES; }
    getTypeInfo(val) { return COMMITTEE_TYPES.find(c => c.value === val) || { label: val, icon: '📋' }; }
    getPriorityInfo(val) { return DECISION_PRIORITIES.find(p => p.value === val) || { label: val, color: '#6B7280' }; }
    getStatusInfo(val) { return DECISION_STATUSES.find(s => s.value === val) || { label: val, color: '#6B7280' }; }

    // ═══ KURULLAR ═══
    async getCommittees() {
        return await db.committees.toArray();
    }

    async getCommitteeById(id) {
        return await db.committees.get(id);
    }

    async addCommittee(committee) {
        return await db.committees.add({
            ...committee,
            status: 'active',
            createdAt: new Date().toISOString()
        });
    }

    async updateCommittee(id, changes) {
        return await db.committees.update(id, changes);
    }

    async deleteCommittee(id) {
        const meetings = await db.committeeMeetings.where('committeeId').equals(id).toArray();
        for (const m of meetings) {
            await db.meetingDecisions.where('meetingId').equals(m.id).delete();
        }
        await db.committeeMeetings.where('committeeId').equals(id).delete();
        return await db.committees.delete(id);
    }

    // ═══ TOPLANTILAR ═══
    async getMeetings() {
        return await db.committeeMeetings.orderBy('date').reverse().toArray();
    }

    async getMeetingsByCommittee(committeeId) {
        return await db.committeeMeetings.where('committeeId').equals(Number(committeeId)).toArray();
    }

    async addMeeting(meeting) {
        return await db.committeeMeetings.add({
            ...meeting,
            status: meeting.status || 'planned',
            createdAt: new Date().toISOString()
        });
    }

    async updateMeeting(id, changes) {
        return await db.committeeMeetings.update(id, changes);
    }

    async deleteMeeting(id) {
        await db.meetingDecisions.where('meetingId').equals(id).delete();
        return await db.committeeMeetings.delete(id);
    }

    // ═══ KARARLAR ═══
    async getDecisions(meetingId) {
        return await db.meetingDecisions.where('meetingId').equals(Number(meetingId)).toArray();
    }

    async getAllDecisions() {
        return await db.meetingDecisions.toArray();
    }

    async getActiveDecisions() {
        const all = await db.meetingDecisions.toArray();
        return all.filter(d => d.status !== 'completed' && d.status !== 'cancelled');
    }

    async addDecision(decision) {
        return await db.meetingDecisions.add({
            ...decision,
            status: 'open',
            createdAt: new Date().toISOString()
        });
    }

    async updateDecision(id, changes) {
        return await db.meetingDecisions.update(id, changes);
    }

    async deleteDecision(id) {
        return await db.meetingDecisions.delete(id);
    }

    // ═══ DÖF BAĞLANTISI — actions tablosuna karar ekleme ═══
    async linkDecisionToAction(decisionId) {
        const decision = await db.meetingDecisions.get(decisionId);
        if (!decision) throw new Error('Karar bulunamadı.');

        // Aksiyon tablosuna DÖF kaydı ekle
        const actionId = await db.actions.add({
            observationId: null,
            sourceType: 'committee_decision',
            sourceId: decisionId,
            description: decision.description,
            responsiblePerson: decision.responsiblePerson,
            dueDate: decision.dueDate,
            status: 'open',
            priority: decision.priority || 'medium',
            createdAt: new Date().toISOString(),
        });

        // Kararı aksiyona bağla
        await db.meetingDecisions.update(decisionId, {
            relatedActionId: actionId,
            status: 'in_progress',
        });

        return actionId;
    }

    async getLinkedAction(actionId) {
        if (!actionId) return null;
        return await db.actions.get(actionId);
    }

    // ═══ ZENGİNLEŞTİRME ═══
    async enrichMeetings(meetings) {
        const committees = await this.getCommittees();
        const allDecisions = await this.getAllDecisions();
        const cMap = Object.fromEntries(committees.map(c => [c.id, c]));

        return meetings.map(m => {
            const meetDecisions = allDecisions.filter(d => d.meetingId === m.id);
            return {
                ...m,
                committeeName: cMap[m.committeeId]?.name || 'Bilinmeyen Kurul',
                committeeType: cMap[m.committeeId]?.type || 'other',
                decisionCount: meetDecisions.length,
                openDecisions: meetDecisions.filter(d => d.status === 'open' || d.status === 'in_progress').length,
            };
        });
    }

    // ═══ İSTATİSTİKLER ═══
    async getStats() {
        const [committees, meetings, decisions] = await Promise.all([
            this.getCommittees(),
            this.getMeetings(),
            this.getAllDecisions(),
        ]);

        const now = new Date();
        const activeDecisions = decisions.filter(d => d.status !== 'completed' && d.status !== 'cancelled');
        const overdueDecisions = activeDecisions.filter(d => d.dueDate && new Date(d.dueDate) < now);
        const completedDecisions = decisions.filter(d => d.status === 'completed');

        // Gecikmiş kararları otomatik olarak overdue yap
        for (const d of overdueDecisions) {
            if (d.status !== 'overdue') {
                await db.meetingDecisions.update(d.id, { status: 'overdue' });
            }
        }

        return {
            committeeCount: committees.filter(c => c.status === 'active').length,
            meetingCount: meetings.length,
            totalDecisions: decisions.length,
            activeDecisions: activeDecisions.length,
            overdueDecisions: overdueDecisions.length,
            completedDecisions: completedDecisions.length,
            completionRate: decisions.length > 0 ? Math.round((completedDecisions.length / decisions.length) * 100) : 0,
        };
    }
}

export const committeeService = new CommitteeService();
