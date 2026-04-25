const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
router.use(authenticate);

// Desteklenen sync tabloları (tüm ISG modülleri)
const SYNCABLE_TABLES = [
    'observations', 'hazards', 'actions', 'incidents', 'trainings', 'trainingRecords',
    'equipment', 'feedback', 'rootCauses', 'opportunities',
    'documents', 'documentVersions', 'emergencyPlans', 'drills',
    'complianceEvaluations', 'audits', 'auditFindings',
    'workPermits', 'employees', 'ppeTypes', 'ppeAssignments',
    'contractors', 'contractorPersonnel', 'contractorDocuments',
    'committees', 'committeeMeetings', 'meetingDecisions'
];

/**
 * POST /api/v1/sync/push
 * İstemciden sunucuya toplu değişiklik gönderme
 */
router.post('/push', (req, res) => {
    const { deviceId, changes } = req.body;
    if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({ error: 'changes dizisi zorunludur' });
    }

    const results = [];
    const conflicts = [];

    const pushTransaction = db.transaction(() => {
        for (const change of changes) {
            const { table, localId, serverId, operation, data, timestamp } = change;

            if (!SYNCABLE_TABLES.includes(table)) {
                results.push({ localId, error: 'Desteklenmeyen tablo: ' + table });
                continue;
            }

            try {
                if (operation === 'create') {
                    // orgId'yi zorla ata (güvenlik)
                    const cleanData = { ...data, orgId: req.user.orgId, createdBy: req.user.userId };
                    delete cleanData.id; // local id'yi kaldır

                    const columns = Object.keys(cleanData);
                    const placeholders = columns.map(() => '?').join(', ');
                    const values = columns.map(c => typeof cleanData[c] === 'object' ? JSON.stringify(cleanData[c]) : cleanData[c]);

                    const result = db.prepare(
                        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
                    ).run(...values);

                    // ID mapping kaydet
                    db.prepare('INSERT INTO id_map (orgId, tableName, localId, serverId, deviceId) VALUES (?, ?, ?, ?, ?)')
                        .run(req.user.orgId, table, localId, result.lastInsertRowid, deviceId);

                    // Sync log
                    db.prepare('INSERT INTO sync_log (orgId, userId, deviceId, tableName, recordLocalId, recordServerId, operation, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                        .run(req.user.orgId, req.user.userId, deviceId, table, localId, result.lastInsertRowid, 'create', JSON.stringify(data));

                    logAudit({
                        orgId: req.user.orgId,
                        userId: req.user.userId,
                        action: 'CREATE',
                        tableName: table,
                        recordId: result.lastInsertRowid,
                        newData: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid),
                        req
                    });

                    results.push({ localId, serverId: result.lastInsertRowid, status: 'created' });

                } else if (operation === 'update' && serverId) {
                    // Akıllı Çakışma Kontrolü (Smart Merge)
                    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND orgId = ?`).get(serverId, req.user.orgId);
                    if (!existing) {
                        results.push({ localId, serverId, error: 'Kayıt bulunamadı' });
                        continue;
                    }

                    let fieldsToUpdate = { ...data };
                    delete fieldsToUpdate.id;
                    delete fieldsToUpdate.orgId;
                    delete fieldsToUpdate.createdBy;
                    delete fieldsToUpdate.createdAt;
                    delete fieldsToUpdate.updatedAt;

                    // Çakışma kontrolü (Timestamp bazlı)
                    if (existing.updatedAt && timestamp && new Date(existing.updatedAt) > new Date(timestamp)) {
                        console.log(`[Sync] Çakışma algılandı: ${table} #${serverId}. Akıllı birleştirme deneniyor...`);
                        
                        // Bu cihazın bu kayıt için sunucuya gönderdiği son başarılı halini (base) bulalım
                        const lastSync = db.prepare(`
                            SELECT data FROM sync_log 
                            WHERE orgId = ? AND tableName = ? AND recordServerId = ? AND deviceId = ? 
                            ORDER BY timestamp DESC LIMIT 1
                        `).get(req.user.orgId, table, serverId, deviceId);

                        const baseData = lastSync ? JSON.parse(lastSync.data) : null;
                        
                        if (baseData) {
                            const mergedData = {};
                            let hasTrueConflict = false;

                            for (const key of Object.keys(fieldsToUpdate)) {
                                const clientVal = JSON.stringify(fieldsToUpdate[key]);
                                const serverVal = JSON.stringify(existing[key]);
                                const baseVal = JSON.stringify(baseData[key]);

                                const isClientChanged = clientVal !== baseVal;
                                const isServerChanged = serverVal !== baseVal;

                                if (isClientChanged && isServerChanged) {
                                    // İki taraf da değiştirmiş
                                    if (clientVal !== serverVal) {
                                        hasTrueConflict = true;
                                        break;
                                    }
                                } else if (isClientChanged) {
                                    // Sadece istemci değiştirmiş -> Birleştir
                                    mergedData[key] = fieldsToUpdate[key];
                                }
                                // Diğer durumlarda sunucudaki güncel veri korunur
                            }

                            if (hasTrueConflict) {
                                conflicts.push({
                                    table, localId, serverId,
                                    serverVersion: existing,
                                    message: 'Aynı alan üzerinde farklı değişiklikler yapılmış'
                                });
                                continue;
                            }

                            fieldsToUpdate = mergedData;
                            if (Object.keys(fieldsToUpdate).length === 0) {
                                results.push({ localId, serverId, status: 'synced_already' });
                                continue;
                            }
                        } else {
                            // Base yoksa manuel seçim iste
                            conflicts.push({
                                table, localId, serverId,
                                serverVersion: existing,
                                message: 'Senkronizasyon geçmişi eksik, manuel seçim gerekli'
                            });
                            continue;
                        }
                    }

                    const sets = Object.keys(fieldsToUpdate).map(k => `${k} = ?`).join(', ');
                    const values = Object.keys(fieldsToUpdate).map(k => typeof fieldsToUpdate[k] === 'object' ? JSON.stringify(fieldsToUpdate[k]) : fieldsToUpdate[k]);

                    db.prepare(`UPDATE ${table} SET ${sets}, updatedAt = datetime('now') WHERE id = ? AND orgId = ?`)
                        .run(...values, serverId, req.user.orgId);

                    const finalRecord = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(serverId);
                    db.prepare('INSERT INTO sync_log (orgId, userId, deviceId, tableName, recordLocalId, recordServerId, operation, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                        .run(req.user.orgId, req.user.userId, deviceId, table, localId, serverId, 'update', JSON.stringify(finalRecord));

                    logAudit({
                        orgId: req.user.orgId,
                        userId: req.user.userId,
                        action: 'UPDATE',
                        tableName: table,
                        recordId: serverId,
                        oldData: existing,
                        newData: finalRecord,
                        req
                    });

                    results.push({ localId, serverId, status: 'merged' });

                } else if (operation === 'delete' && serverId) {
                    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND orgId = ?`).get(serverId, req.user.orgId);
                    
                    db.prepare(`DELETE FROM ${table} WHERE id = ? AND orgId = ?`).run(serverId, req.user.orgId);

                    db.prepare('INSERT INTO sync_log (orgId, userId, deviceId, tableName, recordServerId, operation) VALUES (?, ?, ?, ?, ?, ?)')
                        .run(req.user.orgId, req.user.userId, deviceId, table, serverId, 'delete');

                    if (existing) {
                        logAudit({
                            orgId: req.user.orgId,
                            userId: req.user.userId,
                            action: 'DELETE',
                            tableName: table,
                            recordId: serverId,
                            oldData: existing,
                            req
                        });
                    }

                    results.push({ localId, serverId, status: 'deleted' });
                }
            } catch (err) {
                console.error(`Sync push error for ${table}:`, err);
                results.push({ localId, error: err.message });
            }
        }
    });

    pushTransaction();

    res.json({
        results,
        conflicts,
        serverTimestamp: new Date().toISOString()
    });
});

/**
 * GET /api/v1/sync/pull?since=<timestamp>
 * Son sync'ten bu yana olan değişiklikleri çek
 */
router.get('/pull', (req, res) => {
    const since = req.query.since || '1970-01-01T00:00:00.000Z';
    const deviceId = req.query.deviceId;

    const changes = [];

    for (const table of SYNCABLE_TABLES) {
        try {
            let sql = `SELECT * FROM ${table} WHERE orgId = ? AND updatedAt > ?`;
            const params = [req.user.orgId, since];

            const rows = db.prepare(sql).all(...params);
            for (const row of rows) {
                changes.push({
                    table,
                    serverId: row.id,
                    operation: 'upsert',
                    data: row,
                    timestamp: row.updatedAt || row.createdAt
                });
            }
        } catch (err) {
            console.error(`Pull error for ${table}:`, err);
        }
    }

    // Silinen kayıtları da kontrol et
    if (deviceId) {
        const deletions = db.prepare(
            `SELECT tableName, recordServerId FROM sync_log WHERE orgId = ? AND operation = 'delete' AND timestamp > ? AND deviceId != ?`
        ).all(req.user.orgId, since, deviceId);

        for (const del of deletions) {
            changes.push({
                table: del.tableName,
                serverId: del.recordServerId,
                operation: 'delete',
                timestamp: del.timestamp
            });
        }
    }

    res.json({
        changes,
        serverTimestamp: new Date().toISOString()
    });
});

/**
 * GET /api/v1/sync/status
 */
router.get('/status', (req, res) => {
    const counts = {};
    for (const table of SYNCABLE_TABLES) {
        try {
            counts[table] = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE orgId = ?`).get(req.user.orgId).count;
        } catch { counts[table] = 0; }
    }

    res.json({
        status: 'online',
        serverTimestamp: new Date().toISOString(),
        tables: counts
    });
});

module.exports = router;
