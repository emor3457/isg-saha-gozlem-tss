---
name: risk-analyzer
description: Fine-Kinney metodu ile risk analizi ve degerlendirme islemleri. Risk skoru hesaplama, risk seviyesi belirleme, risk matrisi olusturma, risk istatistikleri ve trend analizi icin kullanilir. Tetiklenme kosullari - risk analizi yap, Fine-Kinney hesapla, risk matrisi olustur, tehlike degerlendirmesi, risk puani hesapla.
---

# Risk Analyzer

ISG uygulamasinda Fine-Kinney risk degerlendirmesi ve analiz rehberi.

## Fine-Kinney Metodu

Risk Skoru = Olasilik (P) x Frekans (F) x Siddet (S)

### Olasilik (P) Degerleri
| Deger | Aciklama |
|-------|----------|
| 0.1 | Hemen hemen imkansiz |
| 0.2 | Cok dusuk |
| 0.5 | Dusuk |
| 1 | Oldukca dusuk |
| 3 | Normal |
| 6 | Yuksek |
| 10 | Cok yuksek |

### Frekans (F) Degerleri
| Deger | Aciklama |
|-------|----------|
| 0.5 | Cok nadir (yilda 1) |
| 1 | Nadir (yilda birkac kez) |
| 2 | Ara sira (ayda bir) |
| 3 | Arada bir (haftada bir) |
| 6 | Sik (her gun) |
| 10 | Surekli (gun boyu) |

### Siddet (S) Degerleri
| Deger | Aciklama |
|-------|----------|
| 1 | Ilk yardim gerektiren |
| 3 | Kucuk hasar |
| 7 | Onemli (is gunu kaybi) |
| 15 | Agir (kalici hasar) |
| 40 | Cok agir (olum/sakatlik) |
| 100 | Felaket (birden fazla olum) |

### Risk Seviyeleri
| Skor Araligi | Seviye | Renk | Aksiyon |
|-------------|--------|------|---------|
| 0-20 | Cok Dusuk | #06B6D4 | Kabul edilebilir, izleme yeterli |
| 20-70 | Dusuk | #22C55E | Dikkat edilmeli, eylem planlanabilir |
| 70-200 | Orta | #EAB308 | Kisa donemde duzeltici faaliyet |
| 200-400 | Yuksek | #F97316 | Derhal mudahale, is izinle devam |
| 400+ | Cok Yuksek | #DC2626 | Is durdurulmali, acil onlem |

## Kaynak Dosyalar
- Hesaplama: `src/config/fineKinney.js` (calculateRiskScore, getRiskLevel, getRecommendedActions)
- Servis: `src/services/riskService.js` (createHazard, updateHazard, getHazardStats)
- Kategoriler: `src/config/categories.js` (HAZARD_CATEGORIES)
- Oneriler: `src/config/recommendations.js` (getExpertOpinion)

## Risk Matrisi Gorseli
5x6 grid seklinde P ve S eksenlerinde renk kodlu matris olustur.
CSS sinifi: `.risk-matrix`, `.risk-cell`

## Yeni Risk Analizi Ekleme Kaliplari

### Tehlike Olusturma
```js
import { createHazard } from '../services/riskService';
const hazard = await createHazard({
  observationId: obsId,
  type: 'kimyasal', // HAZARD_CATEGORIES id
  description: 'Aciklama',
  probability: 3,  // P degeri
  frequency: 6,    // F degeri
  severity: 7      // S degeri
});
// hazard.riskScore = 126, hazard.riskLevel = 'medium'
```

### Istatistik Alma
```js
import { getHazardStats } from '../services/riskService';
const stats = await getHazardStats();
// { total, byLevel: { 'very-high', 'high', 'medium', 'low', 'very-low' }, averageScore }
```
