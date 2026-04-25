import { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronDown, ChevronRight, Filter, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { REGULATIONS, searchRegulations } from '../config/regulations';
import { COMPLIANCE_STATUSES } from '../config/categories';
import { getEvaluationsMap, saveComplianceEvaluation, getComplianceStats } from '../services/regulationService';
import { useToast } from '../components/Common/Toast';

export default function Regulations() {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});
    const [evaluations, setEvaluations] = useState({});
    const [stats, setStats] = useState({ totalEvaluated: 0, compliant: 0, partial: 0, nonCompliant: 0 });
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [map, currStats] = await Promise.all([
            getEvaluationsMap(),
            getComplianceStats()
        ]);
        setEvaluations(map);
        setStats(currStats);
    }

    const toggle = (code) => setExpanded(e => ({ ...e, [code]: !e[code] }));

    const searchResults = search.length > 1 ? searchRegulations(search) : [];

    const handleEvaluationChange = async (regCode, articleNum, statusId) => {
        try {
            await saveComplianceEvaluation(regCode, articleNum, { status: statusId });
            toast.success('Uygunluk durumu güncellendi');
            loadData();
        } catch (err) {
            toast.error('Güncellenirken hata oluştu');
        }
    };

    const getStatusInfo = (regCode, articleNum) => {
        const evalRecord = evaluations[regCode]?.[articleNum];
        const statusId = evalRecord ? evalRecord.status : 'not_evaluated';
        return COMPLIANCE_STATUSES.find(s => s.id === statusId) || COMPLIANCE_STATUSES[4];
    };

    // Total articles count across all regulations
    const totalArticles = REGULATIONS.reduce((acc, reg) => acc + reg.articles.length, 0);

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <BookOpen size={28} style={{ color: 'var(--color-info)' }} />
                        Mevzuat ve Standart Uyumu
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 9.1.2 — Uygunluk Değerlendirmesi</p>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="glass-card stat-card">
                    <div className="stat-value">{stats.totalEvaluated} / {totalArticles}</div>
                    <div className="stat-label">Değerlendirilen Maddeler</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.compliant}</div>
                    <div className="stat-label flex items-center gap-xs"><CheckCircle size={14} /> Tam Uygunluk</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.partial}</div>
                    <div className="stat-label flex items-center gap-xs"><AlertTriangle size={14} /> Kısmi Uygun</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.nonCompliant}</div>
                    <div className="stat-label flex items-center gap-xs"><HelpCircle size={14} /> Uygunsuz</div>
                </div>
            </div>

            {/* Arama */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-xl)' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Mevzuat veya madde ara... (örn: KKD, risk, eğitim)"
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }} />
            </div>

            {/* Search Results */}
            {search.length > 1 && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                        Arama Sonuçları ({searchResults.length})
                    </h2>
                    {searchResults.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sonuç bulunamadı</p>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {searchResults.map((r, i) => {
                                const statusInfo = getStatusInfo(r.regulationCode, r.number);
                                return (
                                    <div key={i} style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderLeft: `3px solid ${statusInfo.color}`
                                    }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-info)' }}>
                                                    {r.regulationCode} — {r.number}: {r.title}
                                                </div>
                                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                                    {r.summary}
                                                </div>
                                            </div>
                                            <div className="flex gap-sm items-center">
                                                <div className="flex flex-col gap-sm items-end">
                                                    <select
                                                        className="form-select text-sm"
                                                        style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto', minHeight: 'unset', width: 'auto', background: `${statusInfo.color}15`, color: statusInfo.color, borderColor: `${statusInfo.color}30` }}
                                                        value={statusInfo.id}
                                                        onChange={(e) => handleEvaluationChange(r.regulationCode, r.number, e.target.value)}
                                                    >
                                                        {COMPLIANCE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* All Regulations */}
            <div className="flex flex-col gap-md">
                {REGULATIONS.map(reg => {
                    const regArticlesCount = reg.articles.length;
                    const evalArticles = reg.articles.map(a => getStatusInfo(reg.code, a.number));
                    const numCompliant = evalArticles.filter(e => e.id === 'compliant').length;

                    // Simple % compliance
                    const percentCompliant = Math.round((numCompliant / regArticlesCount) * 100);
                    let badgeColor = percentCompliant === 100 ? 'var(--color-success)' : percentCompliant > 50 ? 'var(--color-warning)' : 'var(--color-danger)';
                    if (numCompliant === 0 && evalArticles.every(e => e.id === 'not_evaluated')) badgeColor = 'var(--text-muted)';

                    return (
                        <div key={reg.code} className="glass-card" style={{ overflow: 'hidden' }}>
                            <button
                                onClick={() => toggle(reg.code)}
                                style={{
                                    width: '100%', padding: 'var(--space-md) var(--space-lg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: expanded[reg.code] ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)',
                                    borderBottom: expanded[reg.code] ? '1px solid var(--border-color)' : 'none',
                                    cursor: 'pointer', transition: 'background var(--transition-fast)'
                                }}
                            >
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                                        📖 {reg.title}
                                    </div>
                                </div>
                                <div className="flex gap-md items-center">
                                    <div className="flex flex-col items-end">
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uyum: <strong>%{percentCompliant}</strong></div>
                                        <div style={{ width: '80px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginTop: 4 }}>
                                            <div style={{ height: '100%', width: `${percentCompliant}%`, background: badgeColor, transition: 'width 0.3s' }}></div>
                                        </div>
                                    </div>
                                    {expanded[reg.code] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                            </button>

                            {expanded[reg.code] && (
                                <div style={{ padding: 'var(--space-md)' }}>
                                    <div className="flex flex-col gap-sm">
                                        {reg.articles.map((art, i) => {
                                            const statusInfo = getStatusInfo(reg.code, art.number);
                                            return (
                                                <div key={i} style={{
                                                    padding: 'var(--space-md)',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'var(--bg-tertiary)',
                                                    borderLeft: `4px solid ${statusInfo.color}`
                                                }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-sm">
                                                            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>{art.number}</span>
                                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{art.title}</span>
                                                        </div>
                                                        <select
                                                            className="form-select"
                                                            style={{
                                                                width: '140px', padding: '0.25rem 0.5rem', fontSize: '0.8125rem', height: 'auto', minHeight: 'unset',
                                                                background: `${statusInfo.color}15`, color: statusInfo.color, borderColor: `${statusInfo.color}30`
                                                            }}
                                                            value={statusInfo.id}
                                                            onChange={(e) => handleEvaluationChange(reg.code, art.number, e.target.value)}
                                                        >
                                                            {COMPLIANCE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                                        {art.summary}
                                                    </p>
                                                    {statusInfo.id !== 'not_evaluated' && evaluations[reg.code]?.[art.number] && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                                            Son değerlendirme: {new Date(evaluations[reg.code][art.number].evaluatedAt).toLocaleDateString('tr-TR')} - {evaluations[reg.code][art.number].evaluatedBy}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
