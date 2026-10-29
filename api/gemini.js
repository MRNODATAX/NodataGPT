import dns from 'node:dns';
import crypto from 'node:crypto';

// Force IPv4-first DNS resolution on Vercel Node 24 to prevent 10s IPv6 connect blackholes
dns.setDefaultResultOrder('ipv4first');

const GOOGLE_PREFLIGHT_URL = 'https://www.google.com/?hl=en';
const GEMINI_INIT_URL = 'https://gemini.google.com/app?hl=en';
const GEMINI_STREAM_GENERATE_URL =
  'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

const CONSENT_SOCS_COOKIE =
  'CAISHAgBEhJnd3NfMjAyNDA4MTQtMF9SQzIaAmVuIAEaBgiAo_CmBg';

const FLASH_LITE_MODEL_ID = 'cf41b0e0dd7d53e5';
const FLASH_MODEL_ID = 'fbb127bbb056c959';

const SESSION_TTL_MS = 8 * 60 * 1000;

const GOOGLE_WEB_ERROR_PHRASES = [
  "Sorry, something went wrong. Please try your request again.",
  'I encountered an error doing what you asked. Could you try again?',
  'Something went wrong. Please try again.',
  'An error occurred. Please try again.',
  'I seem to be encountering an error. Can I try something else for you?',
  'I seem to be encountering an error',
  "I'm having a hard time fulfilling your request. Can I help you with something else instead?",
  "I'm having a hard time fulfilling your request",
  'I am having a hard time fulfilling your request',
];

const RPC_ERROR_LABELS = {
  1013: 'TEMPORARY_ERROR_1013 (gangguan sementara internal Gemini)',
  1037: 'USAGE_LIMIT_EXCEEDED (batas kuota tercapai)',
  1050: 'MODEL_INCONSISTENT (model tidak konsisten dengan sesi)',
  1052: 'MODEL_HEADER_INVALID (header model tidak valid atau berubah)',
  1060: 'IP_TEMPORARILY_BLOCKED (IP server sementara dibatasi oleh Google)',
};

/** @type {{ jar: Map<string, string>, bl: string, fsid: string, at: string, hl: string, sessionId: string, reqid: number, mode: 'guest' | 'cookie', mintedAt: number } | null} */
let cachedSession = null;

function extractSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    const list = headers.getSetCookie();
    if (Array.isArray(list) && list.length > 0) return list;
  }
  const single = headers.get('set-cookie');
  if (!single) return [];
  return single.split(/,(?=\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=)/g);
}

function updateCookieJar(jar, response) {
  const rawCookies = extractSetCookies(response.headers);
  for (const raw of rawCookies) {
    if (!raw || typeof raw !== 'string') continue;
    const segments = raw.split(';');
    const first = segments[0]?.trim() || '';
    const eqIdx = first.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = first.slice(0, eqIdx).trim();
    const value = first.slice(eqIdx + 1).trim();
    const attrs = segments.slice(1).join(';').toLowerCase();
    if (!value || /max-age\s*=\s*0\b/.test(attrs)) {
      jar.delete(name);
    } else {
      jar.set(name, value);
    }
  }
}

function serializeCookieJar(jar) {
  const parts = [];
  for (const [k, v] of jar.entries()) {
    if (k && v) parts.push(`${k}=${v}`);
  }
  return parts.join('; ');
}

function extractMatch(html, regex) {
  const m = regex.exec(html);
  return m && m[1] ? m[1] : '';
}

export function isGoogleWebErrorReply(text) {
  const stripped = (text || '').trim();
  if (!stripped || stripped.includes('\n')) return false;
  for (const phrase of GOOGLE_WEB_ERROR_PHRASES) {
    if (stripped.startsWith(phrase) && stripped.length - phrase.length <= 90) {
      return true;
    }
  }
  return false;
}

