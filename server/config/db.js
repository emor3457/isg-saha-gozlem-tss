const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'isg.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ══════════════════════════════════════════════
// TABLO OLUŞTURMA
// ══════════════════════════════════════════════

db.exec(`
    -- Organizasyonlar
    CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT,
        sector TEXT,
        employeeCount INTEGER DEFAULT 0,
        plan TEXT DEFAULT 'basic',
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Kullanıcılar
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        pin TEXT,
        role TEXT NOT NULL DEFAULT 'employee',
        department TEXT,
        title TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        lastLoginAt TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Departmanlar
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        managerId INTEGER REFERENCES users(id),
        parentId INTEGER REFERENCES departments(id),
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Saha Gözlemleri
    CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        date TEXT,
        location TEXT,
        area TEXT,
        category TEXT,
        description TEXT,
        severity INTEGER DEFAULT 2,
        status TEXT DEFAULT 'open',
        assignedTo TEXT,
        photoCount INTEGER DEFAULT 0,
        photos TEXT, -- JSON array
        photoAnalysis TEXT, -- JSON
        createdBy INTEGER REFERENCES users(id),
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Tehlike/Risk
    CREATE TABLE IF NOT EXISTS hazards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        observationId INTEGER,
        type TEXT,
        probability INTEGER DEFAULT 1,
        frequency INTEGER DEFAULT 2,
        severity INTEGER DEFAULT 7,
        riskScore INTEGER DEFAULT 0,
        riskLevel TEXT,
        riskColor TEXT,
        riskLabel TEXT,
        createdBy INTEGER REFERENCES users(id),
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Aksiyonlar
    CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        observationId INTEGER,
        description TEXT,
        responsiblePerson TEXT,
        dueDate TEXT,
        status TEXT DEFAULT 'open',
        completionDate TEXT,
        notes TEXT,
        createdBy INTEGER REFERENCES users(id),
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Olay/Kaza
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        type TEXT DEFAULT 'near_miss',
        date TEXT,
        location TEXT,
        description TEXT,
        involvedPersons TEXT,
        injuryType TEXT,
        damageDescription TEXT,
        rootCause TEXT,
        status TEXT DEFAULT 'new',
        isReported INTEGER DEFAULT 0,
        createdBy INTEGER REFERENCES users(id),
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Eğitimler
    CREATE TABLE IF NOT EXISTS trainings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        title TEXT NOT NULL,
        type TEXT,
        date TEXT,
        endDate TEXT,
        duration INTEGER,
        instructor TEXT,
        location TEXT,
        description TEXT,
        maxParticipants INTEGER,
        status TEXT DEFAULT 'planned',
        createdBy INTEGER REFERENCES users(id),
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Eğitim Katılım Kayıtları
    CREATE TABLE IF NOT EXISTS trainingRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        trainingId INTEGER REFERENCES trainings(id),
        participantName TEXT,
        department TEXT,
        status TEXT DEFAULT 'registered',
        score INTEGER,
        certificateDate TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Sync Log
    CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL,
        userId INTEGER,
        deviceId TEXT,
        tableName TEXT NOT NULL,
        recordLocalId INTEGER,
        recordServerId INTEGER,
        operation TEXT NOT NULL,
        data TEXT, -- JSON
        timestamp TEXT DEFAULT (datetime('now')),
        conflictResolved INTEGER DEFAULT 0
    );

    -- ID Mapping (Local ↔ Server)
    CREATE TABLE IF NOT EXISTS id_map (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL,
        tableName TEXT NOT NULL,
        localId INTEGER NOT NULL,
        serverId INTEGER NOT NULL,
        deviceId TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- ═══ EKSİK OLAN TABLOLAR (Dexie ile eşleme) ═══

    -- Gözlem Fotoğrafları
    CREATE TABLE IF NOT EXISTS observationPhotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL REFERENCES organizations(id),
        observationId INTEGER REFERENCES observations(id),
        photoData TEXT, -- Base64 (Legacy/Fallback)
        photoUrl TEXT,  -- Sunucudaki dosya yolu
        fileName TEXT,
        fileSize INTEGER,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Mevzuat
    CREATE TABLE IF NOT EXISTS regulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT,
        title TEXT,
        category TEXT,
        description TEXT,
        officialDate TEXT,
        url TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Hatırlatıcılar
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        actionId INTEGER,
        reminderDate TEXT,
        type TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- Ekipman
    CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        code TEXT,
        name TEXT,
        type TEXT,
        location TEXT,
        lastCheckDate TEXT,
        status TEXT DEFAULT 'active',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Geri Bildirim
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        type TEXT,
        category TEXT,
        department TEXT,
        description TEXT,
        status TEXT DEFAULT 'new',
        isAnonymous INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Kök Nedenler
    CREATE TABLE IF NOT EXISTS rootCauses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        parentId INTEGER,
        parentType TEXT,
        method TEXT,
        description TEXT,
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- İyileştirme Fırsatları
    CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        type TEXT,
        source TEXT,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Dokümanlar
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        code TEXT,
        title TEXT NOT NULL,
        type TEXT,
        status TEXT DEFAULT 'draft',
        department TEXT,
        accessLevel TEXT DEFAULT 'internal',
        currentVersion INTEGER DEFAULT 1,
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Doküman Versiyonları
    CREATE TABLE IF NOT EXISTS documentVersions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        documentId INTEGER REFERENCES documents(id),
        versionNumber INTEGER,
        uploadedBy TEXT,
        changes TEXT,
        fileData TEXT,
        uploadDate TEXT DEFAULT (datetime('now'))
    );

    -- Acil Durum Planları
    CREATE TABLE IF NOT EXISTS emergencyPlans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        type TEXT,
        location TEXT,
        description TEXT,
        lastReviewDate TEXT,
        nextReviewDate TEXT,
        status TEXT DEFAULT 'active',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Tatbikatlar
    CREATE TABLE IF NOT EXISTS drills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        planId INTEGER REFERENCES emergencyPlans(id),
        date TEXT,
        type TEXT,
        scenario TEXT,
        participantsCount INTEGER DEFAULT 0,
        evaluationScore INTEGER,
        status TEXT DEFAULT 'planned',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Uyum Değerlendirmeleri
    CREATE TABLE IF NOT EXISTS complianceEvaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        regulationCode TEXT,
        articleNumber TEXT,
        status TEXT DEFAULT 'pending',
        evaluatedBy TEXT,
        evaluatedAt TEXT,
        nextEvaluationDate TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- İç Denetimler
    CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        scope TEXT,
        plannedDate TEXT,
        executionDate TEXT,
        auditor TEXT,
        auditoryDepartment TEXT,
        status TEXT DEFAULT 'planned',
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Denetim Bulguları
    CREATE TABLE IF NOT EXISTS auditFindings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        auditId INTEGER REFERENCES audits(id),
        description TEXT,
        requirement TEXT,
        severity TEXT DEFAULT 'minor',
        status TEXT DEFAULT 'open',
        dcfId INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- İş İzinleri
    CREATE TABLE IF NOT EXISTS workPermits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        type TEXT,
        location TEXT,
        applicant TEXT,
        validator TEXT,
        approver TEXT,
        startDate TEXT,
        endDate TEXT,
        status TEXT DEFAULT 'draft',
        isLoto INTEGER DEFAULT 0,
        description TEXT,
        createdBy INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Çalışanlar
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        department TEXT,
        title TEXT,
        sgkNo TEXT,
        hireDate TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- KKD Tipleri
    CREATE TABLE IF NOT EXISTS ppeTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        category TEXT,
        standard TEXT,
        lifespanMonths INTEGER,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- KKD Atamaları
    CREATE TABLE IF NOT EXISTS ppeAssignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        employeeId INTEGER REFERENCES employees(id),
        ppeTypeId INTEGER REFERENCES ppeTypes(id),
        assignmentDate TEXT,
        condition TEXT DEFAULT 'new',
        status TEXT DEFAULT 'active',
        nextReplacementDate TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Taşeronlar
    CREATE TABLE IF NOT EXISTS contractors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        taxNumber TEXT,
        contactPerson TEXT,
        phone TEXT,
        scope TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Taşeron Personeli
    CREATE TABLE IF NOT EXISTS contractorPersonnel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        contractorId INTEGER REFERENCES contractors(id),
        name TEXT NOT NULL,
        role TEXT,
        isgTrainingDate TEXT,
        sgkEntryDate TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Taşeron Belgeleri
    CREATE TABLE IF NOT EXISTS contractorDocuments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        contractorId INTEGER REFERENCES contractors(id),
        type TEXT,
        name TEXT,
        validUntil TEXT,
        status TEXT DEFAULT 'valid',
        createdAt TEXT DEFAULT (datetime('now'))
    );

    -- İSG Kurulları
    CREATE TABLE IF NOT EXISTS committees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        type TEXT,
        frequency TEXT,
        chairman TEXT,
        secretary TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Kurul Toplantıları
    CREATE TABLE IF NOT EXISTS committeeMeetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        committeeId INTEGER REFERENCES committees(id),
        date TEXT,
        location TEXT,
        status TEXT DEFAULT 'planned',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Toplantı Kararları
    CREATE TABLE IF NOT EXISTS meetingDecisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL DEFAULT 1,
        meetingId INTEGER REFERENCES committeeMeetings(id),
        description TEXT,
        responsiblePerson TEXT,
        dueDate TEXT,
        status TEXT DEFAULT 'pending',
        relatedActionId INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- Sistem Denetim Logları (Audit Log)
    CREATE TABLE IF NOT EXISTS system_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgId INTEGER NOT NULL,
        userId INTEGER,
        action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
        tableName TEXT NOT NULL,
        recordId INTEGER,
        oldData TEXT, -- JSON string
        newData TEXT, -- JSON string
        ipAddress TEXT,
        userAgent TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
    );
`);

module.exports = db;
