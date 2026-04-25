---
name: prompt-enhancer
description: Kullanicinin girdigi kisa ve basit komutlari analiz eder; projenin teknolojileri, UI/UX standartlari ve mimarisi dogrultusunda cok daha kapsamli, detayli ve hatasiz bir prompt (komut) haline getirir. Tetiklenme kosullari - prompt gelistir, komutu iyilestir, prompt enhance, detayli prompt yaz, komut zenginlestir, prompt olustur.
---

# Prompt Enhancer

Kullanicinin kisa komutlarini, projenin teknoloji yigini ve mimarisine uygun, kapsamli uygulama talimatlarina donusturur.

## Proje Teknoloji Yigini

Bu skill, onerileri asagidaki teknoloji yiginina gore uyarlar:

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | React + Vite |
| **Stil** | Vanilla CSS (Tailwind KULLANILMAZ) |
| **Veritabani** | IndexedDB / Dexie.js (client-side) |
| **Durum Yonetimi** | React useState / useEffect |
| **Yonlendirme** | React Router |
| **Uygulama Tipi** | PWA (Progressive Web App) |
| **Dil** | Turkce arayuz |

## Analiz Sureci

### Adim 1: Girdiyi Analiz Et
Kullanicinin kisa promptunu oku ve asil ulasmak istedigi amaci belirle:
- Yeni bir sayfa/modul mu istiyor?
- Mevcut bir ozelligi mi gelistirmek istiyor?
- Bir hatayi mi duzelttirmek istiyor?
- Veritabani islemi mi bekliyor?

### Adim 2: Eksik Detaylari Tamamla

#### Frontend Detaylari
- Kullanilacak React bilesenlerini (Component) belirle
- Vanilla CSS siniflarini ve tasarim tokenlerini referans goster
- Responsive (mobil uyumlu) tasarim gerekliliklerini ekle
- Animasyon ve gecis efektlerini tanimla
- Erisilebilirlik (a11y) gereksinimlerini belirt

#### Veritabani / Veri Katmani
- Dexie.js tablo ve sema tanimlarini belirle
- CRUD (Olustur, Oku, Guncelle, Sil) islemlerini tanimla
- Ilgili servis dosyasini (`src/services/`) referans goster
- Veri dogrulama kurallarini ekle

#### ISG / ISO 45001 Uyumu
- Ilgili ISO 45001 maddelerini referans goster
- Guvenlik gereksinimlerini belirt
- KVKK uyumluluk notlarini ekle

### Adim 3: Standartlari Koru
Projenin genel kurallari komuta entegre edilir:
- Arayuz dili: **Turkce**
- Renk paleti: Projenin mevcut CSS degiskenleri (`--primary`, `--danger`, `--warning` vb.)
- Hata yakalama: try/catch yapilari ve kullanici bildirimleri
- Toast/bildirim sistemi
- Loading/skeleton state yonetimi

### Adim 4: Zenginlestirilmis Cikti Formati
Gelistirilmis komut asagidaki basliklar halinde sunulur:

```markdown
## 🎯 Hedef
[Kullanicinin ulasmak istedigi sonuc]

## 🖥️ UI Beklentisi
- Sayfa duzeni ve bilesenleri
- Responsive davranis
- Animasyonlar ve gecisler
- Renk ve tipografi

## ⚙️ Is Mantigi (Business Logic)
- React hook ve state yonetimi
- Olay dinleyiciler (event handlers)
- Form dogrulama kurallari
- Hata yonetimi

## 💾 Veri Katmani
- Dexie.js tablo yapisi
- Servis fonksiyonlari
- CRUD islemleri

## 📁 Dosya Yapisi
- Olusturulacak / degistirilecek dosyalar
- Import bagimliliklari

## ✅ Kabul Kriterleri
- Islevsellik kontrol listesi
- Edge case senaryolari
```

## Kaynak Dosya Referanslari
- Sayfalar: `src/pages/*.jsx`
- Servisler: `src/services/*.js`
- Konfigurasyonlar: `src/config/*.js`
- Bilesenler: `src/components/*.jsx`
- Veritabani: `src/db/isgDatabase.js`
- Stiller: `src/index.css`, `src/App.css`

## Dikkat Edilecek Hususlar
- ❌ Tailwind CSS siniflarini KULLANMA, Vanilla CSS kullan
- ❌ Backend API referanslari VERME, bu bir client-side PWA
- ❌ Mevzuata aykiri is akislarina onay VERME
- ✅ Tum onerilerde ISO 45001 uyumunu gozet
- ✅ Mobil oncelikli (mobile-first) tasarim yaklasimiyla olustur
- ✅ Turkce arayuz diline sadik kal
- ✅ Mevcut proje yapisina uyumlu dosya/klasor adlandirmasi kullan
