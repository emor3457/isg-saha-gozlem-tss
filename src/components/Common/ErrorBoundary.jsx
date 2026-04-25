import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', padding: '2rem',
                    textAlign: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)'
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)', padding: '2rem',
                        borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%',
                        border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <AlertTriangle size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem', margin: '0 auto' }} />
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Beklenmeyen Bir Hata Oluştu</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Uygulama çalışırken beklenmeyen bir hatayla karşılaştı. Verileriniz güvende, sayfayı yenileyerek devam edebilirsiniz.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{ textAlign: 'left', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '4px', overflowX: 'auto', marginBottom: '2rem' }}>
                                <p style={{ color: 'var(--color-danger)', fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{this.state.error.toString()}</p>
                                <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                        >
                            <RefreshCcw size={18} /> Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
