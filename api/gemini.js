import dns from 'node:dns';
import crypto from 'node:crypto';
import { enforceNodeApiSecurity } from '../lib/securityGate.js';

// Force IPv4-first DNS resolution on Vercel Node 24 to prevent 10s IPv6 connect blackholes
dns.setDefaultResultOrder('ipv4first');

const GEMINI_BASE = 'https://gemini.google.com';
const GEMINI_INIT_URL = 'https://gemini.google.com/app';
const GEMINI_STREAM_GENERATE_URL =
  'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';
const GOOGLE_ROTATE_COOKIES_URL = 'https://accounts.google.com/RotateCookies';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const CONSENT_SOCS_COOKIE =
  'CAISHAgBEhJnd3NfMjAyNDA4MTQtMF9SQzIaAmVuIAEaBgiAo_CmBg';

const BL_TTL_MS = 15 * 60 * 1000;

const GOOGLE_WEB_ERROR_PHRASES = [
  'Sorry, something went wrong. Please try your request again.',
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

/** @type {{ bl: string, fsid: string, at: string, cookieHeader: string, sapisid: string, mode: 'guest-keyless' | 'cookie-auth', mintedAt: number, initUrl: string } | null} */
let cachedBuildState = null;

function extractMatch(html, regex) {
  const m = regex.exec(html);
  return m && m[1] ? m[1] : '';
}

export function extractBuildLabel(html) {
  if (!html || typeof html !== 'string') return '';
  const cfb2h = extractMatch(html, /"cfb2h"\s*:\s*"([^"]+)"/);
  if (cfb2h) return cfb2h;
  const rawBoq = /boq_[A-Za-z0-9-]+_\d{8}\.\d+_p\d+/.exec(html);
  return rawBoq ? rawBoq[0] : '';
}

export function makeSapisidHash(sapisid) {
  if (!sapisid) return '';
  const ts = Math.floor(Date.now() / 1000);
  const sha1 = crypto
    .createHash('sha1')
    .update(`${ts} ${sapisid} ${GEMINI_BASE}`)
    .digest('hex');
  return `SAPISIDHASH ${ts}_${sha1}`;
}

