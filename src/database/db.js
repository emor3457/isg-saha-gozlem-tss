import Dexie from 'dexie';

const db = new Dexie('ISGSahaGozlemDB');

db.version(1).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key'
});

db.version(2).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt'
}).upgrade(async tx => {
    // Schema v1 -> v2 migration: equipment tablosu eklendi
    // Mevcut kayıtlara varsayılan değer (örn: photoCount) atanması gerekiyorsa burada yapılır
});

db.version(3).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt'
});

db.version(4).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt'
});

db.version(5).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score'
});

db.version(6).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate'
});

db.version(7).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt'
});

db.version(8).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate'
});

db.version(9).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt'
}).upgrade(async tx => {
    // ISO 45001 İç Denetim ve Kaza Modülü eklemeleri
});

db.version(10).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, photoCount, createdAt',
    observationPhotos: '++id, observationId, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt'
}).upgrade(async tx => {
    // Migrate photos from observations to observationPhotos
    const observations = await tx.observations.toArray();
    const photosToInsert = [];

    for (const obs of observations) {
        if (obs.photos && obs.photos.length > 0) {
            for (const photo of obs.photos) {
                photosToInsert.push({
                    observationId: obs.id,
                    data: photo.data,
                    name: photo.name,
                    timestamp: photo.timestamp,
                    size: photo.size,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }

    if (photosToInsert.length > 0) {
        await tx.observationPhotos.bulkAdd(photosToInsert);
    }

    await tx.observations.toCollection().modify(obs => {
        obs.photoCount = obs.photos ? obs.photos.length : 0;
        delete obs.photos;
    });
});

db.version(11).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, photoCount, createdAt',
    observationPhotos: '++id, observationId, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt',
    workPermits: '++id, type, location, applicant, validator, approver, startDate, endDate, status, isLoto, createdAt',
    employees: '++id, name, department, title, sgkNo, hireDate, status',
    ppeTypes: '++id, name, category, standard, lifespanMonths',
    ppeAssignments: '++id, employeeId, ppeTypeId, assignmentDate, condition, status, nextReplacementDate',
    contractors: '++id, name, taxNumber, contactPerson, phone, scope, status',
    contractorPersonnel: '++id, contractorId, name, role, isgTrainingDate, sgkEntryDate, status',
    contractorDocuments: '++id, contractorId, type, name, validUntil, status',
    committees: '++id, name, type, frequency, chairman, secretary',
    committeeMeetings: '++id, committeeId, date, location, status',
    meetingDecisions: '++id, meetingId, description, responsiblePerson, dueDate, status, relatedActionId'
}).upgrade(async tx => {
    // Schema v10 -> v11 migration: Yeni İSG modülleri (İş İzni, KKD, Taşeron, Kurul) eklendi
});

db.version(12).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, photoCount, createdAt',
    observationPhotos: '++id, observationId, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt',
    workPermits: '++id, type, location, applicant, validator, approver, startDate, endDate, status, isLoto, createdAt',
    employees: '++id, name, department, title, sgkNo, hireDate, status',
    ppeTypes: '++id, name, category, standard, lifespanMonths',
    ppeAssignments: '++id, employeeId, ppeTypeId, assignmentDate, condition, status, nextReplacementDate',
    contractors: '++id, name, taxNumber, contactPerson, phone, scope, status',
    contractorPersonnel: '++id, contractorId, name, role, isgTrainingDate, sgkEntryDate, status',
    contractorDocuments: '++id, contractorId, type, name, validUntil, status',
    committees: '++id, name, type, frequency, chairman, secretary',
    committeeMeetings: '++id, committeeId, date, location, status',
    meetingDecisions: '++id, meetingId, description, responsiblePerson, dueDate, status, relatedActionId',
    // Sync tabloları
    syncQueue: '++id, table, localId, operation, timestamp, synced, retryCount',
    idMap: '++id, table, localId, serverId'
}).upgrade(async tx => {
    // Schema v11 -> v12 migration: syncQueue ve idMap tabloları eklendi (full-stack sync)
});

