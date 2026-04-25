import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Filter, BarChart3, Activity } from 'lucide-react';
import { getAllObservations } from '../services/observationService';
import { HAZARD_CATEGORIES } from '../config/categories';

/**
 * Zaman Serisi Trend Analizi Bileşeni
 * Gözlemlerin fotoğraf analiz verilerinden trend grafikleri oluşturur.
 */
export default function TrendAnalysis() {
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all'); // 'week', 'month', '3months', 'all'
    const [selectedMetric, setSelectedMetric] = useState('overallRiskScore');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const all = await getAllObservations();
            setObservations(all.filter(o => o.photoAnalysis));
        } catch (err) {
            console.error('Veri yükleme hatası:', err);
        } finally {
            setLoading(false);
        }
    }

    // Filtreleme
    const filtered = useMemo(() => {
        let data = [...observations];

        if (categoryFilter !== 'all') {
            data = data.filter(o => o.category === categoryFilter);
        }

        if (dateRange !== 'all') {
            const now = new Date();
            const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
            const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
            data = data.filter(o => new Date(o.createdAt) >= cutoff);
        }

        return data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [observations, categoryFilter, dateRange]);

    // Metrik değerlerini çıkar
    const dataPoints = useMemo(() => {
        return filtered.map(o => ({
            date: new Date(o.createdAt),
            dateLabel: new Date(o.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
            riskScore: o.photoAnalysis.overallRiskScore || 0,
            brightness: o.photoAnalysis.metrics?.brightness || 0,
            contrast: o.photoAnalysis.metrics?.contrast || 0,
            blurriness: o.photoAnalysis.metrics?.blurriness || 0,
            saturation: o.photoAnalysis.metrics?.saturation || 0,
            category: o.category,
            riskLevel: o.photoAnalysis.riskLevel
        }));
    }, [filtered]);

    // İstatistikler
    const stats = useMemo(() => {
        if (dataPoints.length === 0) return null;
        const scores = dataPoints.map(d => d.riskScore);
        const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
        const max = Math.max(...scores);
        const min = Math.min(...scores);

        // Trend yönü
        let trend = 'stable';
        if (dataPoints.length >= 3) {
            const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
            const secondHalf = scores.slice(Math.floor(scores.length / 2));
            const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
            if (avgSecond < avgFirst * 0.85) trend = 'improving';
            else if (avgSecond > avgFirst * 1.15) trend = 'worsening';
        }

        // Kategori dağılımı
        const catCounts = {};
        for (const d of dataPoints) {
            catCounts[d.category] = (catCounts[d.category] || 0) + 1;
        }
        const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

        // Risk seviyesi dağılımı
        const riskDist = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const d of dataPoints) {
            if (riskDist.hasOwnProperty(d.riskLevel)) riskDist[d.riskLevel]++;
        }

        return { avg, max, min, trend, topCategory, riskDist, total: dataPoints.length };
    }, [dataPoints]);

    const METRICS = [
        { id: 'riskScore', label: 'Risk Skoru', color: '#F97316' },
        { id: 'brightness', label: 'Parlaklık', color: '#EAB308' },
        { id: 'contrast', label: 'Kontrast', color: '#3B82F6' },
        { id: 'blurriness', label: 'Netlik', color: '#8B5CF6' },
        { id: 'saturation', label: 'Doygunluk', color: '#22C55E' }
    ];

    // SVG Grafik
    function renderChart() {
        if (dataPoints.length < 2) return null;

        const metric = METRICS.find(m => m.id === selectedMetric) || METRICS[0];
        const values = dataPoints.map(d => d[selectedMetric] || d.riskScore);
        const maxVal = Math.max(...values, 1);
        const minVal = Math.min(...values, 0);
        const range = maxVal - minVal || 1;

        const w = 600, h = 200, padX = 40, padY = 20;
        const chartW = w - padX * 2, chartH = h - padY * 2;
        const stepX = chartW / (values.length - 1);

        const points = values.map((v, i) => ({
            x: padX + i * stepX,
            y: padY + chartH - ((v - minVal) / range) * chartH
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const areaPath = `${linePath} L${points[points.length - 1].x},${padY + chartH} L${padX},${padY + chartH} Z`;

        return (
            <svg viewBox={`0 0 ${w} ${h}`} className="trend-chart" style={{ width: '100%', height: 'auto' }}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = padY + chartH * (1 - pct);
                    const val = Math.round(minVal + range * pct);
                    return (
                        <g key={i}>
                            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="var(--border-color)" strokeWidth="0.5" />
                            <text x={padX - 5} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">{val}</text>
                        </g>
                    );
                })}

                {/* Area */}
                <path d={areaPath} fill={`${metric.color}15`} />

                {/* Line */}
                <path d={linePath} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill={metric.color} stroke="var(--bg-primary)" strokeWidth="2" />
                        {dataPoints.length <= 15 && (
                            <text x={p.x} y={padY + chartH + 15} textAnchor="middle" fill="var(--text-muted)" fontSize="7">
                                {dataPoints[i].dateLabel}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        );
    }

    if (loading) return <div style={{ padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>Yükleniyor...</div>;

    return (
        <div className="trend-analysis">
            {/* Filtreler */}
            <div className="flex gap-sm" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '0.375rem 2rem 0.375rem 0.75rem', minWidth: 140 }}>
                    <option value="all">Tüm Kategoriler</option>
                    {HAZARD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
                <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '0.375rem 2rem 0.375rem 0.75rem', minWidth: 120 }}>
                    <option value="all">Tüm Dönem</option>
                    <option value="week">Son 7 Gün</option>
                    <option value="month">Son 30 Gün</option>
                    <option value="3months">Son 3 Ay</option>
                </select>
            </div>

            {dataPoints.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                    <BarChart3 size={48} />
                    <h3>Henüz yeterli veri yok</h3>
                    <p>Fotoğraf analizi içeren gözlemler eklendikçe trend grafikleri burada görünecek.</p>
                </div>
            ) : (
                <>
                    {/* İstatistik Kartları */}
                    {stats && (
                        <div className="trend-stats-grid">
                            <div className="trend-stat-card">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Analiz Sayısı</div>
                            </div>
                            <div className="trend-stat-card">
                                <div className="stat-value" style={{ color: stats.avg > 50 ? '#F97316' : '#22C55E' }}>{stats.avg}</div>
                                <div className="stat-label">Ortalama Risk</div>
                            </div>
                            <div className="trend-stat-card">
                                <div className="flex items-center gap-xs" style={{ justifyContent: 'center' }}>
                                    {stats.trend === 'improving' ? <TrendingDown size={20} style={{ color: '#22C55E' }} /> :
                                        stats.trend === 'worsening' ? <TrendingUp size={20} style={{ color: '#DC2626' }} /> :
                                            <Minus size={20} style={{ color: '#64748B' }} />}
                                    <div className="stat-value" style={{
                                        color: stats.trend === 'improving' ? '#22C55E' : stats.trend === 'worsening' ? '#DC2626' : '#64748B',
                                        fontSize: '0.875rem'
                                    }}>
                                        {stats.trend === 'improving' ? 'İyileşme' : stats.trend === 'worsening' ? 'Kötüleşme' : 'Sabit'}
                                    </div>
                                </div>
                                <div className="stat-label">Trend Yönü</div>
                            </div>
                            <div className="trend-stat-card">
                                <div className="stat-value" style={{ color: '#DC2626' }}>{stats.max}</div>
                                <div className="stat-label">En Yüksek Risk</div>
                            </div>
                        </div>
                    )}

                    {/* Metrik Seçici */}
                    <div className="flex gap-xs" style={{ marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {METRICS.map(m => (
                            <button
                                key={m.id}
                                className={`btn btn-sm ${selectedMetric === m.id ? 'btn-primary' : 'btn-secondary'}`}
                                style={selectedMetric === m.id ? { background: m.color } : {}}
                                onClick={() => setSelectedMetric(m.id)}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Grafik */}
                    <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        {renderChart()}
                    </div>

                    {/* Risk Dağılımı */}
                    {stats && (
                        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                                <Activity size={14} style={{ verticalAlign: 'middle', color: 'var(--color-primary)' }} /> Risk Seviyesi Dağılımı
                            </h3>
                            <div className="risk-dist-bars">
                                {[
                                    { key: 'low', label: 'Düşük', color: '#22C55E' },
                                    { key: 'medium', label: 'Orta', color: '#EAB308' },
                                    { key: 'high', label: 'Yüksek', color: '#F97316' },
                                    { key: 'critical', label: 'Kritik', color: '#DC2626' }
                                ].map(r => {
                                    const count = stats.riskDist[r.key] || 0;
                                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                    return (
                                        <div key={r.key} className="risk-dist-row">
                                            <span className="risk-dist-label">{r.label}</span>
                                            <div className="risk-dist-bar">
                                                <div className="risk-dist-fill" style={{ width: `${pct}%`, background: r.color }} />
                                            </div>
                                            <span className="risk-dist-value">{count} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