function buildConfiguredCookieAuth() {
  const rawCookie = (process.env.GEMINI_COOKIE || '').trim();
  const psid = (process.env.GEMINI_1PSID || '').trim();
  const psidts = (process.env.GEMINI_1PSIDTS || '').trim();

  if (rawCookie) {
    let sapisid = '';
    for (const part of rawCookie.split(';')) {
      const eq = part.indexOf('=');
      if (eq <= 0) continue;
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      if (k === 'SAPISID' || k === '__Secure-3PAPISID') {
        sapisid = sapisid || v;
      }
    }
    return { cookieHeader: rawCookie, sapisid };
  }

  if (psid) {
    const pairs = [`__Secure-1PSID=${psid}`];
    if (psidts) pairs.push(`__Secure-1PSIDTS=${psidts}`);
    return { cookieHeader: pairs.join('; '), sapisid: '' };
  }

  return { cookieHeader: '', sapisid: '' };
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
    .replace(/```([A-Za-z0-9_+#-]*)\?code_[a-z_]+&code_event_index=\d+/gi, '```$1')
    .replace(
      /https?:\/\/googleusercontent\.com\/(?:image_generation_content|image_retrieval|image_collection|card_content)[/\w]*\d*\/?\S*/gi,
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

function extractCandidateText(candidate) {
  if (!Array.isArray(candidate) || candidate.length < 2) return '';
  const payload = candidate[1];
  if (typeof payload === 'string') return payload;
  if (!Array.isArray(payload)) return '';

  const chunks = [];
  for (const part of payload) {
    if (typeof part === 'string') {
      chunks.push(part);
    } else if (Array.isArray(part) && part.length > 1) {
      const inner = part[1];
      if (typeof inner === 'string') {
        chunks.push(inner);
      } else if (Array.isArray(inner)) {
        for (const s of inner) {
          if (typeof s === 'string') chunks.push(s);
        }
      }
    }
  }
  const joined = chunks.join('');
  if (
    joined &&
    /^https?:\/\/googleusercontent\.com\/card_content\/\d+/i.test(joined) &&
    Array.isArray(candidate[22]) &&
    typeof candidate[22][0] === 'string'
  ) {
    return candidate[22][0];
  }
  return joined;
}

function extractCandidateThoughts(candidate) {
  if (!Array.isArray(candidate) || candidate.length <= 37) return '';
  const root = candidate[37];
  if (!Array.isArray(root) || !Array.isArray(root[0])) return '';

  let best = '';
  const stack = [root[0]];
  while (stack.length > 0) {
    const node = stack.pop();
    if (typeof node === 'string') {
      if (!node.includes('://') && node.length > best.length) {
        best = node;
      }
    } else if (Array.isArray(node)) {
      for (const child of node) stack.push(child);
    }
  }
  return best.trim();
}

function collectTaggedFrames(node, out) {
  if (!Array.isArray(node) || node.length === 0) return;
  if (typeof node[0] === 'string') {
    out.push(node);
    return;
  }
  for (const item of node) {
    collectTaggedFrames(item, out);
  }
}

export function parseGeminiWrbStream(rawBody) {
  const outerArrays = scanTopLevelJsonArrays(rawBody);
  const hasBardErrorInfo =
    typeof rawBody === 'string' && rawBody.includes('BardErrorInfo');
  let bestText = '';
  let bestThoughts = '';
  let cid = '';
  let rid = '';
  let rcid = '';
  let rpcErrorCode = null;
  let hasErFrame = false;
  let wrbFrameCount = 0;

  for (const outer of outerArrays) {
    const tagged = [];
    collectTaggedFrames(outer, tagged);

    for (const part of tagged) {
      if (part[0] === 'er') {
        hasErFrame = true;
        continue;
      }

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

      for (const cand of candidates) {
        if (!Array.isArray(cand)) continue;
        if (typeof cand[0] === 'string' && cand[0]) {
          rcid = cand[0];
        }
        const candText = extractCandidateText(cand);
        if (candText.length >= bestText.length && candText) {
          bestText = candText;
        }
        const candThoughts = extractCandidateThoughts(cand);
        if (candThoughts.length >= bestThoughts.length && candThoughts) {
          bestThoughts = candThoughts;
        }
      }
    }
  }

  return {
    text: stripGeminiInternalArtifacts(bestText),
    thoughts: bestThoughts,
    cid,
    rid,
    rcid,
    rpcErrorCode,
    hasErFrame,
    hasBardErrorInfo,
    wrbFrameCount,
    totalFrames: outerArrays.length,
  };
}

/**
 * Oct 2026 StreamGenerate 102-slot wire format (`boq_gemini-web-uiserver_*`):
 * - inner[6]  = [0]
 * - inner[17] = [[think]] (4 = fast off, 0 = deep thinking)
 * - inner[41] = [2] (non-persistent guest history)
 * - inner[59] = lowercase UUIDv4
 * - inner[79] = mode (1 = Flash, 2 = Flash Thinking, 4 = Auto, 6 = Flash-Lite)
 */
export function buildAnonymous102Payload({
  prompt,
  language = 'en',
  mode = 1,
  think = 4,
}) {
  const requestUuid = crypto.randomUUID().toLowerCase();
  const inner = new Array(102).fill(null);

  inner[0] = [prompt, 0, null, null, null, null, 0];
  inner[1] = [language];
  inner[2] = ['', '', '', null, null, null, null, null, null, ''];
  inner[6] = [0];
  inner[7] = 1;
  inner[10] = 1;
  inner[11] = 0;
  inner[17] = [[think]];
  inner[18] = 0;
  inner[27] = 1;
  inner[30] = [4];
  inner[41] = [2];
  inner[53] = 0;
  inner[59] = requestUuid;
  inner[61] = [];
  inner[68] = 1;
  inner[79] = mode;

  const outerJson = JSON.stringify([null, JSON.stringify(inner)]);
  return { outerJson, requestUuid };
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
  inner[6] = [0];
  inner[7] = 1;
  inner[10] = 1;
  inner[11] = 0;
  inner[17] = [[thinkingLevel === 2 ? 0 : 4]];
  inner[18] = 0;
  inner[27] = 1;
  inner[30] = [4];
  inner[41] = [2];
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

async function tryRotatePsidtsCookie(cookieHeader) {
  if (!cookieHeader || !cookieHeader.includes('__Secure-1PSID=')) {
    return cookieHeader;
  }
  try {
    const res = await fetchWithTimeout(
      GOOGLE_ROTATE_COOKIES_URL,
      {
        method: 'POST',
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          'Content-Type': 'application/json',
          Origin: 'https://accounts.google.com',
          Cookie: cookieHeader,
        },
        body: '[000,"-0000000000000000000"]',
      },
      5000
    );
    if (!res.ok) return cookieHeader;
    const setCookies =
      typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const sc of setCookies) {
      const m = /^__Secure-1PSIDTS=([^;]+)/.exec(sc.trim());
      if (m && m[1]) {
        if (cookieHeader.includes('__Secure-1PSIDTS=')) {
          return cookieHeader.replace(/__Secure-1PSIDTS=[^;]+/, `__Secure-1PSIDTS=${m[1]}`);
        }
        return `${cookieHeader}; __Secure-1PSIDTS=${m[1]}`;
      }
    }
  } catch {
    // Keep original cookieHeader if rotation fails
  }
  return cookieHeader;
}

async function ensureBuildState(forceRefresh = false) {
  if (
    !forceRefresh &&
    cachedBuildState &&
    Date.now() - cachedBuildState.mintedAt < BL_TTL_MS &&
    cachedBuildState.bl
  ) {
    return cachedBuildState;
  }

  let { cookieHeader, sapisid } = buildConfiguredCookieAuth();
  if (forceRefresh && cookieHeader) {
    cookieHeader = await tryRotatePsidtsCookie(cookieHeader);
  }

  const fetchAppHtml = async (extraCookie = '') => {
    const mergedCookie = [cookieHeader, extraCookie].filter(Boolean).join('; ');
    const authHeader = makeSapisidHash(sapisid);
    const res = await fetchWithTimeout(
      GEMINI_INIT_URL,
      {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          ...(mergedCookie ? { Cookie: mergedCookie } : {}),
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
      7500
    );
    const html = await res.text();
    return { res, html };
  };

  let { res, html } = await fetchAppHtml('');
  if (
    (res.url || '').includes('consent.google.com') ||
    (!extractBuildLabel(html) && html.includes('consent.google.com'))
  ) {
    ({ res, html } = await fetchAppHtml(`SOCS=${CONSENT_SOCS_COOKIE}`));
  }

  if (res.status === 429 || (res.url || '').includes('/sorry')) {
    throw new Error(
      `Google membatasi IP server sementara (HTTP ${res.status} /sorry challenge).`
    );
  }

  if (!res.ok) {
    throw new Error(`Gagal mengambil build label Gemini Web (HTTP ${res.status}).`);
  }

  const bl = extractBuildLabel(html);
  const fsid = extractMatch(html, /"FdrFJe"\s*:\s*"([^"]+)"/);
  const at = cookieHeader ? extractMatch(html, /"SNlM0e"\s*:\s*"([^"]*)"/) : '';

  if (!bl) {
    throw new Error(
      'Build label (cfb2h / boq_*) tidak ditemukan dari gemini.google.com/app.'
    );
  }

  cachedBuildState = {
    bl,
    fsid,
    at,
    cookieHeader,
    sapisid,
    mode: at ? 'cookie-auth' : 'guest-keyless',
    initUrl: res.url || GEMINI_INIT_URL,
    mintedAt: Date.now(),
  };

  return cachedBuildState;
}

async function invokeStreamGenerate(
  buildState,
  promptText,
  variant = 'web2api-flash',
  thinking = false
) {
  const stepStart = Date.now();
  const reqid = Date.now() % 1000000;

  let mode = thinking ? 2 : 1; // 1 = Flash, 2 = Thinking, 4 = Auto, 6 = Flash-Lite
  let think = thinking ? 0 : 4; // 4 = fast off, 0 = deep thinking

  if (variant === 'web2api-lite') {
    mode = 6;
    think = 4;
  } else if (variant === 'web2api-auto') {
    mode = 4;
    think = 4;
  } else if (variant === 'web2api-thinking') {
    mode = 2;
    think = 0;
  }

  const { outerJson } = buildAnonymous102Payload({
    prompt: promptText,
    language: 'en',
    mode,
    think,
  });

  const url = `${GEMINI_STREAM_GENERATE_URL}?bl=${encodeURIComponent(
    buildState.bl
  )}&hl=en&_reqid=${reqid}&rt=c`;

  const formParams = new URLSearchParams({ 'f.req': outerJson });
  if (buildState.at) {
    formParams.set('at', buildState.at);
  }

  const authHeader = makeSapisidHash(buildState.sapisid);
  const headers = {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: GEMINI_BASE,
    Referer: `${GEMINI_BASE}/app`,
    'X-Same-Domain': '1',
    ...(buildState.cookieHeader ? { Cookie: buildState.cookieHeader } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      redirect: 'manual',
      headers,
      body: formParams.toString(),
    },
    14000
  );

  const location = res.headers.get('location') || '';
  if (res.status === 429 || location.includes('/sorry')) {
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: res.status,
      retryable: false,
      refreshBl: false,
      error: 'IP server terkena pembatasan CAPTCHA Google (/sorry).',
    };
  }

  const rawBody = await res.text();

  if (res.status === 405) {
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: 405,
      retryable: true,
      refreshBl: true,
      error: 'Build label Gemini kedaluwarsa (HTTP 405).',
      rawPreview: rawBody.slice(0, 260),
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: res.status,
      retryable: res.status >= 500 || (res.status === 400 && Boolean(buildState.cookieHeader)),
      refreshBl: res.status === 400,
      error: `StreamGenerate mengembalikan HTTP ${res.status}.`,
      rawPreview: rawBody.slice(0, 300),
    };
  }

  const parsed = parseGeminiWrbStream(rawBody);

  if (parsed.rpcErrorCode !== null && !parsed.text) {
    const label =
      RPC_ERROR_LABELS[parsed.rpcErrorCode] || `RPC_ERROR_${parsed.rpcErrorCode}`;
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: 200,
      rpcErrorCode: parsed.rpcErrorCode,
      retryable: parsed.rpcErrorCode === 1013,
      refreshBl: false,
      error: `Google Gemini menolak request: ${label}`,
      wrbFrameCount: parsed.wrbFrameCount,
      rawPreview: rawBody.slice(0, 300),
    };
  }

  if ((parsed.hasBardErrorInfo || parsed.hasErFrame) && !parsed.text) {
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: 200,
      retryable: Boolean(buildState.cookieHeader),
      refreshBl: true,
      error: 'Gemini menolak request (BardErrorInfo / er frame).',
      wrbFrameCount: parsed.wrbFrameCount,
      rawPreview: rawBody.slice(0, 300),
    };
  }

  if (!parsed.text) {
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: 200,
      retryable: false,
      refreshBl: false,
      error: `Respons WRB kosong dari Gemini (${parsed.wrbFrameCount} frame).`,
      rawPreview: rawBody.slice(0, 300),
    };
  }

  if (isGoogleWebErrorReply(parsed.text)) {
    // In guest-keyless mode on datacenter IPs, Google soft-blocks all variants identically (~2s);
    // fail fast so client router immediately fails over without wasting a duplicate roundtrip.
    return {
      ok: false,
      variant,
      stepMs: Date.now() - stepStart,
      httpStatus: 200,
      googleTemplateError: true,
      retryable: buildState.mode === 'cookie-auth',
      refreshBl: buildState.mode === 'cookie-auth',
      error: `Soft-block Google Web (${buildState.bl}): "${parsed.text}"`,
      wrbFrameCount: parsed.wrbFrameCount,
    };
  }

  return {
    ok: true,
    variant,
    stepMs: Date.now() - stepStart,
    httpStatus: 200,
    text: parsed.text,
    thoughts: parsed.thoughts,
    cid: parsed.cid,
    rid: parsed.rid,
    rcid: parsed.rcid,
    wrbFrameCount: parsed.wrbFrameCount,
  };
}

