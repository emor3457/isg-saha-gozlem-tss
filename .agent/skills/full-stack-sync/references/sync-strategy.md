# Senkronizasyon Stratejisi

## Genel Bakis

Uygulama **offline-first** calisir. Tum yazma islemleri once lokal Dexie.js (IndexedDB) veritabanina yapilir, ardindan sunucuya senkronize edilir. Bu sayede internet baglantisi olmadan da tam islevsellik korunur.

## Senkronizasyon Akisi

```
┌─────────────────────────────────────────────────┐
│                   ISLEMCI                        │
│                                                 │
│  Kullanici Islemi                               │
│       │                                         │
│       ▼                                         │
│  Dexie.js'e yaz (lokal)                         │
│       │                                         │
│       ├── Online mi? ──► EVET ──► API'ye gonder │
│       │                           + Socket.io   │
│       │                             broadcast   │
│       │                                         │
│       └── Online mi? ──► HAYIR ─► syncQueue'ya  │
│                                    ekle         │
│                                                 │
│  Online olunca:                                 │
│    syncQueue flush ──► POST /api/v1/sync/push   │
│                                                 │
│  Socket.io event gelince:                       │
│    Dexie.js'e yaz ──► React state guncelle      │
└─────────────────────────────────────────────────┘
```

## SyncQueue Tablosu (Dexie.js)

Mevcut `db.js`'e yeni bir tablo eklenir:

```javascript
syncQueue: '++id, table, localId, operation, timestamp, synced'
```

| Alan | Tip | Aciklama |
|------|-----|----------|
| id | auto | Otomatik artan ID |
| table | string | Tablo adi (observations, actions, vb.) |
| localId | number | Lokal Dexie kayit ID'si |
| operation | string | `create`, `update`, `delete` |
| data | object | Kayit verisi (JSON) |
| timestamp | string | ISO 8601 zaman damgasi |
| synced | boolean | Sunucuya gonderildi mi? |
| retryCount | number | Basarisiz deneme sayisi |

## ID Eslestirme (Local ↔ Server)

Dexie'deki `++id` (auto-increment) ile sunucudaki ID farkli olacaktir. Bunu cozumlemek icin:

**Yaklasim: idMap tablosu**
```javascript
idMap: '++id, table, localId, serverId'
```

- Kayit olusturuldiginda: `localId` atanir, `serverId: null`
- Sunucuya sync edildiginde: sunucu `serverId` doner, `idMap`'e yazilir
- Sonraki guncellemelerde: `idMap` uzerinden `serverId` bulunur

## Cakisma Cozumleme (Conflict Resolution)

### Varsayilan: Last-Write-Wins (LWW)

En basit ve guvenilir yontem. Her kayitta `updatedAt` timestamp alanı bulunur.

```
Cihaz A: updatedAt = 15:30:00  →  "Aciklama: Yangin riski"
Cihaz B: updatedAt = 15:31:00  →  "Aciklama: Elektrik riski"
Sonuc:   Cihaz B kazanir (daha yeni timestamp)
```

### Uygulanisi:

1. Sunucu POST `/sync/push` ile degisiklik alir
2. Ayni `serverId` icin mevcut kaydin `updatedAt` degerini kontrol eder
3. Gelen `updatedAt` > mevcut `updatedAt` ise: guncelle
4. Gelen `updatedAt` <= mevcut `updatedAt` ise: HTTP 409 (Conflict) don
5. 409 durumunda istemci:
   - Sunucudaki gunceli ceker
   - Lokal veriyi sunucu verisi ile degistirir
   - Kullaniciya bildirim gosterir

### Kritik Veriler Icin: Manuel Cozumleme (Opsiyonel)

ISO 45001 acisindan kritik veriler (olay/kaza raporlari, denetim bulgulari) icin cakisma durumunda kullaniciya her iki versiyon gosterilir ve secim yaptirilir:

```javascript
// Conflict modal ornegi
{
  type: 'conflict',
  table: 'incidents',
  localVersion: { ... },
  serverVersion: { ... },
  message: 'Bu kayit baska bir cihazda guncellenmis. Hangi versiyonu tutmak istersiniz?'
}
```

## Sync Durumlari

| Durum | Ikon | Aciklama |
|-------|------|----------|
| synced | ✅ | Sunucu ile esit |
| pending | 🔄 | Sync bekliyor (offline degisiklik) |
| conflict | ⚠️ | Cakisma var, cozumleme gerekli |
| error | ❌ | Sync basarisiz (3 denemeden sonra) |

## Otomatik Sync Tetikleyicileri

1. **Online olma:** `navigator.onLine` → `true` oldugunda `syncQueue` flush
2. **Uygulama acilisi:** Her sayfa yuklendiginde (ilk render) sync kontrol
3. **Periyodik:** Her 30 saniyede bir sync durumu kontrol (online iken)
4. **Manuel:** Kullanici "Simdi Senkronize Et" butonuna bastiginda

## Veri Tutarliligi Kurallari

- Kayitlar `createdAt` ve `updatedAt` alanlari tasimalidir
- Silme islemleri `soft delete` (status: 'deleted') olarak yapilir — fiziksel silme yapilmaz
- Fotoğraflar Base64 olarak sync ediliyor ise boyut siniri (max 2MB/foto) uygulanir
- Toplu sync (batch) bir transaction icinde yapilir — ya tumu basarir ya tumu geri alinir
