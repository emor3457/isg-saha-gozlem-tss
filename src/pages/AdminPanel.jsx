import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Common/Toast';
import {
    Building2, Users, FolderTree, Shield, Plus, Edit2, Trash2, Save, X,
    UserPlus, UserMinus, Mail, Phone, BadgeCheck, ChevronDown, ChevronUp,
    Search, RefreshCw
} from 'lucide-react';
import { apiGet, apiCreate, apiUpdate, apiDelete, apiRequest } from '../services/syncService';

// ══════════════════════════════════════════════
// ANA BİLEŞEN
// ══════════════════════════════════════════════

export default function AdminPanel() {
    const { user, isAdmin } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('org');

    if (!isAdmin && user?.role !== 'isg_expert') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Shield size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--text-primary)' }}>Erişim Engellendi</h2>
                <p style={{ color: 'var(--text-muted)' }}>Bu sayfaya erişim yetkiniz bulunmuyor.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'org', label: 'Organizasyon', icon: Building2 },
        { id: 'users', label: 'Kullanıcılar', icon: Users },
        { id: 'departments', label: 'Departmanlar', icon: FolderTree }
    ];

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Yönetim Paneli
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Organizasyon, kullanıcı ve departman yönetimi
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '1.5rem',
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px',
                maxWidth: '500px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                            background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'org' && <OrgSettings toast={toast} />}
            {activeTab === 'users' && <UserManagement toast={toast} />}
            {activeTab === 'departments' && <DepartmentManagement toast={toast} />}
        </div>
    );
}

// ══════════════════════════════════════════════
// ORGANİZASYON AYARLARI
// ══════════════════════════════════════════════

