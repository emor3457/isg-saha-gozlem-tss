import { getPredictiveRiskData, getRiskLevelFromScore } from '../predictiveSafetyService';

/**
 * Analyst Agent (Veri Analisti Ajanı)
 * Görevi: Trendleri izlemek ve gelecek riskleri tahmin etmek.
 */
export class AnalystAgent {
    constructor() {
        this.name = "Analyst Agent";
    }

    /**
     * Tüm sistemi tarayarak prediktif risk analizi raporu sunar
     */
    async generateRiskForecast() {
        console.log(`[${this.name}] Risk tahminleme analizi başlatıldı...`);
        const data = await getPredictiveRiskData();
        
        const topCategory = data.categories[0];
        const topArea = data.areas[0];
        
        const riskLevel = getRiskLevelFromScore(topCategory?.score || 0);

        return {
            ...data,
            summary: {
                totalRiskScore: topCategory?.score || 0,
                highestRiskCategory: topCategory?.name || 'Yok',
                highestRiskArea: topArea?.name || 'Yok',
                riskLevel: riskLevel.label,
                riskColor: riskLevel.color,
                riskIcon: riskLevel.icon,
                insight: this._generateInsight(topCategory, topArea)
            }
        };
    }

    _generateInsight(cat, area) {
        if (!cat) return "Tahminleme için henüz yeterli veri birikmedi.";
        
        let insight = `Dikkat: "${cat.name}" kategorisinde risk artış trendi gözlemleniyor. `;
        if (area && area.hasIncident) {
            insight += `Özellikle "${area.name}" bölgesindeki geçmiş kazalar, bu riski kritik seviyeye taşımaktadır.`;
        } else {
            insight += `Önleyici aksiyonların "${area?.name || 'genel'}" bölgesine odaklanması önerilir.`;
        }
        return insight;
    }
}

export const analystAgent = new AnalystAgent();
