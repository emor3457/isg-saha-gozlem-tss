/**
 * ISG Fotoğraf Analiz Servisi — API'siz Client-Side Analiz
 * 
 * Canvas API, piksel analizi, renk tespiti, parlaklık/kontrast/bulanıklık
 * hesaplama ve kural tabanlı tehlike tespiti yapan istemci tarafı motor.
 */

// ═══════════════════════════════════════════════════
// 1. YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function classifyPixel(r, g, b) {
    const { h, s, l } = rgbToHsl(r, g, b);
    if (s < 10) {
        if (l > 85) return 'white';
        if (l < 15) return 'black';
        return 'gray';
    }
    if ((h < 15 || h > 345) && s > 50) return 'red';
    if (h >= 15 && h < 45 && s > 50) return 'orange';
    if (h >= 45 && h < 65 && s > 50) return 'yellow';
    if (h >= 90 && h < 150 && s > 30) return 'green';
    if (h >= 200 && h < 250 && s > 30) return 'blue';
    return 'other';
}

function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function loadImageToCanvas(dataUrl, maxSize = 600) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxSize || h > maxSize) {
                const ratio = Math.min(maxSize / w, maxSize / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve({ imageData: ctx.getImageData(0, 0, w, h), width: w, height: h, canvas, ctx });
        };
        img.onerror = () => reject(new Error('Görüntü yüklenemedi'));
        img.src = dataUrl;
    });
}

// ═══════════════════════════════════════════════════
// 2. ANALİZ FONKSİYONLARI
// ═══════════════════════════════════════════════════

function extractDominantColors(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const colorCounts = {};
    const safetyColorCounts = { red: 0, orange: 0, yellow: 0, green: 0, blue: 0 };
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));
    let sampledCount = 0;

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const color = classifyPixel(data[i], data[i + 1], data[i + 2]);
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        if (safetyColorCounts.hasOwnProperty(color)) safetyColorCounts[color]++;
        sampledCount++;
    }

    const colorPercentages = {};
    for (const [color, count] of Object.entries(colorCounts)) colorPercentages[color] = count / sampledCount;
    const safetyColorPercentages = {};
    for (const [color, count] of Object.entries(safetyColorCounts)) safetyColorPercentages[color] = count / sampledCount;
    const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    return { colorCounts, colorPercentages, dominantColor, safetyColors: safetyColorPercentages, totalSampled: sampledCount };
}

function calculateBrightness(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    let sum = 0, min = 255, max = 0;
    const distribution = { veryDark: 0, dark: 0, normal: 0, bright: 0, veryBright: 0 };
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));
    let count = 0;

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
        sum += lum;
        if (lum < min) min = lum;
        if (lum > max) max = lum;
        if (lum < 30) distribution.veryDark++;
        else if (lum < 80) distribution.dark++;
        else if (lum < 180) distribution.normal++;
        else if (lum < 220) distribution.bright++;
        else distribution.veryBright++;
        count++;
    }

    const average = sum / count;
    for (const key of Object.keys(distribution)) distribution[key] = distribution[key] / count;

    let level, warning;
    if (average < 30) { level = 'critical'; warning = '🔴 KRİTİK: Çok karanlık ortam'; }
    else if (average < 80) { level = 'low'; warning = '🟠 Yetersiz aydınlatma'; }
    else if (average < 180) { level = 'normal'; warning = null; }
    else if (average < 220) { level = 'bright'; warning = null; }
    else { level = 'excessive'; warning = '🟡 Aşırı parlak — göz kamaşması riski'; }

    return { average, min, max, distribution, level, warning };
}

function calculateContrast(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));
    let sum = 0, count = 0;
    const values = [];

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
        values.push(lum);
        sum += lum;
        count++;
    }

    const mean = sum / count;
    let varianceSum = 0;
    for (const v of values) varianceSum += (v - mean) * (v - mean);
    const stdDev = Math.sqrt(varianceSum / count);

    let level, warning;
    if (stdDev < 20) { level = 'very-low'; warning = '🟠 Çok düşük kontrast — sis/duman olasılığı'; }
    else if (stdDev < 35) { level = 'low'; warning = '🟡 Düşük kontrast'; }
    else if (stdDev < 70) { level = 'normal'; warning = null; }
    else { level = 'high'; warning = '🟡 Yüksek kontrast — göz yorgunluğu riski'; }

    return { standardDeviation: stdDev, level, warning };
}

