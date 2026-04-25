const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { applyDataScope, requireWrite } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
router.use(authenticate, applyDataScope);

/** GET /api/v1/incidents */
router.get('/', (req, res) => {
    let sql = 'SELECT * FROM incidents WHERE orgId = ?';
    const params = [req.user.orgId];
    if (req.dataScope.department) {
        sql += ' AND (createdBy IN (SELECT id FROM users WHERE department = ? AND orgId = ?))';
        params.push(req.dataScope.department, req.user.orgId);
    }
    sql += ' ORDER BY date DESC, createdAt DESC';
    res.json({ incidents: db.prepare(sql).all(...params) });
});

/** GET /api/v1/incidents/:id */
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM incidents WHERE id = ? AND orgId = ?').get(parseInt(req.params.id), req.user.orgId);
    if (!row) return res.status(404).json({ error: 'Olay bulunamadı' });
    res.json({ incident: row });
});

/** POST /api/v1/incidents */
router.post('/', requireWrite, (req, res) => {
    const { type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, isReported } = req.body;
    if (!description || !location) return res.status(400).json({ error: 'Açıklama ve lokasyon zorunludur' });

    const result = db.prepare(
        `INSERT INTO incidents (orgId, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, isReported, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.orgId, type || 'near_miss', date, location, description, involvedPersons, injuryType, damageDescription, rootCause, isReported ? 1 : 0, req.user.userId);

    const created = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'CREATE',
        tableName: 'incidents',
        recordId: result.lastInsertRowid,
        newData: created,
        req
    });

    res.status(201).json({ incident: created });
});

/** PUT /api/v1/incidents/:id */
router.put('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM incidents WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı' });

    const { type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported } = req.body;
    db.prepare(
        `UPDATE incidents SET type=COALESCE(?,type), date=COALESCE(?,date), location=COALESCE(?,location),
         description=COALESCE(?,description), involvedPersons=COALESCE(?,involvedPersons), injuryType=COALESCE(?,injuryType),
         damageDescription=COALESCE(?,damageDescription), rootCause=COALESCE(?,rootCause), status=COALESCE(?,status),
         isReported=COALESCE(?,isReported), updatedAt=datetime('now') WHERE id=?`
    ).run(type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported !== undefined ? (isReported ? 1 : 0) : null, id);

    const updated = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'UPDATE',
        tableName: 'incidents',
        recordId: id,
        oldData: existing,
        newData: updated,
        req
    });

    res.json({ incident: updated });
});

/** DELETE /api/v1/incidents/:id */
router.delete('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM incidents WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı' });

    db.prepare('DELETE FROM incidents WHERE id = ?').run(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'DELETE',
        tableName: 'incidents',
        recordId: id,
        oldData: existing,
        req
    });

    res.json({ message: 'Olay kaydı silindi' });
});

module.exports = router;
