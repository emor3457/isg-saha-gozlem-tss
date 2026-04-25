const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// ══════ MULTER CONFIG ══════
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir.'));
        }
    }
});

/**
 * POST /api/v1/photos/upload
 * Tekli fotoğraf yükleme
 */
router.post('/upload', authenticate, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    }

    // Dosya URL'ini oluştur (PWA offline iken localhost üzerinden erişim sağlayacak)
    // Production'da tam URL veya relative path tutulabilir
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
        message: 'Fotoğraf başarıyla yüklendi.',
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

/**
 * POST /api/v1/photos/bulk-upload
 * Çoklu fotoğraf yükleme (Senkronizasyon için)
 */
router.post('/bulk-upload', authenticate, upload.array('photos', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Dosyalar yüklenemedi.' });
    }

    const results = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size
    }));

    res.json({
        message: `${results.length} fotoğraf başarıyla yüklendi.`,
        photos: results
    });
});

module.exports = router;
