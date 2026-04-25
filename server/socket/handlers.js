const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'isg-default-secret';

/**
 * Socket.io event handler'ları
 * Organizasyon bazlı room'lar ile veri izolasyonu sağlar
 */
function setupSocketHandlers(io) {
    // Kimlik doğrulama middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Kimlik doğrulama gerekli'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Geçersiz token'));
        }
    });

    io.on('connection', (socket) => {
        const { userId, orgId, role, department } = socket.user;
        const roomName = `org:${orgId}`;

        console.log(`🔌 Kullanıcı bağlandı: ${userId} (${role}) → Oda: ${roomName}`);

        // Organizasyon odasına katıl
        socket.join(roomName);

        // Diğer kullanıcılara online bilgisi gönder
        socket.to(roomName).emit('user-online', {
            userId,
            role,
            department,
            deviceId: socket.user.deviceId,
            timestamp: new Date().toISOString()
        });

        // ══════ KAYIT DEĞİŞİKLİKLERİ ══════

        /**
         * record-change event'i
         * Bir kayıt oluşturulduğunda/güncellendiğinde/silindiğinde
         * aynı organizasyondaki diğer tüm cihazlara yayınlanır
         */
        socket.on('record-change', (payload) => {
            const { table, operation, data, serverId } = payload;

            // Güvenlik: orgId'yi zorla ata
            const safePayload = { ...payload, orgId };

            switch (operation) {
                case 'create':
                    socket.to(roomName).emit('record-created', {
                        table,
                        serverId: data?.id || serverId,
                        data: safePayload.data,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'update':
                    socket.to(roomName).emit('record-updated', {
                        table,
                        serverId,
                        data: safePayload.data,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'delete':
                    socket.to(roomName).emit('record-deleted', {
                        table,
                        serverId,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    break;
            }
        });

        // ══════ BAĞLANTI KOPMA ══════

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Kullanıcı ayrıldı: ${userId} (${reason})`);
            socket.to(roomName).emit('user-offline', {
                userId,
                deviceId: socket.user.deviceId,
                timestamp: new Date().toISOString()
            });
        });
    });

    return io;
}

module.exports = { setupSocketHandlers };
