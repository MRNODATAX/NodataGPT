import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if unsupported in runtime
}

export const config = {
  maxDuration: 60,
};

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function isBlockedInternalHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return true;
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }

  if (host.startsWith('[') || host.includes(':')) {
    const bare = host.replace(/^\[|\]$/g, '');
    if (
      bare === '::1' ||
      bare === '::' ||
      bare.startsWith('fc') ||
      bare.startsWith('fd') ||
      bare.startsWith('fe80')
    ) {
      return true;
    }
  }

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      a >= 224
    ) {
      return true;
    }
  }

  return false;
}

async function resolvesToPrivateAddress(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (isBlockedInternalHost(host)) return true;
  try {
    const records = await dns.promises.lookup(host, { all: true });
    if (!Array.isArray(records) || records.length === 0) return false;
    return records.some((rec) => isBlockedInternalHost(rec.address));
  } catch {
    return false;
  }
}

function inferRefererForHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h.includes('tiktok') || h.includes('byteoversea') || h.includes('ibytedtos') || h.includes('muscdn')) {
    return 'https://www.tiktok.com/';
  }
  if (h.includes('tikwm')) return 'https://www.tikwm.com/';
  if (h.includes('instagram') || h.includes('cdninstagram')) return 'https://www.instagram.com/';
  if (h.includes('fbcdn') || h.includes('facebook')) return 'https://www.facebook.com/';
  if (h.includes('twimg') || h.includes('twitter') || h.includes('x.com')) return 'https://x.com/';
  if (h.includes('pinimg') || h.includes('pinterest')) return 'https://www.pinterest.com/';
  if (h.includes('googlevideo') || h.includes('youtube') || h.includes('ytimg')) {
    return 'https://www.youtube.com/';
  }
  if (h.includes('scdn') || h.includes('spotify')) return 'https://open.spotify.com/';
  if (h.includes('pximg') || h.includes('pixiv')) return 'https://www.pixiv.net/';
  if (h.includes('wallhaven')) return 'https://wallhaven.cc/';
  if (h.includes('mediafire')) return 'https://www.mediafire.com/';
  if (h.includes('terabox') || h.includes('1024tera')) return 'https://www.1024terabox.com/';
  if (h.includes('sndcdn') || h.includes('soundcloud')) return 'https://soundcloud.com/';
  return undefined;
}

