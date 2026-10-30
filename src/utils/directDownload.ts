export interface DownloadProgressInfo {
  loadedBytes: number;
  totalBytes: number;
  percent: number | null;
}

interface CachedBlobEntry {
  blobUrl: string;
  size: number;
  mimeType: string;
  createdAt: number;
}

const MAX_CACHED_ENTRIES = 2;
const MAX_SINGLE_CACHE_BYTES = 28 * 1024 * 1024; // 28 MB max cached item
const MAX_TOTAL_CACHE_BYTES = 36 * 1024 * 1024; // 36 MB total RAM budget
const VERCEL_SAFE_CHUNK_BYTES = 3_500_000; // 3.5 MB (< 4.5 MB Vercel Function limit)

const sessionMediaBlobCache = new Map<string, CachedBlobEntry>();

function pruneBlobCache(incomingBytes = 0): void {
  let total = incomingBytes;
  for (const item of sessionMediaBlobCache.values()) {
    total += item.size;
  }

  while (
    sessionMediaBlobCache.size > 0 &&
    (sessionMediaBlobCache.size >= MAX_CACHED_ENTRIES || total > MAX_TOTAL_CACHE_BYTES)
  ) {
    const oldestKey = sessionMediaBlobCache.keys().next().value;
    if (!oldestKey) break;
    const evicted = sessionMediaBlobCache.get(oldestKey);
    sessionMediaBlobCache.delete(oldestKey);
    if (evicted) {
      total -= evicted.size;
      try {
        URL.revokeObjectURL(evicted.blobUrl);
      } catch {
        // Ignore
      }
    }
  }
}

export function getCachedMediaBlobUrl(remoteUrl?: string): string | null {
  if (!remoteUrl) return null;
  const hit = sessionMediaBlobCache.get(remoteUrl);
  return hit ? hit.blobUrl : null;
}

export function rememberMediaBlobUrl(
  remoteUrl: string,
  blob: Blob
): string {
  const existing = sessionMediaBlobCache.get(remoteUrl);
  if (existing) return existing.blobUrl;

  const blobUrl = URL.createObjectURL(blob);
  if (blob.size <= MAX_SINGLE_CACHE_BYTES) {
    pruneBlobCache(blob.size);
    sessionMediaBlobCache.set(remoteUrl, {
      blobUrl,
      size: blob.size,
      mimeType: blob.type || 'application/octet-stream',
      createdAt: Date.now(),
    });
  } else {
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignore
      }
    }, 45_000);
  }
  return blobUrl;
}

export function formatBytesShort(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferExtension(
  url: string,
  kind?: 'video' | 'audio' | 'image' | 'file',
  mimeType = '',
  label = ''
): string {
  const mt = mimeType.toLowerCase();
  if (mt.includes('video/mp4')) return 'mp4';
  if (mt.includes('video/webm')) return 'webm';
  if (mt.includes('audio/mpeg') || mt.includes('audio/mp3')) return 'mp3';
  if (mt.includes('audio/mp4') || mt.includes('audio/m4a') || mt.includes('audio/x-m4a')) return 'm4a';
  if (mt.includes('audio/ogg')) return 'ogg';
  if (mt.includes('audio/wav')) return 'wav';
  if (mt.includes('image/png')) return 'png';
  if (mt.includes('image/webp')) return 'webp';
  if (mt.includes('image/gif')) return 'gif';
  if (mt.includes('image/jpeg') || mt.includes('image/jpg')) return 'jpg';

  try {
    const pathname = new URL(url, 'https://nodatagpt.web.id').pathname.toLowerCase();
    const pathExt = pathname.match(/\.(mp4|webm|mp3|m4a|ogg|wav|png|jpe?g|webp|gif|pdf|zip)$/i);
    if (pathExt) {
      return pathExt[1].toLowerCase() === 'jpeg' ? 'jpg' : pathExt[1].toLowerCase();
    }
  } catch {
    // Ignore URL parse error
  }

  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('mp3')) return 'mp3';
  if (lowerLabel.includes('m4a')) return 'm4a';
  if (lowerLabel.includes('gif')) return 'gif';
  if (lowerLabel.includes('png') || lowerLabel.includes('stiker')) return 'png';
  if (lowerLabel.includes('mp4')) return 'mp4';

  if (kind === 'video') return 'mp4';
  if (kind === 'audio') return 'mp3';
  if (kind === 'image') return 'jpg';
  return 'mp4';
}

export function buildCleanDownloadFilename({
  url,
  label = '',
  kind,
  fallbackId = '',
  mimeType = '',
}: {
  url: string;
  label?: string;
  kind?: 'video' | 'audio' | 'image' | 'file';
  fallbackId?: string;
  mimeType?: string;
}): string {
  const ext = inferExtension(url, kind, mimeType, label);
  const slugLabel = label
    .toLowerCase()
    .replace(/\bunduh\b|\bdownload\b/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42);

  const shortSuffix = fallbackId ? `-${fallbackId.slice(0, 6)}` : '';
  const stem = slugLabel
    ? `nodatagpt-${slugLabel}${shortSuffix}`
    : `nodatagpt-${kind || 'media'}${shortSuffix || `-${Date.now().toString(36).slice(-5)}`}`;

  return `${stem}.${ext}`;
}

