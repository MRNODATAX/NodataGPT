import dns from 'node:dns';
import crypto from 'node:crypto';
import { enforceNodeApiSecurity } from '../lib/securityGate.js';

// Force IPv4-first DNS resolution on Vercel Node 24 to prevent IPv6 connect blackholes
dns.setDefaultResultOrder('ipv4first');

const DEEPSEEK_WEB_BASE = 'https://chat.deepseek.com';
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const APP_CLIENT_VERSION = '2.7.1';

const DEFAULT_WEB_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const DEFAULT_APP_UA = 'DeepSeek/2.7.1 Android/34';

// 23-round custom Keccak-f[1600] constants (skips standard RC[0] = 0x0000000000000001)
// Stored as [lo32, hi32] pairs for zero-allocation V8 Uint32Array execution
const RC23_LO = new Uint32Array([
  0x00008082, 0x0000808a, 0x80008000, 0x0000808b, 0x80000001, 0x80008081,
  0x00008009, 0x0000008a, 0x00000088, 0x80008009, 0x8000000a, 0x8000808b,
  0x0000008b, 0x00008089, 0x00008003, 0x00008002, 0x00000080, 0x0000800a,
  0x8000000a, 0x80008081, 0x00008080, 0x80000001, 0x80008008,
]);

const RC23_HI = new Uint32Array([
  0x00000000, 0x80000000, 0x80000000, 0x00000000, 0x00000000, 0x80000000,
  0x80000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
  0x80000000, 0x80000000, 0x80000000, 0x80000000, 0x80000000, 0x00000000,
  0x80000000, 0x80000000, 0x80000000, 0x00000000, 0x80000000,
]);

const RHO_OFFSETS = new Uint8Array([
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
]);

const PI_INDICES = new Uint8Array([
  0, 6, 12, 18, 24, 3, 9, 10, 16, 22, 1, 7, 13, 19, 20, 4, 5, 11, 17, 23, 2, 8,
  14, 15, 21,
]);

/** @type {{ cookies: string, hwwafBlocked: boolean, mintedAt: number } | null} */
let cachedWarmupState = null;

/** @type {{ token: string, mode: string, deviceId: string, mintedAt: number } | null} */
let cachedLoginState = null;

function rotl64Lo(lo, hi, n) {
  if (n === 0) return lo >>> 0;
  if (n < 32) return ((lo << n) | (hi >>> (32 - n))) >>> 0;
  if (n === 32) return hi >>> 0;
  return ((hi << (n - 32)) | (lo >>> (64 - n))) >>> 0;
}

function rotl64Hi(lo, hi, n) {
  if (n === 0) return hi >>> 0;
  if (n < 32) return ((hi << n) | (lo >>> (32 - n))) >>> 0;
  if (n === 32) return lo >>> 0;
  return ((lo << (n - 32)) | (hi >>> (64 - n))) >>> 0;
}

