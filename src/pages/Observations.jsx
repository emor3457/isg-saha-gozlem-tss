import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Eye, Plus, Search, Filter, Camera, X, MapPin,
    Calendar, AlertTriangle, User, ChevronRight, Scan, Loader
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import Skeleton from '../components/Common/Skeleton';
import { createObservation, getAllObservations } from '../services/observationService';
import { capturePhoto, pickPhotos } from '../services/photoService';
import { analyzePhoto, generateRiskReport } from '../services/imageAnalysisService';
import { HAZARD_CATEGORIES, OBSERVATION_AREAS, SEVERITY_LEVELS, OBSERVATION_STATUSES } from '../config/categories';

export default function Observations() {
    const [observations, setObservations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [photoAnalysis, setPhotoAnalysis] = useState(null);
    const [searchParams] = useSearchParams();
    const toast = useToast();

    // Form state
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        area: '',
        location: '',
        category: '',
        description: '',
        severity: 2,
        assignedTo: '',
        photos: []
    });

    useEffect(() => {
        loadObservations();
        if (searchParams.get('new') === '1') setShowForm(true);
    }, [searchParams]);

    async function loadObservations() {
        try {
            const data = await getAllObservations();
            setObservations(data);
        } catch (err) {
            toast.error('Gözlemler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.area || !form.description || !form.category) {
            toast.warning('Lütfen zorunlu alanları doldurun');
            return;
        }
        try {
            const dataToSave = { ...form };
            if (photoAnalysis) {
                dataToSave.photoAnalysis = photoAnalysis;
            }
            await createObservation(dataToSave);
            toast.success('Saha gözlemi başarıyla kaydedildi!');
            setShowForm(false);
            setPhotoAnalysis(null);
            setForm({
                date: new Date().toISOString().split('T')[0],
                area: '', location: '', category: '',
                description: '', severity: 2, assignedTo: '', photos: []
            });
            loadObservations();
        } catch (err) {
            toast.error('Kayıt sırasında hata oluştu');
        }
    }

    async function runPhotoAnalysis(photoData) {
        try {
            setAnalyzing(true);
            const analysis = await analyzePhoto(photoData);
            const category = form.category || 'diger';
            const report = generateRiskReport(analysis, category, form.area);
            setPhotoAnalysis(report);
            toast.success('📸 Fotoğraf analizi tamamlandı');
        } catch (err) {
            console.error('Analiz hatası:', err);
        } finally {
            setAnalyzing(false);
        }
    }

    async function handleCapturePhoto() {
        try {
            const photo = await capturePhoto();
            setForm(f => ({ ...f, photos: [...f.photos, photo] }));
            toast.success('Fotoğraf eklendi');
            runPhotoAnalysis(photo.data);
        } catch { /* user cancelled */ }
    }

    async function handlePickPhotos() {
        try {
            const photos = await pickPhotos(true);
            setForm(f => ({ ...f, photos: [...f.photos, ...photos] }));
            toast.success(`${photos.length} fotoğraf eklendi`);
            if (photos.length > 0) runPhotoAnalysis(photos[0].data);
        } catch { /* user cancelled */ }
    }

    function removePhoto(index) {
        const newPhotos = form.photos.filter((_, i) => i !== index);
        setForm(f => ({ ...f, photos: newPhotos }));
        if (newPhotos.length === 0) setPhotoAnalysis(null);
    }

    const filtered = observations.filter(obs => {
        const matchSearch = !searchTerm ||
            obs.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obs.area?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || obs.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">
                            <Eye size={28} style={{ color: 'var(--color-primary)' }} />
                            Saha Gözlemleri
                        </h1>
                        <p className="page-subtitle">{observations.length} gözlem kaydı</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Yeni Gözlem
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-sm" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Gözlem ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 150 }}>
                    <option value="all">Tüm Durumlar</option>
                    {OBSERVATION_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Observation List */}
            {loading ? (
                <div className="flex flex-col gap-sm">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                            <div className="flex items-center gap-md">
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="60%" height="24px" style={{ marginBottom: 8 }} />
                                    <Skeleton width="40%" height="16px" />
                                </div>
                                <Skeleton width="80px" height="28px" borderRadius="14px" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Eye size={64} />
                    <h3>Gözlem bulunamadı</h3>
                    <p>İlk saha gözleminizi ekleyerek başlayın</p>
                    <button className="btn btn-primary mt-md" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Yeni Gözlem Ekle
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-sm">
                    {filtered.map(obs => {
                        const cat = HAZARD_CATEGORIES.find(c => c.id === obs.category);
                        const sev = SEVERITY_LEVELS.find(s => s.id === obs.severity);
                        const status = OBSERVATION_STATUSES.find(s => s.id === obs.status);
                        return (
                            <Link
                                key={obs.id}
                                to={`/observations/${obs.id}`}
                                className="glass-card"
                                style={{
                                    padding: 'var(--space-md)',
                                    textDecoration: 'none',
                                    color: 'var(--text-primary)',
                                    borderLeft: `3px solid ${sev?.color || 'var(--border-color)'}`
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center gap-xs" style={{ marginBottom: 4 }}>
                                            <span style={{ fontSize: '1.125rem' }}>{cat?.icon || '📋'}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }} className="truncate">
                                                {obs.description?.substring(0, 60) || 'Açıklama yok'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            <span className="flex items-center gap-xs"><MapPin size={12} /> {obs.area}</span>
                                            <span className="flex items-center gap-xs"><Calendar size={12} /> {new Date(obs.createdAt).toLocaleDateString('tr-TR')}</span>
                                            {obs.assignedTo && <span className="flex items-center gap-xs"><User size={12} /> {obs.assignedTo}</span>}
                                            {obs.photoCount > 0 && <span className="flex items-center gap-xs"><Camera size={12} /> {obs.photoCount}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <span className="badge" style={{ background: `${status?.color}20`, color: status?.color }}>
                                            {status?.label}
                                        </span>
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* New Observation Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal-content" style={{ maxWidth: 640 }}>
                        <div className="modal-header">
                            <h2>Yeni Saha Gözlemi</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="flex flex-col gap-md">
                                    {/* Date */}
                                    <div className="form-group">
                                        <label className="form-label">Tarih *</label>
                                        <input type="date" className="form-input" value={form.date}
                                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                                    </div>

                                    {/* Area */}
                                    <div className="form-group">
                                        <label className="form-label">Alan / Bölge *</label>
                                        <select className="form-select" value={form.area}
                                            onChange={e => setForm(f => ({ ...f, area: e.target.value }))} required>
                                            <option value="">Seçiniz...</option>
                                            {OBSERVATION_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>

                                    {/* Location detail */}
                                    <div className="form-group">
                                        <label className="form-label">Konum Detayı</label>
                                        <input className="form-input" placeholder="Örn: A hangarı güney kapısı"
                                            value={form.location}
                                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                                    </div>

                                    {/* Category */}
                                    <div className="form-group">
                                        <label className="form-label">Tehlike Kategorisi *</label>
                                        <select className="form-select" value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                                            <option value="">Seçiniz...</option>
                                            {HAZARD_CATEGORIES.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div className="form-group">
                                        <label className="form-label">Açıklama *</label>
                                        <textarea className="form-textarea" rows={3}
                                            placeholder="Gözlem detaylarını yazınız..."
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                                    </div>

                                    {/* Severity */}
                                    <div className="form-group">
                                        <label className="form-label">Ciddiyet Seviyesi</label>
                                        <div className="flex gap-sm">
                                            {SEVERITY_LEVELS.map(s => (
                                                <button type="button" key={s.id}
                                                    className={`btn ${form.severity === s.id ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{
                                                        flex: 1,
                                                        background: form.severity === s.id ? s.color : undefined,
                                                        color: form.severity === s.id ? 'white' : undefined,
                                                        fontSize: '0.75rem'
                                                    }}
                                                    onClick={() => setForm(f => ({ ...f, severity: s.id }))}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Assigned To */}
                                    <div className="form-group">
                                        <label className="form-label">Sorumlu Kişi</label>
                                        <input className="form-input" placeholder="Ad Soyad"
                                            value={form.assignedTo}
                                            onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} />
                                    </div>

                                    {/* Photos */}
                                    <div className="form-group">
                                        <label className="form-label">Fotoğraflar</label>
                                        <div className="flex gap-sm">
                                            <button type="button" className="btn btn-secondary" onClick={handleCapturePhoto}>
                                                <Camera size={16} /> Fotoğraf Çek
                                            </button>
                                            <button type="button" className="btn btn-secondary" onClick={handlePickPhotos}>
                                                <Plus size={16} /> Galeriden Seç
                                            </button>
                                        </div>
                                        {form.photos.length > 0 && (
                                            <div className="photo-grid" style={{ marginTop: 'var(--space-sm)' }}>
                                                {form.photos.map((photo, i) => (
                                                    <div key={i} className="photo-thumb">
                                                        <img src={photo.data} alt={`Fotoğraf ${i + 1}`} />
                                                        <button type="button" className="remove-btn" onClick={() => removePhoto(i)}>
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Fotoğraf Analiz Sonucu */}
                                        {analyzing && (
                                            <div className="analysis-inline-card" style={{ marginTop: 'var(--space-sm)' }}>
                                                <div className="flex items-center gap-sm" style={{ color: 'var(--color-primary)' }}>
                                                    <Loader size={16} className="spin" />
                                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Fotoğraf analiz ediliyor...</span>
                                                </div>
                                            </div>
                                        )}

                                        {photoAnalysis && !analyzing && (
                                            <div className="analysis-inline-card" style={{ marginTop: 'var(--space-sm)', borderLeft: `3px solid ${photoAnalysis.riskColor}` }}>
                                                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                                    <div className="flex items-center gap-xs">
                                                        <Scan size={16} style={{ color: photoAnalysis.riskColor }} />
                                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>📸 Fotoğraf Analizi</span>
                                                    </div>
                                                    <span className="badge" style={{ background: `${photoAnalysis.riskColor}20`, color: photoAnalysis.riskColor, fontSize: '0.6875rem' }}>
                                                        {photoAnalysis.riskLabel} ({photoAnalysis.overallRiskScore})
                                                    </span>
                                                </div>
                                                {photoAnalysis.findings.slice(0, 3).map((f, i) => (
                                                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 0' }}>
                                                        {f.icon} {f.message}
                                                    </div>
                                                ))}
                                                {photoAnalysis.findings.length > 3 && (
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                        +{photoAnalysis.findings.length - 3} bulgu daha (detayda görüntüleyin)
                                                    </div>
                                                )}
                                                {photoAnalysis.recommendations.length > 0 && (
                                                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                                                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2 }}>Öneriler:</div>
                                                        {photoAnalysis.recommendations.slice(0, 2).map((r, i) => (
                                                            <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>✅ {r}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} /> Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB for mobile */}
            <button className="fab" onClick={() => setShowForm(true)} title="Yeni Gözlem">
                <Plus size={24} />
            </button>
        </div>
    );
}