export function stripGeminiInternalArtifacts(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(
      /https?:\/\/googleusercontent\.com\/(?:image_generation_content|image_retrieval|image_collection|card_content)[/\w]*\d*\n*/gi,
      ''
    )
    .replace(/```[a-zA-Z0-9_-]*\?code_stdout(?:&code_event_index=\d+)?\s*[\r\n][\s\S]*?```/gi, '')
    .replace(/\[file-tag:\s*[^\]\r\n]*\]/gi, '')
    .replace(/python\?code_reference(?:&code_event_index=\d+)?/gi, '')
    .replace(/[a-zA-Z0-9_-]*\?code_stdout(?:&code_event_index=\d+)?/gi, '')
    .trim();
}

export function scanTopLevelJsonArrays(rawBody) {
  const arrays = [];
  if (!rawBody || typeof rawBody !== 'string') return arrays;

  const len = rawBody.length;
  let i = 0;

  while (i < len) {
    // Locate start of a JSON array frame `[[` or `["wrb.fr"`
    const start = rawBody.indexOf('[', i);
    if (start === -1) break;

    let depth = 0;
    let inStr = false;
    let escape = false;
    let end = -1;

    for (let j = start; j < len; j++) {
      const ch = rawBody[j];
      if (inStr) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inStr = false;
        }
      } else {
        if (ch === '"') {
          inStr = true;
        } else if (ch === '[') {
          depth++;
        } else if (ch === ']') {
          depth--;
          if (depth === 0) {
            end = j;
            break;
          }
        }
      }
    }

    if (end === -1) break;

    const slice = rawBody.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) {
        arrays.push(parsed);
      }
    } catch {
      // Ignore non-JSON bracket slices
    }
    i = end + 1;
  }

  return arrays;
}

export function parseGeminiWrbStream(rawBody) {
  const frames = scanTopLevelJsonArrays(rawBody);
  let cumulativeText = '';
  let cumulativeThoughts = '';
  let cid = '';
  let rid = '';
  let rcid = '';
  let rpcErrorCode = null;
  let wrbFrameCount = 0;

  for (const outer of frames) {
    if (!Array.isArray(outer)) continue;
    for (const part of outer) {
      if (!Array.isArray(part)) continue;

      const maybeErr = part?.[5]?.[2]?.[0]?.[1]?.[0];
      if (typeof maybeErr === 'number' && rpcErrorCode === null) {
        rpcErrorCode = maybeErr;
      }

      if (part[0] !== 'wrb.fr' || typeof part[2] !== 'string') {
        continue;
      }

      wrbFrameCount++;
      let payload;
      try {
        payload = JSON.parse(part[2]);
      } catch {
        continue;
      }
      if (!Array.isArray(payload)) continue;

      if (Array.isArray(payload[1])) {
        if (typeof payload[1][0] === 'string' && payload[1][0]) cid = payload[1][0];
        if (typeof payload[1][1] === 'string' && payload[1][1]) rid = payload[1][1];
      }

      const candidates = payload[4];
      if (!Array.isArray(candidates) || candidates.length === 0) continue;

      const c0 = candidates[0];
      if (!Array.isArray(c0)) continue;

      if (typeof c0[0] === 'string' && c0[0]) {
        rcid = c0[0];
      }

      let frameText =
        Array.isArray(c0[1]) && typeof c0[1][0] === 'string' ? c0[1][0] : null;
      if (
        frameText &&
        /^https?:\/\/googleusercontent\.com\/card_content\/\d+/i.test(frameText) &&
        Array.isArray(c0[22]) &&
        typeof c0[22][0] === 'string'
      ) {
        frameText = c0[22][0];
      }

      if (typeof frameText === 'string') {
        cumulativeText = frameText;
      }

      const frameThoughts = c0?.[37]?.[0]?.[0];
      if (typeof frameThoughts === 'string' && frameThoughts) {
        cumulativeThoughts = frameThoughts;
      }
    }
  }

  return {
    text: stripGeminiInternalArtifacts(cumulativeText),
    thoughts: cumulativeThoughts.trim(),
    cid,
    rid,
    rcid,
    rpcErrorCode,
    wrbFrameCount,
    totalFrames: frames.length,
  };
}

