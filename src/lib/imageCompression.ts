/**
 * Image Compression & Optimization Utility for Si-SuGu Madrasah
 * Ensures images uploaded as Popup Banners fit comfortably within Firestore (under 1MB, typically 80-200 KB)
 * while preserving high-definition visual crispness for desktop and mobile displays.
 */

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  sizeFormatted: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses an image file, blob, or dataURL into an optimized image
 * Max width 1200px, max height 900px, JPEG/WebP quality 0.82
 */
export async function optimizeImageForBanner(
  source: File | Blob | string,
  maxWidth = 1200,
  maxHeight = 900,
  initialQuality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Fill background with white for transparency safety in JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with quality
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still somehow > 400KB (approx 550,000 base64 chars), reduce quality slightly
        if (dataUrl.length > 500000 && quality > 0.65) {
          quality = 0.72;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            // Fallback from dataUrl if blob fails
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: 'image/jpeg' });
            resolve({
              dataUrl,
              blob: fallbackBlob,
              width,
              height,
              sizeBytes: fallbackBlob.size,
              sizeFormatted: formatFileSize(fallbackBlob.size)
            });
            return;
          }

          resolve({
            dataUrl,
            blob,
            width,
            height,
            sizeBytes: blob.size,
            sizeFormatted: formatFileSize(blob.size)
          });
        }, 'image/jpeg', quality);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Gagal membaca data gambar'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Compresses and optimizes an application/school logo image.
 * Preserves transparency (PNG) and resizes to max 512x512 with high crispness.
 */
export async function optimizeImageForLogo(
  source: File | Blob | string,
  maxDimension = 512
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }

        // Keep transparency
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png');

        canvas.toBlob((blob) => {
          if (!blob) {
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: 'image/png' });
            resolve({
              dataUrl,
              blob: fallbackBlob,
              width,
              height,
              sizeBytes: fallbackBlob.size,
              sizeFormatted: formatFileSize(fallbackBlob.size)
            });
            return;
          }

          resolve({
            dataUrl,
            blob,
            width,
            height,
            sizeBytes: blob.size,
            sizeFormatted: formatFileSize(blob.size)
          });
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Gagal membaca format logo'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
      reader.readAsDataURL(source);
    }
  });
}

