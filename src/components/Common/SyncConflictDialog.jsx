import { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Clock } from 'lucide-react';

/**
 * Çakışma Çözümleme Diyaloğu
 * syncService'den 'isg-sync-conflicts' event'i tetiklenince gösterilir
 */
export default function SyncConflictDialog() {
    const [conflicts, setConflicts] = useState([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleConflicts = (e) => {
            if (e.detail?.conflicts?.length > 0) {
                setConflicts(e.detail.conflicts);
                setVisible(true);
            }
        };
        window.addEventListener('isg-sync-conflicts', handleConflicts);
        return () => window.removeEventListener('isg-sync-conflicts', handleConflicts);
    }, []);

    if (!visible || conflicts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
        }}>
            <div className="glass-card" style={{
                maxWidth: 500, width: '100%', padding: '1.5rem',
                maxHeight: '80vh', overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
                        <AlertTriangle size={20} />
                        Senkronizasyon Çakışmaları
                    </h3>
                    <button
                        onClick={() => { setVisible(false); setConflicts([]); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Bazı kayıtlar başka cihazlardan değiştirilmiş. Sunucu versiyonu korundu (son yazan kazanır).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {conflicts.map((c, i) => (
                        <div key={i} style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '0.8rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {c.table} #{c.localId || c.serverId}
                                </span>
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    fontSize: '0.7rem', color: '#f59e0b'
                                }}>
                                    <Clock size={12} />
                                    {c.resolution || 'Sunucu versiyonu kullanıldı'}
                                </span>
                            </div>
                            {c.message && (
                                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {c.message}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => { setVisible(false); setConflicts([]); }}
                    style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', fontWeight: 600 }}
                >
                    <Check size={14} style={{ marginRight: '6px' }} />
                    Anladım
                </button>
            </div>
        </div>
    );
}
