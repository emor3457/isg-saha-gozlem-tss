import React, { useState, useEffect } from 'react';
import {
    HardHat, Plus, Users, Download, ShieldCheck, X, AlertTriangle, Trash2,
    Search, RefreshCw, Package, Clock, CheckCircle, XCircle, FileText, User, ArrowLeftRight
} from 'lucide-react';
import { ppeService } from '../services/ppeService';

/* ═══════════════════════════════════════════
   KKD ZİMMET TAKİBİ — ANA SAYFA
   ═══════════════════════════════════════════ */
const PpeManagement = () => {
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({});
    const [expiringList, setExpiringList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assignments');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [showPpeTypeForm, setShowPpeTypeForm] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [raw, s, exp] = await Promise.all([
                ppeService.getAssignments(),
                ppeService.getStats(),
                ppeService.getExpiringAssignments(30),
            ]);
            const enriched = await ppeService.enrichAssignments(raw);
            setAssignments(enriched);
            setStats(s);
            setExpiringList(exp);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDownloadPDF = async (assignId) => {
        try { await ppeService.generateAssignmentPDF(assignId); }
        catch (e) { alert('PDF oluşturulamadı: ' + e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu zimmet kaydını silmek istediğinize emin misiniz?')) return;
        await ppeService.deleteAssignment(id);
        loadAll();
    };

    const filtered = assignments.filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (a.employeeName || '').toLowerCase().includes(q) ||
               (a.ppeName || '').toLowerCase().includes(q) ||
               (a.employeeDepartment || '').toLowerCase().includes(q);
    });

    const statCards = [
        { label: 'Aktif Çalışan', value: stats.employeeCount || 0, color: '#3B82F6', icon: Users },
        { label: 'KKD Türü', value: stats.ppeTypeCount || 0, color: '#8B5CF6', icon: Package },
        { label: 'Aktif Zimmet', value: stats.activeAssignments || 0, color: '#22C55E', icon: ShieldCheck },
        { label: 'Miadı Dolan / Yakın', value: (stats.expiredCount || 0) + (stats.soonExpiring || 0), color: stats.expiredCount > 0 ? '#EF4444' : '#F59E0B', icon: AlertTriangle },
    ];

    const TABS = [
        { key: 'assignments', label: 'Zimmet Kayıtları', icon: ShieldCheck },
        { key: 'employees', label: 'Çalışanlar', icon: Users },
        { key: 'catalog', label: 'KKD Kataloğu', icon: Package },
        { key: 'expiring', label: 'Miad Uyarıları', icon: AlertTriangle, badge: (stats.expiredCount || 0) + (stats.soonExpiring || 0) },
    ];

    return (
        <div className="page" style={{ maxWidth: 1280 }}>
            {/* HEADER */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title"><HardHat style={{ color: '#EAB308' }} /> KKD Zimmet Takibi</h1>
                    <p className="page-subtitle">Kişisel Koruyucu Donanım zimmet tutanakları, katalog ve miad izleme</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowPpeTypeForm(true)}><Package size={16} /> KKD Ekle</button>
                    <button className="btn btn-secondary" onClick={() => setShowEmployeeForm(true)}><Users size={16} /> Çalışan Ekle</button>
                    <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #EAB308, #CA8A04)', boxShadow: '0 2px 8px rgba(234,179,8,.3)' }} onClick={() => setShowAssignForm(true)}>
                        <Plus size={16} /> Yeni Zimmet
                    </button>
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
                            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: `${s.color}15` }}>
                                <s.icon size={22} style={{ color: s.color }} />
                            </div>
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
                        {t.badge > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{t.badge}</span>}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'assignments' && <AssignmentsTab data={filtered} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onDownload={handleDownloadPDF} onReturn={setShowReturnModal} onDelete={handleDelete} />}
            {activeTab === 'employees' && <EmployeesTab onRefresh={loadAll} />}
            {activeTab === 'catalog' && <CatalogTab onRefresh={loadAll} />}
            {activeTab === 'expiring' && <ExpiringTab data={expiringList} onRefresh={loadAll} />}

            {/* MODALS */}
            {showAssignForm && <AssignPpeModal onClose={() => setShowAssignForm(false)} onSave={loadAll} />}
            {showEmployeeForm && <EmployeeFormModal onClose={() => setShowEmployeeForm(false)} onSave={loadAll} />}
            {showPpeTypeForm && <PpeTypeFormModal onClose={() => setShowPpeTypeForm(false)} onSave={loadAll} />}
            {showReturnModal && <ReturnModal assignment={showReturnModal} onClose={() => setShowReturnModal(null)} onSave={loadAll} />}
        </div>
    );
};

