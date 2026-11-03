export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB raw photo input
export const MAX_TEXT_UPLOAD_BYTES = 1024 * 1024; // 1 MB text/code input

const MAX_VISION_SIDE_PX = 1536;
const FALLBACK_COMPACT_VISION_SIDE_PX = 1152;
const THUMB_SIDE_PX = 360;
const TARGET_MAX_VISION_BYTES = 430 * 1024;

export interface CompressedChatImage {
  fileName: string;
  mimeType: string;
  visionDataUrl: string;
  thumbDataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  wasCompressed: boolean;
  metaLabel: string;
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function isImageAttachmentCandidate(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  return /\.(?:jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name || '');
}

export function isHeicLikeFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  return (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    /\.(?:heic|heif)$/i.test(file.name || '')
  );
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.max(1, Math.round((b64.length * 3) / 4));
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string' && reader.result.length > 0
        ? resolve(reader.result)
        : reject(new Error('Gagal membaca data gambar.'));
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar dari perangkat.'));
    reader.readAsDataURL(blob);
  });
}

async function canvasToJpegDataUrl(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<string> {
  if (typeof canvas.toBlob === 'function') {
    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      } catch {
        resolve(null);
      }
    });
    if (blob && blob.size > 64) {
      return readBlobAsDataUrl(blob);
    }
  }
  return canvas.toDataURL('image/jpeg', quality);
}

interface DecodedImageSource {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeImageFileWithExif(file: File): Promise<DecodedImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
      return {
        source: bitmap,
        width: bitmap.width || 1,
        height: bitmap.height || 1,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return {
          source: bitmap,
          width: bitmap.width || 1,
          height: bitmap.height || 1,
          cleanup: () => {
            try {
              bitmap.close();
            } catch {
              // ignore
            }
          },
        };
      } catch {
        // Fall through to HTMLImageElement loader
      }
    }
  }

  if (typeof Image === 'undefined') {
    throw new Error('NO_IMAGE_DECODER');
  }

  let objectUrl: string | null = null;
  const srcUrl =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? (objectUrl = URL.createObjectURL(file))
      : await readBlobAsDataUrl(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('DECODE_FAILED'));
      el.src = srcUrl;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width || 1,
      height: img.naturalHeight || img.height || 1,
      cleanup: () => {
        if (objectUrl && typeof URL.revokeObjectURL === 'function') {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore
          }
        }
      },
    };
  } catch (err) {
    if (objectUrl && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    }
    throw err;
  }
}

function drawProgressiveScaledCanvas(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  maxSide: number
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const scale = Math.min(1, maxSide / Math.max(srcWidth || 1, srcHeight || 1));
  const targetW = Math.max(1, Math.round(srcWidth * scale));
  const targetH = Math.max(1, Math.round(srcHeight * scale));

  let curSource: CanvasImageSource = source;
  let curW = Math.max(1, srcWidth);
  let curH = Math.max(1, srcHeight);

  // Progressive 2x halving prevents moire/aliasing when shrinking 12-48 MP smartphone photos
  while (curW > targetW * 2 || curH > targetH * 2) {
    const nextW = Math.max(targetW, Math.round(curW / 2));
    const nextH = Math.max(targetH, Math.round(curH / 2));
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) return null;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(curSource, 0, 0, nextW, nextH);
    curSource = stepCanvas;
    curW = nextW;
    curH = nextH;
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetW;
  finalCanvas.height = targetH;
  const ctx = finalCanvas.getContext('2d');
  if (!ctx) return null;

  // Fill white backdrop so transparent PNG/WebP assets never turn black in JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(curSource, 0, 0, targetW, targetH);

  return finalCanvas;
}