function OrgSettings({ toast }) {
    const [org, setOrg] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});

    useEffect(() => { loadOrg(); }, []);

    const loadOrg = async () => {
        const data = await apiRequest('/org');
        if (data?.organization) {
            setOrg(data.organization);
            setForm(data.organization);
        }
    };

    const handleSave = async () => {
        try {
            await apiRequest('/org', {
                method: 'PUT',
                body: JSON.stringify(form)
            });
            setOrg(form);
            setEditing(false);
            toast.success('Organizasyon bilgileri güncellendi');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (!org) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>;

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Building2 size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Organizasyon Bilgileri
                </h2>
                {!editing ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                        <Edit2 size={14} /> Düzenle
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm(org); }}>
                            <X size={14} /> İptal
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>
                            <Save size={14} /> Kaydet
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {[
                    { key: 'name', label: 'Organizasyon Adı' },
                    { key: 'domain', label: 'Alan Adı' },
                    { key: 'sector', label: 'Sektör' },
                    { key: 'employeeCount', label: 'Çalışan Sayısı', type: 'number' }
                ].map(field => (
                    <div key={field.key}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            {field.label}
                        </label>
                        {editing ? (
                            <input
                                type={field.type || 'text'}
                                className="form-input"
                                value={form[field.key] || ''}
                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                            />
                        ) : (
                            <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
                                {org[field.key] || '—'}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// KULLANICI YÖNETİMİ
// ══════════════════════════════════════════════

const ROLE_LABELS = {
    admin: { label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    isg_expert: { label: 'İSG Uzmanı', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    dept_manager: { label: 'Dept. Yöneticisi', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    employee: { label: 'Çalışan', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    external_auditor: { label: 'Dış Denetçi', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
};

function UserManagement({ toast }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', title: '', phone: '' });

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        const data = await apiRequest('/org/users');
        if (data?.users) setUsers(data.users);
    };

    const handleAddUser = async () => {
        if (!form.name || !form.email || !form.password) {
            toast.error('Ad, e-posta ve şifre zorunludur');
            return;
        }
        try {
            await apiRequest('/org/users', { method: 'POST', body: JSON.stringify(form) });
            toast.success('Kullanıcı eklendi');
            setShowAddForm(false);
            setForm({ name: '', email: '', password: '', role: 'employee', department: '', title: '', phone: '' });
            loadUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpdateUser = async (userId) => {
        try {
            await apiRequest(`/org/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(editingUser)
            });
            toast.success('Kullanıcı güncellendi');
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Bu kullanıcıyı pasifize etmek istediğinize emin misiniz?')) return;
        try {
            await apiRequest(`/org/users/${userId}`, { method: 'DELETE' });
            toast.success('Kullanıcı pasifize edildi');
            loadUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', top: 10, left: 10, color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
                        placeholder="Kullanıcı ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                    <UserPlus size={14} /> Kullanıcı Ekle
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Yeni Kullanıcı</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <input className="form-input" placeholder="Ad Soyad *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input className="form-input" type="email" placeholder="E-posta *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input className="form-input" type="password" placeholder="Şifre *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            {Object.entries(ROLE_LABELS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                        <input className="form-input" placeholder="Departman" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                        <input className="form-input" placeholder="Unvan" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(false)}>İptal</button>
                        <button className="btn btn-primary btn-sm" onClick={handleAddUser}>Ekle</button>
                    </div>
                </div>
            )}

            {/* User List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.map(u => {
                    const role = ROLE_LABELS[u.role] || ROLE_LABELS.employee;
                    const isEditing = editingUser?.id === u.id;

                    return (
                        <div key={u.id} className="glass-card" style={{
                            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                            flexWrap: 'wrap', opacity: u.status === 'inactive' ? 0.5 : 1
                        }}>
                            {/* Avatar */}
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', background: role.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: role.color, fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                            }}>
                                {u.name?.charAt(0)?.toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Mail size={11} /> {u.email}</span>
                                    {u.department && <span>· {u.department}</span>}
                                </div>
                            </div>

                            {/* Role badge */}
                            {isEditing ? (
                                <select
                                    className="form-input"
                                    style={{ width: 'auto', fontSize: '0.75rem', padding: '4px 8px' }}
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <span style={{
                                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem',
                                    fontWeight: 600, background: role.bg, color: role.color
                                }}>
                                    {role.label}
                                </span>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {isEditing ? (
                                    <>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingUser(null)} title="İptal">
                                            <X size={14} />
                                        </button>
                                        <button className="btn btn-primary btn-icon btn-sm" onClick={() => handleUpdateUser(u.id)} title="Kaydet">
                                            <Save size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingUser({ id: u.id, role: u.role, department: u.department, status: u.status })} title="Düzenle">
                                            <Edit2 size={14} />
                                        </button>
                                        {u.status !== 'inactive' && (
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeactivate(u.id)} title="Pasifize Et" style={{ color: 'var(--color-danger)' }}>
                                                <UserMinus size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Kullanıcı bulunamadı</p>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
// DEPARTMAN YÖNETİMİ
// ══════════════════════════════════════════════

function DepartmentManagement({ toast }) {
    const [departments, setDepartments] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => { loadDepts(); }, []);

    const loadDepts = async () => {
        const data = await apiRequest('/org/departments');
        if (data?.departments) setDepartments(data.departments);
    };

    const handleAdd = async () => {
        if (!name.trim()) { toast.error('Departman adı zorunludur'); return; }
        try {
            await apiRequest('/org/departments', { method: 'POST', body: JSON.stringify({ name }) });
            toast.success('Departman eklendi');
            setName('');
            setShowAdd(false);
            loadDepts();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <FolderTree size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Departmanlar
                </h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
                    <Plus size={14} /> Ekle
                </button>
            </div>

            {showAdd && (
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input className="form-input" placeholder="Departman adı" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={handleAdd}>Ekle</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>İptal</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {departments.map(dept => (
                    <div key={dept.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
                            }}>
                                <FolderTree size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{dept.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    ID: {dept.id}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {departments.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                        Henüz departman eklenmedi
                    </p>
                )}
            </div>
        </div>
    );
}