/* ─── HELPER STYLES ─── */
const thS = { padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' };
const tdS = { padding: '12px 16px', color: 'var(--text-secondary)' };
const getStatusBadge = (status) => {
    const map = {
        active: { label: 'Sahada', color: '#22C55E' },
        returned: { label: 'İade', color: '#6B7280' },
        damaged: { label: 'Hasarlı', color: '#EF4444' },
    };
    const s = map[status] || { label: status, color: '#64748B' };
    return <span className="badge" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30` }}>{s.label}</span>;
};

/* ═══ ZIMMET KAYITLARI TABı ═══ */
const AssignmentsTab = ({ data, loading, searchQuery, setSearchQuery, onDownload, onReturn, onDelete }) => (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--text-muted)' }} /> Zimmet Kayıtları <span className="badge badge-primary">{data.length}</span>
            </h2>
            <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 32, padding: '6px 10px 6px 32px', fontSize: '0.8125rem' }} />
            </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.12)' }}>
                    <th style={thS}>Çalışan</th><th style={thS}>Departman</th><th style={thS}>KKD</th><th style={thS}>Teslim Tarihi</th><th style={thS}>Son Değişim</th><th style={thS}>Durum</th><th style={{ ...thS, textAlign: 'right' }}>İşlem</th>
                </tr></thead>
                <tbody>
                    {loading ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                     : data.length === 0 ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><HardHat size={36} style={{ opacity: .3 }} /><span>Kayıt bulunamadı</span></div></td></tr>
                     : data.map(a => {
                        const isExpired = a.nextReplacementDate && new Date(a.nextReplacementDate) <= new Date();
                        return (
                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', background: isExpired && a.status === 'active' ? 'rgba(239,68,68,.04)' : 'transparent' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = isExpired && a.status === 'active' ? 'rgba(239,68,68,.04)' : 'transparent'}>
                                <td style={{ ...tdS, color: 'var(--text-primary)', fontWeight: 600 }}>{a.employeeName}</td>
                                <td style={tdS}>{a.employeeDepartment}</td>
                                <td style={tdS}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{ppeService.getCategoryInfo(a.ppeCategory).icon}</span>{a.ppeName}</span></td>
                                <td style={tdS}>{new Date(a.assignmentDate).toLocaleDateString('tr-TR')}</td>
                                <td style={tdS}>
                                    {a.nextReplacementDate ? (
                                        <span style={{ color: isExpired ? '#EF4444' : 'var(--text-secondary)', fontWeight: isExpired ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {isExpired && <AlertTriangle size={13} />} {new Date(a.nextReplacementDate).toLocaleDateString('tr-TR')}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td style={tdS}>{getStatusBadge(a.status)}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm" title="PDF İndir" onClick={() => onDownload(a.id)}><Download size={15} /></button>
                                        {a.status === 'active' && <button className="btn btn-ghost btn-sm" title="İade / Hasar" onClick={() => onReturn(a)} style={{ color: '#F59E0B' }}><ArrowLeftRight size={15} /></button>}
                                        <button className="btn btn-ghost btn-sm" title="Sil" onClick={() => onDelete(a.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
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

/* ═══ ÇALIŞANLAR TABı ═══ */
const EmployeesTab = ({ onRefresh }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { (async () => { setLoading(true); setEmployees(await ppeService.getEmployees()); setLoading(false); })(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return;
        await ppeService.deleteEmployee(id);
        setEmployees(await ppeService.getEmployees());
        onRefresh();
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} style={{ color: 'var(--text-muted)' }} /> Kayıtlı Çalışanlar <span className="badge badge-primary">{employees.length}</span></h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.12)' }}>
                        <th style={thS}>Ad Soyad</th><th style={thS}>Departman</th><th style={thS}>Unvan</th><th style={thS}>SGK No</th><th style={thS}>Durum</th><th style={{ ...thS, textAlign: 'right' }}>İşlem</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                         : employees.length === 0 ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıtlı çalışan yok</td></tr>
                         : employees.map(e => (
                            <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                                <td style={{ ...tdS, color: 'var(--text-primary)', fontWeight: 600 }}>{e.name}</td>
                                <td style={tdS}>{e.department}</td>
                                <td style={tdS}>{e.title || '-'}</td>
                                <td style={tdS}><code style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', padding: '2px 6px', borderRadius: 4 }}>{e.sgkNo || '-'}</code></td>
                                <td style={tdS}><span className="badge" style={{ background: e.status === 'active' ? 'rgba(34,197,94,.15)' : 'rgba(107,114,128,.15)', color: e.status === 'active' ? '#22C55E' : '#6B7280' }}>{e.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
                                <td style={{ ...tdS, textAlign: 'right' }}><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(e.id)}><Trash2 size={15} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* ═══ KKD KATALOĞu TABı ═══ */
const CatalogTab = ({ onRefresh }) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { (async () => { setLoading(true); setTypes(await ppeService.getPpeTypes()); setLoading(false); })(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Bu KKD türünü silmek istediğinize emin misiniz?')) return;
        await ppeService.deletePpeType(id);
        setTypes(await ppeService.getPpeTypes());
        onRefresh();
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} style={{ color: 'var(--text-muted)' }} /> KKD Kataloğu <span className="badge badge-primary">{types.length}</span></h2>
            </div>
            {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
             : types.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Katalogda KKD türü yok. "KKD Ekle" butonunu kullanın.</div>
             : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)', padding: 'var(--space-lg)' }}>
                {types.map(t => {
                    const cat = ppeService.getCategoryInfo(t.category);
                    return (
                        <div key={t.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                            <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8, color: 'var(--color-danger)' }} onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.label}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span>Standart: <strong style={{ color: 'var(--text-primary)' }}>{t.standard || '-'}</strong></span>
                                <span>Ömür: <strong style={{ color: 'var(--text-primary)' }}>{t.lifespanMonths ? `${t.lifespanMonths} ay` : '-'}</strong></span>
                            </div>
                        </div>
                    );
                })}
            </div>}
        </div>
    );
};

/* ═══ MİAD UYARILARI TABı ═══ */
const ExpiringTab = ({ data }) => (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', background: 'rgba(239,68,68,.04)' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#F87171' }}>
                <AlertTriangle size={18} /> Miadı Dolan / 30 Gün İçinde Dolacak KKD'ler <span className="badge badge-danger">{data.length}</span>
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>Bu listede ömrü sona ermiş veya 30 gün içinde sona erecek aktif KKD zimmetleri gösterilir.</p>
        </div>
        {data.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} style={{ opacity: .3, margin: '0 auto 8px' }} />
                <div>Tüm KKD'lerin miadı geçerli. 🎉</div>
            </div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.12)' }}>
                        <th style={thS}>Çalışan</th><th style={thS}>KKD</th><th style={thS}>Teslim Tarihi</th><th style={thS}>Son Değişim Tarihi</th><th style={thS}>Kalan Süre</th>
                    </tr></thead>
                    <tbody>
                        {data.map(a => {
                            const repDate = new Date(a.nextReplacementDate);
                            const now = new Date();
                            const diffDays = Math.ceil((repDate - now) / (1000 * 60 * 60 * 24));
                            const isExpired = diffDays <= 0;
                            return (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', background: isExpired ? 'rgba(239,68,68,.06)' : 'rgba(234,179,8,.04)' }}>
                                    <td style={{ ...tdS, fontWeight: 600, color: 'var(--text-primary)' }}>{a.employeeName}</td>
                                    <td style={tdS}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{ppeService.getCategoryInfo(a.ppeCategory).icon}</span>{a.ppeName}</span></td>
                                    <td style={tdS}>{new Date(a.assignmentDate).toLocaleDateString('tr-TR')}</td>
                                    <td style={{ ...tdS, fontWeight: 700, color: isExpired ? '#EF4444' : '#F59E0B' }}>{repDate.toLocaleDateString('tr-TR')}</td>
                                    <td style={tdS}>
                                        <span className="badge" style={{ background: isExpired ? 'rgba(239,68,68,.15)' : 'rgba(234,179,8,.15)', color: isExpired ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                                            {isExpired ? `${Math.abs(diffDays)} gün geçti ⛔` : `${diffDays} gün kaldı ⚠️`}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

/* ═══════════════════════════════════════════
   MODALLER
   ═══════════════════════════════════════════ */

/* ─── ZİMMET FORMU ─── */
const AssignPpeModal = ({ onClose, onSave }) => {
    const [employees, setEmployees] = useState([]);
    const [ppeTypes, setPpeTypes] = useState([]);
    const [form, setForm] = useState({ employeeId: '', ppeTypeId: '', note: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            setEmployees(await ppeService.getActiveEmployees());
            setPpeTypes(await ppeService.getPpeTypes());
        })();
    }, []);

    const handleSave = async () => {
        if (!form.employeeId || !form.ppeTypeId) { alert('Çalışan ve KKD seçimi zorunludur.'); return; }
        setSaving(true);
        try {
            await ppeService.assignPpe({ ...form, employeeId: Number(form.employeeId), ppeTypeId: Number(form.ppeTypeId) });
            onSave();
            onClose();
        } catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><HardHat size={20} style={{ color: '#EAB308' }} /> Yeni KKD Zimmet</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label className="form-label">Çalışan *</label>
                        <select className="form-select" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}>
                            <option value="">Seçiniz...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">KKD Türü *</label>
                        <select className="form-select" value={form.ppeTypeId} onChange={e => setForm(p => ({ ...p, ppeTypeId: e.target.value }))}>
                            <option value="">Seçiniz...</option>
                            {ppeTypes.map(p => <option key={p.id} value={p.id}>{ppeService.getCategoryInfo(p.category).icon} {p.name} ({p.standard || '-'})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Not (opsiyonel)</label>
                        <input className="form-input" placeholder="Zimmet notu..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #EAB308, #CA8A04)' }}>{saving ? 'Kaydediliyor...' : 'Zimmetle'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── ÇALIŞAN EKLEME FORMU ─── */
const EmployeeFormModal = ({ onClose, onSave }) => {
    const DEPTS = ppeService.getDepartments();
    const [form, setForm] = useState({ name: '', department: '', title: '', sgkNo: '', hireDate: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.department) { alert('Ad ve departman zorunludur.'); return; }
        setSaving(true);
        try { await ppeService.addEmployee(form); onSave(); onClose(); }
        catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} style={{ color: '#3B82F6' }} /> Yeni Çalışan</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Ad Soyad *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Departman *</label>
                            <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                                <option value="">Seçiniz</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Unvan</label><input className="form-input" placeholder="ör: Teknisyen" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">SGK No</label><input className="form-input" value={form.sgkNo} onChange={e => setForm(p => ({ ...p, sgkNo: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">İşe Giriş Tarihi</label><input className="form-input" type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── KKD TÜRÜ EKLEME FORMU ─── */
const PpeTypeFormModal = ({ onClose, onSave }) => {
    const CATS = ppeService.getCategories();
    const [form, setForm] = useState({ name: '', category: '', standard: '', lifespanMonths: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.category) { alert('KKD adı ve kategorisi zorunludur.'); return; }
        setSaving(true);
        try {
            await ppeService.addPpeType({ ...form, lifespanMonths: form.lifespanMonths ? Number(form.lifespanMonths) : null });
            onSave(); onClose();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Package size={20} style={{ color: '#8B5CF6' }} /> Yeni KKD Türü</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label className="form-label">KKD Adı *</label>
                        <input className="form-input" placeholder="ör: Güvenlik Bareti" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
                            {CATS.map(c => (
                                <button key={c.value} type="button" onClick={() => setForm(p => ({ ...p, category: c.value }))}
                                    style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${form.category === c.value ? '#8B5CF6' : 'var(--border-color)'}`, background: form.category === c.value ? 'rgba(139,92,246,.12)' : 'var(--bg-tertiary)', color: form.category === c.value ? '#A78BFA' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}>
                                    <span>{c.icon}</span> {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Standart</label><input className="form-input" placeholder="ör: EN 397" value={form.standard} onChange={e => setForm(p => ({ ...p, standard: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Ömrü (Ay)</label><input className="form-input" type="number" placeholder="ör: 12" value={form.lifespanMonths} onChange={e => setForm(p => ({ ...p, lifespanMonths: e.target.value }))} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── İADE / HASAR MODALI ─── */
const ReturnModal = ({ assignment, onClose, onSave }) => {
    const [condition, setCondition] = useState('good');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await ppeService.returnPpe(assignment.id, condition, note);
            onSave(); onClose();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ArrowLeftRight size={20} style={{ color: '#F59E0B' }} /> KKD İade / Hasar</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ background: 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Çalışan</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{assignment.employeeName}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>KKD</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{assignment.ppeName}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">İade Durumu</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[{ v: 'good', l: 'Sağlam', c: '#22C55E' }, { v: 'worn', l: 'Yıpranmış', c: '#F59E0B' }, { v: 'damaged', l: 'Hasarlı', c: '#EF4444' }].map(o => (
                                <button key={o.v} type="button" onClick={() => setCondition(o.v)}
                                    className={`btn btn-sm ${condition === o.v ? '' : 'btn-ghost'}`}
                                    style={condition === o.v ? { background: `${o.c}20`, color: o.c, border: `1.5px solid ${o.c}50` } : { border: '1px solid var(--border-color)' }}>
                                    {o.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Not</label><textarea className="form-textarea" rows={2} placeholder="İade notu..." value={note} onChange={e => setNote(e.target.value)} /></div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'İade Et'}</button>
                </div>
            </div>
        </div>
    );
};

export default PpeManagement;
