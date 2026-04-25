const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { applyDataScope, requireWrite, requireRole } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generic CRUD Route Factory
 * Belirtilen tablo için standart CRUD endpoint'leri oluşturur
 * 
 * @param {string} tableName — SQLite tablo adı
 * @param {object} options
 *   - requiredFields: string[] — POST'ta zorunlu alanlar
 *   - writeRoles: string[] — Yazma yetkisine sahip roller (varsayılan: tümü)
 *   - orderBy: string — Sıralama (varsayılan: 'createdAt DESC')
 */
function createCrudRouter(tableName, options = {}) {
    const {
        requiredFields = [],
        writeRoles = null,
        orderBy = 'createdAt DESC'
    } = options;

    const router = express.Router();
    router.use(authenticate, applyDataScope);

    // Yazma middleware'i
    const writeMiddleware = writeRoles
        ? requireRole(...writeRoles)
        : requireWrite;

    /** GET / */
    router.get('/', (req, res) => {
        let sql = `SELECT * FROM ${tableName} WHERE orgId = ?`;
        const params = [req.user.orgId];
        if (req.dataScope.department) {
            sql += ' AND (createdBy IN (SELECT id FROM users WHERE department = ? AND orgId = ?))';
            params.push(req.dataScope.department, req.user.orgId);
        }
        sql += ` ORDER BY ${orderBy}`;
        try {
            res.json({ [tableName]: db.prepare(sql).all(...params) });
        } catch (err) {
            // Tablo departman filtresi desteklemiyorsa basit sorgu
            const simple = db.prepare(`SELECT * FROM ${tableName} WHERE orgId = ? ORDER BY ${orderBy}`).all(req.user.orgId);
            res.json({ [tableName]: simple });
        }
    });

    /** GET /:id */
    router.get('/:id', (req, res) => {
        const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND orgId = ?`)
            .get(parseInt(req.params.id), req.user.orgId);
        if (!row) return res.status(404).json({ error: 'Kayıt bulunamadı' });
        res.json({ [tableName.replace(/s$/, '')]: row });
    });

    /** POST / */
    router.post('/', writeMiddleware, (req, res) => {
        // Zorunlu alanları kontrol et
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `${field} alanı zorunludur` });
            }
        }

        const data = { ...req.body, orgId: req.user.orgId, createdBy: req.user.userId };
        delete data.id;

        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => typeof data[c] === 'object' ? JSON.stringify(data[c]) : data[c]);

        try {
            const result = db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
            const created = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
            
            logAudit({
                orgId: req.user.orgId,
                userId: req.user.userId,
                action: 'CREATE',
                tableName,
                recordId: result.lastInsertRowid,
                newData: created,
                req
            });

            res.status(201).json({ [tableName.replace(/s$/, '')]: created });
        } catch (err) {
            console.error(`[CRUD] ${tableName} create error:`, err);
            res.status(500).json({ error: 'Kayıt oluşturma hatası' });
        }
    });

    /** PUT /:id */
    router.put('/:id', writeMiddleware, (req, res) => {
        const id = parseInt(req.params.id);
        const oldRecord = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND orgId = ?`).get(id, req.user.orgId);
        if (!oldRecord) return res.status(404).json({ error: 'Kayıt bulunamadı' });

        const data = { ...req.body };
        delete data.id;
        delete data.orgId;
        delete data.createdBy;

        const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = Object.keys(data).map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);

        try {
            db.prepare(`UPDATE ${tableName} SET ${sets}, updatedAt = datetime('now') WHERE id = ? AND orgId = ?`)
                .run(...values, id, req.user.orgId);
            const updated = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);

            logAudit({
                orgId: req.user.orgId,
                userId: req.user.userId,
                action: 'UPDATE',
                tableName,
                recordId: id,
                oldData: oldRecord,
                newData: updated,
                req
            });

            res.json({ [tableName.replace(/s$/, '')]: updated });
        } catch (err) {
            // updatedAt sütunu yoksa onsuz dene
            try {
                db.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ? AND orgId = ?`)
                    .run(...values, id, req.user.orgId);
                const updated = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
                res.json({ [tableName.replace(/s$/, '')]: updated });
            } catch (err2) {
                console.error(`[CRUD] ${tableName} update error:`, err2);
                res.status(500).json({ error: 'Güncelleme hatası' });
            }
        }
    });

    /** DELETE /:id */
    router.delete('/:id', writeMiddleware, (req, res) => {
        const id = parseInt(req.params.id);
        const oldRecord = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND orgId = ?`).get(id, req.user.orgId);
        if (!oldRecord) return res.status(404).json({ error: 'Kayıt bulunamadı' });

        db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);

        logAudit({
            orgId: req.user.orgId,
            userId: req.user.userId,
            action: 'DELETE',
            tableName,
            recordId: id,
            oldData: oldRecord,
            req
        });

        res.json({ message: 'Kayıt silindi' });
    });

    return router;
}

module.exports = { createCrudRouter };
