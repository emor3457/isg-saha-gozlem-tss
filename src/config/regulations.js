// İSG Mevzuat Referansları — Türkiye & ISO 45001
export const REGULATIONS = [
    // 6331 sayılı İSGK
    {
        code: '6331',
        title: '6331 Sayılı İş Sağlığı ve Güvenliği Kanunu',
        articles: [
            { number: 'Md.4', title: 'İşverenin genel yükümlülüğü', summary: 'İşveren, çalışanların işle ilgili sağlık ve güvenliğini sağlamakla yükümlüdür.' },
            { number: 'Md.5', title: 'Risklerden korunma ilkeleri', summary: 'Risklerden kaçınmak, kaçınılması mümkün olmayan riskleri analiz etmek, tehlikeleri kaynağında yok etmek.' },
            { number: 'Md.10', title: 'Risk değerlendirmesi', summary: 'İşveren, iş sağlığı ve güvenliği yönünden risk değerlendirmesi yapmak veya yaptırmak zorundadır.' },
            { number: 'Md.11', title: 'Acil durum planları', summary: 'İşveren, acil durumları belirlemek, acil durum planları hazırlamak, uygulamak ve düzenli olarak test etmek zorundadır.' },
            { number: 'Md.14', title: 'İş kazası ve meslek hastalıkları bildirimi', summary: 'İş kazalarının ve meslek hastalıklarının SGK\'ya bildirilmesi zorunluluğu.' },
            { number: 'Md.16', title: 'Çalışanların bilgilendirilmesi', summary: 'Çalışanların iş sağlığı ve güvenliği riskleri hakkında bilgilendirilmesi.' },
            { number: 'Md.17', title: 'Çalışanların eğitimi', summary: 'İşe başlamadan önce, iş değişikliğinde ve düzenli aralıklarla İSG eğitimi.' },
            { number: 'Md.19', title: 'Çalışanların yükümlülükleri', summary: 'Çalışanlar, eğitimleri ve işverenin talimatları doğrultusunda tedbirlere uymak zorundadır.' },
            { number: 'Md.20', title: 'Çalışan temsilcisi', summary: 'İşyerinde çalışan temsilcisi seçilmesi veya belirlenmesi.' }
        ]
    },
    // Yönetmelikler
    {
        code: 'KKD',
        title: 'Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hk. Yönetmelik',
        articles: [
            { number: 'Md.5', title: 'KKD kullanım zorunluluğu', summary: 'Risklerin toplu koruma veya iş organizasyonu ile bertaraf edilemediği durumda KKD sağlanması.' },
            { number: 'Md.6', title: 'KKD seçimi ve uyumluluğu', summary: 'KKD\'nin riskin türüne ve büyüklüğüne uygun olması.' },
            { number: 'Md.8', title: 'KKD bakım ve kontrolü', summary: 'KKD\'lerin düzenli bakım, kontrol ve hijyeni.' }
        ]
    },
    {
        code: 'ISE',
        title: 'İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği',
        articles: [
            { number: 'Md.5', title: 'İş ekipmanı genel şartları', summary: 'İş ekipmanlarının uygun ve güvenli olması.' },
            { number: 'Md.7', title: 'Periyodik kontroller', summary: 'İş ekipmanlarının düzenli periyodik kontrolü.' },
            { number: 'Md.9', title: 'Kullanım kuralları', summary: 'İş ekipmanlarının kullanım kurallarının belirlenmesi.' }
        ]
    },
    {
        code: 'YUK',
        title: 'Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği (Yüksekte Çalışma)',
        articles: [
            { number: 'Md.10', title: 'Yüksekte çalışma', summary: 'Yüksekten düşme riskine karşı alınacak tedbirler.' },
            { number: 'Md.11', title: 'İskele kullanımı', summary: 'İskelelerin kurulması, kullanılması ve sökülmesi.' }
        ]
    },
    {
        code: 'KIM',
        title: 'Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hk. Yönetmelik',
        articles: [
            { number: 'Md.6', title: 'Risk değerlendirmesi', summary: 'Kimyasal madde maruziyeti risk değerlendirmesi.' },
            { number: 'Md.8', title: 'Maruziyet önleme', summary: 'Çalışanların maruziyetinin önlenmesi veya azaltılması.' },
            { number: 'Md.12', title: 'SDS/MSDS', summary: 'Güvenlik bilgi formlarının temini ve erişilebilirliği.' }
        ]
    },
    {
        code: 'GUR',
        title: 'Çalışanların Gürültü ile İlgili Risklerden Korunmalarına Dair Yönetmelik',
        articles: [
            { number: 'Md.5', title: 'Maruziyet sınır değerleri', summary: 'Günlük 85 dB(A) maruziyet eylem değeri.' },
            { number: 'Md.7', title: 'Maruziyet azaltma', summary: 'Gürültü maruziyetinin kaynağında azaltılması.' }
        ]
    },
    {
        code: 'YAN',
        title: 'Binaların Yangından Korunması Hk. Yönetmelik',
        articles: [
            { number: 'Md.30', title: 'Yangın söndürme cihazları', summary: 'Taşınabilir söndürme cihazlarının konumu ve bakımı.' },
            { number: 'Md.84', title: 'Tahliye planı', summary: 'Binalarda tahliye planı ve tatbikat.' }
        ]
    },
    // ISO 45001
    {
        code: 'ISO45001',
        title: 'ISO 45001 İş Sağlığı ve Güvenliği Yönetim Sistemi',
        articles: [
            { number: '4.1', title: 'Kuruluşun bağlamı', summary: 'İç ve dış konuların belirlenmesi.' },
            { number: '5.4', title: 'Çalışanların katılımı', summary: 'İSG konularında çalışanların danışma ve katılımı.' },
            { number: '6.1', title: 'Risk ve fırsatları belirleme', summary: 'İSG risklerinin ve fırsatlarının sistemsel değerlendirmesi.' },
            { number: '6.1.2', title: 'Tehlike tanımlama', summary: 'Tehlikelerin sürekli ve proaktif olarak tanımlanması.' },
            { number: '6.1.3', title: 'Yasal şartlar', summary: 'Uygulanabilir yasal ve diğer şartların belirlenmesi.' },
            { number: '8.1.2', title: 'Tehlikelerin ortadan kaldırılması', summary: 'Tehlikelerin elimine edilmesi ve İSG kontrollerinin hiyerarşisi.' },
            { number: '8.2', title: 'Acil durum hazırlığı', summary: 'Acil durum planlaması ve müdahale.' },
            { number: '9.1', title: 'İzleme ve ölçme', summary: 'İSG performansının izlenmesi, ölçülmesi ve değerlendirilmesi.' },
            { number: '9.1.2', title: 'Uygunluk değerlendirmesi', summary: 'Yasal ve diğer şartlara uygunluğun değerlendirilmesi.' },
            { number: '10.2', title: 'Olay, uygunsuzluk ve düzeltici faaliyet', summary: 'Olayların araştırılması ve düzeltici faaliyetlerin yapılması.' },
            { number: '10.3', title: 'Sürekli iyileştirme', summary: 'İSG yönetim sisteminin sürekli iyileştirilmesi.' }
        ]
    }
];

