const db = require('../config/db');

/**
 * Veri değişimlerini system_audit_logs tablosuna kaydeder.
 * 
 * @param {Object} params
 * @param {number} params.orgId - Organizasyon ID
 * @param {number} params.userId - İşlemi yapan kullanıcı ID
 * @param {string} params.action - CREATE, UPDATE, DELETE
 * @param {string} params.tableName - Etkilenen tablo adı
 * @param {number} params.recordId - Kayıt ID
 * @param {Object} [params.oldData] - Değişim öncesi veri
 * @param {Object} [params.newData] - Değişim sonrası veri
 * @param {Object} [params.req] - Express request nesnesi (IP ve User-Agent için)
 */
function logAudit({ orgId, userId, action, tableName, recordId, oldData, newData, req }) {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        const stmt = db.prepare(`
            INSERT INTO system_audit_logs 
            (orgId, userId, action, tableName, recordId, oldData, newData, ipAddress, userAgent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            orgId,
            userId,
            action,
            tableName,
            recordId,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            ipAddress,
            userAgent
        );
    } catch (err) {
        console.error('[AuditLogger] Loglama hatası:', err);
    }
}

module.exports = { logAudit };
