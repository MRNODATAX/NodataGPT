import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if unsupported in runtime
}

const ALLOWED_HOSTS = new Set([
  'api.neosoft.best',
  'text.pollinations.ai',
  'image.pollinations.ai',
  'gen.pollinations.ai',
  'stenly.org',
  'www.stenly.org',
  'api.llm7.io',
  'api-xemoz-official.my.id',
  'app.unlimitedai.chat',
  'asyntai.com',
  'apiii-xrina.my.id',
  'v2.api-varhad.my.id',
  'api-varhad.my.id',
  'comiku.my.id',
  'bintangapi.my.id',
  'api.nexray.eu.cc',
  'api.synoxcloud.xyz',
  'api.snowping.cfd',
  'images.meigen.ai',
  'sora.aritek.app',
  'cdn-spotify.zm.io.vn',
  'wxtechhk.oss-cn-hongkong.aliyuncs.com',
  'dl.snapcdn.app',
  'www.omdown.site',
  'i.pinimg.com',
  'www.gstatic.com',
  'data.bmkg.go.id',
  'static.bmkg.go.id',
  '9router.com',
  'www.9router.com',
  'omniroute.dev',
  'www.omniroute.dev',
  'omnirouter.li',
  'openrouter.ai',
  'us.openrouter.ai',
  'eu.openrouter.ai',
  'api.deepseek.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'integrate.api.nvidia.com',
  'api.cerebras.ai',
  'api.anthropic.com',
  'api.openai.com',
  'api.x.ai',
  'api.perplexity.ai',
  'api.mistral.ai',
  'api.together.xyz',
  'api.siliconflow.cn',
  'api.siliconflow.com',
  'api.fireworks.ai',
  'llm.chutes.ai',
  'opencode.ai',
  'cloud.omniroute.online',
  'www.tikwm.com',
  'tikwm.com',
  'wttr.in',
  'api.myquran.com',
  'open.er-api.com',
  'api.gold-api.com',
  'api.coingecko.com',
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
  'zenquotes.io',
  'starlabs.biz.id',
  'uguu.se',
  'h.uguu.se',
  'litterbox.catbox.moe',
  'files.catbox.moe',
  'catbox.moe',
  'lunara.softbotz.my.id',
  'cdn.nekohime.site',
  'direct.lunee.lol',
  'ai.zelai.qzz.io',
  'api.siputzx.my.id',
  'brat.siputzx.my.id',
  'shinana-brat.hf.space',
  'api-faa.my.id',
  'api.memegen.link',
  'my.izuka-api.xyz',
  'api.bmkg.go.id',
  'api-apps.bmkg.go.id',
  'nominatim.openstreetmap.org',
  'geocoding-api.open-meteo.com',
  'api.open-meteo.com',
  'air-quality-api.open-meteo.com',
  'i.pximg.net',
  'wallhaven.cc',
  'w.wallhaven.cc',
  'th.wallhaven.cc',
  'picsum.photos',
  'fastly.picsum.photos',
  'nekos.best',
]);

const ALLOWED_ROUTER_PATH_SUFFIXES = [
  '/models',
  '/models/user',
  '/models/web',
  '/model/info',
  '/auth/key',
  '/key',
  '/chat/completions',
  '/completions',
  '/responses',
  '/messages',
  '/images/generations',
  '/videos/generations',
  '/audio/speech',
];

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

function isAllowedCustomRouterUrl(parsedUrl) {
  if (!parsedUrl) return false;
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') return false;
  if (isBlockedInternalHost(parsedUrl.hostname)) return false;
  const cleanPath = String(parsedUrl.pathname || '').replace(/\/+$/, '').toLowerCase();
  return ALLOWED_ROUTER_PATH_SUFFIXES.some((suffix) => cleanPath.endsWith(suffix));
}

async function resolvesToPrivateAddress(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (isBlockedInternalHost(host)) return true;
  if (ALLOWED_HOSTS.has(host)) return false;
  try {
    const records = await dns.promises.lookup(host, { all: true });
    if (!Array.isArray(records) || records.length === 0) return false;
    return records.some((rec) => isBlockedInternalHost(rec.address));
  } catch {
    return false;
  }
}

const DEFAULT_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

