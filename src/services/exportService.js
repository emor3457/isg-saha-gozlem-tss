import db from '../database/db';

// Export entire database as JSON
export async function exportAllData(prefix = 'ISG_Yedek') {
    const data = {
        exportDate: new Date().toISOString(),
        version: '1.1',
        observations: await db.observations.toArray(),
        actions: await db.actions.toArray(),
        hazards: await db.hazards.toArray(),
        reminders: await db.reminders.toArray(),
        settings: await db.settings.toArray(),
        feedback: await db.feedback.toArray(),
        rootCauses: await db.rootCauses.toArray(),
        opportunities: await db.opportunities.toArray(),
        trainings: await db.trainings.toArray(),
        trainingRecords: await db.trainingRecords.toArray(),
        trainingRecords: await db.trainingRecords.toArray(),
        documents: await db.documents.toArray(),
        documentVersions: await db.documentVersions.toArray(),
        emergencyPlans: await db.emergencyPlans.toArray(),
        drills: await db.drills.toArray(),
        complianceEvaluations: await db.complianceEvaluations.toArray(),
        audits: await db.audits.toArray(),
        auditFindings: await db.auditFindings.toArray(),
        incidents: await db.incidents.toArray(),
        observationPhotos: await db.observationPhotos.toArray()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return data;
}

// Import data from JSON backup
export async function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Güvenlik ve Boyut Kontrolü (XSS / Kötü Niyetli Veri engelleme)
                if (file.size > 50 * 1024 * 1024) throw new Error('Dosya boyutu çok büyük, içe aktarma reddedildi.');
                if (!data || typeof data !== 'object') throw new Error('Geçersiz dosya formatı.');
                if (!data.version || !Array.isArray(data.observations)) {
                    throw new Error('Güvenlik İhlali: Bozuk veya zararlı veri yapısı tespit edildi.');
                }

                // Clear existing data
                await db.observations.clear();
                await db.actions.clear();
                await db.hazards.clear();
                await db.reminders.clear();
                await db.rootCauses.clear();
                await db.opportunities.clear();
                await db.trainings.clear();
                await db.trainingRecords.clear();
                await db.documents.clear();
                await db.documentVersions.clear();
                await db.emergencyPlans.clear();
                await db.drills.clear();
                await db.complianceEvaluations.clear();
                await db.audits.clear();
                await db.auditFindings.clear();
                await db.incidents.clear();
                await db.observationPhotos.clear();

                // Import
                if (data.observations?.length) await db.observations.bulkAdd(data.observations);
                if (data.actions?.length) await db.actions.bulkAdd(data.actions);
                if (data.hazards?.length) await db.hazards.bulkAdd(data.hazards);
                if (data.reminders?.length) await db.reminders.bulkAdd(data.reminders);
                if (data.rootCauses?.length) await db.rootCauses.bulkAdd(data.rootCauses);
                if (data.opportunities?.length) await db.opportunities.bulkAdd(data.opportunities);
                if (data.trainings?.length) await db.trainings.bulkAdd(data.trainings);
                if (data.trainingRecords?.length) await db.trainingRecords.bulkAdd(data.trainingRecords);
                if (data.documents?.length) await db.documents.bulkAdd(data.documents);
                if (data.documentVersions?.length) await db.documentVersions.bulkAdd(data.documentVersions);
                if (data.emergencyPlans?.length) await db.emergencyPlans.bulkAdd(data.emergencyPlans);
                if (data.drills?.length) await db.drills.bulkAdd(data.drills);
                if (data.complianceEvaluations?.length) await db.complianceEvaluations.bulkAdd(data.complianceEvaluations);
                if (data.audits?.length) await db.audits.bulkAdd(data.audits);
                if (data.auditFindings?.length) await db.auditFindings.bulkAdd(data.auditFindings);
                if (data.incidents?.length) await db.incidents.bulkAdd(data.incidents);
                if (data.observationPhotos?.length) await db.observationPhotos.bulkAdd(data.observationPhotos);
                if (data.feedback?.length) {
                    await db.feedback.clear();
                    await db.feedback.bulkAdd(data.feedback);
                }
                if (data.settings?.length) {
                    for (const s of data.settings) {
                        await db.settings.put(s);
                    }
                }

                resolve({
                    observations: data.observations?.length || 0,
                    actions: data.actions?.length || 0,
                    hazards: data.hazards?.length || 0,
                    feedback: data.feedback?.length || 0,
                    trainings: data.trainings?.length || 0
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsText(file);
    });
}

// Clear all data
export async function clearAllData() {
    await db.observations.clear();
    await db.actions.clear();
    await db.hazards.clear();
    await db.reminders.clear();
    await db.feedback.clear();
    await db.rootCauses.clear();
    await db.opportunities.clear();
    await db.trainings.clear();
    await db.trainingRecords.clear();
    await db.documents.clear();
    await db.documentVersions.clear();
    await db.emergencyPlans.clear();
    await db.drills.clear();
    await db.complianceEvaluations.clear();
    await db.audits.clear();
    await db.auditFindings.clear();
    await db.incidents.clear();
    await db.observationPhotos.clear();
}

export async function checkAutoBackup() {
    try {
        const autoBackupSetting = await db.settings.get('autoBackupInterval');
        if (!autoBackupSetting || autoBackupSetting.value === 'never') return false;

        const interval = autoBackupSetting.value; // 'daily', 'weekly', 'monthly'
        const lastBackupStr = await db.settings.get('lastAutoBackupDate');

        const now = new Date();
        let shouldBackup = false;

        if (!lastBackupStr) {
            shouldBackup = true;
        } else {
            const lastBackup = new Date(lastBackupStr.value);
            const diffDays = (now - lastBackup) / (1000 * 60 * 60 * 24);

            if (interval === 'daily' && diffDays >= 1) shouldBackup = true;
            if (interval === 'weekly' && diffDays >= 7) shouldBackup = true;
            if (interval === 'monthly' && diffDays >= 30) shouldBackup = true;
        }

        if (shouldBackup) {
            await exportAllData('ISG_Oto_Yedek');
            await db.settings.put({ key: 'lastAutoBackupDate', value: now.toISOString() });
            return true;
        }
        return false;
    } catch (err) {
        console.error('Otomatik yedekleme hatası:', err);
        return false;
    }
}
