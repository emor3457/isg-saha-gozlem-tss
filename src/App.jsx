import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider, useToast } from './components/Common/Toast';
import AppLayout from './components/Layout/AppLayout';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { checkAutoBackup } from './services/exportService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import Login from './pages/Login';
import SyncConflictDialog from './components/Common/SyncConflictDialog';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Observations = lazy(() => import('./pages/Observations'));
const ObservationDetail = lazy(() => import('./pages/ObservationDetail'));
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'));
const Actions = lazy(() => import('./pages/Actions'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Trainings = lazy(() => import('./pages/Trainings'));
const Documents = lazy(() => import('./pages/Documents'));
const Emergency = lazy(() => import('./pages/Emergency'));
const Regulations = lazy(() => import('./pages/Regulations'));
const Audits = lazy(() => import('./pages/Audits'));
const Incidents = lazy(() => import('./pages/Incidents'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Yeni İSG Modülleri
const WorkPermits = lazy(() => import('./pages/WorkPermits'));
const PpeManagement = lazy(() => import('./pages/PpeManagement'));
const Contractors = lazy(() => import('./pages/Contractors'));
const Committees = lazy(() => import('./pages/Committees'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function FallbackLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p>Sayfa yükleniyor...</p>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}

function AppContent() {
    const toast = useToast();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!user) return; // Kullanıcı yoksa yedekleme yapma
        checkAutoBackup().then(didBackup => {
            if (didBackup) {
                toast.success('Otomatik Yedekleme Başarılı! Dosya indirildi.');
            }
        });
    }, [toast, user]);

    if (loading) {
        return <FallbackLoader />;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <>
            <SyncConflictDialog />
            <AppLayout>
                <ErrorBoundary>
                    <Suspense fallback={<FallbackLoader />}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/observations" element={<Observations />} />
                            <Route path="/observations/:id" element={<ObservationDetail />} />
                            <Route path="/risk" element={<RiskAssessment />} />
                            <Route path="/actions" element={<Actions />} />
                            <Route path="/feedback" element={<Feedback />} />
                            <Route path="/trainings" element={<Trainings />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/emergency" element={<Emergency />} />
                            <Route path="/regulations" element={<Regulations />} />
                            <Route path="/audits" element={<Audits />} />
                            <Route path="/incidents" element={<Incidents />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />

                            {/* Yeni İSG Modülleri */}
                            <Route path="/work-permits" element={<WorkPermits />} />
                            <Route path="/ppe-management" element={<PpeManagement />} />
                            <Route path="/contractors" element={<Contractors />} />
                            <Route path="/committees" element={<Committees />} />
                            <Route path="/admin" element={<AdminPanel />} />

                            {/* 404 Route */}
                            <Route path="*" element={<Dashboard />} /> {/* NotFound veya Dashboard'a yönlendir. NotFound bileşeni tam olmadığı için hata alabilir, sorunsuz olan Dashboard kullanıyorum veya NotFound eklenebilir. */}
                            <Route path="/not-found" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </AppLayout>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <SyncProvider>
                        <AppContent />
                    </SyncProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

