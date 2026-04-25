/**
 * ISG Fotoğraf Analiz Motoru — API'siz Client-Side Analiz
 * 
 * Canvas API, piksel analizi, renk tespiti, parlaklık/kontrast/bulanıklık
 * hesaplama ve kural tabanlı tehlike tespiti yapan istemci tarafı motor.
 * 
 * Kullanım:
 *   import { analyzePhoto, generateRiskReport } from './imageAnalysisEngine';
 *   const analysis = await analyzePhoto(base64DataUrl);
 *   const report = generateRiskReport(analysis, 'hangar', 'Hangar 1');
 */

// ═══════════════════════════════════════════════════
// 1. YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════

/**
 * RGB → HSL dönüşümü (ISO 3864 güvenlik renk analizi için)
 */
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

/**
 * Piksel renk sınıflandırması — ISG güvenlik renk kodları
 */
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
    if (h >= 65 && h < 90 && s > 30) return 'yellow-green';
    if (h >= 90 && h < 150 && s > 30) return 'green';
    if (h >= 150 && h < 200 && s > 30) return 'cyan';
    if (h >= 200 && h < 250 && s > 30) return 'blue';
    if (h >= 250 && h < 310 && s > 30) return 'purple';
    if (h >= 310 && h <= 345 && s > 50) return 'pink';

    return 'other';
}

/**
 * Luminance hesaplama (ITU-R BT.601)
 */
function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Base64 data URL → Canvas ImageData dönüşümü
 */
function loadImageToCanvas(dataUrl, maxSize = 600) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;

            // Performans için boyut küçült
            if (w > maxSize || h > maxSize) {
                const ratio = Math.min(maxSize / w, maxSize / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            resolve({
                imageData: ctx.getImageData(0, 0, w, h),
                width: w,
                height: h,
                canvas,
                ctx
            });
        };
        img.onerror = () => reject(new Error('Görüntü yüklenemedi'));
        img.src = dataUrl;
    });
}


// ═══════════════════════════════════════════════════
// 2. ANALİZ FONKSİYONLARI
// ═══════════════════════════════════════════════════

/**
 * Baskın renk dağılımı analizi
 * @returns {{ colorCounts, colorPercentages, dominantColor, safetyColors }}
 */
export function extractDominantColors(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const colorCounts = {};
    const safetyColorCounts = { red: 0, orange: 0, yellow: 0, green: 0, blue: 0 };

    // Her N pikseli örnekle (performans optimizasyonu)
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));
    let sampledCount = 0;

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const color = classifyPixel(r, g, b);
        colorCounts[color] = (colorCounts[color] || 0) + 1;

        if (safetyColorCounts.hasOwnProperty(color)) {
            safetyColorCounts[color]++;
        }
        sampledCount++;
    }

    // Yüzdelere dönüştür
    const colorPercentages = {};
    for (const [color, count] of Object.entries(colorCounts)) {
        colorPercentages[color] = count / sampledCount;
    }

    const safetyColorPercentages = {};
    for (const [color, count] of Object.entries(safetyColorCounts)) {
        safetyColorPercentages[color] = count / sampledCount;
    }

    // Baskın renk
    const dominantColor = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    return {
        colorCounts,
        colorPercentages,
        dominantColor,
        safetyColors: safetyColorPercentages,
        totalSampled: sampledCount
    };
}

/**
 * Parlaklık analizi — Aydınlatma yeterliliği tespiti
 * @returns {{ average, min, max, distribution, level, warning }}
 */
export function calculateBrightness(imageData) {
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

    // Dağılımı yüzdeye çevir
    for (const key of Object.keys(distribution)) {
        distribution[key] = distribution[key] / count;
    }

    let level, warning;
    if (average < 30) {
        level = 'critical';
        warning = '🔴 KRİTİK: Çok karanlık ortam — iş güvenliği açısından tehlikeli';
    } else if (average < 80) {
        level = 'low';
        warning = '🟠 Yetersiz aydınlatma — minimum standartlar sağlanmalı';
    } else if (average < 180) {
        level = 'normal';
        warning = null;
    } else if (average < 220) {
        level = 'bright';
        warning = null;
    } else {
        level = 'excessive';
        warning = '🟡 Aşırı parlak — göz kamaşması ve parlama riski';
    }

    return { average, min, max, distribution, level, warning };
}

/**
 * Kontrast analizi — Görüş kalitesi ve sis/duman tespiti
 * @returns {{ standardDeviation, level, warning }}
 */
