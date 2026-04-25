import { io } from 'socket.io-client';
import db from '../database/db';

// ══════════════════════════════════════════════
// YAPILANDIRMA
// ══════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API = `${API_BASE}/api/v1`;

let socket = null;
let syncInterval = null;

// ══════════════════════════════════════════════
// TOKEN YÖNETİMİ
// ══════════════════════════════════════════════

function getToken() {
    return localStorage.getItem('isg_token');
}

function setToken(token) {
    localStorage.setItem('isg_token', token);
}

function getRefreshToken() {
    return localStorage.getItem('isg_refresh_token');
}

function setRefreshToken(token) {
    localStorage.setItem('isg_refresh_token', token);
}

function clearTokens() {
    localStorage.removeItem('isg_token');
    localStorage.removeItem('isg_refresh_token');
    localStorage.removeItem('isg_user');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('isg_user'));
    } catch { return null; }
}

function setUser(user) {
    localStorage.setItem('isg_user', JSON.stringify(user));
}

// ══════════════════════════════════════════════
// API İSTEK YARDIMCISI
// ══════════════════════════════════════════════

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const res = await fetch(`${API}${endpoint}`, {
            ...options,
            headers
        });

        // Token süresi dolduysa yenile
        if (res.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${getToken()}`;
                const retryRes = await fetch(`${API}${endpoint}`, { ...options, headers });
                return retryRes.json();
            }
            throw new Error('SESSION_EXPIRED');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        return res.json();
    } catch (err) {
        if (err.message === 'Failed to fetch' || err.message === 'NetworkError') {
            // Offline — sessizce başarısız ol
            console.warn('[SyncService] Offline — istek atlanamadı:', endpoint);
            return null;
        }
        throw err;
    }
}

async function refreshAccessToken() {
    const rt = getRefreshToken();
    if (!rt) return false;

    try {
        const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt })
        });
        if (!res.ok) return false;
        const data = await res.json();
        setToken(data.token);
        return true;
    } catch {
        return false;
    }
}

// ══════════════════════════════════════════════
// AUTH İŞLEMLERİ
// ══════════════════════════════════════════════

export async function serverLogin(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (data?.token) {
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        connectSocket();
        startPeriodicSync();
        return data.user;
    }
    throw new Error(data?.error || 'Giriş başarısız');
}

export async function serverRegister({ name, email, password, orgName, pin }) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, orgName, pin })
    });
    if (data?.token) {
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        connectSocket();
        startPeriodicSync();
        return data.user;
    }
    throw new Error(data?.error || 'Kayıt başarısız');
}

export function serverLogout() {
    clearTokens();
    disconnectSocket();
    stopPeriodicSync();
}

export function getCurrentUser() {
    return getUser();
}

export function isAuthenticated() {
    return !!getToken();
}

// ══════════════════════════════════════════════
// SOCKET.IO BAĞLANTISI
// ══════════════════════════════════════════════

function connectSocket() {
    if (socket?.connected) return;

    const token = getToken();
    if (!token) return;

    socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('🔌 Socket.io bağlandı');
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io koptu:', reason);
    });

    // Diğer cihazlardan gelen değişiklikleri Dexie'ye yaz
    socket.on('record-created', async (payload) => {
        await handleRemoteChange('create', payload);
    });

    socket.on('record-updated', async (payload) => {
        await handleRemoteChange('update', payload);
    });

    socket.on('record-deleted', async (payload) => {
        await handleRemoteChange('delete', payload);
    });

    socket.on('sync-required', () => {
        console.log('🔄 Tam senkronizasyon gerekli');
        fullSync();
    });

    socket.on('user-online', (payload) => {
        console.log(`👤 Kullanıcı çevrimiçi: ${payload.userId}`);
        window.dispatchEvent(new CustomEvent('isg-user-online', { detail: payload }));
    });

    socket.on('user-offline', (payload) => {
        console.log(`👤 Kullanıcı çevrimdışı: ${payload.userId}`);
        window.dispatchEvent(new CustomEvent('isg-user-offline', { detail: payload }));
    });
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// ══════════════════════════════════════════════
// UZAKTAN DEĞİŞİKLİK İŞLEME (Socket.io → Dexie)
// ══════════════════════════════════════════════

const TABLE_MAP = {
    observations: 'observations',
    hazards: 'hazards',
    actions: 'actions',
    incidents: 'incidents',
    trainings: 'trainings',
    trainingRecords: 'trainingRecords',
    equipment: 'equipment',
    feedback: 'feedback',
    rootCauses: 'rootCauses',
    opportunities: 'opportunities',
    documents: 'documents',
    documentVersions: 'documentVersions',
    emergencyPlans: 'emergencyPlans',
    drills: 'drills',
    complianceEvaluations: 'complianceEvaluations',
    audits: 'audits',
    auditFindings: 'auditFindings',
    workPermits: 'workPermits',
    employees: 'employees',
    ppeTypes: 'ppeTypes',
    ppeAssignments: 'ppeAssignments',
    contractors: 'contractors',
    contractorPersonnel: 'contractorPersonnel',
    contractorDocuments: 'contractorDocuments',
    committees: 'committees',
    committeeMeetings: 'committeeMeetings',
    meetingDecisions: 'meetingDecisions',
    system_audit_logs: 'system_audit_logs'
};

async function handleRemoteChange(operation, payload) {
    const { table, serverId, data } = payload;
    const dexieTable = TABLE_MAP[table];
    if (!dexieTable || !db[dexieTable]) return;

    try {
        if (operation === 'create' || operation === 'update') {
            // Sunucudan gelen veriyi lokal DB'ye yaz
            const existing = await db[dexieTable].where('id').equals(serverId).first();
            if (existing) {
                await db[dexieTable].update(serverId, { ...data, id: serverId });
            } else {
                await db[dexieTable].put({ ...data, id: serverId });
            }
        } else if (operation === 'delete') {
            await db[dexieTable].delete(serverId);
        }

        // React bileşenlerini bilgilendir
        window.dispatchEvent(new CustomEvent('isg-data-changed', {
            detail: { table, operation, serverId }
        }));
    } catch (err) {
        console.error('[SyncService] Remote change error:', err);
    }
}

// ══════════════════════════════════════════════
// SYNC QUEUE (Offline değişiklikleri biriktir)
// ══════════════════════════════════════════════

export async function addToSyncQueue(table, localId, operation, data) {
    try {
        await db.syncQueue.add({
            table,
            localId,
            operation,
            data,
            timestamp: new Date().toISOString(),
            synced: 0,
            retryCount: 0
        });
    } catch (err) {
        console.error('[SyncQueue] Add error:', err);
    }
}

// ══════════════════════════════════════════════
// FOTOĞRAF YÜKLEME (Binary Sync)
// ══════════════════════════════════════════════

export async function uploadPhoto(photoData, name = 'photo.jpg') {
    const token = getToken();
    if (!token) throw new Error('Yükleme için giriş yapmalısınız.');

    // Base64 to Blob
    const res = await fetch(photoData);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('photo', blob, name);

    const response = await fetch(`${API}/photos/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Fotoğraf sunucuya yüklenemedi.');
    }

    return response.json();
}

