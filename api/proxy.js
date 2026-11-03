import dns from 'node:dns';
import https from 'node:https';
import { enforceNodeApiSecurity } from '../lib/securityGate.js';

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
  'api.api-ninjas.com',
  'api.niellku.web.id',
  'api-synhs.my.id',
  'cloudflare-dns.com',
  'dns.google',
  'en.gravatar.com',
  'www.gravatar.com',
  'secure.gravatar.com',
  'api.github.com',
  'ipwho.is',
  'ipapi.co',
  'kodepos.vercel.app',
  'api.zippopotam.us',
  'chat.whatsapp.com',
  'www.whatsapp.com',
  'whatsapp.com',
  'pps.whatsapp.net',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
  'www.instagram.com',
  'i.instagram.com',
  'crt.sh',
  'rdap.org',
  'archive.org',
  'web.archive.org',
  'html.duckduckgo.com',
  'lite.duckduckgo.com',
  'gitlab.com',
  'www.reddit.com',
  'dev.to',
  'keybase.io',
  'hacker-news.firebaseio.com',
  'api.chess.com',
  'lichess.org',
  'registry.npmjs.org',
  'pypi.org',
  'hub.docker.com',
  't.me',
  'linktr.ee',
  'users.roblox.com',
  // Public Official CCTV JSON Catalog Endpoints (metadata only)
  'raw.githubusercontent.com',
  'balisatudata.baliprov.go.id',
  'atcs.denpasarkota.go.id',
  'api.data.gov.sg',
  'cwwp2.dot.ca.gov',
  'tie.digitraffic.fi',
  'webcams.nyctmc.org',
]);

// Dedicated allowlist for live HLS (.m3u8 / .ts / .m4s / init.mp4) & JPEG CCTV feeds
const ALLOWED_CCTV_STREAM_HOSTS = new Set([
  'dki-jkt.balitower.co.id',
  'pelindung.bandung.go.id',
  'atcs.denpasarkota.go.id',
  'transcode.baliprov.go.id',
  'its.binamarga.pu.go.id',
  'jmlive.jasamarga.com',
  'pub2.hk-opt.com',
  'cctv.citramarga.com',
  'cctv.mms-corp.id',
  'restreamer.kotabogor.go.id',
  'restreamer1.kotabogor.go.id',
  'restreamer2.kotabogor.go.id',
  'restreamer3.kotabogor.go.id',
  'restreamer4.kotabogor.go.id',
  'restreamer5.kotabogor.go.id',
  'restreamer6.kotabogor.go.id',
  'eofficev2.bekasikota.go.id',
  'atcs.tasikmalayakota.go.id',
  'itscctv-dishub.bogorkab.go.id',
  'cdn-globecast.akamaized.net',
  'cwwp2.dot.ca.gov',
  'weathercam.digitraffic.fi',
  'webcams.nyctmc.org',
]);

const ALLOWED_CCTV_PORTS = new Set(['', '443', '7028', '3443', '8443', '8989']);

const DENPASAR_ATCS_PUBLIC_HEADERS = {
  'x-client-id': 'a194e6ae-d4dd-4b62-a0ac-388922f09303',
  'x-client-secret': 'f430fde38a031fb657a2a7d6f84644a9aed767a4c22314d4b7c565648acc2396',
};

function getCctvRefererHeaders(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (host.endsWith('balitower.co.id')) {
    return { Referer: 'https://jakcctv.jakarta.go.id/', Origin: 'https://jakcctv.jakarta.go.id' };
  }
  if (host.endsWith('jasamarga.com') || host.endsWith('binamarga.pu.go.id')) {
    return { Referer: 'https://binamarga.pu.go.id/', Origin: 'https://binamarga.pu.go.id' };
  }
  if (host.endsWith('bandung.go.id')) {
    return { Referer: 'https://pelindung.bandung.go.id/', Origin: 'https://pelindung.bandung.go.id' };
  }
  if (host.endsWith('kotabogor.go.id')) {
    return { Referer: 'https://bsw.kotabogor.go.id/', Origin: 'https://bsw.kotabogor.go.id' };
  }
  if (host.endsWith('bekasikota.go.id')) {
    return { Referer: 'https://bekasikota.go.id/', Origin: 'https://bekasikota.go.id' };
  }
  if (host.endsWith('denpasarkota.go.id')) {
    return { Referer: 'https://atcs.denpasarkota.go.id/', Origin: 'https://atcs.denpasarkota.go.id' };
  }
  if (host.endsWith('baliprov.go.id')) {
    return { Referer: 'https://balisatudata.baliprov.go.id/', Origin: 'https://balisatudata.baliprov.go.id' };
  }
  return {};
}

