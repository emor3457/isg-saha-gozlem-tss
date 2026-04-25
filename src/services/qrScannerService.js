/**
 * QR/Barkod Tarama Servisi
 * 
 * jsQR ile fotoğraftan QR kod okuma ve ekipman takibi.
 */

import jsQR from 'jsqr';
import db from '../database/db';

/**
 * Fotoğraftan QR kod oku
 */
export async function scanQRFromImage(imageDataUrl) {
    const { imageData, width, height } = await loadImageData(imageDataUrl);

    // jsQR ile tarama
    const result = jsQR(imageData.data, width, height, {
        inversionAttempts: 'attemptBoth'
    });

    if (!result) return null;

    return {
        data: result.data,
        location: {
            topLeft: result.location.topLeftCorner,
            topRight: result.location.topRightCorner,
            bottomLeft: result.location.bottomLeftCorner,
            bottomRight: result.location.bottomRightCorner
        },
        type: detectCodeType(result.data)
    };
}

function detectCodeType(data) {
    if (data.startsWith('http')) return 'url';
    if (/^\d{13}$/.test(data)) return 'ean13';
    if (/^\d{8}$/.test(data)) return 'ean8';
    if (/^[A-Z0-9-]+$/i.test(data) && data.length <= 20) return 'equipment_code';
    return 'text';
}

function loadImageData(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({ imageData: ctx.getImageData(0, 0, img.width, img.height), width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Görüntü yüklenemedi'));
        img.src = dataUrl;
    });
}

/**
 * QR sonucunu fotoğraf üstüne çiz
 */
export function drawQROverlay(canvas, scanResult) {
    if (!scanResult) return;
    const ctx = canvas.getContext('2d');
    const loc = scanResult.location;

    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(loc.topLeft.x, loc.topLeft.y);
    ctx.lineTo(loc.topRight.x, loc.topRight.y);
    ctx.lineTo(loc.bottomRight.x, loc.bottomRight.y);
    ctx.lineTo(loc.bottomLeft.x, loc.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(34,197,94,0.9)';
    ctx.fillRect(loc.topLeft.x, loc.topLeft.y - 24, 200, 24);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`📱 ${scanResult.data.substring(0, 30)}`, loc.topLeft.x + 4, loc.topLeft.y - 7);
}

// ── Ekipman CRUD ──

export async function findEquipmentByCode(code) {
    return db.equipment.where('code').equals(code).first();
}

export async function createEquipment(data) {
    return db.equipment.add({
        ...data,
        createdAt: new Date().toISOString(),
        lastCheckDate: new Date().toISOString(),
        status: 'active'
    });
}

export async function updateEquipment(id, changes) {
    return db.equipment.update(id, { ...changes });
}

export async function getAllEquipment() {
    return db.equipment.orderBy('createdAt').reverse().toArray();
}

export async function deleteEquipment(id) {
    return db.equipment.delete(id);
}

/**
 * QR tarama + ekipman eşleştirme
 */
export async function scanAndMatch(imageDataUrl) {
    const scan = await scanQRFromImage(imageDataUrl);
    if (!scan) return { scan: null, equipment: null, isNew: false };

    const equipment = await findEquipmentByCode(scan.data);
    return {
        scan,
        equipment: equipment || null,
        isNew: !equipment
    };
}
