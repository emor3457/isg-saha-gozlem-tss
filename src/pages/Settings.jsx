import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Download, Upload, Trash2, Shield } from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import { exportAllData, importData, clearAllData } from '../services/exportService';
import { requestPermission } from '../services/notificationService';
import db from '../database/db';

export default function Settings() {
    const [settings, setSettings] = useState({
        companyName: 'Turkish Technic',
        userName: 'İSG Uzmanı',
        notificationsEnabled: true,
        reminderDaysBefore: 3,
        autoBackupInterval: 'never'
    });
    const [notifPermission, setNotifPermission] = useState('default');
    const toast = useToast();

    useEffect(() => {
        loadSettings();
        if ('Notification' in window) {
            setNotifPermission(Notification.permission);
        }
    }, []);

    async function loadSettings() {
        try {
            const all = await db.settings.toArray();
            const obj = {};
            all.forEach(s => { obj[s.key] = s.value; });
            setSettings(prev => ({ ...prev, ...obj }));
        } catch (e) { /* first run */ }
    }

    async function saveSetting(key, value) {
        await db.settings.put({ key, value });
        setSettings(prev => ({ ...prev, [key]: value }));
        toast.success('Ayar kaydedildi');
    }

    async function handleRequestNotification() {
        const granted = await requestPermission();
        setNotifPermission(Notification.permission);
        if (granted) toast.success('Bildirim izni verildi');
        else toast.warning('Bildirim izni reddedildi');
    }

    async function handleExport() {
        try {
            await exportAllData();
            toast.success('Yedek dosyası indirildi');
        } catch (err) {
            toast.error('Dışa aktarma hatası');
        }
    }

    async function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const result = await importData(file);
                toast.success(`İçe aktarıldı: ${result.observations} gözlem, ${result.actions} aksiyon, ${result.hazards} tehlike`);
            } catch (err) {
                toast.error('İçe aktarma hatası: ' + err.message);
            }
        };
        input.click();
    }

    async function handleClear() {
        if (!window.confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ? Bu işlem geri alınamaz!')) return;
        if (!window.confirm('Son uyarı: Tüm gözlemler, aksiyonlar ve risk verileri silinecek!')) return;
        try {
            await clearAllData();
            toast.success('Tüm veriler temizlendi');
        } catch (err) {
            toast.error('Temizleme hatası');
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <SettingsIcon size={28} style={{ color: 'var(--text-secondary)' }} />
                    Ayarlar
                </h1>
            </div>

            {/* Profile */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                    <Shield size={18} style={{ verticalAlign: 'middle', color: 'var(--color-primary)' }} /> Profil
                </h2>
                <div className="flex flex-col gap-md">
                    <div className="form-group">
                        <label className="form-label">Şirket Adı</label>
                        <input className="form-input" value={settings.companyName}
                            onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))}
                            onBlur={e => saveSetting('companyName', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kullanıcı Adı</label>
                        <input className="form-input" value={settings.userName}
                            onChange={e => setSettings(s => ({ ...s, userName: e.target.value }))}
                            onBlur={e => saveSetting('userName', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                    <Bell size={18} style={{ verticalAlign: 'middle' }} /> Bildirimler
                </h2>
                <div className="flex flex-col gap-md">
                    <div className="flex items-center justify-between">
                        <span>Tarayıcı Bildirimleri</span>
                        {notifPermission === 'granted' ? (
                            <span className="badge badge-success">✅ Aktif</span>
                        ) : (
                            <button className="btn btn-primary btn-sm" onClick={handleRequestNotification}>
                                İzin Ver
                            </button>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hatırlatma (Vade tarihinden kaç gün önce)</label>
                        <select className="form-select" value={settings.reminderDaysBefore}
                            onChange={e => saveSetting('reminderDaysBefore', Number(e.target.value))}>
                            <option value={1}>1 gün önce</option>
                            <option value={3}>3 gün önce</option>
                            <option value={7}>7 gün önce</option>
                            <option value={14}>14 gün önce</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                    Veri Yönetimi
                </h2>
                <div className="flex flex-col gap-md">
                    <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                        <label className="form-label">Otomatik Yedekleme Sıklığı</label>
                        <select className="form-select" value={settings.autoBackupInterval || 'never'}
                            onChange={e => saveSetting('autoBackupInterval', e.target.value)}>
                            <option value="never">Kapalı (Sadece Manuel)</option>
                            <option value="daily">Her Gün</option>
                            <option value="weekly">Haftada Bir</option>
                            <option value="monthly">Ayda Bir</option>
                        </select>
                        <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                            Periyot dolduğunda uygulama açılırken otomatik olarak yedek dosyası indirilir.
                        </p>
                    </div>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <button className="btn btn-success" onClick={handleExport}>
                            <Download size={16} /> Verileri Dışa Aktar (JSON)
                        </button>
                        <button className="btn btn-secondary" onClick={handleImport}>
                            <Upload size={16} /> Verileri İçe Aktar
                        </button>
                    </div>
                    <hr style={{ borderColor: 'var(--border-color)' }} />
                    <button className="btn btn-danger" onClick={handleClear}>
                        <Trash2 size={16} /> Tüm Verileri Sil
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                        ⚠️ Bu işlem geri alınamaz. Silmeden önce verileri dışa aktarmanız önerilir.
                    </p>
                </div>
            </div>
        </div>
    );
}
