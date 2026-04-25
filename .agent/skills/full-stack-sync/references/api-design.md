# API Tasarimi ve Endpoint Semasi

## Base URL
```
http://<host>:<port>/api/v1
```

## Kimlik Dogrulama (Auth)

| Method | Endpoint | Aciklama | Yetki |
|--------|----------|----------|-------|
| POST | `/auth/register` | Yeni kullanici kaydi | Public (ilk admin) |
| POST | `/auth/login` | JWT token al | Public |
| POST | `/auth/refresh` | Token yenile | Authenticated |
| GET | `/auth/me` | Mevcut kullanici bilgisi | Authenticated |
| PUT | `/auth/password` | Sifre degistir | Authenticated |

**JWT Token Yapisi:**
```json
{
  "userId": 1,
  "orgId": 1,
  "role": "admin",
  "department": "ISG",
  "deviceId": "uuid-v4",
  "iat": 1709312400,
  "exp": 1709398800
}
```

## CRUD Endpoint'leri

Asagidaki pattern tum moduller icin tekrarlanir. `<resource>` yerine modul adi gelir:

| Method | Endpoint | Aciklama | Yetki |
|--------|----------|----------|-------|
| GET | `/<resource>` | Tum kayitlari listele (orgId filtreli) | Authenticated |
| GET | `/<resource>/:id` | Tek kayit getir | Authenticated |
| POST | `/<resource>` | Yeni kayit olustur | Role-based |
| PUT | `/<resource>/:id` | Kayit guncelle | Role-based |
| DELETE | `/<resource>/:id` | Kayit sil | Admin / ISG Uzmani |

### Resource Listesi

| Resource | Endpoint Prefix | Olusturma Yetkisi |
|----------|----------------|-------------------|
| observations | `/observations` | Tum roller |
| hazards | `/hazards` | ISG Uzmani, Admin |
| actions | `/actions` | ISG Uzmani, Admin |
| incidents | `/incidents` | Tum roller |
| trainings | `/trainings` | ISG Uzmani, Admin |
| training-records | `/training-records` | ISG Uzmani, Admin |
| documents | `/documents` | ISG Uzmani, Admin |
| audits | `/audits` | Denetci, Admin |
| audit-findings | `/audit-findings` | Denetci, Admin |
| work-permits | `/work-permits` | ISG Uzmani, Admin |
| ppe-assignments | `/ppe-assignments` | ISG Uzmani, Admin |
| contractors | `/contractors` | Admin |
| committees | `/committees` | Admin |
| employees | `/employees` | Admin, ISG Uzmani |
| feedback | `/feedback` | Tum roller |
| emergency-plans | `/emergency-plans` | ISG Uzmani, Admin |
| drills | `/drills` | ISG Uzmani, Admin |

## Senkronizasyon Endpoint'leri

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | `/sync/push` | Istemciden sunucuya toplu degisiklik gonder |
| GET | `/sync/pull?since=<timestamp>` | Son sync'ten bu yana olan degisiklikleri al |
| GET | `/sync/status` | Sunucu sync durumu ve versiyon bilgisi |

### Push Payload Formati
```json
{
  "deviceId": "uuid-v4",
  "changes": [
    {
      "table": "observations",
      "localId": 5,
      "operation": "create",
      "data": { ... },
      "timestamp": "2026-03-01T15:30:00.000Z"
    },
    {
      "table": "actions",
      "localId": 12,
      "serverId": 45,
      "operation": "update",
      "data": { ... },
      "timestamp": "2026-03-01T15:31:00.000Z"
    }
  ]
}
```

### Pull Response Formati
```json
{
  "changes": [
    {
      "table": "observations",
      "serverId": 101,
      "operation": "create",
      "data": { ... },
      "timestamp": "2026-03-01T15:32:00.000Z"
    }
  ],
  "serverTimestamp": "2026-03-01T15:35:00.000Z"
}
```

## Organizasyon Yonetimi Endpoint'leri

| Method | Endpoint | Aciklama | Yetki |
|--------|----------|----------|-------|
| GET | `/org` | Organizasyon bilgisi | Authenticated |
| PUT | `/org` | Organizasyon guncelle | Admin |
| GET | `/org/departments` | Departman listesi | Authenticated |
| POST | `/org/departments` | Departman ekle | Admin |
| GET | `/org/users` | Kullanici listesi | Admin, ISG Uzmani |
| POST | `/org/users` | Kullanici ekle | Admin |
| PUT | `/org/users/:id` | Kullanici guncelle (rol/departman) | Admin |
| DELETE | `/org/users/:id` | Kullanici pasifize et | Admin |

## WebSocket Event'leri (Socket.io)

### Istemci → Sunucu
| Event | Payload | Aciklama |
|-------|---------|----------|
| `join-org` | `{ orgId, token }` | Organizasyon odasina katil |
| `record-change` | `{ table, operation, data }` | Tek kayit degisikligi bildir |

### Sunucu → Istemci
| Event | Payload | Aciklama |
|-------|---------|----------|
| `record-created` | `{ table, serverId, data }` | Yeni kayit olusturuldu |
| `record-updated` | `{ table, serverId, data }` | Kayit guncellendi |
| `record-deleted` | `{ table, serverId }` | Kayit silindi |
| `sync-required` | `{ reason }` | Tam senkronizasyon gerekli |
| `user-online` | `{ userId, deviceId }` | Kullanici cevrimici oldu |
| `user-offline` | `{ userId, deviceId }` | Kullanici cevrimdisi oldu |

### Oda (Room) Yapisi
- Her organizasyon kendi Socket.io room'unda: `org:<orgId>`
- Veri izolasyonu: Bir organizasyonun verileri baska organizasyona iletilmez
- Kullanici baglanti durumu room icinde izlenir

## Hata Kodlari

| HTTP Kodu | Anlami | Ornek |
|-----------|--------|-------|
| 400 | Gecersiz istek | Eksik zorunlu alan |
| 401 | Kimlik dogrulanamadi | Gecersiz/suresi dolmus token |
| 403 | Yetkisiz erisim | Rolun izin vermedigi islem |
| 404 | Kayit bulunamadi | Silinmis veya baska org'a ait kayit |
| 409 | Cakisma | Sync conflict — istemciye cozumleme bilgisi doner |
| 429 | Cok fazla istek | Rate limiting |
| 500 | Sunucu hatasi | Beklenmeyen hata |
