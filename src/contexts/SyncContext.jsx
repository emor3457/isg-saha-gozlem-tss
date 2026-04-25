import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import syncService, { initSync, getSyncStatus, fullSync, flushSyncQueue } from '../services/syncService';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
    const [syncStatus, setSyncStatus] = useState({
        isOnline: navigator.onLine,
        isConnected: false,
        pendingCount: 0,
        lastSync: null,
        status: 'offline'
    });

    // Sync durumunu güncelle
    const refreshStatus = useCallback(async () => {
        try {
            const status = await getSyncStatus();
            setSyncStatus(status);
        } catch (err) {
            console.error('[SyncContext] Status error:', err);
        }
    }, []);

    // Manuel sync tetikle
    const triggerSync = useCallback(async () => {
        setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
        await flushSyncQueue();
        await fullSync();
        await refreshStatus();
    }, [refreshStatus]);

    // İlk yükleme
    useEffect(() => {
        initSync();
        refreshStatus();

        // Durum değişikliklerini dinle
        const handleOnline = () => refreshStatus();
        const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false, status: 'offline' }));
        const handleDataChanged = () => refreshStatus();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('isg-data-changed', handleDataChanged);

        // Her 30 saniyede durum güncelle
        const interval = setInterval(refreshStatus, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('isg-data-changed', handleDataChanged);
            clearInterval(interval);
        };
    }, [refreshStatus]);

    return (
        <SyncContext.Provider value={{ syncStatus, refreshStatus, triggerSync }}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
}

export default SyncContext;