function clickSameOriginAnchor(href: string, downloadName: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = downloadName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function triggerHiddenAttachmentIframe(attachmentUrl: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.src = attachmentUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch {
      // Ignore cleanup error
    }
  }, 65_000);
}

async function readStreamIntoChunks(
  res: Response,
  knownTotal: number,
  onProgress?: (info: DownloadProgressInfo) => void,
  maxBytes = 85 * 1024 * 1024
): Promise<{ chunks: BlobPart[]; loadedBytes: number }> {
  const contentLen = Number(res.headers.get('content-length') || 0);
  const totalBytes = knownTotal > 0 ? knownTotal : contentLen;

  if (totalBytes > maxBytes) {
    try {
      await res.body?.cancel();
    } catch {
      // Ignore
    }
    throw new Error('FILE_TOO_LARGE_FOR_MEMORY');
  }

  if (!res.body) {
    const buf = await res.arrayBuffer();
    onProgress?.({
      loadedBytes: buf.byteLength,
      totalBytes: buf.byteLength,
      percent: 100,
    });
    return { chunks: [buf], loadedBytes: buf.byteLength };
  }

  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loadedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      loadedBytes += value.byteLength;
      if (loadedBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Ignore
        }
        throw new Error('FILE_TOO_LARGE_FOR_MEMORY');
      }
      chunks.push(value);
      const percent =
        totalBytes > 0
          ? Math.min(99, Math.round((loadedBytes / totalBytes) * 100))
          : null;
      onProgress?.({ loadedBytes, totalBytes, percent });
    }
  }

  onProgress?.({
    loadedBytes,
    totalBytes: totalBytes || loadedBytes,
    percent: 100,
  });

  return { chunks, loadedBytes };
}