function detectBlurriness(imageData, width, height) {
    const data = imageData.data;
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    let laplacianSum = 0, laplacianCount = 0;
    const laplacianValues = [];
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = y * width + x;
            const lap = -gray[idx - width] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + width];
            laplacianValues.push(lap);
            laplacianSum += lap;
            laplacianCount++;
        }
    }

    const mean = laplacianSum / laplacianCount;
    let varianceSum = 0;
    for (const v of laplacianValues) varianceSum += (v - mean) * (v - mean);
    const score = Math.min(1000, varianceSum / laplacianCount);

    let level, warning;
    if (score < 50) { level = 'very-blurry'; warning = '🔴 Çok bulanık görüntü'; }
    else if (score < 100) { level = 'blurry'; warning = '🟠 Bulanık görüntü'; }
    else if (score < 300) { level = 'normal'; warning = null; }
    else { level = 'sharp'; warning = null; }

    return { score, level, warning };
}

function calculateSaturation(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));
    let sum = 0, count = 0;

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const { s } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        sum += s;
        count++;
    }

    const average = sum / count;
    let level, warning;
    if (average < 15) { level = 'very-low'; warning = '🟠 Çok düşük doygunluk — sis/duman'; }
    else if (average < 30) { level = 'low'; warning = '🟡 Düşük doygunluk'; }
    else if (average < 60) { level = 'normal'; warning = null; }
    else { level = 'high'; warning = null; }

    return { average, level, warning };
}

function generateHeatmap(imageData, width, height) {
    const data = imageData.data;
    const gridRows = 4, gridCols = 4;
    const cellW = Math.floor(width / gridCols);
    const cellH = Math.floor(height / gridRows);
    const grid = [];
    const hotspots = [];
    const labels = ['Üst-Sol', 'Üst', 'Üst', 'Üst-Sağ', 'Orta-Sol', 'Orta', 'Orta', 'Orta-Sağ', 'Alt-Orta-Sol', 'Alt-Orta', 'Alt-Orta', 'Alt-Orta-Sağ', 'Alt-Sol', 'Alt', 'Alt', 'Alt-Sağ'];

    for (let row = 0; row < gridRows; row++) {
        const gridRow = [];
        for (let col = 0; col < gridCols; col++) {
            const startX = col * cellW, startY = row * cellH;
            const endX = Math.min(startX + cellW, width), endY = Math.min(startY + cellH, height);
            let lumSum = 0, pixCount = 0;
            const lumValues = [];
            const colorCounts = {};

            for (let y = startY; y < endY; y += 3) {
                for (let x = startX; x < endX; x += 3) {
                    const idx = (y * width + x) * 4;
                    const lum = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
                    lumSum += lum;
                    lumValues.push(lum);
                    const color = classifyPixel(data[idx], data[idx + 1], data[idx + 2]);
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                    pixCount++;
                }
            }

            const brightness = lumSum / pixCount;
            let varSum = 0;
            for (const v of lumValues) varSum += (v - brightness) * (v - brightness);
            const contrast = Math.sqrt(varSum / pixCount);
            const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

            let cellRisk = 0;
            if (brightness < 50) cellRisk += 30;
            else if (brightness < 80) cellRisk += 15;
            if (contrast < 20) cellRisk += 20;
            if ((colorCounts['red'] || 0) / pixCount > 0.15) cellRisk += 20;
            if ((colorCounts['orange'] || 0) / pixCount > 0.15) cellRisk += 15;

            const cellData = { row, col, brightness, contrast, dominantColor, riskScore: cellRisk, position: row < 2 ? 'upper' : 'lower', label: labels[row * 4 + col] };
            gridRow.push(cellData);

            if (cellRisk >= 30) {
                hotspots.push({ ...cellData, x: startX, y: startY, w: cellW, h: cellH, severity: cellRisk >= 50 ? 'high' : 'medium' });
            }
        }
        grid.push(gridRow);
    }
    return { grid, hotspots };
}

