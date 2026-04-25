const nodemailer = require('nodemailer');
require('dotenv').config();

// E-posta taşıyıcı konfigürasyonu
// Not: Gerçek kullanımda .env dosyasından çekilmelidir
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

/**
 * Uygunsuzluk / Aksiyon Raporu Maili Gönder
 */
async function sendReportEmail(to, subject, html, attachments = []) {
    try {
        const info = await transporter.sendMail({
            from: `"Turkish Technic İSG Sistemi" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            attachments // [{ filename: 'rapor.pdf', content: buffer }]
        });
        console.log('✉️ Mail gönderildi: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Mail gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Aksiyon Hatırlatıcı Mail Şablonu
 */
function getReminderTemplate(action) {
    const statusMap = {
        'open': 'Açık / Beklemede',
        'in_progress': 'Devam Ediyor',
        'overdue': 'GECİKMİŞ',
        'planned': 'Planlandı'
    };

    return `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #FF8C00;">İSG Aksiyon Hatırlatması</h2>
            <p>Merhaba, aşağıda sorumluluğunuzda olan ve vadesi yaklaşan/geçen bir İSG aksiyonu bulunmaktadır:</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Açıklama:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${action.description}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Vade Tarihi:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; color: red;">${new Date(action.dueDate).toLocaleDateString('tr-TR')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Durum:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${statusMap[action.status] || action.status}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Bu bir otomatik sistem mesajıdır. Lütfen aksiyonu tamamladığınızda sistem üzerinden durumu güncelleyiniz.
            </p>
        </div>
    `;
}

module.exports = {
    sendReportEmail,
    getReminderTemplate
};
