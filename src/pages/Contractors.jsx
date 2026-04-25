import React, { useState, useEffect } from 'react';
import {
    Building2, UserPlus, Plus, Search, X, Trash2, AlertTriangle, Shield,
    FileCheck, Users, Eye, Ban, CheckCircle, Clock, FileText, Upload,
    Phone, Mail, MapPin, ChevronRight, XCircle, ShieldAlert, Calendar
} from 'lucide-react';
import { contractorService } from '../services/contractorService';

/* ═══════════════════════════════════════════
   TAŞERON YÖNETİMİ — ANA SAYFA
   ═══════════════════════════════════════════ */
const Contractors = () => {
    const [contractors, setContractors] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('firms');
    const [showFirmForm, setShowFirmForm] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [raw, s] = await Promise.all([
                contractorService.getContractors(),
                contractorService.getStats(),
            ]);
            const enriched = await contractorService.enrichContractors(raw);
            setContractors(enriched);
            setStats(s);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDeleteFirm = async (id) => {
        if (!confirm('Bu firmayı, tüm personelini ve evraklarını silmek istediğinize emin misiniz?')) return;
        await contractorService.deleteContractor(id);
        loadAll();
    };

    const filtered = contractors.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) || (c.scope || '').toLowerCase().includes(q) || (c.contactPerson || '').toLowerCase().includes(q);
    });

    const statCards = [
        { label: 'Aktif Firma', value: stats.contractorCount || 0, color: '#3B82F6', icon: Building2 },
        { label: 'Toplam Personel', value: stats.personnelCount || 0, color: '#22C55E', icon: Users },
        { label: 'Saha Giriş Yasağı', value: stats.bannedPersonnel || 0, color: '#EF4444', icon: Ban },
        { label: 'Süresi Dolan Evrak', value: stats.expiredDocs || 0, color: stats.expiredDocs > 0 ? '#EF4444' : '#F59E0B', icon: AlertTriangle },
    ];

    const TABS = [
        { key: 'firms', label: 'Taşeron Firmalar', icon: Building2 },
        { key: 'access', label: 'Saha Giriş Kontrolü', icon: ShieldAlert, badge: (stats.bannedPersonnel || 0) + (stats.restrictedPersonnel || 0) },
        { key: 'documents', label: 'Evrak Durumu', icon: FileCheck, badge: stats.expiredDocs || 0 },
    ];

    return (
        <div className="page" style={{ maxWidth: 1280 }}>
            {/* HEADER */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title"><Building2 style={{ color: '#3B82F6' }} /> Yüklenici (Taşeron) Yönetimi</h1>
                    <p className="page-subtitle">Dış kaynaklı alt işverenlerin SGK, eğitim ve saha giriş belgelerinin takibi</p>
                </div>
                <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', boxShadow: '0 2px 8px rgba(59,130,246,.3)' }} onClick={() => setShowFirmForm(true)}>
                    <Plus size={16} /> Yeni Taşeron Ekle
                </button>
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
            {activeTab === 'firms' && <FirmsTab data={filtered} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onDelete={handleDeleteFirm} onDetail={setShowDetail} />}
            {activeTab === 'access' && <AccessControlTab onRefresh={loadAll} />}
            {activeTab === 'documents' && <DocumentStatusTab />}

            {/* MODALS */}
            {showFirmForm && <ContractorFormModal onClose={() => setShowFirmForm(false)} onSave={loadAll} />}
            {showDetail && <ContractorDetailModal contractor={showDetail} onClose={() => { setShowDetail(null); loadAll(); }} />}
        </div>
    );
};

