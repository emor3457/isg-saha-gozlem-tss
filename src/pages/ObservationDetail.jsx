import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Calendar, User, Camera, Edit, Trash2,
    AlertTriangle, ListChecks, BookOpen, Plus, X, Shield, FileDown,
    Scan, Eye, Grid3x3, RefreshCw, Brain, ArrowLeftRight, QrCode, Pencil
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import { getObservationById, updateObservation, deleteObservation } from '../services/observationService';
import { createHazard, getHazardsByObservation } from '../services/riskService';
import { createAction, getActionsByObservation } from '../services/actionService';
import { HAZARD_CATEGORIES, SEVERITY_LEVELS, OBSERVATION_STATUSES } from '../config/categories';
import { PROBABILITY_VALUES, FREQUENCY_VALUES, SEVERITY_VALUES, getRiskLevel, calculateRiskScore } from '../config/fineKinney';
import { getRegulationsForCategory } from '../config/regulations';
import { getExpertOpinion } from '../config/recommendations';
import { analyzePhoto, generateRiskReport, drawHeatmapOverlay } from '../services/imageAnalysisService';
import { generateNonconformityReport } from '../services/nonconformityReportService';
import { detectObjects, generatePPEReport, drawDetectionsOnCanvas } from '../services/ppeDetectionService';
import { complianceAgent } from '../services/agents/complianceAgent';
import { ACTION_STATUSES } from '../config/categories';
import PhotoComparison from '../components/PhotoComparison';
import PhotoAnnotator from '../components/PhotoAnnotator';
import EquipmentTracker from '../components/EquipmentTracker';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

