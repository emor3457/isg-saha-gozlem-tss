const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, generateToken, generateRefreshToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * İlk admin kaydı veya admin tarafından kullanıcı ekleme
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, orgName, role, department, pin } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur' });
        }

        // E-posta kontrolü
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        let orgId;

        // İlk kayıt: organizasyon da oluştur
        const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get();
        if (orgCount.count === 0) {
            const orgResult = db.prepare(
                'INSERT INTO organizations (name) VALUES (?)'
            ).run(orgName || 'ISG Organizasyonu');
            orgId = orgResult.lastInsertRowid;

            // İlk kullanıcı admin olmalı
            const userResult = db.prepare(
                'INSERT INTO users (orgId, name, email, passwordHash, pin, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run(orgId, name, email, passwordHash, pin || null, 'admin', department || 'ISG');

            const token = generateToken({
                userId: userResult.lastInsertRowid,
                orgId,
                role: 'admin',
                department: department || 'ISG',
                deviceId: uuidv4()
            });
            const refreshToken = generateRefreshToken({ userId: userResult.lastInsertRowid, orgId });

            return res.status(201).json({
                message: 'Organizasyon ve admin hesabı oluşturuldu',
                token,
                refreshToken,
                user: { id: userResult.lastInsertRowid, name, email, role: 'admin', orgId }
            });
        }

        // Sonraki kayıtlar: auth gerekli (admin ekleme)
        // Header'dan token kontrolü
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Kullanıcı eklemek için admin yetkisi gerekli' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'isg-default-secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Sadece admin kullanıcı ekleyebilir' });
        }

        orgId = decoded.orgId;
        const userRole = role || 'employee';
        const userResult = db.prepare(
            'INSERT INTO users (orgId, name, email, passwordHash, pin, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(orgId, name, email, passwordHash, pin || null, userRole, department || null);

        res.status(201).json({
            message: 'Kullanıcı oluşturuldu',
            user: { id: userResult.lastInsertRowid, name, email, role: userRole, department, orgId }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Kayıt hatası' });
    }
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, 'active');
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
        }

        // Son giriş zamanı güncelle
        db.prepare("UPDATE users SET lastLoginAt = datetime('now') WHERE id = ?").run(user.id);

        const deviceId = req.body.deviceId || uuidv4();
        const token = generateToken({
            userId: user.id,
            orgId: user.orgId,
            role: user.role,
            department: user.department,
            deviceId
        });
        const refreshToken = generateRefreshToken({ userId: user.id, orgId: user.orgId });

        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                orgId: user.orgId
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Giriş hatası' });
    }
});

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token gerekli' });

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'isg-default-secret');

        const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active');
        if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

        const token = generateToken({
            userId: user.id,
            orgId: user.orgId,
            role: user.role,
            department: user.department,
            deviceId: uuidv4()
        });

        res.json({ token });
    } catch (err) {
        res.status(401).json({ error: 'Geçersiz refresh token' });
    }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticate, (req, res) => {
    const user = db.prepare('SELECT id, orgId, name, email, role, department, title, phone, status, createdAt FROM users WHERE id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ user });
});

/**
 * PUT /api/v1/auth/password
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut ve yeni şifre zorunludur' });
        }

        const user = db.prepare('SELECT passwordHash FROM users WHERE id = ?').get(req.user.userId);
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Mevcut şifre yanlış' });

        const hash = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, req.user.userId);

        res.json({ message: 'Şifre güncellendi' });
    } catch (err) {
        res.status(500).json({ error: 'Şifre güncelleme hatası' });
    }
});

module.exports = router;
