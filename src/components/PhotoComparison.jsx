import { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Columns, SlidersHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

/**
 * Önce/Sonra Karşılaştırmalı Fotoğraf Analiz Bileşeni
 */
export default function PhotoComparison({ beforePhoto, afterPhoto, beforeAnalysis, afterAnalysis, onClose }) {
    const [mode, setMode] = useState('slider'); // 'slider' | 'sideBySide'
    
    const getUrl = (p) => {
        if (!p) return '';
        if (p.photoUrl) return p.photoUrl.startsWith('http') ? p.photoUrl : `${API_BASE}${p.photoUrl}`;
        return p.data;
    };
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    function handlePointerDown(e) {
        isDragging.current = true;
        updateSlider(e);
    }

    function handlePointerMove(e) {
        if (!isDragging.current) return;
        updateSlider(e);
    }

    function handlePointerUp() {
        isDragging.current = false;
    }

    function updateSlider(e) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
        setSliderPos(pct);
    }

    useEffect(() => {
        const up = () => { isDragging.current = false; };
        window.addEventListener('pointerup', up);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('touchend', up);
        };
    }, []);

    // Delta hesapla
    const deltas = [];
    if (beforeAnalysis?.metrics && afterAnalysis?.metrics) {
        const metrics = [
            { key: 'brightness', label: 'Parlaklık', icon: '💡' },
            { key: 'contrast', label: 'Kontrast', icon: '🌗' },
            { key: 'blurriness', label: 'Netlik', icon: '🔍' },
            { key: 'saturation', label: 'Doygunluk', icon: '🎨' },
            { key: 'edgeDensity', label: 'Kenar Yoğ.', icon: '📐' }
        ];
        for (const m of metrics) {
            const before = beforeAnalysis.metrics[m.key] || 0;
            const after = afterAnalysis.metrics[m.key] || 0;
            const diff = after - before;
            deltas.push({ ...m, before, after, diff, pct: before > 0 ? Math.round((diff / before) * 100) : 0 });
        }
    }

    const riskDelta = (afterAnalysis?.overallRiskScore || 0) - (beforeAnalysis?.overallRiskScore || 0);

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: 800 }}>
                <div className="modal-header">
                    <h2>📊 Önce / Sonra Karşılaştırma</h2>
                    <div className="flex gap-sm">
                        <button
                            className={`btn btn-sm ${mode === 'slider' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setMode('slider')}
                        >
                            <SlidersHorizontal size={14} /> Slider
                        </button>
                        <button
                            className={`btn btn-sm ${mode === 'sideBySide' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setMode('sideBySide')}
                        >
                            <Columns size={14} /> Yan Yana
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="modal-body">
                    {mode === 'slider' ? (
                        <div
                            ref={containerRef}
                            className="comparison-slider-container"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                        >
                            <img src={getUrl(beforePhoto)} alt="Önce" className="comparison-img" />
                            <div className="comparison-overlay" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                                <img src={getUrl(afterPhoto)} alt="Sonra" className="comparison-img" />
                            </div>
                            <div className="comparison-handle" style={{ left: `${sliderPos}%` }}>
                                <div className="comparison-handle-line" />
                                <div className="comparison-handle-btn">
                                    <ArrowLeftRight size={16} />
                                </div>
                            </div>
                            <div className="comparison-label comparison-label-before">ÖNCE</div>
                            <div className="comparison-label comparison-label-after">SONRA</div>
                        </div>
                    ) : (
                        <div className="comparison-side-by-side">
                            <div className="comparison-side">
                                <div className="comparison-label-top">ÖNCE</div>
                                <img src={getUrl(beforePhoto)} alt="Önce" />
                                {beforeAnalysis && (
                                    <div className="comparison-score" style={{ background: `${beforeAnalysis.riskColor}20`, color: beforeAnalysis.riskColor }}>
                                        {beforeAnalysis.riskLabel} — {beforeAnalysis.overallRiskScore}
                                    </div>
                                )}
                            </div>
                            <div className="comparison-side">
                                <div className="comparison-label-top">SONRA</div>
                                <img src={getUrl(afterPhoto)} alt="Sonra" />
                                {afterAnalysis && (
                                    <div className="comparison-score" style={{ background: `${afterAnalysis.riskColor}20`, color: afterAnalysis.riskColor }}>
                                        {afterAnalysis.riskLabel} — {afterAnalysis.overallRiskScore}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Risk Delta */}
                    {beforeAnalysis && afterAnalysis && (
                        <div className="comparison-risk-delta" style={{
                            borderLeft: `4px solid ${riskDelta < 0 ? '#22C55E' : riskDelta > 0 ? '#DC2626' : '#64748B'}`
                        }}>
                            <div className="flex items-center gap-sm">
                                {riskDelta < 0 ? <TrendingDown size={20} style={{ color: '#22C55E' }} /> :
                                    riskDelta > 0 ? <TrendingUp size={20} style={{ color: '#DC2626' }} /> :
                                        <Minus size={20} style={{ color: '#64748B' }} />}
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Risk Değişimi: {riskDelta > 0 ? '+' : ''}{riskDelta}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {riskDelta < 0 ? '✅ İyileşme sağlanmış' : riskDelta > 0 ? '⚠️ Risk artmış' : '— Değişim yok'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metrik Tablosu */}
                    {deltas.length > 0 && (
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Metrik</th>
                                    <th>Önce</th>
                                    <th>Sonra</th>
                                    <th>Fark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deltas.map(d => (
                                    <tr key={d.key}>
                                        <td>{d.icon} {d.label}</td>
                                        <td>{d.before}</td>
                                        <td>{d.after}</td>
                                        <td style={{
                                            color: d.diff < 0 ? '#22C55E' : d.diff > 0 ? '#F97316' : 'var(--text-muted)',
                                            fontWeight: 700
                                        }}>
                                            {d.diff > 0 ? '+' : ''}{d.diff} ({d.pct > 0 ? '+' : ''}{d.pct}%)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
