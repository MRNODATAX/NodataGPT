const ALLOWED_HOSTS = new Set([
  'api.neosoft.best',
  'text.pollinations.ai',
  'image.pollinations.ai',
  'stenly.org',
  'api.llm7.io',
  'api-xemoz-official.my.id',
  'app.unlimitedai.chat',
  'asyntai.com',
  'apiii-xrina.my.id',
  'v2.api-varhad.my.id',
  'comiku.my.id',
  'bintangapi.my.id',
  'api.nexray.eu.cc',
  'api.deepseek.com',
  'generativelanguage.googleapis.com',
]);

const DEFAULT_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
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
  const timeoutMs = Math.min(Math.max(Number(payload?.timeoutMs) || 22000, 4000), 38000);

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
    Accept: 'application/json, text/plain, image/*, */*',
    'User-Agent': req.headers?.['user-agent'] || DEFAULT_UA,
    ...extraHeaders,
  };

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      method,
      headers: forwardHeaders,
      body: method === 'POST' ? requestBody : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

    if (upstream.ok && contentType.startsWith('image/')) {
      const arrayBuf = await upstream.arrayBuffer();
      if (arrayBuf.byteLength < 256) {
        return res.status(502).json({ ok: false, error: 'Berkas gambar kosong dari upstream.' });
      }
      const base64 = Buffer.from(arrayBuf).toString('base64');
      const mime = contentType.split(';')[0] || 'image/jpeg';
      return res.status(200).json({
        ok: true,
        status: upstream.status,
        kind: 'image',
        contentType: mime,
        imageUrl: `data:${mime};base64,${base64}`,
      });
    }

    const textBody = await upstream.text();
    return res.status(200).json({
      ok: upstream.ok,
      status: upstream.status,
      kind: 'text',
      contentType,
      body: textBody,
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError' || /timeout|aborted/i.test(err.message));

    return res.status(504).json({
      ok: false,
      error: isTimeout
        ? 'Waktu tunggu habis pada server model ini.'
        : 'Gagal menghubungi server model AI.',
    });
  }
}
