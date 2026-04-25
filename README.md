# 🛡️ ISG Saha Gözlem Sistemi (Turkish Technic)

ISO 45001 standartlarına uyumlu, çevrimdışı öncelikli (Offline-First) ve Yapay Zeka destekli endüstriyel İş Sağlığı ve Güvenliği yönetim platformu.

## 🚀 Öne Çıkan Özellikler

*   **HIRA İş Akışı:** Tehlike Kaynağı -> Tehlike -> Potansiyel Etki zinciriyle tam kapsamlı risk analizi.
*   **Fine-Kinney Metodolojisi:** Olasılık, Frekans ve Şiddet parametreleriyle dinamik risk skoru hesaplama.
*   **Offline-First Mimari:** Saha personeli internet olmasa dahi veri girişi yapabilir, bağlantı sağlandığında akıllı senkronizasyon (Field-Level Delta Merge) ile veriler birleştirilir.
*   **Audit Log (Denetim İzi):** Her veri değişiminin (eski/yeni haliyle), yapan kullanıcının, IP'sinin ve zaman damgasının değiştirilemez kaydı.
*   **Profesyonel PDF Raporlama:** ISO 45001 Madde 10.2 uyumlu, kurumsal temalı Uygunsuzluk Bildirim Raporu üretimi.
*   **Dijital Ajan Ekosistemi:**
    *   🤖 **Guardian Agent:** Fotoğraflardan KKD ihlali ve kritik tehlike tespiti.
    *   🤖 **Compliance Agent:** Bulguları saniyeler içinde ilgili mevzuat maddeleriyle (6331 Sayılı Kanun vb.) eşleştirme.
    *   🤖 **Analyst Agent:** Prediktif risk analizleri ve trend tahminleme.
    *   🤖 **Coach Agent:** Personel yetkinlik analizi ve Toolbox eğitim önerileri.

## 🛠️ Teknoloji Yığını

*   **Frontend:** React, Vite, Dexie.js (IndexedDB), Socket.io-client.
*   **Backend:** Node.js, Express, Better-SQLite3, Socket.io.
*   **AI/ML:** TensorFlow.js (COCO-SSD), Kural Tabanlı Uzman Sistemler.
*   **Stil:** Vanilla CSS (Glassmorphism), Lucide Icons.

## 📦 Kurulum

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    cd server && npm install
    ```

2.  Geliştirme modunda başlatın:
    ```bash
    npm run dev:full
    ```

3.  Uygulamaya erişin:
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:3001`

## 📋 Proje Yapısı

```text
├── src/
│   ├── components/       # UI Bileşenleri (HIRA Formu, Fotoğraf Analizi vb.)
│   ├── services/         # İş Mantığı (Sync, Raporlama, AI Ajanları)
│   ├── database/         # Dexie.js Şema ve Migrasyonlar
│   └── pages/            # Uygulama Sayfaları
├── server/
│   ├── config/           # SQLite Veritabanı Yapılandırması
│   ├── routes/           # API Rotaları ve Audit Log Entegrasyonu
│   └── utils/            # Audit Logger ve Yardımcı Fonksiyonlar
└── public/               # Statik Varlıklar
```

## ⚖️ Yasal Uyumluluk
Bu sistem, Türkiye Cumhuriyeti **6331 Sayılı İş Sağlığı ve Güvenliği Kanunu** ve **ISO 45001:2018** yönetim sistemi gerekliliklerini teknik olarak desteklemek üzere tasarlanmıştır.

---
Developed for **Turkish Technic** ISG Innovation Project.
