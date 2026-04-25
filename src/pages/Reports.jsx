import { useState } from 'react';
import { FileBarChart, Download, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import { getAllObservations } from '../services/observationService';
import { getAllActions } from '../services/actionService';
import { getAllHazards } from '../services/riskService';
import TrendAnalysis from '../components/TrendAnalysis';

/**
 * Türkçe karakterleri jsPDF/XLSX uyumlu ASCII karşılıklarına dönüştürür.
 */
function turkishSafe(text) {
    if (!text) return '';
    const str = String(text);
    return str
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/â/g, 'a').replace(/Â/g, 'A')
        .replace(/î/g, 'i').replace(/Î/g, 'I')
        .replace(/û/g, 'u').replace(/Û/g, 'U');
}

export default function Reports() {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function exportToExcel() {
        setLoading(true);
        try {
            const XLSX = await import('xlsx');
            const [observations, actions, hazards] = await Promise.all([
                getAllObservations(), getAllActions(), getAllHazards()
            ]);

            const wb = XLSX.utils.book_new();

            // Observations sheet
            const obsData = observations.map(o => ({
                'ID': o.id,
                'Tarih': o.date,
                'Alan': o.area,
                'Konum': o.location,
                'Kategori': o.category,
                'Aciklama': o.description,
                'Ciddiyet': o.severity,
                'Durum': o.status,
                'Sorumlu': o.assignedTo,
                'Fotograf Sayisi': o.photoCount || (o.photos?.length || 0),
                'Olusturma': o.createdAt
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(obsData), 'Gozlemler');

            // Actions sheet
            const actData = actions.map(a => ({
                'ID': a.id,
                'Gozlem ID': a.observationId,
                'Aciklama': a.description,
                'Sorumlu': a.responsiblePerson,
                'Vade': a.dueDate,
                'Durum': a.status,
                'Tamamlanma': a.completionDate,
                'Notlar': a.notes,
                'Olusturma': a.createdAt
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actData), 'Aksiyonlar');

            // Hazards sheet
            const hazData = hazards.map(h => ({
                'ID': h.id,
                'Gozlem ID': h.observationId,
                'Tip': h.type,
                'Olasilik': h.probability,
                'Frekans': h.frequency,
                'Siddet': h.severity,
                'Risk Skoru': h.riskScore,
                'Risk Seviyesi': h.riskLabel
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hazData), 'Risk');

            XLSX.writeFile(wb, `ISG_Rapor_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel raporu indirildi');
        } catch (err) {
            toast.error('Rapor oluşturulamadı: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function exportToPDF() {
        setLoading(true);
        try {
            const jspdfModule = await import('jspdf');
            await import('jspdf-autotable');

            // jsPDF constructor — farklı export yöntemlerini dene
            let doc;
            if (jspdfModule.jsPDF) {
                doc = new jspdfModule.jsPDF();
            } else if (typeof jspdfModule.default === 'function') {
                doc = new jspdfModule.default();
            } else if (jspdfModule.default?.jsPDF) {
                doc = new jspdfModule.default.jsPDF();
            } else {
                throw new Error('jsPDF yuklenemedi');
            }

            const [observations, actions, hazards] = await Promise.all([
                getAllObservations(), getAllActions(), getAllHazards()
            ]);

            // Title
            doc.setFontSize(18);
            doc.setTextColor(255, 140, 0);
            doc.text('ISG Saha Gozlem Raporu', 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(turkishSafe(`Turkish Technic | ${new Date().toLocaleDateString('tr-TR')}`), 14, 30);
            doc.text('ISO 45001 Uyumlu Rapor', 14, 36);

            // Summary
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text('Ozet', 14, 48);
            doc.setFontSize(10);
            doc.text(`Toplam Gozlem: ${observations.length}`, 14, 56);
            doc.text(`Toplam Aksiyon: ${actions.length}`, 14, 62);
            doc.text(`Acik Aksiyon: ${actions.filter(a => a.status === 'open' || a.status === 'in_progress').length}`, 14, 68);
            doc.text(`Toplam Tehlike: ${hazards.length}`, 14, 74);

            // Observations table
            if (observations.length > 0 && typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: 84,
                    head: [['#', 'Tarih', 'Alan', 'Aciklama', 'Ciddiyet', 'Durum']],
                    body: observations.map(o => [
                        o.id,
                        turkishSafe(o.date),
                        turkishSafe(o.area),
                        turkishSafe((o.description || '').substring(0, 40)),
                        o.severity,
                        turkishSafe(o.status)
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [255, 140, 0] },
                    styles: { fontSize: 8 }
                });
            }

            // Manuel indirme — doc.save() yerine doğrudan Blob ile
            const fileName = `ISG_Rapor_${new Date().toISOString().split('T')[0]}.pdf`;
            const arrayBuffer = doc.output('arraybuffer');
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Yöntem 1: <a> ile indir
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            // Yöntem 2: Yeni sekmede aç (yedek — dosya inmezse buradan kaydet)
            window.open(url, '_blank');

            setTimeout(() => {
                document.body.removeChild(a);
                // URL'yi hemen silme — yeni sekme kullanıyor olabilir
                setTimeout(() => URL.revokeObjectURL(url), 30000);
            }, 500);

            toast.success('PDF raporu indirildi: ' + fileName);
        } catch (err) {
            console.error('PDF olusturma hatasi:', err);
            toast.error('PDF olusturulamadi: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <FileBarChart size={28} style={{ color: 'var(--color-primary)' }} />
                    Raporlar
                </h1>
                <p className="page-subtitle">İSG verileri ve raporlama</p>
            </div>

            <div className="grid grid-2">
                {/* Excel Export */}
                <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                    <FileSpreadsheet size={48} style={{ color: '#10B981', margin: '0 auto var(--space-md)' }} />
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Excel Raporu</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                        Tüm gözlemler, aksiyonlar ve risk değerlendirmeleri Excel formatında
                    </p>
                    <button className="btn btn-success btn-lg w-full" onClick={exportToExcel} disabled={loading}>
                        <Download size={18} /> {loading ? 'Hazırlanıyor...' : 'Excel İndir (.xlsx)'}
                    </button>
                </div>

                {/* PDF Export */}
                <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                    <FileBarChart size={48} style={{ color: 'var(--color-danger)', margin: '0 auto var(--space-md)' }} />
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>PDF Raporu</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                        Özet rapor ve tablolar PDF formatında
                    </p>
                    <button className="btn btn-danger btn-lg w-full" onClick={exportToPDF} disabled={loading}>
                        <Download size={18} /> {loading ? 'Hazırlanıyor...' : 'PDF İndir'}
                    </button>
                </div>
            </div>

            {/* Fotoğraf Analiz Trendleri */}
            <div className="glass-card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
                    Fotoğraf Analiz Trendleri
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Gözlem fotoğraflarından elde edilen risk metriklerinin zaman içindeki değişimi
                </p>
                <TrendAnalysis />
            </div>
        </div>
    );
}