/* ─── HELPER ─── */
const thS = { padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' };
const tdS = { padding: '12px 16px', color: 'var(--text-secondary)' };

const getAccessBadge = (access) => {
    const map = { allowed: { l: 'Giriş İzni', c: '#22C55E', i: CheckCircle }, restricted: { l: 'Kısıtlı', c: '#F59E0B', i: AlertTriangle }, banned: { l: 'Yasaklı', c: '#EF4444', i: Ban } };
    const s = map[access] || map.allowed;
    return <span className="badge" style={{ background: `${s.c}20`, color: s.c, border: `1px solid ${s.c}30`, display: 'flex', alignItems: 'center', gap: 4 }}><s.i size={12} />{s.l}</span>;
};

/* ═══ FİRMALAR TABı ═══ */
const FirmsTab = ({ data, loading, searchQuery, setSearchQuery, onDelete, onDetail }) => (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={18} style={{ color: 'var(--text-muted)' }} /> Taşeron Firmalar <span className="badge badge-primary">{data.length}</span></h2>
            <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Firma adı, kapsam ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 32, padding: '6px 10px 6px 32px', fontSize: '0.8125rem' }} />
            </div>
        </div>
        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
         : data.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={40} style={{ opacity: .3, margin: '0 auto 8px' }} /><div>Kayıtlı taşeron firma bulunmamaktadır.</div></div>
         : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)', padding: 'var(--space-lg)' }}>
            {data.map(c => (
                <div key={c.id} onClick={() => onDetail(c)} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', border: `1px solid ${c.hasIssues ? 'rgba(239,68,68,.3)' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 200ms', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.hasIssues ? 'rgba(239,68,68,.3)' : 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}>
                    {c.hasIssues && <div style={{ position: 'absolute', top: 8, right: 8 }}><AlertTriangle size={16} style={{ color: '#EF4444' }} /></div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={22} style={{ color: '#3B82F6' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.scope || 'Kapsam belirtilmemiş'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
                        <div style={{ textAlign: 'center', padding: 8, borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,.12)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#22C55E' }}>{c.activePersonnel}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Personel</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 8, borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,.12)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#3B82F6' }}>{c.totalDocs}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Evrak</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 8, borderRadius: 'var(--radius-sm)', background: c.expiredDocsCount > 0 ? 'rgba(239,68,68,.08)' : 'rgba(0,0,0,.12)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: c.expiredDocsCount > 0 ? '#EF4444' : '#22C55E' }}>{c.expiredDocsCount}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Sorunlu</div>
                        </div>
                    </div>
                    {c.contactPerson && <div style={{ marginTop: 10, fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={13} />{c.contactPerson} {c.contactPhone ? `· ${c.contactPhone}` : ''}</div>}
                    <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', bottom: 8, right: 8, color: 'var(--color-danger)' }} onClick={e => { e.stopPropagation(); onDelete(c.id); }}><Trash2 size={14} /></button>
                </div>
            ))}
        </div>}
    </div>
);

/* ═══ SAHA GİRİŞ KONTROLÜ TABı ═══ */
const AccessControlTab = ({ onRefresh }) => {
    const [personnel, setPersonnel] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAccess, setFilterAccess] = useState('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [p, c] = await Promise.all([contractorService.getPersonnel(), contractorService.getContractors()]);
            setPersonnel(p);
            setContractors(c);
            setLoading(false);
        })();
    }, []);

    const getContractorName = (id) => contractors.find(c => c.id === id)?.name || '-';

    const filteredPers = filterAccess === 'all' ? personnel : personnel.filter(p => p.siteAccess === filterAccess);

    const handleAccessChange = async (personnelId, newAccess) => {
        const reason = prompt(`${newAccess === 'banned' ? 'Yasak sebebi:' : newAccess === 'restricted' ? 'Kısıtlama sebebi:' : 'İzin verme gerekçesi:'}`);
        if (reason === null) return;
        await contractorService.updateSiteAccess(personnelId, newAccess, reason);
        const p = await contractorService.getPersonnel();
        setPersonnel(p);
        onRefresh();
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={18} style={{ color: '#EF4444' }} /> Saha Giriş Kontrol Paneli</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                    {[{ v: 'all', l: 'Tümü' }, { v: 'allowed', l: '✅ İzinli' }, { v: 'restricted', l: '⚠️ Kısıtlı' }, { v: 'banned', l: '⛔ Yasaklı' }].map(f => (
                        <button key={f.v} onClick={() => setFilterAccess(f.v)} className={`btn btn-sm ${filterAccess === f.v ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.75rem' }}>{f.l}</button>
                    ))}
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,.12)' }}>
                        <th style={thS}>Personel</th><th style={thS}>Firma</th><th style={thS}>Pozisyon</th><th style={thS}>TC No</th><th style={thS}>Durum</th><th style={{ ...thS, textAlign: 'right' }}>Erişim Değiştir</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                         : filteredPers.length === 0 ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıt bulunamadı</td></tr>
                         : filteredPers.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', background: p.siteAccess === 'banned' ? 'rgba(239,68,68,.04)' : 'transparent' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = p.siteAccess === 'banned' ? 'rgba(239,68,68,.04)' : 'transparent'}>
                                <td style={{ ...tdS, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                                <td style={tdS}>{getContractorName(p.contractorId)}</td>
                                <td style={tdS}>{p.position || '-'}</td>
                                <td style={tdS}><code style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', padding: '2px 6px', borderRadius: 4 }}>{p.tcNo || '-'}</code></td>
                                <td style={tdS}>{getAccessBadge(p.siteAccess)}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                        {p.siteAccess !== 'allowed' && <button className="btn btn-ghost btn-sm" title="İzin Ver" style={{ color: '#22C55E' }} onClick={() => handleAccessChange(p.id, 'allowed')}><CheckCircle size={15} /></button>}
                                        {p.siteAccess !== 'restricted' && <button className="btn btn-ghost btn-sm" title="Kısıtla" style={{ color: '#F59E0B' }} onClick={() => handleAccessChange(p.id, 'restricted')}><AlertTriangle size={15} /></button>}
                                        {p.siteAccess !== 'banned' && <button className="btn btn-ghost btn-sm" title="Yasakla" style={{ color: '#EF4444' }} onClick={() => handleAccessChange(p.id, 'banned')}><Ban size={15} /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* ═══ EVRAK DURUMU TABı ═══ */
const DocumentStatusTab = () => {
    const [docs, setDocs] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [d, p, c] = await Promise.all([
                contractorService.getAllDocuments(),
                contractorService.getPersonnel(),
                contractorService.getContractors()
            ]);
            setDocs(d);
            setPersonnel(p);
            setContractors(c);
            setLoading(false);
        })();
    }, []);

    const now = new Date();
    const getPersonName = (id) => personnel.find(p => p.id === id)?.name || '-';
    const getContractorName = (id) => contractors.find(c => c.id === id)?.name || '-';

    const expiredDocs = docs.filter(d => d.expiryDate && new Date(d.expiryDate) <= now);
    const soonDocs = docs.filter(d => { if (!d.expiryDate) return false; const exp = new Date(d.expiryDate); const f = new Date(); f.setDate(f.getDate() + 30); return exp > now && exp <= f; });
    const validDocs = docs.filter(d => !d.expiryDate || new Date(d.expiryDate) > new Date(new Date().setDate(new Date().getDate() + 30)));

    const DocTable = ({ title, data, color, icon: Icon }) => (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon size={18} />{title} <span className="badge" style={{ background: `${color}20`, color }}>{data.length}</span></h3>
            {data.length === 0 ? <div style={{ padding: 20, textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Bu kategoride evrak yok</div> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={thS}>Evrak</th><th style={thS}>Firma</th><th style={thS}>Personel</th><th style={thS}>Son Geçerlilik</th><th style={thS}>Kalan</th>
                        </tr></thead>
                        <tbody>{data.map(d => {
                            const daysLeft = d.expiryDate ? Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24)) : null;
                            const typeInfo = contractorService.getDocTypeInfo(d.type);
                            return (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={tdS}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{typeInfo.icon}</span>{typeInfo.label}</span></td>
                                    <td style={tdS}>{getContractorName(d.contractorId)}</td>
                                    <td style={tdS}>{d.personnelId ? getPersonName(d.personnelId) : 'Firma Geneli'}</td>
                                    <td style={{ ...tdS, fontWeight: 600, color: daysLeft !== null && daysLeft <= 0 ? '#EF4444' : 'var(--text-secondary)' }}>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}</td>
                                    <td style={tdS}>{daysLeft !== null ? (
                                        <span className="badge" style={{ background: daysLeft <= 0 ? 'rgba(239,68,68,.15)' : 'rgba(234,179,8,.15)', color: daysLeft <= 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                                            {daysLeft <= 0 ? `${Math.abs(daysLeft)} gün geçti ⛔` : `${daysLeft} gün ⚠️`}
                                        </span>
                                    ) : '-'}</td>
                                </tr>
                            );
                        })}</tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-lg)' }}><FileCheck size={18} style={{ color: 'var(--text-muted)' }} /> Evrak Geçerlilik Takibi</h2>
            {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div> : (
                <>
                    <DocTable title="Süresi Dolan Evraklar" data={expiredDocs} color="#EF4444" icon={XCircle} />
                    <DocTable title="30 Gün İçinde Dolacak" data={soonDocs} color="#F59E0B" icon={Clock} />
                    <DocTable title="Geçerli Evraklar" data={validDocs} color="#22C55E" icon={CheckCircle} />
                </>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════
   MODALLER
   ═══════════════════════════════════════════ */

/* ─── FİRMA EKLEME FORMU ─── */
const ContractorFormModal = ({ onClose, onSave }) => {
    const SCOPES = contractorService.getWorkScopes();
    const [form, setForm] = useState({ name: '', scope: '', contactPerson: '', contactPhone: '', contactEmail: '', address: '', contractStart: '', contractEnd: '', taxNo: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name) { alert('Firma adı zorunludur.'); return; }
        setSaving(true);
        try { await contractorService.addContractor(form); onSave(); onClose(); }
        catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={20} style={{ color: '#3B82F6' }} /> Yeni Taşeron Firma</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Firma Adı *</label><input className="form-input" placeholder="ör: ABC Mühendislik Ltd." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Çalışma Kapsamı</label>
                            <select className="form-select" value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}>
                                <option value="">Seçiniz</option>{SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Vergi No</label><input className="form-input" placeholder="ör: 1234567890" value={form.taxNo} onChange={e => setForm(p => ({ ...p, taxNo: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Yetkili Kişi</label><input className="form-input" placeholder="Ad Soyad" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Telefon</label><input className="form-input" placeholder="05XX XXX XX XX" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">E-Posta</label><input className="form-input" type="email" placeholder="info@firma.com" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">Sözleşme Başlangıç</label><input className="form-input" type="date" value={form.contractStart} onChange={e => setForm(p => ({ ...p, contractStart: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Sözleşme Bitiş</label><input className="form-input" type="date" value={form.contractEnd} onChange={e => setForm(p => ({ ...p, contractEnd: e.target.value }))} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Adres</label><input className="form-input" placeholder="Firma adresi" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── FİRMA DETAY — Personel & Evrak Yönetimi ─── */
const ContractorDetailModal = ({ contractor, onClose }) => {
    const [personnel, setPersonnel] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPersonnelForm, setShowPersonnelForm] = useState(false);
    const [showDocForm, setShowDocForm] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('personnel');

    useEffect(() => { loadDetail(); }, []);

    const loadDetail = async () => {
        setLoading(true);
        const [p, d] = await Promise.all([
            contractorService.getPersonnelByContractor(contractor.id),
            contractorService.getDocuments(contractor.id)
        ]);
        setPersonnel(p);
        setDocs(d);
        setLoading(false);
    };

    const handleDeletePersonnel = async (id) => {
        if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
        await contractorService.deletePersonnel(id);
        loadDetail();
    };

    const handleDeleteDoc = async (id) => {
        if (!confirm('Bu evrakı silmek istediğinize emin misiniz?')) return;
        await contractorService.deleteDocument(id);
        loadDetail();
    };

    const now = new Date();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '94vh' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={20} style={{ color: '#3B82F6' }} />{contractor.name}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* Firm Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.8125rem' }}>
                        <InfoRow icon={<MapPin size={14} />} label="Kapsam" value={contractor.scope || '-'} />
                        <InfoRow icon={<Phone size={14} />} label="Yetkili" value={contractor.contactPerson || '-'} />
                        <InfoRow icon={<Calendar size={14} />} label="Sözleşme" value={contractor.contractEnd ? `${new Date(contractor.contractEnd).toLocaleDateString('tr-TR')}'e kadar` : '-'} />
                    </div>

                    {/* Sub Tabs */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setActiveSubTab('personnel')} className={`btn btn-sm ${activeSubTab === 'personnel' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, justifyContent: 'center' }}><Users size={14} /> Personel ({personnel.length})</button>
                        <button onClick={() => setActiveSubTab('documents')} className={`btn btn-sm ${activeSubTab === 'documents' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, justifyContent: 'center' }}><FileText size={14} /> Evraklar ({docs.length})</button>
                    </div>

                    {activeSubTab === 'personnel' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => setShowPersonnelForm(true)} style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}><UserPlus size={14} /> Personel Ekle</button>
                            </div>
                            {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                             : personnel.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıtlı personel yok</div>
                             : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {personnel.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${p.siteAccess === 'banned' ? '#EF4444' : p.siteAccess === 'restricted' ? '#F59E0B' : '#22C55E'}` }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.position || '-'} · TC: {p.tcNo || '-'} · Tel: {p.phone || '-'}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {getAccessBadge(p.siteAccess)}
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeletePersonnel(p.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>}
                        </>
                    )}

                    {activeSubTab === 'documents' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => setShowDocForm(true)}><Upload size={14} /> Evrak Ekle</button>
                            </div>
                            {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                             : docs.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Kayıtlı evrak yok</div>
                             : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {docs.map(d => {
                                    const typeInfo = contractorService.getDocTypeInfo(d.type);
                                    const isExpired = d.expiryDate && new Date(d.expiryDate) <= now;
                                    const personName = d.personnelId ? personnel.find(p => p.id === d.personnelId)?.name : 'Firma Geneli';
                                    return (
                                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isExpired ? 'rgba(239,68,68,.05)' : 'rgba(0,0,0,.1)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${isExpired ? '#EF4444' : '#22C55E'}` }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><span>{typeInfo.icon}</span>{typeInfo.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {personName} · Geçerlilik: {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                                                    {isExpired && <span style={{ color: '#EF4444', fontWeight: 700, marginLeft: 6 }}>⛔ SÜRESİ DOLMUŞ</span>}
                                                    {typeInfo.critical && <span style={{ color: '#F59E0B', marginLeft: 6 }}>⚠️ Kritik</span>}
                                                </div>
                                            </div>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteDoc(d.id)}><Trash2 size={14} /></button>
                                        </div>
                                    );
                                })}
                            </div>}
                        </>
                    )}
                </div>

                {/* Sub Modals */}
                {showPersonnelForm && <PersonnelFormModal contractorId={contractor.id} onClose={() => setShowPersonnelForm(false)} onSave={loadDetail} />}
                {showDocForm && <DocumentFormModal contractorId={contractor.id} personnel={personnel} onClose={() => setShowDocForm(false)} onSave={loadDetail} />}
            </div>
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
);