export function build81SlotPayload({
  prompt,
  language = 'en',
  modelNumber = 1,
  thinkingLevel = 1,
}) {
  const requestUuid = crypto.randomUUID().toUpperCase();
  const inner = new Array(81).fill(null);

  inner[0] = [prompt, 0, null, null, null, null, 0];
  inner[1] = [language];
  inner[2] = ['', '', '', null, null, null, null, null, null, ''];
  inner[6] = [1];
  inner[7] = 1; // STREAMING_FLAG_INDEX
  inner[10] = 1;
  inner[11] = 0;
  inner[17] = [[0]];
  inner[18] = 0;
  inner[27] = 1;
  inner[30] = [4];
  inner[41] = [1];
  inner[53] = 0;
  inner[59] = requestUuid;
  inner[61] = [];
  inner[68] = 1;
  inner[79] = modelNumber;
  inner[80] = thinkingLevel;

  const outerJson = JSON.stringify([null, JSON.stringify(inner)]);
  return { outerJson, requestUuid };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function mintGeminiSession(forceRefresh = false) {
  if (
    !forceRefresh &&
    cachedSession &&
    Date.now() - cachedSession.mintedAt < SESSION_TTL_MS &&
    cachedSession.bl
  ) {
    cachedSession.reqid += 100000;
    return cachedSession;
  }

  const jar = new Map();
  let mode = 'guest';

  // Optional cookie upgrade if owner configures GEMINI_1PSID in environment later
  const envPsid = (process.env.GEMINI_1PSID || '').trim();
  const envPsidts = (process.env.GEMINI_1PSIDTS || '').trim();
  if (envPsid) {
    jar.set('__Secure-1PSID', envPsid);
    if (envPsidts) jar.set('__Secure-1PSIDTS', envPsidts);
    mode = 'cookie';
  }

  // Step 1: Anonymous preflight on www.google.com to acquire NID / AEC / ENID cookies
  if (mode === 'guest') {
    try {
      const preflightRes = await fetchWithTimeout(
        GOOGLE_PREFLIGHT_URL,
        {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': CHROME_UA,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          },
        },
        8000
      );
      updateCookieJar(jar, preflightRes);
    } catch {
      // Continue directly to gemini.google.com/app even if preflight hiccups
    }
  }

  // Step 2: Fetch https://gemini.google.com/app?hl=en to extract cfb2h (bl), FdrFJe (f.sid), SNlM0e (at)
  const fetchInitPage = async () => {
    const cookieHeader = serializeCookieJar(jar);
    const res = await fetchWithTimeout(
      GEMINI_INIT_URL,
      {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': CHROME_UA,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          Origin: 'https://gemini.google.com',
          Referer: 'https://gemini.google.com/',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      },
      10000
    );
    updateCookieJar(jar, res);
    const html = await res.text();
    return { res, html };
  };

  let { res: initRes, html } = await fetchInitPage();
  const finalUrl = initRes.url || '';

  // Handle Google EU/global consent screen redirect automatically
  if (finalUrl.includes('consent.google.com') || (!html.includes('cfb2h') && html.includes('consent.google.com'))) {
    jar.set('SOCS', CONSENT_SOCS_COOKIE);
    ({ res: initRes, html } = await fetchInitPage());
  }

  if (initRes.status === 429 || (initRes.url || '').includes('/sorry')) {
    throw new Error(
      `Google membatasi IP server sementara (HTTP ${initRes.status} /sorry challenge).`
    );
  }

  if (!initRes.ok) {
    throw new Error(`Gagal membuka sesi Gemini Web (HTTP ${initRes.status}).`);
  }

  const bl = extractMatch(html, /"cfb2h"\s*:\s*"([^"]+)"/);
  const fsid = extractMatch(html, /"FdrFJe"\s*:\s*"([^"]+)"/);
  const at = extractMatch(html, /"SNlM0e"\s*:\s*"([^"]*)"/);
  const hl = extractMatch(html, /"TuX5cc"\s*:\s*"([^"]+)"/) || 'en';

  if (!bl) {
    throw new Error(
      `Token build label (cfb2h) tidak ditemukan dari halaman Gemini (URL akhir: ${initRes.url || GEMINI_INIT_URL}).`
    );
  }

  cachedSession = {
    jar,
    bl,
    fsid,
    at,
    hl,
    sessionId: crypto.randomUUID().toUpperCase(),
    reqid: 100000 + Math.floor(Math.random() * 800000),
    mode: at ? 'cookie' : mode,
    mintedAt: Date.now(),
  };

  return cachedSession;
}