function decorateClientDirectAttachmentUrl(rawUrl: string, filename: string): string {
  try {
    const u = new URL(rawUrl);
    const stem = filename.replace(/\.[a-z0-9]{2,5}$/i, '') || 'nodatagpt-media';
    const host = u.hostname.toLowerCase();
    // Google Video CDN natively emits `Content-Disposition: attachment` when `title=` is set!
    if (host.includes('googlevideo.com') && !u.searchParams.has('title')) {
      u.searchParams.set('title', stem);
      return u.toString();
    }
    if (!u.searchParams.has('dl')) {
      u.searchParams.set('dl', '1');
    }
    if (!u.searchParams.has('download')) {
      u.searchParams.set('download', '1');
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export async function triggerDirectDownload({
  url,
  label = '',
  kind,
  fallbackId = '',
  onProgress,
  signal,
}: {
  url: string;
  label?: string;
  kind?: 'video' | 'audio' | 'image' | 'file';
  fallbackId?: string;
  onProgress?: (info: DownloadProgressInfo) => void;
  signal?: AbortSignal;
}): Promise<void> {
  if (!url || typeof window === 'undefined') return;

  // 0. Instant 0-KB download for data: URLs, blob: URLs, or already-cached session media!
  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx > 0) {
      const meta = url.slice(5, commaIdx);
      const mime = meta.split(';')[0] || 'application/octet-stream';
      const binary = window.atob(url.slice(commaIdx + 1));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const fname = buildCleanDownloadFilename({
        url: 'https://nodatagpt.web.id/file',
        label,
        kind,
        fallbackId,
        mimeType: mime,
      });
      clickSameOriginAnchor(blobUrl, fname);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
      return;
    }
  }

  if (url.startsWith('blob:')) {
    const fname = buildCleanDownloadFilename({ url, label, kind, fallbackId });
    clickSameOriginAnchor(url, fname);
    return;
  }

  const cachedBlobUrl = getCachedMediaBlobUrl(url);
  if (cachedBlobUrl) {
    const cachedMeta = sessionMediaBlobCache.get(url);
    const fname = buildCleanDownloadFilename({
      url,
      label,
      kind,
      fallbackId,
      mimeType: cachedMeta?.mimeType || '',
    });
    onProgress?.({
      loadedBytes: cachedMeta?.size || 1,
      totalBytes: cachedMeta?.size || 1,
      percent: 100,
    });
    clickSameOriginAnchor(cachedBlobUrl, fname);
    return;
  }

  // 1. Tier 1: Direct Browser CORS Stream (0 Vercel bandwidth, uses user's residential IP, live % progress)
  try {
    const directRes = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal,
    });

    const ct = (directRes.headers.get('content-type') || '').toLowerCase();
    if (directRes.ok && !ct.includes('text/html') && !ct.includes('application/json')) {
      const { chunks, loadedBytes } = await readStreamIntoChunks(
        directRes,
        0,
        onProgress
      );
      if (loadedBytes > 128) {
        const mime = ct.split(';')[0] || 'application/octet-stream';
        const blob = new Blob(chunks, { type: mime });
        const blobUrl = rememberMediaBlobUrl(url, blob);
        const fname = buildCleanDownloadFilename({
          url,
          label,
          kind,
          fallbackId,
          mimeType: mime,
        });
        clickSameOriginAnchor(blobUrl, fname);
        return;
      }
    } else {
      try {
        await directRes.body?.cancel();
      } catch {
        // Ignore
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    // CORS blocked or >85MB -> proceed seamlessly to Tier 2 Same-Origin Streaming Proxy
  }

  // 2. Tier 2: Same-Origin `/api/download` Streaming + Automatic 3.5 MB Range Chunking for Videos > 4 MB!
  const initialFilename = buildCleanDownloadFilename({
    url,
    label,
    kind,
    fallbackId,
  });

  try {
    const probeUrl = `/api/download?probe=1&url=${encodeURIComponent(url)}`;
    const probeRes = await fetch(probeUrl, { method: 'GET', signal });
    const probeJson = (await probeRes.json()) as {
      ok?: boolean;
      contentType?: string;
      totalBytes?: number;
      acceptRanges?: boolean;
      withinServerlessCap?: boolean;
    };

    if (probeJson.ok) {
      const resolvedMime = (probeJson.contentType || '').split(';')[0] || '';
      const resolvedFilename = buildCleanDownloadFilename({
        url,
        label,
        kind,
        fallbackId,
        mimeType: resolvedMime,
      });
      const streamEndpoint = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(resolvedFilename)}`;
      const totalBytes = Number(probeJson.totalBytes || 0);

      // Case 2A: File <= 4.0 MB -> Single same-origin stream with live progress!
      if (probeJson.withinServerlessCap) {
        const singleRes = await fetch(streamEndpoint, { method: 'GET', signal });
        if (singleRes.ok) {
          const { chunks, loadedBytes } = await readStreamIntoChunks(
            singleRes,
            totalBytes,
            onProgress
          );
          if (loadedBytes > 128) {
            const blob = new Blob(chunks, {
              type: resolvedMime || 'application/octet-stream',
            });
            const blobUrl = rememberMediaBlobUrl(url, blob);
            clickSameOriginAnchor(blobUrl, resolvedFilename);
            return;
          }
        }
      }

      // Case 2B: File > 4.0 MB (up to 75 MB) with HTTP Range support -> Chunk in 3.5 MB slices!
      // Bypasses Vercel's 4.5 MB per-response cap cleanly with smooth 0% -> 100% progress!
      if (
        totalBytes > 4_000_000 &&
        totalBytes <= 75 * 1024 * 1024 &&
        probeJson.acceptRanges
      ) {
        const rangeChunks: BlobPart[] = [];
        let downloaded = 0;

        while (downloaded < totalBytes) {
          const end = Math.min(
            downloaded + VERCEL_SAFE_CHUNK_BYTES - 1,
            totalBytes - 1
          );
          const partRes = await fetch(streamEndpoint, {
            method: 'GET',
            headers: { Range: `bytes=${downloaded}-${end}` },
            signal,
          });

          if (!partRes.ok || (partRes.status !== 206 && downloaded > 0)) {
            throw new Error('RANGE_STREAM_INTERRUPTED');
          }

          const { chunks: subChunks, loadedBytes: partLoaded } =
            await readStreamIntoChunks(
              partRes,
              end - downloaded + 1,
              (subInfo) => {
                const curTotal = downloaded + subInfo.loadedBytes;
                onProgress?.({
                  loadedBytes: curTotal,
                  totalBytes,
                  percent: Math.min(99, Math.round((curTotal / totalBytes) * 100)),
                });
              }
            );

          if (partLoaded <= 0) break;
          rangeChunks.push(...subChunks);
          downloaded += partLoaded;

          // If upstream ignored Range on chunk 0 and returned full 200 payload, we already have everything!
          if (partRes.status === 200) {
            break;
          }
        }

        if (downloaded > 128) {
          onProgress?.({ loadedBytes: downloaded, totalBytes, percent: 100 });
          const blob = new Blob(rangeChunks, {
            type: resolvedMime || 'application/octet-stream',
          });
          const blobUrl = rememberMediaBlobUrl(url, blob);
          clickSameOriginAnchor(blobUrl, resolvedFilename);
          return;
        }
      }

      // Case 2C: Unknown Content-Length (`totalBytes === 0`) -> trigger native same-origin attachment iframe!
      triggerHiddenAttachmentIframe(streamEndpoint);
      return;
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    // Proceed to Tier 3 client-IP attachment trigger
  }

  // 3. Tier 3: Client-IP-locked CDN (e.g. `googlevideo.com` signed to user's IP)
  // Decorate with native CDN attachment params (`&title=...` / `?dl=1`) via hidden iframe (no new tab!)
  const decoratedClientUrl = decorateClientDirectAttachmentUrl(
    url,
    initialFilename
  );
  triggerHiddenAttachmentIframe(decoratedClientUrl);
}
