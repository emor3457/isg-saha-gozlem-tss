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

export async function createAudit(data) {
    const audit = {
        title: data.title,
        scope: data.scope,
        plannedDate: data.plannedDate,
        executionDate: data.executionDate || null,
        auditor: data.auditor,
        auditoryDepartment: data.auditoryDepartment,
        status: data.status || 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.audits.add(audit);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('audits', id, 'create', audit);
    await logLocalAudit('CREATE', 'audits', id, audit);

    return { ...audit, id };
}

export async function updateAudit(id, updates) {
    const updatedAt = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt };
    
    await db.audits.update(id, cleanUpdates);
    const updated = await db.audits.get(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('audits', id, 'update', updated);
    await logLocalAudit('UPDATE', 'audits', id, updated);

    return updated;
}

export async function deleteAudit(id) {
    const existing = await db.audits.get(id);
    await db.auditFindings.where('auditId').equals(id).delete();
    await db.audits.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('audits', id, 'delete', { id });
    await logLocalAudit('DELETE', 'audits', id, existing);
}

// ── Findings ──

export async function createAuditFinding(data) {
    const finding = {
        auditId: data.auditId,
        description: data.description,
        requirement: data.requirement, // Örn: ISO 45001 8.1.2 veya Form/Prosedür adı
        severity: data.severity, // major, minor, observation
        status: data.status || 'open',
        dcfId: data.dcfId || null, // DÖF/Aksiyon kaydı ID'si
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.auditFindings.add(finding);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('auditFindings', id, 'create', finding);
    await logLocalAudit('CREATE', 'auditFindings', id, finding);

    return { ...finding, id };
}

export async function updateAuditFinding(id, updates) {
    const updatedAt = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt };

    await db.auditFindings.update(id, cleanUpdates);
    const updated = await db.auditFindings.get(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('auditFindings', id, 'update', updated);
    await logLocalAudit('UPDATE', 'auditFindings', id, updated);

    return updated;
}

export async function deleteAuditFinding(id) {
    const existing = await db.auditFindings.get(id);
    await db.auditFindings.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('auditFindings', id, 'delete', { id });
    await logLocalAudit('DELETE', 'auditFindings', id, existing);
}