async function invokeStreamGenerate(session, promptText, variant = 'default', thinking = false) {
  const thinkingLevel = thinking ? 2 : 1;
  const modelNumber =
    variant === 'flash-lite' ? 6 : variant === 'flash' ? 1 : 1;

  const { outerJson, requestUuid } = build81SlotPayload({
    prompt: promptText,
    language: session.hl || 'en',
    modelNumber,
    thinkingLevel,
  });

  const params = new URLSearchParams({
    hl: session.hl || 'en',
    _reqid: String(session.reqid),
    rt: 'c',
    'source-path': '/app',
  });
  if (session.bl) params.set('bl', session.bl);
  if (session.fsid) params.set('f.sid', session.fsid);

  const headers = {
    'User-Agent': CHROME_UA,
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    Origin: 'https://gemini.google.com',
    Referer: 'https://gemini.google.com/',
    'X-Same-Domain': '1',
    'x-goog-ext-525005358-jspb': `["${requestUuid}",1]`,
  };

  const cookieHeader = serializeCookieJar(session.jar);
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (variant === 'flash-lite' || variant === 'flash') {
    const modelId = variant === 'flash-lite' ? FLASH_LITE_MODEL_ID : FLASH_MODEL_ID;
    const modelArr = [
      1,
      null,
      null,
      null,
      modelId,
      null,
      null,
      0,
      [4, 5, 6, 8],
      null,
      null,
      1,
      null,
      null,
      modelNumber,
      thinkingLevel,
      session.sessionId,
    ];
    headers['x-goog-ext-525001261-jspb'] = JSON.stringify(modelArr);
    headers['x-goog-ext-73010989-jspb'] = '[0]';
    headers['x-goog-ext-73010990-jspb'] = '[0,0,0]';
  }

  const formParams = new URLSearchParams();
  if (session.at) {
    formParams.set('at', session.at);
  } else if (variant !== 'no-at-key') {
    formParams.set('at', '');
  }
  formParams.set('f.req', outerJson);

  const url = `${GEMINI_STREAM_GENERATE_URL}?${params.toString()}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      redirect: 'manual',
      headers,
      body: formParams.toString(),
    },
    22000
  );

  updateCookieJar(session.jar, res);

  const location = res.headers.get('location') || '';
  if (res.status === 429 || location.includes('/sorry')) {
    return {
      ok: false,
      httpStatus: res.status,
      retryable: false,
      error: 'IP server terkena pembatasan CAPTCHA Google (/sorry).',
    };
  }

  const rawBody = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      httpStatus: res.status,
      retryable: res.status >= 500 || res.status === 400,
      error: `StreamGenerate mengembalikan HTTP ${res.status}.`,
      rawPreview: rawBody.slice(0, 260),
    };
  }

  const parsed = parseGeminiWrbStream(rawBody);

  if (parsed.rpcErrorCode !== null && !parsed.text) {
    const label =
      RPC_ERROR_LABELS[parsed.rpcErrorCode] || `RPC_ERROR_${parsed.rpcErrorCode}`;
    return {
      ok: false,
      httpStatus: 200,
      rpcErrorCode: parsed.rpcErrorCode,
      retryable:
        parsed.rpcErrorCode === 1013 ||
        parsed.rpcErrorCode === 1050 ||
        parsed.rpcErrorCode === 1052,
      error: `Google Gemini menolak request: ${label}`,
      wrbFrameCount: parsed.wrbFrameCount,
    };
  }

  if (!parsed.text) {
    return {
      ok: false,
      httpStatus: 200,
      retryable: true,
      error: `Respons WRB kosong dari Gemini (${parsed.wrbFrameCount} frame).`,
      rawPreview: rawBody.slice(0, 260),
    };
  }

  if (isGoogleWebErrorReply(parsed.text)) {
    return {
      ok: false,
      httpStatus: 200,
      googleTemplateError: true,
      retryable: true,
      error: `Template penolakan Google Web: "${parsed.text}"`,
    };
  }

  return {
    ok: true,
    httpStatus: 200,
    variant,
    text: parsed.text,
    thoughts: parsed.thoughts,
    cid: parsed.cid,
    rid: parsed.rid,
    rcid: parsed.rcid,
    wrbFrameCount: parsed.wrbFrameCount,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const startedAt = Date.now();
  const isProbe = req.query?.probe === '1';

  let text = '';
  let system = '';
  let thinking = false;

  if (req.method === 'GET') {
    text = typeof req.query?.text === 'string' ? req.query.text : (req.query?.q || req.query?.prompt || '');
    system = typeof req.query?.system === 'string' ? req.query.system : '';
    thinking = req.query?.thinking === '1' || req.query?.thinking === 'true';
  } else if (req.method === 'POST') {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    text = payload.text || payload.prompt || payload.q || '';
    system = payload.system || '';
    thinking = Boolean(payload.thinking);
  } else {
    return res.status(405).json({ status: false, error: 'Method not allowed' });
  }

  const cleanText = String(text || '').trim();
  if (!cleanText) {
    return res.status(400).json({
      status: false,
      error: 'Parameter text atau prompt wajib diisi.',
    });
  }

  const finalPrompt = system.trim()
    ? `[Instruksi Sistem NodataGPT: ${system.trim()}]\n\nPertanyaan pengguna:\n${cleanText}`
    : cleanText;

  const attemptDiagnostics = [];

  try {
    let session = await mintGeminiSession(false);

    // Strategy chain:
    // 1. Default HanaokaYuzu Guest 81-slot (let Google select guest-eligible model, at="")
    // 2. Explicit Flash-Lite 17-element model header on refreshed session
    // 3. Omitted `at` parameter fallback (Zibri guest style)
    const variants = ['default', 'flash-lite', 'no-at-key'];

    for (let idx = 0; idx < variants.length; idx++) {
      const variant = variants[idx];
      if (idx === 1) {
        // Refresh guest cookies/bl/fsid once if cached session stalled or failed
        session = await mintGeminiSession(true);
      } else if (idx > 1) {
        session.reqid += 100000;
      }

      const outcome = await invokeStreamGenerate(session, finalPrompt, variant, thinking);
      attemptDiagnostics.push({
        variant,
        ok: outcome.ok,
        httpStatus: outcome.httpStatus,
        rpcErrorCode: outcome.rpcErrorCode ?? null,
        error: outcome.error ?? null,
      });

      if (outcome.ok) {
        return res.status(200).json({
          status: true,
          ok: true,
          provider: 'Google Gemini Direct (81-Slot Web RPC)',
          mode: session.mode,
          variant: outcome.variant,
          bl: session.bl,
          latencyMs: Date.now() - startedAt,
          ...(outcome.thoughts ? { thinking: outcome.thoughts } : {}),
          result: outcome.text,
          ...(isProbe ? { diagnostics: attemptDiagnostics } : {}),
        });
      }

      if (!outcome.retryable) {
        break;
      }
    }

    const lastDiag = attemptDiagnostics[attemptDiagnostics.length - 1];
    return res.status(502).json({
      status: false,
      ok: false,
      provider: 'Google Gemini Direct (81-Slot Web RPC)',
      latencyMs: Date.now() - startedAt,
      error:
        lastDiag?.error ||
        'Gagal memperoleh jawaban dari endpoint StreamGenerate Gemini.',
      diagnostics: attemptDiagnostics,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Kesalahan koneksi ke Gemini Web.';
    return res.status(502).json({
      status: false,
      ok: false,
      provider: 'Google Gemini Direct (81-Slot Web RPC)',
      latencyMs: Date.now() - startedAt,
      error: message,
      diagnostics: attemptDiagnostics,
    });
  }
}