function sanitizeFilename(rawName, contentType = '') {
  const cleaned = String(rawName || 'nodatagpt-media')
    .replace(/[\r\n"\\/:*?<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 110);

  const base = cleaned || 'nodatagpt-media';
  if (/\.[a-z0-9]{2,5}$/i.test(base)) {
    return base;
  }

  const ct = String(contentType || '').toLowerCase();
  let ext = 'bin';
  if (ct.includes('video/mp4')) ext = 'mp4';
  else if (ct.includes('video/webm')) ext = 'webm';
  else if (ct.includes('audio/mpeg') || ct.includes('audio/mp3')) ext = 'mp3';
  else if (ct.includes('audio/mp4') || ct.includes('audio/m4a')) ext = 'm4a';
  else if (ct.includes('audio/ogg')) ext = 'ogg';
  else if (ct.includes('audio/wav')) ext = 'wav';
  else if (ct.includes('image/png')) ext = 'png';
  else if (ct.includes('image/webp')) ext = 'webp';
  else if (ct.includes('image/gif')) ext = 'gif';
  else if (ct.includes('image/jpeg') || ct.includes('image/jpg')) ext = 'jpg';

  return ext === 'bin' ? base : `${base}.${ext}`;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return Response.json({ ok: false, error: 'Metode tidak didukung.' }, { status: 405 });
    }

    const reqUrl = new URL(request.url);
    const rawTarget = (reqUrl.searchParams.get('url') || '').trim();
    const rawFilename = (reqUrl.searchParams.get('filename') || 'nodatagpt-media').trim();
    const isProbe = reqUrl.searchParams.get('probe') === '1';

    if (!rawTarget) {
      return Response.json({ ok: false, error: 'Parameter url wajib diisi.' }, { status: 400 });
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(rawTarget);
    } catch {
      return Response.json({ ok: false, error: 'URL unduhan tidak valid.' }, { status: 400 });
    }

    if (parsedTarget.protocol !== 'https:' && parsedTarget.protocol !== 'http:') {
      return Response.json({ ok: false, error: 'Protokol URL tidak didukung.' }, { status: 400 });
    }

    if (await resolvesToPrivateAddress(parsedTarget.hostname)) {
      return Response.json(
        { ok: false, error: 'Host internal tidak diizinkan.' },
        { status: 403 }
      );
    }

    const upstreamHeaders = {
      'User-Agent': DEFAULT_UA,
      Accept: '*/*',
    };
    const referer = inferRefererForHost(parsedTarget.hostname);
    if (referer) {
      upstreamHeaders['Referer'] = referer;
    }

    if (isProbe) {
      try {
        const probeRes = await fetch(parsedTarget.toString(), {
          method: 'GET',
          headers: {
            ...upstreamHeaders,
            Range: 'bytes=0-0',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
        });

        const ct = (probeRes.headers.get('content-type') || '').toLowerCase();
        const cr = probeRes.headers.get('content-range') || '';
        const cl = probeRes.headers.get('content-length') || '';
        let totalSize = 0;
        const slashMatch = cr.match(/\/(\d+)$/);
        if (slashMatch) {
          totalSize = Number(slashMatch[1]) || 0;
        } else if (cl && probeRes.status === 200) {
          totalSize = Number(cl) || 0;
        }

        // Cancel body immediately so 0 extra bytes are transferred during probe!
        try {
          await probeRes.body?.cancel();
        } catch {
          // Ignore cancel error
        }

        const isHtmlError = ct.includes('text/html') || ct.includes('application/json');
        if (!probeRes.ok || isHtmlError) {
          return Response.json({
            ok: false,
            status: probeRes.status,
            contentType: ct,
          });
        }

        const acceptRanges = Boolean(
          probeRes.status === 206 ||
            cr.toLowerCase().startsWith('bytes') ||
            (probeRes.headers.get('accept-ranges') || '').toLowerCase().includes('bytes')
        );

        // Vercel Serverless payload cap is ~4.5 MB: inform client so >4.0 MB files can range-chunk cleanly!
        return Response.json({
          ok: true,
          status: probeRes.status,
          contentType: ct,
          totalBytes: totalSize,
          acceptRanges,
          withinServerlessCap: totalSize > 0 && totalSize <= 4_000_000,
        });
      } catch (err) {
        return Response.json({
          ok: false,
          error: err instanceof Error ? err.message : 'Gagal memeriksa berkas.',
        });
      }
    }

    try {
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }

      const upstreamRes = await fetch(parsedTarget.toString(), {
        method: 'GET',
        headers: upstreamHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(55000),
      });

      const contentType =
        upstreamRes.headers.get('content-type') || 'application/octet-stream';
      if (
        !upstreamRes.ok ||
        contentType.toLowerCase().includes('text/html')
      ) {
        try {
          await upstreamRes.body?.cancel();
        } catch {
          // Ignore
        }
        return Response.json(
          {
            ok: false,
            error: `Server media menolak unduhan langsung (HTTP ${upstreamRes.status}).`,
          },
          { status: upstreamRes.status >= 400 ? upstreamRes.status : 502 }
        );
      }

      const finalFilename = sanitizeFilename(rawFilename, contentType);
      const asciiFallback = finalFilename.replace(/[^\x20-\x7E]/g, '_');
      const utf8Encoded = encodeURIComponent(finalFilename);

      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', contentType);
      responseHeaders.set(
        'Content-Disposition',
        `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`
      );
      responseHeaders.set('X-Content-Type-Options', 'nosniff');
      responseHeaders.set('Cache-Control', 'private, max-age=300');

      const upstreamLen = upstreamRes.headers.get('content-length');
      if (upstreamLen) {
        responseHeaders.set('Content-Length', upstreamLen);
      }
      const contentRange = upstreamRes.headers.get('content-range');
      if (contentRange) {
        responseHeaders.set('Content-Range', contentRange);
      }

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return Response.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Gagal mengalirkan berkas unduhan.',
        },
        { status: 502 }
      );
    }
  },
};
