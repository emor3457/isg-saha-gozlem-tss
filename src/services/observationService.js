import db from '../database/db';
import { addToSyncQueue } from './syncService';

/**
 * Denetim izini yerel veritabanına kaydeder
 */
async function logLocalAudit(action, tableName, recordId, data) {
    try {
        const logEntry = {
            action,
            tableName,
            recordId,
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        };
        const id = await db.system_audit_logs.add(logEntry);
        // Sync Kuyruğuna Ekle
        await addToSyncQueue('system_audit_logs', id, 'create', logEntry);
    } catch (err) {
        console.error('[LocalAudit] Error:', err);
    }
}

// ── Observation CRUD ──

export async function createObservation(data) {
    if (!data.area || !data.category || !data.description) {
        throw new Error('Validasyon Hatası: Zorunlu alanlar (Bölge, Kategori, Açıklama) eksik.');
    }
    if (data.description && data.description.length > 5000) {
        throw new Error('Validasyon Hatası: Girdiğiniz açıklama çok uzun (Maks 5000 karakter).');
    }

    const { photos, ...obsData } = data;
    const observation = {
        ...obsData,
        photoCount: photos ? photos.length : 0,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.observations.add(observation);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('observations', id, 'create', observation);
    await logLocalAudit('CREATE', 'observations', id, observation);

    if (photos && photos.length > 0) {
        const photoRecords = photos.map(p => ({
            ...p,
            observationId: id,
            createdAt: new Date().toISOString()
        }));
        await db.observationPhotos.bulkAdd(photoRecords);
        
        // Fotoğrafları da senkronize et (Binary Asset Optimization tetiklenecek)
        for (const photo of photoRecords) {
            const pId = await db.observationPhotos.where('observationId').equals(id).and(x => x.name === photo.name).first();
            if (pId) {
                await addToSyncQueue('observationPhotos', pId.id, 'create', photo);
            }
        }
    }

    return getObservationById(id);
}

export async function updateObservation(id, changes) {
    const { photos, ...obsChanges } = changes;
    const updatedAt = new Date().toISOString();

    if (photos) {
        await db.observationPhotos.where('observationId').equals(id).delete();
        const photoRecords = photos.map(p => ({
            ...p,
            observationId: id,
            createdAt: new Date().toISOString()
        }));
        await db.observationPhotos.bulkAdd(photoRecords);
        obsChanges.photoCount = photos.length;
        
        // Fotoğraf güncellemelerini sync kuyruğuna ekle (basitlik için toplu sil/ekle mantığı)
        await addToSyncQueue('observationPhotos', id, 'update_all', photoRecords);
    }

    await db.observations.update(id, {
        ...obsChanges,
        updatedAt
    });

    const updated = await getObservationById(id);
    await addToSyncQueue('observations', id, 'update', updated);
    await logLocalAudit('UPDATE', 'observations', id, updated);

    return updated;
}

export async function deleteObservation(id) {
    const existing = await db.observations.get(id);
    
    // Delete related actions, hazards, reminders
    const actions = await db.actions.where('observationId').equals(id).toArray();
    for (const action of actions) {
        await db.reminders.where('actionId').equals(action.id).delete();
    }
    await db.actions.where('observationId').equals(id).delete();
    await db.hazards.where('observationId').equals(id).delete();
    await db.observationPhotos.where('observationId').equals(id).delete();
    await db.observations.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('observations', id, 'delete', { id });
    await logLocalAudit('DELETE', 'observations', id, existing);
}

export async function getObservationById(id) {
    const obs = await db.observations.get(id);
    if (obs) {
        const photos = await db.observationPhotos.where('observationId').equals(id).toArray();
        obs.photos = photos;
    }
    return obs;
}

export async function getAllObservations() {
    return db.observations.orderBy('createdAt').reverse().toArray();
}

export async function getObservationsByStatus(status) {
    return db.observations.where('status').equals(status).reverse().sortBy('createdAt');
}

export async function getObservationsByArea(area) {
    return db.observations.where('area').equals(area).toArray();
}

export async function getObservationsByCategory(category) {
    return db.observations.where('category').equals(category).toArray();
}

export async function getObservationsStats() {
    const now = new Date();
    // Get first day of current month in ISO format
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
        total,
        thisMonth,
        newCount,
        inReviewCount,
        actionTakenCount,
        closedCount,
        sev1, sev2, sev3, sev4
    ] = await Promise.all([
        db.observations.count(),
        db.observations.where('createdAt').aboveOrEqual(firstDayOfMonth).count(),
        db.observations.where('status').equals('new').count(),
        db.observations.where('status').equals('in_review').count(),
        db.observations.where('status').equals('action_taken').count(),
        db.observations.where('status').equals('closed').count(),
        db.observations.where('severity').equals(1).count(),
        db.observations.where('severity').equals(2).count(),
        db.observations.where('severity').equals(3).count(),
        db.observations.where('severity').equals(4).count()
    ]);

    return {
        total,
        thisMonth,
        byStatus: {
            new: newCount,
            in_review: inReviewCount,
            action_taken: actionTakenCount,
            closed: closedCount
        },
        bySeverity: {
            1: sev1,
            2: sev2,
            3: sev3,
            4: sev4
        }
    };
}

// Add photo to observation
export async function addPhotoToObservation(observationId, photoData) {
    const obs = await getObservationById(observationId);
    if (!obs) throw new Error('Gözlem bulunamadı');

    const newPhoto = { ...photoData, observationId, createdAt: new Date().toISOString() };
    await db.observationPhotos.add(newPhoto);

    const currentCount = obs.photoCount || 0;
    await db.observations.update(observationId, { photoCount: currentCount + 1, updatedAt: new Date().toISOString() });

    return getObservationById(observationId).then(x => x.photos);
}

export async function removePhotoFromObservation(observationId, photoIndex) {
    const obs = await getObservationById(observationId);
    if (!obs) throw new Error('Gözlem bulunamadı');

    const photos = obs.photos || [];
    const photoToRemove = photos[photoIndex];

    if (photoToRemove && photoToRemove.id) {
        await db.observationPhotos.delete(photoToRemove.id);
        const currentCount = obs.photoCount || 1;
        await db.observations.update(observationId, { photoCount: currentCount - 1, updatedAt: new Date().toISOString() });
    }

    return getObservationById(observationId).then(x => x.photos);
}