export function calculateContrast(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000));

    // Ortalama luminance
    let sum = 0, count = 0;
    const values = [];

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
        values.push(lum);
        sum += lum;
        count++;
    }

    const mean = sum / count;

    // Standart sapma
    let varianceSum = 0;
    for (const v of values) {
        varianceSum += (v - mean) * (v - mean);
    }
    const stdDev = Math.sqrt(varianceSum / count);

    let level, warning;
    if (stdDev < 20) {
        level = 'very-low';
        warning = '🟠 Çok düşük kontrast — sis, duman veya toz bulutu olasılığı';
    } else if (stdDev < 35) {
        level = 'low';
        warning = '🟡 Düşük kontrast — görünürlük kısmen kısıtlı';
    } else if (stdDev < 70) {
        level = 'normal';
        warning = null;
    } else {
        level = 'high';
        warning = '🟡 Yüksek kontrast farkı — göz yorgunluğu riski';
    }

    return { standardDeviation: stdDev, level, warning };
}

/**
 * Bulanıklık tespiti — Laplacian varyansı
 * Düşük varyans = bulanık görüntü
 * @returns {{ score, level, warning }}
 */
export function detectBlurriness(imageData, width, height) {
    const data = imageData.data;

    // Gri tonlamalı görüntü oluştur
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    // Laplacian filtresi uygula
    let laplacianSum = 0, laplacianCount = 0;
    const laplacianValues = [];

    // Performans için her 2. piksel
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = y * width + x;
            const laplacian =
                -gray[idx - width] - gray[idx - 1] +
                4 * gray[idx] -
                gray[idx + 1] - gray[idx + width];

            laplacianValues.push(laplacian);
            laplacianSum += laplacian;
            laplacianCount++;
        }
    }

    const mean = laplacianSum / laplacianCount;
    let varianceSum = 0;
    for (const v of laplacianValues) {
        varianceSum += (v - mean) * (v - mean);
    }
    const variance = varianceSum / laplacianCount;

    // Skoru normalize et (log scale)
    const score = Math.min(1000, variance);

    let level, warning;
    if (score < 50) {
        level = 'very-blurry';
        warning = '🔴 Çok bulanık görüntü — ortam değerlendirmesi güvenilir değil';
    } else if (score < 100) {
        level = 'blurry';
        warning = '🟠 Bulanık görüntü — görüş mesafesi kısıtlı olabilir';
    } else if (score < 300) {
        level = 'normal';
        warning = null;
    } else {
        level = 'sharp';
        warning = null;
    }

    return { score, level, warning };
}

/**
 * Doygunluk (Saturation) analizi — Sis, duman, gaz tespiti
 * @returns {{ average, level, warning }}
 */
export function calculateSaturation(imageData) {
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
    if (average < 15) {
        level = 'very-low';
        warning = '🟠 Çok düşük doygunluk — sis, duman veya toz olasılığı yüksek';
    } else if (average < 30) {
        level = 'low';
        warning = '🟡 Düşük doygunluk — olası buhar/gaz salınımı';
    } else if (average < 60) {
        level = 'normal';
        warning = null;
    } else {
        level = 'high';
        warning = null;
    }

    return { average, level, warning };
}

/**
 * Bölgesel ısı haritası — 4×4 grid analiz
 * @returns {{ grid: Array<Array<{brightness, contrast, dominantColor, riskScore}>>, hotspots }}
 */