export async function flushSyncQueue() {
    if (!navigator.onLine || !getToken()) return;

    try {
        const pending = await db.syncQueue.where('synced').equals(0).toArray();
        if (pending.length === 0) return;

        const deviceId = localStorage.getItem('isg_device_id') || crypto.randomUUID();
        localStorage.setItem('isg_device_id', deviceId);

        const processedChanges = [];

        // Önce fotoğrafları yükle (Binary Asset Optimization)
        for (const item of pending) {
            let data = { ...item.data };

            if (item.table === 'observationPhotos' && item.operation === 'create' && data.data && data.data.startsWith('data:image')) {
                try {
                    const uploadResult = await uploadPhoto(data.data, data.name || 'photo.jpg');
                    // Base64 verisini sil ve URL'i ekle
                    delete data.data; 
                    data.photoUrl = uploadResult.url;
                    data.fileName = uploadResult.filename;
                    data.fileSize = uploadResult.size;
                    console.log('[SyncService] Fotoğraf başarıyla yüklendi:', data.photoUrl);
                } catch (uploadErr) {
                    console.error('[SyncService] Fotoğraf yükleme hatası, bu kayıt atlanıyor:', uploadErr);
                    continue; // Yüklenemeyen fotoğrafı push etme, bir sonraki sync'te dene
                }
            }

            processedChanges.push({
                table: item.table,
                localId: item.localId,
                serverId: item.serverId || null,
                operation: item.operation,
                data: data,
                timestamp: item.timestamp
            });
        }

        if (processedChanges.length === 0) return;

        const result = await apiRequest('/sync/push', {
            method: 'POST',
            body: JSON.stringify({ deviceId, changes: processedChanges })
        });

        if (!result) return; // Offline

        // Başarılı sync'leri işaretle ve ID eşlemelerini kaydet
        for (const res of result.results) {
            const queueItem = pending.find(p => p.localId === res.localId);
            if (queueItem && res.status) {
                await db.syncQueue.update(queueItem.id, { synced: 1 });

                // Yeni oluşturulan kayıtlar için serverId'yi kaydet
                if (res.status === 'created' && res.serverId) {
                    await db.idMap.put({
                        table: queueItem.table,
                        localId: queueItem.localId,
                        serverId: res.serverId
                    });
                }

                // Socket.io ile diğer cihazlara bildir
                if (socket?.connected) {
                    socket.emit('record-change', {
                        table: queueItem.table,
                        operation: queueItem.operation,
                        serverId: res.serverId || queueItem.serverId,
                        data: queueItem.data
                    });
                }
            }
        }

        // Çakışmaları loglam
        if (result.conflicts?.length > 0) {
            console.warn('[SyncService] Çakışmalar:', result.conflicts);
            window.dispatchEvent(new CustomEvent('isg-sync-conflicts', {
                detail: { conflicts: result.conflicts }
            }));
        }

        // Senkronize edilmiş kayıtları sil
        const syncedIds = pending.filter(p => {
            const r = result.results.find(x => x.localId === p.localId);
            return r && r.status;
        }).map(p => p.id);

        if (syncedIds.length > 0) {
            await db.syncQueue.bulkDelete(syncedIds);
        }

        console.log(`[SyncService] ${syncedIds.length}/${pending.length} kayıt senkronize edildi`);

    } catch (err) {
        console.error('[SyncService] Flush error:', err);
    }
}

