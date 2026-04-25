import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Circle, ArrowRight, Type, Undo2, Redo2, Trash2, Download, X, Palette } from 'lucide-react';

/**
 * Fotoğraf Annotasyon Aracı
 * 
 * Props:
 * - photoData: string (dataURL)
 * - onSave: (annotatedDataUrl: string) => void
 * - onClose: () => void
 */
export default function PhotoAnnotator({ photoData, onSave, onClose }) {
    const canvasRef = useRef(null);
    const [tool, setTool] = useState('pen'); // pen, circle, arrow, text
    const [color, setColor] = useState('#DC2626');
    const [lineWidth, setLineWidth] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [textInput, setTextInput] = useState('');
    const [textPos, setTextPos] = useState(null);
    const startPos = useRef(null);
    const imgRef = useRef(null);

    const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#FFFFFF', '#000000'];

    const TOOLS = [
        { id: 'pen', icon: <Pencil size={16} />, label: 'Çizim' },
        { id: 'circle', icon: <Circle size={16} />, label: 'Daire' },
        { id: 'arrow', icon: <ArrowRight size={16} />, label: 'Ok' },
        { id: 'text', icon: <Type size={16} />, label: 'Metin' }
    ];

    // Fotoğrafı yükle
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            saveSnapshot();
        };
        img.src = photoData;
    }, [photoData]);

    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const snapshot = canvas.toDataURL('image/png');
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(snapshot);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    function restoreSnapshot(index) {
        if (index < 0 || index >= history.length) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = history[index];
    }

    function undo() {
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        restoreSnapshot(newIndex);
    }

    function redo() {
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        restoreSnapshot(newIndex);
    }

    function clearAll() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (imgRef.current) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgRef.current, 0, 0);
            saveSnapshot();
        }
    }

    function getPos(e) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function handleStart(e) {
        e.preventDefault();
        const pos = getPos(e);
        startPos.current = pos;

        if (tool === 'text') {
            setTextPos(pos);
            return;
        }

        setIsDrawing(true);
        const ctx = canvasRef.current.getContext('2d');

        if (tool === 'pen') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }

    function handleMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');

        if (tool === 'pen') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    }

    function handleEnd(e) {
        if (tool === 'text') return;
        if (!isDrawing) return;
        setIsDrawing(false);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const endPos = getPos(e.changedTouches?.[0] || e);
        const sp = startPos.current;

        if (tool === 'circle') {
            // Restore then draw circle
            if (historyIndex >= 0) restoreSnapshot(historyIndex);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            const rx = Math.abs(endPos.x - sp.x) / 2;
            const ry = Math.abs(endPos.y - sp.y) / 2;
            const cx = (sp.x + endPos.x) / 2;
            const cy = (sp.y + endPos.y) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }

        if (tool === 'arrow') {
            if (historyIndex >= 0) restoreSnapshot(historyIndex);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;

            // Çizgi
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();

            // Ok ucu
            const angle = Math.atan2(endPos.y - sp.y, endPos.x - sp.x);
            const headLen = 15;
            ctx.beginPath();
            ctx.moveTo(endPos.x, endPos.y);
            ctx.lineTo(endPos.x - headLen * Math.cos(angle - Math.PI / 6), endPos.y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endPos.x - headLen * Math.cos(angle + Math.PI / 6), endPos.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        }

        saveSnapshot();
    }

    function addText() {
        if (!textPos || !textInput.trim()) return;
        const ctx = canvasRef.current.getContext('2d');
        const fontSize = Math.max(16, lineWidth * 6);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(textInput, textPos.x, textPos.y);
        ctx.fillText(textInput, textPos.x, textPos.y);
        setTextInput('');
        setTextPos(null);
        saveSnapshot();
    }

    function handleSave() {
        const canvas = canvasRef.current;
        const data = canvas.toDataURL('image/jpeg', 0.9);
        onSave(data);
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: 900 }}>
                <div className="modal-header">
                    <h2>✏️ Fotoğraf Annotasyon</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Araç Çubuğu */}
                <div className="annotator-toolbar">
                    <div className="toolbar-section">
                        {TOOLS.map(t => (
                            <button
                                key={t.id}
                                className={`toolbar-btn ${tool === t.id ? 'active' : ''}`}
                                onClick={() => setTool(t.id)}
                                title={t.label}
                            >
                                {t.icon}
                            </button>
                        ))}
                    </div>

                    <div className="toolbar-divider" />

                    <div className="toolbar-section">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className={`color-btn ${color === c ? 'active' : ''}`}
                                style={{ background: c, borderColor: c === '#FFFFFF' ? 'var(--border-color)' : c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>

                    <div className="toolbar-divider" />

                    <div className="toolbar-section">
                        {[2, 4, 8].map(w => (
                            <button
                                key={w}
                                className={`toolbar-btn ${lineWidth === w ? 'active' : ''}`}
                                onClick={() => setLineWidth(w)}
                                title={`${w}px`}
                            >
                                <div style={{ width: w * 3, height: w, background: 'currentColor', borderRadius: 2 }} />
                            </button>
                        ))}
                    </div>

                    <div className="toolbar-divider" />

                    <div className="toolbar-section">
                        <button className="toolbar-btn" onClick={undo} title="Geri Al" disabled={historyIndex <= 0}>
                            <Undo2 size={16} />
                        </button>
                        <button className="toolbar-btn" onClick={redo} title="Yeniden" disabled={historyIndex >= history.length - 1}>
                            <Redo2 size={16} />
                        </button>
                        <button className="toolbar-btn" onClick={clearAll} title="Temizle">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="annotator-canvas-wrapper">
                    <canvas
                        ref={canvasRef}
                        className="annotator-canvas"
                        onPointerDown={handleStart}
                        onPointerMove={handleMove}
                        onPointerUp={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />
                </div>

                {/* Metin Giriş */}
                {tool === 'text' && textPos && (
                    <div className="annotator-text-input" style={{ padding: 'var(--space-sm) var(--space-lg)' }}>
                        <div className="flex gap-sm">
                            <input
                                className="form-input"
                                placeholder="Metin yazın..."
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addText()}
                                autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={addText}>Ekle</button>
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Download size={16} /> Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