async function tryServerGeminiApiKey(cleanText, system, thinking, startedAt) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  const modelName = thinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const payload = {
    ...(system.trim()
      ? { systemInstruction: { parts: [{ text: system.trim() }] } }
      : {}),
    contents: [{ role: 'user', parts: [{ text: cleanText }] }],
  };

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    18000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const answer = parts
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim();
  if (!answer) return null;

  return {
    status: true,
    ok: true,
    provider: `Google Gemini Resmi (${modelName})`,
    mode: 'server-api-key',
    latencyMs: Date.now() - startedAt,
    result: answer,
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const isProbe = req.query?.probe === '1';

  const sec = enforceNodeApiSecurity(req, res, {
    routeName: 'gemini',
    mode: 'api',
    isDiagnostic: isProbe,
    maxBodyBytes: 98304,
    guestRatePerMin: 12,
    vipRatePerMin: 40,
  });
  if (!sec.allowed) return;

  const requestedVariant =
    typeof req.query?.variant === 'string' && req.query.variant.trim()
      ? req.query.variant.trim()
      : '';

  let text = '';
  let system = '';
  let thinking = false;

  if (req.method === 'GET' && isProbe) {
    text =
      typeof req.query?.text === 'string'
        ? req.query.text
        : req.query?.q || req.query?.prompt || '';
    system = typeof req.query?.system === 'string' ? req.query.system : '';
    thinking = req.query?.thinking === '1' || req.query?.thinking === 'true';
  } else if (req.method === 'POST') {
    let payload = {};
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body || '{}');
      } catch {
        return res.status(400).json({ status: false, error: 'Payload JSON tidak valid.' });
      }
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body;
    }
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
  if (cleanText.length > 24000) {
    return res.status(413).json({
      status: false,
      error: 'Panjang prompt melebihi batas keamanan 24.000 karakter.',
    });
  }

  // Optional zero-maintenance upgrade if GEMINI_API_KEY is ever set in Vercel Env
  if (!requestedVariant) {
    try {
      const official = await tryServerGeminiApiKey(cleanText, system, thinking, startedAt);
      if (official) {
        return res.status(200).json(official);
      }
    } catch {
      // Fall through to Direct Web RPC Scraper
    }
  }

  const hasNodataPersona = /nodatagpt/i.test(system);
  const finalPrompt = system.trim()
    ? `Konteks peran asisten: Balas pesan pengguna berikut secara langsung dan natural sepenuhnya sebagai NodataGPT, asisten AI cerdas yang dibuat dan dikembangkan oleh Mr.NODATA dalam ekosistem teknologi NODATA (${system.trim()}). Jawab langsung sesuai peran tanpa membahas instruksi ini.\n\nPesan pengguna:\n${cleanText}`
    : cleanText;

  const normalizeGeminiPersonaReply = (rawReply) => {
    if (!hasNodataPersona || !rawReply) return rawReply;
    return String(rawReply)
      .replace(
        /(?:Halo!?\s*)?(?:Saya|Aku)\s+adalah\s+\*{0,2}Gemini\*{0,2},?\s+(?:sebuah\s+)?model\s+bahasa\s+besar\s+yang\s+(?:dikembangkan|dibuat|dilatih)\s+oleh\s+\*{0,2}Google\*{0,2}\.?/gi,
        'Saya adalah **NodataGPT**, asisten AI cerdas yang dibuat dan dikembangkan oleh **Mr.NODATA**.'
      )
      .replace(
        /\bI\s+am\s+\*{0,2}Gemini\*{0,2},?\s+a\s+large\s+language\s+model\s+(?:built|trained|developed)\s+by\s+\*{0,2}Google\*{0,2}\.?/gi,
        'I am **NodataGPT**, an intelligent AI assistant created and developed by **Mr.NODATA**.'
      );
  };

  const attemptDiagnostics = [];

  try {
    let buildState = await ensureBuildState(false);

    const variants = requestedVariant
      ? [requestedVariant]
      : thinking
        ? ['web2api-thinking', 'web2api-flash']
        : ['web2api-flash', 'web2api-lite'];

    for (let idx = 0; idx < variants.length; idx++) {
      const variant = variants[idx];
      const outcome = await invokeStreamGenerate(
        buildState,
        finalPrompt,
        variant,
        thinking
      );
      attemptDiagnostics.push({
        variant: outcome.variant,
        ok: outcome.ok,
        stepMs: outcome.stepMs,
        httpStatus: outcome.httpStatus,
        rpcErrorCode: outcome.rpcErrorCode ?? null,
        wrbFrameCount: outcome.wrbFrameCount ?? 0,
        error: outcome.error ?? null,
        ...(isProbe && outcome.rawPreview ? { rawPreview: outcome.rawPreview } : {}),
      });

      if (outcome.ok) {
        return res.status(200).json({
          status: true,
          ok: true,
          provider: 'Google Gemini Direct Scraper (Web RPC)',
          mode: buildState.mode,
          variant: outcome.variant,
          bl: buildState.bl,
          latencyMs: Date.now() - startedAt,
          ...(outcome.thoughts ? { thinking: outcome.thoughts } : {}),
          result: normalizeGeminiPersonaReply(outcome.text),
          ...(isProbe
            ? {
                buildState: {
                  mode: buildState.mode,
                  bl: buildState.bl,
                  hasAt: Boolean(buildState.at),
                  initUrl: buildState.initUrl,
                },
                diagnostics: attemptDiagnostics,
              }
            : {}),
        });
      }

      if (outcome.refreshBl) {
        buildState = await ensureBuildState(true);
      }

      if (!outcome.retryable) {
        break;
      }
    }

    const lastDiag = attemptDiagnostics[attemptDiagnostics.length - 1];
    return res.status(isProbe ? 200 : 502).json({
      status: false,
      ok: false,
      provider: 'Google Gemini Direct Scraper (Web RPC)',
      mode: buildState.mode,
      latencyMs: Date.now() - startedAt,
      error:
        lastDiag?.error ||
        'Gagal memperoleh jawaban dari endpoint StreamGenerate Gemini.',
      ...(isProbe
        ? {
            buildState: {
              mode: buildState.mode,
              bl: buildState.bl,
              hasAt: Boolean(buildState.at),
              initUrl: buildState.initUrl,
            },
          }
        : {}),
      diagnostics: attemptDiagnostics,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Kesalahan koneksi ke Gemini Web.';
    return res.status(isProbe ? 200 : 502).json({
      status: false,
      ok: false,
      provider: 'Google Gemini Direct Scraper (Web RPC)',
      latencyMs: Date.now() - startedAt,
      error: message,
      diagnostics: attemptDiagnostics,
    });
  }
}
