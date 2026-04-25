import db from '../database/db';
import { checkAndMarkOverdue } from './actionService';

let checkInterval = null;

// Request notification permission
export async function requestPermission() {
    try {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const result = await Notification.requestPermission();
        return result === 'granted';
    } catch (e) {
        console.warn('Bildirim izni alınamadı:', e);
        return false;
    }
}

// Show browser notification
export function showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        new Notification(title, {
            body,
            icon: '/icons/icon.svg',
            badge: '/icons/icon.svg',
            tag: `isg-${Date.now()}`,
            vibrate: [200, 100, 200]
        });
    } catch (e) {
        console.warn('Bildirim gönderilemedi:', e);
    }
}

// Check for pending reminders
export async function checkReminders() {
    try {
        const now = new Date().toISOString();
        const allReminders = await db.reminders.toArray();
        const unread = allReminders.filter(r => !r.isRead);
        const due = unread.filter(r => r.reminderDate <= now);

        for (const reminder of due) {
            const title = reminder.type === 'overdue'
                ? '🚨 Gecikmiş Aksiyon!'
                : '📋 Aksiyon Hatırlatması';
            showNotification(title, reminder.message);
        }
        return due;
    } catch (e) {
        console.warn('Hatırlatma kontrolü hatası:', e);
        return [];
    }
}

// Get all reminders
export async function getAllReminders() {
    try {
        return await db.reminders.orderBy('reminderDate').reverse().toArray();
    } catch { return []; }
}

export async function getUnreadReminders() {
    try {
        const all = await db.reminders.toArray();
        return all.filter(r => !r.isRead);
    } catch { return []; }
}

export async function markReminderRead(id) {
    await db.reminders.update(id, { isRead: true });
}

export async function markAllRemindersRead() {
    const unread = await getUnreadReminders();
    for (const r of unread) {
        await db.reminders.update(r.id, { isRead: true });
    }
}

// Start periodic checking (every 30 minutes)
export function startPeriodicChecks() {
    if (checkInterval) return;

    // Initial check (delayed to let app mount)
    setTimeout(() => {
        checkAndMarkOverdue().catch(() => { });
        checkReminders().catch(() => { });
    }, 3000);

    checkInterval = setInterval(async () => {
        try {
            await checkAndMarkOverdue();
            await checkReminders();
        } catch (e) {
            console.warn('Periyodik kontrol hatası:', e);
        }
    }, 30 * 60 * 1000); // 30 dakika
}

export function stopPeriodicChecks() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
}