export async function compressImageFileForChat(
  file: File
): Promise<CompressedChatImage> {
  if (!isImageAttachmentCandidate(file)) {
    throw new Error(
      'Format berkas belum didukung. Gunakan foto JPG, PNG, WEBP, GIF, atau berkas teks/kode.'
    );
  }

  if (file.size <= 0) {
    throw new Error('Berkas gambar kosong atau rusak.');
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran foto terlalu besar (${formatBytesCompact(file.size)}). Maksimum 20 MB per foto.`
    );
  }

  const safeName = (file.name || `foto-${Date.now()}.jpg`).trim();

  // Check if 2D Canvas encoding is available in this runtime
  const probeCanvas =
    typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const hasCanvas2d = Boolean(probeCanvas && probeCanvas.getContext('2d'));

  if (hasCanvas2d) {
    let decoded: DecodedImageSource | null = null;
    try {
      decoded = await decodeImageFileWithExif(file);
      const primaryCanvas = drawProgressiveScaledCanvas(
        decoded.source,
        decoded.width,
        decoded.height,
        MAX_VISION_SIDE_PX
      );

      if (primaryCanvas) {
        let finalWidth = primaryCanvas.width;
        let finalHeight = primaryCanvas.height;
        let visionDataUrl = await canvasToJpegDataUrl(primaryCanvas, 0.84);
        let compressedBytes = estimateDataUrlBytes(visionDataUrl);

        if (compressedBytes > TARGET_MAX_VISION_BYTES) {
          visionDataUrl = await canvasToJpegDataUrl(primaryCanvas, 0.72);
          compressedBytes = estimateDataUrlBytes(visionDataUrl);
        }

        if (compressedBytes > TARGET_MAX_VISION_BYTES * 1.15) {
          const compactCanvas = drawProgressiveScaledCanvas(
            primaryCanvas,
            primaryCanvas.width,
            primaryCanvas.height,
            FALLBACK_COMPACT_VISION_SIDE_PX
          );
          if (compactCanvas) {
            finalWidth = compactCanvas.width;
            finalHeight = compactCanvas.height;
            visionDataUrl = await canvasToJpegDataUrl(compactCanvas, 0.68);
            compressedBytes = estimateDataUrlBytes(visionDataUrl);
          }
        }

        const thumbCanvas = drawProgressiveScaledCanvas(
          primaryCanvas,
          primaryCanvas.width,
          primaryCanvas.height,
          THUMB_SIDE_PX
        );
        const thumbDataUrl = thumbCanvas
          ? await canvasToJpegDataUrl(thumbCanvas, 0.68)
          : visionDataUrl;

        const wasCompressed =
          compressedBytes < file.size * 0.92 ||
          finalWidth < decoded.width ||
          finalHeight < decoded.height;

        const metaLabel = wasCompressed
          ? `${finalWidth}×${finalHeight} · ${formatBytesCompact(compressedBytes)} (dari ${formatBytesCompact(file.size)})`
          : `${finalWidth}×${finalHeight} · ${formatBytesCompact(compressedBytes)}`;

        return {
          fileName: safeName,
          mimeType: 'image/jpeg',
          visionDataUrl,
          thumbDataUrl,
          width: finalWidth,
          height: finalHeight,
          originalBytes: file.size,
          compressedBytes,
          wasCompressed,
          metaLabel,
        };
      }
    } catch {
      if (isHeicLikeFile(file)) {
        throw new Error(
          'Format foto HEIC/HEIF belum didukung langsung di peramban ini. Silakan gunakan JPG, PNG, atau WEBP.'
        );
      }
      // Fall through to raw DataURL fallback if under 3 MB
    } finally {
      decoded?.cleanup();
    }
  }

  if (isHeicLikeFile(file)) {
    throw new Error(
      'Format foto HEIC/HEIF belum didukung langsung di peramban ini. Silakan gunakan JPG, PNG, atau WEBP.'
    );
  }

  // Fallback for non-Canvas runtimes (e.g. headless DOM tests) or ultra-simple SVGs/GIFs
  if (file.size > 3.2 * 1024 * 1024) {
    throw new Error(
      'Peramban tidak mendukung kompresi Canvas untuk foto beresolusi besar ini. Coba gunakan foto di bawah 3 MB.'
    );
  }

  const rawDataUrl = await readBlobAsDataUrl(file);
  const detectedMime = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')
    ? file.type.toLowerCase()
    : 'image/jpeg';
  const normalizedDataUrl = rawDataUrl.startsWith('data:image/')
    ? rawDataUrl
    : `data:${detectedMime};base64,${rawDataUrl.split(',').pop() || ''}`;
  const rawBytes = estimateDataUrlBytes(normalizedDataUrl);

  return {
    fileName: safeName,
    mimeType: detectedMime,
    visionDataUrl: normalizedDataUrl,
    thumbDataUrl: normalizedDataUrl,
    width: 0,
    height: 0,
    originalBytes: file.size,
    compressedBytes: rawBytes,
    wasCompressed: false,
    metaLabel: formatBytesCompact(file.size),
  };
}

export async function uploadCompressedImageToPublicUrl(
  visionDataUrl: string,
  fileName: string,
  mimeType = 'image/jpeg',
  signal?: AbortSignal
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const onParentAbort = () => controller.abort();
  signal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    const activeFetch =
      typeof window !== 'undefined' && typeof window.fetch === 'function'
        ? window.fetch.bind(window)
        : fetch;
    const res = await activeFetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action: 'uploadImage',
        base64: visionDataUrl,
        mimeType,
        fileName,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return undefined;
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      url?: string;
    } | null;
    if (json?.ok && typeof json.url === 'string' && /^https:\/\//i.test(json.url.trim())) {
      return json.url.trim();
    }
    return undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onParentAbort);
  }
}
