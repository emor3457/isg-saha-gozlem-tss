import db from '../database/db';

// ── Doküman İşlemleri (ISO 45001 Madde 7.5) ──

export async function createDocument(data, initialFileData) {
    const docData = {
        code: data.code,
        title: data.title,
        type: data.type,
        status: data.status || 'draft',
        department: data.department || '',
        accessLevel: data.accessLevel || 'all',
        currentVersion: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const docId = await db.documents.add(docData);

    // İlk versiyonu ekle
    await addDocumentVersion(docId, {
        versionNumber: '1.0',
        uploadedBy: data.uploadedBy || 'İSG Uzmanı',
        changes: 'İlk Yükleme',
        fileData: initialFileData,
        uploadDate: new Date().toISOString()
    });

    return { ...docData, id: docId };
}

export async function getAllDocuments() {
    return db.documents.orderBy('createdAt').reverse().toArray();
}

export async function getDocumentById(id) {
    return db.documents.get(id);
}

export async function updateDocument(id, updates) {
    await db.documents.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
    return db.documents.get(id);
}

export async function deleteDocument(id) {
    // Tüm versiyonları da sil
    await db.documentVersions.where('documentId').equals(id).delete();
    await db.documents.delete(id);
}

// ── Doküman Versiyon İşlemleri ──

export async function getDocumentVersions(documentId) {
    return db.documentVersions.where('documentId').equals(documentId).reverse().sortBy('uploadDate');
}

export async function addDocumentVersion(documentId, versionData) {
    const newVersion = {
        documentId: documentId,
        versionNumber: versionData.versionNumber,
        uploadedBy: versionData.uploadedBy || 'İSG Uzmanı',
        changes: versionData.changes || 'Güncelleme',
        fileData: versionData.fileData,
        uploadDate: new Date().toISOString()
    };

    await db.documentVersions.add(newVersion);

    // Ana dokümanın güncel versiyonunu ve tarihini güncelle
    await db.documents.update(documentId, {
        currentVersion: versionData.versionNumber,
        updatedAt: new Date().toISOString()
    });

    return newVersion;
}

// ── İstatistikler ──

export async function getDocumentStats() {
    const all = await db.documents.toArray();

    return {
        total: all.length,
        published: all.filter(d => d.status === 'published').length,
        inReview: all.filter(d => d.status === 'in_review').length,
        archived: all.filter(d => d.status === 'archived').length,
        draft: all.filter(d => d.status === 'draft').length
    };
}
