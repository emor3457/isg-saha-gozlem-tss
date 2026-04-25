# ISG Uygulama Mimarisi Referansi

## Dosya Yapisi
```
isg_sistem_tss/
  .agent/skills/           -> Agent skill dosyalari
  .agent/workflows/        -> Is akisi dosyalari
  public/                  -> Statik dosyalar (favicon, icons)
  src/
    App.jsx                -> React Router yapilandirmasi
    main.jsx               -> Uygulama giris noktasi
    index.css              -> Tasarim sistemi ve global stiller
    components/
      Common/Toast.jsx     -> Bildirim context provider
      Layout/AppLayout.jsx -> Ana layout (sidebar + header + bottom nav)
    config/
      categories.js        -> Tehlike kategorileri, alanlar, durumlar, departmanlar
      fineKinney.js        -> Fine-Kinney parametreleri ve hesaplama
      recommendations.js   -> Risk seviyesine gore uzman onerileri
      regulations.js       -> Turk ISG mevzuati ve ISO 45001 maddeleri
    database/
      db.js                -> Dexie.js veritabani semasi
    pages/
      Dashboard.jsx        -> Ana sayfa (istatistikler, son gozlemler)
      Observations.jsx     -> Gozlem listesi ve olusturma
      ObservationDetail.jsx-> Gozlem detay (risk + aksiyon + mevzuat)
      RiskAssessment.jsx   -> Risk degerlendirme ozeti
      Actions.jsx          -> Aksiyon takip sayfasi
      Regulations.jsx      -> Mevzuat kutuphanesi
      Reports.jsx          -> Rapor olusturma (PDF + Excel)
      Settings.jsx         -> Ayarlar (profil + bildirim + yedekleme)
    services/
      observationService.js      -> Gozlem CRUD
      riskService.js             -> Tehlike/risk CRUD + Fine-Kinney
      actionService.js           -> Aksiyon CRUD + hatirlatici
      notificationService.js     -> Browser bildirimler
      photoService.js            -> Foto cekim ve sikistirma
      exportService.js           -> JSON yedekleme/geri yukleme
      nonconformityReportService.js -> Uygunsuzluk PDF raporu
  server.cjs               -> Basit Node.js statik dosya sunucusu
  BASLAT.bat               -> Windows - build + baslat kisayolu
  vite.config.js           -> Vite + PWA yapilandirmasi
  package.json             -> Bagimliliklar ve scriptler
```

## Kullanilan Teknolojiler
| Teknoloji | Versiyon | Amac |
|-----------|---------|------|
| React | 18.3 | UI framework |
| Vite | 6.x | Build araci |
| Dexie.js | 4.x | IndexedDB wrapper |
| React Router | 6.28 | Client-side routing |
| Lucide React | 0.460 | Ikon kutuphanesi |
| jsPDF | 2.5 | PDF olusturma |
| jsPDF-AutoTable | 3.8 | PDF tablo eklentisi |
| SheetJS (xlsx) | 0.18 | Excel olusturma |
| vite-plugin-pwa | 0.21 | PWA destegi |

## Renk Paleti
| Degisken | Deger | Kullanim |
|----------|-------|---------|
| --color-primary | #FF8C00 | Guvenlik Turuncusu |
| --color-warning | #FFD700 | Uyari Sarisi |
| --color-danger | #EF4444 | Tehlike / Hata |
| --color-success | #10B981 | Basari / Tamamlandi |
| --color-info | #3B82F6 | Bilgi |
| --bg-primary | #0f172a | Ana arkaplan |
| --bg-secondary | #1e293b | Kart arkaplan |
