import { useState, useEffect } from 'react';
import {
    ClipboardList, Plus, Search, MapPin, Calendar,
    CheckCircle, AlertTriangle, Eye, Activity, ShieldCheck
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createAudit, getAllAudits, updateAudit, deleteAudit,
    createAuditFinding, getFindingsByAuditId, updateAuditFinding, deleteAuditFinding
} from '../services/auditService';
import { AUDIT_STATUSES, AUDIT_FINDING_SEVERITY, DEPARTMENTS } from '../config/categories';

export default function Audits() {
    const [audits, setAudits] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Modals
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [selectedAuditForFindings, setSelectedAuditForFindings] = useState(null);
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [findings, setFindings] = useState([]);

    const [auditData, setAuditData] = useState({
        title: '', scope: '', plannedDate: '', executionDate: '',
        auditor: 'İSG Uzmanı', auditoryDepartment: DEPARTMENTS[0], status: 'planned'
    });
    const [findingData, setFindingData] = useState({
        description: '', requirement: 'ISO 45001 ', severity: 'minor', status: 'open'
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getAllAudits();
            setAudits(data);
        } catch (e) {
            toast.error('Denetim listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function handleAuditSubmit(e) {
        e.preventDefault();
        try {
            await createAudit(auditData);
            toast.success('İç Denetim planı oluşturuldu');
            setShowAuditModal(false);
            setAuditData({ ...auditData, title: '', scope: '' });
            await loadData();
        } catch {
            toast.error('Denetim oluşturulamadı');
        }
    }

    async function handleAuditDelete(id) {
        if (!window.confirm('Bu denetimi ve tüm bulgularını silmek istediğinize emin misiniz?')) return;
        try {
            await deleteAudit(id);
            toast.success('Denetim silindi');
            await loadData();
        } catch {
            toast.error('Silme hatası');
        }
    }

    // --- Bulgular (Findings) ---
    async function handleOpenFindings(audit) {
        setSelectedAuditForFindings(audit);
        await loadFindings(audit.id);
    }

    async function loadFindings(auditId) {
        try {
            const data = await getFindingsByAuditId(auditId);
            setFindings(data);
        } catch {
            toast.error('Bulgular yüklenemedi');
        }
    }

    async function handleFindingSubmit(e) {
        e.preventDefault();
        try {
            await createAuditFinding({ ...findingData, auditId: selectedAuditForFindings.id });
            toast.success('Bulgu eklendi');
            setShowFindingModal(false);
            setFindingData({ description: '', requirement: 'ISO 45001 ', severity: 'minor', status: 'open' });
            await loadFindings(selectedAuditForFindings.id);
        } catch {
            toast.error('Bulgu eklenirken hata');
        }
    }

    async function handleFindingDelete(id) {
        if (!window.confirm('Bu bulguyu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteAuditFinding(id);
            toast.success('Bulgu silindi');
            await loadFindings(selectedAuditForFindings.id);
        } catch { }
    }

    const filtered = audits.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        return a.title?.toLowerCase().includes(q) || a.auditoryDepartment?.toLowerCase().includes(q);
    });

    const getStatusInfo = id => AUDIT_STATUSES.find(s => s.id === id) || AUDIT_STATUSES[0];
    const getSeverityInfo = id => AUDIT_FINDING_SEVERITY.find(s => s.id === id) || AUDIT_FINDING_SEVERITY[0];

    return (
        <div className="page">
            <div className="page-header flex justify-between gap-md" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">
                        <ShieldCheck size={28} style={{ color: 'var(--color-info)' }} />
                        İç Denetim (Audit) Yönetimi
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 9.2 — Planlama ve Bulgu Takip</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAuditModal(true)}>
                    <Plus size={18} /> Yeni Denetim Planla
                </button>
            </div>

            {selectedAuditForFindings ? (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-sm">
                            <button className="btn btn-ghost btn-icon" onClick={() => setSelectedAuditForFindings(null)}>←</button>
                            <h2>{selectedAuditForFindings.title} - Denetim Bulguları</h2>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowFindingModal(true)}>
                            <Plus size={14} /> Yeni Bulgu Ekle
                        </button>
                    </div>

                    <div className="glass-card mb-4" style={{ padding: 'var(--space-lg)' }}>
                        {findings.length === 0 ? (
                            <p className="text-muted">Bu tetkike ait henüz bulgu kaydedilmemiş.</p>
                        ) : (
                            <div className="flex flex-col gap-sm">
                                {findings.map(f => {
                                    const dev = getSeverityInfo(f.severity);
                                    return (
                                        <div key={f.id} className="bg-secondary p-4 flex justify-between items-start" style={{ borderRadius: 'var(--radius-md)' }}>
                                            <div>
                                                <div className="flex items-center gap-sm mb-1">
                                                    <span className="badge" style={{ background: `${dev.color}15`, color: dev.color }}>
                                                        {dev.icon} {dev.label}
                                                    </span>
                                                    <span className="text-muted text-xs">Standard/Şart: {f.requirement}</span>
                                                </div>
                                                <p className="text-sm font-medium mt-2">{f.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-sm">
                                                <select className="form-select text-xs" style={{ padding: '2px 8px', height: 'auto' }}
                                                    value={f.status} onChange={async (e) => {
                                                        await updateAuditFinding(f.id, { status: e.target.value });
                                                        loadFindings(selectedAuditForFindings.id);
                                                    }}
                                                >
                                                    <option value="open">Açık</option>
                                                    <option value="dcf_opened">DÖF Açıldı</option>
                                                    <option value="closed">Kapatıldı</option>
                                                </select>
                                                <button className="text-danger text-xs font-medium" onClick={() => handleFindingDelete(f.id)}>Sil</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="glass-card mb-4" style={{ padding: 'var(--space-md)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" placeholder="Denetim adı veya departman ara..."
                                value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center p-8 text-muted">Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <ClipboardList size={48} className="text-muted mb-4" />
                            <h3>Denetim planı bulunamadı</h3>
                        </div>
                    ) : (
                        <div className="grid grid-2 gap-md">
                            {filtered.map(audit => {
                                const statusInfo = getStatusInfo(audit.status);
                                return (
                                    <div key={audit.id} className="glass-card p-4">
                                        <div className="flex justify-between mb-3">
                                            <h3 className="font-bold text-lg">{audit.title}</h3>
                                            <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-secondary mb-3">{audit.scope}</p>

                                        <div className="grid grid-2 gap-sm mb-4 bg-tertiary p-3" style={{ borderRadius: 'var(--radius-sm)' }}>
                                            <div>
                                                <div className="text-xs text-muted mb-1">Departman / Alan</div>
                                                <div className="text-sm font-medium">{audit.auditoryDepartment}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted mb-1">Baş Denetçi</div>
                                                <div className="text-sm font-medium">{audit.auditor}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted mb-1">Planlanan Tarih</div>
                                                <div className="text-sm font-medium">{new Date(audit.plannedDate).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenFindings(audit)}>
                                                <ClipboardList size={14} /> Bulguları Yönet
                                            </button>
                                            <button className="text-danger text-sm font-medium" onClick={() => handleAuditDelete(audit.id)}>İptal / Sil</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Yeni Denetim Modalı */}
            {showAuditModal && (
                <div className="modal-overlay" onClick={() => setShowAuditModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yeni İç Tetkik Planı</h2>
                            <button className="btn btn-ghost" onClick={() => setShowAuditModal(false)}>X</button>
                        </div>
                        <form onSubmit={handleAuditSubmit}>
                            <div className="modal-body gap-md">
                                <div className="form-group">
                                    <label className="form-label">Denetim Başlığı</label>
                                    <input className="form-input" required value={auditData.title} onChange={e => setAuditData({ ...auditData, title: e.target.value })} placeholder="Örn: 2026 Q1 Hangar Bölgesi" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kapsam / Amaç</label>
                                    <textarea className="form-textarea" required rows={2} value={auditData.scope} onChange={e => setAuditData({ ...auditData, scope: e.target.value })} placeholder="Tehlikeli madde depoları ve acil çıkışların denetimi..." />
                                </div>
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Planlanan Tarih</label>
                                        <input className="form-input" type="date" required value={auditData.plannedDate} onChange={e => setAuditData({ ...auditData, plannedDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Denetlenen Departman</label>
                                        <select className="form-select" value={auditData.auditoryDepartment} onChange={e => setAuditData({ ...auditData, auditoryDepartment: e.target.value })}>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Durum</label>
                                    <select className="form-select" value={auditData.status} onChange={e => setAuditData({ ...auditData, status: e.target.value })}>
                                        {AUDIT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAuditModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Planla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Yeni Bulgu Modalı */}
            {showFindingModal && (
                <div className="modal-overlay" onClick={() => setShowFindingModal(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yeni Denetim Bulgusu</h2>
                            <button className="btn btn-ghost" onClick={() => setShowFindingModal(false)}>X</button>
                        </div>
                        <form onSubmit={handleFindingSubmit}>
                            <div className="modal-body gap-md">
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Bulgu Seviyesi</label>
                                        <select className="form-select" value={findingData.severity} onChange={e => setFindingData({ ...findingData, severity: e.target.value })}>
                                            {AUDIT_FINDING_SEVERITY.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">İlgili Şart / Standart</label>
                                        <input className="form-input" required value={findingData.requirement} onChange={e => setFindingData({ ...findingData, requirement: e.target.value })} placeholder="Örn: ISO 45001 - 8.1.2" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Objektif Kanıt / Açıklama</label>
                                    <textarea className="form-textarea" required rows={3} value={findingData.description} onChange={e => setFindingData({ ...findingData, description: e.target.value })} placeholder="Mutfak alanındaki yangın tüplerinin periyodik bakımlarının aksadığı gözlemlenmiştir..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowFindingModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
