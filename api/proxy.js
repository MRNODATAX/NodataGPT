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
  'api.deepseek.com',
  'generativelanguage.googleapis.com',
]);

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

  const targetUrl = typeof payload?.targetUrl === 'string' ? payload.targetUrl.trim() : '';
  const method = payload?.method === 'POST' ? 'POST' : 'GET';
  const extraHeaders =
    payload?.headers && typeof payload.headers === 'object' ? payload.headers : {};
  const requestBody = typeof payload?.body === 'string' ? payload.body : undefined;
  const timeoutMs = Math.min(Math.max(Number(payload?.timeoutMs) || 24000, 4000), 52000);
  const probeOnly = Boolean(payload?.probe);

  if (!targetUrl) {
    return res.status(400).json({ ok: false, error: 'targetUrl wajib diisi.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'Format targetUrl tidak valid.' });
  }

  if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return res.status(403).json({
      ok: false,
      error: `Host tidak diizinkan oleh gateway NodataGPT: ${parsedUrl.hostname}`,
    });
  }

  const forwardHeaders = {
    Accept: 'image/*, application/json, text/plain, */*',
    'User-Agent': req.headers?.['user-agent'] || DEFAULT_UA,
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
