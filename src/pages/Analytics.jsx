import { useState, useEffect } from 'react';
import {
    Activity, TrendingUp, TrendingDown, Target, Award,
    AlertCircle, ShieldCheck, CheckCircle, FileText, Download, Share2
} from 'lucide-react';
import { useToast } from '../components/Common/Toast';
import { getAllObservations } from '../services/observationService';
import { getAllActions } from '../services/actionService';
import { getAllIncidents } from '../services/incidentService';
import { getComplianceStats } from '../services/regulationService';
import { exportAnalyticsToPDF, exportAnalyticsToExcel } from '../services/reportService';
import TrendAnalysis from '../components/TrendAnalysis';
import PredictiveRiskPanel from '../components/PredictiveRiskPanel';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalObs: 0, openObs: 0, actionClosureRate: 0,
        incidents: 0, nearMisses: 0, lti: 0,
        complianceRate: 0, daysWithoutLTI: 0,
        kso: '0.00', kao: '0.00'
    });
    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [obs, act, inc, comp] = await Promise.all([
                getAllObservations(), getAllActions(), getAllIncidents(), getComplianceStats()
            ]);

            const completedActions = act.filter(a => a.status === 'completed' || a.status === 'closed').length;
            const actionRate = act.length > 0 ? Math.round((completedActions / act.length) * 100) : 0;

            const nearMiss = inc.filter(i => i.type === 'near_miss').length;
            const kayipGunluKazalar = inc.filter(i => i.type === 'lti').sort((a, b) => new Date(b.date) - new Date(a.date));

            // KSO / KAO Hesaplama (Varsayılan 100 çalışan, ayda 180 saat üzerinden ~18.000 saat)
            const toplamCalismaSaati = 18000; 
            const kso = ((inc.length * 1000000) / toplamCalismaSaati).toFixed(2);
            const kao = ((kayipGunluKazalar.length * 5 * 1000) / toplamCalismaSaati).toFixed(2); // Her LTI için varsayılan 5 gün kayıp

            let daysWithout = 0;
            if (kayipGunluKazalar.length > 0) {
                const lastLtiDate = new Date(kayipGunluKazalar[0].date);
                daysWithout = Math.floor((new Date() - lastLtiDate) / (1000 * 60 * 60 * 24));
            } else {
                daysWithout = 365; 
            }

            const compRate = comp.totalEvaluated > 0 ? Math.round((comp.compliant / comp.totalEvaluated) * 100) : 0;

            setStats({
                totalObs: obs.length,
                openObs: obs.filter(o => o.status !== 'closed' && o.status !== 'action_taken').length,
                actionClosureRate: actionRate,
                incidents: inc.length,
                nearMisses: nearMiss,
                lti: kayipGunluKazalar.length,
                complianceRate: compRate,
                daysWithoutLTI: daysWithout,
                kso,
                kao
            });

        } catch (e) {
            toast.error('KPI Verileri Yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    const handleExportPDF = () => {
        try {
            exportAnalyticsToPDF(stats);
            toast.success('PDF Raporu Hazırlandı');
        } catch (e) {
            toast.error('PDF oluşturma hatası');
        }
    };

    const handleExportExcel = () => {
        try {
            exportAnalyticsToExcel(stats);
            toast.success('Excel Verisi İndirildi');
        } catch (e) {
            toast.error('Excel oluşturma hatası');
        }
    };

    if (loading) {
        return <div className="page p-8 text-center text-muted">KPI Dashboard Hazırlanıyor...</div>;
    }

    return (
        <div className="page">
            <div className="page-header flex justify-between items-center gap-md">
                <div>
                    <h1 className="page-title">
                        <TrendingUp size={28} style={{ color: 'var(--color-success)' }} />
                        Sürekli İyileştirme (KPI Dashboard)
                    </h1>
                    <p className="page-subtitle">ISO 45001 Madde 10.3 — Performans İzleme ve Trend Analizi</p>
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary" onClick={handleExportExcel}>
                        <Download size={16} /> Excel Çıktısı
                    </button>
                    <button className="btn btn-primary" onClick={handleExportPDF}>
                        <FileText size={16} /> PDF Raporu Al
                    </button>
                </div>
            </div>

            {/* Top KPI Banner */}
            <div className="glass-card mb-4 grid grid-3 gap-md" style={{ padding: 'var(--space-md) var(--space-xl)', background: 'linear-gradient(90deg, var(--bg-secondary) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-md">
                    <Award size={40} style={{ color: 'var(--color-success)' }} />
                    <div>
                        <div className="text-muted font-medium text-xs">İş Kazası Yaşanmayan Gün</div>
                        <div className="font-bold text-2xl" style={{ color: 'var(--color-success)' }}>{stats.daysWithoutLTI} Gün</div>
                    </div>
                </div>
                <div className="flex items-center gap-md border-x px-4" style={{ borderColor: 'var(--border-color)' }}>
                    <Activity size={40} style={{ color: 'var(--color-danger)' }} />
                    <div>
                        <div className="text-muted font-medium text-xs">Kaza Sıklık Oranı (KSO)</div>
                        <div className="font-bold text-2xl" style={{ color: 'var(--color-danger)' }}>{stats.kso}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-muted font-medium text-xs">Genel Mevzuat Uyum Oranı</div>
                    <div className="font-bold text-2xl" style={{ color: 'var(--color-info)' }}>%{stats.complianceRate}</div>
                </div>
            </div>

            {/* AI Predictive Analytics Section */}
            <div className="mb-4">
                <PredictiveRiskPanel />
            </div>

            <div className="grid grid-4 gap-md mb-4">
                {/* DÖF / Aksiyon Performansı */}
                <div className="glass-card p-4 flex flex-col items-center text-center">
                    <Activity size={28} style={{ color: 'var(--color-primary)', marginBottom: 12 }} />
                    <div className="text-xl font-bold mb-1">%{stats.actionClosureRate}</div>
                    <div className="text-muted text-xs font-medium">Aksiyon Kapatma Hızı</div>
                </div>

                {/* Tehlike İstihbaratı (Ramak Kala) */}
                <div className="glass-card p-4 flex flex-col items-center text-center">
                    <Target size={28} style={{ color: 'var(--color-warning)', marginBottom: 12 }} />
                    <div className="text-xl font-bold mb-1">{stats.nearMisses}</div>
                    <div className="text-muted text-xs font-medium">Ramak Kala Bildirimi</div>
                </div>

                {/* Proaktif Gözlem Liderliği */}
                <div className="glass-card p-4 flex flex-col items-center text-center">
                    <ShieldCheck size={28} style={{ color: 'var(--color-info)', marginBottom: 12 }} />
                    <div className="text-xl font-bold mb-1">{stats.totalObs}</div>
                    <div className="text-muted text-xs font-medium">Saha Gözlem Sayısı</div>
                </div>

                {/* Kaza Ağırlık Oranı */}
                <div className="glass-card p-4 flex flex-col items-center text-center">
                    <TrendingDown size={28} style={{ color: 'var(--color-danger)', marginBottom: 12 }} />
                    <div className="text-xl font-bold mb-1">{stats.kao}</div>
                    <div className="text-muted text-xs font-medium">Kaza Ağırlık Oranı (KAO)</div>
                </div>
            </div>

            <div className="grid grid-2 gap-md">
                <div className="glass-card p-4">
                    <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><TrendingUp size={18} className="text-primary" /> Risk Trend Analizi</h3>
                    <TrendAnalysis />
                </div>
                <div className="glass-card p-4">
                    <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><AlertCircle size={18} className="text-warning" /> Yönetim Gözden Geçirme Notları</h3>
                    <ul className="flex flex-col gap-sm">
                        <li className="flex items-start gap-sm bg-secondary p-3 rounded-md">
                            <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                            <div className="text-sm">
                                <strong className="block text-primary">Performans Özeti:</strong> 
                                Aksiyon kapatma hızı %{stats.actionClosureRate}. {stats.actionClosureRate < 80 ? 'Kritik seviye, hızlandırılmalı.' : 'Hedeflerle uyumlu.'}
                            </div>
                        </li>
                        <li className="flex items-start gap-sm bg-secondary p-3 rounded-md">
                            <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                            <div className="text-sm">
                                <strong className="block text-primary">İSG Kültürü:</strong> 
                                {stats.nearMisses} ramak kala ve {stats.totalObs} saha gözlemi ile çalışan katılımı yüksek seviyede.
                            </div>
                        </li>
                        <li className="flex items-start gap-sm bg-secondary p-3 rounded-md">
                            <CheckCircle size={16} className={stats.complianceRate < 70 ? "text-danger mt-1 flex-shrink-0" : "text-warning mt-1 flex-shrink-0"} />
                            <div className="text-sm">
                                <strong className="block text-primary">Mevzuat Uyumu:</strong> 
                                Mevcut uyum oranı %{stats.complianceRate}. ISO 45001 denetimleri öncesi eksik değerlendirmeler tamamlanmalı.
                            </div>
                        </li>
                        <li className="flex items-start gap-sm bg-secondary p-3 rounded-md border-t mt-2 pt-4">
                            <Share2 size={16} className="text-info mt-1 flex-shrink-0" />
                            <div className="text-sm italic text-muted">Bu veriler Dexie.js yerel veritabanı üzerinden anlık olarak hesaplanmıştır.</div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
