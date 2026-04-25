const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'isg-default-secret';

/**
 * JWT doğrulama middleware
 * Authorization: Bearer <token> header'ından token alır
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, orgId, role, department, deviceId }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token süresi dolmuş', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Geçersiz token' });
    }
}

/**
 * Token oluşturma yardımcısı
 */
function generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Refresh token oluşturma (7 gün)
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, generateToken, generateRefreshToken, JWT_SECRET };
