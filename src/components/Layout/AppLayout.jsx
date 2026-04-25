import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Eye, AlertTriangle, ListChecks,
    BookOpen, FileBarChart, Settings, Menu, X, Bell, Shield,
    MessageSquare, GraduationCap, Files, Siren, ShieldCheck, AlertOctagon, TrendingUp,
    HardHat, ShieldAlert, Building2, Users2, Crown
} from 'lucide-react';
import { getUnreadReminders } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import SyncStatusBar from '../Common/SyncStatusBar';
import '../../layout-styles.css';

// Rol bazlı erişim:
// null = herkes görebilir
// ['admin', 'isg_expert'] = sadece belirtilen roller görebilir
const navItems = [
    { path: '/', label: 'Ana Sayfa', icon: LayoutDashboard, roles: null },
    { path: '/observations', label: 'Saha Gözlem', icon: Eye, roles: null },
    { path: '/risk', label: 'Risk Değerlendirme', icon: AlertTriangle, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/work-permits', label: 'İş İzinleri', icon: ShieldAlert, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/ppe-management', label: 'KKD Takibi', icon: HardHat, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/contractors', label: 'Taşeron Yön.', icon: Building2, roles: ['admin', 'isg_expert'] },
    { path: '/committees', label: 'İSG Kurulları', icon: Users2, roles: ['admin', 'isg_expert'] },
    { path: '/actions', label: 'Aksiyon Takip', icon: ListChecks, roles: null },
    { path: '/feedback', label: 'Geri Bildirim', icon: MessageSquare, roles: null },
    { path: '/trainings', label: 'Eğitim Takibi', icon: GraduationCap, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/documents', label: 'Doküman Yön.', icon: Files, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/emergency', label: 'Acil Durum', icon: Siren, roles: null },
    { path: '/regulations', label: 'Mevzuat', icon: BookOpen, roles: ['admin', 'isg_expert', 'external_auditor'] },
    { path: '/audits', label: 'İç Denetim', icon: ShieldCheck, roles: ['admin', 'isg_expert', 'external_auditor'] },
    { path: '/incidents', label: 'Olay/Kaza', icon: AlertOctagon, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/analytics', label: 'Dashboard', icon: TrendingUp, roles: ['admin', 'isg_expert'] },
    { path: '/reports', label: 'Raporlar', icon: FileBarChart, roles: ['admin', 'isg_expert', 'dept_manager'] },
    { path: '/admin', label: 'Yönetim Paneli', icon: Crown, roles: ['admin'] },
    { path: '/settings', label: 'Ayarlar', icon: Settings, roles: null },
];


export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const location = useLocation();
    const { user } = useAuth();

    // Rol bazlı filtreleme
    const filteredNavItems = useMemo(() => {
        const role = user?.role || 'employee';
        return navItems.filter(item => !item.roles || item.roles.includes(role));
    }, [user?.role]);

    const mobileNavItems = filteredNavItems.slice(0, 5);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const loadUnread = async () => {
            try {
                const reminders = await getUnreadReminders();
                setUnreadCount(reminders.length);
            } catch { setUnreadCount(0); }
        };
        loadUnread();
        const interval = setInterval(loadUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="app-layout">
            {/* Sidebar (Desktop) */}
            <aside
                className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}
                aria-label="Ana Menü"
                role="navigation"
            >
                <div className="app-sidebar-header">
                    <div className="flex items-center gap-sm">
                        <div className="brand-logo-container">
                            <Shield size={22} color="white" />
                        </div>
                        <div>
                            <div className="brand-title">ISG Gözlem</div>
                            <div className="brand-subtitle">Turkish Technic</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav-container" aria-label="Uygulama Menüsü">
                    {filteredNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-sm nav-link ${isActive ? 'active' : ''}`
                            }
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    ISO 45001 Uyumlu · v1.0
                </div>
            </aside>

            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="mobile-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Header */}
            <header className="app-header">
                <div className="flex items-center gap-sm">
                    <button
                        className="btn btn-ghost btn-icon mobile-only"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }}
                        id="menu-toggle"
                        aria-label={sidebarOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                        aria-expanded={sidebarOpen}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <h1 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                        {navItems.find(n => n.path === location.pathname)?.label || 'ISG Saha Gözlem'}
                    </h1>
                </div>
                <div className="flex items-center gap-sm">
                    <SyncStatusBar />
                    <NavLink to="/actions" className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </NavLink>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main" role="main">
                {isOffline && (
                    <div style={{
                        background: 'var(--color-warning)', color: '#854D0E',
                        padding: '12px 20px', fontSize: '0.875rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        borderBottom: '1px solid rgba(0,0,0,0.1)'
                    }} role="alert">
                        <AlertTriangle size={18} /> Ağ bağlantısı yok. Şu an çevrimdışı modda çalışıyorsunuz. Yeni kayıtlarınız cihazınızda yedekleniyor.
                    </div>
                )}
                {children}
            </main>

            {/* Bottom Nav (Mobile) */}
            <nav className="app-bottom-nav">
                {mobileNavItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <style>{`
        .mobile-backdrop {
            position: fixed; inset: 0; background: rgba(0,0,0,0.5);
            z-index: 199; display: none;
        }
        @media (max-width: 768px) {
          #menu-toggle { display: flex !important; }
          .mobile-backdrop { display: block !important; }
        }
      `}</style>
        </div>
    );
}
