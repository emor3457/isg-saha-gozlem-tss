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

export async function createIncident(data) {
    const incident = {
        type: data.type,
        date: data.date,
        location: data.location,
        description: data.description,
        involvedPersons: data.involvedPersons || '',
        injuryType: data.injuryType || '',
        damageDescription: data.damageDescription || '',
        rootCause: data.rootCause || '',
        status: data.status || 'new',
        isReported: !!data.isReported,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.incidents.add(incident);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('incidents', id, 'create', incident);
    await logLocalAudit('CREATE', 'incidents', id, incident);

    return { ...incident, id };
}

export async function getAllIncidents() {
    return db.incidents.orderBy('createdAt').reverse().toArray();
}

export async function updateIncident(id, updates) {
    const updatedAt = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt };
    
    await db.incidents.update(id, cleanUpdates);
    const updated = await db.incidents.get(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('incidents', id, 'update', updated);
    await logLocalAudit('UPDATE', 'incidents', id, updated);

    return updated;
}

export async function deleteIncident(id) {
    const existing = await db.incidents.get(id);
    await db.incidents.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('incidents', id, 'delete', { id });
    await logLocalAudit('DELETE', 'incidents', id, existing);
}
