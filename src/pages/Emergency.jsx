import { useState, useEffect } from 'react';
import {
    Siren, Plus, Search, MapPin, Calendar, CheckCircle,
    AlertTriangle, RefreshCw, Eye, Target, Activity, Users, FileType, PlayCircle
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createEmergencyPlan, getAllEmergencyPlans, updateEmergencyPlan, deleteEmergencyPlan,
    createDrill, getDrillsByPlanId, getEmergencyStats, updateDrill, deleteDrill
} from '../services/emergencyService';
import {
    EMERGENCY_TYPES, EMERGENCY_PLAN_STATUSES, DRILL_STATUSES
} from '../config/categories';

export default function Emergency() {
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState({
        totalPlans: 0, activePlans: 0, needsReview: 0,
        totalDrills: 0, completedDrills: 0, needsImprovementDrills: 0
    });
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlanForDrills, setSelectedPlanForDrills] = useState(null);
    const [showDrillModal, setShowDrillModal] = useState(false);
    const [drills, setDrills] = useState([]);

    // Form States
    const [planData, setPlanData] = useState({
        title: '', type: 'fire', location: '', lastReviewDate: '', nextReviewDate: '', status: 'active'
    });
    const [drillData, setDrillData] = useState({
        date: '', type: 'fire', scenario: '', participantsCount: 0, evaluationScore: 100, status: 'planned'
    });

    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [pList, s] = await Promise.all([getAllEmergencyPlans(), getEmergencyStats()]);
            setPlans(pList);
            setStats(s);
        } catch (e) {
            toast.error('Acil durum verileri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    // --- Plan İşlemleri ---
    async function handlePlanSubmit(e) {
        e.preventDefault();
        try {
            await createEmergencyPlan(planData);
            toast.success('Acil Durum Planı eklendi');
            setShowPlanModal(false);
            setPlanData({ title: '', type: 'fire', location: '', lastReviewDate: '', nextReviewDate: '', status: 'active' });
            await loadData();
        } catch (err) {
            toast.error('Plan eklenirken hata oluştu');
        }
    }

    async function handlePlanDelete(id) {
        if (!window.confirm('Bu planı ve bağlı tüm tatbikatları silmek istediğinize emin misiniz?')) return;
        try {
            await deleteEmergencyPlan(id);
            toast.succes('Plan başarıyla silindi');
            loadData();
        } catch {
            toast.error('Silme hatası');
        }
    }

    // --- Tatbikat İşlemleri ---
    async function loadDrills(planId) {
        try {
            const d = await getDrillsByPlanId(planId);
            setDrills(d);
        } catch (e) {
            toast.error('Tatbikatlar yüklenemedi');
        }
    }

    async function handleOpenDrills(plan) {
        setSelectedPlanForDrills(plan);
        setDrillData({ ...drillData, type: plan.type }); // default to plan type
        await loadDrills(plan.id);
    }

    async function handleDrillSubmit(e) {
        e.preventDefault();
        try {
            await createDrill({ ...drillData, planId: selectedPlanForDrills.id });
            toast.success('Tatbikat kaydı eklendi');
            setShowDrillModal(false);
            setDrillData({ date: '', type: selectedPlanForDrills.type, scenario: '', participantsCount: 0, evaluationScore: 100, status: 'planned' });
            await loadDrills(selectedPlanForDrills.id);
            await loadData(); // stat updates
        } catch (err) {
            toast.error('Tatbikat eklenirken hata');
        }
    }

    async function handleDrillDelete(id) {
        if (!window.confirm('Bu tatbikat kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDrill(id);
            toast.success('Tatbikat silindi');
            await loadDrills(selectedPlanForDrills.id);
            await loadData();
        } catch {
            toast.error('Tatbikat silinemedi');
        }
    }

    const filtered = plans.filter(p => {
        if (filterType !== 'all' && p.type !== filterType) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.title?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
        }
        return true;
    });

    const getTypeInfo = (id) => EMERGENCY_TYPES.find(t => t.id === id) || EMERGENCY_TYPES[0];
    const getPlanStatusInfo = (id) => EMERGENCY_PLAN_STATUSES.find(s => s.id === id) || EMERGENCY_PLAN_STATUSES[0];
    const getDrillStatusInfo = (id) => DRILL_STATUSES.find(s => s.id === id) || DRILL_STATUSES[0];

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <Siren size={28} style={{ color: 'var(--color-danger)' }} />
                        Acil Durum Yönetimi
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 8.2 — Acil Durum Hazırlığı ve Müdahale</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowPlanModal(true)}>
                    <Plus size={18} /> Yeni Plan Ekle
                </button>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="glass-card stat-card">
                    <div className="stat-value">{stats.totalPlans}</div>
                    <div className="stat-label flex items-center gap-xs"><FileType size={14} /> Toplam Plan</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.needsReview}</div>
                    <div className="stat-label flex items-center gap-xs"><RefreshCw size={14} /> Gözden Geçirme Bekleyen</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-info)' }}>{stats.totalDrills}</div>
                    <div className="stat-label flex items-center gap-xs"><Activity size={14} /> Toplam Tatbikat</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.needsImprovementDrills}</div>
                    <div className="stat-label flex items-center gap-xs"><AlertTriangle size={14} /> Başarısız/Eksik Tatbikat</div>
                </div>
            </div>

            {/* Filtreler */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="form-input" placeholder="Plan başlığı veya lokasyon ara..."
                            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                    <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ flex: '0 1 170px' }}>
                        <option value="all">Tüm Acil Durumlar</option>
                        {EMERGENCY_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Plan Listesi / Detay Görünüm */}
            {selectedPlanForDrills ? (
                <div>
                    <div className="flex items-center gap-sm mb-4">
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelectedPlanForDrills(null)}>←</button>
                        <h2>{selectedPlanForDrills.title} - Tatbikat Geçmişi</h2>
                    </div>
                    <div className="glass-card mb-4" style={{ padding: 'var(--space-lg)' }}>
                        <div className="flex justify-between items-center mb-4 border-b pb-sm">
                            <h3 className="flex items-center gap-sm"><PlayCircle size={18} color="var(--color-primary)" /> Tatbikat Kayıtları</h3>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowDrillModal(true)}>
                                <Plus size={14} /> Yeni Tatbikat İşle
                            </button>
                        </div>
                        {drills.length === 0 ? (
                            <p className="text-muted">Henüz planlanmış veya tamamlanmış tatbikat yok.</p>
                        ) : (
                            <div className="flex flex-col gap-sm">
                                {drills.map(d => {
                                    const ds = getDrillStatusInfo(d.status);
                                    return (
                                        <div key={d.id} className="flex justify-between items-center bg-secondary" style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                                            <div>
                                                <div className="font-medium">{new Date(d.date).toLocaleDateString('tr-TR')} - {d.scenario}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Katılımcı: {d.participantsCount} | Başarı Notu: %{d.evaluationScore}</div>
                                            </div>
                                            <div className="flex items-center gap-md">
                                                <span className="badge" style={{ background: `${ds.color}20`, color: ds.color }}>{ds.icon} {ds.label}</span>
                                                <button className="text-danger" onClick={() => handleDrillDelete(d.id)}>Sil</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="text-center" style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <Siren size={64} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                            <h3>Acil Durum Planı bulunamadı</h3>
                            <p>Henüz plan eklenmemiş veya aramaya uygun kayıt yok.</p>
                        </div>
                    ) : (
                        <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                            {filtered.map(plan => {
                                const typeInfo = getTypeInfo(plan.type);
                                const statusInfo = getPlanStatusInfo(plan.status);

                                // Uyarı mekanizması: Gelecek gözden geçirme tarihine 30 gün kaldıysa
                                const isNearingReview = plan.nextReviewDate && (new Date(plan.nextReviewDate) - new Date()) < (30 * 24 * 60 * 60 * 1000);

                                return (
                                    <div key={plan.id} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                                        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                                            <div className="flex items-center gap-sm">
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                                                    background: `${typeInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <span style={{ fontSize: '1.4rem' }}>{typeInfo.icon}</span>
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plan.title}</h4>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <MapPin size={12} /> {plan.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="badge flex flex-col align-end" style={{ background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}30` }}>
                                                <span>{statusInfo.icon} {statusInfo.label}</span>
                                            </div>
                                        </div>

                                        {isNearingReview && plan.status === 'active' && (
                                            <div className="mb-3" style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <AlertTriangle size={14} /> Yakın Dönemde Gözden Geçirilmeli
                                            </div>
                                        )}

                                        <div className="grid grid-2 bg-secondary" style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', marginBottom: 16 }}>
                                            <div>
                                                <div className="text-muted mb-1">Son Revizyon</div>
                                                <div className="font-medium">{new Date(plan.lastReviewDate).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted mb-1">Planlanan Gözden Geçirme</div>
                                                <div className="font-medium" style={{ color: isNearingReview ? 'var(--color-warning)' : 'inherit' }}>
                                                    {new Date(plan.nextReviewDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t" style={{ paddingTop: 'var(--space-sm)', borderColor: 'var(--border-color)' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenDrills(plan)}>
                                                <Target size={14} /> Tatbikat İşlemleri
                                            </button>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handlePlanDelete(plan.id)}>Sil</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Yeni Plan Modalı */}
            {showPlanModal && (
                <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Yeni Acil Durum Planı</h2>
                            <button className="btn btn-ghost" onClick={() => setShowPlanModal(false)}>X</button>
                        </div>
                        <form onSubmit={handlePlanSubmit}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="form-group">
                                    <label className="form-label">Plan Başlığı</label>
                                    <input className="form-input" required value={planData.title} onChange={e => setPlanData({ ...planData, title: e.target.value })} placeholder="Örn: Fabrika Zemin Kat Yangın Planı" />
                                </div>
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Acil Durum Türü</label>
                                        <select className="form-select" value={planData.type} onChange={e => setPlanData({ ...planData, type: e.target.value })}>
                                            {EMERGENCY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Geçerli Lokasyon</label>
                                        <input className="form-input" required value={planData.location} onChange={e => setPlanData({ ...planData, location: e.target.value })} placeholder="Örn: A Blok" />
                                    </div>
                                </div>
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Yayın / Son Gözden Geçirme</label>
                                        <input className="form-input" type="date" required value={planData.lastReviewDate} onChange={e => setPlanData({ ...planData, lastReviewDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sonraki Planlı Revizyon</label>
                                        <input className="form-input" type="date" required value={planData.nextReviewDate} onChange={e => setPlanData({ ...planData, nextReviewDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Durum</label>
                                    <select className="form-select" value={planData.status} onChange={e => setPlanData({ ...planData, status: e.target.value })}>
                                        {EMERGENCY_PLAN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Yeni Tatbikat Modalı */}
            {showDrillModal && (
                <div className="modal-overlay" onClick={() => setShowDrillModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Yeni Tatbikat Kaydı</h2>
                            <button className="btn btn-ghost" onClick={() => setShowDrillModal(false)}>X</button>
                        </div>
                        <form onSubmit={handleDrillSubmit}>
                            <div className="modal-body flex flex-col gap-md">
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Tatbikat Tarihi</label>
                                        <input className="form-input" type="date" required value={drillData.date} onChange={e => setDrillData({ ...drillData, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Durum</label>
                                        <select className="form-select" value={drillData.status} onChange={e => setDrillData({ ...drillData, status: e.target.value })}>
                                            {DRILL_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Senaryo / Kapsam</label>
                                    <textarea className="form-textarea" required rows={2} value={drillData.scenario} onChange={e => setDrillData({ ...drillData, scenario: e.target.value })} placeholder="Mutfakta çıkan yangının söndürülmesi..." />
                                </div>
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Katılımcı Sayısı</label>
                                        <input className="form-input" type="number" required value={drillData.participantsCount} onChange={e => setDrillData({ ...drillData, participantsCount: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Değerlendirme Puanı (1-100)</label>
                                        <input className="form-input" type="number" min="0" max="100" required value={drillData.evaluationScore} onChange={e => setDrillData({ ...drillData, evaluationScore: e.target.value })} />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Tatbikat başarı yüzdesi</div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDrillModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
