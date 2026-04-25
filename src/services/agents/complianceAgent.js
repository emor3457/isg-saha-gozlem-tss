import { REGULATIONS } from '../../config/regulations';

/**
 * Compliance Agent (Mevzuat Uzmanı Ajanı)
 * ISO 45001 - 6.1.3 Yasal Şartlar ve Diğer Şartlar
 */

export class ComplianceAgent {
    constructor() {
        this.name = "Compliance Agent";
        this.version = "1.0.0";
    }

    /**
     * Gözlem verisini analiz eder ve en uygun TEK mevzuat maddesini seçer.
     */
    async analyzeObservation(observation) {
        console.log(`[${this.name}] Kesin analiz başlatıldı: #${observation.id}`);
        
        let bestMatch = null;
        let highestScore = -1;

        const description = (observation.description || "").toLowerCase();
        const category = (observation.category || "").toLowerCase();

        REGULATIONS.forEach(reg => {
            const isRegRelevant = this._isRegRelevantToCategory(reg, category);
            
            reg.articles.forEach(art => {
                let matchScore = 0;
                if (isRegRelevant) matchScore += 30;

                const keywords = this._getKeywordsForArticle(art);
                keywords.forEach(kw => {
                    if (description.includes(kw)) matchScore += 50;
                });

                if (matchScore > highestScore) {
                    highestScore = matchScore;
                    bestMatch = {
                        regulationCode: reg.code,
                        regulationTitle: reg.title,
                        articleNumber: art.number,
                        articleTitle: art.title,
                        summary: art.summary,
                        confidence: Math.min(matchScore, 98),
                        reason: this._generateReason(art, category, description)
                    };
                }
            });
        });

        // Sadece skor yeterince yüksekse (örn: > 40) sonuç döndür
        return highestScore > 40 ? bestMatch : null;
    }

    _isRegRelevantToCategory(reg, category) {
        const map = {
            'kkd': ['kkd', '6331'],
            'yuksekte': ['yuk', 'kkd', '6331'],
            'elektrik': ['ise', '6331'],
            'kimyasal': ['kim', 'kkd', '6331'],
            'yangin': ['yan', '6331'],
            'atolye': ['ise', '6331', 'kkd'],
            'gurultu': ['gur', 'kkd']
        };
        return map[category]?.includes(reg.code.toLowerCase()) || reg.code === '6331' || reg.code === 'ISO45001';
    }

    _getKeywordsForArticle(art) {
        const text = (art.title + " " + art.summary).toLowerCase();
        // Basit bir stop-word temizliği ve kelime ayıklama
        return text.split(' ').filter(w => w.length > 3);
    }

    _generateReason(art, category, description) {
        if (description.includes(art.title.toLowerCase().split(' ')[0])) {
            return `Gözlem açıklamasındaki ifadeler doğrudan ${art.title} ile örtüşmektedir.`;
        }
        return `Seçilen ${category} kategorisi ve bulgu içeriği bu yasal yükümlülüğü tetiklemektedir.`;
    }
}

export const complianceAgent = new ComplianceAgent();
