---
name: iso45001-audit
description: ISO 45001 denetim ve kontrol listesi yonetimi. Denetim planlama, kontrol listesi olusturma, denetim bulgulari kaydetme, uygunsuzluk tespit etme ve duzeltici faaliyet takibi islemleri icin kullanilir. Tetiklenme kosullari - denetim modulu ekle, kontrol listesi olustur, audit plani yap, ISO 45001 denetim sureci, uygunsuzluk yonetimi.
---

# ISO 45001 Audit Skill

Turkish Technic ISG uygulamasinda denetim ve kontrol listesi modulu gelistirme rehberi.

## ISO 45001 Denetim Sureci

### Madde 9.2 - Ic Denetim Gereklilikleri
1. Denetim programi planlanmali (sikligi, yontemleri, sorumluluklar)
2. Denetim kriterleri ve kapsami tanimlanmali
3. Denetciler secilmeli (tarafsizlik ve yetkinlik)
4. Denetim sonuclari yonetime raporlanmali
5. Duzeltici faaliyetler gecikmeden baslatilmali

### Madde 10.2 - Uygunsuzluk ve Duzeltici Faaliyet
1. Uygunsuzlugu kontrol altina al ve duzelt
2. Sonuclari ele al
3. Kok nedeni belirle
4. Benzer uygunsuzluklarin varligini arastir
5. Gerekli onlemleri uygula
6. Alinan onlemlerin etkinligini gozden gecir
7. Gerekirse ISG sisteminde degisiklik yap

## Veritabani Semasi

Denetim modulu icin gerekli tablolar:

```js
// db.js'e eklenecek tablolar
audits: '++id, title, type, department, auditorName, scheduledDate, status, createdAt'
checklistTemplates: '++id, name, department, category'
checklistItems: '++id, templateId, auditId, question, status, finding, severity'
auditFindings: '++id, auditId, description, severity, category, correctiveAction, dueDate, status'
```

## Kontrol Listesi Kategorileri

Departmana gore kontrol listesi sablonlari:

| Departman | Kontrol Alanlari |
|-----------|-----------------|
| Uretim/Hangar | KKD, is ekipmani, zemin durumu, aydinlatma, havalandirma |
| Depo | Kimyasallar, istifleme, etiketleme, MSDS |
| Ofis | Ergonomi, elektrik, acil cikis, yangin |
| Atolye | Makine koruyuculari, toz/gurultu, el aletleri |
| Laboratuvar | Kimyasal guvenligi, havalandirma, KKD, dokulme kiti |

## Denetim Durumlari

```js
export const AUDIT_STATUSES = [
  { id: 'planned', label: 'Planlanmis', color: '#3B82F6' },
  { id: 'in_progress', label: 'Devam Ediyor', color: '#F59E0B' },
  { id: 'completed', label: 'Tamamlandi', color: '#10B981' },
  { id: 'cancelled', label: 'Iptal', color: '#64748B' }
];

export const FINDING_SEVERITIES = [
  { id: 'observation', label: 'Gozlem', color: '#3B82F6' },
  { id: 'minor', label: 'Minör Uygunsuzluk', color: '#EAB308' },
  { id: 'major', label: 'Major Uygunsuzluk', color: '#F97316' },
  { id: 'critical', label: 'Kritik Uygunsuzluk', color: '#EF4444' }
];
```

## Referans Mevzuat
- 6331 Sayili ISG Kanunu Md.10 (Risk degerlendirmesi)
- ISO 45001 Md.9.2 (Ic Denetim)
- ISO 45001 Md.10.2 (Uygunsuzluk ve Duzeltici Faaliyet)

## Uygulama Adimlari
1. `src/config/auditCategories.js` - Denetim konfigurasyon dosyasi olustur
2. `src/services/auditService.js` - CRUD + istatistik servisi
3. `src/pages/Audits.jsx` - Denetim listesi ve olusturma sayfasi
4. `src/pages/AuditDetail.jsx` - Denetim detay + kontrol listesi + bulgular
5. `db.js` versiyonunu artir ve yeni tablolari ekle
6. `App.jsx` ve `AppLayout.jsx` dosyalarinda route ve navigasyon ekle
