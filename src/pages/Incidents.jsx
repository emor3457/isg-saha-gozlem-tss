import { useState, useEffect } from 'react';
import {
    AlertOctagon, Plus, Search, MapPin,
    Calendar, AlertTriangle, Crosshair, HelpCircle, CheckCircle, Sparkles
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createIncident, getAllIncidents, updateIncident, deleteIncident
} from '../services/incidentService';
import { analyzeRootCause } from '../services/agents/rootCauseAgent';
import { INCIDENT_TYPES, INCIDENT_STATUSES, FEEDBACK_PRIORITIES } from '../config/categories';

export default function Incidents() {
    const [incidents, setIncidents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const toast = useToast();

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [incidentData, setIncidentData] = useState({
        type: 'near_miss', date: new Date().toISOString().split('T')[0], location: '',
        description: '', involvedPersons: '', injuryType: '',
        damageDescription: '', rootCause: '', status: 'new', isReported: false
    });

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (incidentData.description.length > 10) {
            const suggestions = analyzeRootCause(incidentData.description);
            setAiSuggestions(suggestions);
        } else {
            setAiSuggestions([]);
        }
    }, [incidentData.description]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getAllIncidents();
            setIncidents(data);
        } catch (e) {
            toast.error('Olay listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await createIncident(incidentData);
            toast.success('Olay / Kaza kaydı eklendi');
            setShowModal(false);
            setIncidentData({
                type: 'near_miss', date: new Date().toISOString().split('T')[0], location: '',
                description: '', involvedPersons: '', injuryType: '',
                damageDescription: '', rootCause: '', status: 'new', isReported: false
            });
            await loadData();
        } catch {
            toast.error('Kayıt oluşturulamadı');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu olayı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteIncident(id);
            toast.success('Kayıt silindi');
            await loadData();
        } catch {
            toast.error('Silme hatası');
        }
    }

    const filtered = incidents.filter(i => {
        if (!search) return true;
        const q = search.toLowerCase();
        return i.description?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q) || i.involvedPersons?.toLowerCase().includes(q);
    });

    const getTypeInfo = id => INCIDENT_TYPES.find(t => t.id === id) || INCIDENT_TYPES[0];
    const getStatusInfo = id => INCIDENT_STATUSES.find(s => s.id === id) || INCIDENT_STATUSES[0];

    return (
        <div className="page">
            <div className="page-header flex justify-between gap-md" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">
                        <AlertOctagon size={28} style={{ color: 'var(--color-danger)' }} />
                        Olay / Kaza Soruşturması
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 10.2 — Olay, Uygunsuzluk ve DÖF</p>
                </div>
                <button className="btn btn-danger" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Yeni Olay Bildir
                </button>
            </div>

            <div className="glass-card mb-4" style={{ padding: 'var(--space-md)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder="Açıklama, lokasyon veya kişi ara..."
                        value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8 text-muted">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={48} className="text-success mb-4" />
                    <h3>Sıfır Kaza!</h3>
                    <p>Sistemde kayıtlı herhangi bir olay veya kaza bulunmuyor.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-md">
                    {filtered.map(inc => {
                        const typeInfo = getTypeInfo(inc.type);
                        const statusInfo = getStatusInfo(inc.status);
                        return (
                            <div key={inc.id} className="glass-card p-4 flex gap-md" style={{ borderLeft: `4px solid ${typeInfo.color}` }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
                                    background: `${typeInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{typeInfo.label}</h3>
                                            <div className="flex gap-md text-sm text-secondary">
                                                <span className="flex items-center gap-xs"><Calendar size={12} /> {new Date(inc.date).toLocaleDateString('tr-TR')}</span>
                                                <span className="flex items-center gap-xs"><MapPin size={12} /> {inc.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-sm">
                                            <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm mb-4" style={{ lineHeight: 1.5 }}>{inc.description}</p>

                                    {(inc.injuryType || inc.damageDescription || inc.involvedPersons) && (
                                        <div className="bg-secondary p-3 grid grid-2 gap-sm mb-4" style={{ borderRadius: 'var(--radius-sm)' }}>
                                            {inc.involvedPersons && <div><span className="text-muted text-xs block">İlgili Kişiler</span><span className="text-sm font-medium">{inc.involvedPersons}</span></div>}
                                            {inc.injuryType && <div><span className="text-danger text-xs block">Yaralanma Türü</span><span className="text-sm font-medium">{inc.injuryType}</span></div>}
                                            {inc.damageDescription && <div><span className="text-warning text-xs block">Maddi / Çevre Hasar</span><span className="text-sm font-medium">{inc.damageDescription}</span></div>}
                                        </div>
                                    )}

                                    {inc.rootCause && (
                                        <div className="mb-4 text-sm" style={{ padding: '0.5rem', borderLeft: '3px solid var(--color-primary)', background: 'var(--bg-tertiary)' }}>
                                            <strong>Kök Neden (Soruşturma Sonucu): </strong> {inc.rootCause}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center gap-sm">
                                            <label className="text-xs text-muted">Durum Güncelle: </label>
                                            <select className="form-select text-xs" style={{ padding: '2px 8px', height: 'auto', width: 'auto' }}
                                                value={inc.status} onChange={async (e) => {
                                                    await updateIncident(inc.id, { status: e.target.value });
                                                    loadData();
                                                }}
                                            >
                                                {INCIDENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-md">
                                            {inc.isReported && <span className="text-success text-xs flex items-center gap-xs"><CheckCircle size={12} /> SGK/Resmi Kuruma Bildirildi</span>}
                                            <button className="text-danger text-sm font-medium" onClick={() => handleDelete(inc.id)}>Sil</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Yeni Olay Modalı */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yeni Olay / Kaza Bildirimi</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>X</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body gap-md" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Olay Türü</label>
                                        <select className="form-select" value={incidentData.type} onChange={e => setIncidentData({ ...incidentData, type: e.target.value })}>
                                            {INCIDENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tarih</label>
                                        <input className="form-input" type="date" required value={incidentData.date} onChange={e => setIncidentData({ ...incidentData, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lokasyon</label>
                                    <input className="form-input" required value={incidentData.location} onChange={e => setIncidentData({ ...incidentData, location: e.target.value })} placeholder="Örn: CNC Bölümü Hat 2" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Olayın Detaylı Açıklaması</label>
                                    <textarea className="form-textarea" required rows={3} value={incidentData.description} onChange={e => setIncidentData({ ...incidentData, description: e.target.value })} placeholder="Ne oldu? Neden oldu?..." />
                                </div>

                                {aiSuggestions.length > 0 && (
                                    <div className="ai-suggestions-box mb-4" style={{ background: 'var(--color-primary-light)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
                                        <div className="flex items-center gap-sm mb-2 text-primary font-bold">
                                            <Sparkles size={16} /> AI Kök Neden Önerileri
                                        </div>
                                        <div className="flex flex-col gap-sm">
                                            {aiSuggestions.slice(0, 2).map((s, idx) => (
                                                <div key={idx} className="glass-card p-2 text-xs flex justify-between items-center cursor-pointer hover:bg-white" 
                                                    onClick={() => setIncidentData({ ...incidentData, rootCause: s.rootCause })}
                                                >
                                                    <span><strong>{s.category}:</strong> {s.suggestion}</span>
                                                    <button type="button" className="btn btn-ghost p-1" style={{ height: 'auto' }}>Uygula</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Tahmini / Tespit Edilen Kök Neden</label>
                                    <input className="form-input" value={incidentData.rootCause} onChange={e => setIncidentData({ ...incidentData, rootCause: e.target.value })} placeholder="Örn: Koruyucu bariyer eksikliği" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">İlgili Kişiler / Etkilenenler</label>
                                    <input className="form-input" value={incidentData.involvedPersons} onChange={e => setIncidentData({ ...incidentData, involvedPersons: e.target.value })} placeholder="Örn: Ahmet Yılmaz (Operatör)" />
                                </div>

                                {incidentData.type !== 'near_miss' && (
                                    <div className="grid grid-2 gap-md">
                                        <div className="form-group">
                                            <label className="form-label">Yaralanma Türü / Uzuv</label>
                                            <input className="form-input" value={incidentData.injuryType} onChange={e => setIncidentData({ ...incidentData, injuryType: e.target.value })} placeholder="Örn: Sağ El İşaret Parmağı Kesisi" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Maddi / Çevre Hasarı</label>
                                            <input className="form-input" value={incidentData.damageDescription} onChange={e => setIncidentData({ ...incidentData, damageDescription: e.target.value })} placeholder="Örn: 2 Litre yağ döküldü" />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group flex items-center gap-sm mt-2">
                                    <input type="checkbox" id="isReported" checked={incidentData.isReported} onChange={e => setIncidentData({ ...incidentData, isReported: e.target.checked })} style={{ width: 16, height: 16 }} />
                                    <label htmlFor="isReported" className="form-label" style={{ marginBottom: 0 }}>Yasal Süre İçinde SGK / ÇSGB Bildirimi Yapıldı (İş Kazası)</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-danger">Bildirimi Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
