import { useState, useEffect, useMemo } from 'react';
import {
    MessageSquare, Plus, Search, Filter, X, Send, Eye,
    Trash2, Clock, User, Building2, AlertTriangle,
    Lightbulb, Megaphone, Wrench, CheckCircle, ChevronRight,
    Shield, EyeOff, Users
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import {
    createFeedback, getAllFeedback, updateFeedback, deleteFeedback, getFeedbackStats
} from '../services/feedbackService';
import {
    FEEDBACK_TYPES, FEEDBACK_STATUSES, FEEDBACK_PRIORITIES, DEPARTMENTS
} from '../config/categories';

const TYPE_ICONS = {
    suggestion: Lightbulb,
    complaint: Megaphone,
    hazard_report: AlertTriangle,
    improvement: Wrench,
    consultation: Users
};

export default function Feedback() {
    const [feedbackList, setFeedbackList] = useState([]);
    const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0, resolutionRate: 0 });
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [formData, setFormData] = useState({
        type: 'suggestion',
        title: '',
        description: '',
        department: '',
        priority: 'medium',
        isAnonymous: false,
        submittedBy: ''
    });
    const [responseText, setResponseText] = useState('');
    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [list, s] = await Promise.all([getAllFeedback(), getFeedbackStats()]);
            setFeedbackList(list);
            setStats(s);
        } catch (e) {
            toast.error('Veriler yüklenirken hata oluştu');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) {
            toast.warning('Başlık ve açıklama zorunludur');
            return;
        }
        if (!formData.department) {
            toast.warning('Departman seçiniz');
            return;
        }
        try {
            await createFeedback(formData);
            toast.success('Geri bildirim başarıyla gönderildi');
            setShowForm(false);
            setFormData({
                type: 'suggestion', title: '', description: '',
                department: '', priority: 'medium', isAnonymous: false, submittedBy: ''
            });
            await loadData();
        } catch (err) {
            toast.error('Gönderim hatası: ' + err.message);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            await updateFeedback(id, { status: newStatus });
            toast.success('Durum güncellendi');
            await loadData();
            if (showDetail?.id === id) {
                const updated = feedbackList.find(f => f.id === id);
                setShowDetail(updated ? { ...updated, status: newStatus } : null);
            }
        } catch { toast.error('Güncelleme hatası'); }
    }

    async function handleRespond(id) {
        if (!responseText.trim()) return;
        try {
            await updateFeedback(id, { adminResponse: responseText, status: 'reviewed' });
            toast.success('Yanıt kaydedildi');
            setResponseText('');
            await loadData();
            setShowDetail(null);
        } catch { toast.error('Yanıt hatası'); }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteFeedback(id);
            toast.success('Geri bildirim silindi');
            setShowDetail(null);
            await loadData();
        } catch { toast.error('Silme hatası'); }
    }

    const filtered = useMemo(() => {
        return feedbackList.filter(f => {
            if (filterType !== 'all' && f.type !== filterType) return false;
            if (filterStatus !== 'all' && f.status !== filterStatus) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    f.title?.toLowerCase().includes(q) ||
                    f.description?.toLowerCase().includes(q) ||
                    f.department?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [feedbackList, filterType, filterStatus, search]);

    const getTypeInfo = (typeId) => FEEDBACK_TYPES.find(t => t.id === typeId) || FEEDBACK_TYPES[0];
    const getStatusInfo = (statusId) => FEEDBACK_STATUSES.find(s => s.id === statusId) || FEEDBACK_STATUSES[0];
    const getPriorityInfo = (priorityId) => FEEDBACK_PRIORITIES.find(p => p.id === priorityId) || FEEDBACK_PRIORITIES[1];

    function formatDate(iso) {
        if (!iso) return '–';
        const d = new Date(iso);
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div className="page">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <MessageSquare size={28} style={{ color: 'var(--color-primary)' }} />
                    Çalışan Geri Bildirim
                </h1>
                <p className="page-subtitle">ISO 45001 Madde 5.4 — Çalışanların Katılımı ve Danışılması</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="glass-card stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Toplam Geri Bildirim</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-info)' }}>{stats.new}</div>
                    <div className="stat-label">Yeni / Bekleyen</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.inProgress}</div>
                    <div className="stat-label">İşlemde</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.resolutionRate}%</div>
                    <div className="stat-label">Çözüm Oranı</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: 12, top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                            className="form-input"
                            placeholder="Geri bildirim ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        style={{ flex: '0 1 170px' }}
                    >
                        <option value="all">Tüm Türler</option>
                        {FEEDBACK_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ flex: '0 1 170px' }}
                    >
                        <option value="all">Tüm Durumlar</option>
                        {FEEDBACK_STATUSES.map(s => (
                            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Feedback List */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare />
                    <h3>Henüz geri bildirim yok</h3>
                    <p>Çalışanlardan gelen öneri, şikâyet ve tehlike bildirimleri burada görünecek.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-sm">
                    {filtered.map(item => {
                        const typeInfo = getTypeInfo(item.type);
                        const statusInfo = getStatusInfo(item.status);
                        const priorityInfo = getPriorityInfo(item.priority);
                        const TypeIcon = TYPE_ICONS[item.type] || MessageSquare;

                        return (
                            <div
                                key={item.id}
                                className="glass-card feedback-card"
                                style={{ padding: 'var(--space-md)', cursor: 'pointer' }}
                                onClick={() => { setShowDetail(item); setResponseText(item.adminResponse || ''); }}
                            >
                                <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                        background: `${typeInfo.color}20`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <TypeIcon size={18} style={{ color: typeInfo.color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center gap-xs" style={{ flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }} className="truncate">
                                                {item.title}
                                            </span>
                                            {item.isAnonymous && (
                                                <span className="badge feedback-anon-badge">
                                                    <EyeOff size={10} /> Anonim
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-sm" style={{
                                            fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2
                                        }}>
                                            <span className="flex items-center gap-xs">
                                                <Building2 size={12} /> {item.department}
                                            </span>
                                            <span>·</span>
                                            <span className="flex items-center gap-xs">
                                                <Clock size={12} /> {formatDate(item.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-xs" style={{ flexShrink: 0 }}>
                                        <span className="badge" style={{
                                            background: `${priorityInfo.color}20`,
                                            color: priorityInfo.color
                                        }}>
                                            {priorityInfo.label}
                                        </span>
                                        <span className="badge" style={{
                                            background: `${statusInfo.color}20`,
                                            color: statusInfo.color
                                        }}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                                <p style={{
                                    fontSize: '0.8125rem', color: 'var(--text-secondary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                }}>
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={() => setShowForm(true)} title="Yeni Geri Bildirim">
                <Plus size={24} />
            </button>

            {/* New Feedback Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-sm">
                                <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
                                Yeni Geri Bildirim
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="flex flex-col gap-md">
                                    {/* Type Selector */}
                                    <div className="form-group">
                                        <label className="form-label">Tür</label>
                                        <div className="grid grid-2" style={{ gap: 'var(--space-sm)' }}>
                                            {FEEDBACK_TYPES.map(t => {
                                                const Icon = TYPE_ICONS[t.id] || MessageSquare;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setFormData(d => ({ ...d, type: t.id }))}
                                                        className="glass-card"
                                                        style={{
                                                            padding: 'var(--space-sm) var(--space-md)',
                                                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                                            cursor: 'pointer', transition: 'all var(--transition-fast)',
                                                            border: formData.type === t.id
                                                                ? `2px solid ${t.color}` : '1px solid var(--border-color)',
                                                            background: formData.type === t.id ? `${t.color}15` : 'var(--bg-glass)'
                                                        }}
                                                    >
                                                        <Icon size={18} style={{ color: t.color }} />
                                                        <span style={{
                                                            fontSize: '0.8125rem', fontWeight: formData.type === t.id ? 600 : 400,
                                                            color: formData.type === t.id ? t.color : 'var(--text-secondary)'
                                                        }}>{t.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="form-group">
                                        <label className="form-label">Başlık *</label>
                                        <input
                                            className="form-input"
                                            placeholder="Geri bildirim başlığı..."
                                            value={formData.title}
                                            onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="form-group">
                                        <label className="form-label">Açıklama *</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Detaylı açıklama yazın..."
                                            rows={4}
                                            value={formData.description}
                                            onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Department & Priority */}
                                    <div className="grid grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Departman *</label>
                                            <select
                                                className="form-select"
                                                value={formData.department}
                                                onChange={e => setFormData(d => ({ ...d, department: e.target.value }))}
                                                required
                                            >
                                                <option value="">Seçiniz</option>
                                                {DEPARTMENTS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Öncelik</label>
                                            <select
                                                className="form-select"
                                                value={formData.priority}
                                                onChange={e => setFormData(d => ({ ...d, priority: e.target.value }))}
                                            >
                                                {FEEDBACK_PRIORITIES.map(p => (
                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Submitted By */}
                                    {!formData.isAnonymous && (
                                        <div className="form-group">
                                            <label className="form-label">Gönderen Adı</label>
                                            <input
                                                className="form-input"
                                                placeholder="Adınız (isteğe bağlı)"
                                                value={formData.submittedBy}
                                                onChange={e => setFormData(d => ({ ...d, submittedBy: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {/* Anonymous Toggle */}
                                    <label className="flex items-center gap-sm" style={{
                                        cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)',
                                        background: formData.isAnonymous ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: formData.isAnonymous ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                                        transition: 'all var(--transition-fast)'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isAnonymous}
                                            onChange={e => setFormData(d => ({ ...d, isAnonymous: e.target.checked }))}
                                            style={{ accentColor: '#8B5CF6', width: 18, height: 18 }}
                                        />
                                        <EyeOff size={16} style={{ color: formData.isAnonymous ? '#8B5CF6' : 'var(--text-muted)' }} />
                                        <span style={{
                                            fontSize: '0.875rem',
                                            color: formData.isAnonymous ? '#8B5CF6' : 'var(--text-secondary)',
                                            fontWeight: formData.isAnonymous ? 600 : 400
                                        }}>
                                            Anonim olarak gönder
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Send size={16} /> Gönder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-sm">
                                <Eye size={20} style={{ color: 'var(--color-primary)' }} />
                                Geri Bildirim Detay
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowDetail(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="flex flex-col gap-md">
                                {/* Meta */}
                                <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {(() => {
                                        const typeInfo = getTypeInfo(showDetail.type);
                                        return (
                                            <span className="badge" style={{
                                                background: `${typeInfo.color}20`, color: typeInfo.color
                                            }}>
                                                {typeInfo.icon} {typeInfo.label}
                                            </span>
                                        );
                                    })()}
                                    {(() => {
                                        const statusInfo = getStatusInfo(showDetail.status);
                                        return (
                                            <span className="badge" style={{
                                                background: `${statusInfo.color}20`, color: statusInfo.color
                                            }}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </span>
                                        );
                                    })()}
                                    {(() => {
                                        const prioInfo = getPriorityInfo(showDetail.priority);
                                        return (
                                            <span className="badge" style={{
                                                background: `${prioInfo.color}20`, color: prioInfo.color
                                            }}>
                                                {prioInfo.label}
                                            </span>
                                        );
                                    })()}
                                    {showDetail.isAnonymous && (
                                        <span className="badge feedback-anon-badge">
                                            <EyeOff size={10} /> Anonim
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{showDetail.title}</h3>

                                {/* Info */}
                                <div className="flex gap-md" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <span className="flex items-center gap-xs">
                                        <Building2 size={14} /> {showDetail.department}
                                    </span>
                                    <span className="flex items-center gap-xs">
                                        <User size={14} /> {showDetail.submittedBy}
                                    </span>
                                    <span className="flex items-center gap-xs">
                                        <Clock size={14} /> {formatDate(showDetail.createdAt)}
                                    </span>
                                </div>

                                {/* Description */}
                                <div style={{
                                    padding: 'var(--space-md)', background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)', fontSize: '0.9375rem',
                                    lineHeight: 1.7, color: 'var(--text-secondary)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {showDetail.description}
                                </div>

                                {/* Existing Admin Response */}
                                {showDetail.adminResponse && (
                                    <div style={{
                                        padding: 'var(--space-md)',
                                        background: 'rgba(255, 140, 0, 0.08)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '3px solid var(--color-primary)'
                                    }}>
                                        <div className="flex items-center gap-xs" style={{
                                            fontSize: '0.75rem', fontWeight: 600,
                                            color: 'var(--color-primary)', marginBottom: 'var(--space-xs)'
                                        }}>
                                            <Shield size={14} /> İSG Uzmanı Yanıtı
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                            {showDetail.adminResponse}
                                        </p>
                                    </div>
                                )}

                                {/* Status Change */}
                                <div className="form-group">
                                    <label className="form-label">Durumu Güncelle</label>
                                    <select
                                        className="form-select"
                                        value={showDetail.status}
                                        onChange={e => handleStatusChange(showDetail.id, e.target.value)}
                                    >
                                        {FEEDBACK_STATUSES.map(s => (
                                            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Admin Response Input */}
                                <div className="form-group">
                                    <label className="form-label">Yanıt Yaz</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Çalışana yanıtınızı yazın..."
                                        rows={3}
                                        value={responseText}
                                        onChange={e => setResponseText(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        style={{ alignSelf: 'flex-end', marginTop: 'var(--space-xs)' }}
                                        onClick={() => handleRespond(showDetail.id)}
                                        disabled={!responseText.trim()}
                                    >
                                        <Send size={14} /> Yanıtı Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(showDetail.id)}
                            >
                                <Trash2 size={14} /> Sil
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
