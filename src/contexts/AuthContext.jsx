import { createContext, useContext, useState, useEffect } from 'react';
import db from '../database/db';
import { serverLogin, serverRegister, serverLogout, getCurrentUser, isAuthenticated, initSync } from '../services/syncService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Önce sunucu token'ı kontrol et
                if (isAuthenticated()) {
                    const serverUser = getCurrentUser();
                    if (serverUser) {
                        setUser({ ...serverUser, authType: 'server' });
                        setLoading(false);
                        return;
                    }
                }

                // Offline fallback: Dexie'den kayıtlı kullanıcı
                const savedUser = await db.settings.get('authUser');
                if (savedUser && savedUser.value) {
                    setUser({ ...savedUser.value, authType: 'offline' });
                }
            } catch (err) {
                console.error('Auth initialization error', err);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    /**
     * Sunucu tabanlı giriş (e-posta + şifre)
     */
    const login = async (emailOrPin, password) => {
        // E-posta formatı ise sunucu giriş
        if (emailOrPin && emailOrPin.includes('@')) {
            try {
                const serverUser = await serverLogin(emailOrPin, password);
                const userData = {
                    ...serverUser,
                    authType: 'server',
                    loginTime: new Date().toISOString()
                };
                await db.settings.put({ key: 'authUser', value: userData });
                setUser(userData);
                return true;
            } catch (err) {
                console.error('Server login error:', err);
                throw err;
            }
        }

        // PIN fallback (offline mod)
        if (emailOrPin === '123456' || emailOrPin === '0000') {
            const role = emailOrPin === '123456' ? 'admin' : 'employee';
            const userData = {
                role,
                name: role === 'admin' ? 'İSG Yöneticisi' : 'Saha Çalışanı',
                authType: 'offline',
                loginTime: new Date().toISOString()
            };
            await db.settings.put({ key: 'authUser', value: userData });
            setUser(userData);
            return true;
        }

        return false;
    };

    /**
     * İlk kayıt — organizasyon + admin oluşturma
     */
    const register = async ({ name, email, password, orgName }) => {
        try {
            const serverUser = await serverRegister({ name, email, password, orgName });
            const userData = {
                ...serverUser,
                authType: 'server',
                loginTime: new Date().toISOString()
            };
            await db.settings.put({ key: 'authUser', value: userData });
            setUser(userData);
            return true;
        } catch (err) {
            console.error('Register error:', err);
            throw err;
        }
    };

    const logout = async () => {
        serverLogout();
        await db.settings.delete('authUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
            isAdmin: user?.role === 'admin',
            isServerAuth: user?.authType === 'server',
            isOfflineAuth: user?.authType === 'offline'
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
