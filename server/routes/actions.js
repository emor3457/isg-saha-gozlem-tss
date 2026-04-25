const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { applyDataScope, requireWrite } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
router.use(authenticate, applyDataScope);

/** GET /api/v1/actions */
router.get('/', (req, res) => {
    let sql = 'SELECT * FROM actions WHERE orgId = ?';
    const params = [req.user.orgId];
    if (req.dataScope.createdBy) {
        sql += ' AND (createdBy = ? OR responsiblePerson IN (SELECT name FROM users WHERE id = ?))';
        params.push(req.dataScope.createdBy, req.dataScope.createdBy);
    }
    sql += ' ORDER BY dueDate ASC, createdAt DESC';
    res.json({ actions: db.prepare(sql).all(...params) });
});

/** GET /api/v1/actions/:id */
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM actions WHERE id = ? AND orgId = ?').get(parseInt(req.params.id), req.user.orgId);
    if (!row) return res.status(404).json({ error: 'Aksiyon bulunamadı' });
    res.json({ action: row });
});

/** POST /api/v1/actions */
router.post('/', requireWrite, (req, res) => {
    const { observationId, description, responsiblePerson, dueDate, notes } = req.body;
    if (!description) return res.status(400).json({ error: 'Açıklama zorunludur' });

    const result = db.prepare(
        'INSERT INTO actions (orgId, observationId, description, responsiblePerson, dueDate, notes, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.orgId, observationId || null, description, responsiblePerson, dueDate, notes, req.user.userId);

    const created = db.prepare('SELECT * FROM actions WHERE id = ?').get(result.lastInsertRowid);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'CREATE',
        tableName: 'actions',
        recordId: result.lastInsertRowid,
        newData: created,
        req
    });

    res.status(201).json({ action: created });
});

/** PUT /api/v1/actions/:id */
router.put('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM actions WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Aksiyon bulunamadı' });

    const { description, responsiblePerson, dueDate, status, completionDate, notes } = req.body;
    db.prepare(
        `UPDATE actions SET description=COALESCE(?,description), responsiblePerson=COALESCE(?,responsiblePerson),
         dueDate=COALESCE(?,dueDate), status=COALESCE(?,status), completionDate=COALESCE(?,completionDate),
         notes=COALESCE(?,notes), updatedAt=datetime('now') WHERE id=?`
    ).run(description, responsiblePerson, dueDate, status, completionDate, notes, id);

    const updated = db.prepare('SELECT * FROM actions WHERE id = ?').get(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'UPDATE',
        tableName: 'actions',
        recordId: id,
        oldData: existing,
        newData: updated,
        req
    });

    res.json({ action: updated });
});

/** DELETE /api/v1/actions/:id */
router.delete('/:id', requireWrite, (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM actions WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Aksiyon bulunamadı' });

    db.prepare('DELETE FROM actions WHERE id = ?').run(id);

    logAudit({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'DELETE',
        tableName: 'actions',
        recordId: id,
        oldData: existing,
        req
    });

    res.json({ message: 'Aksiyon silindi' });
});

module.exports = router;
