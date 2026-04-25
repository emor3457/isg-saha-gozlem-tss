const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { applyDataScope, requireWrite } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(authenticate, applyDataScope);

/** GET /api/v1/observations */
router.get('/', (req, res) => {
    let sql = 'SELECT * FROM observations WHERE orgId = ?';
    const params = [req.user.orgId];

    if (req.dataScope.department) {
        sql += ' AND (createdBy IN (SELECT id FROM users WHERE department = ? AND orgId = ?))';
        params.push(req.dataScope.department, req.user.orgId);
    }
    if (req.dataScope.createdBy) {
        sql += ' AND createdBy = ?';
        params.push(req.dataScope.createdBy);
    }

    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ observations: rows });
});

/** GET /api/v1/observations/:id */
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM observations WHERE id = ? AND orgId = ?').get(parseInt(req.params.id), req.user.orgId);
    if (!row) return res.status(404).json({ error: 'Gözlem bulunamadı' });
    res.json({ observation: row });
});

/** POST /api/v1/observations */
router.post('/', requireWrite, (req, res) => {
    const { date, location, area, category, description, severity, assignedTo, photos, photoAnalysis } = req.body;
    if (!description) return res.status(400).json({ error: 'Açıklama zorunludur' });

    const result = db.prepare(
        `INSERT INTO observations (orgId, date, location, area, category, description, severity, assignedTo, photoCount, photos, photoAnalysis, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.orgId, date, location, area, category, description, severity || 2, assignedTo,
        photos ? JSON.parse(JSON.stringify(photos)).length : 0,
        photos ? JSON.stringify(photos) : null,
        photoAnalysis ? JSON.stringify(photoAnalysis) : null,
        req.user.userId
    );

    const created = db.prepare('SELECT * FROM observations WHERE id = ?').get(result.lastInsertRowid);
    
    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'CREATE',
        tableName: 'observations',
        recordId: result.lastInsertRowid,
        newData: created,
        req
    });

    res.status(201).json({ observation: created });
});

/** PUT /api/v1/observations/:id */
router.put('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM observations WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Gözlem bulunamadı' });

    const { date, location, area, category, description, severity, status, assignedTo } = req.body;
    db.prepare(
        `UPDATE observations SET date=COALESCE(?,date), location=COALESCE(?,location), area=COALESCE(?,area),
         category=COALESCE(?,category), description=COALESCE(?,description), severity=COALESCE(?,severity),
         status=COALESCE(?,status), assignedTo=COALESCE(?,assignedTo), updatedAt=datetime('now') WHERE id=?`
    ).run(date, location, area, category, description, severity, status, assignedTo, id);

    const updated = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'UPDATE',
        tableName: 'observations',
        recordId: id,
        oldData: existing,
        newData: updated,
        req
    });

    res.json({ observation: updated });
});

/** DELETE /api/v1/observations/:id */
router.delete('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM observations WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Gözlem bulunamadı' });

    db.prepare('DELETE FROM observations WHERE id = ?').run(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'DELETE',
        tableName: 'observations',
        recordId: id,
        oldData: existing,
        req
    });

    res.json({ message: 'Gözlem silindi' });
});

module.exports = router;