function detectEdges(imageData, width, height) {
    const data = imageData.data;
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    let edgeSum = 0, edgeCount = 0;
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const gx = -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
            const gy = -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
            edgeSum += Math.sqrt(gx * gx + gy * gy);
            edgeCount++;
        }
    }

    const density = Math.min(1, (edgeSum / edgeCount) / 200);
    let level, warning;
    if (density < 0.1) { level = 'very-low'; warning = null; }
    else if (density < 0.3) { level = 'low'; warning = null; }
    else if (density < 0.6) { level = 'medium'; warning = null; }
    else { level = 'high'; warning = '🟡 Karmaşık ortam'; }

    return { density, level, warning };
}

function extractMetadata(dataUrl) {
    const result = { dateTime: null, isNightShot: false, timeWarning: null };
    try {
        const base64 = dataUrl.split(',')[1];
        if (!base64) return result;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return result;

        let offset = 2;
        while (offset < bytes.length - 4) {
            if (bytes[offset] === 0xFF && bytes[offset + 1] === 0xE1) {
                const exifStart = offset + 4;
                if (String.fromCharCode(...bytes.slice(exifStart, exifStart + 4)) !== 'Exif') break;
                const tiffStart = exifStart + 6;
                const isLE = bytes[tiffStart] === 0x49;
                const r16 = (o) => isLE ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1];
                const r32 = (o) => isLE ? bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24) : (bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3];
                const ifdOff = r32(tiffStart + 4) + tiffStart;
                const numEntries = r16(ifdOff);
                for (let i = 0; i < Math.min(numEntries, 50); i++) {
                    const eOff = ifdOff + 2 + i * 12;
                    if (r16(eOff) === 0x0132) {
                        const vOff = r32(eOff + 8) + tiffStart;
                        let ds = '';
                        for (let j = 0; j < 19; j++) ds += String.fromCharCode(bytes[vOff + j]);
                        const d = new Date(ds.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
                        if (!isNaN(d.getTime())) result.dateTime = d;
                    }
                }
                break;
            }
            const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
            offset += 2 + segLen;
        }
    } catch { /* EXIF parse failed */ }

    if (result.dateTime) {
        const hour = result.dateTime.getHours();
        if (hour >= 22 || hour < 6) {
            result.isNightShot = true;
            result.timeWarning = '🌙 Gece vardiyası — ekstra aydınlatma kontrolü';
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════
// 3. KURAL MOTORU
// ═══════════════════════════════════════════════════

function applyGeneralRules(analysis) {
    const findings = [];
    const { brightness, contrast, blurriness, saturation, colors, edges } = analysis;

    if (brightness.average < 30) findings.push({ icon: '🔴', message: 'KRİTİK: Çok karanlık ortam', risk: 30, type: 'brightness' });
    else if (brightness.average < 80) findings.push({ icon: '🟠', message: 'Yetersiz aydınlatma', risk: 20, type: 'brightness' });
    else if (brightness.average > 220) findings.push({ icon: '🟡', message: 'Aşırı parlaklık — göz kamaşması', risk: 10, type: 'brightness' });

    if (contrast.standardDeviation < 20) findings.push({ icon: '🟠', message: 'Çok düşük kontrast — sis/duman olasılığı', risk: 25, type: 'contrast' });
    else if (contrast.standardDeviation < 35) findings.push({ icon: '🟡', message: 'Düşük kontrast', risk: 10, type: 'contrast' });

    if (blurriness.score < 50) findings.push({ icon: '🟠', message: 'Çok bulanık görüntü', risk: 15, type: 'blur' });
    else if (blurriness.score < 100) findings.push({ icon: '🟡', message: 'Bulanık görüntü', risk: 10, type: 'blur' });

    if (saturation.average < 15) findings.push({ icon: '🟠', message: 'Çok düşük doygunluk — sis/duman/toz', risk: 20, type: 'saturation' });

    if (colors.safetyColors.red > 0.3 && colors.safetyColors.orange > 0.15) findings.push({ icon: '🔴', message: 'Yoğun uyarı renkleri — acil tehlike olasılığı', risk: 30, type: 'color' });
    else if (colors.safetyColors.red > 0.2) findings.push({ icon: '🟠', message: 'Kırmızı yoğunluk — tehlike işareti olabilir', risk: 15, type: 'color' });

    if (edges.density > 0.7) findings.push({ icon: '🟡', message: 'Karmaşık/kalabalık ortam', risk: 10, type: 'edges' });

    return findings;
}

const CATEGORY_RULES = {
    fod: (a) => {
        const f = [];
        if (a.brightness.average < 80) f.push({ icon: '⚠️', message: 'Yetersiz aydınlatma — FOD tespiti zorlaşır', risk: 20, type: 'fod' });
        if (a.edges.density > 0.7) f.push({ icon: '⚠️', message: 'Karmaşık zemin — FOD riski artıyor', risk: 25, type: 'fod' });
        if (a.contrast.standardDeviation < 30) f.push({ icon: '⚠️', message: 'Düşük kontrast — küçük parçalar görülemez', risk: 15, type: 'fod' });
        return f;
    },
    hangar: (a) => {
        const f = [];
        if (a.brightness.average < 80) f.push({ icon: '⚠️', message: 'Hangar aydınlatması yetersiz (min. 500 lux)', risk: 25, type: 'hangar' });
        if (a.brightness.average > 220) f.push({ icon: '💡', message: 'Parlama riski', risk: 10, type: 'hangar' });
        if (a.colors.safetyColors.yellow > 0.2) f.push({ icon: '🟡', message: 'Uyarı bantları/işaretleri tespit edildi', risk: 5, type: 'hangar' });
        if (a.blurriness.score < 100) f.push({ icon: '🌫️', message: 'Ortamda toz/duman olabilir', risk: 20, type: 'hangar' });
        return f;
    },
    kimyasal: (a) => {
        const f = [];
        if (a.saturation.average < 20) f.push({ icon: '☁️', message: 'Olası buhar/gaz salınımı', risk: 25, type: 'chemical' });
        if (a.contrast.standardDeviation < 30) f.push({ icon: '🌫️', message: 'Kimyasal buhar olasılığı', risk: 30, type: 'chemical' });
        if (a.colors.safetyColors.yellow > 0.25) f.push({ icon: '⚠️', message: 'Kimyasal uyarı işaretleri', risk: 10, type: 'chemical' });
        return f;
    },
    yuksekte: (a) => {
        const f = [];
        if (a.brightness.average < 60) f.push({ icon: '🔴', message: 'Yetersiz aydınlatma — düşme riski', risk: 30, type: 'height' });
        if (a.blurriness.score < 80) f.push({ icon: '⚠️', message: 'Bulanık — yükseklik kontrolü güç', risk: 20, type: 'height' });
        if (a.heatmap) {
            const top = a.heatmap.grid[0].reduce((s, c) => s + c.brightness, 0) / 4;
            const bot = a.heatmap.grid[3].reduce((s, c) => s + c.brightness, 0) / 4;
            if (top < bot * 0.7) f.push({ icon: '💡', message: 'Üst bölge karanlık — tavan aydınlatması yetersiz', risk: 15, type: 'height' });
        }
        return f;
    },
    elektrik: (a) => {
        const f = [];
        if (a.colors.safetyColors.yellow > 0.15) f.push({ icon: '⚡', message: 'Elektrik uyarı işaretleri', risk: 10, type: 'electrical' });
        if (a.brightness.average > 230) f.push({ icon: '⚡', message: 'Olası kıvılcım/ark', risk: 25, type: 'electrical' });
        return f;
    },
    yangin: (a) => {
        const f = [];
        if (a.colors.safetyColors.red > 0.3) f.push({ icon: '🔥', message: 'Yangın ekipmanı veya alev olabilir', risk: 25, type: 'fire' });
        if (a.colors.safetyColors.orange > 0.2) f.push({ icon: '🔥', message: 'Olası alev/ısı kaynağı', risk: 30, type: 'fire' });
        if (a.brightness.average > 240) f.push({ icon: '💥', message: 'Olası ateş/patlama', risk: 35, type: 'fire' });
        return f;
    },
    kkd: (a) => {
        const f = [];
        if (a.colors.safetyColors.blue > 0.2) f.push({ icon: 'ℹ️', message: 'Zorunluluk işaretleri tespit edildi', risk: 5, type: 'ppe' });
        if (a.colors.safetyColors.yellow > 0.15) f.push({ icon: '⚠️', message: 'KKD uyarı alanı', risk: 10, type: 'ppe' });
        return f;
    },
    dusme: (a) => {
        const f = [];
        if (a.heatmap) {
            const bot = a.heatmap.grid[3];
            const avgB = bot.reduce((s, c) => s + c.brightness, 0) / bot.length;
            if (avgB < 60) f.push({ icon: '⚠️', message: 'Zemin görünürlüğü düşük — kayma riski', risk: 25, type: 'slip' });
        }
        if (a.blurriness.score < 80) f.push({ icon: '💧', message: 'Islak/yağlı zemin olasılığı', risk: 15, type: 'slip' });
        return f;
    },
    ergonomi: (a) => {
        const f = [];
        if (a.brightness.average < 100) f.push({ icon: '👁️', message: 'Düşük aydınlatma — göz yorgunluğu', risk: 15, type: 'ergonomic' });
        if (a.contrast.standardDeviation > 80) f.push({ icon: '👁️', message: 'Aşırı kontrast — göz yorgunluğu', risk: 10, type: 'ergonomic' });
        return f;
    },
    gurultu: (a) => {
        const f = [];
        if (a.colors.safetyColors.yellow > 0.15) f.push({ icon: '🔊', message: 'Uyarı işaretleri — gürültülü alan', risk: 10, type: 'noise' });
        return f;
    },
    apron: (a) => {
        const f = [];
        if (a.brightness.average > 220) f.push({ icon: '☀️', message: 'Güneş parlama riski', risk: 10, type: 'apron' });
        if (a.edges.density > 0.6) f.push({ icon: '✈️', message: 'Yoğun hareketlilik — trafik riski', risk: 15, type: 'apron' });
        return f;
    }
};

function generateRecommendations(findings, riskLevel) {
    const recs = new Set();
    for (const f of findings) {
        switch (f.type) {
            case 'brightness': recs.add('Aydınlatma seviyesini ölçün ve iyileştirin'); break;
            case 'contrast': recs.add('Havalandırma/aspirasyon kontrolü yapın'); break;
            case 'blur': recs.add('Çalışma alanı görünürlüğünü artırın'); break;
            case 'saturation': recs.add('Kimyasal buhar ölçümü yaptırın'); break;
            case 'color': recs.add('Uyarı işaretlerini kontrol edin'); break;
            case 'fod': recs.add('FOD walk-down programı uygulayın'); break;
            case 'chemical': recs.add('MSDS/SDS dosyalarını kontrol edin'); recs.add('Uygun KKD sağlayın'); break;
            case 'height': recs.add('Emniyet kemeri/yaşam hattı kontrolü yapın'); break;
            case 'fire': recs.add('Yangın ekipmanlarını kontrol edin'); break;
            case 'slip': recs.add('Zemin temizliği ve kaymaz kaplama uygulayın'); break;
            case 'metadata': recs.add('Gece vardiyası aydınlatma kontrolü yapın'); break;
        }
    }
    if (riskLevel === 'critical') { recs.add('🚨 ACİL: İşi durdurun!'); recs.add('🚨 Yönetimi derhal bilgilendirin'); }
    else if (riskLevel === 'high') { recs.add('⚠️ Derhal geçici tedbirler alın'); }
    return [...recs];
}

// ═══════════════════════════════════════════════════
// 4. ANA FONKSİYONLAR (EXPORT)
// ═══════════════════════════════════════════════════

export async function analyzePhoto(dataUrl) {
    const { imageData, width, height } = await loadImageToCanvas(dataUrl, 600);

    const colors = extractDominantColors(imageData);
    const brightness = calculateBrightness(imageData);
    const contrast = calculateContrast(imageData);
    const blurriness = detectBlurriness(imageData, width, height);
    const saturation = calculateSaturation(imageData);
    const edges = detectEdges(imageData, width, height);
    const heatmap = generateHeatmap(imageData, width, height);
    const metadata = extractMetadata(dataUrl);

    return { colors, brightness, contrast, blurriness, saturation, edges, heatmap, metadata, imageSize: { width, height }, analyzedAt: new Date().toISOString() };
}

export function generateRiskReport(analysis, categoryId = 'diger', area = '') {
    const generalFindings = applyGeneralRules(analysis);
    const categoryRuleFn = CATEGORY_RULES[categoryId];
    const categoryFindings = categoryRuleFn ? categoryRuleFn(analysis) : [];
    const metadataFindings = [];
    if (analysis.metadata.isNightShot) metadataFindings.push({ icon: '🌙', message: 'Gece vardiyası — ekstra aydınlatma kontrolü', risk: 10, type: 'metadata' });

    const allFindings = [...generalFindings, ...categoryFindings, ...metadataFindings];
    const seenTypes = new Set();
    const findings = allFindings.filter(f => {
        const key = `${f.type}-${f.message.substring(0, 30)}`;
        if (seenTypes.has(key)) return false;
        seenTypes.add(key);
        return true;
    });

    const totalRisk = findings.reduce((s, f) => s + f.risk, 0);
    let riskLevel, riskLabel, riskColor;
    if (totalRisk <= 20) { riskLevel = 'low'; riskLabel = 'Düşük Risk'; riskColor = '#22C55E'; }
    else if (totalRisk <= 50) { riskLevel = 'medium'; riskLabel = 'Orta Risk'; riskColor = '#EAB308'; }
    else if (totalRisk <= 80) { riskLevel = 'high'; riskLabel = 'Yüksek Risk'; riskColor = '#F97316'; }
    else { riskLevel = 'critical'; riskLabel = 'Kritik Risk'; riskColor = '#DC2626'; }

    const recommendations = generateRecommendations(findings, riskLevel);

    // Güvenlik renkleri özeti
    const safetyDetected = [];
    if (analysis.colors.safetyColors.red > 0.1) safetyDetected.push('🔴 Kırmızı');
    if (analysis.colors.safetyColors.yellow > 0.1) safetyDetected.push('🟡 Sarı');
    if (analysis.colors.safetyColors.blue > 0.1) safetyDetected.push('🔵 Mavi');
    if (analysis.colors.safetyColors.green > 0.1) safetyDetected.push('🟢 Yeşil');

    return {
        overallRiskScore: totalRisk,
        riskLevel, riskLabel, riskColor,
        findings: findings.sort((a, b) => b.risk - a.risk),
        recommendations,
        safetyDetected,
        hotspotCount: analysis.heatmap.hotspots.length,
        metrics: {
            brightness: Math.round(analysis.brightness.average),
            contrast: Math.round(analysis.contrast.standardDeviation),
            blurriness: Math.round(analysis.blurriness.score),
            saturation: Math.round(analysis.saturation.average),
            edgeDensity: Math.round(analysis.edges.density * 100),
            dominantColor: analysis.colors.dominantColor
        },
        analyzedAt: analysis.analyzedAt,
        category: categoryId,
        area
    };
}

export async function drawHeatmapOverlay(originalDataUrl, heatmapData) {
    const { canvas, ctx, width, height } = await loadImageToCanvas(originalDataUrl, 800);
    const cellW = Math.floor(width / 4), cellH = Math.floor(height / 4);

    for (const hs of heatmapData.hotspots) {
        const x = hs.col * cellW, y = hs.row * cellH;
        const alpha = hs.severity === 'high' ? 0.35 : 0.2;
        const color = hs.severity === 'high' ? '220,38,38' : '249,115,22';
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeStyle = `rgba(${color},0.8)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellW, cellH);
        ctx.fillStyle = `rgba(${color},0.9)`;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`⚠️ ${hs.riskScore}`, x + 5, y + 20);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(width, i * cellH); ctx.stroke();
    }

    return canvas.toDataURL('image/jpeg', 0.85);
}
