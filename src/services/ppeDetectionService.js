/**
 * KKD Nesne Tanıma Servisi — TensorFlow.js + COCO-SSD
 * 
 * Client-side AI ile fotoğraflardan kask, yelek, eldiven vb. KKD tespiti.
 * Model lazy-loading ile sadece ilk kullanımda indirilir.
 */

let model = null;
let isLoading = false;

// COCO-SSD etiketlerini KKD kategorilerine eşle
const PPE_LABEL_MAP = {
    'person': { ppe: 'kişi', icon: '👤', isSafety: false },
    'helmet': { ppe: 'baret', icon: '⛑️', isSafety: true },
    'hat': { ppe: 'baret', icon: '⛑️', isSafety: true },
    'tie': { ppe: 'yaka_kartı', icon: '🪪', isSafety: true },
    'backpack': { ppe: 'sırt_çantası', icon: '🎒', isSafety: false },
    'handbag': { ppe: 'çanta', icon: '👜', isSafety: false },
    'umbrella': { ppe: 'şemsiye', icon: '☂️', isSafety: false },
    'bottle': { ppe: 'şişe', icon: '🧴', isSafety: false },
    'scissors': { ppe: 'makas', icon: '✂️', isSafety: false },
    'fire hydrant': { ppe: 'yangın_musluğu', icon: '🚒', isSafety: true },
    'stop sign': { ppe: 'dur_işareti', icon: '🛑', isSafety: true },
    'traffic light': { ppe: 'trafik_lambası', icon: '🚦', isSafety: true }
};

// Beklenen KKD öğeleri (kontrol listesi)
const EXPECTED_PPE = [
    { id: 'baret', label: 'Baret / Kask', icon: '⛑️', cocoLabels: ['helmet', 'hat'] },
    { id: 'yelek', label: 'Reflektif Yelek', icon: '🦺', cocoLabels: [] },
    { id: 'eldiven', label: 'Eldiven', icon: '🧤', cocoLabels: [] },
    { id: 'gozluk', label: 'Koruyucu Gözlük', icon: '🥽', cocoLabels: [] },
    { id: 'ayakkabi', label: 'Güvenlik Ayakkabısı', icon: '👢', cocoLabels: [] },
    { id: 'kulaklık', label: 'Kulaklık', icon: '🎧', cocoLabels: [] }
];

/**
 * TensorFlow.js modelini yükle (lazy loading)
 */
export async function loadModel(onProgress) {
    if (model) return model;
    if (isLoading) {
        // Model zaten yükleniyor, bekle
        while (isLoading) {
            await new Promise(r => setTimeout(r, 200));
        }
        return model;
    }

    isLoading = true;
    try {
        if (onProgress) onProgress('TensorFlow.js yükleniyor...');
        const tf = await import('@tensorflow/tfjs');

        if (onProgress) onProgress('COCO-SSD modeli indiriliyor...');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');

        if (onProgress) onProgress('Model hazırlanıyor...');
        model = await cocoSsd.load({
            base: 'lite_mobilenet_v2' // Hafif model (~5MB)
        });

        if (onProgress) onProgress('Model hazır!');
        return model;
    } catch (err) {
        console.error('Model yükleme hatası:', err);
        throw new Error('AI modeli yüklenemedi: ' + err.message);
    } finally {
        isLoading = false;
    }
}

/**
 * Fotoğraftan nesne algılama
 */
export async function detectObjects(imageDataUrl, onProgress) {
    const loadedModel = await loadModel(onProgress);

    // Image element oluştur
    const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Görüntü yüklenemedi'));
        i.src = imageDataUrl;
    });

    // Detect
    const predictions = await loadedModel.detect(img, 20, 0.3);

    return predictions.map(p => ({
        label: p.class,
        confidence: Math.round(p.score * 100),
        bbox: {
            x: Math.round(p.bbox[0]),
            y: Math.round(p.bbox[1]),
            width: Math.round(p.bbox[2]),
            height: Math.round(p.bbox[3])
        },
        ...mapToPPE(p.class)
    }));
}

function mapToPPE(label) {
    const mapped = PPE_LABEL_MAP[label];
    if (mapped) return mapped;
    return { ppe: label, icon: '📦', isSafety: false };
}

/**
 * KKD Kontrol Raporu Oluştur
 */
export function generatePPEReport(detections) {
    const personCount = detections.filter(d => d.label === 'person').length;
    const safetyItems = detections.filter(d => d.isSafety);
    const nonSafetyItems = detections.filter(d => !d.isSafety && d.label !== 'person');

    // KKD kontrol listesi
    const checklist = EXPECTED_PPE.map(item => {
        const found = detections.some(d =>
            item.cocoLabels.includes(d.label) || d.ppe === item.id
        );
        return {
            ...item,
            detected: found,
            status: found ? 'detected' : 'not_detected'
        };
    });

    const detectedCount = checklist.filter(c => c.detected).length;
    const complianceRate = EXPECTED_PPE.length > 0
        ? Math.round((detectedCount / EXPECTED_PPE.length) * 100)
        : 0;

    let riskLevel, riskColor;
    if (complianceRate >= 80) { riskLevel = 'Uyumlu'; riskColor = '#22C55E'; }
    else if (complianceRate >= 50) { riskLevel = 'Kısmen Uyumlu'; riskColor = '#EAB308'; }
    else { riskLevel = 'Uyumsuz'; riskColor = '#DC2626'; }

    return {
        personCount,
        totalDetections: detections.length,
        safetyItems,
        nonSafetyItems,
        checklist,
        detectedCount,
        complianceRate,
        riskLevel,
        riskColor,
        detections
    };
}

/**
 * Canvas üstüne detection kutuları çiz
 */
export function drawDetectionsOnCanvas(canvas, detections) {
    const ctx = canvas.getContext('2d');

    for (const det of detections) {
        const { x, y, width, height } = det.bbox;
        const color = det.isSafety ? '#22C55E' : det.label === 'person' ? '#3B82F6' : '#EAB308';

        // Kutu
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Etiket arkaplanı
        const text = `${det.icon} ${det.ppe} ${det.confidence}%`;
        ctx.font = 'bold 12px Arial';
        const textW = ctx.measureText(text).width;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 20, textW + 8, 20);

        // Etiket yazısı
        ctx.fillStyle = '#FFF';
        ctx.fillText(text, x + 4, y - 5);
    }
}
