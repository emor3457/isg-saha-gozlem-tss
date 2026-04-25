---
name: data-manager
description: IndexedDB (Dexie.js) veri yonetimi, yedekleme, geri yukleme ve veri senkronizasyonu islemleri. Veritabani semasini degistirme, veri migasyonu, JSON yedekleme/geri yukleme, veri temizleme ve toplu veri islemleri icin kullanilir. Tetiklenme kosullari - veritabani guncelle, veri yedekle, yedekten yukle, tablo ekle, veri sifirla, migrasyon yap, dexie schema degistir.
---

# Data Manager

ISG uygulamasinda IndexedDB (Dexie.js) veri yonetimi rehberi.

## Veritabani Yapisi

Dosya: `src/database/db.js`
Kutuphane: Dexie.js v4

### Mevcut Sema (v1)
```js
observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt'
actions: '++id, observationId, responsiblePerson, dueDate, status, completionDate, createdAt'
hazards: '++id, observationId, type, riskScore, createdAt'
regulations: '++id, code, title, category'
reminders: '++id, actionId, reminderDate, type, isRead'
settings: 'key'
```

## Sema Degisikligi (Migrasyon)

Yeni tablo veya index eklerken versiyon numarasini artir:

```js
// Mevcut v1'i koru
db.version(1).stores({ /* mevcut */ });

// Yeni tablo ekle
db.version(2).stores({
  yeniTablo: '++id, field1, field2, createdAt'
});

// Mevcut tabloya index ekle
db.version(3).stores({
  observations: '++id, date, location, area, category, severity, status, assignedTo, createdAt, newField'
});
```

Onemli kurallar:
- Onceki version() cagrilarini SILME, birakarak uzerine yeni version ekle
- Dexie otomatik migrasyon yapar, veri kaybi olmaz
- Compound index: `'[field1+field2]'`

## Yedekleme / Geri Yukleme

Mevcut servis: `src/services/exportService.js`

### JSON Export
```js
import { exportAllData } from '../services/exportService';
await exportAllData(); // Tarayicidan .json dosyasi indirir
```

### JSON Import
```js
import { importData } from '../services/exportService';
const result = await importData(file); // FileReader ile okur, bulkAdd ile yukler
// { observations: N, actions: N, hazards: N }
```

### Tum Verileri Temizle
```js
import { clearAllData } from '../services/exportService';
await clearAllData(); // observations, actions, hazards, reminders tablosunu bosaltir
```

## Veri Islem Kaliplari

### Toplu Ekleme
```js
await db.tableName.bulkAdd(itemArray);
```

### Toplu Guncelleme
```js
await db.tableName.where('status').equals('open').modify({ status: 'closed' });
```

### Iliskili Veri Silme
```js
// Gozlem silinirken iliskili verileri de sil
const actions = await db.actions.where('observationId').equals(id).toArray();
for (const action of actions) {
  await db.reminders.where('actionId').equals(action.id).delete();
}
await db.actions.where('observationId').equals(id).delete();
await db.hazards.where('observationId').equals(id).delete();
await db.observations.delete(id);
```

### Filtreleme ve Siralama
```js
// Tarih araliginda sorgulama
db.observations.where('createdAt').between(startISO, endISO).toArray();

// Birden fazla duruma gore filtreleme
db.actions.where('status').anyOf(['open', 'in_progress']).toArray();

// Siralanmis liste
db.hazards.orderBy('riskScore').reverse().toArray();
```

## Dikkat Edilecek Noktalar

- `isRead` gibi boolean alanlar icin `.equals(true/false)` yerine `.filter(r => !r.isRead)` kullan
- Buyuk veri setlerinde `.limit(N)` ile sayfalama yap
- `db.on('populate')` sadece DB ilk olusturulurken calisir, sonraki sema guncellemelerinde calismaz
- Foto verileri base64 olarak saklanir, boyut kontrolu yap (max 1200px genislik)