export function generateHeatmap(imageData, width, height) {
    const data = imageData.data;
    const gridRows = 4, gridCols = 4;
    const cellW = Math.floor(width / gridCols);
    const cellH = Math.floor(height / gridRows);

    const grid = [];
    const hotspots = [];

    for (let row = 0; row < gridRows; row++) {
        const gridRow = [];
        for (let col = 0; col < gridCols; col++) {
            const startX = col * cellW;
            const startY = row * cellH;
            const endX = Math.min(startX + cellW, width);
            const endY = Math.min(startY + cellH, height);

            let lumSum = 0, pixCount = 0;
            const lumValues = [];
            const colorCounts = {};

            // Her 3. piksel örnekle
            for (let y = startY; y < endY; y += 3) {
                for (let x = startX; x < endX; x += 3) {
                    const idx = (y * width + x) * 4;
                    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                    const lum = getLuminance(r, g, b);
                    lumSum += lum;
                    lumValues.push(lum);

                    const color = classifyPixel(r, g, b);
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                    pixCount++;
                }
            }

            const brightness = lumSum / pixCount;

            // Kontrast (std dev)
            let varSum = 0;
            for (const v of lumValues) {
                varSum += (v - brightness) * (v - brightness);
            }
            const contrast = Math.sqrt(varSum / pixCount);

            // Baskın renk
            const dominantColor = Object.entries(colorCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

            // Bölge risk skoru
            let cellRisk = 0;
            if (brightness < 50) cellRisk += 30;
            else if (brightness < 80) cellRisk += 15;
            if (contrast < 20) cellRisk += 20;

            const redPct = (colorCounts['red'] || 0) / pixCount;
            const orangePct = (colorCounts['orange'] || 0) / pixCount;
            if (redPct > 0.15) cellRisk += 20;
            if (orangePct > 0.15) cellRisk += 15;

            const cellData = {
                row, col, brightness, contrast, dominantColor, riskScore: cellRisk,
                position: row < 2 ? 'upper' : 'lower',
                label: `${['Üst-Sol', 'Üst', 'Üst', 'Üst-Sağ', 'Orta-Sol', 'Orta', 'Orta', 'Orta-Sağ', 'Alt-Orta-Sol', 'Alt-Orta', 'Alt-Orta', 'Alt-Orta-Sağ', 'Alt-Sol', 'Alt', 'Alt', 'Alt-Sağ'][row * 4 + col]}`
            };

            gridRow.push(cellData);

            if (cellRisk >= 30) {
                hotspots.push({
                    ...cellData,
                    x: startX, y: startY, w: cellW, h: cellH,
                    severity: cellRisk >= 50 ? 'high' : 'medium'
                });
            }
        }
        grid.push(gridRow);
    }

    return { grid, hotspots };
}

/**
 * Kenar tespiti — Sobel filtresi varyansı
 * Yüksek kenar yoğunluğu = karmaşık/kalabalık ortam
 * @returns {{ density, level, warning }}
 */
export function detectEdges(imageData, width, height) {
    const data = imageData.data;

    // Gri tonlamalı
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    // Sobel filtresi
    let edgeSum = 0, edgeCount = 0;

    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = y * width + x;

            // Sobel X
            const gx =
                -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
                -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
                -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];

            // Sobel Y
            const gy =
                -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
                gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            edgeSum += magnitude;
            edgeCount++;
        }
    }

    const avgEdge = edgeSum / edgeCount;
    // 0-1 aralığına normalize (max ~360)
    const density = Math.min(1, avgEdge / 200);

    let level, warning;
    if (density < 0.1) {
        level = 'very-low';
        warning = null; // Düz yüzey, açık alan
    } else if (density < 0.3) {
        level = 'low';
        warning = null;
    } else if (density < 0.6) {
        level = 'medium';
        warning = null;
    } else {
        level = 'high';
        warning = '🟡 Yoğun kenar yapısı — karmaşık/kalabalık ortam, dikkat gerektirir';
    }

    return { density, level, warning };
}

/**
 * EXIF metadata okuma (basit parser)
 * @returns {{ dateTime, camera, gps, orientation }}
 */
export function extractMetadata(dataUrl) {
    const result = {
        dateTime: null,
        camera: null,
        gps: null,
        orientation: null,
        isNightShot: false,
        timeWarning: null
    };

    try {
        // Data URL'den binary data çıkar
        const base64 = dataUrl.split(',')[1];
        if (!base64) return result;

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        // JPEG EXIF marker kontrolü
        if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return result;

        // APP1 marker (EXIF) ara
        let offset = 2;
        while (offset < bytes.length - 4) {
            if (bytes[offset] === 0xFF && bytes[offset + 1] === 0xE1) {
                // EXIF bulundu, basit parse
                const exifData = parseExifSegment(bytes, offset);
                if (exifData) {
                    Object.assign(result, exifData);
                }
                break;
            }
            // Sonraki marker'a atla
            const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
            offset += 2 + segLen;
        }
    } catch {
        // EXIF parse başarısız — sessizce devam et
    }

    // Çekim saati analizi
    if (result.dateTime) {
        const hour = result.dateTime.getHours();
        if (hour >= 22 || hour < 6) {
            result.isNightShot = true;
            result.timeWarning = '🌙 Gece vardiyasında çekilmiş — ekstra aydınlatma kontrolü gerekli';
        }
    }

    return result;
}

/**
 * Basit EXIF segment parser
 */
