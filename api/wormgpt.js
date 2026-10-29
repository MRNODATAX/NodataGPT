export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery = typeof req.query?.q === 'string' ? req.query.q : '';
  if (!rawQuery.trim()) {
    return res.status(400).json({
      status: false,
      message: 'Parameter q wajib diisi.',
    });
  }

  const upstreamUrl = `https://bintangapi.my.id/api/aichat/wormgpt?q=${encodeURIComponent(rawQuery)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'WormGPT-Vercel/2.5',
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
