# Organizasyon Yonetimi

## Hiyerarsi Yapisi

```
Organizasyon (Turkish Technic / Firma X)
├── Departman (ISG Birimi)
│   ├── Admin (Tam yetki)
│   ├── ISG Uzmani (Gozlem, risk, denetim, egitim yonetimi)
│   └── Calisan (Gozlem bildirimi, geri bildirim)
├── Departman (Uretim)
│   ├── Departman Yoneticisi
│   └── Calisanlar
└── Departman (Bakim)
    ├── Departman Yoneticisi
    └── Calisanlar
```

## Roller ve Aciklamalari

| Rol | Kod | Aciklama |
|-----|-----|----------|
| Sistem Yoneticisi | `admin` | Organizasyonun tum verilerine ve ayarlarina tam erisim |
| ISG Uzmani | `isg_expert` | Tum ISG modullerini yonetir, rapor olusturur, denetim yapar |
| Departman Yoneticisi | `dept_manager` | Kendi departmanindaki verileri gorur ve yonetir |
| Calisan | `employee` | Gozlem bildirir, egitimlerini gorur, geri bildirim verir |
| Disaridan Denetci | `external_auditor` | Sadece denetim ve bulgu modulune erisir (salt okunur + bulgu ekle) |

## Yetki Matrisi

| Modul | admin | isg_expert | dept_manager | employee | external_auditor |
|-------|-------|------------|--------------|----------|-----------------|
| **Dashboard** | CRUD | Read | Read (dept) | Read (own) | — |
| **Saha Gozlem** | CRUD | CRUD | Read (dept) | Create+Read | Read |
| **Risk Degerlendirme** | CRUD | CRUD | Read | Read | Read |
| **Aksiyon Takip** | CRUD | CRUD | Read+Update (dept) | Read (own) | Read |
| **Olay/Kaza** | CRUD | CRUD | Create+Read (dept) | Create+Read | Read |
| **Egitim Takibi** | CRUD | CRUD | Read (dept) | Read (own) | Read |
| **Denetim** | CRUD | CRUD | Read | — | Create+Read |
| **Dokuman Yonetimi** | CRUD | CRUD | Read | Read | Read |
| **Is Izinleri** | CRUD | CRUD | Create+Read (dept) | Read (own) | — |
| **KKD Takibi** | CRUD | CRUD | Read (dept) | Read (own) | — |
| **Taseron Yonetimi** | CRUD | Read | — | — | — |
| **ISG Kurullari** | CRUD | CRUD | Read | — | — |
| **Acil Durum** | CRUD | CRUD | Read | Read | — |
| **Mevzuat** | CRUD | CRUD | Read | Read | Read |
| **Raporlar** | CRUD | CRUD | Read (dept) | — | Read |
| **Analitik** | CRUD | CRUD | Read (dept) | — | — |
| **Geri Bildirim** | CRUD | CRUD | Read (dept) | Create | — |
| **Ayarlar** | CRUD | Read | — | — | — |
| **Kullanici Yonetimi** | CRUD | Read | — | — | — |

**Kisaltmalar:** C=Create, R=Read, U=Update, D=Delete, (dept)=sadece kendi departmani, (own)=sadece kendi kayitlari

## Veri Izolasyonu

### Organizasyon Seviyesi
- Her API sorgusunda JWT'den `orgId` alinir
- Tum veritabani sorgulari `WHERE orgId = ?` filtresi tasir
- Bir organizasyonun verileri baska organizasyona gorunmez

### Departman Seviyesi
- `dept_manager` rolu icin: `WHERE orgId = ? AND department = ?`
- `employee` rolu icin: `WHERE orgId = ? AND (createdBy = ? OR assignedTo = ?)`

## Kullanici Kayit Akisi

### Ilk Kurulum (Organizasyon Olusturma)
1. Sistem acildiginda organizasyon yoksa "Organizasyon Olustur" ekrani gosterilir
2. Admin kullanici organizasyon adi, kendi adi ve sifresi ile kayit olur
3. Sunucu `organizations` ve `users` tablosuna kayit atar
4. Admin JWT token alir

### Calisan Ekleme
1. Admin "Kullanici Yonetimi" sayfasindan yeni kullanici ekler
2. Kullaniciya rol ve departman atanir
3. Gecici sifre olusturulur (ilk giriste degistirme zorunlu)
4. PIN (4-6 haneli) offline erisim icin tanimlanir

### Offline Giris
- Son basarili JWT token istemcide cache'lenir (encrypted localStorage)
- Offline modda PIN ile dogrulama yapilir
- Online olundugunda token gecerliligi kontrol edilir, suresi dolmussa refresh tetiklenir

## Veritabani Tablolari

### organizations
```sql
CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT,
  sector TEXT,
  employeeCount INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'basic',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orgId INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  pin TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  department TEXT,
  title TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### departments
```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orgId INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  managerId INTEGER REFERENCES users(id),
  parentId INTEGER REFERENCES departments(id),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## RBAC Middleware Ornegi

```javascript
// server/middleware/rbac.js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Yetkisiz erisim' });
    }
    next();
  };
}

function requireDept(req, res, next) {
  // dept_manager sadece kendi departmanini gorebilir
  if (req.user.role === 'dept_manager') {
    req.deptFilter = req.user.department;
  }
  next();
}
```
