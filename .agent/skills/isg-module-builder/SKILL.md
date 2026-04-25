---
name: isg-module-builder
description: ISG Saha Gozlem uygulamasina yeni moduller (sayfa, servis, konfigurasyon) eklemek icin kullanilir. Yeni bir sayfa, yeni bir servis dosyasi veya yeni bir konfigurasyon modulu olusturulmasi gerektiginde bu skill tetiklenir. Ornekler - yeni bir KKD Takip modulu ekle, Denetim sayfasi olustur, Egitim takip servisi yaz.
---

# ISG Module Builder

Bu proje Turkish Technic icin ISO 45001 uyumlu bir ISG Saha Gozlem PWA uygulamasidir. Yeni modul eklerken asagidaki kaliplara uyulmalidir.

## Proje Mimarisi

```
src/
  pages/          -> React sayfa bilesenleri (.jsx)
  services/       -> IndexedDB (Dexie.js) veri islemleri (.js)
  config/         -> Sabit veriler, kategoriler, parametreler (.js)
  components/     -> Tekrar kullanilabilir UI bilesenleri (.jsx)
  database/db.js  -> Dexie.js veritabani semasi
```

## Yeni Modul Ekleme Adimlari

### 1. Veritabani Semasini Guncelle
`src/database/db.js` dosyasinda yeni tablo ekle:
```js
db.version(N).stores({
  // mevcut tablolar...
  yeniTablo: '++id, field1, field2, createdAt'
});
```
Versiyon numarasini bir artir.

### 2. Servis Dosyasi Olustur
`src/services/yeniService.js` dosyasini olustur. Mevcut kalip:
```js
import db from '../database/db';

export async function createItem(data) {
  const item = { ...data, createdAt: new Date().toISOString() };
  const id = await db.yeniTablo.add(item);
  return { ...item, id };
}
export async function getAllItems() {
  return db.yeniTablo.orderBy('createdAt').reverse().toArray();
}
export async function getItemById(id) { return db.yeniTablo.get(id); }
export async function updateItem(id, changes) {
  await db.yeniTablo.update(id, { ...changes, updatedAt: new Date().toISOString() });
  return db.yeniTablo.get(id);
}
export async function deleteItem(id) { await db.yeniTablo.delete(id); }
```

### 3. Konfigurasyon Dosyasi (Gerekiyorsa)
`src/config/yeniConfig.js` — Sabit kategoriler, durumlar, parametreler:
```js
export const YENI_KATEGORILER = [
  { id: 'kat1', label: 'Kategori 1', icon: 'emoji', color: '#hex' }
];
```

### 4. Sayfa Bileseni Olustur
`src/pages/YeniSayfa.jsx` kalip yapisi:
```jsx
import { useState, useEffect } from 'react';
import { useToast } from '../components/Common/Toast';
// lucide-react ikonlari import et

export default function YeniSayfa() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      // servis fonksiyonlarini cagir
      setLoading(false);
    } catch { toast.error('Veri yuklenemedi'); setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title"><Icon size={28} /> Baslik</h2>
        <p className="page-subtitle">Aciklama</p>
      </div>
      {/* Icerik */}
    </div>
  );
}
```

### 5. Route Ekle
`src/App.jsx` dosyasina import ve Route ekle:
```jsx
import YeniSayfa from './pages/YeniSayfa';
// Routes icinde:
<Route path="/yeni-yol" element={<YeniSayfa />} />
```

### 6. Navigasyona Ekle
`src/components/Layout/AppLayout.jsx` dosyasinda `navItems` dizisine ekle:
```js
{ path: '/yeni-yol', label: 'Yeni Modul', icon: LucideIcon }
```

## Tasarim Kurallari
- Dark tema: `--bg-primary: #0f172a`, `--bg-secondary: #1e293b`
- Birincil renk: `--color-primary: #FF8C00` (Guvenlik Turuncusu)
- Glass kartlar: `className="glass-card"` kullan
- Responsive: Mobile-first, `grid-2`, `grid-3`, `grid-4` CSS siniflari
- Dil: Tum metin Turkce
- Butonlar: `btn btn-primary`, `btn btn-secondary`, `btn btn-danger`
- Form: `form-group`, `form-label`, `form-input`, `form-select`
- Modal: `modal-overlay` > `modal-content` > `modal-header` + `modal-body` + `modal-footer`

## Build ve Test
Degisikliklerden sonra: `npx vite build` ile build kontrol et, `BASLAT.bat` ile test et.
