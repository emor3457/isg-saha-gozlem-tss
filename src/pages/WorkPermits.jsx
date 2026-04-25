import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ShieldAlert, Plus, FileText, CheckCircle, Clock, XCircle, ChevronRight,
    X, AlertTriangle, QrCode, Camera, ArrowRight, Trash2, Eye, Lock,
    MapPin, User, Calendar, ClipboardList, Shield, Search, Filter
} from 'lucide-react';
import { workPermitService } from '../services/workPermitService';
import jsQR from 'jsqr';

/* ═══════════════════════════════════════════════════
   İŞ İZİNLERİ (PERMIT TO WORK) — ANA SAYFA
   ═══════════════════════════════════════════════════ */
const WorkPermits = () => {
    const [permits, setPermits] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [editPermit, setEditPermit] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, s] = await Promise.all([
                workPermitService.getPermits(),
                workPermitService.getStats()
            ]);
            setPermits(data);
            setStats(s);
        } catch (e) {
            console.error('İzin verileri yüklenemedi:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredPermits = permits.filter(p => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                (p.type || '').toLowerCase().includes(q) ||
                (p.location || '').toLowerCase().includes(q) ||
                (p.applicant || '').toLowerCase().includes(q) ||
                (p.qrCode || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    const STATUS_FLOW = workPermitService.getStatusFlow();
    const PERMIT_TYPES = workPermitService.getPermitTypes();

    const getTypeInfo = (val) => PERMIT_TYPES.find(t => t.value === val) || { label: val, color: '#64748B', icon: '📄' };

    const getStatusBadge = (status) => {
        const info = STATUS_FLOW[status];
        if (!info) return <span className="badge" style={{ background: 'rgba(100,116,139,.15)', color: '#94a3b8' }}>{status}</span>;
        return (
            <span className="badge" style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}30` }}>
                {status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: info.color, display: 'inline-block', marginRight: 4, animation: 'pulse 2s infinite' }} />}
                {info.label}
            </span>
        );
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu iş iznini silmek istediğinize emin misiniz?')) return;
        await workPermitService.deletePermit(id);
        loadData();
    };

    /* ─── STAT CARDS ─── */
    const statCards = [
        { label: 'Toplam İzin', value: stats.total || 0, color: '#94a3b8', icon: FileText },
        { label: 'Onay Bekliyor', value: stats.pending || 0, color: '#F59E0B', icon: Clock },
        { label: 'Aktif İzin', value: stats.active || 0, color: '#22C55E', icon: CheckCircle },
        { label: 'Reddedilen', value: stats.rejected || 0, color: '#EF4444', icon: XCircle },
    ];

    return (
        <div className="page" style={{ maxWidth: 1280 }}>
            {/* HEADER */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title"><ShieldAlert style={{ color: 'var(--color-primary)' }} /> İş İzinleri (Permit to Work)</h1>
                    <p className="page-subtitle">Yüksek riskli çalışmalar için onay akışı ve saha doğrulaması</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-secondary" onClick={() => setShowQR(true)}>
                        <QrCode size={18} /> QR Doğrula
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditPermit(null); setShowForm(true); }}>
                        <Plus size={18} /> Yeni İş İzni
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                {statCards.map(s => (
                    <div key={s.label} className="glass-card stat-card" style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-value" style={{ backgroundImage: `linear-gradient(135deg, ${s.color}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: `${s.color}15` }}>
                                <s.icon size={22} style={{ color: s.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FILTER BAR */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder="İzin tipi, lokasyon veya QR kodu ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[{ v: 'all', l: 'Tümü' }, { v: 'draft', l: 'Taslak' }, { v: 'pending_validation', l: 'Doğrulama' }, { v: 'pending_approval', l: 'Onay' }, { v: 'active', l: 'Aktif' }, { v: 'closed', l: 'Kapalı' }].map(f => (
                        <button key={f.v} onClick={() => setFilterStatus(f.v)}
                            className={`btn btn-sm ${filterStatus === f.v ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.75rem' }}>{f.l}</button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClipboardList size={18} style={{ color: 'var(--text-muted)' }} /> İş İzni Kayıtları
                        <span className="badge badge-primary" style={{ marginLeft: 4 }}>{filteredPermits.length}</span>
                    </h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.15)' }}>
                                <th style={thStyle}>İzin Tipi</th>
                                <th style={thStyle}>Lokasyon</th>
                                <th style={thStyle}>Talep Eden</th>
                                <th style={thStyle}>Tarih</th>
                                <th style={thStyle}>Durum</th>
                                <th style={thStyle}>QR Kod</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                            ) : filteredPermits.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <ShieldAlert size={40} style={{ opacity: 0.3 }} />
                                        <span>Kayıt bulunamadı</span>
                                    </div>
                                </td></tr>
                            ) : filteredPermits.map(p => {
                                const typeInfo = getTypeInfo(p.type);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                        onClick={() => setShowDetail(p)}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 18 }}>{typeInfo.icon}</span>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{typeInfo.label}</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} style={{ color: 'var(--text-muted)' }} />{p.location}</span></td>
                                        <td style={tdStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} style={{ color: 'var(--text-muted)' }} />{p.applicant}</span></td>
                                        <td style={tdStyle}>{p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-'}</td>
                                        <td style={tdStyle}>{getStatusBadge(p.status)}</td>
                                        <td style={tdStyle}><code style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', padding: '2px 6px', borderRadius: 4 }}>{p.qrCode}</code></td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(p)} title="Detay"><Eye size={16} /></button>
                                                {p.status === 'draft' && (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(p.id)} title="Sil"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}
            {showForm && <PermitFormModal onClose={() => setShowForm(false)} onSave={loadData} editData={editPermit} />}
            {showDetail && <PermitDetailModal permit={showDetail} onClose={() => { setShowDetail(null); loadData(); }} onEdit={p => { setEditPermit(p); setShowForm(true); setShowDetail(null); }} />}
            {showQR && <QRVerificationModal onClose={() => setShowQR(false)} />}
        </div>
    );
};

const thStyle = { padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' };
const tdStyle = { padding: '12px 16px', color: 'var(--text-secondary)' };

/* ═══════════════════════════════════════════════════
   İŞ İZNİ OLUŞTURMA / DÜZENLEME FORMU
   ═══════════════════════════════════════════════════ */
const PermitFormModal = ({ onClose, onSave, editData }) => {
    const PERMIT_TYPES = workPermitService.getPermitTypes();
    const [form, setForm] = useState(editData || {
        type: '',
        location: '',
        applicant: '',
        validator: '',
        approver: '',
        startDate: '',
        endDate: '',
        description: '',
        precautions: '',
        isLoto: false,
        hazards: '',
        equipmentUsed: '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.type) e.type = 'İzin tipi seçiniz';
        if (!form.location) e.location = 'Lokasyon giriniz';
        if (!form.applicant) e.applicant = 'Talep eden kişi giriniz';
        if (!form.validator) e.validator = 'Alan sorumlusu giriniz';
        if (!form.approver) e.approver = 'İSG Uzmanı giriniz';
        if (!form.startDate) e.startDate = 'Başlangıç tarihi seçiniz';
        if (!form.endDate) e.endDate = 'Bitiş tarihi seçiniz';
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) e.endDate = 'Bitiş tarihi başlangıçtan önce olamaz';
        if (!form.description) e.description = 'İş tanımı giriniz';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (editData?.id) {
                await workPermitService.updatePermit(editData.id, form);
            } else {
                await workPermitService.addPermit(form);
            }
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const FieldError = ({ field }) => errors[field] ? <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: 2 }}>{errors[field]}</span> : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '92vh' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={20} style={{ color: 'var(--color-primary)' }} />
                        {editData ? 'İş İznini Düzenle' : 'Yeni İş İzni Talebi'}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* İzin Tipi */}
                    <div className="form-group">
                        <label className="form-label">İzin Tipi *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {PERMIT_TYPES.map(t => (
                                <button key={t.value}
                                    type="button"
                                    onClick={() => handleChange('type', t.value)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${form.type === t.value ? t.color : 'var(--border-color)'}`,
                                        background: form.type === t.value ? `${t.color}15` : 'var(--bg-tertiary)',
                                        color: form.type === t.value ? t.color : 'var(--text-secondary)',
                                        display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 150ms ease',
                                    }}>
                                    <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
                                </button>
                            ))}
                        </div>
                        <FieldError field="type" />
                    </div>

                    {/* LOTO Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: form.isLoto ? 'rgba(99,102,241,.12)' : 'transparent', border: '1px solid ' + (form.isLoto ? 'rgba(99,102,241,.3)' : 'var(--border-color)'), transition: 'all 150ms' }}>
                        <input type="checkbox" checked={form.isLoto} onChange={e => handleChange('isLoto', e.target.checked)} style={{ accentColor: '#6366F1', width: 18, height: 18 }} />
                        <Lock size={16} style={{ color: form.isLoto ? '#6366F1' : 'var(--text-muted)' }} />
                        <span style={{ color: form.isLoto ? '#A5B4FC' : 'var(--text-secondary)' }}>LOTO (Etiketle-Kilitle) Protokolü Gerekli</span>
                    </label>

                    {/* Location + Description */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Lokasyon / Çalışma Alanı *</label>
                            <input className="form-input" placeholder="ör: Hangar 3 / Çatı Katı" value={form.location} onChange={e => handleChange('location', e.target.value)} />
                            <FieldError field="location" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Yapılacak İş Tanımı *</label>
                            <input className="form-input" placeholder="ör: Boru hattı kaynak onarımı" value={form.description} onChange={e => handleChange('description', e.target.value)} />
                            <FieldError field="description" />
                        </div>
                    </div>

                    {/* Applicant / Validator / Approver */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Talep Eden (İşi Yapan) *</label>
                            <input className="form-input" placeholder="Ad Soyad" value={form.applicant} onChange={e => handleChange('applicant', e.target.value)} />
                            <FieldError field="applicant" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Alan Sorumlusu (Doğrulayıcı) *</label>
                            <input className="form-input" placeholder="Ad Soyad" value={form.validator} onChange={e => handleChange('validator', e.target.value)} />
                            <FieldError field="validator" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">İSG Uzmanı (Onaylayıcı) *</label>
                            <input className="form-input" placeholder="Ad Soyad" value={form.approver} onChange={e => handleChange('approver', e.target.value)} />
                            <FieldError field="approver" />
                        </div>
                    </div>

                    {/* Date range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Başlangıç Tarihi *</label>
                            <input className="form-input" type="datetime-local" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                            <FieldError field="startDate" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bitiş Tarihi *</label>
                            <input className="form-input" type="datetime-local" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                            <FieldError field="endDate" />
                        </div>
                    </div>

                    {/* Precautions & Hazards */}
                    <div className="form-group">
                        <label className="form-label">Alınacak Güvenlik Önlemleri</label>
                        <textarea className="form-textarea" placeholder="İş süresince alınması gereken KKD, bariyer, gözetim vb. güvenlik önemlerini yazınız..." rows={3} value={form.precautions} onChange={e => handleChange('precautions', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Beklenen Tehlikeler</label>
                            <textarea className="form-textarea" placeholder="Düşme, yanma, elektrik çarpması vb." rows={2} value={form.hazards} onChange={e => handleChange('hazards', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kullanılacak Ekipman</label>
                            <textarea className="form-textarea" placeholder="Kaynak makinesi, iş iskelesi vb." rows={2} value={form.equipmentUsed} onChange={e => handleChange('equipmentUsed', e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Kaydediliyor...' : editData ? 'Güncelle' : 'Taslak Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════
   İŞ İZNİ DETAY — ONAY AKIŞI (Stepper)
   ═══════════════════════════════════════════════════ */
const PermitDetailModal = ({ permit: initialPermit, onClose, onEdit }) => {
    const [permit, setPermit] = useState(initialPermit);
    const [actionNote, setActionNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const STATUS_FLOW = workPermitService.getStatusFlow();
    const APPROVAL_STEPS = workPermitService.getApprovalSteps();
    const PERMIT_TYPES = workPermitService.getPermitTypes();

    const typeInfo = PERMIT_TYPES.find(t => t.value === permit.type) || { label: permit.type, color: '#64748B', icon: '📄' };
    const currentStepIndex = APPROVAL_STEPS.findIndex(s => s.key === permit.status);
    const currentFlowInfo = STATUS_FLOW[permit.status];

    const refreshPermit = async () => {
        const updated = await workPermitService.getPermitById(permit.id);
        setPermit(updated);
    };

    const handleAdvance = async () => {
        setProcessing(true);
        try {
            await workPermitService.advanceStatus(permit.id, 'İSG Sistemi', actionNote);
            setActionNote('');
            await refreshPermit();
        } catch (e) {
            alert(e.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!actionNote.trim()) { alert('Red sebebi girmelisiniz.'); return; }
        setProcessing(true);
        try {
            await workPermitService.rejectPermit(permit.id, 'İSG Sistemi', actionNote);
            setActionNote('');
            await refreshPermit();
        } catch (e) {
            alert(e.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '94vh' }}>
                <div className="modal-header" style={{ background: `linear-gradient(135deg, ${typeInfo.color}10, transparent)` }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{typeInfo.icon}</span>
                        {typeInfo.label}
                    </h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {permit.status === 'draft' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(permit)}>Düzenle</button>
                        )}
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* ── APPROVAL STEPPER ── */}
                    <div>
                        <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Onay Akışı</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'auto', paddingBottom: 4 }}>
                            {APPROVAL_STEPS.map((step, idx) => {
                                const isCompleted = idx < currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                const isRejected = permit.status === 'rejected' && isCurrent;
                                const stepColor = isRejected ? '#EF4444' : isCompleted ? '#22C55E' : isCurrent ? '#F59E0B' : 'var(--bg-tertiary)';
                                const textColor = isCompleted || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)';
                                return (
                                    <React.Fragment key={step.key}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90, flex: '0 0 auto' }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: isCompleted ? stepColor : 'transparent',
                                                border: `2.5px solid ${stepColor}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isCompleted ? '#fff' : stepColor,
                                                fontSize: '0.8125rem', fontWeight: 700,
                                                transition: 'all 300ms ease',
                                                boxShadow: isCurrent ? `0 0 12px ${stepColor}40` : 'none',
                                            }}>
                                                {isCompleted ? <CheckCircle size={18} /> : isRejected ? <XCircle size={18} /> : idx + 1}
                                            </div>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: textColor, textAlign: 'center', lineHeight: 1.2 }}>{step.label}</span>
                                            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{step.role === 'applicant' ? 'İşi Yapan' : step.role === 'validator' ? 'Alan Sor.' : 'İSG Uzm.'}</span>
                                        </div>
                                        {idx < APPROVAL_STEPS.length - 1 && (
                                            <div style={{ flex: 1, height: 2, minWidth: 20, background: isCompleted ? '#22C55E' : 'var(--border-color)', transition: 'background 300ms ease', margin: '0 -4px', marginBottom: 36 }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── PERMIT INFO ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <InfoRow icon={<MapPin size={16} />} label="Lokasyon" value={permit.location} />
                        <InfoRow icon={<User size={16} />} label="Talep Eden" value={permit.applicant} />
                        <InfoRow icon={<User size={16} />} label="Alan Sorumlusu" value={permit.validator} />
                        <InfoRow icon={<Shield size={16} />} label="İSG Uzmanı" value={permit.approver} />
                        <InfoRow icon={<Calendar size={16} />} label="Başlangıç" value={permit.startDate ? new Date(permit.startDate).toLocaleString('tr-TR') : '-'} />
                        <InfoRow icon={<Calendar size={16} />} label="Bitiş" value={permit.endDate ? new Date(permit.endDate).toLocaleString('tr-TR') : '-'} />
                    </div>

                    {permit.description && (
                        <div style={{ background: 'rgba(0,0,0,.15)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>İŞ TANIMI</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{permit.description}</div>
                        </div>
                    )}

                    {permit.precautions && (
                        <div style={{ background: 'rgba(34,197,94,.06)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-success)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: 4 }}>GÜVENLİK ÖNLEMLERİ</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{permit.precautions}</div>
                        </div>
                    )}

                    {permit.isLoto && (
                        <div style={{ background: 'rgba(99,102,241,.1)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(99,102,241,.2)' }}>
                            <Lock size={18} style={{ color: '#818CF8' }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A5B4FC' }}>LOTO (Etiketle-Kilitle) Protokolü Uygulanmaktadır</span>
                        </div>
                    )}

                    {/* QR Code */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,.1)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                        <QrCode size={28} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAHA DOĞRULAMA QR KODU</div>
                            <code style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '.1em' }}>{permit.qrCode}</code>
                        </div>
                    </div>

                    {/* ── APPROVAL HISTORY ── */}
                    {permit.approvalHistory && permit.approvalHistory.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Onay Geçmişi</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {permit.approvalHistory.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_FLOW[h.status]?.color || '#64748B', marginTop: 5, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{STATUS_FLOW[h.status]?.label || h.status}</span>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>— {h.by}</span>
                                            {h.note && <div style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.75rem' }}>{h.note}</div>}
                                        </div>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(h.at).toLocaleString('tr-TR')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ACTION BUTTONS ── */}
                    {currentFlowInfo?.action && permit.status !== 'rejected' && permit.status !== 'closed' && (
                        <div style={{ background: 'rgba(255,140,0,.06)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,140,0,.15)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8, textTransform: 'uppercase' }}>İşlem Yap</div>
                            <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                                <input className="form-input" placeholder="Not ekle (opsiyonel, red durumunda zorunlu)" value={actionNote} onChange={e => setActionNote(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-success" onClick={handleAdvance} disabled={processing} style={{ flex: 1 }}>
                                    <ArrowRight size={16} /> {currentFlowInfo.action}
                                </button>
                                {['pending_validation', 'pending_approval'].includes(permit.status) && (
                                    <button className="btn btn-danger" onClick={handleReject} disabled={processing}>
                                        <XCircle size={16} /> Reddet
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ color: 'var(--text-muted)', minWidth: 100 }}>{label}:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value || '-'}</span>
    </div>
);

/* ═══════════════════════════════════════════════════
   QR DOĞRULAMA MODALI — Kamera ile QR Tarama
   ═══════════════════════════════════════════════════ */
const QRVerificationModal = ({ onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');

    const startCamera = useCallback(async () => {
        setError('');
        setResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setScanning(true);
            scanLoop();
        } catch (err) {
            setError('Kamera erişimi reddedildi veya desteklenmiyor. Manuel kod girişi kullanabilirsiniz.');
        }
    }, []);

    const scanLoop = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animRef.current = requestAnimationFrame(scanLoop);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
        if (code) {
            verifyCode(code.data);
            stopCamera();
            return;
        }
        animRef.current = requestAnimationFrame(scanLoop);
    };

    const stopCamera = () => {
        setScanning(false);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const verifyCode = async (code) => {
        const res = await workPermitService.verifyByQR(code);
        setResult(res);
    };

    const handleManualVerify = () => {
        if (!manualCode.trim()) return;
        verifyCode(manualCode.trim());
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const STATUS_FLOW = workPermitService.getStatusFlow();
    const PERMIT_TYPES = workPermitService.getPermitTypes();

    return (
        <div className="modal-overlay" onClick={() => { stopCamera(); onClose(); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QrCode size={20} style={{ color: 'var(--color-primary)' }} />
                        QR ile Saha Doğrulaması
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={() => { stopCamera(); onClose(); }}><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                    {/* Camera View */}
                    <div style={{ position: 'relative', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }} playsInline muted />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        {!scanning && !result && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                                <Camera size={48} style={{ opacity: 0.4 }} />
                                <button className="btn btn-primary" onClick={startCamera}>
                                    <Camera size={18} /> Kamerayı Aç
                                </button>
                            </div>
                        )}
                        {scanning && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <div style={{ width: 200, height: 200, border: '3px solid rgba(255,140,0,.6)', borderRadius: 16, animation: 'pulse 2s infinite' }} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    {/* Manual Code Input */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input className="form-input" placeholder="Veya QR kodunu manuel girin (ör: PTW-A1B2C3D4)" value={manualCode} onChange={e => setManualCode(e.target.value)} style={{ flex: 1 }}
                            onKeyDown={e => { if (e.key === 'Enter') handleManualVerify(); }} />
                        <button className="btn btn-primary" onClick={handleManualVerify}>Doğrula</button>
                    </div>

                    {/* Verification Result */}
                    {result && (
                        <div style={{
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${result.valid ? 'var(--color-success)' : 'var(--color-danger)'}`,
                            background: result.valid ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                {result.valid ? <CheckCircle size={28} style={{ color: 'var(--color-success)' }} /> : <XCircle size={28} style={{ color: 'var(--color-danger)' }} />}
                                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: result.valid ? 'var(--color-success)' : 'var(--color-danger)' }}>{result.message}</span>
                            </div>
                            {result.permit && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8125rem' }}>
                                    <InfoRow icon={<FileText size={14} />} label="İzin Tipi" value={PERMIT_TYPES.find(t => t.value === result.permit.type)?.label || result.permit.type} />
                                    <InfoRow icon={<MapPin size={14} />} label="Lokasyon" value={result.permit.location} />
                                    <InfoRow icon={<User size={14} />} label="Talep Eden" value={result.permit.applicant} />
                                    <InfoRow icon={<Calendar size={14} />} label="Bitiş" value={result.permit.endDate ? new Date(result.permit.endDate).toLocaleString('tr-TR') : '-'} />
                                </div>
                            )}
                            {result.valid && (
                                <div style={{ marginTop: 12, textAlign: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setResult(null); setManualCode(''); }}>
                                        Yeni Tarama
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkPermits;