function isAllowedCctvStreamUrl(parsedUrl) {
  if (!parsedUrl || parsedUrl.protocol !== 'https:') return false;
  const host = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_CCTV_STREAM_HOSTS.has(host)) return false;
  if (!ALLOWED_CCTV_PORTS.has(parsedUrl.port || '')) return false;
  const p = parsedUrl.pathname.toLowerCase();
  return (
    /\.(?:m3u8|ts|m4s|mp4|aac|jpe?g)$/i.test(p) ||
    /^\/webcam\/[^/]+\/viewer$/i.test(p)
  );
}

function rewriteHlsManifestForProxy(manifestText, baseManifestUrl) {
  const toProxyHref = (rawRef) => {
    const ref = String(rawRef || '').trim();
    if (!ref || ref.startsWith('data:')) return ref;
    try {
      const resolved = new URL(ref, baseManifestUrl);
      if (isAllowedCctvStreamUrl(resolved)) {
        return `/api/proxy?cctvStream=1&url=${encodeURIComponent(resolved.toString())}`;
      }
      return resolved.toString();
    } catch {
      return ref;
    }
  };

  return String(manifestText || '')
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith('#')) {
        // Rewrite URI="..." inside #EXT-X-MAP (fMP4 init.mp4), #EXT-X-MEDIA, #EXT-X-KEY, etc.
        return line.replace(/URI="([^"]+)"/gi, (_full, uriVal) => `URI="${toProxyHref(uriVal)}"`);
      }
      return toProxyHref(trimmed);
    })
    .join('\n');
}

