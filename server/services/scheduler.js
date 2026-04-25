const cron = require('node-cron');
const db = require('../config/db'); // SQLite db referansı
const { sendReportEmail, getReminderTemplate } = require('./mailer');

/**
 * Günlük İSG Hatırlatıcı Servisi
 * Her gün 09:00'da çalışır
 */
function initScheduler() {
    // 0 9 * * * -> Her gün 09:00
    // Test için: */5 * * * * (Her 5 dakikada bir)
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ İSG Hatırlatıcı taraması başlatıldı...');
        
        try {
            const now = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(now.getDate() + 3);

            // Gecikmiş veya vadesi yaklaşan aksiyonları bul
            const actions = db.prepare(`
                SELECT a.*, o.category, o.area 
                FROM actions a
                JOIN observations o ON a.observationId = o.id
                WHERE a.status NOT IN ('completed', 'closed')
                AND a.dueDate IS NOT NULL
                AND a.dueDate <= ?
            `).all(threeDaysLater.toISOString());

            console.log(`🔍 ${actions.length} adet kritik aksiyon saptandı.`);

            for (const action of actions) {
                // Sorumlu maili varsa gönder (Eğer db'de mail tutulmuyorsa, şimdilik placeholder)
                // İdealde employees tablosundan çekilmelidir
                const recipientEmail = action.responsibleEmail || process.env.DEFAULT_RECIPIENT;
                
                if (recipientEmail) {
                    const html = getReminderTemplate(action);
                    await sendReportEmail(
                        recipientEmail,
                        `🚨 İSG Aksiyon Hatırlatması: #${action.id}`,
                        html
                    );
                }
            }
        } catch (error) {
            console.error('❌ Zamanlayıcı hatası:', error);
        }
    });

    console.log('✅ ISG Zamanlayıcı (Cron) başarıyla başlatıldı.');
}

module.exports = { initScheduler };
