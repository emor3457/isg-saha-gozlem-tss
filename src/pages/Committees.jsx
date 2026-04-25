import React, { useState, useEffect } from 'react';
import {
    Users2, CalendarDays, Plus, X, Trash2, AlertTriangle, CheckSquare,
    Search, Clock, FileText, Gavel, ArrowRight, CheckCircle, Link2,
    BarChart3, Target, ChevronRight, XCircle
} from 'lucide-react';
import { committeeService } from '../services/committeeService';

/* ═══════════════════════════════════════════
   İSG KURULLARI VE TOPLANTI YÖNETİMİ
   ═══════════════════════════════════════════ */
const Committees = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('committees');
    const [showCommitteeForm, setShowCommitteeForm] = useState(false);
    const [showMeetingForm, setShowMeetingForm] = useState(null); // null or committeeId
    const [showMeetingDetail, setShowMeetingDetail] = useState(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try { setStats(await committeeService.getStats()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const statCards = [
        { label: 'Aktif Kurul', value: stats.committeeCount || 0, color: '#6366F1', icon: Users2 },
        { label: 'Toplantı', value: stats.meetingCount || 0, color: '#3B82F6', icon: CalendarDays },
        { label: 'Açık Karar', value: stats.activeDecisions || 0, color: '#F59E0B', icon: Gavel },
        { label: 'Gecikmiş', value: stats.overdueDecisions || 0, color: stats.overdueDecisions > 0 ? '#EF4444' : '#22C55E', icon: AlertTriangle },
    ];

    const TABS = [
        { key: 'committees', label: 'Kurullar', icon: Users2 },
        { key: 'meetings', label: 'Toplantılar', icon: CalendarDays },
        { key: 'decisions', label: 'Kararlar & DÖF', icon: Gavel, badge: stats.activeDecisions || 0 },
    ];

    return (
        <div className="page" style={{ maxWidth: 1280 }}>
            {/* HEADER */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title"><Users2 style={{ color: '#6366F1' }} /> İSG Kurulları ve Toplantıları</h1>
                    <p className="page-subtitle">Kurul kararları, toplantı tutanakları ve DÖF (Düzeltici/Önleyici Faaliyet) takibi</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowCommitteeForm(true)}><Users2 size={16} /> Kurul Tanımla</button>
                    <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 2px 8px rgba(99,102,241,.3)' }}
                        onClick={() => setShowMeetingForm('any')}><Plus size={16} /> Yeni Toplantı</button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                {statCards.map(s => (
                    <div key={s.label} className="glass-card stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-value" style={{ backgroundImage: `linear-gradient(135deg, ${s.color}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: `${s.color}15` }}><s.icon size={22} style={{ color: s.color }} /></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-color)' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, justifyContent: 'center', position: 'relative' }}>
                        <t.icon size={16} /> {t.label}
                        {t.badge > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{t.badge}</span>}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'committees' && <CommitteesTab onRefresh={loadAll} onMeeting={setShowMeetingForm} />}
            {activeTab === 'meetings' && <MeetingsTab onRefresh={loadAll} onDetail={setShowMeetingDetail} />}
            {activeTab === 'decisions' && <DecisionsTab onRefresh={loadAll} />}

            {/* MODALS */}
            {showCommitteeForm && <CommitteeFormModal onClose={() => setShowCommitteeForm(false)} onSave={loadAll} />}
            {showMeetingForm && <MeetingFormModal defaultCommitteeId={showMeetingForm !== 'any' ? showMeetingForm : null} onClose={() => setShowMeetingForm(null)} onSave={loadAll} />}
            {showMeetingDetail && <MeetingDetailModal meeting={showMeetingDetail} onClose={() => { setShowMeetingDetail(null); loadAll(); }} />}
        </div>
    );
};

/* ─── HELPERS ─── */
const thS = { padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' };
const tdS = { padding: '12px 16px', color: 'var(--text-secondary)' };

/* ═══ KURULLAR TABı ═══ */
const CommitteesTab = ({ onRefresh, onMeeting }) => {
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => { setLoading(true); setCommittees(await committeeService.getCommittees()); setLoading(false); })();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Bu kurulu, tüm toplantı ve kararlarıyla birlikte silmek istediğinize emin misiniz?')) return;
        await committeeService.deleteCommittee(id);
        setCommittees(await committeeService.getCommittees());
        onRefresh();
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Users2 size={18} style={{ color: 'var(--text-muted)' }} /> Tanımlı Kurullar <span className="badge badge-primary">{committees.length}</span></h2>
            </div>
            {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
             : committees.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}><Users2 size={40} style={{ opacity: .3, margin: '0 auto 8px' }} /><div>Tanımlı kurul yok. "Kurul Tanımla" butonunu kullanın.</div></div>
             : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)', padding: 'var(--space-lg)' }}>
                {committees.map(c => {
                    const typeInfo = committeeService.getTypeInfo(c.type);
                    const freqInfo = committeeService.getMeetingFrequencies().find(f => f.value === c.frequency);
                    return (
                        <div key={c.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)', position: 'relative', transition: 'all 200ms' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <span style={{ fontSize: 32 }}>{typeInfo.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{typeInfo.label}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span>Başkan: <strong style={{ color: 'var(--text-primary)' }}>{c.chairman || '-'}</strong></span>
                                <span>Sekreter: <strong style={{ color: 'var(--text-primary)' }}>{c.secretary || '-'}</strong></span>
                                <span>Toplantı: <strong style={{ color: 'var(--text-primary)' }}>{freqInfo?.label || '-'}</strong></span>
                                {c.members && <span>Üyeler: <strong style={{ color: 'var(--text-primary)' }}>{c.members}</strong></span>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }} onClick={() => onMeeting(c.id)}><CalendarDays size={14} /> Toplantı Ekle</button>
                                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>}
        </div>
    );
};

/* ═══ TOPLANTILAR TABı ═══ */
const MeetingsTab = ({ onRefresh, onDetail }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const raw = await committeeService.getMeetings();
            setMeetings(await committeeService.enrichMeetings(raw));
            setLoading(false);
        })();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Bu toplantıyı tüm kararlarıyla birlikte silmek istediğinize emin misiniz?')) return;
        await committeeService.deleteMeeting(id);
        const raw = await committeeService.getMeetings();
        setMeetings(await committeeService.enrichMeetings(raw));
        onRefresh();
    };

    const getMeetingStatusBadge = (status) => {
        const map = { planned: { l: 'Planlandı', c: '#3B82F6' }, completed: { l: 'Gerçekleşti', c: '#22C55E' }, cancelled: { l: 'İptal', c: '#6B7280' } };
        const s = map[status] || { l: status, c: '#6B7280' };
        return <span className="badge" style={{ background: `${s.c}20`, color: s.c, border: `1px solid ${s.c}30` }}>{s.l}</span>;
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={18} style={{ color: 'var(--text-muted)' }} /> Tüm Toplantılar <span className="badge badge-primary">{meetings.length}</span></h2>
            </div>
            {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
             : meetings.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}><CalendarDays size={40} style={{ opacity: .3, margin: '0 auto 8px' }} /><div>Kayıtlı toplantı yok</div></div>
             : <div style={{ padding: 'var(--space-md)' }}>
                {meetings.map(m => {
                    const typeInfo = committeeService.getTypeInfo(m.committeeType);
                    const mDate = new Date(m.date);
                    return (
                        <div key={m.id} onClick={() => onDetail(m)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', marginBottom: 8, background: 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${m.status === 'completed' ? '#22C55E' : '#3B82F6'}`, cursor: 'pointer', transition: 'all 150ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.1)'}>
                            {/* Tarih */}
                            <div style={{ textAlign: 'center', minWidth: 50, padding: '6px 0', background: 'rgba(99,102,241,.1)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#6366F1' }}>{mDate.toLocaleString('tr-TR', { month: 'short' })}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{mDate.getDate()}</div>
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>{typeInfo.icon}</span> {m.committeeName}
                                    {getMeetingStatusBadge(m.status)}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    📍 {m.location || 'Belirtilmemiş'} · 🕐 {m.time || '-'} · 📋 {m.decisionCount} karar ({m.openDecisions} açık)
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={e => { e.stopPropagation(); handleDelete(m.id); }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>}
        </div>
    );
};

/* ═══ KARARLAR & DÖF TABı ═══ */
const DecisionsTab = ({ onRefresh }) => {
    const [decisions, setDecisions] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [d, m] = await Promise.all([committeeService.getAllDecisions(), committeeService.getMeetings()]);
            const enrichedM = await committeeService.enrichMeetings(m);
            setDecisions(d);
            setMeetings(enrichedM);
            setLoading(false);
        })();
    }, []);

    const getMeetingInfo = (meetingId) => meetings.find(m => m.id === meetingId) || {};
    const now = new Date();

    const filteredDecisions = filterStatus === 'all' ? decisions : decisions.filter(d => {
        if (filterStatus === 'overdue') return d.dueDate && new Date(d.dueDate) < now && d.status !== 'completed' && d.status !== 'cancelled';
        return d.status === filterStatus;
    });

    const handleStatusChange = async (id, newStatus) => {
        await committeeService.updateDecision(id, { status: newStatus, ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}) });
        setDecisions(await committeeService.getAllDecisions());
        onRefresh();
    };

    const handleLinkDof = async (id) => {
        try {
            const actionId = await committeeService.linkDecisionToAction(id);
            alert(`DÖF aksiyonu oluşturuldu (ID: ${actionId}). Aksiyon Takip modülünden izleyebilirsiniz.`);
            setDecisions(await committeeService.getAllDecisions());
            onRefresh();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Gavel size={18} style={{ color: '#F59E0B' }} /> Kurul Kararları & DÖF Bağlantıları <span className="badge badge-primary">{filteredDecisions.length}</span></h2>
                <div style={{ display: 'flex', gap: 4 }}>
                    {[{ v: 'all', l: 'Tümü' }, { v: 'open', l: '🟡 Açık' }, { v: 'in_progress', l: '🔵 Devam' }, { v: 'overdue', l: '🔴 Gecikmiş' }, { v: 'completed', l: '✅ Tamamlandı' }].map(f => (
                        <button key={f.v} onClick={() => setFilterStatus(f.v)} className={`btn btn-sm ${filterStatus === f.v ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.75rem' }}>{f.l}</button>
                    ))}
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.12)' }}>
                        <th style={thS}>Karar</th><th style={thS}>Toplantı</th><th style={thS}>Sorumlu</th><th style={thS}>Termin</th><th style={thS}>Öncelik</th><th style={thS}>Durum</th><th style={thS}>DÖF</th><th style={{ ...thS, textAlign: 'right' }}>İşlem</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                         : filteredDecisions.length === 0 ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıt bulunamadı</td></tr>
                         : filteredDecisions.map(d => {
                            const mInfo = getMeetingInfo(d.meetingId);
                            const pri = committeeService.getPriorityInfo(d.priority);
                            const st = committeeService.getStatusInfo(d.status);
                            const isOverdue = d.dueDate && new Date(d.dueDate) < now && d.status !== 'completed' && d.status !== 'cancelled';

                            return (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', background: isOverdue ? 'rgba(239,68,68,.04)' : 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = isOverdue ? 'rgba(239,68,68,.04)' : 'transparent'}>
                                    <td style={{ ...tdS, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 250 }}>{d.description}</td>
                                    <td style={{ ...tdS, fontSize: '0.8125rem' }}>{mInfo.committeeName || '-'}</td>
                                    <td style={tdS}>{d.responsiblePerson || '-'}</td>
                                    <td style={{ ...tdS, fontWeight: isOverdue ? 700 : 400, color: isOverdue ? '#EF4444' : 'var(--text-secondary)' }}>
                                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : '-'}
                                        {isOverdue && <span style={{ display: 'block', fontSize: '0.7rem' }}>⛔ Gecikmiş</span>}
                                    </td>
                                    <td style={tdS}><span className="badge" style={{ background: `${pri.color}20`, color: pri.color, border: `1px solid ${pri.color}30` }}>{pri.label}</span></td>
                                    <td style={tdS}><span className="badge" style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span></td>
                                    <td style={tdS}>
                                        {d.relatedActionId ? (
                                            <span className="badge" style={{ background: 'rgba(34,197,94,.15)', color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={12} /> DÖF #{d.relatedActionId}</span>
                                        ) : (
                                            <button className="btn btn-ghost btn-sm" style={{ color: '#6366F1', fontSize: '0.75rem' }} onClick={() => handleLinkDof(d.id)}><ArrowRight size={14} /> DÖF Oluştur</button>
                                        )}
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                            {d.status !== 'completed' && <button className="btn btn-ghost btn-sm" title="Tamamla" style={{ color: '#22C55E' }} onClick={() => handleStatusChange(d.id, 'completed')}><CheckCircle size={15} /></button>}
                                            {d.status === 'open' && <button className="btn btn-ghost btn-sm" title="Devam Et" style={{ color: '#3B82F6' }} onClick={() => handleStatusChange(d.id, 'in_progress')}><Clock size={15} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   MODALLER
   ═══════════════════════════════════════════ */

/* ─── KURUL TANIMLAMA ─── */
const CommitteeFormModal = ({ onClose, onSave }) => {
    const TYPES = committeeService.getCommitteeTypes();
    const FREQS = committeeService.getMeetingFrequencies();
    const [form, setForm] = useState({ name: '', type: '', frequency: 'monthly', chairman: '', secretary: '', members: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.type) { alert('Kurul adı ve türü zorunludur.'); return; }
        setSaving(true);
        try { await committeeService.addCommittee(form); onSave(); onClose(); }
        catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users2 size={20} style={{ color: '#6366F1' }} /> Kurul Tanımla</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Kurul Adı *</label><input className="form-input" placeholder="ör: Ana İSG Kurulu" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="form-group">
                        <label className="form-label">Kurul Türü *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                            {TYPES.map(t => (
                                <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type: t.value }))}
                                    style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${form.type === t.value ? '#6366F1' : 'var(--border-color)'}`, background: form.type === t.value ? 'rgba(99,102,241,.12)' : 'var(--bg-tertiary)', color: form.type === t.value ? '#818CF8' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}>
                                    <span>{t.icon}</span>{t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Toplantı Sıklığı</label>
                            <select className="form-select" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                                {FREQS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Başkan</label><input className="form-input" placeholder="Kurul başkanı" value={form.chairman} onChange={e => setForm(p => ({ ...p, chairman: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Sekreter</label><input className="form-input" placeholder="Kurul sekreteri" value={form.secretary} onChange={e => setForm(p => ({ ...p, secretary: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Üye Sayısı / İsimler</label><input className="form-input" placeholder="ör: 6 kişi" value={form.members} onChange={e => setForm(p => ({ ...p, members: e.target.value }))} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── TOPLANTI EKLEME ─── */
const MeetingFormModal = ({ defaultCommitteeId, onClose, onSave }) => {
    const [committees, setCommittees] = useState([]);
    const [form, setForm] = useState({ committeeId: defaultCommitteeId || '', date: '', time: '', location: '', agenda: '', status: 'planned' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { (async () => setCommittees(await committeeService.getCommittees()))(); }, []);

    const handleSave = async () => {
        if (!form.committeeId || !form.date) { alert('Kurul ve tarih zorunludur.'); return; }
        setSaving(true);
        try { await committeeService.addMeeting({ ...form, committeeId: Number(form.committeeId) }); onSave(); onClose(); }
        catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={20} style={{ color: '#3B82F6' }} /> Yeni Toplantı</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Kurul *</label>
                        <select className="form-select" value={form.committeeId} onChange={e => setForm(p => ({ ...p, committeeId: e.target.value }))}>
                            <option value="">Seçiniz</option>
                            {committees.map(c => <option key={c.id} value={c.id}>{committeeService.getTypeInfo(c.type).icon} {c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Tarih *</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Saat</label><input className="form-input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Yer</label><input className="form-input" placeholder="ör: Merkez Toplantı Salonu" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Gündem</label><textarea className="form-textarea" rows={3} placeholder="Toplantı gündemi..." value={form.agenda} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Durum</label>
                        <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                            <option value="planned">Planlandı</option><option value="completed">Gerçekleştirildi</option><option value="cancelled">İptal Edildi</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── TOPLANTI DETAY — Karar Ekleme / Yönetimi ─── */
const MeetingDetailModal = ({ meeting, onClose }) => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDecisionForm, setShowDecisionForm] = useState(false);

    useEffect(() => { loadDecisions(); }, []);
    const loadDecisions = async () => {
        setLoading(true);
        setDecisions(await committeeService.getDecisions(meeting.id));
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu kararı silmek istediğinize emin misiniz?')) return;
        await committeeService.deleteDecision(id);
        loadDecisions();
    };

    const handleStatusChange = async (id, newStatus) => {
        await committeeService.updateDecision(id, { status: newStatus, ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}) });
        loadDecisions();
    };

    const handleLinkDof = async (id) => {
        try {
            const actionId = await committeeService.linkDecisionToAction(id);
            alert(`DÖF aksiyonu oluşturuldu (ID: ${actionId}).`);
            loadDecisions();
        } catch (e) { alert(e.message); }
    };

    const typeInfo = committeeService.getTypeInfo(meeting.committeeType);
    const now = new Date();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '94vh' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{typeInfo.icon}</span>
                        {meeting.committeeName} — {new Date(meeting.date).toLocaleDateString('tr-TR')}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>📍 {meeting.location || '-'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>🕐 {meeting.time || '-'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>📋 {decisions.length} karar</div>
                    </div>
                    {meeting.agenda && <div style={{ padding: 'var(--space-md)', background: 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Gündem</div>{meeting.agenda}
                    </div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}><Gavel size={16} style={{ color: '#F59E0B' }} /> Alınan Kararlar</h3>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowDecisionForm(true)} style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}><Plus size={14} /> Karar Ekle</button>
                    </div>

                    {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                     : decisions.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Bu toplantıda henüz karar eklenmemiş.</div>
                     : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {decisions.map((d, i) => {
                            const pri = committeeService.getPriorityInfo(d.priority);
                            const st = committeeService.getStatusInfo(d.status);
                            const isOverdue = d.dueDate && new Date(d.dueDate) < now && d.status !== 'completed' && d.status !== 'cancelled';
                            return (
                                <div key={d.id} style={{ padding: '12px 14px', background: isOverdue ? 'rgba(239,68,68,.05)' : 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${isOverdue ? '#EF4444' : st.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{i + 1}</span>
                                                {d.description}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span>Sorumlu: <strong>{d.responsiblePerson || '-'}</strong></span>
                                                <span>Termin: <strong style={{ color: isOverdue ? '#EF4444' : 'inherit' }}>{d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : '-'}</strong></span>
                                                <span className="badge" style={{ background: `${pri.color}20`, color: pri.color, fontSize: '0.65rem' }}>{pri.label}</span>
                                                <span className="badge" style={{ background: `${st.color}20`, color: st.color, fontSize: '0.65rem' }}>{st.label}</span>
                                                {d.relatedActionId && <span className="badge" style={{ background: 'rgba(34,197,94,.15)', color: '#22C55E', fontSize: '0.65rem' }}><Link2 size={10} /> DÖF #{d.relatedActionId}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            {!d.relatedActionId && <button className="btn btn-ghost btn-sm" title="DÖF Oluştur" style={{ color: '#6366F1' }} onClick={() => handleLinkDof(d.id)}><ArrowRight size={14} /></button>}
                                            {d.status !== 'completed' && <button className="btn btn-ghost btn-sm" title="Tamamla" style={{ color: '#22C55E' }} onClick={() => handleStatusChange(d.id, 'completed')}><CheckCircle size={14} /></button>}
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>}
                </div>

                {showDecisionForm && <DecisionFormModal meetingId={meeting.id} onClose={() => setShowDecisionForm(false)} onSave={loadDecisions} />}
            </div>
        </div>
    );
};

/* ─── KARAR EKLEME FORMU ─── */
const DecisionFormModal = ({ meetingId, onClose, onSave }) => {
    const PRIORITIES = committeeService.getDecisionPriorities();
    const [form, setForm] = useState({ description: '', responsiblePerson: '', dueDate: '', priority: 'medium' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.description) { alert('Karar açıklaması zorunludur.'); return; }
        setSaving(true);
        try {
            await committeeService.addDecision({ ...form, meetingId });
            onSave(); onClose();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.stopPropagation()} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Gavel size={18} style={{ color: '#F59E0B' }} /> Karar Ekle</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Karar Açıklaması *</label><textarea className="form-textarea" rows={3} placeholder="Alınan karar..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Sorumlu Kişi</label><input className="form-input" value={form.responsiblePerson} onChange={e => setForm(p => ({ ...p, responsiblePerson: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Termin Tarihi</label><input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Öncelik</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {PRIORITIES.map(p => (
                                <button key={p.value} type="button" onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                                    className={`btn btn-sm ${form.priority === p.value ? '' : 'btn-ghost'}`}
                                    style={form.priority === p.value ? { background: `${p.color}20`, color: p.color, border: `1.5px solid ${p.color}50` } : { border: '1px solid var(--border-color)' }}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

export default Committees;
