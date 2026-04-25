/**
 * Uygunsuzluk Raporu PDF Oluşturma Servisi
 * ISO 45001 Madde 10.2 — Olay, uygunsuzluk ve düzeltici faaliyet
 */
import { HAZARD_CATEGORIES } from '../config/categories';
import { getRegulationsForCategory } from '../config/regulations';
import { getExpertOpinion } from '../config/recommendations';
import { complianceAgent } from './agents/complianceAgent';

/**
 * Türkçe karakterleri jsPDF-uyumlu ASCII karşılıklarına dönüştürür.
 * jsPDF'in varsayılan Helvetica fontu Unicode Türkçe karakterleri desteklemez.
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

/** Tablo verisi için satırdaki tüm hücreleri turkishSafe uygular */
function safeRow(row) {
    return row.map(cell => turkishSafe(cell));
}

/**
 * Gözlem, risk ve aksiyon verilerinden uygunsuzluk raporu PDF'i oluştur
 */
export async function generateNonconformityReport(observation, hazards, actions) {
    const jspdfModule = await import('jspdf');
    await import('jspdf-autotable');

    // jsPDF constructor
    let doc;
    if (jspdfModule.jsPDF) {
        doc = new jspdfModule.jsPDF('p', 'mm', 'a4');
    } else if (typeof jspdfModule.default === 'function') {
        doc = new jspdfModule.default('p', 'mm', 'a4');
    } else if (jspdfModule.default?.jsPDF) {
        doc = new jspdfModule.default.jsPDF('p', 'mm', 'a4');
    } else {
        throw new Error('jsPDF yuklenemedi');
    }
    const W = doc.internal.pageSize.getWidth();
    const M = 14; // margin
    let y = 0;

    const cat = HAZARD_CATEGORIES.find(c => c.id === observation.category);
    const regs = getRegulationsForCategory(observation.category);
    const nowStr = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // AI Compliance Analizi (Surgical Add)
    const aiFindings = await complianceAgent.analyzeObservation(observation);

    // ── HEADER BAR ──
    doc.setFillColor(255, 140, 0);
    doc.rect(0, 0, W, 44, 'F');
    doc.setFillColor(255, 215, 0);
    doc.rect(0, 42, W, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UYGUNSUZLUK RAPORU', M, 16);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('ISO 45001 Madde 10.2 - Olay, Uygunsuzluk ve Duzeltici Faaliyet', M, 25);
    doc.setFontSize(8);
    doc.text(turkishSafe(`Turkish Technic | Rapor Tarihi: ${nowStr}`), M, 33);
    doc.text(`Rapor No: NCR-${observation.id}-${Date.now().toString(36).toUpperCase()}`, M, 39);

    y = 55;

    // ── GOZLEM BILGILERI ──
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. GOZLEM BILGILERI', M, y);
    y += 8;

    const obsInfo = [
        ['Gozlem No', `#${observation.id}`],
        ['Tarih', turkishSafe(observation.date || new Date(observation.createdAt).toLocaleDateString('tr-TR'))],
        ['Alan / Bolge', turkishSafe(observation.area || '-')],
        ['Konum Detayi', turkishSafe(observation.location || '-')],
        ['Kategori', turkishSafe(cat?.label || observation.category || '-')],
        ['Ciddiyet', ['', 'Dusuk', 'Orta', 'Yuksek', 'Kritik'][observation.severity] || '-'],
        ['Sorumlu', turkishSafe(observation.assignedTo || '-')],
        ['Durum', turkishSafe(observation.status || '-')],
        ['Foto Sayisi', `${observation.photos?.length || 0} adet`]
    ];

    doc.autoTable({
        startY: y,
        body: obsInfo,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 80, 80] },
            1: { textColor: [40, 40, 40] }
        },
        margin: { left: M, right: M }
    });
    y = doc.lastAutoTable.finalY + 8;

    // ── ACIKLAMA ──
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Aciklama:', M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const descLines = doc.splitTextToSize(turkishSafe(observation.description || 'Aciklama girilmemis.'), W - 2 * M);
    doc.text(descLines, M, y);
    y += descLines.length * 4.5 + 6;

    // ── MEVZUAT UYUMU (EN ONEMLI MADDE) ──
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('2. YASAL MEVZUAT VE STANDART REFERANSI', M, y);
    y += 8;

    if (aiFindings) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y, W - 2 * M, 22, 'F');
        doc.setFontSize(10);
        doc.setTextColor(30, 27, 75);
        doc.text(turkishSafe(`${aiFindings.regulationCode} Md.${aiFindings.articleNumber}: ${aiFindings.articleTitle}`), M + 4, y + 8);
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const splitSummary = doc.splitTextToSize(turkishSafe(aiFindings.summary), W - 2 * M - 8);
        doc.text(splitSummary, M + 4, y + 14);
        y += 28;
    } else {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Mevzuat atfi bulunamadi.', M, y);
        y += 8;
    }

    // ── RISK DEGERLENDIRMESI ──
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('3. RISK ANALIZI (Fine-Kinney)', M, y);
    y += 8;

    if (hazards.length === 0) {
        doc.setTextColor(100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Risk degerlendirmesi henuz yapilmamistir.', M, y);
        y += 8;
    } else {
        doc.autoTable({
            startY: y,
            head: [['Kaynak', 'Tehlike', 'Risk/Etki', 'P', 'F', 'S', 'Skor', 'Seviye']],
            body: hazards.map((h, i) => safeRow([
                h.hazardSource || '-',
                h.hazardDescription || '-',
                h.potentialImpact || '-',
                String(h.probability),
                String(h.frequency),
                String(h.severity),
                String(h.riskScore),
                h.riskLabel
            ])),
            theme: 'grid',
            headStyles: { fillColor: [255, 140, 0], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 7.5, cellPadding: 2, halign: 'center' },
            columnStyles: {
                0: { halign: 'left', cellWidth: 25 },
                1: { halign: 'left', cellWidth: 35 },
                2: { halign: 'left', cellWidth: 35 },
                6: { fontStyle: 'bold' }
            },
            margin: { left: M, right: M }
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // ── ISG UZMAN ONERISI ──
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ISG UZMAN ONERISI', M, y);
    y += 8;

    if (hazards.length > 0) {
        const maxRisk = hazards.reduce((max, h) => h.riskScore > max.riskScore ? h : max, hazards[0]);
        const opinion = getExpertOpinion(observation.category, maxRisk.riskLevel, maxRisk.riskScore);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(turkishSafe(opinion.title), M, y);
        y += 6;

        opinion.recommendations.forEach((rec, i) => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(turkishSafe(`${i + 1}. ${rec}`), M + 4, y);
            y += 5;
        });

        y += 3;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(turkishSafe(`Onerilen tamamlanma suresi: ${opinion.suggestedDeadlineDays} gun`), M, y);
        y += 8;
    } else {
        doc.setTextColor(100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Risk degerlendirmesi yapildiktan sonra uzman onerisi olusturulacaktir.', M, y);
        y += 8;
    }

    // ── AKSIYONLAR ──
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DUZELTICI FAALIYETLER / AKSIYONLAR', M, y);
    y += 8;

    if (actions.length === 0) {
        doc.setTextColor(100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Henuz duzeltici faaliyet planlanmamistir.', M, y);
        y += 8;
    } else {
        doc.autoTable({
            startY: y,
            head: [['#', 'Aciklama', 'Sorumlu', 'Vade', 'Durum']],
            body: actions.map((a, i) => safeRow([
                String(i + 1),
                (a.description || '').substring(0, 50),
                a.responsiblePerson || '-',
                a.dueDate ? new Date(a.dueDate).toLocaleDateString('tr-TR') : '-',
                a.status === 'open' ? 'Acik' : a.status === 'completed' ? 'Tamamlandi' : a.status === 'in_progress' ? 'Devam' : a.status === 'overdue' ? 'Gecikmis' : a.status
            ])),
            theme: 'grid',
            headStyles: { fillColor: [255, 140, 0], fontSize: 8.5, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            margin: { left: M, right: M }
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── MEVZUAT ATIFLARI ──
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(255, 140, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('5. MEVZUAT ATIFLARI', M, y);
    y += 8;

    if (regs.length > 0) {
        const regRows = [];
        regs.forEach(reg => {
            reg.articles.forEach(art => {
                regRows.push(safeRow([reg.code, art.number, art.title, art.summary.substring(0, 60)]));
            });
        });

        doc.autoTable({
            startY: y,
            head: [['Mevzuat', 'Madde', 'Baslik', 'Ozet']],
            body: regRows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 7.5, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 15 },
                2: { cellWidth: 40 }
            },
            margin: { left: M, right: M }
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── IMZA ALANI ──
    if (y > 240) { doc.addPage(); y = 20; }
    y += 5;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);

    const sigWidth = (W - 3 * M) / 2;
    // Sol imza
    doc.rect(M, y, sigWidth, 35);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'bold');
    doc.text('Hazirlayan / ISG Uzmani', M + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('Ad Soyad:', M + 4, y + 14);
    doc.text('Imza:', M + 4, y + 22);
    doc.text('Tarih:', M + 4, y + 30);

    // Sağ imza
    const sigX = M + sigWidth + M;
    doc.rect(sigX, y, sigWidth, 35);
    doc.setFont('helvetica', 'bold');
    doc.text('Onaylayan / Yonetici', sigX + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('Ad Soyad:', sigX + 4, y + 14);
    doc.text('Imza:', sigX + 4, y + 22);
    doc.text('Tarih:', sigX + 4, y + 30);

    y += 42;

    // ── FOOTER ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Turkish Technic ISG Saha Gozlem Sistemi | ISO 45001 Uyumlu | Sayfa ${i}/${totalPages}`,
            M, doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
            'Bu rapor gizli bilgi icerir. Yetkisiz kisilere dagitilamaz.',
            M, doc.internal.pageSize.getHeight() - 4
        );
    }

    // Manuel indirme
    const fileName = `Uygunsuzluk_Raporu_${observation.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    const arrayBuffer = doc.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Yeni sekmede de aç (yedek)
    window.open(url, '_blank');

    setTimeout(() => {
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 500);
    return fileName;
}
