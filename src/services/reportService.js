/**
 * Report Service - ISG Saha Gözlem Sistemi
 * ISO 45001 uyumlu analitik raporların dışa aktarımı.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * KPI verilerini PDF olarak dışa aktarır.
 * @param {Object} stats KPI verileri
 */
export function exportAnalyticsToPDF(stats) {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('tr-TR');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 140, 0); // Turkish Technic Orange
    doc.text('ISG PERFORMANS RAPORU', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${now}`, 105, 30, { align: 'center' });
    doc.text('ISO 45001:2018 Sürekli İyileştirme Verileri', 105, 35, { align: 'center' });

    // KPI Summary Table
    const tableData = [
        ['İş Kazası Yaşanmayan Gün', `${stats.daysWithoutLTI} Gün`],
        ['Genel Mevzuat Uyum Oranı', `%${stats.complianceRate}`],
        ['Aksiyon Kapatma Hızı', `%${stats.actionClosureRate}`],
        ['Toplam Saha Gözlemi', stats.totalObs],
        ['Tespit Edilen Ramak Kala', stats.nearMisses],
        ['Kayıp Günlü Kaza (LTI)', stats.lti],
        ['Kaza Sıklık Oranı (KSO)', stats.kso || '0.00'],
        ['Kaza Ağırlık Oranı (KAO)', stats.kao || '0.00']
    ];

    doc.autoTable({
        startY: 45,
        head: [['Performans Göstergesi (KPI)', 'Değer']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillStyle: [255, 140, 0] }
    });

    // Recommendations
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Yönetim Gözden Geçirme Notları', 14, finalY);
    
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(
        `Aksiyon kapatma hızı ${stats.actionClosureRate < 80 ? 'kritik seviyededir, hızlandırılmalıdır.' : 'hedeflerle uyumludur.'} ` +
        `Kaza sıklık oranı ${stats.kso > 5 ? 'sektör ortalamasının üzerindedir, proaktif önlemler artırılmalıdır.' : 'başarılı bir seviyededir.'} ` +
        `Saha gözlem liderliği ${stats.totalObs} adet bildirimle iş sağlığı ve güvenliği kültürünün geliştiğini göstermektedir.`,
        180
    );
    doc.text(splitText, 14, finalY + 7);

    doc.save(`ISG_Performans_Raporu_${now.replace(/\./g, '_')}.pdf`);
}

/**
 * KPI verilerini Excel olarak dışa aktarır.
 * @param {Object} stats KPI verileri
 */
export function exportAnalyticsToExcel(stats) {
    const data = [
        { Parametre: 'Rapor Tarihi', Değer: new Date().toLocaleDateString('tr-TR') },
        { Parametre: 'İş Kazası Yaşanmayan Gün', Değer: stats.daysWithoutLTI },
        { Parametre: 'Mevzuat Uyum Oranı (%)', Değer: stats.complianceRate },
        { Parametre: 'Aksiyon Kapatma Hızı (%)', Değer: stats.actionClosureRate },
        { Parametre: 'Toplam Gözlem', Değer: stats.totalObs },
        { Parametre: 'Ramak Kala', Değer: stats.nearMisses },
        { Parametre: 'Kayıp Günlü Kaza', Değer: stats.lti },
        { Parametre: 'KSO', Değer: stats.kso },
        { Parametre: 'KAO', Değer: stats.kao }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI");
    XLSX.writeFile(wb, `ISG_KPI_Ozeti_${new Date().toISOString().split('T')[0]}.xlsx`);
}
