import crypto from 'node:crypto';

export const FREE_TRIAL_LIMIT = 5;
export const GATE_COOKIE_NAME = 'nd_gate_session';
export const CLIENT_HEADER_VALUE = 'web-v3';

const VIP_MAX_AGE_SEC = 365 * 24 * 60 * 60; // 365 days
const GUEST_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days
const PROOF_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_ACCEPTED_TURNS = 12;
const MAX_MAP_BUCKETS = 4096;

const ALLOWED_EXACT_ORIGINS = new Set([
  'https://www.nodatagpt.web.id',
  'https://nodatagpt.web.id',
  'https://nodatagpt.vercel.app',
]);

const SCRAPER_UA_REGEX =
  /\b(curl|wget|python-requests|python-urllib|aiohttp|httpx|pycurl|scrapy|go-http-client|java\/|okhttp|axios\/|node-fetch|undici|got\/|superagent|postmanruntime|insomnia|httpie|libwww-perl|lwp-trivial|php\/|ruby|headlesschrome|phantomjs|slimerjs|puppeteer|playwright|selenium|webdriver|sqlmap|nikto|nuclei|zgrab|masscan|nmap|censys|semrushbot|ahrefsbot|mj12bot|dotbot|bytespider|petalbot|claudebot|gptbot|ccbot)\b/i;

// Bounded in-memory ledgers (warm-instance acceleration + IP trial anti-reset)
const rateLimitBuckets = new Map();
const bruteForceBuckets = new Map();
const ipTrialLedger = new Map();

function pruneMap(map, now = Date.now()) {
  if (map.size < MAX_MAP_BUCKETS) return;
  for (const [key, entry] of map.entries()) {
    if (!entry || (entry.expiresAt && entry.expiresAt <= now)) {
      map.delete(key);
    }
    if (map.size < MAX_MAP_BUCKETS * 0.75) break;
  }
  while (map.size >= MAX_MAP_BUCKETS) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

function getGateSecret() {
  const envSecret = (process.env.NODATA_GATE_SECRET || '').trim();
  if (envSecret.length >= 24) return envSecret;
  // Ephemeral fallback if running locally without Vercel env pulled
  if (!globalThis.__ndFallbackGateSecret) {
    globalThis.__ndFallbackGateSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalThis.__ndFallbackGateSecret;
}

export function getConfiguredAccessPassword() {
  return (process.env.NODATA_ACCESS_PASSWORD || '').trim();
}

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input)
    ? input
    : Buffer.from(typeof input === 'string' ? input : JSON.stringify(input), 'utf8');
  return buf.toString('base64url');
}

