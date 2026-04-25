# Tehlike Tespit Kuralları — Kategori Bazlı

Her tehlike kategorisi için fotoğraf analiz sonuçlarından otomatik sonuç çıkaran kural motoru.

## Kural Formatı

```
EĞER [analiz_metriği] [operatör] [eşik_değeri] VE [kategori] = [değer]
İSE → [bulgu_mesajı] + [öneri] + [risk_katkısı]
```

## Kategori Kuralları

### FOD (Yabancı Madde Hasarı) — `fod`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Parlaklık < 80 | Yetersiz aydınlatma, FOD tespiti zorlaşır | +20 |
| Kontrast < 30 | Düşük kontrast, küçük parçalar görülemeyebilir | +15 |
| Kenar yoğunluğu > 0.7 | Karmaşık zemin, FOD riski artıyor | +25 |
| Kırmızı oran > 0.15 | Olası hasar/tehlike işareti | +10 |

### Hangar Güvenliği — `hangar`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Parlaklık < 80 | ⚠️ Hangar aydınlatması yetersiz (min. 500 lux) | +25 |
| Parlaklık > 220 | Parlama riski, göz kamaşması tehlikesi | +10 |
| Sarı oran > 0.2 | Zemin işaretlemeleri/uyarı bantları tespit edildi | +5 |
| Bulanıklık skoru < 100 | Ortamda toz/duman olabilir | +20 |
| Kontrast < 25 | Sis/duman/toz bulutu olasılığı | +30 |

### Kimyasal Maddeler — `kimyasal`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Sarı oran > 0.25 | Kimyasal uyarı işaretleri tespit edildi | +10 |
| Doygunluk < 0.2 | Soluk renkler, olası buhar/gaz salınımı | +25 |
| Kontrast < 30 | Bulanık ortam, kimyasal buhar olasılığı | +30 |
| Kırmızı oran > 0.2 | Tehlike işareti/dökülme uyarısı olabilir | +15 |

### Yüksekte Çalışma — `yuksekte`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Parlaklık < 60 | Yetersiz aydınlatma, düşme riski artar | +30 |
| Bulanıklık skoru < 80 | Bulanık görüntü, yükseklik kontrolü güçleşir | +20 |
| Üst bölge parlaklık < alt bölge | Yukarıda karanlık bölge, aydınlatma yetersiz | +15 |

### Elektrik / Enerji — `elektrik`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Sarı oran > 0.15 | Elektrik uyarı işaretleri tespit edildi | +10 |
| Kırmızı oran > 0.2 | Tehlike/yasak bölge işareti olabilir | +15 |
| Parlaklık > 230 | Aşırı parlama, olası kıvılcım/ark | +25 |
| Mavi oran > 0.25 | Zorunluluk işaretleri olabilir (KKD) | +5 |

### Yangın Güvenliği — `yangin`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Kırmızı oran > 0.3 | Yoğun kırmızı: Yangın ekipmanı veya alev olabilir | +25 |
| Turuncu oran > 0.2 | Turuncu yoğunluk: Olası alev/ısı kaynağı | +30 |
| Parlaklık > 240 | Aşırı parlaklık: Olası ateş/patlama | +35 |
| Doygunluk > 0.8 | Yüksek doygunluk: Canlı alev olasılığı | +20 |

### KKD Kullanımı — `kkd`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Mavi oran > 0.2 | Zorunluluk işaretleri tespit edildi | +5 |
| Yeşil oran > 0.15 | İlk yardım/güvenli alan işaretleri | +5 |
| Sarı oran > 0.15 | KKD uyarı alanı tespit edildi | +10 |

### Düşme / Kayma — `dusme`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Alt bölge parlaklık < 60 | Zemin görünürlüğü düşük, kayma riski | +25 |
| Alt bölge kontrast < 20 | Zemin yüzeyi ayırt edilemiyor | +20 |
| Bulanıklık skoru < 80 | Islak/yağlı zemin olasılığı (yansıma) | +15 |

### Ergonomi — `ergonomi`

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Parlaklık < 100 | Düşük aydınlatma, göz yorgunluğu riski | +15 |
| Kontrast > 80 | Aşırı kontrast farkı, göz yorgunluğu | +10 |

## Genel Kurallar (Tüm Kategoriler)

| Koşul | Bulgu | Risk Katkısı |
|-------|-------|-------------|
| Parlaklık < 50 | 🔴 Kritik: Çok karanlık ortam | +30 |
| Parlaklık < 80 | 🟠 Yetersiz aydınlatma | +20 |
| Kontrast < 20 | 🟠 Çok düşük kontrast, görüş kısıtlı | +25 |
| Bulanıklık < 50 | 🟠 Çok bulanık, ortam değerlendirilemez | +15 |
| Kırmızı > 0.3 VE Turuncu > 0.15 | 🔴 Yoğun uyarı renkleri: Acil tehlike olasılığı | +30 |
| Çekim saati 22:00-06:00 | 🌙 Gece vardiyası: Ekstra aydınlatma kontrolü | +10 |

## Risk Skoru Hesaplama

```
Toplam Risk = Σ(uygulanabilir_kural_risk_katkısı)

0-20    → Düşük Risk (Yeşil)
21-50   → Orta Risk (Sarı)
51-80   → Yüksek Risk (Turuncu)
81+     → Kritik Risk (Kırmızı)
```