export default function ObservationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [obs, setObs] = useState(null);
    const [hazards, setHazards] = useState([]);
    const [actions, setActions] = useState([]);
    const [regulations, setRegulations] = useState([]);
    const [agentFindings, setAgentFindings] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [showRiskForm, setShowRiskForm] = useState(false);
    const [showActionForm, setShowActionForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sendingMail, setSendingMail] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const getPhotoUrl = (p) => {
        if (p.photoUrl) return p.photoUrl.startsWith('http') ? p.photoUrl : `${API_BASE}${p.photoUrl}`;
        return p.data;
    };

    // ... (diğer state tanımları aşağıda devam ediyor)

    async function handleSendEmail() {
        setSendingMail(true);
        try {
            const fileName = await generateNonconformityReport(obs, hazards, actions);
            toast.info('Rapor hazırlanıyor ve gönderiliyor...');
            
            // Backend API çağrısı
            const response = await fetch('http://localhost:3001/api/v1/reports/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: obs.assignedToEmail || 'isg-birimi@turkishtechnic.com',
                    subject: `🚨 İSG Uygunsuzluk Bildirimi: #${obs.id} - ${obs.area}`,
                    html: `<p>Merhaba, <b>${obs.area}</b> bölgesinde yeni bir uygunsuzluk saptanmıştır. Detaylar ekteki PDF raporundadır.</p>`,
                    fileName: fileName
                })
            });

            if (response.ok) toast.success('E-posta başarıyla gönderildi!');
            else toast.error('E-posta gönderilemedi.');
        } catch (err) {
            toast.error('Hata: ' + err.message);
        } finally {
            setSendingMail(false);
        }
    }

    const [heatmapUrl, setHeatmapUrl] = useState(null);
    const [reAnalyzing, setReAnalyzing] = useState(false);
    // New feature states
    const [ppeLoading, setPpeLoading] = useState(false);
    const [ppeReport, setPpeReport] = useState(null);
    const [ppeImageUrl, setPpeImageUrl] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showAnnotator, setShowAnnotator] = useState(false);
    const [annotatingPhotoIdx, setAnnotatingPhotoIdx] = useState(0);
    const [showEquipment, setShowEquipment] = useState(false);

    // Risk form
    const [riskForm, setRiskForm] = useState({ 
        probability: 1, 
        frequency: 2, 
        severity: 7, 
        type: '',
        hazardSource: '',
        hazardDescription: '',
        potentialImpact: ''
    });
    // Action form
    const [actionForm, setActionForm] = useState({ description: '', responsiblePerson: '', dueDate: '', notes: '' });

    useEffect(() => {
        loadDetail();
    }, [id]);

    async function loadDetail() {
        try {
            const data = await getObservationById(Number(id));
            if (!data) { navigate('/observations'); return; }
            setObs(data);

            const [h, a] = await Promise.all([
                getHazardsByObservation(Number(id)),
                getActionsByObservation(Number(id))
            ]);
            setHazards(h);
            setActions(a);

            // Load regulations for this category
            if (data.category) {
                const regs = getRegulationsForCategory(data.category);
                setRegulations(regs);
            }

            // Run Compliance Agent
            const findings = await complianceAgent.analyzeObservation(data);
            setAgentFindings(findings);

            // Get expert recommendation if hazards exist
            if (h.length > 0) {
                const maxRisk = h.reduce((max, hz) => hz.riskScore > max.riskScore ? hz : max, h[0]);
                const opinion = getExpertOpinion(data.category, maxRisk.riskLevel, maxRisk.riskScore);
                setRecommendation(opinion);
            }
        } catch (err) {
            toast.error('Gözlem detayı yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(newStatus) {
        await updateObservation(Number(id), { status: newStatus });
        toast.success('Durum güncellendi');
        loadDetail();
    }

    async function handleDelete() {
        if (!window.confirm('Bu gözlemi silmek istediğinize emin misiniz?')) return;
        await deleteObservation(Number(id));
        toast.success('Gözlem silindi');
        navigate('/observations');
    }

    async function handleAddRisk(e) {
        e.preventDefault();
        await createHazard({
            observationId: Number(id),
            type: obs.category,
            ...riskForm
        });
        toast.success('Tehlike/Risk eklendi');
        setShowRiskForm(false);
        setRiskForm({ 
            probability: 1, 
            frequency: 2, 
            severity: 7, 
            type: '',
            hazardSource: '',
            hazardDescription: '',
            potentialImpact: ''
        });
        loadDetail();
    }

    async function handleCreateActionFromRisk(hazard) {
        const recommendations = hazard.recommendedActions || [];
        const actionDesc = recommendations.length > 0 
            ? recommendations[0] 
            : `${hazard.hazardDescription} tehlikesi için önlem alınması.`;

        await createAction({
            observationId: Number(id),
            description: actionDesc,
            responsiblePerson: obs.assignedTo || '',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: `Tehlike Kaynağı: ${hazard.hazardSource}. Etki: ${hazard.potentialImpact}.`
        });
        toast.success('Önlem aksiyon olarak kaydedildi');
        loadDetail();
    }

    async function handleAddAction(e) {
        e.preventDefault();
        if (!actionForm.description) { toast.warning('Açıklama gerekli'); return; }
        await createAction({ observationId: Number(id), ...actionForm });
        toast.success('Aksiyon oluşturuldu');
        setShowActionForm(false);
        setActionForm({ description: '', responsiblePerson: '', dueDate: '', notes: '' });
        loadDetail();
    }

    if (loading || !obs) {
        return <div className="page text-center" style={{ padding: 'var(--space-2xl)' }}>Yükleniyor...</div>;
    }

    const cat = HAZARD_CATEGORIES.find(c => c.id === obs.category);
    const sev = SEVERITY_LEVELS.find(s => s.id === obs.severity);
    const currentRisk = riskForm.probability && riskForm.frequency && riskForm.severity
        ? calculateRiskScore(riskForm.probability, riskForm.frequency, riskForm.severity) : 0;
    const currentRiskLevel = currentRisk > 0 ? getRiskLevel(currentRisk) : null;

    return (
        <div className="page">
            {/* Back */}
            <button className="btn btn-ghost" onClick={() => navigate('/observations')} style={{ marginBottom: 'var(--space-md)' }}>
                <ArrowLeft size={18} /> Geri
            </button>

            {/* Header */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    <div className="flex items-center gap-sm">
                        <span style={{ fontSize: '2rem' }}>{cat?.icon || '📋'}</span>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{cat?.label || 'Gözlem'}</h1>
                            <div className="flex items-center gap-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span className="flex items-center gap-xs"><Calendar size={12} /> {new Date(obs.createdAt).toLocaleDateString('tr-TR')}</span>
                                <span className="flex items-center gap-xs"><MapPin size={12} /> {obs.area}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <select className="form-select" value={obs.status} onChange={e => handleStatusChange(e.target.value)}
                            style={{ fontSize: '0.8125rem', padding: '0.375rem 2rem 0.375rem 0.75rem' }}>
                            {OBSERVATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <button className="btn btn-secondary btn-sm" disabled={sendingMail} onClick={handleSendEmail}>
                            {sendingMail ? 'Gönderiliyor...' : '📧 Mail At'}
                        </button>
                        <button className="btn btn-primary btn-sm" title="Uygunsuzluk Raporu İndir"
                            onClick={async () => {
                                try {
                                    const fileName = await generateNonconformityReport(obs, hazards, actions);
                                    toast.success(`PDF rapor indirildi: ${fileName}`);
                                } catch (err) {
                                    toast.error('PDF oluşturulamadı: ' + err.message);
                                }
                            }}>
                            <FileDown size={16} /> PDF Rapor
                        </button>
                        <button className="btn btn-danger btn-icon" onClick={handleDelete} title="Sil"><Trash2 size={16} /></button>
                    </div>
                </div>

                <p style={{ marginBottom: 'var(--space-md)', lineHeight: 1.7 }}>{obs.description}</p>

                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: `${sev?.color}20`, color: sev?.color }}>
                        Ciddiyet: {sev?.label}
                    </span>
                    {obs.assignedTo && <span className="badge badge-info"><User size={12} /> {obs.assignedTo}</span>}
                    {obs.photos?.length > 0 && <span className="badge badge-primary"><Camera size={12} /> {obs.photos.length} Fotoğraf</span>}
                </div>

                {/* Photos */}
                {obs.photos?.length > 0 && (
                    <div className="photo-grid" style={{ marginTop: 'var(--space-md)' }}>
                        {obs.photos.map((p, i) => (
                            <div key={i} className="photo-thumb" style={{ height: 120, position: 'relative' }}>
                                <img src={showHeatmap && heatmapUrl && i === 0 ? heatmapUrl : getPhotoUrl(p)} alt={`Fotoğraf ${i + 1}`} />
                                {showHeatmap && i === 0 && (
                                    <div style={{
                                        position: 'absolute', top: 4, right: 4,
                                        background: 'rgba(249,115,22,0.9)', color: 'white',
                                        padding: '2px 6px', borderRadius: 4, fontSize: '0.625rem', fontWeight: 700
                                    }}>🗺️ ISIT HARİTASI</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Heatmap Toggle + Photo Tools */}
                {obs.photos?.length > 0 && (
                    <div className="flex gap-sm" style={{ marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {obs.photoAnalysis && (
                            <button
                                className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={async () => {
                                    if (!showHeatmap && !heatmapUrl && obs.photos[0]) {
                                        try {
                                            const analysis = await analyzePhoto(obs.photos[0].data);
                                            const overlay = await drawHeatmapOverlay(obs.photos[0].data, analysis.heatmap);
                                            setHeatmapUrl(overlay);
                                        } catch { /* silently fail */ }
                                    }
                                    setShowHeatmap(!showHeatmap);
                                }}
                            >
                                <Grid3x3 size={14} /> {showHeatmap ? 'Normal' : 'Isı Haritası'}
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={ppeLoading}
                            onClick={async () => {
                                setPpeLoading(true);
                                try {
                                    const dets = await detectObjects(obs.photos[0].data, (msg) => toast.info(msg));
                                    const report = generatePPEReport(dets);
                                    setPpeReport(report);
                                    // Canvas overlay
                                    const img = new Image();
                                    img.onload = () => {
                                        const c = document.createElement('canvas');
                                        c.width = img.width; c.height = img.height;
                                        const ctx = c.getContext('2d');
                                        ctx.drawImage(img, 0, 0);
                                        drawDetectionsOnCanvas(c, dets);
                                        setPpeImageUrl(c.toDataURL('image/jpeg', 0.9));
                                    };
                                    img.src = obs.photos[0].data;
                                    toast.success(`🧠 ${dets.length} nesne tespit edildi`);
                                } catch (err) { toast.error('AI tarama hatası: ' + err.message); }
                                finally { setPpeLoading(false); }
                            }}
                        >
                            <Brain size={14} className={ppeLoading ? 'spin' : ''} /> {ppeLoading ? 'Taranıyor...' : 'KKD Tarama'}
                        </button>
                        {obs.photos.length >= 2 && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowComparison(true)}>
                                <ArrowLeftRight size={14} /> Karşılaştır
                            </button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowEquipment(true)}>
                            <QrCode size={14} /> QR Tara
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setAnnotatingPhotoIdx(0); setShowAnnotator(true); }}>
                            <Pencil size={14} /> Düzenle
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ FOTOĞRAF ANALİZ SONUÇLARI ═══ */}
            {obs.photoAnalysis && (
                <div className="glass-card photo-analysis-section" style={{
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-lg)',
                    borderLeft: `4px solid ${obs.photoAnalysis.riskColor}`
                }}>
                    {/* Başlık */}
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            <Scan size={18} style={{ color: obs.photoAnalysis.riskColor, verticalAlign: 'middle' }} /> Fotoğraf Analizi
                        </h2>
                        <div className="flex items-center gap-sm">
                            <span className="badge" style={{
                                background: `${obs.photoAnalysis.riskColor}20`,
                                color: obs.photoAnalysis.riskColor,
                                fontWeight: 800,
                                fontSize: '0.8125rem',
                                padding: '4px 12px'
                            }}>
                                {obs.photoAnalysis.riskLabel} — Skor: {obs.photoAnalysis.overallRiskScore}
                            </span>
                            <button
                                className="btn btn-sm btn-ghost"
                                title="Yeniden Analiz Et"
                                disabled={reAnalyzing}
                                onClick={async () => {
                                    if (!obs.photos?.[0]) return;
                                    setReAnalyzing(true);
                                    try {
                                        const analysis = await analyzePhoto(obs.photos[0].data);
                                        const report = generateRiskReport(analysis, obs.category, obs.area);
                                        const { updateObservation } = await import('../services/observationService');
                                        await updateObservation(Number(id), { photoAnalysis: report });
                                        loadDetail();
                                    } catch { /* fail silently */ } finally { setReAnalyzing(false); }
                                }}
                            >
                                <RefreshCw size={14} className={reAnalyzing ? 'spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Metrikler */}
                    {obs.photoAnalysis.metrics && (
                        <div className="analysis-metrics-grid">
                            {[
                                { label: 'Parlaklık', value: obs.photoAnalysis.metrics.brightness, max: 255, unit: '', icon: '💡' },
                                { label: 'Kontrast', value: obs.photoAnalysis.metrics.contrast, max: 100, unit: '', icon: '🌗' },
                                { label: 'Netlik', value: obs.photoAnalysis.metrics.blurriness, max: 500, unit: '', icon: '🔍' },
                                { label: 'Doygunluk', value: obs.photoAnalysis.metrics.saturation, max: 100, unit: '%', icon: '🎨' },
                                { label: 'Kenar Yoğ.', value: obs.photoAnalysis.metrics.edgeDensity, max: 100, unit: '%', icon: '📐' }
                            ].map((m, i) => (
                                <div key={i} className="analysis-metric-card">
                                    <div className="metric-icon">{m.icon}</div>
                                    <div className="metric-value">{m.value}{m.unit}</div>
                                    <div className="metric-label">{m.label}</div>
                                    <div className="metric-bar">
                                        <div
                                            className="metric-bar-fill"
                                            style={{
                                                width: `${Math.min(100, (m.value / m.max) * 100)}%`,
                                                background: m.value / m.max < 0.3 ? 'var(--color-warning)' : m.value / m.max > 0.8 ? 'var(--color-danger)' : 'var(--color-success)'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Güvenlik Renkleri */}
                    {obs.photoAnalysis.safetyDetected?.length > 0 && (
                        <div style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 8 }}>Tespit edilen güvenlik renkleri:</span>
                            {obs.photoAnalysis.safetyDetected.map((c, i) => (
                                <span key={i} className="badge" style={{ marginRight: 4, fontSize: '0.6875rem' }}>{c}</span>
                            ))}
                        </div>
                    )}

                    {/* Bulgular */}
                    {obs.photoAnalysis.findings?.length > 0 && (
                        <div style={{ marginTop: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                                <AlertTriangle size={14} style={{ verticalAlign: 'middle', color: 'var(--color-warning)' }} /> Bulgular ({obs.photoAnalysis.findings.length})
                            </h3>
                            <div className="flex flex-col gap-xs">
                                {obs.photoAnalysis.findings.map((f, i) => (
                                    <div key={i} className="finding-card">
                                        <div className="flex items-center justify-between">
                                            <span style={{ fontSize: '0.8125rem' }}>{f.icon} {f.message}</span>
                                            <span className="badge" style={{
                                                fontSize: '0.625rem',
                                                background: f.risk >= 25 ? 'rgba(220,38,38,0.15)' : f.risk >= 15 ? 'rgba(249,115,22,0.15)' : 'rgba(234,179,8,0.15)',
                                                color: f.risk >= 25 ? '#DC2626' : f.risk >= 15 ? '#F97316' : '#EAB308'
                                            }}>Risk: {f.risk}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Öneriler */}
                    {obs.photoAnalysis.recommendations?.length > 0 && (
                        <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
                                <Shield size={14} style={{ verticalAlign: 'middle' }} /> AI Önerileri
                            </h3>
                            <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.8125rem', lineHeight: 1.8, margin: 0 }}>
                                {obs.photoAnalysis.recommendations.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Hotspot */}
                    {obs.photoAnalysis.hotspotCount > 0 && (
                        <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            🔥 {obs.photoAnalysis.hotspotCount} riskli bölge tespit edildi — ısı haritasında görüntüleyin
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-2">
                {/* Hazards / Risk */}
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            <AlertTriangle size={18} style={{ color: 'var(--color-warning)', verticalAlign: 'middle' }} /> Tehlike & Risk Analizi
                        </h2>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowRiskForm(true)}>
                            <Plus size={14} /> Ekle
                        </button>
                    </div>
                    {hazards.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Henüz risk değerlendirmesi yapılmadı</p>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {hazards.map(h => (
                                <div key={h.id} style={{
                                    padding: 'var(--space-md)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-tertiary)',
                                    borderLeft: `4px solid ${h.riskColor}`
                                }}>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: h.riskColor }}>{h.riskLabel}</span>
                                        <div className="flex gap-xs">
                                            <button className="btn btn-xs btn-primary" onClick={() => handleCreateActionFromRisk(h)} title="Aksiyona Dönüştür">
                                                <Plus size={10} /> Aksiyon Yaz
                                            </button>
                                            <span className="badge" style={{ background: `${h.riskColor}20`, color: h.riskColor }}>
                                                Skor: {h.riskScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-3" style={{ fontSize: '0.75rem', gap: 'var(--space-sm)' }}>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>Kaynak</div>
                                            <div>{h.hazardSource || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>Tehlike</div>
                                            <div>{h.hazardDescription || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>Risk (Etki)</div>
                                            <div>{h.potentialImpact || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Tracking */}
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            <ListChecks size={18} style={{ color: 'var(--color-info)', verticalAlign: 'middle' }} /> Aksiyon Takibi ({actions.length})
                        </h2>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowActionForm(true)}>
                            <Plus size={14} /> Ekle
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {actions.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <div className="flex justify-between text-[10px] mb-1 uppercase font-bold text-muted">
                                <span>İlerleme Durumu</span>
                                <span>%{Math.round((actions.filter(a => a.status === 'completed').length / actions.length) * 100)}</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${Math.round((actions.filter(a => a.status === 'completed').length / actions.length) * 100)}%`, 
                                    background: 'var(--color-success)',
                                    transition: 'width 0.5s ease'
                                }}></div>
                            </div>
                        </div>
                    )}

                    {actions.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Henüz aksiyon oluşturulmadı</p>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {actions.map(a => {
                                const status = ACTION_STATUSES.find(s => s.id === a.status);
                                return (
                                    <Link key={a.id} to="/actions" style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-tertiary)',
                                        textDecoration: 'none', color: 'var(--text-primary)',
                                        borderLeft: `3px solid ${status?.color || '#ccc'}`
                                    }}>
                                        <div className="flex items-center justify-between">
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{a.description}</div>
                                            <span>{status?.icon}</span>
                                        </div>
                                        <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                            <span>👤 {a.responsiblePerson || '—'}</span>
                                            {a.dueDate && <span>Vade: {new Date(a.dueDate).toLocaleDateString('tr-TR')}</span>}
                                            <span style={{ color: status?.color, fontWeight: 700 }}>{status?.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Expert Recommendation */}
            {recommendation && (
                <div className="glass-card" style={{
                    padding: 'var(--space-lg)', marginTop: 'var(--space-lg)',
                    borderLeft: '3px solid var(--color-primary)'
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                        <Shield size={18} style={{ color: 'var(--color-primary)', verticalAlign: 'middle' }} /> İSG Uzman Önerisi
                    </h2>
                    <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
                        {recommendation.title}
                    </p>
                    <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.875rem', lineHeight: 2 }}>
                        {recommendation.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        Önerilen tamamlanma süresi: <strong>{recommendation.suggestedDeadlineDays} gün</strong>
                    </p>
                </div>
            )}

            {/* AI Compliance Agent Verdict */}
            {agentFindings && (
                <div className="glass-card" style={{
                    padding: 'var(--space-lg)', marginTop: 'var(--space-lg)',
                    borderLeft: '4px solid #6366f1',
                    background: 'linear-gradient(to right, rgba(99, 102, 241, 0.08), transparent)'
                }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Brain size={20} /> Yapay Zeka Mevzuat Kararı
                        </h2>
                        <div className="badge" style={{ background: '#4338ca', color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>
                            🎯 %{agentFindings.confidence} DOĞRULUK
                        </div>
                    </div>
                    
                    <div style={{ 
                        padding: 'var(--space-md)', 
                        background: 'white', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #e0e7ff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1e1b4b', marginBottom: 6 }}>
                            {agentFindings.regulationCode} Md.{agentFindings.articleNumber}: {agentFindings.articleTitle}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
                            {agentFindings.summary}
                        </p>
                        <div style={{ 
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: 6,
                            fontSize: '0.75rem', 
                            color: '#6366f1',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            border: '1px dashed #e2e8f0'
                        }}>
                            <Eye size={14} /> AI Analiz Notu: {agentFindings.reason}
                        </div>
                    </div>
                </div>
            )}

            {/* Regulations */}
            {regulations.length > 0 && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                        <BookOpen size={18} style={{ color: 'var(--color-info)', verticalAlign: 'middle' }} /> Mevzuat Atıfları
                    </h2>
                    <div className="flex flex-col gap-sm">
                        {regulations.map(reg => (
                            <div key={reg.code} style={{
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-tertiary)'
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-info)' }}>
                                    📖 {reg.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    {reg.articles.map(a => `${a.number}: ${a.title}`).join(' · ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Assessment Modal */}
            {showRiskForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRiskForm(false)}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Risk Değerlendirmesi (Fine-Kinney)</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowRiskForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddRisk}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="form-group">
                                    <label className="form-label">Tehlike Kaynağı</label>
                                    <input className="form-input" value={riskForm.hazardSource} 
                                        onChange={e => setRiskForm(f => ({ ...f, hazardSource: e.target.value }))}
                                        placeholder="Örn: Merdiven, Kimyasal Deposu, Elektrik Panosu" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tehlike Tanımı</label>
                                    <textarea className="form-textarea" rows={2} value={riskForm.hazardDescription}
                                        onChange={e => setRiskForm(f => ({ ...f, hazardDescription: e.target.value }))}
                                        placeholder="Örn: Basamaklardaki aşınma, Koruyucu kapağın açık olması" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Potansiyel Risk / Etki</label>
                                    <input className="form-input" value={riskForm.potentialImpact}
                                        onChange={e => setRiskForm(f => ({ ...f, potentialImpact: e.target.value }))}
                                        placeholder="Örn: Düşme ve yaralanma, Elektrik çarpması" />
                                </div>

                                <div className="grid grid-3 gap-sm">
                                    <div className="form-group">
                                        <label className="form-label">Olasılık (P)</label>
                                        <select className="form-select" value={riskForm.probability}
                                            onChange={e => setRiskForm(f => ({ ...f, probability: Number(e.target.value) }))}>
                                            {PROBABILITY_VALUES.map(p => <option key={p.value} value={p.value}>{p.value} — {p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Frekans (F)</label>
                                        <select className="form-select" value={riskForm.frequency}
                                            onChange={e => setRiskForm(f => ({ ...f, frequency: Number(e.target.value) }))}>
                                            {FREQUENCY_VALUES.map(p => <option key={p.value} value={p.value}>{p.value} — {p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Şiddet (S)</label>
                                        <select className="form-select" value={riskForm.severity}
                                            onChange={e => setRiskForm(f => ({ ...f, severity: Number(e.target.value) }))}>
                                            {SEVERITY_VALUES.map(p => <option key={p.value} value={p.value}>{p.value} — {p.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {currentRiskLevel && (
                                    <div style={{
                                        padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                                        background: `${currentRiskLevel.color}15`,
                                        borderLeft: `4px solid ${currentRiskLevel.color}`,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: currentRiskLevel.color }}>
                                            {currentRisk}
                                        </div>
                                        <div style={{ fontWeight: 700, color: currentRiskLevel.color }}>{currentRiskLevel.label}</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{currentRiskLevel.action}</div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRiskForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Creation Modal */}
            {showActionForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowActionForm(false)}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Yeni Aksiyon</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowActionForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddAction}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="form-group">
                                    <label className="form-label">Aksiyon Açıklaması *</label>
                                    <textarea className="form-textarea" rows={3} value={actionForm.description}
                                        onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Yapılacak aksiyon..." required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sorumlu Kişi</label>
                                    <input className="form-input" value={actionForm.responsiblePerson}
                                        onChange={e => setActionForm(f => ({ ...f, responsiblePerson: e.target.value }))}
                                        placeholder="Ad Soyad" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vade Tarihi</label>
                                    <input type="date" className="form-input" value={actionForm.dueDate}
                                        onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notlar</label>
                                    <textarea className="form-textarea" rows={2} value={actionForm.notes}
                                        onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="İlave notlar..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowActionForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ KKD TARAMA SONUÇLARI ═══ */}
            {ppeReport && (
                <div className="glass-card" style={{
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-lg)',
                    borderLeft: `4px solid ${ppeReport.riskColor}`
                }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            <Brain size={18} style={{ color: ppeReport.riskColor, verticalAlign: 'middle' }} /> KKD Analizi
                        </h2>
                        <span className="badge" style={{
                            background: `${ppeReport.riskColor}20`, color: ppeReport.riskColor,
                            fontWeight: 800, fontSize: '0.8125rem', padding: '4px 12px'
                        }}>
                            {ppeReport.riskLevel} — %{ppeReport.complianceRate} Uyum
                        </span>
                    </div>

                    {ppeImageUrl && (
                        <div style={{ marginBottom: 'var(--space-md)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 300 }}>
                            <img src={ppeImageUrl} alt="KKD Tarama" style={{ width: '100%', objectFit: 'contain' }} />
                        </div>
                    )}

                    <div style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-sm)' }}>
                        <strong>👤 {ppeReport.personCount}</strong> kişi · <strong>📦 {ppeReport.totalDetections}</strong> nesne tespit edildi
                    </div>

                    {/* KKD Kontrol Listesi */}
                    <div className="flex flex-col gap-xs">
                        {ppeReport.checklist.map((item, i) => (
                            <div key={i} className="finding-card">
                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '0.8125rem' }}>{item.icon} {item.label}</span>
                                    <span className="badge" style={{
                                        background: item.detected ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.15)',
                                        color: item.detected ? '#22C55E' : '#DC2626'
                                    }}>
                                        {item.detected ? '✅ Tespit Edildi' : '❌ Bulunamadı'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ MODALS ═══ */}

            {/* Karşılaştırma Modali */}
            {showComparison && obs?.photos?.length >= 2 && (
                <PhotoComparison
                    beforePhoto={obs.photos[0]}
                    afterPhoto={obs.photos[1]}
                    beforeAnalysis={obs.photoAnalysis}
                    afterAnalysis={obs.photoAnalysis}
                    onClose={() => setShowComparison(false)}
                />
            )}

            {/* Annotasyon Modali */}
            {showAnnotator && obs?.photos?.[annotatingPhotoIdx] && (
                <PhotoAnnotator
                    photoData={obs.photos[annotatingPhotoIdx].data}
                    onSave={async (annotatedUrl) => {
                        const updatedPhotos = [...obs.photos];
                        updatedPhotos.push({
                            data: annotatedUrl,
                            name: `annotated_${Date.now()}.jpg`,
                            timestamp: new Date().toISOString()
                        });
                        await updateObservation(Number(id), { photos: updatedPhotos });
                        toast.success('Düzenlenmiş fotoğraf kaydedildi');
                        setShowAnnotator(false);
                        loadDetail();
                    }}
                    onClose={() => setShowAnnotator(false)}
                />
            )}

            {/* Ekipman Takip Modali */}
            {showEquipment && (
                <EquipmentTracker
                    photoData={obs?.photos?.[0] ? getPhotoUrl(obs.photos[0]) : null}
                    onClose={() => setShowEquipment(false)}
                />
            )}
        </div>
    );
}