db.version(13).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, photoCount, createdAt',
    observationPhotos: '++id, observationId, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt',
    workPermits: '++id, type, location, applicant, validator, approver, startDate, endDate, status, isLoto, createdAt',
    employees: '++id, name, department, title, sgkNo, hireDate, status',
    ppeTypes: '++id, name, category, standard, lifespanMonths',
    ppeAssignments: '++id, employeeId, ppeTypeId, assignmentDate, condition, status, nextReplacementDate',
    contractors: '++id, name, taxNumber, contactPerson, phone, scope, status',
    contractorPersonnel: '++id, contractorId, name, role, isgTrainingDate, sgkEntryDate, status',
    contractorDocuments: '++id, contractorId, type, name, validUntil, status',
    committees: '++id, name, type, frequency, chairman, secretary',
    committeeMeetings: '++id, committeeId, date, location, status',
    meetingDecisions: '++id, meetingId, description, responsiblePerson, dueDate, status, relatedActionId',
    // Denetim İzleri
    system_audit_logs: '++id, action, tableName, recordId, timestamp',
    // Sync tabloları
    syncQueue: '++id, table, localId, operation, timestamp, synced, retryCount',
    idMap: '++id, table, localId, serverId'
});

db.version(14).stores({
    observations: '++id, date, location, area, category, severity, status, assignedTo, photoCount, createdAt',
    observationPhotos: '++id, observationId, createdAt',
    actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt',
    hazards: '++id, observationId, type, hazardSource, hazardDescription, riskScore, createdAt',
    regulations: '++id, code, title, category',
    reminders: '++id, actionId, reminderDate, type, isRead',
    settings: 'key',
    equipment: '++id, code, name, type, location, lastCheckDate, status, createdAt',
    feedback: '++id, type, category, department, status, isAnonymous, priority, createdAt',
    rootCauses: '++id, parentId, parentType, method, createdAt',
    opportunities: '++id, type, source, priority, status, createdAt',
    trainings: '++id, title, type, date, status, instructor, createdAt',
    trainingRecords: '++id, trainingId, participantName, department, status, score',
    documents: '++id, code, title, type, status, department, accessLevel, currentVersion, createdAt, updatedAt',
    documentVersions: '++id, documentId, versionNumber, uploadedBy, changes, fileData, uploadDate',
    emergencyPlans: '++id, title, type, location, lastReviewDate, nextReviewDate, status, createdAt',
    drills: '++id, planId, date, type, scenario, participantsCount, evaluationScore, status, createdAt',
    complianceEvaluations: '++id, regulationCode, articleNumber, status, evaluatedBy, evaluatedAt, nextEvaluationDate',
    audits: '++id, title, scope, plannedDate, executionDate, auditor, auditoryDepartment, status, createdAt',
    auditFindings: '++id, auditId, description, requirement, severity, status, dcfId',
    incidents: '++id, type, date, location, description, involvedPersons, injuryType, damageDescription, rootCause, status, isReported, createdAt',
    workPermits: '++id, type, location, applicant, validator, approver, startDate, endDate, status, isLoto, createdAt',
    employees: '++id, name, department, title, sgkNo, hireDate, status',
    ppeTypes: '++id, name, category, standard, lifespanMonths',
    ppeAssignments: '++id, employeeId, ppeTypeId, assignmentDate, condition, status, nextReplacementDate',
    contractors: '++id, name, taxNumber, contactPerson, phone, scope, status',
    contractorPersonnel: '++id, contractorId, name, role, isgTrainingDate, sgkEntryDate, status',
    contractorDocuments: '++id, contractorId, type, name, validUntil, status',
    committees: '++id, name, type, frequency, chairman, secretary',
    committeeMeetings: '++id, committeeId, date, location, status',
    meetingDecisions: '++id, meetingId, description, responsiblePerson, dueDate, status, relatedActionId',
    // Denetim İzleri
    system_audit_logs: '++id, action, tableName, recordId, timestamp',
    // Sync tabloları
    syncQueue: '++id, table, localId, operation, timestamp, synced, retryCount',
    idMap: '++id, table, localId, serverId'
});

// Seed regulations on first run
db.on('populate', () => {
    db.settings.bulkAdd([
        { key: 'notificationsEnabled', value: true },
        { key: 'reminderDaysBefore', value: 3 },
        { key: 'reminderFrequency', value: 'daily' },
        { key: 'companyName', value: 'Turkish Technic' },
        { key: 'userName', value: 'İSG Uzmanı' }
    ]);
});

export default db;
