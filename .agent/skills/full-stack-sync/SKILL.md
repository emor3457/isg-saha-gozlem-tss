---
name: full-stack-sync
description: ISG uygulamasini full-stack mimariye donusturmek, telefon ve PC arasinda es zamanli veri senkronizasyonu saglamak ve organizasyonel (coklu kullanici, departman, rol) yapiya kavusturmak icin kullanilir. Backend API olusturma, WebSocket ile gercek zamanli sync, offline-online cakisma cozumleme, organizasyon yonetimi ve coklu cihaz destegi islemleri icin tetiklenir. Tetiklenme kosullari - backend kur, API olustur, sunucu yaz, sync yap, senkronizasyon, coklu cihaz, telefonda goster, organizasyon yonetimi, kullanici rolleri, departman ekle, full stack, realtime, gercek zamanli.
---

# Full-Stack Sync

ISG Saha Gozlem uygulamasini (Vite + React + Dexie.js) tamamen full-stack bir mimariye donusturerek; birden fazla cihazda (telefon, PC, tablet) es zamanli veri gorunturlemeyi ve bir organizasyon icerisinde coklu kullanici yonetimini saglar.

## Mevcut Mimari

Uygulama su anda **offline-first PWA** olarak calisir:
- Frontend: Vite + React 18 + React Router 6
- Veritabani: Dexie.js (IndexedDB) — istemci tarafinda, 30+ tablo
- Sunucu: `server.cjs` — sadece statik dosya sunumu (API yok)
- Auth: Offline PIN dogrulamasi (AuthContext)

## Hedef Mimari

```
Istemciler (Ayni React PWA)         Backend (Node.js)
 📱 Telefon ─┐                    ┌─ Express.js REST API
 💻 PC ──────┼── HTTP/WS ────────►├─ Socket.io (Realtime)
 📱 Tablet ──┘                    ├─ JWT Authentication
                                  └─ SQLite/PostgreSQL DB
```

## Uygulama Adimlari

### Adim 1: Backend Altyapisi Kurulumu

Proje kokunde `server/` dizini olustur:

```
server/
├── index.js          — Ana giris noktasi (Express + Socket.io)
├── config/
│   └── db.js         — Veritabani baglantisi (better-sqlite3 veya pg)
├── middleware/
│   ├── auth.js       — JWT dogrulama middleware
│   └── rbac.js       — Rol bazli erisim kontrolu
├── routes/
│   ├── auth.js       — Login/Register/Refresh token
│   ├── observations.js
│   ├── incidents.js
│   ├── trainings.js
│   ├── actions.js
│   └── sync.js       — Bulk sync endpoint'leri
├── models/           — Veritabani modelleri / sorgulari
├── socket/
│   └── handlers.js   — Socket.io event handler'lari
└── utils/
    └── helpers.js
```

**Bagimlilıklar:**
```bash
npm install express cors helmet jsonwebtoken bcryptjs better-sqlite3 socket.io dotenv
```

**Ana sunucu yapilandirmasi (server/index.js):**
- Express uygulamasi olustur
- CORS, helmet, JSON middleware ekle
- Route'lari bagla
- Socket.io'yu HTTP sunucusuna entegre et
- `0.0.0.0` uzerinden dinle (LAN erisimi icin)
- JWT secret'i `.env` dosyasindan oku

Detayli API tasarimi icin bkz: [references/api-design.md](references/api-design.md)

### Adim 2: Veritabani (Sunucu Tarafi)

Mevcut Dexie.js semasi referans alinarak sunucu veritabaninda karsilik gelen tablolar olusturulur.

**Baslangic icin SQLite (better-sqlite3) onerilir:**
- Kurulum gerektirmez, tek dosya
- Kucuk-orta olcekli organizasyonlar icin yeterli
- Gerektiginde PostgreSQL'e gecis yapilabilir

**Kritik tablolar:**
- `organizations` — orgId, name, domain, plan, createdAt
- `users` — id, orgId, name, email, passwordHash, role, department, status
- `sync_log` — id, userId, deviceId, tableName, recordLocalId, recordServerId, operation, timestamp, conflictResolved

Her tabloya `orgId` kolonu eklenerek veri izolasyonu saglanir. Detaylar icin bkz: [references/api-design.md](references/api-design.md)

### Adim 3: Gercek Zamanli Senkronizasyon

Senkronizasyon stratejisi 3 katmandan olusur:

1. **SyncQueue (istemci):** Offline yapilan degisiklikleri biriktiren Dexie tablosu
2. **REST Bulk Sync:** Online olundugunda kuyrukun sunucuya POST edilmesi
3. **WebSocket (Socket.io):** Online iken anlik degisikliklerin yayin (broadcast) edilmesi

**Cakisma cozumleme:** Varsayilan olarak `last-write-wins` (son yazan kazanir, `updatedAt` timestamp bazli). Kritik veriler icin UI'da kullaniciya secim sunulabilir.

Detayli strateji icin bkz: [references/sync-strategy.md](references/sync-strategy.md)

### Adim 4: Frontend Adaptasyonu

Mevcut servis dosyalari (`observationService.js`, `trainingService.js` vb.) bir **SyncService** katmani ile sarmalanir:

```javascript
// src/services/syncService.js — Temel mantik:
// 1. Veriyi once Dexie'ye (lokal) yaz (offline destek)
// 2. Online ise API'ye de gonder
// 3. Offline ise syncQueue'ya ekle
// 4. Socket.io ile diger cihazlara yayin yap (broadcast)
```

**AuthContext guncellemesi:**
- Mevcut offline PIN → sunucu JWT dogrulamasina gecis
- Offline modda son basarili JWT cache'den kullanilir
- Token refresh mekanizmasi eklenir

**Online/Offline mod yonetimi:**
- Mevcut `navigator.onLine` altyapisi kullanilir
- Online olundugunda `syncQueue` otomatik flush edilir
- Baska cihazdan gelen Socket.io event'leri Dexie'ye yazilir → React state guncellenir

### Adim 5: Organizasyon Yonetimi

Coklu kullanici ve departman yapisi icin:

**Roller:** Admin, ISG Uzmani, Departman Yoneticisi, Calisan, Disaridan Denetci
**Yetki matrisi:** Her rol icin hangi modulleri (CRUD) kullanabilecegi tanimlanir

Detayli yetki matrisi icin bkz: [references/org-management.md](references/org-management.md)

### Adim 6: LAN / Ag Erisimi

Ayni Wi-Fi agindaki cihazlarin uygulamaya erismesi icin:
- Sunucu `0.0.0.0` uzerinden dinler
- Istemciler `http://<sunucu-ip>:PORT` ile erisir
- `vite.config.js`'e `server.host: '0.0.0.0'` eklenir (gelistirme icin)
- Production'da `server/index.js` hem API hem statik dosyalari sunar

## Dikkat Edilecek Hususlar

- ⚠️ Tum API endpoint'leri JWT ile korunmali
- ⚠️ Organizasyon verileri birbirinden izole tutulmali (`orgId` filtresi)
- ⚠️ KVKK geregi kisisel veriler (calisan bilgileri) encrypt edilmeli
- ⚠️ Offline moddaki veri butunlugu icin `syncQueue` guvenilir olmali
- ✅ Mevcut Dexie.js yapisini koru — offline-first mimari bozulmamali
- ✅ ISO 45001 veri tutumluluk gereksinimlerini karsilamali
- ✅ Socket.io room'lari organizasyon bazli olmali (veri sizintisi onleme)
