/**
 * Root Cause Agent - ISG Saha Gözlem Sistemi
 * ISO 45001 uyumlu kural tabanlı kök neden analiz ajanı.
 */

const ROOT_CAUSE_RULES = [
    {
        keywords: ['yüksek', 'merdiven', 'iskele', 'düşme', 'boşluk'],
        category: 'Fiziksel Faktörler',
        suggestion: 'Yüksekten düşmeye karşı koruma yetersizliği veya ekipman hatası.',
        rootCause: 'Güvensiz çalışma alanı tasarımı / Korkuluk eksikliği'
    },
    {
        keywords: ['elektrik', 'kablo', 'priz', 'şalter', 'akım', 'çarpılma'],
        category: 'Teknik Faktörler',
        suggestion: 'Elektriksel izolasyon eksikliği veya yetkisiz müdahale.',
        rootCause: 'LOTO (Kilitleme/Etiketleme) prosedürüne uyulmaması'
    },
    {
        keywords: ['maske', 'eldiven', 'kask', 'gözlük', 'kkd', 'donanım'],
        category: 'Bireysel Faktörler',
        suggestion: 'Kişisel koruyucu donanım kullanılmaması veya yetersizliği.',
        rootCause: 'KKD denetim eksikliği veya personel ihmali'
    },
    {
        keywords: ['eğitim', 'bilgi', 'tecrübe', 'acemi', 'talimat'],
        category: 'Yönetimsel Faktörler',
        suggestion: 'Personelin işe yönelik yeterli eğitim almamış olması.',
        rootCause: 'Eğitim ve yetkinlik yönetimindeki boşluklar'
    },
    {
        keywords: ['hız', 'acele', 'yetiştirme', 'stres', 'yorgun'],
        category: 'Organizasyonel Faktörler',
        suggestion: 'Zaman baskısı nedeniyle güvenlik kurallarının ihlali.',
        rootCause: 'Yetersiz planlama ve iş yükü yönetimi'
    },
    {
        keywords: ['bakım', 'onarım', 'arıza', 'yağ', 'sızdırma'],
        category: 'Ekipman Faktörleri',
        suggestion: 'Ekipmanın düzenli bakımının yapılmamış olması.',
        rootCause: 'Önleyici bakım programındaki aksamalar'
    }
];

/**
 * Olay açıklamasını analiz ederek olası kök nedenleri döner.
 * @param {string} description 
 * @returns {Array} Suggestions
 */
export function analyzeRootCause(description) {
    if (!description || description.length < 5) return [];

    const text = description.toLowerCase();
    const suggestions = [];

    ROOT_CAUSE_RULES.forEach(rule => {
        const matches = rule.keywords.filter(keyword => text.includes(keyword));
        if (matches.length > 0) {
            suggestions.push({
                ...rule,
                matchCount: matches.length,
                matchedKeywords: matches
            });
        }
    });

    // En çok eşleşen kuralları başa getir
    return suggestions.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * 5 Neden (5 Why) analizi için taslak oluşturur.
 * @param {Object} analysisResult 
 * @returns {Array} Draft questions
 */
export function generate5WhyDraft(analysisResult) {
    if (!analysisResult) return [];

    return [
        `Neden ${analysisResult.suggestion.toLowerCase()}?`,
        'Bu durumun oluşmasına neden olan teknik/insani sebep neydi?',
        'Neden bu sebep daha önceden fark edilmedi?',
        'Kontrol mekanizması (denetim/bakım) neden başarısız oldu?',
        'Kök neden: Standart veya sistemdeki eksiklik nedir?'
    ];
}