export const config = {
  maxDuration: 60,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, timeoutMs) {
  const start = Date.now();

  for (let attempt = 0; attempt < 2; attempt++) {
    const elapsed = Date.now() - start;
    const remaining = timeoutMs - elapsed;
    if (remaining < 2500) {
      throw new Error('Waktu tunggu habis pada server model ini.');
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(remaining),
      });

      if (response.status === 429 && attempt === 0 && timeoutMs - (Date.now() - start) > 4500) {
        await sleep(1150);
        continue;
      }

      return response;
    } catch (err) {
      const stillRemaining = timeoutMs - (Date.now() - start);
      const isConnectGlitch =
        attempt === 0 &&
        stillRemaining > 5000 &&
        err instanceof Error &&
        !/TimeoutError|aborted/i.test(err.name);

      if (isConnectGlitch) {
        await sleep(350);
        continue;
      }
      throw err;
    }
  }

  throw new Error('Gagal menghubungi server model AI.');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isProbeGet = req.method === 'GET' && String(req.query?.probe || '') === '1';

  if (req.method !== 'POST' && !isProbeGet) {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let payload = req.body;
  if (isProbeGet) {
    payload = {
      targetUrl: typeof req.query?.targetUrl === 'string' ? req.query.targetUrl : '',
      method: req.query?.method === 'POST' ? 'POST' : 'GET',
      headers:
        req.query?.method === 'POST'
          ? { 'Content-Type': 'application/json' }
          : {},
      body: typeof req.query?.body === 'string' ? req.query.body : undefined,
      timeoutMs: Number(req.query?.timeoutMs) || 28000,
      probe: true,
    };
  } else if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ ok: false, error: 'Payload JSON tidak valid.' });
    }
  }

  if (payload?.action === 'uploadImage') {
    const rawBase64 = typeof payload.base64 === 'string' ? payload.base64.trim() : '';
    const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/, '');
    if (!cleanBase64 || cleanBase64.length < 32) {
      return res.status(400).json({ ok: false, error: 'Data gambar base64 tidak valid.' });
    }
    const buf = Buffer.from(cleanBase64, 'base64');
    if (buf.byteLength < 64 || buf.byteLength > 4 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        error: 'Ukuran gambar maksimal 4 MB untuk unggahan sementara.',
      });
    }

    const mimeType =
      typeof payload.mimeType === 'string' && /^image\/(png|jpe?g|webp|gif)$/i.test(payload.mimeType)
        ? payload.mimeType.toLowerCase()
        : 'image/jpeg';
    const ext = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
        ? 'webp'
        : mimeType.includes('gif')
          ? 'gif'
          : 'jpg';
    const safeName = `nodatagpt-${Date.now()}.${ext}`;
    const blob = new Blob([buf], { type: mimeType });

    // Primary uploader: uguu.se (verified temporary public URL)
    try {
      const fd1 = new FormData();
      fd1.append('files[]', blob, safeName);
      const up1 = await fetch('https://uguu.se/upload?output=text', {
        method: 'POST',
        headers: { 'User-Agent': DEFAULT_UA },
        body: fd1,
        signal: AbortSignal.timeout(22000),
      });
      if (up1.ok) {
        const txt1 = (await up1.text()).trim();
        const firstLine = txt1.split(/\s+/)[0] || '';
        if (/^https:\/\/\S+/i.test(firstLine)) {
          return res.status(200).json({ ok: true, url: firstLine, provider: 'uguu.se' });
        }
      }
    } catch {
      // Fall through to Litterbox backup
    }

    // Fallback 2: Litterbox 1h temporary storage
    try {
      const fd2 = new FormData();
      fd2.append('reqtype', 'fileupload');
      fd2.append('time', '1h');
      fd2.append('fileToUpload', blob, safeName);
      const up2 = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        headers: { 'User-Agent': DEFAULT_UA },
        body: fd2,
        signal: AbortSignal.timeout(20000),
      });
      if (up2.ok) {
        const txt2 = (await up2.text()).trim();
        if (/^https:\/\/\S+/i.test(txt2)) {
          return res.status(200).json({ ok: true, url: txt2, provider: 'litterbox' });
        }
      }
    } catch {
      // Fall through to Lunara
    }

    // Fallback 3: Lunara Pro (lunara.softbotz.my.id/upload)
    try {
      const fd3 = new FormData();
      fd3.append('file', blob, safeName);
      fd3.append('filename', safeName);
      const up3 = await fetch('https://lunara.softbotz.my.id/upload', {
        method: 'POST',
        headers: { 'User-Agent': DEFAULT_UA },
        body: fd3,
        signal: AbortSignal.timeout(20000),
      });
      if (up3.ok) {
        const j3 = await up3.json().catch(() => null);
        const url3 = String(j3?.file_url || j3?.url || j3?.data?.url || '').trim();
        if (/^https:\/\/\S+/i.test(url3)) {
          return res.status(200).json({ ok: true, url: url3, provider: 'lunara' });
        }
      }
    } catch {
      // Fall through to Nekohime CDN
    }

    // Fallback 4: Nekohime CDN (cdn.nekohime.site/upload)
    try {
      const fd4 = new FormData();
      fd4.append('file', blob, safeName);
      const up4 = await fetch('https://cdn.nekohime.site/upload', {
        method: 'POST',
        headers: { 'User-Agent': DEFAULT_UA },
        body: fd4,
        signal: AbortSignal.timeout(20000),
      });
      if (up4.ok) {
        const j4 = await up4.json().catch(() => null);
        const firstFile = Array.isArray(j4?.files) ? j4.files[0] : null;
        const rawUrl4 = String(
          firstFile?.url || firstFile || j4?.url || j4?.data?.url || ''
        ).trim();
        const url4 = rawUrl4.startsWith('/')
          ? `https://cdn.nekohime.site${rawUrl4}`
          : rawUrl4;
        if (/^https:\/\/\S+/i.test(url4)) {
          return res.status(200).json({ ok: true, url: url4, provider: 'nekohime' });
        }
      }
    } catch {
      // Fall through to LuneTools
    }

    // Fallback 5: LuneTools Direct Cloud (direct.lunee.lol/api/upload?format=text)
    try {
      const fd5 = new FormData();
      fd5.append('file', blob, safeName);
      const up5 = await fetch('https://direct.lunee.lol/api/upload?format=text', {
        method: 'POST',
        headers: { 'User-Agent': DEFAULT_UA },
        body: fd5,
        signal: AbortSignal.timeout(20000),
      });
      if (up5.ok) {
        const txt5 = (await up5.text()).trim();
        const line5 = txt5.split(/\s+/)[0] || '';
        if (/^https:\/\/\S+/i.test(line5)) {
          return res.status(200).json({ ok: true, url: line5, provider: 'lunee' });
        }
      }
    } catch {
      // Exhausted all 5 uploaders
    }

    return res.status(502).json({
      ok: false,
      error: 'Gagal mengunggah gambar sementara ke server publik. Coba gunakan tautan gambar langsung.',
    });
  }

  const targetUrl = typeof payload?.targetUrl === 'string' ? payload.targetUrl.trim() : '';
  const method = payload?.method === 'POST' ? 'POST' : 'GET';
  const extraHeaders =
    payload?.headers && typeof payload.headers === 'object' ? payload.headers : {};
  const requestBody = typeof payload?.body === 'string' ? payload.body : undefined;
  const timeoutMs = Math.min(Math.max(Number(payload?.timeoutMs) || 24000, 4000), 52000);
  const probeOnly = Boolean(payload?.probe);
  const routerRelay = Boolean(payload?.routerRelay);

  if (!targetUrl) {
    return res.status(400).json({ ok: false, error: 'targetUrl wajib diisi.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'Format targetUrl tidak valid.' });
  }

  const isStandardAllowed =
    parsedUrl.protocol === 'https:' && ALLOWED_HOSTS.has(parsedUrl.hostname);
  const isCustomRouterAllowed =
    routerRelay && isAllowedCustomRouterUrl(parsedUrl);

  if (!isStandardAllowed && !isCustomRouterAllowed) {
    if (routerRelay && isBlockedInternalHost(parsedUrl.hostname)) {
      return res.status(400).json({
        ok: false,
        error:
          'Endpoint jaringan lokal (seperti http://localhost:20128/v1) harus dipanggil langsung dari browser perangkat Anda.',
      });
    }
    return res.status(403).json({
      ok: false,
      error: `Host tidak diizinkan oleh gateway NodataGPT: ${parsedUrl.hostname}`,
    });
  }

  if (isCustomRouterAllowed && (await resolvesToPrivateAddress(parsedUrl.hostname))) {
    return res.status(403).json({
      ok: false,
      error: 'Host mengarah ke jaringan privat/lokal dan tidak dapat diproksi dari server cloud.',
    });
  }

  const isNominatim = parsedUrl.hostname === 'nominatim.openstreetmap.org';
  const isPximg = parsedUrl.hostname.endsWith('pximg.net');

  const forwardHeaders = {
    Accept: 'image/*, audio/*, application/json, text/event-stream, text/plain, */*',
    'User-Agent': isNominatim
      ? 'NodataGPT-HyperLocalWeather/3.1 (https://www.nodatagpt.web.id)'
      : req.headers?.['user-agent'] || DEFAULT_UA,
    ...(isPximg ? { Referer: 'https://www.pixiv.net/' } : {}),
    ...extraHeaders,
  };

  const startedAt = Date.now();

  try {
    const upstream = await fetchWithRetry(
      parsedUrl.toString(),
      {
        method,
        headers: forwardHeaders,
        body: method === 'POST' ? requestBody : undefined,
      },
      timeoutMs
    );

    const latencyMs = Date.now() - startedAt;
    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

    if (upstream.ok && contentType.startsWith('image/')) {
      const arrayBuf = await upstream.arrayBuffer();
      if (arrayBuf.byteLength < 256) {
        return res.status(probeOnly ? 200 : 502).json({
          ok: false,
          status: upstream.status,
          kind: 'image-empty',
          contentType,
          byteLength: arrayBuf.byteLength,
          latencyMs,
          error: 'Berkas gambar kosong dari upstream.',
        });
      }

      const mime = contentType.split(';')[0] || 'image/jpeg';

      if (probeOnly) {
        return res.status(200).json({
          ok: true,
          status: upstream.status,
          kind: 'image',
          contentType: mime,
          byteLength: arrayBuf.byteLength,
          latencyMs,
        });
      }

      const base64 = Buffer.from(arrayBuf).toString('base64');
      return res.status(200).json({
        ok: true,
        status: upstream.status,
        kind: 'image',
        contentType: mime,
        byteLength: arrayBuf.byteLength,
        latencyMs,
        imageUrl: `data:${mime};base64,${base64}`,
      });
    }

    if (upstream.ok && contentType.startsWith('audio/')) {
      const arrayBuf = await upstream.arrayBuffer();
      if (arrayBuf.byteLength < 256) {
        return res.status(502).json({
          ok: false,
          status: upstream.status,
          kind: 'audio-empty',
          contentType,
          byteLength: arrayBuf.byteLength,
          latencyMs,
          error: 'Berkas audio kosong dari upstream.',
        });
      }

      const mime = contentType.split(';')[0] || 'audio/mpeg';
      if (probeOnly) {
        return res.status(200).json({
          ok: true,
          status: upstream.status,
          kind: 'audio',
          contentType: mime,
          byteLength: arrayBuf.byteLength,
          latencyMs,
        });
      }

      const base64 = Buffer.from(arrayBuf).toString('base64');
      return res.status(200).json({
        ok: true,
        status: upstream.status,
        kind: 'audio',
        contentType: mime,
        byteLength: arrayBuf.byteLength,
        latencyMs,
        audioUrl: `data:${mime};base64,${base64}`,
      });
    }

    const textBody = await upstream.text();
    if (probeOnly) {
      return res.status(200).json({
        ok: upstream.ok,
        status: upstream.status,
        kind: 'text',
        contentType,
        byteLength: textBody.length,
        latencyMs,
        preview: textBody.slice(0, 700),
      });
    }

    return res.status(200).json({
      ok: upstream.ok,
      status: upstream.status,
      kind: 'text',
      contentType,
      latencyMs,
      body: textBody,
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' ||
        err.name === 'AbortError' ||
        /timeout|aborted|Waktu tunggu/i.test(err.message));

    return res.status(probeOnly ? 200 : 504).json({
      ok: false,
      status: 504,
      latencyMs,
      error: isTimeout
        ? 'Waktu tunggu habis pada server model ini.'
        : 'Gagal menghubungi server model AI.',
    });
  }
}