function base64UrlDecodeToString(str) {
  try {
    return Buffer.from(String(str || ''), 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

function hmacSign(purpose, payloadStr) {
  return crypto
    .createHmac('sha256', getGateSecret())
    .update(`${purpose}:${payloadStr}`, 'utf8')
    .digest('base64url');
}

export function safeEqualStrings(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  const digestA = crypto.createHash('sha256').update(strA, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(strB, 'utf8').digest();
  const matchDigest = crypto.timingSafeEqual(digestA, digestB);
  return matchDigest && strA.length === strB.length && strA.length > 0;
}

function safeEqualSignature(sigA, sigB) {
  if (typeof sigA !== 'string' || typeof sigB !== 'string') return false;
  if (!sigA || sigA.length !== sigB.length) return false;
  try {
    const bufA = Buffer.from(sigA, 'utf8');
    const bufB = Buffer.from(sigB, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function readHeader(req, name) {
  const lower = name.toLowerCase();
  if (!req || !req.headers) return '';
  if (typeof req.headers.get === 'function') {
    return String(req.headers.get(lower) || req.headers.get(name) || '').trim();
  }
  const raw = req.headers[lower] ?? req.headers[name];
  if (Array.isArray(raw)) return String(raw[0] || '').trim();
  return String(raw || '').trim();
}

export function extractTrustedClientIp(req) {
  // Prefer Vercel's trusted edge-overwritten header so client-injected XFF cannot spoof IP
  const vercelIp = readHeader(req, 'x-vercel-forwarded-for');
  if (vercelIp) {
    const first = vercelIp.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = readHeader(req, 'x-real-ip');
  if (realIp) return realIp;

  const xff = readHeader(req, 'x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return '0.0.0.0';
}

export function hashIp(ip) {
  return hmacSign('ip-v1', String(ip || '0.0.0.0')).slice(0, 22);
}

export function hashUserAgentFamily(ua) {
  const raw = String(ua || '').trim();
  // Bind to stable browser major family so minor navigation headers never break session
  const normalized = raw
    .replace(/\bChrome\/(\d+)[\d.]+/g, 'Chrome/$1')
    .replace(/\bVersion\/(\d+)[\d.]+/g, 'Version/$1')
    .replace(/\bFirefox\/(\d+)[\d.]+/g, 'Firefox/$1')
    .slice(0, 180);
  return hmacSign('ua-v1', normalized).slice(0, 14);
}

export function isScraperOrBotUserAgent(ua) {
  const clean = String(ua || '').trim();
  if (clean.length < 18) return true;
  if (SCRAPER_UA_REGEX.test(clean)) return true;
  if (!/Mozilla\/5\.0/i.test(clean)) return true;
  return false;
}

function isAllowedHostName(hostname) {
  const h = String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
  if (!h) return false;
  if (
    h === 'www.nodatagpt.web.id' ||
    h === 'nodatagpt.web.id' ||
    h === 'nodatagpt.vercel.app' ||
    h === 'localhost' ||
    h === '127.0.0.1'
  ) {
    return true;
  }
  if (h.endsWith('.nodatagpt.web.id')) return true;
  if (h.endsWith('.e2b.app')) return true;
  if (
    h.endsWith('.vercel.app') &&
    (h.startsWith('nodatagpt') || h.includes('mrnodatax') || h.includes('worm-gpt'))
  ) {
    return true;
  }
  return false;
}

export function verifyOriginAndFetchSite(req, { allowTopLevelNavigation = false } = {}) {
  const reqHost =
    readHeader(req, 'x-forwarded-host') || readHeader(req, 'host') || '';
  const origin = readHeader(req, 'origin');
  const referer = readHeader(req, 'referer');
  const secFetchSite = readHeader(req, 'sec-fetch-site').toLowerCase();
  const secFetchMode = readHeader(req, 'sec-fetch-mode').toLowerCase();

  let matchedOrigin = '';

  if (origin) {
    if (origin === 'null') {
      return { ok: false, reason: 'Origin sandbox null tidak diizinkan.' };
    }
    try {
      const parsedOrigin = new URL(origin);
      const cleanReqHost = reqHost.split(',')[0]?.trim().toLowerCase();
      const sameAsReqHost =
        cleanReqHost &&
        parsedOrigin.host.toLowerCase() === cleanReqHost &&
        isAllowedHostName(parsedOrigin.hostname);

      if (
        ALLOWED_EXACT_ORIGINS.has(parsedOrigin.origin) ||
        isAllowedHostName(parsedOrigin.hostname) ||
        sameAsReqHost
      ) {
        matchedOrigin = parsedOrigin.origin;
      } else {
        return { ok: false, reason: 'Origin lintas-situs ditolak oleh NodataGPT Shield.' };
      }
    } catch {
      return { ok: false, reason: 'Header Origin tidak valid.' };
    }
  }

  if (secFetchSite) {
    if (secFetchSite === 'cross-site') {
      return { ok: false, reason: 'Permintaan cross-site diblokir oleh kebijakan keamanan.' };
    }
    if (
      secFetchSite === 'none' &&
      !allowTopLevelNavigation &&
      secFetchMode !== 'navigate'
    ) {
      // Allow same-origin referer if present, otherwise block raw non-navigation 'none' without origin
      if (!matchedOrigin && !referer) {
        return { ok: false, reason: 'Konteks fetch langsung tidak diizinkan.' };
      }
    }
  }

  if (!matchedOrigin && referer) {
    try {
      const parsedRef = new URL(referer);
      if (!isAllowedHostName(parsedRef.hostname)) {
        return { ok: false, reason: 'Referer lintas-situs ditolak.' };
      }
      matchedOrigin = parsedRef.origin;
    } catch {
      return { ok: false, reason: 'Header Referer tidak valid.' };
    }
  }

  if (!matchedOrigin && !secFetchSite && !allowTopLevelNavigation) {
    return {
      ok: false,
      reason: 'Permintaan wajib berasal dari aplikasi resmi NodataGPT.',
    };
  }

  return { ok: true, matchedOrigin };
}

export function checkSlidingRateLimit(bucketKey, limit, windowMs) {
  const now = Date.now();
  pruneMap(rateLimitBuckets, now);
  const existing = rateLimitBuckets.get(bucketKey);
  const timestamps = existing
    ? existing.timestamps.filter((t) => now - t < windowMs)
    : [];

  if (timestamps.length >= limit) {
    const oldest = timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    rateLimitBuckets.set(bucketKey, {
      timestamps,
      expiresAt: now + windowMs,
    });
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  timestamps.push(now);
  rateLimitBuckets.set(bucketKey, {
    timestamps,
    expiresAt: now + windowMs,
  });
  return {
    allowed: true,
    remaining: Math.max(0, limit - timestamps.length),
    retryAfterSec: 0,
  };
}

export function checkPasswordBruteForce(ipHash) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  pruneMap(bruteForceBuckets, now);
  const record = bruteForceBuckets.get(ipHash);
  if (!record) return { locked: false, retryAfterSec: 0, attempts: 0 };

  const recent = record.timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= 5) {
    const retryAfterSec = Math.max(
      10,
      Math.ceil((windowMs - (now - recent[0])) / 1000)
    );
    return { locked: true, retryAfterSec, attempts: recent.length };
  }
  return { locked: false, retryAfterSec: 0, attempts: recent.length };
}

export function recordPasswordFailure(ipHash) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const record = bruteForceBuckets.get(ipHash);
  const recent = record ? record.timestamps.filter((t) => now - t < windowMs) : [];
  recent.push(now);
  bruteForceBuckets.set(ipHash, {
    timestamps: recent,
    expiresAt: now + windowMs,
  });
  return Math.max(0, 5 - recent.length);
}

export function clearPasswordFailures(ipHash) {
  bruteForceBuckets.delete(ipHash);
}

function parseCookies(req) {
  const raw = readHeader(req, 'cookie');
  const out = {};
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export function createGateSessionPayload({
  sid = crypto.randomBytes(12).toString('base64url'),
  tier = 'guest',
  used = 0,
  turns = [],
  ipHash = '',
  uaHash = '',
  vipExp = 0,
  inviteLabel = '',
}) {
  const now = Date.now();
  const maxAgeMs =
    tier === 'vip'
      ? vipExp > now
        ? vipExp - now
        : VIP_MAX_AGE_SEC * 1000
      : GUEST_MAX_AGE_SEC * 1000;

  return {
    v: 1,
    sid,
    tier: tier === 'vip' ? 'vip' : 'guest',
    used: Math.max(0, Math.min(FREE_TRIAL_LIMIT, Number(used) || 0)),
    turns: Array.isArray(turns) ? turns.slice(-MAX_ACCEPTED_TURNS) : [],
    ipHash,
    uaHash,
    iat: now,
    exp: now + maxAgeMs,
    ...(inviteLabel ? { label: String(inviteLabel).slice(0, 32) } : {}),
  };
}

export function signSessionCookieValue(payload) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacSign('cookie-v1', encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionCookie(req) {
  const cookies = parseCookies(req);
  const token = cookies[GATE_COOKIE_NAME];
  if (!token || typeof token !== 'string') return null;

  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmacSign('cookie-v1', encoded);
  if (!safeEqualSignature(sig, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecodeToString(encoded));
    if (!parsed || parsed.v !== 1 || !parsed.sid) return null;
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSetCookieHeader(req, sessionPayload) {
  const value = signSessionCookieValue(sessionPayload);
  const reqProto = readHeader(req, 'x-forwarded-proto').toLowerCase();
  const host = (readHeader(req, 'host') || '').toLowerCase();
  const isLocalHttp =
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')) &&
    reqProto !== 'https';
  const maxAgeSec = Math.max(
    60,
    Math.floor(((sessionPayload.exp || Date.now() + 3600000) - Date.now()) / 1000)
  );

  const attrs = [
    `${GATE_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (!isLocalHttp) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

export function issueProofToken(sessionPayload) {
  const now = Date.now();
  const proofPayload = {
    v: 1,
    sid: sessionPayload.sid,
    tier: sessionPayload.tier,
    ua: sessionPayload.uaHash || '',
    iat: now,
    exp: Math.min(sessionPayload.exp || now + PROOF_TTL_MS, now + PROOF_TTL_MS),
  };
  const encoded = base64UrlEncode(JSON.stringify(proofPayload));
  const sig = hmacSign('proof-v1', encoded);
  return `${encoded}.${sig}`;
}

export function verifyProofToken(rawProof, sessionPayload, currentUaHash) {
  if (!rawProof || typeof rawProof !== 'string' || !sessionPayload) return false;
  const dot = rawProof.indexOf('.');
  if (dot <= 0) return false;
  const encoded = rawProof.slice(0, dot);
  const sig = rawProof.slice(dot + 1);
  const expected = hmacSign('proof-v1', encoded);
  if (!safeEqualSignature(sig, expected)) return false;

  try {
    const parsed = JSON.parse(base64UrlDecodeToString(encoded));
    if (!parsed || parsed.v !== 1) return false;
    if (parsed.sid !== sessionPayload.sid) return false;
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return false;
    if (parsed.ua && currentUaHash && parsed.ua !== currentUaHash) return false;
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Signed Time-Bound Invite Code Generator & Verifier (NDG1.<payload>.<sig16>)
// ============================================================================
export function mintSignedInviteCode({ durationHours = 168, label = 'VIP' } = {}) {
  const hours = Math.max(1, Math.min(24 * 365 * 3, Number(durationHours) || 168));
  const now = Date.now();
  const payload = {
    v: 1,
    lbl: String(label || 'VIP').trim().slice(0, 24),
    exp: now + Math.round(hours * 3600 * 1000),
    n: crypto.randomBytes(4).toString('hex'),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacSign('invite-v1', encoded).slice(0, 22);
  return {
    code: `NDG1.${encoded}.${sig}`,
    expiresAt: payload.exp,
    label: payload.lbl,
  };
}

export function verifySignedInviteCode(rawInput) {
  const clean = String(rawInput || '').trim();
  if (!clean.startsWith('NDG1.')) return null;
  const parts = clean.split('.');
  if (parts.length !== 3) return null;
  const [, encoded, sig] = parts;
  const expected = hmacSign('invite-v1', encoded).slice(0, 22);
  if (!safeEqualSignature(sig, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecodeToString(encoded));
    if (!parsed || parsed.v !== 1 || typeof parsed.exp !== 'number') return null;
    if (parsed.exp <= Date.now()) {
      return { valid: false, expired: true };
    }
    return {
      valid: true,
      expired: false,
      expiresAt: parsed.exp,
      label: parsed.lbl || 'VIP Invite',
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Dual-Factor Guest 5-Trial Ledger (Cookie + Trusted Edge IP)
// ============================================================================
function getIpTrialState(ipHash) {
  const now = Date.now();
  const ttlMs = 30 * 24 * 60 * 60 * 1000;
  pruneMap(ipTrialLedger, now);
  const existing = ipTrialLedger.get(ipHash);
  if (!existing || existing.expiresAt <= now) {
    return { used: 0, turns: [] };
  }
  return {
    used: existing.used,
    turns: Array.isArray(existing.turns) ? existing.turns : [],
  };
}

function saveIpTrialState(ipHash, turns) {
  const uniqueTurns = Array.from(new Set(turns)).slice(-MAX_ACCEPTED_TURNS);
  const used = Math.min(FREE_TRIAL_LIMIT, uniqueTurns.length);
  ipTrialLedger.set(ipHash, {
    used,
    turns: uniqueTurns,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return { used, turns: uniqueTurns };
}

export function syncSessionWithIpLedger(sessionPayload, ipHash) {
  if (!sessionPayload || sessionPayload.tier === 'vip') return sessionPayload;
  const ipState = getIpTrialState(ipHash);
  const mergedTurns = Array.from(
    new Set([...(sessionPayload.turns || []), ...ipState.turns])
  ).slice(-MAX_ACCEPTED_TURNS);
  const mergedUsed = Math.min(
    FREE_TRIAL_LIMIT,
    Math.max(Number(sessionPayload.used) || 0, ipState.used, mergedTurns.length)
  );
  if (mergedTurns.length > ipState.turns.length) {
    saveIpTrialState(ipHash, mergedTurns);
  }
  return {
    ...sessionPayload,
    used: mergedUsed,
    turns: mergedTurns,
  };
}

export function consumeGuestTrialTurn(sessionPayload, ipHash, rawTurnId) {
  if (sessionPayload.tier === 'vip') {
    return { allowed: true, updatedSession: sessionPayload, changed: false };
  }

  const synced = syncSessionWithIpLedger(sessionPayload, ipHash);
  const cleanTurnId = /^ndturn_[a-zA-Z0-9_-]{6,64}$/.test(String(rawTurnId || '').trim())
    ? String(rawTurnId).trim()
    : `ndturn_auto_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Deduplicate: if this turnId was already accepted (e.g. AI auto-fallback mirror #2), allow with 0 extra charge!
  if (synced.turns.includes(cleanTurnId)) {
    return { allowed: true, updatedSession: synced, changed: false };
  }

  if (synced.used >= FREE_TRIAL_LIMIT) {
    return { allowed: false, updatedSession: synced, changed: false };
  }

  const nextTurns = [...synced.turns, cleanTurnId].slice(-MAX_ACCEPTED_TURNS);
  const nextUsed = Math.min(FREE_TRIAL_LIMIT, Math.max(synced.used + 1, nextTurns.length));
  saveIpTrialState(ipHash, nextTurns);

  const updatedSession = {
    ...synced,
    used: nextUsed,
    turns: nextTurns,
  };
  return { allowed: true, updatedSession, changed: true };
}

export function serializePublicGateState(sessionPayload) {
  const isVip = sessionPayload?.tier === 'vip';
  const used = isVip
    ? 0
    : Math.max(0, Math.min(FREE_TRIAL_LIMIT, Number(sessionPayload?.used) || 0));
  const remaining = isVip ? 999999 : Math.max(0, FREE_TRIAL_LIMIT - used);
  return {
    ok: true,
    tier: isVip ? 'vip' : 'guest',
    unlocked: isVip,
    locked: !isVip && used >= FREE_TRIAL_LIMIT,
    used,
    limit: FREE_TRIAL_LIMIT,
    remaining,
    expiresAt: sessionPayload?.exp || null,
    proofToken: issueProofToken(sessionPayload),
  };
}

// ============================================================================
// Security Response Headers Helper (Node res & Fetch Headers)
// ============================================================================
export function applyNodeSecurityHeaders(req, res, { matchedOrigin = '', cacheControl } = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Vary', 'Origin, Cookie');
  res.setHeader(
    'Cache-Control',
    cacheControl || 'private, no-store, no-cache, must-revalidate'
  );

  if (matchedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, X-Nodata-Client, X-Nodata-Proof, X-Nodata-Turn, X-Nodata-Byok'
    );
  }
}

export function hasValidAdminDiagSecret(req) {
  const provided = readHeader(req, 'x-nodata-diag');
  if (!provided) return false;
  const secret = getGateSecret();
  const diagToken = hmacSign('diag-v1', 'nodatagpt-probe');
  return safeEqualStrings(provided, secret) || safeEqualStrings(provided, diagToken);
}

// ============================================================================
// Unified Node Serverless Guard for api/{proxy,webai,gemini,chatgpt,qwen,deepseek}.js
// ============================================================================
export function enforceNodeApiSecurity(
  req,
  res,
  {
    routeName = 'api',
    mode = 'api', // 'api' | 'media'
    isDiagnostic = false,
    allowByokBypass = false,
    maxBodyBytes = 98304, // 96 KB default
    guestRatePerMin = 16,
    vipRatePerMin = 50,
  } = {}
) {
  const originCheck = verifyOriginAndFetchSite(req, {
    allowTopLevelNavigation: mode === 'media',
  });
  applyNodeSecurityHeaders(req, res, {
    matchedOrigin: originCheck.matchedOrigin,
    cacheControl:
      mode === 'media'
        ? 'private, max-age=1800'
        : 'private, no-store, no-cache, must-revalidate',
  });

  if (req.method === 'OPTIONS') {
    if (!originCheck.ok) {
      res.status(403).end();
      return { allowed: false };
    }
    res.status(204).end();
    return { allowed: false };
  }

  // Admin diagnostic secret bypass (only for explicit authenticated server diagnostics)
  if (hasValidAdminDiagSecret(req)) {
    return { allowed: true, tier: 'vip', isAdminDiag: true };
  }

  if (!originCheck.ok) {
    res.status(403).json({
      ok: false,
      status: false,
      code: 'ANTI_SCRAPER_ORIGIN',
      error: originCheck.reason,
    });
    return { allowed: false };
  }

  const ua = readHeader(req, 'user-agent');
  if (isScraperOrBotUserAgent(ua)) {
    res.status(403).json({
      ok: false,
      status: false,
      code: 'ANTI_SCRAPER_UA',
      error: 'Akses otomatis/scraper diblokir oleh sistem keamanan berlapis NodataGPT.',
    });
    return { allowed: false };
  }

  // Body size cap BEFORE expensive upstream work
  if (req.method === 'POST' && req.body !== undefined && req.body !== null) {
    const approxBytes =
      typeof req.body === 'string'
        ? Buffer.byteLength(req.body, 'utf8')
        : Buffer.isBuffer(req.body)
          ? req.body.byteLength
          : Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (approxBytes > maxBodyBytes) {
      res.status(413).json({
        ok: false,
        status: false,
        code: 'PAYLOAD_TOO_LARGE',
        error: 'Ukuran permintaan melebihi batas keamanan server.',
      });
      return { allowed: false };
    }
  }

  const clientIp = extractTrustedClientIp(req);
  const ipHash = hashIp(clientIp);
  const uaHash = hashUserAgentFamily(ua);

  let session = verifySessionCookie(req);
  if (!session) {
    res.status(403).json({
      ok: false,
      status: false,
      code: 'SESSION_REQUIRED',
      error: 'Sesi keamanan NodataGPT tidak ditemukan. Silakan muat ulang halaman aplikasi.',
    });
    return { allowed: false };
  }

  // On JSON API routes, enforce Double-Submit HMAC Proof + Custom Client Header
  if (mode === 'api') {
    const clientTag = readHeader(req, 'x-nodata-client');
    const proof = readHeader(req, 'x-nodata-proof');
    if (clientTag !== CLIENT_HEADER_VALUE || !verifyProofToken(proof, session, uaHash)) {
      res.status(403).json({
        ok: false,
        status: false,
        code: 'PROOF_INVALID',
        error: 'Token verifikasi anti-scraping tidak valid atau kedaluwarsa.',
      });
      return { allowed: false };
    }
  }

  // Lock ?probe=1 and ?catalog=1 strictly to VIP sessions
  if (isDiagnostic && session.tier !== 'vip') {
    res.status(403).json({
      ok: false,
      status: false,
      code: 'DIAGNOSTIC_LOCKED',
      error: 'Endpoint diagnostik hanya diizinkan untuk akses VIP terotorisasi.',
    });
    return { allowed: false };
  }

  // Per-IP sliding window rate limiter
  const rateLimit = session.tier === 'vip' ? vipRatePerMin : mode === 'media' ? 90 : guestRatePerMin;
  const rl = checkSlidingRateLimit(`${routeName}:${ipHash}`, rateLimit, 60_000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({
      ok: false,
      status: false,
      code: 'RATE_LIMITED',
      error: `Terlalu banyak permintaan dalam waktu singkat. Coba lagi dalam ${rl.retryAfterSec} detik.`,
    });
    return { allowed: false };
  }

  // Passive media loads (<img src>, <audio src>, 1-click download) only require valid session + same-origin
  if (mode === 'media') {
    return { allowed: true, tier: session.tier, session };
  }

  // VIP or verified personal BYOK relay bypasses 5-trial deduction
  if (session.tier === 'vip' || allowByokBypass) {
    return { allowed: true, tier: session.tier, session };
  }

  // Guest 5-Trial Enforcement (deduplicated per X-Nodata-Turn so fallback mirrors count as 1 try)
  const turnHeader = readHeader(req, 'x-nodata-turn');
  const turnResult = consumeGuestTrialTurn(session, ipHash, turnHeader);

  if (!turnResult.allowed) {
    res.setHeader('Set-Cookie', buildSetCookieHeader(req, turnResult.updatedSession));
    res.status(402).json({
      ok: false,
      status: false,
      code: 'TRIAL_EXHAUSTED',
      used: FREE_TRIAL_LIMIT,
      limit: FREE_TRIAL_LIMIT,
      remaining: 0,
      error:
        'Masa uji coba gratis 5x Anda telah habis. Silakan masukkan sandi akses VIP untuk melanjutkan.',
    });
    return { allowed: false };
  }

  if (turnResult.changed) {
    res.setHeader('Set-Cookie', buildSetCookieHeader(req, turnResult.updatedSession));
  }

  return {
    allowed: true,
    tier: 'guest',
    session: turnResult.updatedSession,
  };
}

// ============================================================================
// Fetch-Standard Request Guard for api/download.js
// ============================================================================
export function enforceFetchMediaSecurity(request, { isDiagnostic = false } = {}) {
  const originCheck = verifyOriginAndFetchSite(request, {
    allowTopLevelNavigation: true,
  });

  const baseSecHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    Vary: 'Origin, Cookie',
    ...(originCheck.matchedOrigin
      ? {
          'Access-Control-Allow-Origin': originCheck.matchedOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Accept, Range, X-Nodata-Client, X-Nodata-Proof, X-Nodata-Turn',
        }
      : {}),
  };

  if (request.method === 'OPTIONS') {
    return {
      allowed: false,
      response: new Response(null, {
        status: originCheck.ok ? 204 : 403,
        headers: baseSecHeaders,
      }),
    };
  }

  if (hasValidAdminDiagSecret(request)) {
    return { allowed: true, extraHeaders: baseSecHeaders };
  }

  if (!originCheck.ok) {
    return {
      allowed: false,
      response: Response.json(
        {
          ok: false,
          code: 'ANTI_HOTLINK_ORIGIN',
          error: originCheck.reason,
        },
        { status: 403, headers: baseSecHeaders }
      ),
    };
  }

  const ua = readHeader(request, 'user-agent');
  if (isScraperOrBotUserAgent(ua)) {
    return {
      allowed: false,
      response: Response.json(
        {
          ok: false,
          code: 'ANTI_HOTLINK_UA',
          error: 'Hotlinking/scraping media diblokir oleh NodataGPT.',
        },
        { status: 403, headers: baseSecHeaders }
      ),
    };
  }

  const session = verifySessionCookie(request);
  if (!session) {
    return {
      allowed: false,
      response: Response.json(
        {
          ok: false,
          code: 'SESSION_REQUIRED',
          error: 'Sesi aplikasi diperlukan untuk mengakses media.',
        },
        { status: 403, headers: baseSecHeaders }
      ),
    };
  }

  // Note: /api/download?probe=1 is used by directDownload.ts for lightweight Range: bytes=0-0 size check
  // before 1-click download, so both valid Guest and VIP sessions with valid Proof/Cookie may use it,
  // while external scrapers without session+same-origin are 100% blocked above.
  if (isDiagnostic && !session.sid) {
    return {
      allowed: false,
      response: Response.json({ ok: false, error: 'Forbidden' }, { status: 403, headers: baseSecHeaders }),
    };
  }

  const ipHash = hashIp(extractTrustedClientIp(request));
  const rl = checkSlidingRateLimit(`download:${ipHash}`, 110, 60_000);
  if (!rl.allowed) {
    return {
      allowed: false,
      response: Response.json(
        {
          ok: false,
          code: 'RATE_LIMITED',
          error: 'Batas unduhan per menit tercapai. Tunggu sebentar.',
        },
        {
          status: 429,
          headers: {
            ...baseSecHeaders,
            'Retry-After': String(rl.retryAfterSec),
          },
        }
      ),
    };
  }

  return {
    allowed: true,
    session,
    extraHeaders: baseSecHeaders,
  };
}
