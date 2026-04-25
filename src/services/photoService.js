// Photo capture and compression service

export async function capturePhoto() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Rear camera on mobile
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return reject(new Error('Fotoğraf seçilmedi'));
            try {
                const compressed = await compressImage(file, 1200, 0.8);
                resolve({
                    data: compressed,
                    name: file.name,
                    timestamp: new Date().toISOString(),
                    size: compressed.length
                });
            } catch (err) {
                reject(err);
            }
        };
        input.click();
    });
}

export async function pickPhotos(multiple = true) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = multiple;
        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return reject(new Error('Fotoğraf seçilmedi'));
            try {
                const photos = await Promise.all(
                    files.map(async (file) => {
                        const compressed = await compressImage(file, 1200, 0.8);
                        return {
                            data: compressed,
                            name: file.name,
                            timestamp: new Date().toISOString(),
                            size: compressed.length
                        };
                    })
                );
                resolve(photos);
            } catch (err) {
                reject(err);
            }
        };
        input.click();
    });
}

export function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Fotoğraf yüklenemedi'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsDataURL(file);
    });
}
