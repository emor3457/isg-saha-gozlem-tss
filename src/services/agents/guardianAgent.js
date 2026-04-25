import { detectObjects, generatePPEReport } from '../ppeDetectionService';

/**
 * Guardian Agent (Saha Muhafızı Ajanı)
 * Görevi: Kritik tehlikeleri ve KKD ihlallerini saptamak.
 */
export class GuardianAgent {
    constructor() {
        this.name = "Guardian Agent";
    }

    /**
     * Bir fotoğrafı analiz eder ve KKD raporu oluşturur
     */
    async inspectPhoto(imageDataUrl) {
        console.log(`[${this.name}] Fotoğraf analizi başlatıldı...`);
        try {
            const detections = await detectObjects(imageDataUrl);
            const report = generatePPEReport(detections);
            
            // Kritik ihlal kontrolü
            const criticalViolations = report.checklist.filter(c => !c.detected && ['baret', 'yelek'].includes(c.id));
            
            return {
                ...report,
                isCritical: criticalViolations.length > 0 && report.personCount > 0,
                alertMessage: this._generateAlertMessage(report, criticalViolations)
            };
        } catch (err) {
            console.error(`[${this.name}] Analiz hatası:`, err);
            return null;
        }
    }

    /**
     * Kritik bulguları (Severity 4) anında değerlendirir
     */
    async evaluateObservation(observation) {
        if (observation.severity >= 4) {
            return {
                alert: true,
                message: "⚠️ KRİTİK TEHLİKE! Bu bulgu yüksek risk içermektedir. Acil aksiyon planı ve saha durdurma önerilmektedir.",
                priority: "immediate"
            };
        }
        return null;
    }

    _generateAlertMessage(report, criticalViolations) {
        if (report.personCount === 0) return "Sahada personel tespit edilmedi.";
        if (criticalViolations.length > 0) {
            return `🚨 KRİTİK İHLAL: Sahadaki personelde ${criticalViolations.map(v => v.label).join(', ')} tespit edilemedi!`;
        }
        if (report.complianceRate < 100) {
            return `⚠️ KKD EKSİĞİ: Bazı koruyucu donanımlar eksik (Uyum: %${report.complianceRate}).`;
        }
        return "✅ KKD Uyumu Tam: Tüm gerekli donanımlar tespit edildi.";
    }
}

export const guardianAgent = new GuardianAgent();
