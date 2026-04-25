import { useState, useEffect } from 'react';
import { QrCode, Package, Plus, X, Search, Calendar, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { scanAndMatch, getAllEquipment, createEquipment, updateEquipment, deleteEquipment } from '../services/qrScannerService';
import { useToast } from './Common/Toast';

/**
 * Ekipman Takip Bileşeni — QR/Barcod ile
 * 
 * Props:
 * - photoData: string (taranacak fotoğrafın dataURL'i)
 * - onClose: () => void
 */
export default function EquipmentTracker({ photoData, onClose }) {
    const toast = useToast();
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [matchedEquipment, setMatchedEquipment] = useState(null);
    const [isNewEquipment, setIsNewEquipment] = useState(false);
    const [allEquipment, setAllEquipment] = useState([]);
    const [showList, setShowList] = useState(!photoData);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        code: '', name: '', type: 'genel', location: '', notes: ''
    });

    const EQUIPMENT_TYPES = [
        { id: 'genel', label: '📦 Genel', icon: '📦' },
        { id: 'kkd', label: '⛑️ KKD', icon: '⛑️' },
        { id: 'yangin', label: '🧯 Yangın Ekipmanı', icon: '🧯' },
        { id: 'elektrik', label: '⚡ Elektrik', icon: '⚡' },
        { id: 'olcum', label: '📏 Ölçüm Cihazı', icon: '📏' },
        { id: 'ilkyardim', label: '🩺 İlk Yardım', icon: '🩺' }
    ];

    useEffect(() => {
        loadEquipment();
        if (photoData) handleScan();
    }, []);

    async function loadEquipment() {
        const data = await getAllEquipment();
        setAllEquipment(data);
    }

    async function handleScan() {
        if (!photoData) return;
        setScanning(true);
        try {
            const result = await scanAndMatch(photoData);
            if (result.scan) {
                setScanResult(result.scan);
                setMatchedEquipment(result.equipment);
                setIsNewEquipment(result.isNew);
                if (result.isNew) {
                    setForm(f => ({ ...f, code: result.scan.data }));
                    setShowForm(true);
                }
                toast.success('📱 QR kod okundu!');
            } else {
                toast.warning('Fotoğrafta QR/barkod bulunamadı');
                setShowList(true);
            }
        } catch (err) {
            toast.error('Tarama hatası: ' + err.message);
        } finally {
            setScanning(false);
        }
    }

    async function handleSaveEquipment(e) {
        e.preventDefault();
        if (!form.name || !form.code) {
            toast.warning('Kod ve ad zorunlu');
            return;
        }
        try {
            await createEquipment(form);
            toast.success('Ekipman kaydedildi');
            setShowForm(false);
            setForm({ code: '', name: '', type: 'genel', location: '', notes: '' });
            loadEquipment();
        } catch (err) {
            toast.error('Kayıt hatası');
        }
    }

    async function handleCheckEquipment(id) {
        await updateEquipment(id, { lastCheckDate: new Date().toISOString(), status: 'active' });
        toast.success('Kontrol kaydedildi ✅');
        loadEquipment();
    }

    async function handleDeleteEquipment(id) {
        if (!window.confirm('Bu ekipmanı silmek istediğinize emin misiniz?')) return;
        await deleteEquipment(id);
        toast.success('Ekipman silindi');
        loadEquipment();
    }

    const filteredEquipment = allEquipment.filter(e =>
        !searchTerm || e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h2><QrCode size={20} style={{ verticalAlign: 'middle' }} /> Ekipman Takibi</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {/* Tarama Sonucu */}
                    {scanning && (
                        <div className="analysis-inline-card" style={{ marginBottom: 'var(--space-md)' }}>
                            <div className="flex items-center gap-sm" style={{ color: 'var(--color-primary)' }}>
                                <RefreshCw size={16} className="spin" />
                                <span style={{ fontWeight: 600 }}>QR kod taranıyor...</span>
                            </div>
                        </div>
                    )}

                    {scanResult && !scanning && (
                        <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', borderLeft: '3px solid #22C55E' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4 }}>📱 QR Kod Okundu</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{scanResult.data}</div>
                            <div className="badge" style={{ marginTop: 4, fontSize: '0.625rem' }}>Tip: {scanResult.type}</div>
                        </div>
                    )}

                    {matchedEquipment && (
                        <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--color-primary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div style={{ fontWeight: 700 }}>{matchedEquipment.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span className="flex items-center gap-xs">
                                            <Package size={12} /> {EQUIPMENT_TYPES.find(t => t.id === matchedEquipment.type)?.label || matchedEquipment.type}
                                        </span>
                                        {matchedEquipment.location && <span> · 📍 {matchedEquipment.location}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        Son kontrol: {new Date(matchedEquipment.lastCheckDate).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-success" onClick={() => handleCheckEquipment(matchedEquipment.id)}>
                                    <CheckCircle size={14} /> Kontrol Et
                                </button>
                            </div>
                        </div>
                    )}

                    {isNewEquipment && scanResult && (
                        <div className="analysis-inline-card" style={{ marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--color-warning)' }}>
                            <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
                            <span style={{ fontSize: '0.8125rem' }}> Bu kod sistemde kayıtlı değil. Yeni ekipman olarak kaydedebilirsiniz.</span>
                        </div>
                    )}

                    {/* Yeni Ekipman Formu */}
                    {showForm && (
                        <form onSubmit={handleSaveEquipment} className="flex flex-col gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Ekipman Kodu *</label>
                                <input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ekipman Adı *</label>
                                <input className="form-input" placeholder="Ör: Yangın Söndürücü #12" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tür</label>
                                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {EQUIPMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Konum</label>
                                <input className="form-input" placeholder="Ör: A Hangarı Giriş" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                            </div>
                            <div className="flex gap-sm justify-end">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /> Kaydet</button>
                            </div>
                        </form>
                    )}

                    {/* Ekipman Listesi */}
                    {showList && (
                        <>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Tüm Ekipmanlar ({allEquipment.length})</h3>
                                <button className="btn btn-sm btn-primary" onClick={() => { setShowForm(true); setForm({ code: '', name: '', type: 'genel', location: '', notes: '' }); }}>
                                    <Plus size={14} /> Yeni
                                </button>
                            </div>

                            {allEquipment.length > 3 && (
                                <div style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
                                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input className="form-input" placeholder="Ekipman ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 32, fontSize: '0.8125rem' }} />
                                </div>
                            )}

                            <div className="flex flex-col gap-xs" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {filteredEquipment.length === 0 ? (
                                    <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Ekipman bulunamadı</div>
                                ) : filteredEquipment.map(eq => (
                                    <div key={eq.id} className="finding-card">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                    {EQUIPMENT_TYPES.find(t => t.id === eq.type)?.icon || '📦'} {eq.name}
                                                </div>
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                                    {eq.code} {eq.location && `· 📍 ${eq.location}`} · Son: {new Date(eq.lastCheckDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
                                            <div className="flex gap-xs">
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleCheckEquipment(eq.id)} title="Kontrol Et">
                                                    <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteEquipment(eq.id)} title="Sil">
                                                    <X size={14} style={{ color: 'var(--color-danger)' }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
