import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Eye, AlertTriangle, ListChecks, TrendingUp,
    Plus, Clock, ChevronRight, Shield, MessageSquare, GraduationCap,
    FileSignature, HardHat, Building2, Users2, Ban, Gavel, FileCheck, ShieldAlert
} from 'lucide-react';
import { getObservationsStats, getAllObservations } from '../services/observationService';
import { getActionStats, getOverdueActions } from '../services/actionService';
import { getHazardStats } from '../services/riskService';
import { getFeedbackStats } from '../services/feedbackService';
import { getTrainingStats } from '../services/trainingService';
import { workPermitService } from '../services/workPermitService';
import { ppeService } from '../services/ppeService';
import { contractorService } from '../services/contractorService';
import { committeeService } from '../services/committeeService';

export default function Dashboard() {
    const [obsStats, setObsStats] = useState(null);
    const [actionStats, setActionStats] = useState(null);
    const [riskStats, setRiskStats] = useState(null);
    const [fbStats, setFbStats] = useState(null);
    const [trainingStats, setTrainingStats] = useState(null);
    const [permitStats, setPermitStats] = useState(null);
    const [ppeStats, setPpeStats] = useState(null);
    const [contractorStats, setContractorStats] = useState(null);
    const [committeeStats, setCommitteeStats] = useState(null);
    const [recentObs, setRecentObs] = useState([]);
    const [overdueActions, setOverdueActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [os, as, rs, obs, oa, fs, ts, ps, ppe, cs, cms] = await Promise.all([
                getObservationsStats(),
                getActionStats(),
                getHazardStats(),
                getAllObservations(),
                getOverdueActions(),
                getFeedbackStats(),
                getTrainingStats(),
                workPermitService.getStats().catch(() => null),
                ppeService.getStats().catch(() => null),
                contractorService.getStats().catch(() => null),
                committeeService.getStats().catch(() => null),
            ]);
            setObsStats(os);
            setActionStats(as);
            setRiskStats(rs);
            setFbStats(fs);
            setTrainingStats(ts);
            setPermitStats(ps);
            setPpeStats(ppe);
            setContractorStats(cs);
            setCommitteeStats(cms);
            setRecentObs(obs.slice(0, 5));
            setOverdueActions(oa.slice(0, 5));
        } catch (err) {
            console.error('Dashboard yükleme hatası:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Shield size={48} style={{ color: 'var(--color-primary)', marginBottom: 16, animation: 'pulse 2s infinite' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Toplam Gözlem',
            value: obsStats?.total || 0,
            sub: `Bu ay: ${obsStats?.thisMonth || 0}`,
            icon: Eye,
            color: 'var(--color-primary)',
            link: '/observations'
        },
        {
            label: 'Açık Aksiyon',
            value: (actionStats?.open || 0) + (actionStats?.inProgress || 0),
            sub: `Tamamlanan: %${actionStats?.completionRate || 0}`,
            icon: ListChecks,
            color: 'var(--color-info)',
            link: '/actions'
        },
        {
            label: 'Gecikmiş',
            value: actionStats?.overdue || 0,
            sub: 'Acil müdahale gerekli',
            icon: Clock,
            color: 'var(--color-danger)',
            link: '/actions'
        },
        {
            label: 'Risk Skoru Ort.',
            value: riskStats?.averageScore || 0,
            sub: `Toplam: ${riskStats?.total || 0} tehlike`,
            icon: AlertTriangle,
            color: 'var(--color-warning)',
            link: '/risk'
        },
        {
            label: 'Geri Bildirim',
            value: fbStats?.total || 0,
            sub: `Çözüm: %${fbStats?.resolutionRate || 0}`,
            icon: MessageSquare,
            color: '#8B5CF6',
            link: '/feedback'
        },
        {
            label: 'Eğitim / Personel',
            value: trainingStats?.total || 0,
            sub: `Tamamlanma: %${trainingStats?.completionRate || 0}`,
            icon: GraduationCap,
            color: '#10B981',
            link: '/trainings'
        }
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <Shield size={28} style={{ color: 'var(--color-primary)' }} />
                    Gösterge Paneli
                </h1>
                <p className="page-subtitle">Turkish Technic — ISO 45001 Saha Gözlem Sistemi</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
                {statCards.map((card, i) => (
                    <Link key={i} to={card.link} style={{ textDecoration: 'none' }}>
                        <div className="glass-card stat-card" style={{ cursor: 'pointer' }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                <card.icon size={22} style={{ color: card.color }} />
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-label">{card.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{card.sub}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Action */}
            <div className="flex gap-md" style={{ marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
                <Link to="/observations?new=1" className="btn btn-primary btn-lg">
                    <Plus size={18} />
                    Yeni Saha Gözlemi
                </Link>
                <Link to="/risk" className="btn btn-secondary btn-lg">
                    <AlertTriangle size={18} />
                    Risk Değerlendirme
                </Link>
            </div>

            {/* ═══ YENİ MODÜL WIDGET'LARI ═══ */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                {/* İş İzinleri Widget */}
                <Link to="/work-permits" style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-lg)', cursor: 'pointer', borderLeft: '3px solid #F97316', transition: 'all 200ms', height: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <FileSignature size={20} style={{ color: '#F97316' }} />
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, backgroundImage: 'linear-gradient(135deg, #F97316, var(--text-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {permitStats?.activePermits || 0}
                        </div>
                        <div className="stat-label">Aktif İş İzni</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.7rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>✅ {permitStats?.approvedPermits || 0} onaylı</span>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(234,179,8,.12)', color: '#EAB308' }}>⏳ {permitStats?.pendingPermits || 0} bekleyen</span>
                        </div>
                    </div>
                </Link>

                {/* KKD Takibi Widget */}
                <Link to="/ppe-management" style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-lg)', cursor: 'pointer', borderLeft: '3px solid #06B6D4', transition: 'all 200ms', height: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(6,182,212,.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <HardHat size={20} style={{ color: '#06B6D4' }} />
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, backgroundImage: 'linear-gradient(135deg, #06B6D4, var(--text-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {ppeStats?.activeAssignments || 0}
                        </div>
                        <div className="stat-label">Aktif Zimmet</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.7rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>👷 {ppeStats?.activeEmployees || 0} çalışan</span>
                            {(ppeStats?.expiringSoon || 0) > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>⚠️ {ppeStats.expiringSoon} miad</span>}
                        </div>
                    </div>
                </Link>

                {/* Taşeron Yönetimi Widget */}
                <Link to="/contractors" style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-lg)', cursor: 'pointer', borderLeft: '3px solid #3B82F6', transition: 'all 200ms', height: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Building2 size={20} style={{ color: '#3B82F6' }} />
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, backgroundImage: 'linear-gradient(135deg, #3B82F6, var(--text-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {contractorStats?.contractorCount || 0}
                        </div>
                        <div className="stat-label">Taşeron Firma</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.7rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>👥 {contractorStats?.personnelCount || 0} personel</span>
                            {(contractorStats?.bannedPersonnel || 0) > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>⛔ {contractorStats.bannedPersonnel} yasaklı</span>}
                            {(contractorStats?.expiredDocs || 0) > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>📋 {contractorStats.expiredDocs} evrak</span>}
                        </div>
                    </div>
                </Link>

                {/* İSG Kurulları Widget */}
                <Link to="/committees" style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-lg)', cursor: 'pointer', borderLeft: '3px solid #6366F1', transition: 'all 200ms', height: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Users2 size={20} style={{ color: '#6366F1' }} />
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, backgroundImage: 'linear-gradient(135deg, #6366F1, var(--text-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {committeeStats?.activeDecisions || 0}
                        </div>
                        <div className="stat-label">Açık Kurul Kararı</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.7rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,.12)', color: '#818CF8' }}>🏛️ {committeeStats?.committeeCount || 0} kurul</span>
                            {(committeeStats?.overdueDecisions || 0) > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>⚠️ {committeeStats.overdueDecisions} gecikmiş</span>}
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-2">
                {/* Recent Observations */}
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Son Gözlemler</h2>
                        <Link to="/observations" style={{ fontSize: '0.8125rem' }}>Tümü →</Link>
                    </div>
                    {recentObs.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                            <Eye size={40} />
                            <h3>Henüz gözlem yok</h3>
                            <p style={{ fontSize: '0.8125rem' }}>İlk saha gözleminizi ekleyin</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {recentObs.map(obs => (
                                <Link
                                    key={obs.id}
                                    to={`/observations/${obs.id}`}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-tertiary)',
                                        textDecoration: 'none',
                                        color: 'var(--text-primary)',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                                                {obs.description?.substring(0, 50) || 'Açıklama yok'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {obs.area} · {new Date(obs.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${obs.severity >= 3 ? 'danger' : obs.severity === 2 ? 'warning' : 'success'}`}>
                                            {obs.severity >= 3 ? 'Yüksek' : obs.severity === 2 ? 'Orta' : 'Düşük'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue Actions */}
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                            ⚠️ Gecikmiş Aksiyonlar
                        </h2>
                        <Link to="/actions" style={{ fontSize: '0.8125rem' }}>Tümü →</Link>
                    </div>
                    {overdueActions.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                            <ListChecks size={40} />
                            <h3>Gecikmiş aksiyon yok</h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-success)' }}>✅ Tüm aksiyonlar zamanında</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {overdueActions.map(action => (
                                <div
                                    key={action.id}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--color-danger-bg)',
                                        borderLeft: '3px solid var(--color-danger)'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                                        {action.description?.substring(0, 50)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Vade: {new Date(action.dueDate).toLocaleDateString('tr-TR')} · {action.responsiblePerson}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Kritik Uyarılar Paneli */}
            {((contractorStats?.bannedPersonnel || 0) > 0 || (contractorStats?.expiredDocs || 0) > 0 || (ppeStats?.expiringSoon || 0) > 0 || (committeeStats?.overdueDecisions || 0) > 0) && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-xl)', borderLeft: '3px solid #EF4444' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)' }}>
                        <ShieldAlert size={20} /> Kritik Uyarılar
                    </h2>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {(contractorStats?.bannedPersonnel || 0) > 0 && (
                            <Link to="/contractors" style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer' }}>
                                    <Ban size={16} style={{ color: '#EF4444' }} />
                                    <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>{contractorStats.bannedPersonnel} saha giriş yasaklı personel</span>
                                </div>
                            </Link>
                        )}
                        {(contractorStats?.expiredDocs || 0) > 0 && (
                            <Link to="/contractors" style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer' }}>
                                    <FileCheck size={16} style={{ color: '#EF4444' }} />
                                    <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>{contractorStats.expiredDocs} süresi dolmuş taşeron evrakı</span>
                                </div>
                            </Link>
                        )}
                        {(ppeStats?.expiringSoon || 0) > 0 && (
                            <Link to="/ppe" style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.2)', cursor: 'pointer' }}>
                                    <HardHat size={16} style={{ color: '#EAB308' }} />
                                    <span style={{ fontSize: '0.8125rem', color: '#EAB308', fontWeight: 600 }}>{ppeStats.expiringSoon} miadı dolan KKD</span>
                                </div>
                            </Link>
                        )}
                        {(committeeStats?.overdueDecisions || 0) > 0 && (
                            <Link to="/committees" style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer' }}>
                                    <Gavel size={16} style={{ color: '#EF4444' }} />
                                    <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>{committeeStats.overdueDecisions} gecikmiş kurul kararı</span>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Risk Distribution */}
            {riskStats && riskStats.total > 0 && (
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                        Risk Dağılımı
                    </h2>
                    <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                        {[
                            { label: 'Çok Yüksek', count: riskStats.byLevel['very-high'], color: 'var(--color-risk-very-high)' },
                            { label: 'Yüksek', count: riskStats.byLevel['high'], color: 'var(--color-risk-high)' },
                            { label: 'Orta', count: riskStats.byLevel['medium'], color: 'var(--color-risk-medium)' },
                            { label: 'Düşük', count: riskStats.byLevel['low'], color: 'var(--color-risk-low)' },
                            { label: 'Çok Düşük', count: riskStats.byLevel['very-low'], color: 'var(--color-risk-very-low)' }
                        ].map((r, i) => (
                            <div key={i} className="flex items-center gap-xs" style={{ minWidth: 120 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.color }} />
                                <span style={{ fontSize: '0.8125rem' }}>{r.label}: <strong>{r.count}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
