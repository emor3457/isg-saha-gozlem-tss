# Renk Analiz Kılavuzu — ISG Güvenlik Renkleri

Canvas API ile piksel analizi yapılırken kullanılacak renk aralıkları ve ISG anlamları.

## Güvenlik Renk Standartları

ISO 3864 ve TSE 12350'ye göre iş güvenliği renk kodları:

| Renk | HSL Aralığı | RGB Yaklaşık | ISG Anlamı |
|------|-------------|-------------|------------|
| 🔴 Kırmızı | H: 0-15, 345-360 / S > 50% | R > 180, G < 100, B < 100 | Tehlike, yasak, yangın, durdurma |
| 🟠 Turuncu | H: 15-45 / S > 50% | R > 200, G: 100-180, B < 80 | Uyarı, dikkat |
| 🟡 Sarı | H: 45-65 / S > 50% | R > 200, G > 200, B < 100 | İkaz, elektrik tehlikesi |
| 🟢 Yeşil | H: 90-150 / S > 30% | R < 100, G > 150, B < 100 | Güvenli, ilk yardım, çıkış |
| 🔵 Mavi | H: 200-250 / S > 30% | R < 100, G < 100, B > 150 | Zorunluluk, KKD, bilgi |
| ⚪ Beyaz | S < 10% / L > 85% | R > 220, G > 220, B > 220 | Yol işaretleme, temizlik |

## RGB → HSL Dönüşüm Formülü

```javascript
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
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
```

## Piksel Sınıflandırma Kuralları

Her piksel için renk kategorisi belirlemek:

```javascript
function classifyPixel(r, g, b) {
    const { h, s, l } = rgbToHsl(r, g, b);

    // Gri tonları (düşük doygunluk)
    if (s < 10) {
        if (l > 85) return 'white';
        if (l < 15) return 'black';
        return 'gray';
    }

    // Renkli pikseller
    if ((h < 15 || h > 345) && s > 50) return 'red';
    if (h >= 15 && h < 45 && s > 50) return 'orange';
    if (h >= 45 && h < 65 && s > 50) return 'yellow';
    if (h >= 90 && h < 150 && s > 30) return 'green';
    if (h >= 200 && h < 250 && s > 30) return 'blue';

    return 'other';
}
```

## Parlaklık (Luminance) Hesaplama

ITU-R BT.601 standardına göre:

```javascript
function calculateLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
```

### Aydınlatma Eşik Değerleri (ISG Referanslı)

| Luminance Aralığı | Durum | İSG Karşılığı |
|-------------------|-------|--------------|
| 0-30 | Çok karanlık | İş yapılmamalı, acil aydınlatma |
| 30-80 | Karanlık | Yetersiz, min standart sağlanmalı |
| 80-180 | Normal | Kabul edilebilir aydınlatma |
| 180-220 | Parlak | İyi aydınlatma |
| 220+ | Aşırı parlak | Göz kamaşması riski |

## Doygunluk (Saturation) Yorumlama

| Ortalama Doygunluk | Yorum |
|--------------------|-------|
| < 15% | Çok soluk, sis/duman/toz olasılığı yüksek |
| 15-40% | Normal iç mekan |
| 40-70% | Renkli ortam, işaretleme/boyalı yüzeyler |
| > 70% | Çok yüksek, olası yapay ışık veya işaret |

## Bölgesel Analiz Grid Yapısı

Fotoğrafı 4×4 (16 bölge) grid olarak analiz:

```
┌────┬────┬────┬────┐
│ TL1│ TL2│ TR1│ TR2│  ← Üst (tavan, üst yapı)
├────┼────┼────┼────┤
│ ML1│ ML2│ MR1│ MR2│  ← Orta (çalışma alanı)
├────┼────┼────┼────┤
│ ML3│ ML4│ MR3│ MR4│  ← Alt-orta (ekipman seviyesi)
├────┼────┼────┼────┤
│ BL1│ BL2│ BR1│ BR2│  ← Alt (zemin)
└────┴────┴────┴────┘
```

- **Üst bölgeler**: Tavan aydınlatması, üst yapı kontrolü
- **Orta bölgeler**: Çalışma alanı, ekipman ve personel
- **Alt bölgeler**: Zemin durumu, döküntü, kayma riski
