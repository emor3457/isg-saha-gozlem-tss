import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Plus, Trash2, Save, X, AlertCircle, ArrowRight } from 'lucide-react';
import { createRootCause, getRootCausesByParent } from '../services/riskService';
import { RCA_METHODS, ROOT_CAUSE_CATEGORIES } from '../config/categories';

export default function RootCauseAnalysis({ parentId, parentType, onSave }) {
    const navigate = useNavigate();
    const [rcaData, setRcaData] = useState(null);
    const [method, setMethod] = useState('5why');
    const [whys, setWhys] = useState(['', '', '', '', '']);
    const [category, setCategory] = useState('management');
    const [finalRootCause, setFinalRootCause] = useState('');

    useEffect(() => {
        loadRca();
    }, [parentId, parentType]);

    async function loadRca() {
        const existing = await getRootCausesByParent(parentId, parentType);
        if (existing.length > 0) {
            const latest = existing[0];
            setRcaData(latest);
            setMethod(latest.method);
            if (latest.method === '5why' && latest.data?.whys) {
                setWhys(latest.data.whys);
            }
            setCategory(latest.data?.category || 'management');
            setFinalRootCause(latest.data?.finalRootCause || '');
        }
    }

    async function handleSave() {
        const data = {
            parentId,
            parentType,
            method,
            data: {
                whys: method === '5why' ? whys : [],
                category,
                finalRootCause
            }
        };
        const saved = await createRootCause(data);
        setRcaData(saved);
        if (onSave) onSave(saved);
    }

    const updateWhy = (index, value) => {
        const newWhys = [...whys];
        newWhys[index] = value;
        setWhys(newWhys);
    };

    return (
        <div className="glass-card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <HelpCircle size={20} style={{ color: 'var(--color-info)' }} />
                    Kök Neden Analizi (Root Cause Analysis)
                </h3>
            </div>

            <div className="flex flex-col gap-md">
                <div className="form-group">
                    <label className="form-label">Analiz Metodu</label>
                    <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                        {RCA_METHODS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {RCA_METHODS.find(m => m.id === method)?.description}
                    </p>
                </div>

                {method === '5why' && (
                    <div className="flex flex-col gap-sm">
                        <label className="form-label">5 Neden Soru Zinciri</label>
                        {whys.map((why, i) => (
                            <div key={i} className="flex gap-sm items-start">
                                <div style={{
                                    minWidth: 28, height: 28, borderRadius: '50%',
                                    background: 'var(--bg-tertiary)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                                    fontWeight: 700, color: 'var(--color-primary)', marginTop: 8
                                }}>
                                    {i + 1}
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <input
                                        className="form-input"
                                        placeholder={`${i === 0 ? 'Sorun neden gerçekleşti?' : 'Bu durumun sebebi neydi?'}`}
                                        value={why}
                                        onChange={e => updateWhy(i, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-2">
                    <div className="form-group">
                        <label className="form-label">Kök Neden Kategorisi</label>
                        <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                            {ROOT_CAUSE_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tespit Edilen Kök Neden</label>
                        <input
                            className="form-input"
                            placeholder="Örn: Yetersiz denetim prosedürü"
                            value={finalRootCause}
                            onChange={e => setFinalRootCause(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>
                        <Save size={14} /> Analizi Kaydet
                    </button>
                    {rcaData?.data?.finalRootCause && (
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                            onClick={() => navigate(`/actions?new=1&desc=Kök Neden Tespit Edildi: ${encodeURIComponent(rcaData.data.finalRootCause)}`)}>
                            <AlertCircle size={14} /> Aksiyon (DÖF) Başlat <ArrowRight size={14} />
                        </button>
                    )}
                </div>

                {rcaData && (
                    <div style={{
                        marginTop: 'var(--space-sm)', padding: 'var(--space-sm)',
                        background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem'
                    }}>
                        <AlertCircle size={14} style={{ color: 'var(--color-success)' }} />
                        <span style={{ color: 'var(--color-success)' }}>
                            Son analiz kaydedildi: {new Date(rcaData.createdAt).toLocaleString('tr-TR')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
