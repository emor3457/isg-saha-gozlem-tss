import db from '../database/db';

// ── Feedback CRUD (ISO 45001 Madde 5.4) ──

export async function createFeedback(data) {
    const feedback = {
        ...data,
        submittedBy: data.isAnonymous ? 'Anonim' : (data.submittedBy || 'Bilinmiyor'),
        status: 'new',
        adminResponse: '',
        resolvedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.feedback.add(feedback);
    return { ...feedback, id };
}

export async function updateFeedback(id, changes) {
    const updates = {
        ...changes,
        updatedAt: new Date().toISOString()
    };
    if (changes.status === 'resolved') {
        updates.resolvedAt = new Date().toISOString();
    }
    await db.feedback.update(id, updates);
    return db.feedback.get(id);
}

export async function deleteFeedback(id) {
    await db.feedback.delete(id);
}

export async function getFeedbackById(id) {
    return db.feedback.get(id);
}

export async function getAllFeedback() {
    return db.feedback.orderBy('createdAt').reverse().toArray();
}

export async function getFeedbackByType(type) {
    return db.feedback.where('type').equals(type).reverse().sortBy('createdAt');
}

export async function getFeedbackByStatus(status) {
    return db.feedback.where('status').equals(status).reverse().sortBy('createdAt');
}

export async function getFeedbackByDepartment(dept) {
    return db.feedback.where('department').equals(dept).toArray();
}

export async function getFeedbackStats() {
    const all = await getAllFeedback();
    const resolved = all.filter(f => f.status === 'resolved').length;
    return {
        total: all.length,
        new: all.filter(f => f.status === 'new').length,
        inProgress: all.filter(f => f.status === 'in_progress').length,
        resolved,
        reviewed: all.filter(f => f.status === 'reviewed').length,
        rejected: all.filter(f => f.status === 'rejected').length,
        byType: {
            suggestion: all.filter(f => f.type === 'suggestion').length,
            complaint: all.filter(f => f.type === 'complaint').length,
            hazard_report: all.filter(f => f.type === 'hazard_report').length,
            improvement: all.filter(f => f.type === 'improvement').length
        },
        resolutionRate: all.length > 0
            ? Math.round((resolved / all.length) * 100)
            : 0
    };
}
