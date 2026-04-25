const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole, applyDataScope } = require('../middleware/rbac');

const router = express.Router();

// ══════ ORGANİZASYON ══════

/** GET /api/v1/org — Organizasyon bilgisi */
router.get('/', authenticate, (req, res) => {
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.orgId);
    if (!org) return res.status(404).json({ error: 'Organizasyon bulunamadı' });
    res.json({ organization: org });
});

/** PUT /api/v1/org — Organizasyon güncelle */
router.put('/', authenticate, requireRole('admin'), (req, res) => {
    const { name, domain, sector, employeeCount } = req.body;
    db.prepare('UPDATE organizations SET name = COALESCE(?, name), domain = COALESCE(?, domain), sector = COALESCE(?, sector), employeeCount = COALESCE(?, employeeCount) WHERE id = ?')
        .run(name, domain, sector, employeeCount, req.user.orgId);
    res.json({ message: 'Organizasyon güncellendi' });
});

// ══════ DEPARTMANLAR ══════

/** GET /api/v1/org/departments */
router.get('/departments', authenticate, (req, res) => {
    const departments = db.prepare('SELECT * FROM departments WHERE orgId = ? ORDER BY name').all(req.user.orgId);
    res.json({ departments });
});

/** POST /api/v1/org/departments */
router.post('/departments', authenticate, requireRole('admin'), (req, res) => {
    const { name, managerId, parentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Departman adı zorunludur' });

    const result = db.prepare('INSERT INTO departments (orgId, name, managerId, parentId) VALUES (?, ?, ?, ?)')
        .run(req.user.orgId, name, managerId || null, parentId || null);

    res.status(201).json({ message: 'Departman oluşturuldu', id: result.lastInsertRowid });
});

// ══════ KULLANICILAR ══════

/** GET /api/v1/org/users */
router.get('/users', authenticate, requireRole('admin', 'isg_expert'), (req, res) => {
    const users = db.prepare(
        'SELECT id, orgId, name, email, role, department, title, phone, status, lastLoginAt, createdAt FROM users WHERE orgId = ? ORDER BY name'
    ).all(req.user.orgId);
    res.json({ users });
});

/** POST /api/v1/org/users — Kullanıcı ekle (admin) */
router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { name, email, password, role, department, title, phone, pin } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });

        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        const result = db.prepare(
            'INSERT INTO users (orgId, name, email, passwordHash, pin, role, department, title, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.orgId, name, email, passwordHash, pin || null, role || 'employee', department || null, title || null, phone || null);

        res.status(201).json({
            message: 'Kullanıcı oluşturuldu',
            user: { id: result.lastInsertRowid, name, email, role: role || 'employee', department }
        });
    } catch (err) {
        console.error('User create error:', err);
        res.status(500).json({ error: 'Kullanıcı oluşturma hatası' });
    }
});

/** PUT /api/v1/org/users/:id */
router.put('/users/:id', authenticate, requireRole('admin'), (req, res) => {
    const { role, department, title, phone, status } = req.body;
    const userId = parseInt(req.params.id);

    // Sadece aynı org'daki kullanıcıları güncelle
    const user = db.prepare('SELECT id FROM users WHERE id = ? AND orgId = ?').get(userId, req.user.orgId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    db.prepare('UPDATE users SET role = COALESCE(?, role), department = COALESCE(?, department), title = COALESCE(?, title), phone = COALESCE(?, phone), status = COALESCE(?, status) WHERE id = ?')
        .run(role, department, title, phone, status, userId);

    res.json({ message: 'Kullanıcı güncellendi' });
});

/** DELETE /api/v1/org/users/:id — Soft delete */
router.delete('/users/:id', authenticate, requireRole('admin'), (req, res) => {
    const userId = parseInt(req.params.id);
    if (userId === req.user.userId) {
        return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ? AND orgId = ?').get(userId, req.user.orgId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('inactive', userId);
    res.json({ message: 'Kullanıcı pasifize edildi' });
});

module.exports = router;
