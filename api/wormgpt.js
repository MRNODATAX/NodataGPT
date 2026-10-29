export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawQuery = typeof req.query?.q === 'string' ? req.query.q : '';
  if (!rawQuery && typeof req.url === 'string') {
    const parsedUrl = new URL(req.url, 'http://localhost');
    rawQuery = parsedUrl.searchParams.get('q') || '';
  }

  if (!rawQuery.trim()) {
    return res.status(400).json({
      status: false,
      message: 'Parameter q wajib diisi.',
    });
  }

  const upstreamUrl = `https://bintangapi.my.id/api/aichat/wormgpt?q=${encodeURIComponent(rawQuery)}`;
  const clientUa =
    req.headers?.['user-agent'] ||
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': clientUa,
      },
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    const body = await upstream.text();

    res.setHeader('Content-Type', contentType);
    return res.status(upstream.status).send(body);
  } catch {
    return res.status(502).json({
      status: false,
      message: 'Gagal menghubungi upstream BintangAPI dari server.',
    });
  }
}
