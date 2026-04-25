import db from '../../database/db';

/**
 * Coach Agent (Eğitmen Ajanı)
 * Görevi: Personel yetkinliğini ve eğitim süreçlerini yönetmek.
 * ISO 45001 - 7.2 Yetkinlik ve 7.3 Farkındalık
 */
export class CoachAgent {
    constructor() {
        this.name = "Coach Agent";
    }

    /**
     * Personel bazlı eğitim durumunu analiz eder
     */
    async analyzeCompetency(employeeId) {
        const employee = await db.employees.get(employeeId);
        if (!employee) return null;

        const records = await db.trainingRecords.where('participantName').equals(employee.name).toArray();
        const ppeAssignments = await db.ppeAssignments.where('employeeId').equals(employeeId).toArray();

        const missingPpe = await this._checkPpeGaps(employee, ppeAssignments);
        const expiredTrainings = records.filter(r => r.status === 'expired');

        return {
            employeeName: employee.name,
            competencyScore: this._calculateScore(records, ppeAssignments),
            missingPpe,
            expiredTrainings,
            recommendation: this._generateRecommendation(missingPpe, expiredTrainings)
        };
    }

    /**
     * Toolbox eğitim konuları önerir
     */
    async suggestToolboxTopics(area) {
        // Bölgedeki son gözlemleri al
        const obs = await db.observations.where('area').equals(area).limit(5).toArray();
        const categories = obs.map(o => o.category);
        
        const suggestions = {
            'yuksekte': 'Yüksekte Çalışma ve Yaşam Hatları Kullanımı',
            'elektrik': 'LOTO (Etiketleme Kilitleme) ve Elektriksel Güvenlik',
            'kkd': 'Kişisel Koruyucu Donanımların Doğru Kullanımı ve Bakımı',
            'yangin': 'Acil Durum Müdahale ve Yangın Söndürücü Kullanımı'
        };

        const topCategory = this._getMostFrequent(categories);
        return suggestions[topCategory] || 'Genel İSG Farkındalık ve Saha Güvenliği';
    }

    _calculateScore(trainings, ppe) {
        let score = 70; // Base score
        score += (trainings.length * 5);
        score -= (ppe.filter(p => p.status !== 'active').length * 10);
        return Math.min(Math.max(score, 0), 100);
    }

    _checkPpeGaps(employee, assignments) {
        const required = ['baret', 'yelek', 'ayakkabi'];
        const assigned = assignments.map(a => a.ppeTypeId); // Basitleştirilmiş kontrol
        // Gerçekte ppeTypes tablosuyla eşleşmeli
        return required.filter(r => !assigned.includes(r));
    }

    _generateRecommendation(ppe, trainings) {
        if (ppe.length > 0) return "Personelin KKD eksikleri acilen tamamlanmalıdır.";
        if (trainings.length > 0) return "Personelin süresi dolan eğitimleri yenilenmelidir.";
        return "Personel yetkinliği uygun seviyededir.";
    }

    _getMostFrequent(arr) {
        return arr.sort((a,b) =>
              arr.filter(v => v===a).length
            - arr.filter(v => v===b).length
        ).pop();
    }
}

export const coachAgent = new CoachAgent();