// ══════════════════════════════════════════════
// TAM SENKRONİZASYON (Pull)
// ══════════════════════════════════════════════

export async function fullSync() {
    if (!navigator.onLine || !getToken()) return;

    try {
        const lastSync = localStorage.getItem('isg_last_sync') || '1970-01-01T00:00:00.000Z';
        const deviceId = localStorage.getItem('isg_device_id');

        const result = await apiRequest(`/sync/pull?since=${encodeURIComponent(lastSync)}&deviceId=${deviceId}`);
        if (!result) return;

        for (const change of result.changes) {
            const dexieTable = TABLE_MAP[change.table];
            if (!dexieTable || !db[dexieTable]) continue;

            try {
                if (change.operation === 'delete') {
                    await db[dexieTable].delete(change.serverId);
                } else {
                    // upsert
                    const data = { ...change.data, id: change.serverId };
                    await db[dexieTable].put(data);
                }
            } catch (err) {
                console.error(`[Sync Pull] ${change.table} error:`, err);
            }
        }

        localStorage.setItem('isg_last_sync', result.serverTimestamp);
        console.log(`[SyncService] Pull tamamlandı: ${result.changes.length} değişiklik`);

        window.dispatchEvent(new CustomEvent('isg-data-changed', {
            detail: { table: 'all', operation: 'sync' }
        }));

    } catch (err) {
        console.error('[SyncService] Full sync error:', err);
    }
}

// ══════════════════════════════════════════════
// PERİYODİK SYNC
// ══════════════════════════════════════════════

function startPeriodicSync() {
    stopPeriodicSync();
    // Her 30 saniyede bir sync
    syncInterval = setInterval(async () => {
        if (navigator.onLine) {
            await flushSyncQueue();
            await fullSync();
        }
    }, 30000);

    // Online olunca hemen sync
    window.addEventListener('online', handleOnline);
}

function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    window.removeEventListener('online', handleOnline);
}

async function handleOnline() {
    console.log('[SyncService] Çevrimiçi olundu — senkronizasyon başlatılıyor');
    await flushSyncQueue();
    await fullSync();
}

// ══════════════════════════════════════════════
// SYNC DURUMU
// ══════════════════════════════════════════════

export async function getSyncStatus() {
    const pendingCount = await db.syncQueue.where('synced').equals(0).count();
    const isOnline = navigator.onLine;
    const isConnected = socket?.connected || false;
    const lastSync = localStorage.getItem('isg_last_sync');

    return {
        isOnline,
        isConnected,
        pendingCount,
        lastSync,
        status: pendingCount > 0 ? 'pending' : isConnected ? 'synced' : isOnline ? 'online' : 'offline'
    };
}

// ══════════════════════════════════════════════
// RESOURCE API (Generic CRUD)
// ══════════════════════════════════════════════

export async function apiGet(resource) {
    return apiRequest(`/${resource}`);
}

export async function apiGetById(resource, id) {
    return apiRequest(`/${resource}/${id}`);
}

export async function apiCreate(resource, data) {
    return apiRequest(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function apiUpdate(resource, id, data) {
    return apiRequest(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function apiDelete(resource, id) {
    return apiRequest(`/${resource}/${id}`, {
        method: 'DELETE'
    });
}

// ══════════════════════════════════════════════
// İNİCİALİZASYON
// ══════════════════════════════════════════════

export function initSync() {
    if (isAuthenticated()) {
        connectSocket();
        startPeriodicSync();
        // İlk sync
        if (navigator.onLine) {
            flushSyncQueue().then(() => fullSync());
        }
    }
}

export default {
    serverLogin,
    serverRegister,
    serverLogout,
    getCurrentUser,
    isAuthenticated,
    initSync,
    fullSync,
    flushSyncQueue,
    addToSyncQueue,
    getSyncStatus,
    apiRequest,
    apiGet,
    apiGetById,
    apiCreate,
    apiUpdate,
    apiDelete
};
