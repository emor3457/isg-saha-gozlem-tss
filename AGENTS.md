# 🤖 İSG Dijital Ajanlar Ekosistemi

Bu proje, ISO 45001 standartlarını otonom olarak destekleyen dijital ajanlar tarafından izlenmektedir. Ajanlar, arka planda veri madenciliği yaparak riskleri önceden saptar ve mevzuat uyumunu denetler.

## 👨‍⚖️ 1. Compliance Agent (Mevzuat Uzmanı)
**Görevi:** Saha bulgularını yasal mevzuat maddeleriyle (6331 Sayılı Kanun, Yönetmelikler vb.) eşleştirmek.
- **Tetikleyici:** Yeni bir gözlem veya risk kaydı.
- **Eylem:** İlgili kanun maddesini bulur, uygunsuzluk raporu taslağı hazırlar ve hukuki risk skoru atar.
- **Hedef:** %100 Yasal Uyumluluk.

## 🛡️ 2. Guardian Agent (Saha Muhafızı)
**Görevi:** Kritik tehlikeleri ve KKD ihlallerini saptamak.
- **Tetikleyici:** Fotoğraf yükleme veya yüksek şiddetli (`Severity 4`) bulgular.
- **Eylem:** Anında push bildirimi gönderir, acil durdurma önerisi yapar ve aksiyon sürecini başlatır.
- **Hedef:** Sıfır İş Kazası.

## 📊 3. Analyst Agent (Veri Analisti)
**Görevi:** Trendleri izlemek ve gelecek riskleri tahmin etmek.
- **Tetikleyici:** Haftalık veri döngüsü veya 50+ yeni kayıt.
- **Eylem:** Prediktif risk skorlarını hesaplar, lokasyon bazlı ısı haritaları oluşturur.
- **Hedef:** Veriye Dayalı Karar Destek.

## 🎓 4. Coach Agent (Eğitmen)
**Görevi:** Personel yetkinliğini ve eğitim süreçlerini yönetmek.
- **Tetikleyici:** Yeni iş izni talebi veya eğitim süresi dolan personel.
- **Eylem:** Personel bazlı eğitim açığı raporu sunar, Toolbox eğitim konuları önerir.
- **Hedef:** %100 Yetkinlik ve Farkındalık.

---
*Bu ajanlar sistemin `src/services/agents/` dizininde yaşamaktadır.*