// Get relevant regulations for a hazard category
export function getRegulationsForCategory(categoryId) {
    const categoryRegMap = {
        'fod': ['6331', 'ISO45001'],
        'hangar': ['6331', 'ISE', 'YAN', 'ISO45001'],
        'apron': ['6331', 'KKD', 'ISO45001'],
        'atolye': ['6331', 'ISE', 'KKD', 'KIM', 'ISO45001'],
        'depo': ['6331', 'KIM', 'YAN', 'ISO45001'],
        'kimyasal': ['6331', 'KIM', 'KKD', 'ISO45001'],
        'elektrik': ['6331', 'ISE', 'ISO45001'],
        'yuksekte': ['6331', 'YUK', 'KKD', 'ISO45001'],
        'ergonomi': ['6331', 'ISO45001'],
        'gurultu': ['6331', 'GUR', 'KKD', 'ISO45001'],
        'yangin': ['6331', 'YAN', 'ISO45001'],
        'kkd': ['6331', 'KKD', 'ISO45001'],
        'trafik': ['6331', 'ISO45001'],
        'dusme': ['6331', 'YUK', 'KKD', 'ISO45001'],
        'psikososyal': ['6331', 'ISO45001'],
        'biyolojik': ['6331', 'KKD', 'ISO45001'],
        'diger': ['6331', 'ISO45001']
    };

    const codes = categoryRegMap[categoryId] || ['6331', 'ISO45001'];
    return REGULATIONS.filter(r => codes.includes(r.code));
}

// Search regulations by keyword
export function searchRegulations(query) {
    const q = query.toLowerCase();
    const results = [];
    REGULATIONS.forEach(reg => {
        reg.articles.forEach(art => {
            if (
                art.title.toLowerCase().includes(q) ||
                art.summary.toLowerCase().includes(q) ||
                reg.title.toLowerCase().includes(q)
            ) {
                results.push({ ...art, regulationCode: reg.code, regulationTitle: reg.title });
            }
        });
    });
    return results;
}