function keccakF1600Custom23(sLo, sHi) {
  const cLo = new Uint32Array(5);
  const cHi = new Uint32Array(5);
  const dLo = new Uint32Array(5);
  const dHi = new Uint32Array(5);
  const bLo = new Uint32Array(25);
  const bHi = new Uint32Array(25);

  for (let round = 0; round < 23; round++) {
    for (let x = 0; x < 5; x++) {
      cLo[x] =
        sLo[x] ^ sLo[x + 5] ^ sLo[x + 10] ^ sLo[x + 15] ^ sLo[x + 20];
      cHi[x] =
        sHi[x] ^ sHi[x + 5] ^ sHi[x + 10] ^ sHi[x + 15] ^ sHi[x + 20];
    }

    for (let x = 0; x < 5; x++) {
      const xm1 = (x + 4) % 5;
      const xp1 = (x + 1) % 5;
      const rLo = ((cLo[xp1] << 1) | (cHi[xp1] >>> 31)) >>> 0;
      const rHi = ((cHi[xp1] << 1) | (cLo[xp1] >>> 31)) >>> 0;
      dLo[x] = (cLo[xm1] ^ rLo) >>> 0;
      dHi[x] = (cHi[xm1] ^ rHi) >>> 0;
    }

    for (let i = 0; i < 25; i++) {
      const x = i % 5;
      sLo[i] = (sLo[i] ^ dLo[x]) >>> 0;
      sHi[i] = (sHi[i] ^ dHi[x]) >>> 0;
    }

    // Rho + Pi: note B[y + 5 * ((2*x + 3*y) % 5)] = rotl64(S[x + 5*y], RHO[x + 5*y])
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const src = x + 5 * y;
        const dst = y + 5 * ((2 * x + 3 * y) % 5);
        const r = RHO_OFFSETS[src];
        bLo[dst] = rotl64Lo(sLo[src], sHi[src], r);
        bHi[dst] = rotl64Hi(sLo[src], sHi[src], r);
      }
    }

    // Chi
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x++) {
        const b1 = y + ((x + 1) % 5);
        const b2 = y + ((x + 2) % 5);
        sLo[y + x] = (bLo[y + x] ^ (~bLo[b1] & bLo[b2])) >>> 0;
        sHi[y + x] = (bHi[y + x] ^ (~bHi[b1] & bHi[b2])) >>> 0;
      }
    }

    // Iota
    sLo[0] = (sLo[0] ^ RC23_LO[round]) >>> 0;
    sHi[0] = (sHi[0] ^ RC23_HI[round]) >>> 0;
  }
}

export function deepseekHashV1(inputStr) {
  const data = Buffer.from(String(inputStr), 'utf8');
  const rate = 136; // 17 * 8 bytes
  const sLo = new Uint32Array(25);
  const sHi = new Uint32Array(25);
  const block = new Uint8Array(rate);

  let offset = 0;
  while (offset + rate <= data.length) {
    const view = new DataView(data.buffer, data.byteOffset + offset, rate);
    for (let i = 0; i < 17; i++) {
      sLo[i] = (sLo[i] ^ view.getUint32(i * 8, true)) >>> 0;
      sHi[i] = (sHi[i] ^ view.getUint32(i * 8 + 4, true)) >>> 0;
    }
    keccakF1600Custom23(sLo, sHi);
    offset += rate;
  }

  block.fill(0);
  const rem = data.length - offset;
  for (let i = 0; i < rem; i++) {
    block[i] = data[offset + i];
  }
  block[rem] ^= 0x06;
  block[rate - 1] ^= 0x80;

  const padView = new DataView(block.buffer);
  for (let i = 0; i < 17; i++) {
    sLo[i] = (sLo[i] ^ padView.getUint32(i * 8, true)) >>> 0;
    sHi[i] = (sHi[i] ^ padView.getUint32(i * 8 + 4, true)) >>> 0;
  }
  keccakF1600Custom23(sLo, sHi);

  const out = Buffer.allocUnsafe(32);
  for (let i = 0; i < 4; i++) {
    out.writeUInt32LE(sLo[i], i * 8);
    out.writeUInt32LE(sHi[i], i * 8 + 4);
  }
  return out;
}

function digestToLittleEndianBigInt(digestBuf) {
  let result = 0n;
  for (let i = 31; i >= 0; i--) {
    result = (result << 8n) | BigInt(digestBuf[i]);
  }
  return result;
}

export function solveDeepSeekPow(challengeObj, maxIter = 250000) {
  const started = Date.now();
  const salt = String(challengeObj?.salt || '');
  const expireAt = challengeObj?.expire_at ?? '';
  const difficulty = Math.max(1, Number(challengeObj?.difficulty) || 144000);
  const prefix = `${salt}_${expireAt}_`;
  const target = (1n << 256n) / BigInt(difficulty);

  for (let nonce = 0; nonce < maxIter; nonce++) {
    const digest = deepseekHashV1(`${prefix}${nonce}`);
    if (digestToLittleEndianBigInt(digest) < target) {
      const responsePayload = {
        algorithm: challengeObj?.algorithm || 'DeepSeekHashV1',
        challenge: challengeObj?.challenge || '',
        salt,
        answer: nonce,
        signature: challengeObj?.signature || '',
        target_path: challengeObj?.target_path || '/api/v0/chat/completion',
      };
      return {
        solved: true,
        nonce,
        elapsedMs: Date.now() - started,
        headerValue: Buffer.from(JSON.stringify(responsePayload), 'utf8').toString(
          'base64'
        ),
      };
    }
  }

  return {
    solved: false,
    nonce: maxIter,
    elapsedMs: Date.now() - started,
    headerValue: '',
  };
}

