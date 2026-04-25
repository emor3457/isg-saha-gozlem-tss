---
name: photo-analyzer
description: ISG saha fotoğraflarında tehlike ve risk tespiti yapan, API kullanmadan tamamen istemci tarafında (client-side) çalışan görüntü analiz skill'i. Canvas API piksel analizi, EXIF metadata okuma, parlaklık/kontrast/bulanıklık hesaplama, kural tabanlı kategori eşleştirme, bölgesel ısı haritası ve kenar tespiti yöntemlerini kullanır. Tetiklenme koşulları - fotoğraf analiz et, saha fotoğrafı incele, tehlike tespiti yap, görüntü analizi, risk tespiti fotoğraftan, fotoğraf tarama, photo analysis, görsel tehlike analizi.
---

# ISG Fotoğraf Analiz Motoru

Sahadan çekilen fotoğraflarda tehlike ve riskleri **API kullanmadan** tespit eden istemci tarafı analiz sistemi.

## Temel Prensipler

- **Sıfır API Bağımlılığı**: Tüm analiz tarayıcıda Canvas API ile yapılır
- **Offline Çalışabilirlik**: İnternet gerektirmez, sahada kullanılabilir
- **KVKK Uyumlu**: Fotoğraflar dışarı gönderilmez
- **ISO 45001 Referanslı**: Tüm eşik değerleri ve öneriler standartlara dayanır

## Analiz Metodları

### 1. Piksel Renk Analizi
Canvas `getImageData()` ile her pikselin RGB değerlerini oku. Güvenlik renk kodlarına göre sınıflandır:
- **Kırmızı baskın** → Tehlike/yasak işareti, yangın ekipmanı, kan/yaralanma
- **Sarı/Turuncu baskın** → Uyarı işareti, dikkat gerektiren alan
- **Yeşil baskın** → Güvenli bölge, acil çıkış, ilk yardım
- **Mavi baskın** → Zorunluluk işareti, KKD gereksinimi

### 2. Ortam Kalite Analizi
- **Parlaklık** (Luminance): `0.299R + 0.587G + 0.114B` ortalaması
  - < 80: Karanlık ortam ⚠️ Yetersiz aydınlatma
  - 80-180: Normal aydınlatma ✅
  - > 200: Aşırı parlak / parlama riski
- **Kontrast**: Piksel luminance standart sapması
  - < 30: Düşük kontrast → Sis, duman, toz bulutu olasılığı
- **Bulanıklık**: Laplacian varyansı
  - Düşük varyans → Bulanık/titrek çekim, görüş mesafesi sorunu

### 3. EXIF Metadata Okuma
Fotoğrafın EXIF verilerinden:
- Çekim saati → Gece vardiyası risk faktörü
- GPS koordinatları → Alan bazlı risk profili
- Cihaz bilgisi → Fotoğraf güvenilirliği

### 4. Kural Tabanlı Akıllı Eşleştirme
`categories.js` tehlike kategorileri ve `recommendations.js` önerileri ile çapraz analiz. Bkz: [hazard-detection-rules.md](references/hazard-detection-rules.md)

### 5. Bölgesel Isı Haritası
Fotoğrafı 4×4 grid'e böl, her bölgede bağımsız analiz yap, riskli bölgeleri canvas overlay ile işaretle.

### 6. Kenar Tespiti
Sobel filtresi ile kenar yoğunluğu. Yüksek kenar → Karmaşık/kalabalık ortam riski.

## Uygulama Entegrasyonu

Analiz motorunu uygulamaya entegre ederken:

1. `scripts/imageAnalysisEngine.js` dosyasını `src/services/` altına kopyala veya import et
2. Mevcut `photoService.js`'in `capturePhoto()` veya `pickPhotos()` sonrası analizi çağır
3. Sonuçları gözlem kaydının `analysis` alanına kaydet
4. Kategori ve alan bilgisini `generateRiskReport()` fonksiyonuna ilet

### Temel Kullanım

```javascript
import { analyzePhoto, generateRiskReport } from './imageAnalysisEngine';

// Fotoğraf yakalandıktan sonra
const photo = await capturePhoto();
const analysis = await analyzePhoto(photo.data);
const report = generateRiskReport(analysis, 'hangar', 'Hangar 1');

// report sonucu:
// {
//   overallRiskScore: 65,
//   riskLevel: 'medium',
//   findings: [...],
//   recommendations: [...],
//   heatmapData: [...],
//   metadata: {...}
// }
```

### UI Bileşeni Entegrasyonu

Analiz sonuçlarını göstermek için tipik bir React bileşeni:

```jsx
function PhotoAnalysisResult({ analysis }) {
    if (!analysis) return null;
    return (
        <div className="analysis-card">
            <h4>📸 Fotoğraf Analiz Sonucu</h4>
            <div className="risk-badge" style={{ background: analysis.riskColor }}>
                Risk Seviyesi: {analysis.riskLevel}
            </div>
            <ul>
                {analysis.findings.map((f, i) => (
                    <li key={i}>{f.icon} {f.message}</li>
                ))}
            </ul>
            <h5>Öneriler</h5>
            <ul>
                {analysis.recommendations.map((r, i) => (
                    <li key={i}>✅ {r}</li>
                ))}
            </ul>
        </div>
    );
}
```

## Renk Analiz Detayları

Güvenlik renkleri eşik değerleri ve ISG anlamları için bkz: [color-analysis-guide.md](references/color-analysis-guide.md)

## Sınırlamalar

- Nesne tanıma yapamaz (kask, eldiven vb. ayırt edemez)
- Metin/yazı okuyamaz (etiket, tabela içeriği)
- %100 doğruluk garantisi yoktur — destekleyici araç olarak kullanılmalıdır
- İleride TensorFlow.js ile client-side ML modeli eklenerek bu sınırlamalar aşılabilir
