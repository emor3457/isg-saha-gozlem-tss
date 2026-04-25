const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { applyDataScope, requireWrite, requireRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate, applyDataScope);

/** GET /api/v1/trainings */
router.get('/', (req, res) => {
    let sql = 'SELECT * FROM trainings WHERE orgId = ?';
    const params = [req.user.orgId];
    sql += ' ORDER BY date DESC';
    res.json({ trainings: db.prepare(sql).all(...params) });
});

/** GET /api/v1/trainings/:id */
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM trainings WHERE id = ? AND orgId = ?').get(parseInt(req.params.id), req.user.orgId);
    if (!row) return res.status(404).json({ error: 'Eğitim bulunamadı' });

    // Katılım kayıtlarını da getir
    const records = db.prepare('SELECT * FROM trainingRecords WHERE trainingId = ? AND orgId = ?').all(row.id, req.user.orgId);
    res.json({ training: row, records });
});

/** POST /api/v1/trainings */
router.post('/', requireRole('admin', 'isg_expert'), (req, res) => {
    const { title, type, date, endDate, duration, instructor, location, description, maxParticipants, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Eğitim başlığı zorunludur' });

    const result = db.prepare(
        `INSERT INTO trainings (orgId, title, type, date, endDate, duration, instructor, location, description, maxParticipants, status, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.orgId, title, type, date, endDate, duration, instructor, location, description, maxParticipants, status || 'planned', req.user.userId);

    res.status(201).json({ training: db.prepare('SELECT * FROM trainings WHERE id = ?').get(result.lastInsertRowid) });
});

/** PUT /api/v1/trainings/:id */
router.put('/:id', requireRole('admin', 'isg_expert'), (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT id FROM trainings WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Eğitim bulunamadı' });

    const { title, type, date, endDate, duration, instructor, location, description, maxParticipants, status } = req.body;
    db.prepare(
        `UPDATE trainings SET title=COALESCE(?,title), type=COALESCE(?,type), date=COALESCE(?,date),
         endDate=COALESCE(?,endDate), duration=COALESCE(?,duration), instructor=COALESCE(?,instructor),
         location=COALESCE(?,location), description=COALESCE(?,description), maxParticipants=COALESCE(?,maxParticipants),
         status=COALESCE(?,status), updatedAt=datetime('now') WHERE id=?`
    ).run(title, type, date, endDate, duration, instructor, location, description, maxParticipants, status, id);

    res.json({ training: db.prepare('SELECT * FROM trainings WHERE id = ?').get(id) });
});

/** DELETE /api/v1/trainings/:id */
router.delete('/:id', requireRole('admin', 'isg_expert'), (req, res) => {
    const id = parseInt(req.params.id);
    const existing = db.prepare('SELECT id FROM trainings WHERE id = ? AND orgId = ?').get(id, req.user.orgId);
    if (!existing) return res.status(404).json({ error: 'Eğitim bulunamadı' });
    db.prepare('DELETE FROM trainingRecords WHERE trainingId = ? AND orgId = ?').run(id, req.user.orgId);
    db.prepare('DELETE FROM trainings WHERE id = ?').run(id);
    res.json({ message: 'Eğitim ve katılım kayıtları silindi' });
});

// ══════ EĞİTİM KATILIM KAYITLARI ══════

/** POST /api/v1/trainings/:id/records */
router.post('/:id/records', requireRole('admin', 'isg_expert'), (req, res) => {
    const trainingId = parseInt(req.params.id);
    const { participantName, department, status, score } = req.body;
    if (!participantName) return res.status(400).json({ error: 'Katılımcı adı zorunludur' });

    const result = db.prepare(
        'INSERT INTO trainingRecords (orgId, trainingId, participantName, department, status, score) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.orgId, trainingId, participantName, department, status || 'registered', score);

    res.status(201).json({ record: db.prepare('SELECT * FROM trainingRecords WHERE id = ?').get(result.lastInsertRowid) });
});

/** PUT /api/v1/trainings/:tid/records/:rid */
router.put('/:tid/records/:rid', requireRole('admin', 'isg_expert'), (req, res) => {
    const rid = parseInt(req.params.rid);
    const { status, score, certificateDate } = req.body;

    db.prepare('UPDATE trainingRecords SET status=COALESCE(?,status), score=COALESCE(?,score), certificateDate=COALESCE(?,certificateDate), updatedAt=datetime("now") WHERE id=? AND orgId=?')
        .run(status, score, certificateDate, rid, req.user.orgId);

    res.json({ record: db.prepare('SELECT * FROM trainingRecords WHERE id = ?').get(rid) });
});

module.exports = router;
