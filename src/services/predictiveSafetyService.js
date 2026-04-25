import db from '../database/db';

/**
 * Predictive Safety Service
 * ISO 45001 - 6.1.2 Risk Değerlendirmesi ve Tahminleme
 */

export async function getPredictiveRiskData() {
    const observations = await db.observations.toArray();
    const hazards = await db.hazards.toArray();
    const incidents = await db.incidents.toArray();

    // 1. Kategorilere Göre Veri Gruplama
    const categoryAnalysis = {};
    const areaAnalysis = {};

    // Gözlemleri İşle
    observations.forEach(obs => {
        const cat = obs.category || 'Diğer';
        const area = obs.area || 'Genel';

        if (!categoryAnalysis[cat]) {
            categoryAnalysis[cat] = { count: 0, severitySum: 0, hazardScores: [], lastObsDate: null };
        }
        if (!areaAnalysis[area]) {
            areaAnalysis[area] = { count: 0, severitySum: 0, hazardScores: [], lastObsDate: null };
        }

        categoryAnalysis[cat].count++;
        categoryAnalysis[cat].severitySum += (obs.severity || 1);
        
        areaAnalysis[area].count++;
        areaAnalysis[area].severitySum += (obs.severity || 1);

        // Tarih kontrolü
        if (!categoryAnalysis[cat].lastObsDate || obs.createdAt > categoryAnalysis[cat].lastObsDate) {
            categoryAnalysis[cat].lastObsDate = obs.createdAt;
        }
        if (!areaAnalysis[area].lastObsDate || obs.createdAt > areaAnalysis[area].lastObsDate) {
            areaAnalysis[area].lastObsDate = obs.createdAt;
        }
    });

    // Tehlike Skorlarını Eşleştir
    hazards.forEach(h => {
        const obs = observations.find(o => o.id === h.observationId);
        if (obs) {
            if (categoryAnalysis[obs.category]) categoryAnalysis[obs.category].hazardScores.push(h.riskScore);
            if (areaAnalysis[obs.area]) areaAnalysis[obs.area].hazardScores.push(h.riskScore);
        }
    });

    // Kazaları (Incidents) Eşleştir - Tahminleme için en yüksek ağırlık
    incidents.forEach(inc => {
        const area = inc.location || 'Genel'; // Incidents tablosunda 'location' kullanılmış
        if (areaAnalysis[area]) {
            areaAnalysis[area].hasIncident = true;
            areaAnalysis[area].incidentCount = (areaAnalysis[area].incidentCount || 0) + 1;
        }
    });

    // 2. Tahminleme Algoritması (Weighted Risk Score)
    const calculatePredictiveScore = (data) => {
        const freqWeight = data.count * 2; // Gözlem sıklığı
        const severityAvg = data.count > 0 ? (data.severitySum / data.count) * 10 : 0; // Ortalama şiddet
        const hazardAvg = data.hazardScores.length > 0 
            ? (data.hazardScores.reduce((a, b) => a + b, 0) / data.hazardScores.length) / 5
            : 0; // Fine-Kinney etkisi
        const incidentImpact = data.incidentCount ? data.incidentCount * 50 : 0; // Geçmiş kazalar en büyük uyarıcı

        // Recency (Yakınlık) Etkisi: Son 30 gün içindeyse skoru %20 artır
        let recencyMultiplier = 1;
        if (data.lastObsDate) {
            const daysSince = (new Date() - new Date(data.lastObsDate)) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) recencyMultiplier = 1.2;
        }

        return Math.round((freqWeight + severityAvg + hazardAvg + incidentImpact) * recencyMultiplier);
    };

    const results = {
        categories: Object.entries(categoryAnalysis).map(([name, data]) => ({
            name,
            score: calculatePredictiveScore(data),
            count: data.count,
            trend: data.count > 5 ? 'increasing' : 'stable'
        })).sort((a, b) => b.score - a.score),

        areas: Object.entries(areaAnalysis).map(([name, data]) => ({
            name,
            score: calculatePredictiveScore(data),
            count: data.count,
            hasIncident: !!data.hasIncident
        })).sort((a, b) => b.score - a.score)
    };

    return results;
}

export function getRiskLevelFromScore(score) {
    if (score > 150) return { label: 'Kritik Risk', color: '#dc2626', icon: '🚨' };
    if (score > 100) return { label: 'Yüksek Risk', color: '#ea580c', icon: '⚠️' };
    if (score > 50) return { label: 'Orta Risk', color: '#ca8a04', icon: '🔔' };
    return { label: 'Düşük Risk', color: '#16a34a', icon: '✅' };
}
