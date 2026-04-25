import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Eye, EyeOff, Mail, User, Building2, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../components/Common/Toast';

export default function Login() {
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'pin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [pin, setPin] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();
    const toast = useToast();
    const isOnline = navigator.onLine;

    const handleServerLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                toast.success('Giriş başarılı! Hoş geldiniz.');
            }
        } catch (err) {
            toast.error(err.message || 'Giriş başarısız! E-posta veya şifre hatalı.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        setIsLoading(true);
        try {
            await register({ name, email, password, orgName: orgName || 'ISG Organizasyonu' });
            toast.success('Kayıt başarılı! Organizasyon ve admin hesabınız oluşturuldu.');
        } catch (err) {
            toast.error(err.message || 'Kayıt başarısız!');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinLogin = async (e) => {
        e.preventDefault();
        const success = await login(pin);
        if (success) {
            toast.success('Çevrimdışı giriş başarılı!');
        } else {
            toast.error('Geçersiz PIN kodu.');
        }
    };

    const inputStyle = {
        paddingLeft: '2.5rem',
        paddingRight: mode !== 'pin' ? '1rem' : '2.5rem'
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '2rem', background: 'var(--bg-primary)'
        }}>
            <div className="glass-card" style={{
                maxWidth: 420, width: '100%', padding: 'var(--space-2xl) var(--space-xl)',
                textAlign: 'center'
            }}>
                {/* Logo */}
                <div style={{
                    width: 64, height: 64, borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-warning))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-lg)'
                }}>
                    <Shield size={32} color="white" />
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    İSG Saha Gözlem
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                    ISO 45001 Uyumlu · Turkish Technic
                </p>

                {/* Online/Offline Durum */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    marginBottom: '1.25rem', fontSize: '0.75rem',
                    color: isOnline ? '#10b981' : '#ef4444'
                }}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span>{isOnline ? 'Sunucu bağlantısı aktif' : 'Çevrimdışı mod'}</span>
                </div>

                {/* Mode Tabs */}
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: '1.5rem',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px'
                }}>
                    <button
                        onClick={() => setMode('login')}
                        style={{
                            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                            background: mode === 'login' ? 'var(--color-primary)' : 'transparent',
                            color: mode === 'login' ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        style={{
                            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                            background: mode === 'register' ? 'var(--color-primary)' : 'transparent',
                            color: mode === 'register' ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        İlk Kayıt
                    </button>
                    <button
                        onClick={() => setMode('pin')}
                        style={{
                            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                            background: mode === 'pin' ? 'var(--color-primary)' : 'transparent',
                            color: mode === 'pin' ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        PIN
                    </button>
                </div>

                {/* ═══ Server Login Form ═══ */}
                {mode === 'login' && (
                    <form onSubmit={handleServerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                style={inputStyle}
                                placeholder="E-posta adresi"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                placeholder="Şifre"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', top: 12, right: 12,
                                    background: 'transparent', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-muted)'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !isOnline}
                            style={{ width: '100%', padding: '0.75rem', fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hızlı Erişim</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => login('123456')}
                                    className="btn"
                                    style={{ 
                                        flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: 'rgba(255, 140, 0, 0.1)', 
                                        color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600 
                                    }}
                                >
                                    🛡️ Yönetici Girişi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => login('0000')}
                                    className="btn"
                                    style={{ 
                                        flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: 'rgba(100, 116, 139, 0.1)', 
                                        color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 600 
                                    }}
                                >
                                    👷 Personel Girişi
                                </button>
                            </div>
                        </div>

                        {!isOnline && (
                            <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                                Sunucu girişi için internet bağlantısı gereklidir. Çevrimdışı için PIN sekmesini kullanın.
                            </p>
                        )}
                    </form>
                )}

                {/* ═══ Register Form ═══ */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="form-input"
                                style={inputStyle}
                                placeholder="Organizasyon adı (ör: Turkish Technic)"
                            />
                        </div>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                                style={inputStyle}
                                placeholder="Adınız Soyadınız"
                                required
                            />
                        </div>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                style={inputStyle}
                                placeholder="E-posta adresi"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                placeholder="Şifre (min 6 karakter)"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', top: 12, right: 12,
                                    background: 'transparent', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-muted)'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !isOnline}
                            style={{ width: '100%', padding: '0.75rem', fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Kayıt oluşturuluyor...' : 'Organizasyon Oluştur'}
                        </button>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                            İlk kayıt otomatik olarak Admin rolünde oluşturulur.
                        </p>
                    </form>
                )}

                {/* ═══ PIN Offline Form ═══ */}
                {mode === 'pin' && (
                    <form onSubmit={handlePinLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <div style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                placeholder="6 haneli PIN kodu"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', top: 12, right: 12,
                                    background: 'transparent', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-muted)'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
                        >
                            Çevrimdışı Giriş
                        </button>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <span>Admin: 123456</span>
                            <span>Çalışan: 0000</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
