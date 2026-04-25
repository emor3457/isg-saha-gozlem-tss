import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startPeriodicChecks, requestPermission } from './services/notificationService';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Start notification system (non-blocking)
try {
    requestPermission()
        .then(() => startPeriodicChecks())
        .catch((e) => console.warn('Bildirim sistemi başlatılamadı:', e));
} catch (e) {
    console.warn('Bildirim sistemi hatası:', e);
}
