import db from '../database/db';

// Eğitimi oluşturur
export async function createTraining(data) {
    const training = {
        ...data,
        status: data.status || 'planned',
        createdAt: new Date().toISOString()
    };
    const id = await db.trainings.add(training);
    return { ...training, id };
}

// Tüm eğitimleri listeler (en yeniler üstte)
export async function getAllTrainings() {
    return db.trainings.orderBy('createdAt').reverse().toArray();
}

// Belirli bir eğitimi ID ile getirir
export async function getTrainingById(id) {
    return db.trainings.get(id);
}

// Eğitimi günceller
export async function updateTraining(id, changes) {
    await db.trainings.update(id, changes);
    return db.trainings.get(id);
}

// Eğitimi ve ona bağlı tüm kayıtları siler
export async function deleteTraining(id) {
    await db.transaction('rw', db.trainings, db.trainingRecords, async () => {
        await db.trainingRecords.where({ trainingId: id }).delete();
        await db.trainings.delete(id);
    });
}

// Eğitim istatistiklerini hesaplar
export async function getTrainingStats() {
    const all = await db.trainings.toArray();
    const planned = all.filter(t => t.status === 'planned').length;
    const active = all.filter(t => t.status === 'active').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const totalDuration = all.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

    // Toplam katılımcı sayısı
    const records = await db.trainingRecords.toArray();

    return {
        total: all.length,
        planned,
        active,
        completed,
        totalDuration,
        totalParticipants: records.length,
        completionRate: all.length > 0 ? Math.round((completed / all.length) * 100) : 0
    };
}

// ── Eğitim Kayıtları (Katılımcı Takibi) ──

// Eğitime katılımcı/kayıt ekler
export async function addTrainingRecord(data) {
    const record = {
        ...data,
        status: data.status || 'registered',
        createdAt: new Date().toISOString()
    };
    const id = await db.trainingRecords.add(record);
    return { ...record, id };
}

// Belirli bir eğitime ait tüm katılımcı kayıtlarını getirir
export async function getRecordsByTrainingId(trainingId) {
    return db.trainingRecords.where({ trainingId }).toArray();
}

// Katılımcı kaydını günceller (örn: katıldı, başarısız veya skor girildiğinde)
export async function updateTrainingRecord(id, changes) {
    await db.trainingRecords.update(id, changes);
    return db.trainingRecords.get(id);
}

// Katılımcıyı eğitimden çıkarır
export async function deleteTrainingRecord(id) {
    await db.trainingRecords.delete(id);
}
