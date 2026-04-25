import React from 'react';
import { useSync } from '../../contexts/SyncContext';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Check } from 'lucide-react';

const STATUS_CONFIG = {
    synced: { icon: Check, color: '#10b981', label: 'Senkronize', bg: 'rgba(16, 185, 129, 0.1)' },
    pending: { icon: Cloud, color: '#f59e0b', label: 'Bekleyen değişiklikler', bg: 'rgba(245, 158, 11, 0.1)' },
    syncing: { icon: RefreshCw, color: '#3b82f6', label: 'Senkronize ediliyor...', bg: 'rgba(59, 130, 246, 0.1)' },
    online: { icon: Wifi, color: '#10b981', label: 'Çevrimiçi', bg: 'rgba(16, 185, 129, 0.1)' },
    offline: { icon: WifiOff, color: '#ef4444', label: 'Çevrimdışı', bg: 'rgba(239, 68, 68, 0.1)' }
};

export default function SyncStatusBar() {
    const { syncStatus, triggerSync } = useSync();
    const config = STATUS_CONFIG[syncStatus.status] || STATUS_CONFIG.offline;
    const Icon = config.icon;
    const isAnimating = syncStatus.status === 'syncing';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: config.bg,
            border: `1px solid ${config.color}22`,
            fontSize: '12px',
            color: config.color,
            cursor: syncStatus.isOnline ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            userSelect: 'none'
        }}
            onClick={syncStatus.isOnline ? triggerSync : undefined}
            title={syncStatus.isOnline ? 'Tıklayarak manuel senkronize et' : 'Çevrimdışı moddasınız'}
        >
            <Icon
                size={14}
                style={isAnimating ? { animation: 'spin 1s linear infinite' } : {}}
            />
            <span style={{ fontWeight: 500 }}>{config.label}</span>
            {syncStatus.pendingCount > 0 && (
                <span style={{
                    background: '#f59e0b',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '18px',
                    textAlign: 'center'
                }}>
                    {syncStatus.pendingCount}
                </span>
            )}
        </div>
    );
}
