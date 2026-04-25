import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    tr: {
        'nav.dashboard': 'Ana Sayfa',
        'nav.observations': 'Saha Gözlem',
        'nav.risk': 'Risk Değerlendirme',
        'nav.actions': 'Aksiyon Takip',
        'app.offline': 'Ağ bağlantısı yok. Şu an çevrimdışı modda çalışıyorsunuz.',
        'app.loading': 'Yükleniyor...',
        'btn.save': 'Kaydet',
        'btn.cancel': 'İptal'
    },
    en: {
        'nav.dashboard': 'Dashboard',
        'nav.observations': 'Field Observations',
        'nav.risk': 'Risk Assessment',
        'nav.actions': 'Action Tracker',
        'app.offline': 'No network connection. You are currently in offline mode.',
        'app.loading': 'Loading...',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel'
    }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('tr');

    useEffect(() => {
        const storedLang = localStorage.getItem('isg_lang');
        if (storedLang && translations[storedLang]) {
            setLang(storedLang);
        }
    }, []);

    const changeLanguage = (newLang) => {
        if (translations[newLang]) {
            setLang(newLang);
            localStorage.setItem('isg_lang', newLang);
        }
    };

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LanguageContext);
}
