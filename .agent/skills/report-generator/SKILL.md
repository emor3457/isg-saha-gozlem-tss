---
name: report-generator
description: ISG raporlari olusturma ve disa aktarma. PDF uygunsuzluk raporu, Excel veri tablosu, istatistik raporu, trend analizi raporu ve denetim raporu uretmek icin kullanilir. Tetiklenme kosullari - PDF rapor olustur, Excel cikti al, uygunsuzluk raporu indir, istatistik raporu, veri disa aktarma, rapor hazirla.
---

# Report Generator

ISG uygulamasinda rapor uretme rehberi. jsPDF ve xlsx kutuphaneleri kullanilir.

## Mevcut Rapor Altyapisi

### Kutuphaneler
- `jspdf` (v2.5.2) - PDF olusturma
- `jspdf-autotable` (v3.8.3) - PDF tablo eklentisi
- `xlsx` (v0.18.5) - Excel dosya olusturma

### Mevcut Rapor Dosyalari
- `src/pages/Reports.jsx` - Genel rapor sayfasi (PDF + Excel export)
- `src/services/nonconformityReportService.js` - Uygunsuzluk raporu PDF

## PDF Rapor Olusturma Kaliplari

### Temel PDF Yapisi
```js
const { default: jsPDF } = await import('jspdf');
const { default: autoTable } = await import('jspdf-autotable');

const doc = new jsPDF('p', 'mm', 'a4');
const W = doc.internal.pageSize.getWidth(); // 210mm
const M = 14; // margin

// Header bar
doc.setFillColor(255, 140, 0); // ISG Turuncusu
doc.rect(0, 0, W, 44, 'F');
doc.setFillColor(255, 215, 0); // Uyari Sarisi
doc.rect(0, 42, W, 3, 'F');

// Baslik
doc.setTextColor(255, 255, 255);
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.text('RAPOR BASLIGI', M, 16);

// Tablo
autoTable(doc, {
  startY: 55,
  head: [['Sutun 1', 'Sutun 2']],
  body: [['Deger 1', 'Deger 2']],
  theme: 'grid',
  headStyles: { fillColor: [255, 140, 0], fontSize: 8.5, fontStyle: 'bold' },
  styles: { fontSize: 8.5, cellPadding: 3 },
  margin: { left: M, right: M }
});

// Footer (her sayfaya)
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('Turkish Technic ISG | Sayfa ' + i + '/' + totalPages, M, 290);
}

doc.save('rapor.pdf');
```

### Imza Alani Ekleme
```js
const sigWidth = (W - 3 * M) / 2;
doc.rect(M, y, sigWidth, 35);
doc.text('Hazirlayan / ISG Uzmani', M + 4, y + 6);
doc.text('Ad Soyad:', M + 4, y + 14);
doc.text('Imza:', M + 4, y + 22);
doc.text('Tarih:', M + 4, y + 30);
```

## Excel Rapor Olusturma

```js
import * as XLSX from 'xlsx';

const wb = XLSX.utils.book_new();
const wsData = [
  ['Baslik 1', 'Baslik 2', 'Baslik 3'],
  ['Veri 1', 'Veri 2', 'Veri 3']
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');
XLSX.writeFile(wb, 'rapor.xlsx');
```

## Rapor Turleri

| Rapor | Dosya | Icerik |
|-------|-------|--------|
| Uygunsuzluk | nonconformityReportService.js | Gozlem + risk + aksiyon + mevzuat |
| Genel Ozet | Reports.jsx | Tum gozlem/aksiyon/tehlike istatistikleri |
| Denetim | (yeni) | Denetim bulgulari + kontrol listesi sonuclari |
| KKD Takip | (yeni) | Ekipman envanteri + zimmet durumu |
| Risk Matrisi | (yeni) | Fine-Kinney risk haritasi goruntusu |

## Marka Standartlari
- Header: Turuncu gradient (#FF8C00 -> #CC7000)
- Accent bar: Sari (#FFD700)
- Tablo basliklari: fillColor [255, 140, 0]
- Font: helvetica (jsPDF built-in)
- Alt bilgi: "Turkish Technic ISG Saha Gozlem Sistemi | ISO 45001 Uyumlu"
