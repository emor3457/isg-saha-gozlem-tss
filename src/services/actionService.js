import db from '../database/db';
import { addToSyncQueue } from './syncService';

/**
 * Denetim izini yerel veritabanına kaydeder
 */
async function logLocalAudit(action, tableName, recordId, data) {
    try {
        const logEntry = {
            action,
            tableName,
            recordId,
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        };
        const id = await db.system_audit_logs.add(logEntry);
        // Sync Kuyruğuna Ekle
        await addToSyncQueue('system_audit_logs', id, 'create', logEntry);
    } catch (err) {
        console.error('[LocalAudit] Error:', err);
    }
}

export async function createAction(data) {
    const action = {
        ...data,
        status: data.status || 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.actions.add(action);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('actions', id, 'create', action);
    await logLocalAudit('CREATE', 'actions', id, action);

    // Create reminder if dueDate exists
    if (data.dueDate) {
        const reminderDate = new Date(data.dueDate);
        reminderDate.setDate(reminderDate.getDate() - 3); // 3 gün önce hatırlat
        const reminder = {
            actionId: id,
            reminderDate: reminderDate.toISOString(),
            type: 'upcoming',
            isRead: false,
            message: `"${data.description?.substring(0, 50)}..." aksiyon tarihi yaklaşıyor!`
        };
        const rId = await db.reminders.add(reminder);
        await addToSyncQueue('reminders', rId, 'create', reminder);
    }

    return { ...action, id };
}

export async function updateAction(id, changes) {
    const updates = {
        ...changes,
        updatedAt: new Date().toISOString()
    };
    if (changes.status === 'completed') {
        updates.completionDate = new Date().toISOString();
    }
    await db.actions.update(id, updates);
    const updated = await db.actions.get(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('actions', id, 'update', updated);
    await logLocalAudit('UPDATE', 'actions', id, updated);

    return updated;
}

export async function deleteAction(id) {
    const existing = await db.actions.get(id);
    await db.reminders.where('actionId').equals(id).delete();
    await db.actions.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('actions', id, 'delete', { id });
    await logLocalAudit('DELETE', 'actions', id, existing);
}

export async function getActionById(id) {
    return db.actions.get(id);
}

export async function getActionsByObservation(observationId) {
    return db.actions.where('observationId').equals(observationId).toArray();
}

export async function getAllActions() {
    return db.actions.orderBy('createdAt').reverse().toArray();
}

export async function getActionsByStatus(status) {
    return db.actions.where('status').equals(status).toArray();
}

export async function getOverdueActions() {
    const now = new Date().toISOString();
    const openActions = await db.actions
        .where('status')
        .anyOf(['open', 'in_progress'])
        .toArray();
    return openActions.filter(a => a.dueDate && a.dueDate < now);
}

export async function getActionStats() {
    const all = await getAllActions();
    const overdue = await getOverdueActions();
    return {
        total: all.length,
        open: all.filter(a => a.status === 'open').length,
        inProgress: all.filter(a => a.status === 'in_progress').length,
        completed: all.filter(a => a.status === 'completed').length,
        overdue: overdue.length,
        completionRate: all.length > 0
            ? Math.round((all.filter(a => a.status === 'completed').length / all.length) * 100)
            : 0
    };
}

export async function checkAndMarkOverdue() {
    const overdue = await getOverdueActions();
    for (const action of overdue) {
        if (action.status !== 'overdue') {
            await updateAction(action.id, { status: 'overdue' });
            // Create overdue reminder
            await db.reminders.add({
                actionId: action.id,
                reminderDate: new Date().toISOString(),
                type: 'overdue',
                isRead: false,
                message: `⚠️ "${action.description?.substring(0, 50)}..." aksiyonu gecikti!`
            });
        }
    }
    return overdue.length;
}
