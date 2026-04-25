import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, MapPin, ArrowRight, ShieldAlert } from 'lucide-react';
import { getPredictiveRiskData, getRiskLevelFromScore } from '../services/predictiveSafetyService';

export default function PredictiveRiskPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const results = await getPredictiveRiskData();
            setData(results);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="p-4 text-center text-muted animate-pulse">Risk projeksiyonu hesaplanıyor...</div>;
    if (!data || (data.categories.length === 0 && data.areas.length === 0)) {
        return <div className="p-4 text-center text-muted">Tahminleme için henüz yeterli veri yok.</div>;
    }

    return (
        <div className="predictive-panel">
            <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={20} className="text-primary" />
                <h3 className="font-bold text-lg">AI Destekli Risk Projeksiyonu</h3>
            </div>

            <div className="grid grid-2 gap-md">
                {/* Hotspots - Lokasyonlar */}
                <div className="glass-card p-3 border-danger-subtle">
                    <div className="text-xs font-bold text-muted uppercase mb-3 flex items-center gap-1">
                        <MapPin size={14} /> Kritik Risk Bölgeleri
                    </div>
                    <div className="flex flex-col gap-2">
                        {data.areas.slice(0, 3).map((area, i) => {
                            const level = getRiskLevelFromScore(area.score);
                            return (
                                <div key={i} className="flex items-center justify-between bg-secondary p-2 rounded-md border-l-4" style={{ borderColor: level.color }}>
                                    <div>
                                        <div className="font-bold text-sm">{area.name}</div>
                                        <div className="text-[10px] text-muted">{area.count} Aktif Bulguda Yoğunlaşma</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold" style={{ color: level.color }}>{area.score}</div>
                                        <div className="text-[10px] font-medium" style={{ color: level.color }}>{level.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Categories - Tehlikeli Kategoriler */}
                <div className="glass-card p-3 border-warning-subtle">
                    <div className="text-xs font-bold text-muted uppercase mb-3 flex items-center gap-1">
                        <AlertTriangle size={14} /> Öne Çıkan Tehlike Tipleri
                    </div>
                    <div className="flex flex-col gap-2">
                        {data.categories.slice(0, 3).map((cat, i) => {
                            const level = getRiskLevelFromScore(cat.score);
                            return (
                                <div key={i} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{level.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm">{cat.name}</div>
                                            <div className="text-[10px] text-muted">{cat.trend === 'increasing' ? '📈 Artış Trendinde' : '📊 Stabil Seyir'}</div>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: level.color + '22', color: level.color }}>
                                        SKOR: {cat.score}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="mt-4 bg-primary-subtle p-3 rounded-lg border border-primary-subtle flex gap-3 items-start">
                <Zap className="text-primary flex-shrink-0" size={20} />
                <div>
                    <h4 className="font-bold text-sm text-primary mb-1">Akıllı Güvenlik Tavsiyesi</h4>
                    <p className="text-xs text-primary leading-relaxed">
                        {data.areas[0]?.score > 100 
                            ? `Dikkat: ${data.areas[0].name} bölgesinde risk yoğunlaşması tespit edildi. Bu bölgede 'Yerinde İnceleme' (Gemba Walk) yapılması ve açık aksiyonların 48 saat içinde kapatılması önerilir.`
                            : "Mevcut veriler ışığında kritik bir sapma görülmüyor. Saha gözlemlerine ve proaktif bildirimlere devam edilmesi sistemin tahmin gücünü artıracaktır."}
                    </p>
                </div>
            </div>
        </div>
    );
}