function parseExifSegment(bytes, startOffset) {
    const result = {};

    try {
        const segLen = (bytes[startOffset + 2] << 8) | bytes[startOffset + 3];
        const exifStart = startOffset + 4;

        // "Exif\0\0" kontrolü
        if (String.fromCharCode(...bytes.slice(exifStart, exifStart + 4)) !== 'Exif') {
            return null;
        }

        const tiffStart = exifStart + 6;
        const isLittleEndian = bytes[tiffStart] === 0x49; // "II"

        const readUint16 = (off) => {
            if (isLittleEndian) return bytes[off] | (bytes[off + 1] << 8);
            return (bytes[off] << 8) | bytes[off + 1];
        };

        const readUint32 = (off) => {
            if (isLittleEndian) {
                return bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
            }
            return (bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3];
        };

        // IFD0 offset
        const ifdOffset = readUint32(tiffStart + 4) + tiffStart;
        const numEntries = readUint16(ifdOffset);

        for (let i = 0; i < Math.min(numEntries, 50); i++) {
            const entryOffset = ifdOffset + 2 + i * 12;
            const tag = readUint16(entryOffset);

            // DateTime tag (0x0132)
            if (tag === 0x0132) {
                const valueOffset = readUint32(entryOffset + 8) + tiffStart;
                let dateStr = '';
                for (let j = 0; j < 19; j++) {
                    dateStr += String.fromCharCode(bytes[valueOffset + j]);
                }
                // "2024:01:15 14:30:00" → Date
                const parts = dateStr.replace(/:/g, '-').replace(/-/, ':').replace(/-/, ':');
                const d = new Date(dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
                if (!isNaN(d.getTime())) {
                    result.dateTime = d;
                }
            }

            // Orientation tag (0x0112)
            if (tag === 0x0112) {
                result.orientation = readUint16(entryOffset + 8);
            }
        }
    } catch {
        // Parse hatası — sessizce devam
    }

    return Object.keys(result).length > 0 ? result : null;
}


// ═══════════════════════════════════════════════════
// 3. KURAL TABANLI RİSK DEĞERLENDİRME
// ═══════════════════════════════════════════════════

/**
 * Tüm kategoriler için geçerli genel kurallar
 */
function applyGeneralRules(analysis) {
    const findings = [];
    const { brightness, contrast, blurriness, saturation, colors, edges } = analysis;

    // Parlaklık kuralları
    if (brightness.average < 30) {
        findings.push({ icon: '🔴', message: 'KRİTİK: Çok karanlık ortam — iş güvenliği tehlikeli', risk: 30, type: 'brightness' });
    } else if (brightness.average < 80) {
        findings.push({ icon: '🟠', message: 'Yetersiz aydınlatma — minimum standartlar sağlanmalı', risk: 20, type: 'brightness' });
    } else if (brightness.average > 220) {
        findings.push({ icon: '🟡', message: 'Aşırı parlaklık — göz kamaşması riski', risk: 10, type: 'brightness' });
    }

    // Kontrast kuralları
    if (contrast.standardDeviation < 20) {
        findings.push({ icon: '🟠', message: 'Çok düşük kontrast — sis/duman/toz bulutu olasılığı', risk: 25, type: 'contrast' });
    } else if (contrast.standardDeviation < 35) {
        findings.push({ icon: '🟡', message: 'Düşük kontrast — görünürlük kısmen kısıtlı', risk: 10, type: 'contrast' });
    }

    // Bulanıklık kuralları
    if (blurriness.score < 50) {
        findings.push({ icon: '🟠', message: 'Çok bulanık görüntü — ortam değerlendirmesi güvenilir değil', risk: 15, type: 'blur' });
    } else if (blurriness.score < 100) {
        findings.push({ icon: '🟡', message: 'Bulanık görüntü — görüş mesafesi kısıtlı olabilir', risk: 10, type: 'blur' });
    }

    // Doygunluk kuralları
    if (saturation.average < 15) {
        findings.push({ icon: '🟠', message: 'Çok düşük doygunluk — sis/duman/toz ortamı', risk: 20, type: 'saturation' });
    }

    // Yoğun uyarı renkleri
    if (colors.safetyColors.red > 0.3 && colors.safetyColors.orange > 0.15) {
        findings.push({ icon: '🔴', message: 'Yoğun uyarı renkleri — acil tehlike olasılığı', risk: 30, type: 'color' });
    } else if (colors.safetyColors.red > 0.2) {
        findings.push({ icon: '🟠', message: 'Kırmızı renk yoğunluğu — tehlike/yasak işareti olabilir', risk: 15, type: 'color' });
    }

    // Kenar yoğunluğu
    if (edges.density > 0.7) {
        findings.push({ icon: '🟡', message: 'Çok yoğun kenar yapısı — karmaşık/kalabalık ortam', risk: 10, type: 'edges' });
    }

    return findings;
}

/**
 * Kategori bazlı özel kurallar
 */
const CATEGORY_RULES = {
    fod: (analysis) => {
        const findings = [];
        if (analysis.brightness.average < 80)
            findings.push({ icon: '⚠️', message: 'Yetersiz aydınlatma — FOD tespiti zorlaşır', risk: 20, type: 'fod' });
        if (analysis.edges.density > 0.7)
            findings.push({ icon: '⚠️', message: 'Karmaşık zemin yapısı — FOD riski artıyor', risk: 25, type: 'fod' });
        if (analysis.contrast.standardDeviation < 30)
            findings.push({ icon: '⚠️', message: 'Düşük kontrast — küçük parçalar görülemeyebilir', risk: 15, type: 'fod' });
        return findings;
    },

    hangar: (analysis) => {
        const findings = [];
        if (analysis.brightness.average < 80)
            findings.push({ icon: '⚠️', message: 'Hangar aydınlatması yetersiz (min. 500 lux gerekli)', risk: 25, type: 'hangar' });
        if (analysis.brightness.average > 220)
            findings.push({ icon: '💡', message: 'Parlama riski — göz kamaşması tehlikesi', risk: 10, type: 'hangar' });
        if (analysis.colors.safetyColors.yellow > 0.2)
            findings.push({ icon: '🟡', message: 'Zemin işaretlemeleri/uyarı bantları tespit edildi', risk: 5, type: 'hangar' });
        if (analysis.blurriness.score < 100)
            findings.push({ icon: '🌫️', message: 'Ortamda toz/duman olabilir', risk: 20, type: 'hangar' });
        return findings;
    },

    kimyasal: (analysis) => {
        const findings = [];
        if (analysis.saturation.average < 20)
            findings.push({ icon: '☁️', message: 'Soluk renkler — olası buhar/gaz salınımı', risk: 25, type: 'chemical' });
        if (analysis.contrast.standardDeviation < 30)
            findings.push({ icon: '🌫️', message: 'Bulanık ortam — kimyasal buhar olasılığı', risk: 30, type: 'chemical' });
        if (analysis.colors.safetyColors.yellow > 0.25)
            findings.push({ icon: '⚠️', message: 'Kimyasal uyarı işaretleri tespit edildi', risk: 10, type: 'chemical' });
        if (analysis.colors.safetyColors.red > 0.2)
            findings.push({ icon: '🔴', message: 'Tehlike işareti/dökülme uyarısı olabilir', risk: 15, type: 'chemical' });
        return findings;
    },

    yuksekte: (analysis) => {
        const findings = [];
        if (analysis.brightness.average < 60)
            findings.push({ icon: '🔴', message: 'Yetersiz aydınlatma — düşme riski artar', risk: 30, type: 'height' });
        if (analysis.blurriness.score < 80)
            findings.push({ icon: '⚠️', message: 'Bulanık görüntü — yükseklik kontrolü güçleşir', risk: 20, type: 'height' });
        // Üst bölge karanlık kontrolü
        if (analysis.heatmap) {
            const topBrightness = analysis.heatmap.grid[0].reduce((s, c) => s + c.brightness, 0) / 4;
            const bottomBrightness = analysis.heatmap.grid[3].reduce((s, c) => s + c.brightness, 0) / 4;
            if (topBrightness < bottomBrightness * 0.7) {
                findings.push({ icon: '💡', message: 'Üst bölge karanlık — tavan aydınlatması yetersiz', risk: 15, type: 'height' });
            }
        }
        return findings;
    },

    elektrik: (analysis) => {
        const findings = [];
        if (analysis.colors.safetyColors.yellow > 0.15)
            findings.push({ icon: '⚡', message: 'Elektrik uyarı işaretleri tespit edildi', risk: 10, type: 'electrical' });
        if (analysis.colors.safetyColors.red > 0.2)
            findings.push({ icon: '🔴', message: 'Tehlike/yasak bölge işareti olabilir', risk: 15, type: 'electrical' });
        if (analysis.brightness.average > 230)
            findings.push({ icon: '⚡', message: 'Aşırı parlama — olası kıvılcım/elektrik arkı', risk: 25, type: 'electrical' });
        if (analysis.colors.safetyColors.blue > 0.25)
            findings.push({ icon: 'ℹ️', message: 'Zorunluluk işaretleri olabilir (KKD gereksinimi)', risk: 5, type: 'electrical' });
        return findings;
    },

    yangin: (analysis) => {
        const findings = [];
        if (analysis.colors.safetyColors.red > 0.3)
            findings.push({ icon: '🔥', message: 'Yoğun kırmızı: Yangın ekipmanı veya alev olabilir', risk: 25, type: 'fire' });
        if (analysis.colors.safetyColors.orange > 0.2)
            findings.push({ icon: '🔥', message: 'Turuncu yoğunluk: Olası alev/ısı kaynağı', risk: 30, type: 'fire' });
        if (analysis.brightness.average > 240)
            findings.push({ icon: '💥', message: 'Aşırı parlaklık: Olası ateş/patlama', risk: 35, type: 'fire' });
        if (analysis.saturation.average > 80)
            findings.push({ icon: '🔥', message: 'Yüksek doygunluk: Canlı alev olasılığı', risk: 20, type: 'fire' });
        return findings;
    },

    kkd: (analysis) => {
        const findings = [];
        if (analysis.colors.safetyColors.blue > 0.2)
            findings.push({ icon: 'ℹ️', message: 'Zorunluluk işaretleri tespit edildi', risk: 5, type: 'ppe' });
        if (analysis.colors.safetyColors.green > 0.15)
            findings.push({ icon: '🟢', message: 'İlk yardım/güvenli alan işaretleri', risk: 5, type: 'ppe' });
        if (analysis.colors.safetyColors.yellow > 0.15)
            findings.push({ icon: '⚠️', message: 'KKD uyarı alanı tespit edildi', risk: 10, type: 'ppe' });
        return findings;
    },

    dusme: (analysis) => {
        const findings = [];
        // Zemin bölgesi (alt bölge) analizi
        if (analysis.heatmap) {
            const bottomRow = analysis.heatmap.grid[3];
            const avgBottomBrightness = bottomRow.reduce((s, c) => s + c.brightness, 0) / bottomRow.length;
            const avgBottomContrast = bottomRow.reduce((s, c) => s + c.contrast, 0) / bottomRow.length;

            if (avgBottomBrightness < 60)
                findings.push({ icon: '⚠️', message: 'Zemin görünürlüğü düşük — kayma riski', risk: 25, type: 'slip' });
            if (avgBottomContrast < 20)
                findings.push({ icon: '⚠️', message: 'Zemin yüzeyi ayırt edilemiyor', risk: 20, type: 'slip' });
        }
        if (analysis.blurriness.score < 80)
            findings.push({ icon: '💧', message: 'Islak/yağlı zemin olasılığı (yansıma)', risk: 15, type: 'slip' });
        return findings;
    },

    ergonomi: (analysis) => {
        const findings = [];
        if (analysis.brightness.average < 100)
            findings.push({ icon: '👁️', message: 'Düşük aydınlatma — göz yorgunluğu riski', risk: 15, type: 'ergonomic' });
        if (analysis.contrast.standardDeviation > 80)
            findings.push({ icon: '👁️', message: 'Aşırı kontrast farkı — göz yorgunluğu', risk: 10, type: 'ergonomic' });
        return findings;
    },

    gurultu: (analysis) => {
        const findings = [];
        if (analysis.colors.safetyColors.yellow > 0.15)
            findings.push({ icon: '🔊', message: 'Uyarı işaretleri tespit edildi — gürültülü alan', risk: 10, type: 'noise' });
        return findings;
    },

    apron: (analysis) => {
        const findings = [];
        if (analysis.brightness.average > 220)
            findings.push({ icon: '☀️', message: 'Yüksek parlaklık — güneş parlama riski', risk: 10, type: 'apron' });
        if (analysis.edges.density > 0.6)
            findings.push({ icon: '✈️', message: 'Yoğun hareketlilik — apron trafik riski', risk: 15, type: 'apron' });
        return findings;
    }
};


// ═══════════════════════════════════════════════════
// 4. ANA ANALİZ VE RAPOR FONKSİYONLARI
// ═══════════════════════════════════════════════════

/**
 * Ana fotoğraf analiz fonksiyonu
 * Tüm analiz metodlarını çalıştırır ve birleştirilmiş sonuç döner
 * 
 * @param {string} dataUrl - Base64 data URL (image/jpeg veya image/png)
 * @param {Object} options - Opsiyonel ayarlar
 * @param {number} options.maxSize - Analiz için max boyut (varsayılan: 600px)
 * @returns {Promise<Object>} Analiz sonuçları
 */
export async function analyzePhoto(dataUrl, options = {}) {
    const { maxSize = 600 } = options;

    // Görüntüyü canvas'a yükle
    const { imageData, width, height } = await loadImageToCanvas(dataUrl, maxSize);

    // Tüm analizleri paralel çalıştır
    const colors = extractDominantColors(imageData);
    const brightness = calculateBrightness(imageData);
    const contrast = calculateContrast(imageData);
    const blurriness = detectBlurriness(imageData, width, height);
    const saturation = calculateSaturation(imageData);
    const edges = detectEdges(imageData, width, height);
    const heatmap = generateHeatmap(imageData, width, height);
    const metadata = extractMetadata(dataUrl);

    return {
        colors,
        brightness,
        contrast,
        blurriness,
        saturation,
        edges,
        heatmap,
        metadata,
        imageSize: { width, height },
        analyzedAt: new Date().toISOString()
    };
}

/**
 * Analiz sonuçlarından risk raporu oluştur
 * 
 * @param {Object} analysis - analyzePhoto() sonucu
 * @param {string} categoryId - Tehlike kategorisi (categories.js'den)
 * @param {string} area - Gözlem alanı
 * @returns {Object} Risk raporu
 */
export function generateRiskReport(analysis, categoryId = 'diger', area = '') {
    // Genel kuralları uygula
    const generalFindings = applyGeneralRules(analysis);

    // Kategori kurallarını uygula
    const categoryRuleFn = CATEGORY_RULES[categoryId];
    const categoryFindings = categoryRuleFn ? categoryRuleFn(analysis) : [];

    // Metadata bulguları
    const metadataFindings = [];
    if (analysis.metadata.isNightShot) {
        metadataFindings.push({
            icon: '🌙', message: 'Gece vardiyasında çekim — ekstra aydınlatma kontrolü gerekli',
            risk: 10, type: 'metadata'
        });
    }

    // Tüm bulguları birleştir (tekrar eden tip'leri filtrele)
    const allFindings = [...generalFindings, ...categoryFindings, ...metadataFindings];
    const seenTypes = new Set();
    const findings = allFindings.filter(f => {
        const key = `${f.type}-${f.message.substring(0, 30)}`;
        if (seenTypes.has(key)) return false;
        seenTypes.add(key);
        return true;
    });

    // Toplam risk skoru
    const totalRisk = findings.reduce((sum, f) => sum + f.risk, 0);

    // Risk seviyesi
    let riskLevel, riskLabel, riskColor;
    if (totalRisk <= 20) {
        riskLevel = 'low'; riskLabel = 'Düşük Risk'; riskColor = '#22C55E';
    } else if (totalRisk <= 50) {
        riskLevel = 'medium'; riskLabel = 'Orta Risk'; riskColor = '#EAB308';
    } else if (totalRisk <= 80) {
        riskLevel = 'high'; riskLabel = 'Yüksek Risk'; riskColor = '#F97316';
    } else {
        riskLevel = 'critical'; riskLabel = 'Kritik Risk'; riskColor = '#DC2626';
    }

    // Öneriler oluştur
    const recommendations = generateRecommendations(findings, categoryId, riskLevel);

    // Genel durum özeti
    const summary = generateSummary(analysis, findings, area);

    return {
        overallRiskScore: totalRisk,
        riskLevel,
        riskLabel,
        riskColor,
        findings: findings.sort((a, b) => b.risk - a.risk),
        recommendations,
        summary,
        heatmapData: analysis.heatmap,
        metadata: analysis.metadata,
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

/**
 * Bulgulara dayalı öneriler üret
 */
function generateRecommendations(findings, categoryId, riskLevel) {
    const recommendations = new Set();

    for (const finding of findings) {
        switch (finding.type) {
            case 'brightness':
                if (finding.risk >= 20) {
                    recommendations.add('Aydınlatma seviyesini ölçün ve min. standartları sağlayın');
                    recommendations.add('Acil aydınlatma takviyesi yapın');
                }
                break;
            case 'contrast':
                recommendations.add('Ortam havalandırmasını kontrol edin');
                recommendations.add('Sis/duman kaynağını araştırın');
                break;
            case 'blur':
                recommendations.add('Çalışma alanı görünürlüğünü artırın');
                break;
            case 'saturation':
                recommendations.add('Havalandırma ve aspirasyon sistemlerini kontrol edin');
                recommendations.add('Kimyasal buhar ölçümü yaptırın');
                break;
            case 'color':
                recommendations.add('Bölgedeki uyarı işaretlerini kontrol edin');
                recommendations.add('Tehlike kaynağını belirleyin ve izole edin');
                break;
            case 'fod':
                recommendations.add('FOD yürüyüşü (walk-down) programı uygulayın');
                recommendations.add('Alet kontrol sistemi (tool accountability) devreye alın');
                break;
            case 'hangar':
                recommendations.add('Hangar aydınlatma ölçümü yaptırın (min. 500 lux)');
                break;
            case 'chemical':
                recommendations.add('MSDS/SDS dosyalarını kontrol edin');
                recommendations.add('Uygun KKD kullanımını sağlayın (eldiven, maske, gözlük)');
                recommendations.add('Kimyasal dökülme müdahale setini hazır bulundurun');
                break;
            case 'height':
                recommendations.add('Emniyet kemeri ve yaşam hattı kullanımını kontrol edin');
                recommendations.add('Düşme koruma planını gözden geçirin');
                break;
            case 'electrical':
                recommendations.add('LOTO (Kilitle-Etiketle) prosedürünü doğrulayın');
                recommendations.add('Yalnız yetkili personelin müdahale ettiğinden emin olun');
                break;
            case 'fire':
                recommendations.add('Yangın söndürme ekipmanlarının erişilebilirliğini kontrol edin');
                recommendations.add('Tahliye rotalarının açık olduğunu doğrulayın');
                recommendations.add('Isı kaynağını belirleyin ve kontrol altına alın');
                break;
            case 'slip':
                recommendations.add('Zemin yüzeyini temizleyin ve kurulayın');
                recommendations.add('Kaymaz bant/kaplama uygulayın');
                recommendations.add('Uyarı tabelası yerleştirin');
                break;
            case 'metadata':
                recommendations.add('Gece vardiyası aydınlatma kontrolü yapın');
                break;
        }
    }

    // Risk seviyesine göre aciliyet ekle
    if (riskLevel === 'critical') {
        recommendations.add('🚨 ACİL: İşi durdurun ve güvenli alana çekilin');
        recommendations.add('🚨 ACİL: Yönetimi derhal bilgilendirin');
    } else if (riskLevel === 'high') {
        recommendations.add('⚠️ Derhal geçici tedbirler alın');
        recommendations.add('⚠️ 7 gün içinde kalıcı çözüm uygulayın');
    }

    return [...recommendations];
}

/**
 * Genel durum özeti oluştur
 */
function generateSummary(analysis, findings, area) {
    const parts = [];

    if (area) parts.push(`📍 Alan: ${area}`);

    // Aydınlatma durumu
    const bLevel = analysis.brightness.level;
    if (bLevel === 'critical') parts.push('🔴 Aydınlatma: KRİTİK — çok karanlık');
    else if (bLevel === 'low') parts.push('🟠 Aydınlatma: Yetersiz');
    else if (bLevel === 'normal') parts.push('✅ Aydınlatma: Normal');
    else if (bLevel === 'bright') parts.push('✅ Aydınlatma: İyi');
    else if (bLevel === 'excessive') parts.push('🟡 Aydınlatma: Aşırı parlak');

    // Görünürlük
    if (analysis.contrast.level === 'very-low' || analysis.saturation.level === 'very-low') {
        parts.push('🌫️ Görünürlük: Kısıtlı (sis/duman/toz olasılığı)');
    } else {
        parts.push('✅ Görünürlük: Normal');
    }

    // Tespit edilen güvenlik renkleri
    const safetyDetected = [];
    if (analysis.colors.safetyColors.red > 0.1) safetyDetected.push('Kırmızı (tehlike)');
    if (analysis.colors.safetyColors.yellow > 0.1) safetyDetected.push('Sarı (uyarı)');
    if (analysis.colors.safetyColors.blue > 0.1) safetyDetected.push('Mavi (zorunluluk)');
    if (analysis.colors.safetyColors.green > 0.1) safetyDetected.push('Yeşil (güvenli)');

    if (safetyDetected.length > 0) {
        parts.push(`🎨 Tespit edilen güvenlik renkleri: ${safetyDetected.join(', ')}`);
    }

    // Riskli bölgeler
    if (analysis.heatmap.hotspots.length > 0) {
        parts.push(`🗺️ ${analysis.heatmap.hotspots.length} riskli bölge tespit edildi`);
    }

    // Toplam bulgu sayısı
    parts.push(`📋 ${findings.length} bulgu tespit edildi`);

    return parts.join('\n');
}


// ═══════════════════════════════════════════════════
// 5. ISITMAP OVERLAY ÇİZİMİ
// ═══════════════════════════════════════════════════

/**
 * Fotoğraf üzerine ısı haritası overlay çiz
 * @param {string} originalDataUrl - Orijinal fotoğraf
 * @param {Object} heatmapData - generateHeatmap() sonucu
 * @returns {Promise<string>} Overlay eklenmiş fotoğrafın data URL'i
 */
export async function drawHeatmapOverlay(originalDataUrl, heatmapData) {
    const { canvas, ctx, width, height } = await loadImageToCanvas(originalDataUrl, 800);

    const cellW = Math.floor(width / 4);
    const cellH = Math.floor(height / 4);

    // Riskli bölgelere overlay çiz
    for (const hotspot of heatmapData.hotspots) {
        const x = hotspot.col * cellW;
        const y = hotspot.row * cellH;

        // Risk seviyesine göre renk
        const alpha = hotspot.severity === 'high' ? 0.35 : 0.2;
        const color = hotspot.severity === 'high' ? '220, 38, 38' : '249, 115, 22';

        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fillRect(x, y, cellW, cellH);

        // Kenar çizgisi
        ctx.strokeStyle = `rgba(${color}, 0.8)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellW, cellH);

        // Risk skoru etiketi
        ctx.fillStyle = `rgba(${color}, 0.9)`;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`⚠️ ${hotspot.riskScore}`, x + 5, y + 20);
    }

    // Grid çizgileri (ince, yarı şeffaf)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(width, i * cellH);
        ctx.stroke();
    }

    return canvas.toDataURL('image/jpeg', 0.85);
}
