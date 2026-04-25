import { useState, useEffect } from 'react';
import {
    Files, Plus, Search, Filter, X, Eye,
    Download, Upload, Trash2, History,
    CheckCircle, AlertCircle, Bookmark, Box
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createDocument, getAllDocuments, updateDocument, deleteDocument,
    getDocumentStats, getDocumentVersions, addDocumentVersion
} from '../services/documentService';
import {
    DOCUMENT_TYPES, DOCUMENT_STATUSES, ACCESS_LEVELS, DEPARTMENTS
} from '../config/categories';

export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState({ total: 0, published: 0, inReview: 0, archived: 0, draft: 0 });
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // UI State
    const [loading, setLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(null);
    const [showNewVersionForm, setShowNewVersionForm] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        code: '', title: '', type: 'procedure',
        status: 'draft', department: '', accessLevel: 'all'
    });
    const [fileContent, setFileContent] = useState(''); // Simulated base64 or text content
    const [newVersionData, setNewVersionData] = useState({
        versionNumber: '', changes: ''
    });

    const [versions, setVersions] = useState([]);

    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [list, s] = await Promise.all([getAllDocuments(), getDocumentStats()]);
            setDocuments(list);
            setStats(s);
        } catch (e) {
            toast.error('Dokümanlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    async function handleUploadSubmit(e) {
        e.preventDefault();
        try {
            if (!formData.title || !formData.code || !formData.type) {
                toast.warning('Zorunlu alanları doldurun');
                return;
            }
            await createDocument(formData, fileContent || 'Boş Doküman İçeriği');
            toast.success('Doküman başarıyla yüklendi');
            setShowUploadForm(false);
            setFormData({ code: '', title: '', type: 'procedure', status: 'draft', department: '', accessLevel: 'all' });
            setFileContent('');
            await loadData();
        } catch (err) {
            toast.error('Yükleme hatası');
            console.error(err);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            await updateDocument(id, { status: newStatus });
            toast.success('Durum güncellendi');
            loadData();
        } catch {
            toast.error('Güncellenemedi');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu dokümanı ve tüm versiyonlarını silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDocument(id);
            toast.success('Doküman silindi');
            loadData();
        } catch {
            toast.error('Silme hatası');
        }
    }

    async function handleOpenVersions(doc) {
        const vList = await getDocumentVersions(doc.id);
        setVersions(vList);
        setShowVersionHistory(doc);
    }

    async function handleNewVersionSubmit(e) {
        e.preventDefault();
        try {
            if (!newVersionData.versionNumber || !newVersionData.changes) {
                toast.warning('Versiyon no ve değişiklik nedeni zorunludur');
                return;
            }
            await addDocumentVersion(showNewVersionForm.id, {
                versionNumber: newVersionData.versionNumber,
                changes: newVersionData.changes,
                fileData: fileContent || 'Yeni Versiyon İçeriği'
            });
            toast.success('Yeni versiyon eklendi');
            setShowNewVersionForm(null);
            setNewVersionData({ versionNumber: '', changes: '' });
            setFileContent('');
            await loadData();
        } catch (err) {
            toast.error('Versiyon ekleme hatası');
        }
    }

    // Dosya okuma simülasyonu
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileContent(file.name + ' simülasyon içeriği (ISO 45001 madde 7.5 demo)');
        }
    };

    const filtered = documents.filter(d => {
        if (filterType !== 'all' && d.type !== filterType) return false;
        if (filterStatus !== 'all' && d.status !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return (d.title?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q) || d.department?.toLowerCase().includes(q));
        }
        return true;
    });

    const getTypeInfo = (id) => DOCUMENT_TYPES.find(t => t.id === id) || DOCUMENT_TYPES[0];
    const getStatusInfo = (id) => DOCUMENT_STATUSES.find(s => s.id === id) || DOCUMENT_STATUSES[0];

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <Files size={28} style={{ color: 'var(--color-primary)' }} />
                        Doküman Yonetimi
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 7.5 — Belgelenmiş Bilgi Kontrolü</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUploadForm(true)}>
                    <Upload size={18} /> Yeni Yükle
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="glass-card stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Toplam Doküman</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.published}</div>
                    <div className="stat-label">Yürürlükte</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.inReview}</div>
                    <div className="stat-label">Onay Bekleyen</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.archived}</div>
                    <div className="stat-label">Arşivlenmiş/İptal</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="form-input" placeholder="Doküman No veya Başlık ara..."
                            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                    <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ flex: '0 1 170px' }}>
                        <option value="all">Tüm Türler</option>
                        {DOCUMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                    </select>
                    <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 1 170px' }}>
                        <option value="all">Tüm Durumlar</option>
                        {DOCUMENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center" style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Files size={64} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3>Doküman bulunamadı</h3>
                    <p>Sistemde arama kriterlerinize uygun belge yok.</p>
                </div>
            ) : (
                <div className="grid grid-2" style={{ gap: 'var(--space-sm)' }}>
                    {filtered.map(doc => {
                        const typeInfo = getTypeInfo(doc.type);
                        const statusInfo = getStatusInfo(doc.status);

                        return (
                            <div key={doc.id} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                                    <div className="flex items-center gap-sm">
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                            background: `${typeInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>{typeInfo.icon}</span>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</h4>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{doc.code} • Sürm: v{doc.currentVersion}</div>
                                        </div>
                                    </div>
                                    <div className="badge" style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                    <div><strong>Departman:</strong> {doc.department || 'Tümü'}</div>
                                    <div><strong>Son Güncelleme:</strong> {new Date(doc.updatedAt).toLocaleDateString('tr-TR')}</div>
                                </div>

                                <div className="flex items-center justify-between border-t" style={{ paddingTop: 'var(--space-sm)', borderColor: 'var(--border-color)' }}>
                                    <div className="flex gap-xs">
                                        <button className="btn btn-ghost btn-icon btn-sm" title="İndir / Görüntüle" style={{ color: 'var(--text-muted)' }}>
                                            <Download size={16} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon btn-sm" title="Versiyon Geçmişi" onClick={() => handleOpenVersions(doc)} style={{ color: 'var(--color-primary)' }}>
                                            <History size={16} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon btn-sm" title="Yeni Versiyon Yükle" onClick={() => setShowNewVersionForm(doc)} style={{ color: 'var(--color-warning)' }}>
                                            <Upload size={16} />
                                        </button>
                                    </div>
                                    <div className="flex gap-sm">
                                        <select
                                            className="form-select"
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 1.75rem 0.25rem 0.5rem', minHeight: 'auto' }}
                                            value={doc.status}
                                            onChange={e => handleStatusChange(doc.id, e.target.value)}
                                        >
                                            {DOCUMENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(doc.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Yeni Doküman Yükleme Modalı */}
            {showUploadForm && (
                <div className="modal-overlay" onClick={() => setShowUploadForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-sm">
                                <Plus size={20} style={{ color: 'var(--color-primary)' }} />
                                Yeni Belgelenmiş Bilgi (Doküman)
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowUploadForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Doküman Kodu *</label>
                                        <input className="form-input" required placeholder="Örn: PR-01, TL-ISG-05"
                                            value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tür *</label>
                                        <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            {DOCUMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Doküman Başlığı *</label>
                                    <input className="form-input" required placeholder="Doküman Adı / Konusu"
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Bölüm / Departman</label>
                                        <select className="form-select" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                            <option value="">Tüm Kurum</option>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Erişim Yetkisi</label>
                                        <select className="form-select" value={formData.accessLevel} onChange={e => setFormData({ ...formData, accessLevel: e.target.value })}>
                                            {ACCESS_LEVELS.map(al => <option key={al.id} value={al.id}>{al.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Dosya Seç *</label>
                                    <input type="file" required className="form-input" style={{ paddingTop: 8 }} onChange={handleFileChange} />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        PDF, DOCX, XLSX (Max 10MB) - ISO gereği ilk versiyon v1.0 olarak atanır.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Versiyon Geçmişi Modalı */}
            {showVersionHistory && (
                <div className="modal-overlay" onClick={() => setShowVersionHistory(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-sm">
                                <History size={20} style={{ color: 'var(--color-primary)' }} />
                                {showVersionHistory.code} - Versiyon Geçmişi
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowVersionHistory(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {versions.length === 0 ? <p>Kayıtlı versiyon bulunamadı.</p> : (
                                <div className="flex flex-col gap-sm">
                                    {versions.map((ver, i) => (
                                        <div key={ver.id} className="glass-card" style={{ padding: 'var(--space-md)', background: i === 0 ? 'rgba(16, 185, 129, 0.05)' : undefined, border: i === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : undefined }}>
                                            <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                                                <div style={{ fontWeight: 700 }}>
                                                    Sürüm v{ver.versionNumber}
                                                    {i === 0 && <span className="badge ml-2" style={{ background: '#10B98120', color: '#10B981', marginLeft: 8 }}>Geçerli Sürüm</span>}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(ver.uploadDate).toLocaleString('tr-TR')}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                <span style={{ fontWeight: 600 }}>Revizyon Nedeni:</span> {ver.changes}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                <span style={{ fontWeight: 600 }}>Yükleyen:</span> {ver.uploadedBy}
                                            </div>
                                            <button className="btn btn-secondary btn-sm mt-2" style={{ fontSize: '0.75rem' }}><Download size={12} /> İndir</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Yeni Versiyon Yükleme Modalı */}
            {showNewVersionForm && (
                <div className="modal-overlay" onClick={() => setShowNewVersionForm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-sm">
                                <Upload size={20} style={{ color: 'var(--color-warning)' }} />
                                Revizyon Ekle: {showNewVersionForm.code}
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowNewVersionForm(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleNewVersionSubmit}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="form-group mt-2 p-3 bg-secondary" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.8125rem', marginBottom: 4 }}><strong>Mevcut Sürüm:</strong> v{showNewVersionForm.currentVersion}</div>
                                    <div style={{ fontSize: '0.8125rem' }}>ISO 45001 gereği her revizyon kaydedilmeli ve gerekçelendirilmelidir. Eski sürüm iptal edilerek arşivlenecektir.</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Yeni Versiyon No *</label>
                                    <input className="form-input" required placeholder={`Örn: ${(parseFloat(showNewVersionForm.currentVersion) + 0.1).toFixed(1)} veya ${(parseInt(showNewVersionForm.currentVersion) + 1).toFixed(1)}`}
                                        value={newVersionData.versionNumber} onChange={e => setNewVersionData({ ...newVersionData, versionNumber: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Değişiklik (Revizyon) Nedeni *</label>
                                    <textarea className="form-textarea" required rows={3} placeholder="Örn: Saha denetim bulgusu doğrultusunda prosedür güncellendi..."
                                        value={newVersionData.changes} onChange={e => setNewVersionData({ ...newVersionData, changes: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Güncel Dosya *</label>
                                    <input type="file" required className="form-input" style={{ paddingTop: 8 }} onChange={handleFileChange} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowNewVersionForm(null)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Revizyonu Yayınla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