function fetchPinnedHttpsBuffer(urlString, headers, timeoutMs = 5500, maxBytes = 4 * 1024 * 1024, redirectsLeft = 2) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (err) {
      reject(err);
      return;
    }

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers,
        // Scoped strictly to pinned public Pemda/Dishub CCTV hosts whose intermediate CA chains are incomplete in OpenSSL
        rejectUnauthorized: false,
      },
      (res) => {
        const status = res.statusCode || 502;
        const loc = res.headers.location;
        if (status >= 300 && status < 400 && loc && redirectsLeft > 0) {
          res.resume();
          try {
            const nextUrl = new URL(loc, parsed.toString());
            if (!ALLOWED_CCTV_STREAM_HOSTS.has(nextUrl.hostname.toLowerCase())) {
              reject(new Error('Redirect CCTV keluar dari allowlist host.'));
              return;
            }
            fetchPinnedHttpsBuffer(nextUrl.toString(), headers, timeoutMs, maxBytes, redirectsLeft - 1)
              .then(resolve)
              .catch(reject);
          } catch (e) {
            reject(e);
          }
          return;
        }

        const chunks = [];
        let total = 0;
        res.on('data', (chunk) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy(new Error('Segmen CCTV melebihi batas keamanan 4 MB.'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({
            status,
            contentType: String(res.headers['content-type'] || ''),
            buffer: Buffer.concat(chunks),
            finalUrl: parsed.toString(),
          });
        });
        res.on('error', reject);
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Timeout mengambil stream CCTV upstream.'));
    });
    req.on('error', reject);
    req.end();
  });
}

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
  const isCctvStreamGet =
    req.method === 'GET' && String(req.query?.cctvStream || '') === '1';

  if (isCctvStreamGet) {
    const mediaSec = enforceNodeApiSecurity(req, res, {
      routeName: 'cctv-stream',
      mode: 'media',
      guestRatePerMin: 240,
      vipRatePerMin: 360,
    });
    if (!mediaSec.allowed) return;

    const rawStreamUrl =
      typeof req.query?.url === 'string' ? req.query.url.trim() : '';
    if (!rawStreamUrl || rawStreamUrl.length > 1024) {
      return res.status(400).json({ ok: false, error: 'Parameter url CCTV tidak valid.' });
    }

    let parsedCctv;
    try {
      parsedCctv = new URL(rawStreamUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Format URL CCTV tidak valid.' });
    }

    if (!isAllowedCctvStreamUrl(parsedCctv)) {
      return res.status(403).json({
        ok: false,
        error: `Host/path stream CCTV tidak termasuk daftar publik resmi: ${parsedCctv.hostname}`,
      });
    }

    try {
      const upstreamCctv = await fetchPinnedHttpsBuffer(
        parsedCctv.toString(),
        {
          Accept:
            'application/vnd.apple.mpegurl, application/x-mpegurl, video/*, image/*, */*',
          'User-Agent': req.headers?.['user-agent'] || DEFAULT_UA,
          ...getCctvRefererHeaders(parsedCctv.hostname),
        },
        5500,
        4 * 1024 * 1024
      );

      if (upstreamCctv.status < 200 || upstreamCctv.status >= 300 || upstreamCctv.buffer.byteLength === 0) {
        return res.status(502).json({
          ok: false,
          status: upstreamCctv.status,
          error: 'Sumber kamera CCTV sedang tidak merespons segmen aktif.',
        });
      }

      const pathLower = parsedCctv.pathname.toLowerCase();
      const ctLower = upstreamCctv.contentType.toLowerCase();
      const isManifest =
        pathLower.endsWith('.m3u8') ||
        ctLower.includes('mpegurl') ||
        upstreamCctv.buffer.subarray(0, 16).toString('utf8').startsWith('#EXTM3U');

      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (isManifest) {
        const rawText = upstreamCctv.buffer.toString('utf8');
        if (!rawText.includes('#EXTM3U')) {
          return res.status(502).json({
            ok: false,
            error: 'Respons server kamera bukan manifest HLS (#EXTM3U) aktif.',
          });
        }
        const rewritten = rewriteHlsManifestForProxy(rawText, upstreamCctv.finalUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        return res.status(200).send(rewritten);
      }

      const resolvedMime = pathLower.endsWith('.ts')
        ? 'video/mp2t'
        : pathLower.endsWith('.m4s')
          ? 'video/iso.segment'
          : pathLower.endsWith('.mp4')
            ? 'video/mp4'
            : pathLower.endsWith('.aac')
              ? 'audio/aac'
              : ctLower.startsWith('image/')
                ? ctLower.split(';')[0]
                : upstreamCctv.contentType || 'application/octet-stream';

      res.setHeader('Content-Type', resolvedMime);
      return res.status(200).send(upstreamCctv.buffer);
    } catch {
      return res.status(504).json({
        ok: false,
        error: 'Timeout / gagal menjangkau stream CCTV pemerintah/publik.',
      });
    }
  }

  const isProbeGet = req.method === 'GET' && String(req.query?.probe || '') === '1';

  let parsedBodyPreview = req.body;
  if (!isProbeGet && typeof parsedBodyPreview === 'string') {
    if (Buffer.byteLength(parsedBodyPreview, 'utf8') > 6 * 1024 * 1024) {
      return res.status(413).json({ ok: false, error: 'Payload melebihi batas keamanan 6 MB.' });
    }
    try {
      parsedBodyPreview = JSON.parse(parsedBodyPreview);
    } catch {
      parsedBodyPreview = null;
    }
  }

  const isUploadAction = Boolean(parsedBodyPreview?.action === 'uploadImage');
  const isProbePayload = isProbeGet || Boolean(parsedBodyPreview?.probe);
  const rawAuthHeader = String(
    parsedBodyPreview?.headers?.Authorization ||
      parsedBodyPreview?.headers?.authorization ||
      parsedBodyPreview?.headers?.['x-api-key'] ||
      parsedBodyPreview?.headers?.['X-Api-Key'] ||
      ''
  ).trim();
  const rawTargetPreview = String(parsedBodyPreview?.targetUrl || '').trim();
  const rawInnerBodyPreview =
    typeof parsedBodyPreview?.body === 'string' ? parsedBodyPreview.body : '';
  const isVisionMultimodalPost =
    !isUploadAction &&
    parsedBodyPreview?.method === 'POST' &&
    /(?:\/chat\/completions|\/responses|\/messages|:generateContent)(?:\?|$)/i.test(
      rawTargetPreview
    ) &&
    /(?:"image_url"|"inline_data"|"inlineData"|"type"\s*:\s*"image")/.test(
      rawInnerBodyPreview
    );
  const isModelsDiscovery =
    Boolean(parsedBodyPreview?.routerRelay) && /\/models(?:\?|$)/i.test(rawTargetPreview);
  const hasPersonalByokRelay =
    Boolean(parsedBodyPreview?.routerRelay) &&
    (rawAuthHeader.length >= 16 || isModelsDiscovery);

  const sec = enforceNodeApiSecurity(req, res, {
    routeName: isUploadAction ? 'proxy-upload' : 'proxy',
    mode: isUploadAction ? 'media' : 'api',
    isDiagnostic: isProbePayload,
    allowByokBypass: hasPersonalByokRelay,
    maxBodyBytes: isUploadAction
      ? 6 * 1024 * 1024
      : isVisionMultimodalPost
        ? 2 * 1024 * 1024
        : 131072,
    guestRatePerMin: isUploadAction ? 6 : 20,
    vipRatePerMin: isUploadAction ? 15 : 60,
  });
  if (!sec.allowed) return;

  // Extra check for uploadImage: require proof header AND block if 5-trial quota is already exhausted
  if (isUploadAction && !sec.isAdminDiag) {
    const clientProof = String(req.headers?.['x-nodata-proof'] || '').trim();
    if (!clientProof) {
      return res.status(403).json({
        ok: false,
        code: 'PROOF_REQUIRED',
        error: 'Token keamanan diperlukan untuk mengunggah gambar.',
      });
    }
    if (sec.session?.tier === 'guest' && Number(sec.session?.used || 0) >= 5) {
      return res.status(402).json({
        ok: false,
        code: 'TRIAL_EXHAUSTED',
        used: 5,
        limit: 5,
        remaining: 0,
        error: 'Masa uji coba gratis 5x telah habis. Masukkan sandi akses untuk melanjutkan.',
      });
    }
  }

  if (req.method !== 'POST' && !isProbeGet) {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let payload = isProbeGet ? null : parsedBodyPreview;
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
  } else if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ ok: false, error: 'Payload JSON tidak valid.' });
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
  const isApiNinjas = parsedUrl.hostname === 'api.api-ninjas.com';
  const isApiNinjasRandomImg =
    isApiNinjas && parsedUrl.pathname === '/v1/randomimage';
  const isRawGithub = parsedUrl.hostname === 'raw.githubusercontent.com';
  const isDenpasarAtcs = parsedUrl.hostname === 'atcs.denpasarkota.go.id';

  // Confused-deputy path pinning: API Ninjas is strictly restricted to /v1/randomimage
  if (isApiNinjas && !isApiNinjasRandomImg) {
    return res.status(403).json({
      ok: false,
      error: 'Endpoint API Ninjas selain /v1/randomimage tidak diizinkan.',
    });
  }

  // Confused-deputy path pinning: raw.githubusercontent.com is strictly restricted to verified public CCTV catalogs
  if (
    isRawGithub &&
    !/^\/(?:hozin-king\/cctv-id-scraper|hendraptaksu\/cctv-denpasar)\//i.test(
      parsedUrl.pathname
    )
  ) {
    return res.status(403).json({
      ok: false,
      error: 'Path raw.githubusercontent.com tidak termasuk katalog CCTV publik yang diizinkan.',
    });
  }

  // Sanitize extraHeaders to prevent hop-by-hop or server-credential override
  const sanitizedExtraHeaders = {};
  const blockedHeaderNames = new Set([
    'host',
    'cookie',
    'set-cookie',
    'x-forwarded-for',
    'x-real-ip',
    'x-vercel-forwarded-for',
    'connection',
    'transfer-encoding',
  ]);
  for (const [hk, hv] of Object.entries(extraHeaders)) {
    const lk = String(hk || '').trim().toLowerCase();
    if (!lk || blockedHeaderNames.has(lk)) continue;
    if ((lk === 'x-api-key' || lk === 'authorization') && !routerRelay) continue;
    if (typeof hv === 'string' && hv.length <= 4096) {
      sanitizedExtraHeaders[hk] = hv;
    }
  }

  const envNinjasKey = (process.env.API_NINJAS_KEY || '').trim();
  const envNinjasKey2 = (process.env.API_NINJAS_KEY_2 || '').trim();

  const forwardHeaders = {
    Accept: isApiNinjasRandomImg
      ? 'image/jpg'
      : 'image/*, audio/*, application/json, text/event-stream, text/plain, */*',
    'User-Agent': isNominatim
      ? 'NodataGPT-HyperLocalWeather/3.1 (https://www.nodatagpt.web.id)'
      : req.headers?.['user-agent'] || DEFAULT_UA,
    ...sanitizedExtraHeaders,
    ...getCctvRefererHeaders(parsedUrl.hostname),
    ...(isDenpasarAtcs ? DENPASAR_ATCS_PUBLIC_HEADERS : {}),
    ...(isPximg ? { Referer: 'https://www.pixiv.net/' } : {}),
    ...(isApiNinjasRandomImg && envNinjasKey ? { 'X-Api-Key': envNinjasKey } : {}),
  };

  const startedAt = Date.now();

  if (isDenpasarAtcs && method === 'GET' && !probeOnly) {
    try {
      const denpasarResp = await fetchPinnedHttpsBuffer(
        parsedUrl.toString(),
        forwardHeaders,
        Math.min(timeoutMs, 10000),
        2 * 1024 * 1024
      );
      return res.status(200).json({
        ok: denpasarResp.status >= 200 && denpasarResp.status < 300,
        status: denpasarResp.status,
        kind: 'text',
        contentType: denpasarResp.contentType || 'application/json',
        latencyMs: Date.now() - startedAt,
        finalUrl: denpasarResp.finalUrl,
        body: denpasarResp.buffer.toString('utf8'),
      });
    } catch {
      return res.status(504).json({
        ok: false,
        status: 504,
        latencyMs: Date.now() - startedAt,
        error: 'Gagal mengambil katalog ATCS Kota Denpasar.',
      });
    }
  }

  try {
    let upstream = await fetchWithRetry(
      parsedUrl.toString(),
      {
        method,
        headers: forwardHeaders,
        body: method === 'POST' ? requestBody : undefined,
      },
      timeoutMs
    );

    // Automatic server-side failover to API_NINJAS_KEY_2 if primary key hits quota/401/403/429
    if (
      isApiNinjasRandomImg &&
      envNinjasKey2 &&
      envNinjasKey2 !== envNinjasKey &&
      (upstream.status === 401 || upstream.status === 403 || upstream.status === 429)
    ) {
      upstream = await fetchWithRetry(
        parsedUrl.toString(),
        {
          method,
          headers: {
            ...forwardHeaders,
            'X-Api-Key': envNinjasKey2,
          },
          body: method === 'POST' ? requestBody : undefined,
        },
        Math.max(6000, timeoutMs - (Date.now() - startedAt))
      );
    }

    const latencyMs = Date.now() - startedAt;
    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

    if (
      upstream.ok &&
      (contentType.startsWith('image/') || isApiNinjasRandomImg)
    ) {
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

      const rawBytes = new Uint8Array(arrayBuf);
      // Detect whether payload is raw JPEG/PNG binary vs ASCII base64 ("/9j/..." or "iVBOR...")
      const looksLikeBase64Ascii =
        (rawBytes[0] === 0x2f && rawBytes[1] === 0x39 && rawBytes[2] === 0x6a) ||
        (rawBytes[0] === 0x69 && rawBytes[1] === 0x56 && rawBytes[2] === 0x42);

      const rawMime = contentType.split(';')[0] || 'image/jpeg';
      const mime =
        rawMime === 'image/jpg' || !rawMime.startsWith('image/')
          ? 'image/jpeg'
          : rawMime;

      const base64 = looksLikeBase64Ascii
        ? Buffer.from(arrayBuf).toString('utf8').replace(/\s+/g, '')
        : Buffer.from(arrayBuf).toString('base64');

      const decodedByteLength = looksLikeBase64Ascii
        ? Math.floor((base64.length * 3) / 4)
        : arrayBuf.byteLength;

      if (probeOnly) {
        return res.status(200).json({
          ok: true,
          status: upstream.status,
          kind: 'image',
          contentType: mime,
          wireEncoding: looksLikeBase64Ascii ? 'base64' : 'binary',
          byteLength: decodedByteLength,
          latencyMs,
        });
      }

      return res.status(200).json({
        ok: true,
        status: upstream.status,
        kind: 'image',
        contentType: mime,
        byteLength: decodedByteLength,
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
      finalUrl: upstream.url || parsedUrl.toString(),
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
