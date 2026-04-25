import { useState, useEffect, useCallback } from 'react';
import db from '../database/db';
import { addToSyncQueue, apiRequest } from '../services/syncService';

/**
 * useApiData — Dexie + API dual-source hook
 * 
 * Mevcut sayfaları API ile entegre etmek için kullanılır.
 * Önce lokal Dexie verisini gösterir (anında), sonra online ise API'den günceller.
 * 
 * @param {string} tableName - Dexie tablo adı (ör: 'observations')
 * @param {string} apiResource - API resource adı (ör: 'observations')
 * @param {object} options - { autoSync: true, orderBy: 'createdAt' }
 */
export function useApiData(tableName, apiResource, options = {}) {
    const { autoSync = true, orderBy = 'createdAt' } = options;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lokal veriden yükle
    const loadLocal = useCallback(async () => {
        try {
            const items = await db[tableName].orderBy(orderBy).reverse().toArray();
            setData(items);
        } catch (err) {
            console.warn(`[useApiData] Local load error for ${tableName}:`, err);
        } finally {
            setLoading(false);
        }
    }, [tableName, orderBy]);

    // API'den çek ve lokale yaz
    const syncFromApi = useCallback(async () => {
        if (!navigator.onLine) return;
        try {
            const result = await apiRequest(`/${apiResource}`);
            if (result && result[apiResource]) {
                const items = result[apiResource];
                // Lokale yaz (upsert)
                await db[tableName].bulkPut(items);
                setData(items);
            }
        } catch (err) {
            console.warn(`[useApiData] API sync error for ${apiResource}:`, err);
        }
    }, [tableName, apiResource]);

    // İlk yükleme: lokal → API
    useEffect(() => {
        loadLocal().then(() => {
            if (autoSync) syncFromApi();
        });
    }, [loadLocal, syncFromApi, autoSync]);

    // data-changed event dinle
    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.table === tableName || e.detail?.table === 'all') {
                loadLocal();
            }
        };
        window.addEventListener('isg-data-changed', handler);
        return () => window.removeEventListener('isg-data-changed', handler);
    }, [tableName, loadLocal]);

    // CRUD fonksiyonları
    const create = useCallback(async (item) => {
        const id = await db[tableName].add({ ...item, createdAt: new Date().toISOString() });
        await addToSyncQueue(tableName, id, 'create', { ...item, createdAt: new Date().toISOString() });
        if (navigator.onLine) {
            try { await apiRequest(`/${apiResource}`, { method: 'POST', body: JSON.stringify(item) }); } catch { }
        }
        await loadLocal();
        return id;
    }, [tableName, apiResource, loadLocal]);

    const update = useCallback(async (id, changes) => {
        await db[tableName].update(id, { ...changes, updatedAt: new Date().toISOString() });
        await addToSyncQueue(tableName, id, 'update', changes);
        if (navigator.onLine) {
            try { await apiRequest(`/${apiResource}/${id}`, { method: 'PUT', body: JSON.stringify(changes) }); } catch { }
        }
        await loadLocal();
    }, [tableName, apiResource, loadLocal]);

    const remove = useCallback(async (id) => {
        await db[tableName].delete(id);
        await addToSyncQueue(tableName, id, 'delete', {});
        if (navigator.onLine) {
            try { await apiRequest(`/${apiResource}/${id}`, { method: 'DELETE' }); } catch { }
        }
        await loadLocal();
    }, [tableName, apiResource, loadLocal]);

    return { data, loading, error, create, update, remove, refresh: loadLocal, syncFromApi };
}