/* ─── PERSONEL EKLEME FORMU ─── */
const PersonnelFormModal = ({ contractorId, onClose, onSave }) => {
    const [form, setForm] = useState({ name: '', tcNo: '', position: '', phone: '', isgTrainingDate: '', healthReportDate: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name) { alert('Ad soyad zorunludur.'); return; }
        setSaving(true);
        try {
            await contractorService.addPersonnel({ ...form, contractorId });
            onSave(); onClose();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.stopPropagation()} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18} style={{ color: '#22C55E' }} /> Personel Ekle</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group"><label className="form-label">Ad Soyad *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">TC Kimlik No</label><input className="form-input" maxLength={11} value={form.tcNo} onChange={e => setForm(p => ({ ...p, tcNo: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Pozisyon</label><input className="form-input" placeholder="ör: Elektrikçi" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Telefon</label><input className="form-input" placeholder="05XX XXX XX XX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group"><label className="form-label">İSG Eğitim Tarihi</label><input className="form-input" type="date" value={form.isgTrainingDate} onChange={e => setForm(p => ({ ...p, isgTrainingDate: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Sağlık Raporu Tarihi</label><input className="form-input" type="date" value={form.healthReportDate} onChange={e => setForm(p => ({ ...p, healthReportDate: e.target.value }))} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── EVRAK EKLEME FORMU ─── */
const DocumentFormModal = ({ contractorId, personnel, onClose, onSave }) => {
    const DOC_TYPES = contractorService.getDocumentTypes();
    const [form, setForm] = useState({ type: '', personnelId: '', expiryDate: '', note: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.type) { alert('Evrak türü seçiniz.'); return; }
        setSaving(true);
        try {
            await contractorService.addDocument({
                ...form,
                contractorId,
                personnelId: form.personnelId ? Number(form.personnelId) : null,
            });
            onSave(); onClose();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.stopPropagation()} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Upload size={18} style={{ color: 'var(--color-primary)' }} /> Evrak Ekle</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button></div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label className="form-label">Evrak Türü *</label>
                        <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                            <option value="">Seçiniz</option>
                            {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.icon} {d.label} {d.critical ? '⚠️' : ''}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">İlgili Personel (boş = firma geneli)</label>
                        <select className="form-select" value={form.personnelId} onChange={e => setForm(p => ({ ...p, personnelId: e.target.value }))}>
                            <option value="">Firma Geneli</option>
                            {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Geçerlilik Bitiş Tarihi</label><input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Not</label><input className="form-input" placeholder="Açıklama..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
            </div>
        </div>
    );
};

export default Contractors;
