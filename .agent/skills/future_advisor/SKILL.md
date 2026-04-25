---
name: future-advisor
description: Projenin mevcut durumunu, kod yapisini ve temel amacini analiz ederek, projeyi daha profesyonel ve islevsel hale getirecek yeni ozellik (feature) onerilerinde bulunur. Tetiklenme kosullari - ozellik oner, feature onerisi, proje analiz et, gelecek planla, yeni ozellik, iyilestirme onerisi, proje gelistirme fikirleri.
---

# Future Advisor

ISG uygulamasinin mevcut durumunu analiz ederek, projeyi ust seviyeye tasiyacak yeni ozellik onerileri sunar. Proje; Vite + React + Dexie.js (IndexedDB) uzerine kurulu, offline-first bir PWA mimarisine sahiptir.

## Analiz Sureci

### Adim 1: Proje Taramasi
Calisma alanindaki mevcut dosyalari, klasor yapisini ve projenin genel is mantigi (Business Logic) taranir:

- `src/pages/` ile mevcut sayfa/modul envanterinin cikarilmasi
- `src/services/` dizinindeki mevcut servislerin tespiti
- `src/config/` altindaki yapilandirma dosyalarinin kontrolu
- `src/components/` altindaki ortak bilesenlerin ve Layout yapisinin incelenmesi
- `src/contexts/` altindaki React Context'lerin (AuthContext, LanguageContext vb.) kontrolu
- `src/database/db.js` ile Dexie.js sema versiyonlari ve tablolarin envanteri
- `package.json` ile kullanilan kutuphanelerin belirlenmesi

#### Adim 1b: Gecmis Calismalarin Taranmasi (Context Awareness)
Daha once onerilen, uygulanan veya rafa kaldirilan ozelliklerin tekrar onerilmemesi icin asagidaki kaynaklar kontrol edilir:

- Agent artifact dizinindeki `weakness_analysis.md`, `task.md`, `implementation_plan.md` gibi mevcut analiz dokumanlari
- Proje icerisindeki `.agent/` dizinindeki skill tanimlari (halihazirda uygulanan yetenekler)
- Eger mevcut bir oneri zaten ✅ olarak isaretlenmisse, yeniden onerilmez

### Adim 2: Eksiklik ve Firsat Analizi
Projede henuz olmayan ancak asagidaki alanlarda iyilestirme yapacak potansiyel alanlar belirlenir:

| Alan | Kontrol Edilen Unsurlar |
|------|------------------------|
| **Kullanici Deneyimi (UX)** | Navigasyon akisi, erisilebilirlik (ARIA), responsive tasarim, skeleton loader, i18n |
| **Performans** | Lazy loading, cache stratejisi, bundle boyutu, Service Worker, Offline-First uyumu |
| **Guvenlik** | Veri dogrulama, yetkilendirme (RBAC), KVKK uyumu, XSS/CSRF onlemi |
| **ISO 45001 Uyumu** | Eksik madde karsiliklari (7.2, 8.1, 10.2 vb.), dokumantasyon boslugu |
| **Veri Yonetimi** | Yedekleme, senkronizasyon, raporlama, veri migrasyon stratejisi |
| **Entegrasyon** | Dis sistem baglantilari, API destegi, webhook, bildirim servisleri |
| **AI ve Otomasyon** | TensorFlow.js, Canvas piksel analizi, NLP metin analizi, prediktif risk tahmini, LLM entegrasyonu |

### Adim 3: Oneri Formatlama
Kullaniciya **en az 3, en fazla 5** adet yuksek degerli ozellik onerisi sunulur.

#### Her Oneri Icin Belirtilecekler:

```
📌 Ozellik Adi: [Aciklayici baslik]
🎯 Neden Gerekli?: [Bu ozelligin projeye katacagi degeri kisa bir cumleyle acikla]
🛠️ Nasil Yapilir?: [Teknik olarak hangi kutuphaneler veya mantiklar kullanilabilir]
⚡ Oncelik: [Yuksek / Orta / Dusuk]
📊 Etki Alani: [UX / Performans / Guvenlik / ISO 45001 / Veri Yonetimi / AI]
⏱️ Tahmini Efor: [Kolay (~1-2 saat) / Orta (~3-6 saat) / Zor (~1-2 gun)]
📶 Offline Uyumu: [Tam / Kismi / Yok — Bu ozellik offline calisabilir mi?]
```

### Adim 4: Onceliklendirme Kriterleri
Oneriler asagidaki onceliklendirme matrisine gore siralanir:

| Kriter | Agirlik |
|--------|---------|
| ISO 45001 uyumuna katkisi | %30 |
| Kullanici deneyimi iyilestirmesi | %25 |
| Teknik borc azaltimi | %20 |
| Uygulama kolayligi | %15 |
| Performans etkisi | %10 |

### Adim 5: Kapanista Kullanici Etkilesimi
Onerilerin sunumundan sonra kullaniciya asagidaki soru yoneltilerek secim yapilmasi saglanir:

> "Bu ozelliklerden hangisini projeye ekleyerek kodlamaya baslamamı istersin?"

## Mevcut Proje Dosya Yapisi Referanslari

| Katman | Yol | Aciklama |
|--------|-----|----------|
| Sayfalar | `src/pages/*.jsx` | Dashboard, Observations, RiskAssessment, Actions, Feedback, Trainings, Documents, Emergency, Regulations, Audits, Incidents, Analytics, Reports, Settings, WorkPermits, PpeManagement, Contractors, Committees |
| Servisler | `src/services/*.js` | observationService, riskService, actionService, trainingService, incidentService, exportService, ppeDetectionService, imageAnalysisService, nonconformityReportService, notificationService |
| Konfigurasyonlar | `src/config/*.js` | categories, fineKinney, regulations, recommendations |
| Bilesenler | `src/components/` | Layout/AppLayout, Common/Toast, Common/Skeleton, Common/ErrorBoundary, PhotoComparison, PhotoAnnotator, EquipmentTracker |
| Context'ler | `src/contexts/*.jsx` | AuthContext (Offline RBAC), LanguageContext (i18n TR/EN) |
| Veritabani | `src/database/db.js` | Dexie.js v11 — 30+ tablo (observations, hazards, actions, trainings, incidents, workPermits, employees, ppeAssignments, contractors, committees vb.) |
| Stiller | `src/index.css`, `src/layout-styles.css` | CSS degiskenleri, glassmorphism, skeleton animasyonlari |

## Dikkat Edilecek Hususlar
- ⚠️ Mevzuata aykiri veya risk barindiran is akislarina onay verme
- ⚠️ Guvenlik protokollerini 'hiz' veya 'maliyet' gerekcesiyle esnetme
- ⚠️ Veriye dayanmayan, varsayimsal guvenlik raporlari olusturma
- ⚠️ Daha once tamamlanmis (✅) ozellikleri tekrar onerme
- ✅ ISO 45001 uyumunu her oneride on planda tut
- ✅ KVKK hassasiyetini goz onunde bulundur
- ✅ 'Sifir Kaza' hedefini destekleyen onerilere oncelik ver
- ✅ Offline-First mimariyle uyumlu cozumler oner
- ✅ Mevcut AI altyapisini (TensorFlow.js, Canvas API) genisletecek firsatlari degerlendir
