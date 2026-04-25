// Fine-Kinney Risk Değerlendirme Parametreleri
// Risk Skoru = Olasılık (P) × Frekans (F) × Şiddet (S)

export const PROBABILITY_VALUES = [
    { value: 0.1, label: 'Hemen hemen imkansız', description: 'Çok nadir, düşük olasılık' },
    { value: 0.2, label: 'Çok düşük', description: 'Pek olası değil ama mümkün' },
    { value: 0.5, label: 'Düşük', description: 'Düşük fakat mümkün' },
    { value: 1, label: 'Oldukça düşük', description: 'Olması beklenmez ama mümkün' },
    { value: 3, label: 'Normal', description: 'Olabilir, sıradışı değil' },
    { value: 6, label: 'Yüksek', description: 'Büyük olasılıkla olacak' },
    { value: 10, label: 'Çok yüksek', description: 'Kesinlikle bekleniyor' }
];

export const FREQUENCY_VALUES = [
    { value: 0.5, label: 'Çok nadir', description: 'Yılda bir veya daha az' },
    { value: 1, label: 'Nadir', description: 'Yılda birkaç kez' },
    { value: 2, label: 'Ara sıra', description: 'Ayda bir' },
    { value: 3, label: 'Arada bir', description: 'Haftada bir' },
    { value: 6, label: 'Sık', description: 'Her gün' },
    { value: 10, label: 'Sürekli', description: 'Sürekli (gün boyu)' }
];

export const SEVERITY_VALUES = [
    { value: 1, label: 'İlk yardım gerektiren', description: 'Küçük çizik, kesik' },
    { value: 3, label: 'Küçük hasar', description: 'Yüzeysel yaralanma, ekipman hasarı' },
    { value: 7, label: 'Önemli', description: 'Ciddi yaralanma, iş günü kaybı' },
    { value: 15, label: 'Ağır', description: 'Kalıcı hasar, uzuv kaybı' },
    { value: 40, label: 'Çok ağır', description: 'Ölüm veya kalıcı sakatlık' },
    { value: 100, label: 'Felaket', description: 'Birden fazla ölüm' }
];

export const RISK_LEVELS = [
    { min: 0, max: 20, level: 'very-low', label: 'Çok Düşük Risk', color: '#06B6D4', action: 'Kabul edilebilir risk. İzleme yeterli.' },
    { min: 20, max: 70, level: 'low', label: 'Düşük Risk', color: '#22C55E', action: 'Dikkat edilmeli, eylem planlanabilir.' },
    { min: 70, max: 200, level: 'medium', label: 'Orta Risk', color: '#EAB308', action: 'Kısa dönemde düzeltici faaliyet gerekli.' },
    { min: 200, max: 400, level: 'high', label: 'Yüksek Risk', color: '#F97316', action: 'Derhal müdahale gerekli, iş izinle devam.' },
    { min: 400, max: Infinity, level: 'very-high', label: 'Çok Yüksek Risk', color: '#DC2626', action: 'İş durdurulmalı! Acil önlem alınmalı.' }
];

export function calculateRiskScore(probability, frequency, severity) {
    return probability * frequency * severity;
}

export function getRiskLevel(score) {
    return RISK_LEVELS.find(l => score >= l.min && score < l.max) || RISK_LEVELS[RISK_LEVELS.length - 1];
}

export function getRecommendedActions(riskLevel, category) {
    const baseActions = {
        'very-low': ['Durumu izlemeye devam edin', 'Periyodik kontrol planı yapın'],
        'low': ['Düzeltici faaliyet planlayın', 'İlgili personeli bilgilendirin', 'KKD kontrolü yapın'],
        'medium': ['30 gün içinde düzeltici faaliyet başlatın', 'Risk azaltma tedbirleri uygulayın', 'Personel eğitimi verin', 'İSG kuruluna raporlayın'],
        'high': ['Derhal geçici tedbirler alın', '7 gün içinde kalıcı çözüm uygulayın', 'İlgili alanı işaretleyin', 'Yönetimi bilgilendirin', 'İSG kurulu acil toplantısı'],
        'very-high': ['İŞ DURDURULMALI', 'Alan tahliye edilmeli', 'Acil müdahale ekibi devreye alınmalı', 'Yönetim hemen bilgilendirilmeli', 'Kaza raporu hazırlanmalı']
    };
    return baseActions[riskLevel] || [];
}
