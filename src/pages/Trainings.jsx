import { useState, useEffect, useMemo } from 'react';
import {
    GraduationCap, Plus, Search, Filter, X, Eye, Users, Calendar, Clock, BookOpen, Trash2, ShieldCheck, CheckCircle
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createTraining, getAllTrainings, updateTraining, deleteTraining, getTrainingStats,
    addTrainingRecord, getRecordsByTrainingId, updateTrainingRecord, deleteTrainingRecord
} from '../services/trainingService';
import { TRAINING_TYPES, TRAINING_STATUSES, PARTICIPANT_STATUSES, DEPARTMENTS } from '../config/categories';

export default function Trainings() {
    const toast = useToast();
    const [trainings, setTrainings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [records, setRecords] = useState([]);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // New Training Form State
    const [newTraining, setNewTraining] = useState({
        title: '', type: 'isg_temel', date: '', duration: '', instructor: '', status: 'planned'
    });

    // New Participant Form State
    const [newParticipant, setNewParticipant] = useState({
        participantName: '', department: ''
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [tList, s] = await Promise.all([
                getAllTrainings(), getTrainingStats()
            ]);
            setTrainings(tList);
            setStats(s);
        } catch (err) {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function loadRecords(trainingId) {
        try {
            const rList = await getRecordsByTrainingId(trainingId);
            setRecords(rList);
        } catch (err) {
            toast.error('Katılımcı listesi yüklenemedi');
        }
    }

    async function handleAddTraining(e) {
        e.preventDefault();
        try {
            await createTraining(newTraining);
            toast.success('Eğitim başarıyla eklendi');
            setShowForm(false);
            setNewTraining({ title: '', type: 'isg_temel', date: '', duration: '', instructor: '', status: 'planned' });
            loadData();
        } catch (err) { toast.error('Eğitim eklenemedi'); }
    }

    async function handleUpdateStatus(id, newStatus) {
        try {
            await updateTraining(id, { status: newStatus });
            toast.success('Eğitim durumu güncellendi');
            loadData();
            if (showDetail && showDetail.id === id) {
                setShowDetail(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) { toast.error('Güncelleme hatası'); }
    }

    async function handleDeleteTraining(id) {
        if (!confirm('Eğitimi ve tüm katılımcı kayıtlarını silmek istiyor musunuz?')) return;
        try {
            await deleteTraining(id);
            toast.success('Eğitim silindi');
            setShowDetail(null);
            loadData();
        } catch (err) { toast.error('Silme hatası'); }
    }

    // Participant operations
    async function handleAddParticipant(e) {
        e.preventDefault();
        if (!showDetail) return;
        try {
            await addTrainingRecord({ ...newParticipant, trainingId: showDetail.id, status: 'registered' });
            toast.success('Katılımcı eklendi');
            setNewParticipant({ participantName: '', department: '' });
            loadRecords(showDetail.id);
            loadData(); // To update total stats
        } catch (err) { toast.error('Katılımcı eklenemedi'); }
    }

    async function handleUpdateParticipant(id, changes) {
        try {
            await updateTrainingRecord(id, changes);
            toast.success('Katılımcı güncellendi');
            loadRecords(showDetail.id);
        } catch (err) { toast.error('Katılımcı güncellenemedi'); }
    }

    async function handleDeleteParticipant(id) {
        if (!confirm('Katılımcı kaydını silmek istiyor musunuz?')) return;
        try {
            await deleteTrainingRecord(id);
            toast.success('Katılımcı silindi');
            loadRecords(showDetail.id);
            loadData(); // Refresh overall stats
        } catch (err) { toast.error('Silme başarısız'); }
    }

    const filteredTrainings = useMemo(() => {
        let list = [...trainings];
        if (filterType !== 'all') list = list.filter(t => t.type === filterType);
        if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus);
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(t =>
                (t.title || '').toLowerCase().includes(q) ||
                (t.instructor || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [trainings, filterType, filterStatus, searchTerm]);

    const getTypeInfo = (id) => TRAINING_TYPES.find(t => t.id === id) || TRAINING_TYPES[0];
    const getStatusInfo = (id) => TRAINING_STATUSES.find(s => s.id === id) || TRAINING_STATUSES[0];
    const getParticipantStatusInfo = (id) => PARTICIPANT_STATUSES.find(s => s.id === id) || PARTICIPANT_STATUSES[0];

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <GraduationCap size={28} style={{ color: 'var(--color-primary)' }} />
                        Eğitim / Yeterlilik Takibi
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 7.2 — Yeterlilik ve Eğitim Yönetimi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Yeni Eğitim Ekle
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)', gap: 'var(--space-sm)' }}>
                    <div className="glass-card stat-card">
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                            <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-primary)' }}>Toplam</span>
                        </div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Tanımlı Eğitim</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                            <Calendar size={18} style={{ color: 'var(--color-info)' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-info)' }}>Planlı/Aktif</span>
                        </div>
                        <div className="stat-value">{stats.planned + stats.active}</div>
                        <div className="stat-label">Bekleyen Eğitim</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                            <Users size={18} style={{ color: 'var(--color-success)' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-success)' }}>Katılımcı</span>
                        </div>
                        <div className="stat-value">{stats.totalParticipants}</div>
                        <div className="stat-label">Toplam Kayıtlı Kişi</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                            <CheckCircle size={18} style={{ color: 'var(--color-warning)' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-warning)' }}>Oran</span>
                        </div>
                        <div className="stat-value">% {stats.completionRate}</div>
                        <div className="stat-label">Tamamlanma Oranı</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder="Eğitim veya eğitmen ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 34 }} />
                </div>
                <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 150 }}>
                    <option value="all">Tüm Kategoriler</option>
                    {TRAINING_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 150 }}>
                    <option value="all">Tüm Durumlar</option>
                    {TRAINING_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>

                {(filterType !== 'all' || filterStatus !== 'all' || searchTerm) && (
                    <button className="btn btn-ghost btn-icon" onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); }} title="Filtreleri Temizle">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Training List */}
            {filteredTrainings.length === 0 ? (
                <div className="empty-state">
                    <GraduationCap size={48} />
                    <h3>Eğitim bulunamadı</h3>
                    <p>Filtreye uygun sonuç yok veya henüz eğitim eklenmemiş.</p>
                </div>
            ) : (
                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                    {filteredTrainings.map(t => {
                        const typeInfo = getTypeInfo(t.type);
                        const statusInfo = getStatusInfo(t.status);
                        return (
                            <div key={t.id} className="glass-card feedback-card flex flex-col" style={{ padding: 'var(--space-md)', cursor: 'pointer', borderLeftColor: typeInfo.color }}
                                onClick={() => { setShowDetail(t); loadRecords(t.id); }}>
                                <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div className="flex items-center gap-sm">
                                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${typeInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                            {typeInfo.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{typeInfo.label}</div>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </span>
                                </div>

                                <div className="flex gap-md" style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-xs" title="Tarih"><Calendar size={14} /> {t.date ? new Date(t.date).toLocaleDateString() : 'Belirtilmedi'}</span>
                                    <span className="flex items-center gap-xs" title="Süre"><Clock size={14} /> {t.duration ? `${t.duration} Saat` : '—'}</span>
                                    <span className="flex items-center gap-xs" title="Eğitmen"><Users size={14} /> {t.instructor || 'Atanmadı'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* NEW TRAINING MODAL */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Yeni İSG Eğitimi Ekle</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddTraining}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Eğitim Başlığı *</label>
                                    <input className="form-input" required placeholder="Örn: Yıllık Temel İSG Eğitimi" value={newTraining.title} onChange={e => setNewTraining({ ...newTraining, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Eğitim Kategorisi</label>
                                    <select className="form-select" value={newTraining.type} onChange={e => setNewTraining({ ...newTraining, type: e.target.value })}>
                                        {TRAINING_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-2" style={{ gap: 'var(--space-sm)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Tarih</label>
                                        <input type="date" className="form-input" value={newTraining.date} onChange={e => setNewTraining({ ...newTraining, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Süre (Saat)</label>
                                        <input type="number" min="0" step="0.5" className="form-input" placeholder="Örn: 4" value={newTraining.duration} onChange={e => setNewTraining({ ...newTraining, duration: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Eğitmen / İç Sağlayıcı</label>
                                    <input className="form-input" placeholder="İSG Uzmanı, Eğitim Kurumu vb." value={newTraining.instructor} onChange={e => setNewTraining({ ...newTraining, instructor: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL & PARTICIPANT MANAGEMENT MODAL */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span>Eğitim Detayı ve Katılımcılar</span>
                                <span className="badge" style={{ background: `${getStatusInfo(showDetail.status).color}15`, color: getStatusInfo(showDetail.status).color, fontSize: '0.75rem' }}>
                                    {getStatusInfo(showDetail.status).label}
                                </span>
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowDetail(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto' }}>
                            {/* Info Box */}
                            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{showDetail.title}</h3>
                                <div className="grid grid-3" style={{ gap: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    <div className="flex flex-col gap-xs">
                                        <span style={{ color: 'var(--text-muted)' }}>Kategori</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{getTypeInfo(showDetail.type).icon} {getTypeInfo(showDetail.type).label}</strong>
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <span style={{ color: 'var(--text-muted)' }}>Eğitmen</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{showDetail.instructor || 'Belirtilmedi'}</strong>
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <span style={{ color: 'var(--text-muted)' }}>Tarih - Süre</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{showDetail.date ? new Date(showDetail.date).toLocaleDateString() : '-'} ({showDetail.duration || 0} Saat)</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                                    <select className="form-select btn-sm" style={{ width: 'auto' }} value={showDetail.status} onChange={e => handleUpdateStatus(showDetail.id, e.target.value)}>
                                        {TRAINING_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Add Participant Area */}
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                                <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
                                Katılımcı Kayıtları
                            </h3>
                            <form className="flex gap-sm items-end" style={{ marginBottom: 'var(--space-md)' }} onSubmit={handleAddParticipant}>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">Ad Soyad *</label>
                                    <input className="form-input" required placeholder="Personel Adı" value={newParticipant.participantName} onChange={e => setNewParticipant({ ...newParticipant, participantName: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1.5 }}>
                                    <label className="form-label">Departman</label>
                                    <select className="form-select" required value={newParticipant.department} onChange={e => setNewParticipant({ ...newParticipant, department: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', height: 40 }}><Plus size={16} /> Ekle</button>
                            </form>

                            {/* Participant List */}
                            {records.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '0.875rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    Henüz bu eğitime kayıtlı katılımcı bulunmuyor.
                                </div>
                            ) : (
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Personel Adı</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Departman</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Durum</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Not/Puan</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.map(r => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.participantName}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.department}</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                        <select
                                                            className="form-select"
                                                            style={{
                                                                padding: '4px 20px 4px 8px', fontSize: '0.75rem', width: 100, height: 28,
                                                                background: `${getParticipantStatusInfo(r.status).color}15`,
                                                                color: getParticipantStatusInfo(r.status).color,
                                                                border: 'none', fontWeight: 600
                                                            }}
                                                            value={r.status}
                                                            onChange={e => handleUpdateParticipant(r.id, { status: e.target.value })}
                                                        >
                                                            {PARTICIPANT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                        <input
                                                            type="number" min="0" max="100"
                                                            className="form-input text-center"
                                                            style={{ width: 50, padding: 4, height: 28 }}
                                                            placeholder="-"
                                                            defaultValue={r.score}
                                                            onBlur={e => handleUpdateParticipant(r.id, { score: e.target.value })}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                        <button className="btn btn-ghost btn-icon text-danger" title="Kaydı Sil" onClick={() => handleDeleteParticipant(r.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                            <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteTraining(showDetail.id)}>
                                <Trash2 size={16} /> Tüm Eğitimi Sil
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
