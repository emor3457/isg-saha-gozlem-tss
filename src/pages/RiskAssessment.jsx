import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, TrendingUp, TrendingDown, Minus, Search,
    Filter, Plus, X, Trash2, Eye, BarChart3, Grid3X3, List,
    ChevronDown, ChevronUp, Shield, Zap, Activity, Lightbulb, ZapOff, Save
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    getAllHazards, getHazardStats, createHazard, deleteHazard,
    getAllOpportunities, createOpportunity, updateOpportunity, deleteOpportunity
} from '../services/riskService';
import { getAllObservations } from '../services/observationService';
import {
    RISK_LEVELS, PROBABILITY_VALUES, FREQUENCY_VALUES,
    SEVERITY_VALUES, calculateRiskScore, getRiskLevel
} from '../config/fineKinney';
import { HAZARD_CATEGORIES, OPPORTUNITY_TYPES, HAZARD_GROUPS } from '../config/categories';
import RootCauseAnalysis from '../components/RootCauseAnalysis';

export default function RiskAssessment() {
    const toast = useToast();
    const [hazards, setHazards] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [observations, setObservations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list | matrix | opportunities
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('score-desc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Add form state
    const [newRisk, setNewRisk] = useState({
        observationId: '', type: 'diger', description: '',
        probability: 3, frequency: 2, severity: 7
    });
    const [newOpp, setNewOpp] = useState({ type: 'process', source: '', description: '', priority: 'medium' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [h, s, o, opps] = await Promise.all([
                getAllHazards(), getHazardStats(), getAllObservations(), getAllOpportunities()
            ]);
            setHazards(h);
            setStats(s);
            setObservations(o);
            setOpportunities(opps);
        } catch (err) {
            console.error(err);
            toast.error('Veri yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    // Filtered & sorted hazards
    const filteredHazards = useMemo(() => {
        let list = [...hazards];
        if (filterLevel !== 'all') list = list.filter(h => h.riskLevel === filterLevel);
        if (filterCategory !== 'all') list = list.filter(h => h.type === filterCategory);
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(h =>
                (h.description || '').toLowerCase().includes(q) ||
                (h.riskLabel || '').toLowerCase().includes(q) ||
                (h.type || '').toLowerCase().includes(q)
            );
        }
        switch (sortBy) {
            case 'score-desc': list.sort((a, b) => b.riskScore - a.riskScore); break;
            case 'score-asc': list.sort((a, b) => a.riskScore - b.riskScore); break;
            case 'date-desc': list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
            case 'date-asc': list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')); break;
        }
        return list;
    }, [hazards, filterLevel, filterCategory, searchTerm, sortBy]);

    // Risk matrix data: P x S grid with F=max
    const matrixData = useMemo(() => {
        const pVals = [0.1, 0.5, 1, 3, 6, 10];
        const sVals = [1, 3, 7, 15, 40, 100];
        const fMax = 10;
        return {
            pVals, sVals, cells: pVals.map(p => sVals.map(s => {
                const score = p * fMax * s;
                const level = getRiskLevel(score);
                const count = hazards.filter(h => h.probability === p && h.severity === s).length;
                return { score: Math.round(score), level, count };
            }))
        };
    }, [hazards]);

    // Distribution bar data
    const distData = useMemo(() => {
        if (!stats || stats.total === 0) return [];
        return RISK_LEVELS.map(l => ({
            ...l,
            count: stats.byLevel[l.level] || 0,
            pct: Math.round(((stats.byLevel[l.level] || 0) / stats.total) * 100)
        }));
    }, [stats]);

    // Live preview score
    const previewScore = calculateRiskScore(newRisk.probability, newRisk.frequency, newRisk.severity);
    const previewLevel = getRiskLevel(previewScore);

    async function handleAddRisk(e) {
        e.preventDefault();
        if (!newRisk.observationId) {
            toast.warning('Lütfen bir gözlem seçin');
            return;
        }
        try {
            await createHazard(newRisk);
            toast.success('Risk başarıyla eklendi');
            setShowAddModal(false);
            setNewRisk({ observationId: '', type: 'diger', description: '', probability: 3, frequency: 2, severity: 7 });
            loadData();
        } catch (err) {
            toast.error('Risk eklenemedi: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Bu riski silmek istediğinize emin misiniz?')) return;
        try {
            await deleteHazard(id);
            toast.success('Risk silindi');
            loadData();
        } catch (err) { toast.error('Silinemedi'); }
    }

    async function handleAddOpportunity(e) {
        e.preventDefault();
        try {
            await createOpportunity(newOpp);
            toast.success('Fırsat başarıyla kaydedildi');
            setNewOpp({ type: 'process', source: '', description: '', priority: 'medium' });
            loadData();
        } catch { toast.error('Hata oluştu'); }
    }

    async function handleStatusChange(id, status) {
        try {
            await updateOpportunity(id, { status });
            toast.success('Durum güncellendi');
            loadData();
        } catch { toast.error('Güncellenemedi'); }
    }

    async function handleDeleteOpp(id) {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        try {
            await deleteOpportunity(id);
            toast.success('Fırsat silindi');
            loadData();
        } catch { toast.error('Silinemedi'); }
    }

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Activity size={40} style={{ animation: 'pulse 1.5s infinite' }} />
                    <p style={{ marginTop: 'var(--space-md)' }}>Risk verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <AlertTriangle size={28} style={{ color: 'var(--color-warning)' }} />
                        Risk Değerlendirme
                    </h1>
                    <p className="page-subtitle">Fine-Kinney Yöntemi — Olasılık (P) × Frekans (F) × Şiddet (S)</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Yeni Risk Ekle
                </button>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)', gap: 'var(--space-sm)' }}>
                    <div className="glass-card stat-card">
                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
                            <span className="stat-label" style={{ margin: 0 }}>Toplam Risk</span>
                        </div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            <Zap size={18} style={{ color: 'var(--color-danger)' }} />
                            <span className="stat-label" style={{ margin: 0 }}>Kritik Risk</span>
                        </div>
                        <div className="stat-value" style={{ background: 'linear-gradient(135deg, var(--color-danger), #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {(stats.byLevel['very-high'] || 0) + (stats.byLevel['high'] || 0)}
                        </div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            <BarChart3 size={18} style={{ color: 'var(--color-warning)' }} />
                            <span className="stat-label" style={{ margin: 0 }}>Ort. Skor</span>
                        </div>
                        <div className="stat-value">{stats.averageScore}</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            {stats.averageScore > 200 ? <TrendingUp size={18} style={{ color: 'var(--color-danger)' }} /> :
                                stats.averageScore > 70 ? <Minus size={18} style={{ color: 'var(--color-warning)' }} /> :
                                    <TrendingDown size={18} style={{ color: 'var(--color-success)' }} />}
                            <span className="stat-label" style={{ margin: 0 }}>Durum</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: stats.averageScore > 200 ? 'var(--color-danger)' : stats.averageScore > 70 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {stats.averageScore > 200 ? '⚠️ Yüksek Riskli' : stats.averageScore > 70 ? '🔶 Orta Riskli' : '✅ Kontrol Altında'}
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Distribution Bar */}
            {distData.length > 0 && stats.total > 0 && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📊 Risk Dağılımı</h2>
                    <div style={{ display: 'flex', height: 32, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-sm)' }}>
                        {distData.filter(d => d.count > 0).map(d => (
                            <div key={d.level} style={{
                                width: `${d.pct}%`, minWidth: d.pct > 0 ? 24 : 0,
                                background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6875rem', fontWeight: 700, color: '#fff',
                                transition: 'width var(--transition-normal)',
                                cursor: 'pointer', position: 'relative'
                            }}
                                title={`${d.label}: ${d.count} adet (${d.pct}%)`}
                                onClick={() => setFilterLevel(filterLevel === d.level ? 'all' : d.level)}
                            >
                                {d.pct >= 10 ? `${d.count}` : ''}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                        {distData.map(d => (
                            <div key={d.level} className="flex items-center gap-xs" style={{ fontSize: '0.75rem', cursor: 'pointer', opacity: filterLevel === 'all' || filterLevel === d.level ? 1 : 0.4 }}
                                onClick={() => setFilterLevel(filterLevel === d.level ? 'all' : d.level)}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                                <span style={{ color: 'var(--text-secondary)' }}>{d.label}: <strong>{d.count}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View Toggle & Filters */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* View mode */}
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button onClick={() => setViewMode('list')} style={{
                        padding: '6px 12px', border: 'none', cursor: 'pointer',
                        background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
                        color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem'
                    }}><List size={14} /> Liste</button>
                    <button onClick={() => setViewMode('matrix')} style={{
                        padding: '6px 12px', border: 'none', cursor: 'pointer',
                        background: viewMode === 'matrix' ? 'var(--color-primary)' : 'transparent',
                        color: viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem'
                    }}><Grid3X3 size={14} /> Matris</button>
                    <button onClick={() => setViewMode('opportunities')} style={{
                        padding: '6px 12px', border: 'none', cursor: 'pointer',
                        background: viewMode === 'opportunities' ? 'var(--color-success)' : 'transparent',
                        color: viewMode === 'opportunities' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem'
                    }}><Lightbulb size={14} /> Fırsatlar</button>
                </div>

                {/* Search */}
                <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 34, padding: '6px 10px 6px 34px', fontSize: '0.8125rem' }} />
                </div>

                {/* Filters */}
                <select className="form-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '6px 28px 6px 10px', minWidth: 130 }}>
                    <option value="all">Tüm Seviyeler</option>
                    {RISK_LEVELS.map(l => <option key={l.level} value={l.level}>{l.label}</option>)}
                </select>

                <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '6px 28px 6px 10px', minWidth: 130 }}>
                    <option value="all">Tüm Kategoriler</option>
                    {HAZARD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>

                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '6px 28px 6px 10px', minWidth: 130 }}>
                    <option value="score-desc">Skor ↓</option>
                    <option value="score-asc">Skor ↑</option>
                    <option value="date-desc">Yeni → Eski</option>
                    <option value="date-asc">Eski → Yeni</option>
                </select>
            </div>

            {/* MATRIX VIEW */}
            {viewMode === 'matrix' && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', overflowX: 'auto' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🎯 Risk Matrisi (P × S, F=max)</h2>
                    <div style={{ minWidth: 500 }}>
                        {/* Header row - Severity */}
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: 3, marginBottom: 3 }}>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>P ↓ / S →</div>
                            {matrixData.sVals.map(s => (
                                <div key={s} style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' }}>
                                    S={s}
                                </div>
                            ))}
                        </div>
                        {/* Matrix rows */}
                        {matrixData.pVals.map((p, pi) => (
                            <div key={p} style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: 3, marginBottom: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    P={p}
                                </div>
                                {matrixData.cells[pi].map((cell, si) => (
                                    <div key={si} style={{
                                        background: `${cell.level.color}${cell.count > 0 ? 'DD' : '30'}`,
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        minHeight: 52, cursor: 'default',
                                        border: cell.count > 0 ? `2px solid ${cell.level.color}` : '1px solid transparent',
                                        transition: 'all var(--transition-fast)',
                                        position: 'relative'
                                    }}
                                        title={`P=${p}, S=${matrixData.sVals[si]} → Skor: ${cell.score} (${cell.level.label}) | ${cell.count} tehlike`}
                                    >
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: cell.count > 0 ? '#fff' : cell.level.color }}>
                                            {cell.score}
                                        </span>
                                        {cell.count > 0 && (
                                            <span style={{
                                                position: 'absolute', top: 2, right: 4,
                                                fontSize: '0.5625rem', fontWeight: 800,
                                                background: '#fff', color: cell.level.color,
                                                borderRadius: 'var(--radius-full)',
                                                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>{cell.count}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
                        Hücrelerdeki sayı risk skorunu, köşedeki badge ise o hücredeki tehlike adedini gösterir
                    </div>
                </div>
            )}

            {/* Risk Scale (collapsible) */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    📋 Fine-Kinney Risk Skalası
                </h2>
                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    {RISK_LEVELS.map(level => {
                        const count = stats?.byLevel[level.level] || 0;
                        return (
                            <div key={level.level} style={{
                                flex: 1, minWidth: 150,
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                background: `${level.color}12`,
                                borderLeft: `4px solid ${level.color}`,
                                cursor: 'pointer',
                                opacity: filterLevel === 'all' || filterLevel === level.level ? 1 : 0.4,
                                transition: 'all var(--transition-fast)'
                            }} onClick={() => setFilterLevel(filterLevel === level.level ? 'all' : level.level)}>
                                <div className="flex items-center justify-between">
                                    <span style={{ fontWeight: 700, color: level.color, fontSize: '0.875rem' }}>{level.label}</span>
                                    <span className="badge" style={{ background: `${level.color}25`, color: level.color }}>{count}</span>
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    {level.min}–{level.max === Infinity ? '∞' : level.max} puan
                                </div>
                                <div style={{ fontSize: '0.6875rem', marginTop: 4, color: 'var(--text-secondary)' }}>{level.action}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* LIST VIEW - Hazard List */}
            {viewMode === 'list' && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            Tehlikeler ({filteredHazards.length}{filteredHazards.length !== hazards.length ? ` / ${hazards.length}` : ''})
                        </h2>
                        {(filterLevel !== 'all' || filterCategory !== 'all' || searchTerm) && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterLevel('all'); setFilterCategory('all'); setSearchTerm(''); }}>
                                <X size={14} /> Filtreleri Temizle
                            </button>
                        )}
                    </div>

                    {filteredHazards.length === 0 ? (
                        <div className="empty-state">
                            <AlertTriangle size={48} />
                            <h3>{hazards.length === 0 ? 'Henüz risk değerlendirmesi yok' : 'Filtreye uygun sonuç bulunamadı'}</h3>
                            <p style={{ fontSize: '0.8125rem' }}>
                                {hazards.length === 0
                                    ? 'Yeni Risk Ekle butonuna tıklayarak veya gözlem detayından tehlike ekleyebilirsiniz'
                                    : 'Filtre kriterlerini değiştirmeyi deneyin'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {filteredHazards.map(h => {
                                const cat = HAZARD_CATEGORIES.find(c => c.id === h.type);
                                const isExpanded = expandedId === h.id;
                                return (
                                    <div key={h.id} style={{
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderLeft: `4px solid ${h.riskColor}`,
                                        overflow: 'hidden',
                                        transition: 'all var(--transition-fast)'
                                    }}>
                                        {/* Main row */}
                                        <div style={{
                                            padding: 'var(--space-md)',
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                            cursor: 'pointer'
                                        }} onClick={() => setExpandedId(isExpanded ? null : h.id)}>
                                            {/* Score badge */}
                                            <div style={{
                                                minWidth: 56, height: 56,
                                                borderRadius: 'var(--radius-md)',
                                                background: `${h.riskColor}20`,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: h.riskColor, lineHeight: 1 }}>{h.riskScore}</span>
                                                <span style={{ fontSize: '0.5625rem', color: h.riskColor, fontWeight: 600 }}>SKOR</span>
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '1rem' }}>{cat?.icon || '📋'}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat?.label || h.type}</span>
                                                    <span className="badge" style={{ background: `${h.riskColor}20`, color: h.riskColor, fontSize: '0.6875rem' }}>
                                                        {h.riskLabel}
                                                    </span>
                                                </div>
                                                {h.description && (
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                                                        {h.description}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    P:{h.probability} × F:{h.frequency} × S:{h.severity} &nbsp;|&nbsp;
                                                    {h.createdAt ? new Date(h.createdAt).toLocaleDateString('tr-TR') : '-'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-xs">
                                                {h.observationId && (
                                                    <Link to={`/observations/${h.observationId}`} className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} title="Gözlem Detayı"
                                                        onClick={e => e.stopPropagation()}>
                                                        <Eye size={14} />
                                                    </Link>
                                                )}
                                                <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, color: 'var(--color-danger)' }}
                                                    title="Sil" onClick={e => { e.stopPropagation(); handleDelete(h.id); }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '0 var(--space-md) var(--space-md)',
                                                borderTop: '1px solid var(--border-color)',
                                                paddingTop: 'var(--space-md)',
                                                animation: 'fadeIn var(--transition-fast)'
                                            }}>
                                                {/* P/F/S visual bars */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                                    {[
                                                        { label: 'Olasılık (P)', val: h.probability, max: 10, color: '#3B82F6' },
                                                        { label: 'Frekans (F)', val: h.frequency, max: 10, color: '#8B5CF6' },
                                                        { label: 'Şiddet (S)', val: h.severity, max: 100, color: '#EF4444' }
                                                    ].map(item => (
                                                        <div key={item.label}>
                                                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}: <strong style={{ color: item.color }}>{item.val}</strong></div>
                                                            <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%', borderRadius: 3,
                                                                    background: item.color,
                                                                    width: `${Math.min((item.val / item.max) * 100, 100)}%`,
                                                                    transition: 'width var(--transition-normal)'
                                                                }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* RCA Entegrasyonu (6.1.2) */}
                                                <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px dashed var(--border-color)' }}>
                                                    <RootCauseAnalysis parentId={h.id} parentType="hazard" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* OPPORTUNITIES VIEW (6.1.2) */}
            {viewMode === 'opportunities' && (
                <div className="flex flex-col gap-lg">
                    {/* New Opp Form */}
                    <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <Plus size={20} style={{ color: 'var(--color-success)' }} /> Yeni İSG Fırsatı Tanımla
                        </h2>
                        <form onSubmit={handleAddOpportunity} className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Fırsat Türü</label>
                                <select className="form-select" value={newOpp.type} onChange={e => setNewOpp({ ...newOpp, type: e.target.value })}>
                                    {OPPORTUNITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kaynak / Alan</label>
                                <input className="form-input" placeholder="Örn: Hangar 2 Havalandırma" value={newOpp.source} onChange={e => setNewOpp({ ...newOpp, source: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Fırsat ve Beklenen Fayda Açıklaması</label>
                                <textarea className="form-textarea" rows={2} placeholder="Süreci nasıl iyileştirebiliriz?" value={newOpp.description} onChange={e => setNewOpp({ ...newOpp, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Öncelik</label>
                                <select className="form-select" value={newOpp.priority} onChange={e => setNewOpp({ ...newOpp, priority: e.target.value })}>
                                    <option value="low">Düşük</option>
                                    <option value="medium">Orta</option>
                                    <option value="high">Yüksek</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                                    <Save size={16} /> Fırsatı Kaydet
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Opp List */}
                    <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Mevcut İSG İyileştirme Fırsatları</h2>
                        {opportunities.length === 0 ? (
                            <div className="empty-state">
                                <Lightbulb size={48} />
                                <p>Henüz tanımlanmış bir fırsat yok.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-sm">
                                {opportunities.map(opp => {
                                    const typeInfo = OPPORTUNITY_TYPES.find(t => t.id === opp.type);
                                    return (
                                        <div key={opp.id} className="glass-card" style={{ padding: 'var(--space-md)', borderLeft: `4px solid ${typeInfo?.color}` }}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-md">
                                                    <div style={{ fontSize: '1.5rem' }}>{typeInfo?.icon}</div>
                                                    <div>
                                                        <div className="flex items-center gap-sm">
                                                            <span style={{ fontWeight: 700 }}>{typeInfo?.label}</span>
                                                            <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>{opp.source}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>{opp.description}</p>
                                                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            <span>📅 {new Date(opp.createdAt).toLocaleDateString()}</span>
                                                            <span>🎯 Öncelik: {opp.priority === 'high' ? '🔴 Yüksek' : opp.priority === 'medium' ? '🟡 Orta' : '🟢 Düşük'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-xs">
                                                    <select
                                                        className="form-select btn-sm"
                                                        value={opp.status}
                                                        onChange={e => handleStatusChange(opp.id, e.target.value)}
                                                        style={{ width: 120, fontSize: '0.75rem' }}
                                                    >
                                                        <option value="open">Açık</option>
                                                        <option value="evaluating">Değerlendiriliyor</option>
                                                        <option value="planned">Planlandı</option>
                                                        <option value="implemented">Uygulandı</option>
                                                    </select>
                                                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteOpp(opp.id)}>
                                                        <Trash2 size={12} /> Sil
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FAB for mobile */}
            <button className="fab" onClick={() => setShowAddModal(true)} title="Yeni Risk Ekle">
                <Plus size={24} />
            </button>

            {/* ADD RISK MODAL */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
                        <div className="modal-header">
                            <h2>Yeni Risk Değerlendirmesi</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddRisk}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {/* Observation select */}
                                <div className="form-group">
                                    <label className="form-label">Bağlı Gözlem *</label>
                                    <select className="form-select" required value={newRisk.observationId} onChange={e => setNewRisk({ ...newRisk, observationId: Number(e.target.value) })}>
                                        <option value="">Gözlem seçin...</option>
                                        {observations.map(o => (
                                            <option key={o.id} value={o.id}>#{o.id} — {(o.description || '').substring(0, 60)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="form-group">
                                    <label className="form-label">Tehlike Kategorisi (Taksonomi)</label>
                                    <select className="form-select" value={newRisk.type} onChange={e => setNewRisk({ ...newRisk, type: e.target.value })}>
                                        {HAZARD_GROUPS.map(group => (
                                            <optgroup key={group.id} label={`${group.icon} ${group.label}`}>
                                                {HAZARD_CATEGORIES.filter(c => c.group === group.id).map(c => (
                                                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label className="form-label">Tehlike Açıklaması</label>
                                    <textarea className="form-textarea" placeholder="Tehlikeyi tanımlayın..." value={newRisk.description}
                                        onChange={e => setNewRisk({ ...newRisk, description: e.target.value })} rows={2} />
                                </div>

                                {/* P / F / S selectors */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Olasılık (P)</label>
                                        <select className="form-select" value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: Number(e.target.value) })}>
                                            {PROBABILITY_VALUES.map(p => <option key={p.value} value={p.value}>{p.value} — {p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Frekans (F)</label>
                                        <select className="form-select" value={newRisk.frequency} onChange={e => setNewRisk({ ...newRisk, frequency: Number(e.target.value) })}>
                                            {FREQUENCY_VALUES.map(f => <option key={f.value} value={f.value}>{f.value} — {f.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Şiddet (S)</label>
                                        <select className="form-select" value={newRisk.severity} onChange={e => setNewRisk({ ...newRisk, severity: Number(e.target.value) })}>
                                            {SEVERITY_VALUES.map(s => <option key={s.value} value={s.value}>{s.value} — {s.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div style={{
                                    padding: 'var(--space-md)',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${previewLevel.color}15`,
                                    border: `2px solid ${previewLevel.color}`,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {newRisk.probability} × {newRisk.frequency} × {newRisk.severity} =
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: previewLevel.color, lineHeight: 1.1 }}>
                                        {previewScore}
                                    </div>
                                    <div style={{ fontWeight: 700, color: previewLevel.color, fontSize: '0.9375rem', marginTop: 4 }}>
                                        {previewLevel.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {previewLevel.action}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Risk Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
