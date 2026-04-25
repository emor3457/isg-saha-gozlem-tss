import { useState, useEffect } from 'react';
import {
    ListChecks, Search, CheckCircle, Clock, AlertCircle,
    Eye, Calendar, User, Plus, X, Save
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Common/Toast';
import { getAllActions, updateAction, deleteAction, checkAndMarkOverdue, createAction } from '../services/actionService';
import { ACTION_STATUSES } from '../config/categories';

export default function Actions() {
    const [actions, setActions] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
    const [newAction, setNewAction] = useState({
        description: searchParams.get('desc') || '',
        responsiblePerson: '',
        dueDate: '',
        notes: ''
    });
    const toast = useToast();

    useEffect(() => { loadActions(); }, []);

    async function loadActions() {
        try {
            await checkAndMarkOverdue();
            const data = await getAllActions();
            setActions(data);
        } catch (err) {
            toast.error('Aksiyonlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(id, newStatus) {
        await updateAction(id, { status: newStatus });
        toast.success('Aksiyon durumu güncellendi');
        loadActions();
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu aksiyonu silmek istediğinize emin misiniz?')) return;
        await deleteAction(id);
        toast.success('Aksiyon silindi');
        loadActions();
    }

    async function handleAddAction(e) {
        e.preventDefault();
        if (!newAction.description.trim() || !newAction.responsiblePerson.trim()) {
            toast.warning('Açıklama ve sorumlu kişi zorunludur.');
            return;
        }
        await createAction(newAction);
        toast.success('Yeni aksiyon (DÖF) başarıyla başlatıldı.');
        setShowForm(false);
        setNewAction({ description: '', responsiblePerson: '', dueDate: '', notes: '' });

        // Remove query parameters from URL
        if (searchParams.get('new')) {
            setSearchParams({});
        }

        loadActions();
    }

    const filtered = actions.filter(a => {
        const matchSearch = !search ||
            a.description?.toLowerCase().includes(search.toLowerCase()) ||
            a.responsiblePerson?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusCounts = {
        all: actions.length,
        open: actions.filter(a => a.status === 'open').length,
        in_progress: actions.filter(a => a.status === 'in_progress').length,
        completed: actions.filter(a => a.status === 'completed').length,
        overdue: actions.filter(a => a.status === 'overdue').length,
    };

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">
                        <ListChecks size={28} style={{ color: 'var(--color-info)' }} />
                        Aksiyon Takip (DÖF)
                    </h1>
                    <p className="page-subtitle">{actions.length} aksiyon kaydı</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Yeni Aksiyon Ekle
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-sm" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'Tümü', color: 'var(--text-secondary)' },
                    { key: 'open', label: 'Açık', color: 'var(--color-info)' },
                    { key: 'in_progress', label: 'Devam', color: 'var(--color-warning)' },
                    { key: 'overdue', label: 'Gecik.', color: 'var(--color-danger)' },
                    { key: 'completed', label: 'Tamam', color: 'var(--color-success)' }
                ].map(tab => (
                    <button key={tab.key}
                        className={`btn ${filterStatus === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            background: filterStatus === tab.key ? tab.color : undefined,
                            fontSize: '0.8125rem'
                        }}
                        onClick={() => setFilterStatus(tab.key)}>
                        {tab.label} ({statusCounts[tab.key] || 0})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Aksiyon ara..." value={search}
                    onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>

            {/* Action List */}
            {loading ? (
                <div className="text-center" style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <ListChecks size={64} />
                    <h3>Aksiyon bulunamadı</h3>
                    <p>Gözlem detayından veya Kök Neden Analizinden yeni aksiyon oluşturabilirsiniz</p>
                </div>
            ) : (
                <div className="flex flex-col gap-sm">
                    {filtered.map(action => {
                        const st = ACTION_STATUSES.find(s => s.id === action.status) || ACTION_STATUSES[0];
                        const isOverdue = action.status === 'overdue';
                        return (
                            <div key={action.id} className="glass-card" style={{
                                padding: 'var(--space-md)',
                                borderLeft: `3px solid ${st.color}`
                            }}>
                                <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }} className="truncate">
                                            {action.description}
                                        </div>
                                        <div className="flex items-center gap-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            {action.responsiblePerson && (
                                                <span className="flex items-center gap-xs"><User size={12} /> {action.responsiblePerson}</span>
                                            )}
                                            {action.dueDate && (
                                                <span className="flex items-center gap-xs" style={{ color: isOverdue ? 'var(--color-danger)' : undefined }}>
                                                    <Calendar size={12} /> {new Date(action.dueDate).toLocaleDateString('tr-TR')}
                                                    {isOverdue && ' ⚠️'}
                                                </span>
                                            )}
                                            {action.completionDate && (
                                                <span className="flex items-center gap-xs" style={{ color: 'var(--color-success)' }}>
                                                    <CheckCircle size={12} /> {new Date(action.completionDate).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                        </div>
                                        {action.notes && (
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>{action.notes}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <select className="form-select" value={action.status}
                                            onChange={e => handleStatusChange(action.id, e.target.value)}
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 1.75rem 0.25rem 0.5rem', minWidth: 120 }}>
                                            {ACTION_STATUSES.filter(s => s.id !== 'overdue').map(s => (
                                                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                                            ))}
                                        </select>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(action.id)}
                                            style={{ color: 'var(--text-muted)' }} title="Sil"><X size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* NEW ACTION MODAL */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
                                Yeni Düzeltici/Önleyici Faaliyet (DÖF)
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddAction}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Aksiyon Açıklaması *</label>
                                    <textarea className="form-textarea" required rows={3} placeholder="Yapılacak işlem..."
                                        value={newAction.description} onChange={e => setNewAction({ ...newAction, description: e.target.value })} />
                                </div>
                                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Sorumlu Kişi/Birim *</label>
                                        <input className="form-input" required placeholder="İsim veya Departman"
                                            value={newAction.responsiblePerson} onChange={e => setNewAction({ ...newAction, responsiblePerson: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Hedef Tarih</label>
                                        <input type="date" className="form-input"
                                            value={newAction.dueDate} onChange={e => setNewAction({ ...newAction, dueDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ek Notlar</label>
                                    <textarea className="form-textarea" rows={2} placeholder="Varsa ek bilgiler..."
                                        value={newAction.notes} onChange={e => setNewAction({ ...newAction, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary"><Save size={16} /> Aksiyon Başlat</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
