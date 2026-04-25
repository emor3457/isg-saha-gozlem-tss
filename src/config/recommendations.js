// Risk puanına göre otomatik İSG uzman önerileri
export const RECOMMENDATION_TEMPLATES = {
    fod: {
        title: 'FOD Önlemleri',
        recommendations: [
            'FOD yürüyüşü (walk-down) programı uygulayın',
            'FOD kutularını stratejik noktalara yerleştirin',
            'Alet kontrol sistemi (tool accountability) uygulayın',
            'Personele FOD farkındalık eğitimi verin',
            'FOD önleme prosedürlerini güncelleyin'
        ]
    },
    hangar: {
        title: 'Hangar Güvenliği',
        recommendations: [
            'Zemin işaretlemelerini kontrol edin ve yenileyin',
            'Aydınlatma seviyesini ölçün (min. 500 lux)',
            'Havalandırma sistemini kontrol edin',
            'Acil çıkış yollarının açıklığını doğrulayın',
            'Vinç ve kaldırma ekipmanı periyodik kontrolünü yaptırın'
        ]
    },
    kimyasal: {
        title: 'Kimyasal Güvenlik',
        recommendations: [
            'MSDS/SDS dosyalarının erişilebilir olduğundan emin olun',
            'Kimyasal depolama kurallarına uygunluğu kontrol edin',
            'Uygun KKD (eldiven, maske, gözlük) kullanımını sağlayın',
            'Kimyasal dökülme müdahale setini hazır bulundurun',
            'Havalandırma ve aspirasyon sistemlerini kontrol edin'
        ]
    },
    yuksekte: {
        title: 'Yüksekte Çalışma',
        recommendations: [
            'Emniyet kemeri ve yaşam hattı kullanımını zorunlu kılın',
            'İskele/platformların periyodik kontrolünü yaptırın',
            'Düşme koruma planı hazırlayın',
            'Çalışanlara yüksekte çalışma eğitimi verin',
            'Kenar koruma sistemlerini kontrol edin'
        ]
    },
    elektrik: {
        title: 'Elektrik Güvenliği',
        recommendations: [
            'LOTO (Kilitle-Etiketle) prosedürünü uygulayın',
            'Topraklama kontrollerini yaptırın',
            'Elektrik panolarının erişilebilirliğini sağlayın',
            'İzolasyon malzemelerinin durumunu kontrol edin',
            'Yalnız yetkili personelin müdahale etmesini sağlayın'
        ]
    },
    kkd: {
        title: 'KKD Kullanımı',
        recommendations: [
            'KKD risk analizi sonuçlarına göre seçildiğinden emin olun',
            'KKD kullanım eğitimi ve talimatlarını güncelleyin',
            'KKD\'lerin periyodik kontrolünü ve değişimini takip edin',
            'Uygun KKD\'nin yeterli miktarda bulundurulmasını sağlayın',
            'KKD kullanımını denetleyin ve kayıt altına alın'
        ]
    },
    gurultu: {
        title: 'Gürültü Kontrolü',
        recommendations: [
            'Gürültü ölçümü yaptırın (ortam ve kişisel maruziyet)',
            'Kaynakta gürültü azaltma tedbirleri uygulayın',
            'Uygun kulak koruyucusu sağlayın',
            'Gürültülü alanlarda uyarı işaretleri koyun',
            '85 dB üzerinde çalışanlara odyometri testi yaptırın'
        ]
    },
    yangin: {
        title: 'Yangın Güvenliği',
        recommendations: [
            'Yangın söndürme cihazlarının doluluk ve bakımını kontrol edin',
            'Yangın algılama sisteminin çalışırlığını doğrulayın',
            'Tahliye tatbikatı planlayın',
            'Acil çıkış yollarının işaretli ve engelsiz olduğundan emin olun',
            'Yangın söndürme eğitimi verin'
        ]
    },
    ergonomi: {
        title: 'Ergonomik İyileştirmeler',
        recommendations: [
            'Çalışma istasyonu ergonomik analizini yapın',
            'Manuel kaldırma tekniği eğitimi verin',
            'Yardımcı kaldırma ekipmanı temin edin',
            'Mola ve dinlenme programı uygulayın',
            'Tekrarlayan hareket analizini yapın'
        ]
    },
    diger: {
        title: 'Genel İSG Önerileri',
        recommendations: [
            'Risk değerlendirmesini güncelleyin',
            'İlgili personele İSG eğitimi verin',
            'Düzeltici/önleyici faaliyet başlatın',
            'İSG kuruluna rapor edin',
            'Periyodik takip planı oluşturun'
        ]
    }
};

export function getRecommendations(categoryId) {
    return RECOMMENDATION_TEMPLATES[categoryId] || RECOMMENDATION_TEMPLATES.diger;
}

export function getExpertOpinion(categoryId, riskLevel, riskScore) {
    const rec = getRecommendations(categoryId);
    const urgencyMap = {
        'very-high': { prefix: '🚨 ACİL:', days: 1 },
        'high': { prefix: '⚠️ ÖNCELİKLİ:', days: 7 },
        'medium': { prefix: '🔶 ORTA ÖNCELİK:', days: 30 },
        'low': { prefix: '🔷 PLANLANAN:', days: 90 },
        'very-low': { prefix: 'ℹ️ İZLEME:', days: 180 }
    };
    const urgency = urgencyMap[riskLevel] || urgencyMap['medium'];

    return {
        title: `${urgency.prefix} ${rec.title}`,
        recommendations: rec.recommendations,
        suggestedDeadlineDays: urgency.days,
        riskScore,
        riskLevel
    };
}
