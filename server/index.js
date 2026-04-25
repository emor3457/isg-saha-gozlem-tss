require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { Server } = require('socket.io');
const { setupSocketHandlers } = require('./socket/handlers');
const { initScheduler } = require('./services/scheduler');
const { sendReportEmail } = require('./services/mailer');

// Routes
const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/org');
const observationRoutes = require('./routes/observations');
const incidentRoutes = require('./routes/incidents');
const trainingRoutes = require('./routes/trainings');
const actionRoutes = require('./routes/actions');
const syncRoutes = require('./routes/sync');
const photoRoutes = require('./routes/photos');
const { createCrudRouter } = require('./routes/crudFactory');

const app = express();
const server = http.createServer(app);

// ══════ MIDDLEWARE ══════
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: '*', // Geliştirme için — production'da kısıtlanmalı
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 15, // 15 istek
    message: { error: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/', apiLimiter);

// ══════ API ROUTES ══════
app.post('/api/v1/reports/send-email', async (req, res) => {
    const { to, subject, html, pdfBase64, fileName } = req.body;
    
    const attachments = pdfBase64 ? [{
        filename: fileName || 'isg-raporu.pdf',
        content: Buffer.from(pdfBase64, 'base64')
    }] : [];

    const result = await sendReportEmail(to, subject, html, attachments);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// Özel routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/observations', observationRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/trainings', trainingRoutes);
app.use('/api/v1/actions', actionRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/photos', photoRoutes);

// Generic CRUD routes (crudFactory ile otomatik oluşturulan)
app.use('/api/v1/hazards', createCrudRouter('hazards'));
app.use('/api/v1/equipment', createCrudRouter('equipment'));
app.use('/api/v1/feedback', createCrudRouter('feedback', { requiredFields: ['description'] }));
app.use('/api/v1/root-causes', createCrudRouter('rootCauses'));
app.use('/api/v1/opportunities', createCrudRouter('opportunities'));
app.use('/api/v1/documents', createCrudRouter('documents', { requiredFields: ['title'], writeRoles: ['admin', 'isg_expert'] }));
app.use('/api/v1/document-versions', createCrudRouter('documentVersions'));
app.use('/api/v1/emergency-plans', createCrudRouter('emergencyPlans', { requiredFields: ['title'], writeRoles: ['admin', 'isg_expert'] }));
app.use('/api/v1/drills', createCrudRouter('drills'));
app.use('/api/v1/compliance-evaluations', createCrudRouter('complianceEvaluations'));
app.use('/api/v1/audits', createCrudRouter('audits', { requiredFields: ['title'], writeRoles: ['admin', 'isg_expert'] }));
app.use('/api/v1/audit-findings', createCrudRouter('auditFindings'));
app.use('/api/v1/work-permits', createCrudRouter('workPermits', { requiredFields: ['type', 'location'] }));
app.use('/api/v1/employees', createCrudRouter('employees', { requiredFields: ['name'] }));
app.use('/api/v1/ppe-types', createCrudRouter('ppeTypes', { requiredFields: ['name'] }));
app.use('/api/v1/ppe-assignments', createCrudRouter('ppeAssignments'));
app.use('/api/v1/contractors', createCrudRouter('contractors', { requiredFields: ['name'] }));
app.use('/api/v1/contractor-personnel', createCrudRouter('contractorPersonnel', { requiredFields: ['name'] }));
app.use('/api/v1/contractor-documents', createCrudRouter('contractorDocuments'));
app.use('/api/v1/committees', createCrudRouter('committees', { requiredFields: ['name'] }));
app.use('/api/v1/committee-meetings', createCrudRouter('committeeMeetings'));
app.use('/api/v1/meeting-decisions', createCrudRouter('meetingDecisions'));

// ══════ HEALTH CHECK ══════
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ══════ STATIC FILES (Production) ══════
const DIST = path.join(__dirname, '..', 'dist');
const fs = require('fs');
if (fs.existsSync(DIST)) {
    app.use(express.static(DIST));
    // SPA fallback — Express 5 uyumlu
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api/') && req.method === 'GET') {
            res.sendFile(path.join(DIST, 'index.html'));
        } else {
            next();
        }
    });
}

// ══════ SOCKET.IO ══════
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
setupSocketHandlers(io);

// ══════ SERVER START ══════
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    // ... (LAN IP logları burada kalacak)
    
    // Scheduler Başlat
    initScheduler();

    console.log('╔══════════════════════════════════════════════╗');
    // ...
});

module.exports = { app, server, io };