function extractSetCookies(headers) {
  const rawList =
    typeof headers?.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers?.get('set-cookie')
        ? [headers.get('set-cookie')]
        : [];
  const pairs = [];
  for (const raw of rawList) {
    const first = String(raw || '').split(';')[0]?.trim();
    if (first && first.includes('=')) pairs.push(first);
  }
  return pairs.join('; ');
}

function mergeCookies(...cookieStrings) {
  const map = new Map();
  for (const str of cookieStrings) {
    if (!str) continue;
    for (const part of String(str).split(';')) {
      const eq = part.indexOf('=');
      if (eq <= 0) continue;
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      if (k) map.set(k, v);
    }
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
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

async function ensureHwwafWarmup(force = false) {
  const envCookie = (process.env.DEEPSEEK_COOKIE || '').trim();
  if (
    !force &&
    cachedWarmupState &&
    Date.now() - cachedWarmupState.mintedAt < 10 * 60 * 1000
  ) {
    return {
      ...cachedWarmupState,
      cookies: mergeCookies(cachedWarmupState.cookies, envCookie),
    };
  }

  let cookies = envCookie;
  let hwwafBlocked = false;
  let status = 0;

  try {
    const res = await fetchWithTimeout(
      `${DEEPSEEK_WEB_BASE}/`,
      {
        method: 'GET',
        headers: {
          'User-Agent': DEFAULT_WEB_UA,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          ...(cookies ? { Cookie: cookies } : {}),
        },
      },
      3000
    );
    status = res.status;
    const setCookies = extractSetCookies(res.headers);
    if (setCookies) {
      cookies = mergeCookies(cookies, setCookies);
    }
    if (res.status === 429 || res.status === 403) {
      hwwafBlocked = true;
    }
  } catch {
    // Non-fatal
  }

  cachedWarmupState = {
    cookies,
    hwwafBlocked,
    status,
    mintedAt: Date.now(),
  };
  return cachedWarmupState;
}

async function resolveDeepSeekToken(cookies, diagnostics) {
  const explicitToken = (
    process.env.DEEPSEEK_TOKEN ||
    process.env.DEEPSEEK_AUTH_TOKEN ||
    ''
  ).trim();
  if (explicitToken) {
    return {
      token: explicitToken,
      mode: 'auth-token',
      deviceId: crypto.randomUUID(),
    };
  }

  if (
    cachedLoginState &&
    Date.now() - cachedLoginState.mintedAt < 50 * 60 * 1000
  ) {
    return cachedLoginState;
  }

  const email = (process.env.DEEPSEEK_EMAIL || '').trim();
  const password = (process.env.DEEPSEEK_PASSWORD || '').trim();
  const deviceId = crypto.randomUUID();

  if (email && password) {
    const loginStart = Date.now();
    try {
      const res = await fetchWithTimeout(
        `${DEEPSEEK_WEB_BASE}/api/v0/users/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': DEFAULT_APP_UA,
            'x-client-platform': 'android',
            'x-client-version': APP_CLIENT_VERSION,
            'x-client-locale': 'en_US',
            'x-client-bundle-id': 'com.deepseek.chat',
            'x-device-id': deviceId,
            ...(cookies ? { Cookie: cookies } : {}),
          },
          body: JSON.stringify({
            email,
            mobile: '',
            password,
            area_code: '',
            device_id: deviceId,
            os: 'android',
          }),
        },
        4500
      );

      const data = await res.json().catch(() => null);
      const token =
        data?.data?.biz_data?.user?.token || data?.data?.user?.token || '';
      diagnostics.push({
        step: 'users-login',
        ok: Boolean(token),
        httpStatus: res.status,
        code: data?.code ?? null,
        stepMs: Date.now() - loginStart,
      });

      if (token) {
        cachedLoginState = {
          token,
          mode: 'account-login',
          deviceId,
          mintedAt: Date.now(),
        };
        return cachedLoginState;
      }
    } catch {
      diagnostics.push({
        step: 'users-login',
        ok: false,
        stepMs: Date.now() - loginStart,
      });
    }
  }

  return { token: '', mode: 'guest-keyless', deviceId };
}

export function parseDeepSeekSseStream(rawSse) {
  let answer = '';
  let thinking = '';
  let activeFragmentType = 'RESPONSE';
  let eventCount = 0;

  const inspectFragments = (frags) => {
    if (!Array.isArray(frags)) return;
    for (const frag of frags) {
      if (!frag || typeof frag !== 'object') continue;
      if (typeof frag.type === 'string') {
        activeFragmentType = frag.type.toUpperCase();
      }
      if (typeof frag.content === 'string') {
        if (activeFragmentType === 'THINK') {
          thinking += frag.content;
        } else {
          answer += frag.content;
        }
      }
    }
  };

  for (const line of String(rawSse || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const dataStr = trimmed.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;

    try {
      const pkt = JSON.parse(dataStr);
      eventCount++;

      // Classic OpenAI-like choices delta (if returned)
      const delta = pkt?.choices?.[0]?.delta;
      if (delta) {
        if (typeof delta.reasoning_content === 'string') {
          thinking += delta.reasoning_content;
        }
        if (typeof delta.content === 'string') {
          answer += delta.content;
        }
        continue;
      }

      const path = typeof pkt.p === 'string' ? pkt.p : '';
      if (path.includes('thinking_content') && typeof pkt.v === 'string') {
        thinking += pkt.v;
        continue;
      }
      if (path.includes('fragments')) {
        if (Array.isArray(pkt.v)) {
          inspectFragments(pkt.v);
          continue;
        }
      }

      if (pkt?.v?.response?.fragments) {
        inspectFragments(pkt.v.response.fragments);
        continue;
      }

      if (typeof pkt.v === 'string') {
        if (activeFragmentType === 'THINK') {
          thinking += pkt.v;
        } else {
          answer += pkt.v;
        }
      }
    } catch {
      // Ignore event/keepalive comments
    }
  }

  return {
    text: answer.trim(),
    thinking: thinking.trim(),
    eventCount,
  };
}

async function tryServerDeepSeekApiKey(cleanText, system, thinking, startedAt) {
  const apiKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  if (!apiKey) return null;

  const model = thinking ? 'deepseek-reasoner' : 'deepseek-chat';
  const messages = [];
  if (system.trim()) {
    messages.push({ role: 'system', content: system.trim() });
  }
  messages.push({ role: 'user', content: cleanText });

  const res = await fetchWithTimeout(
    `${DEEPSEEK_API_BASE}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    },
    22000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  const answer = String(msg?.content || '').trim();
  const reasoning = String(msg?.reasoning_content || '').trim();
  if (!answer) return null;

  return {
    status: true,
    ok: true,
    provider: `DeepSeek Resmi (${model})`,
    mode: 'server-api-key',
    latencyMs: Date.now() - startedAt,
    ...(reasoning ? { thinking: reasoning } : {}),
    result: answer,
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const isProbe = req.query?.probe === '1';

  const sec = enforceNodeApiSecurity(req, res, {
    routeName: 'deepseek',
    mode: 'api',
    isDiagnostic: isProbe,
    maxBodyBytes: 98304,
    guestRatePerMin: 12,
    vipRatePerMin: 40,
  });
  if (!sec.allowed) return;

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

  // Tier 1: Optional Server DEEPSEEK_API_KEY
  try {
    const official = await tryServerDeepSeekApiKey(
      cleanText,
      system,
      thinking,
      startedAt
    );
    if (official) {
      return res.status(200).json(official);
    }
  } catch {
    // Fall through to Direct chat.deepseek.com Web/App Scraper
  }

  const diagnostics = [];

  // In probe mode, self-benchmark the 23-round DeepSeekHashV1 PoW engine
  let powSelfTest = null;
  if (isProbe) {
    const bench = solveDeepSeekPow(
      {
        algorithm: 'DeepSeekHashV1',
        salt: 'nodatagpt_bench',
        expire_at: Math.floor(Date.now() / 1000) + 300,
        difficulty: 2048,
        target_path: '/api/v0/chat/completion',
      },
      25000
    );
    powSelfTest = {
      algorithm: 'DeepSeekHashV1 (23-round Keccak-f[1600])',
      solved: bench.solved,
      nonce: bench.nonce,
      elapsedMs: bench.elapsedMs,
    };
  }

  try {
    const warmup = await ensureHwwafWarmup(false);
    const auth = await resolveDeepSeekToken(warmup.cookies, diagnostics);

    const dsHeaders = {
      Accept: 'application/json',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      Origin: DEEPSEEK_WEB_BASE,
      Referer: `${DEEPSEEK_WEB_BASE}/`,
      'User-Agent': auth.token ? DEFAULT_APP_UA : DEFAULT_WEB_UA,
      'x-client-platform': auth.token ? 'android' : 'web',
      'x-client-version': APP_CLIENT_VERSION,
      'x-client-locale': 'id_ID',
      'x-client-bundle-id': 'com.deepseek.chat',
      'x-device-id': auth.deviceId,
      ...(warmup.cookies ? { Cookie: warmup.cookies } : {}),
      ...(auth.token
        ? {
            'x-auth-token': auth.token,
            Authorization: `Bearer ${auth.token}`,
          }
        : {}),
    };

    // Step 1: Request DeepSeekHashV1 PoW Challenge (/api/v0/chat/create_pow_challenge)
    const powStepStart = Date.now();
    const powRes = await fetchWithTimeout(
      `${DEEPSEEK_WEB_BASE}/api/v0/chat/create_pow_challenge`,
      {
        method: 'POST',
        headers: dsHeaders,
        body: JSON.stringify({ target_path: '/api/v0/chat/completion' }),
      },
      3800
    );

    const powRaw = await powRes.text();
    let powJson = null;
    try {
      powJson = JSON.parse(powRaw);
    } catch {
      powJson = null;
    }

    const challengeObj =
      powJson?.data?.biz_data?.challenge || powJson?.data?.challenge || null;

    if (!powRes.ok || !challengeObj) {
      const apiCode = powJson?.code ?? null;
      const apiMsg = powJson?.msg || '';
      diagnostics.push({
        step: 'create-pow-challenge',
        ok: false,
        httpStatus: powRes.status,
        code: apiCode,
        msg: apiMsg || null,
        hwwafWarmupStatus: warmup.status,
        stepMs: Date.now() - powStepStart,
        ...(isProbe ? { rawPreview: powRaw.slice(0, 220) } : {}),
      });

      const reason =
        powRes.status === 429
          ? 'Huawei HWWAF pada chat.deepseek.com membatasi koneksi langsung dari IP datacenter (HTTP 429). Beralih otomatis ke mirror DeepSeek aktif.'
          : apiCode === 40002 || powRes.status === 401
            ? 'chat.deepseek.com mewajibkan sesi akun (DEEPSEEK_TOKEN / DEEPSEEK_EMAIL) untuk /api/v0/chat/completion (kode 40002). Beralih otomatis ke mirror DeepSeek aktif.'
            : `chat.deepseek.com menolak tantangan PoW tanpa akun (HTTP ${powRes.status}). Beralih otomatis ke mirror DeepSeek aktif.`;

      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
        mode: auth.mode,
        latencyMs: Date.now() - startedAt,
        error: reason,
        ...(powSelfTest ? { powEngineSelfTest: powSelfTest } : {}),
        diagnostics,
      });
    }

    // Solve 23-round Keccak DeepSeekHashV1 PoW
    const solvedPow = solveDeepSeekPow(challengeObj);
    diagnostics.push({
      step: 'solve-deepseek-hash-v1',
      ok: solvedPow.solved,
      nonce: solvedPow.nonce,
      difficulty: challengeObj.difficulty,
      stepMs: solvedPow.elapsedMs,
    });

    if (!solvedPow.solved) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
        mode: auth.mode,
        latencyMs: Date.now() - startedAt,
        error: 'Batas iterasi DeepSeekHashV1 PoW terlampaui.',
        diagnostics,
      });
    }

    // Step 2: Create Chat Session (/api/v0/chat_session/create)
    const sessStart = Date.now();
    const sessRes = await fetchWithTimeout(
      `${DEEPSEEK_WEB_BASE}/api/v0/chat_session/create`,
      {
        method: 'POST',
        headers: dsHeaders,
        body: JSON.stringify({ character_id: null }),
      },
      4000
    );
    const sessJson = await sessRes.json().catch(() => null);
    const chatSessionId =
      sessJson?.data?.biz_data?.id || sessJson?.data?.id || '';

    diagnostics.push({
      step: 'chat-session-create',
      ok: Boolean(chatSessionId),
      httpStatus: sessRes.status,
      stepMs: Date.now() - sessStart,
    });

    if (!chatSessionId) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
        mode: auth.mode,
        latencyMs: Date.now() - startedAt,
        error: 'Gagal membuat chat_session_id pada chat.deepseek.com.',
        diagnostics,
      });
    }

    // Step 3: Stream Completion (/api/v0/chat/completion)
    const compStart = Date.now();
    const finalPrompt = system.trim()
      ? `[Instruksi Sistem NodataGPT: ${system.trim()}]\n\nPertanyaan pengguna:\n${cleanText}`
      : cleanText;

    const compRes = await fetchWithTimeout(
      `${DEEPSEEK_WEB_BASE}/api/v0/chat/completion`,
      {
        method: 'POST',
        headers: {
          ...dsHeaders,
          Accept: 'text/event-stream',
          'X-DS-PoW-Response': solvedPow.headerValue,
        },
        body: JSON.stringify({
          chat_session_id: chatSessionId,
          parent_message_id: null,
          prompt: finalPrompt,
          ref_file_ids: [],
          thinking_enabled: Boolean(thinking),
          search_enabled: false,
        }),
      },
      16000
    );

    const rawSse = await compRes.text();
    const parsed = parseDeepSeekSseStream(rawSse);

    diagnostics.push({
      step: 'chat-completion-sse',
      ok: Boolean(compRes.ok && parsed.text),
      httpStatus: compRes.status,
      sseEvents: parsed.eventCount,
      stepMs: Date.now() - compStart,
      ...(isProbe && !parsed.text ? { rawPreview: rawSse.slice(0, 260) } : {}),
    });

    if (!compRes.ok || !parsed.text) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
        mode: auth.mode,
        latencyMs: Date.now() - startedAt,
        error: `Stream SSE chat.deepseek.com tidak menghasilkan teks (HTTP ${compRes.status}).`,
        diagnostics,
      });
    }

    return res.status(200).json({
      status: true,
      ok: true,
      provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
      mode: auth.mode,
      latencyMs: Date.now() - startedAt,
      ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
      result: parsed.text,
      ...(isProbe
        ? { powEngineSelfTest: powSelfTest, diagnostics }
        : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal menghubungi chat.deepseek.com.';
    return res.status(isProbe ? 200 : 502).json({
      status: false,
      ok: false,
      provider: 'DeepSeek Direct Scraper (chat.deepseek.com v2.7.1)',
      latencyMs: Date.now() - startedAt,
      error: message,
      ...(powSelfTest ? { powEngineSelfTest: powSelfTest } : {}),
      diagnostics,
    });
  }
}
