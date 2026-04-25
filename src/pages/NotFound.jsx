import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '80vh', padding: '2rem',
            textAlign: 'center', color: 'var(--text-primary)'
        }}>
            <div style={{
                background: 'var(--bg-secondary)', padding: '3rem 2rem',
                borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%',
                border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <Compass size={80} style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', opacity: 0.8 }} />
                <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sayfa Bulunamadı</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir. Lütfen adresi kontrol edin veya ana sayfaya dönün.
                </p>
                <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                    <ArrowLeft size={18} /> Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
