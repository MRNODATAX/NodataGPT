import dns from 'node:dns';
import crypto from 'node:crypto';
import { enforceNodeApiSecurity } from '../lib/securityGate.js';

// Force IPv4-first DNS resolution on Vercel Node 24 to prevent IPv6 connect blackholes
dns.setDefaultResultOrder('ipv4first');

const CHATGPT_BASE = 'https://chatgpt.com';
const FALLBACK_BUILD_NUMBER = 'prod-69a06c53754594935887d6c16b844885964a78fc';
const BUILD_CACHE_TTL_MS = 15 * 60 * 1000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
];

const NAVIGATOR_PROPS = [
  'vendorSub−',
  'productSub−20030107',
  'vendor−Google Inc.',
  'maxTouchPoints−0',
  'pdfViewerEnabled−true',
  'hardwareConcurrency−8',
  'cookieEnabled−true',
  'credentials−[object CredentialsContainer]',
  'storage−[object StorageManager]',
  'locks−[object LockManager]',
  'gpu−[object GPU]',
  'language−id-ID',
  'languages−id-ID,id,en-US,en',
  'onLine−true',
  'webdriver−false',
];

const DOC_KEYS = ['_reactListeningo743lnnpvdg', 'location'];
const WIN_KEYS = [
  '0',
  'window',
  'self',
  'document',
  'name',
  'location',
  'navigator',
  'screen',
  'innerWidth',
  'innerHeight',
  '__reactRouterContext',
  '__NEXT_DATA__',
];

/** @type {{ buildNumber: string, cookies: string, mintedAt: number } | null} */
let cachedHomeState = null;

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function fnv1aHex8(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0).toString(16).padStart(8, '0');
}

function encodeBrowserConfig(cfg) {
  return Buffer.from(JSON.stringify(cfg), 'utf8').toString('base64');
}

export function buildBrowserConfig(userAgent, buildNumber) {
  const perfNow = Math.random() * 1200 + 180;
  const timeOrigin = Date.now() - perfNow;
  return [
    1920 + 1080,
    String(new Date()),
    4294705152,
    0,
    userAgent,
    'https://chatgpt.com/',
    buildNumber || FALLBACK_BUILD_NUMBER,
    'id-ID',
    'id-ID,id,en-US,en',
    Math.random(),
    randomChoice(NAVIGATOR_PROPS),
    randomChoice(DOC_KEYS),
    randomChoice(WIN_KEYS),
    perfNow,
    crypto.randomUUID(),
    '',
    8,
    timeOrigin,
  ];
}

export function solveSentinelPow(seed, difficulty, userAgent, buildNumber) {
  const startTime = Date.now();
  const cfg = buildBrowserConfig(userAgent, buildNumber);
  const diffStr = String(difficulty || '0fffff').toLowerCase();
  const diffLen = diffStr.length;

  for (let nonce = 0; nonce < 500000; nonce++) {
    cfg[3] = nonce;
    cfg[9] = Date.now() - startTime;
    const encoded = encodeBrowserConfig(cfg);
    const digest = fnv1aHex8(String(seed || '') + encoded);
    if (digest.slice(0, diffLen) <= diffStr) {
      return {
        solved: true,
        nonce,
        elapsedMs: Date.now() - startTime,
        token: `gAAAAAB${encoded}~S`,
      };
    }
  }

  return {
    solved: false,
    nonce: 500000,
    elapsedMs: Date.now() - startTime,
    token: `gAAAAAB${encodeBrowserConfig(cfg)}~S`,
  };
}

function generateTurnstilePlaceholder() {
  return crypto.randomBytes(1692).toString('base64');
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
    if (first && first.includes('=')) {
      pairs.push(first);
    }
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

async function ensureHomeState(deviceId, userAgent, forceRefresh = false) {
  const envCookie = (process.env.CHATGPT_COOKIE || '').trim();
  if (
    !forceRefresh &&
    cachedHomeState &&
    Date.now() - cachedHomeState.mintedAt < BUILD_CACHE_TTL_MS
  ) {
    return {
      ...cachedHomeState,
      cookies: mergeCookies(cachedHomeState.cookies, `oai-did=${deviceId}`, envCookie),
    };
  }

  let buildNumber = FALLBACK_BUILD_NUMBER;
  let cookies = `oai-did=${deviceId}`;

  try {
    const res = await fetchWithTimeout(
      `${CHATGPT_BASE}/`,
      {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          Cookie: mergeCookies(cookies, envCookie),
        },
      },
      3500
    );

    const setCookieStr = extractSetCookies(res.headers);
    if (setCookieStr) {
      cookies = mergeCookies(cookies, setCookieStr);
    }

    if (res.ok) {
      const html = await res.text();
      const buildMatch =
        /"buildNumber"\s*:\s*"(prod-[0-9a-fA-F-]+)"/.exec(html) ||
        /data-seq="(prod-[0-9a-fA-F-]+)"/.exec(html) ||
        /\b(prod-[0-9a-f]{32,48})\b/.exec(html);
      if (buildMatch && buildMatch[1]) {
        buildNumber = buildMatch[1];
      }
    }
  } catch {
    // Non-fatal: proceed with fallback build hash
  }

  cachedHomeState = {
    buildNumber,
    cookies,
    mintedAt: Date.now(),
  };

  return {
    buildNumber,
    cookies: mergeCookies(cookies, envCookie),
  };
}

export function parseChatGptSseStream(rawSse) {
  let answer = '';
  let snapshotAnswer = '';
  let thoughts = '';
  let eventCount = 0;
  let currentPath = '';

  const applyDeltaOp = (opObj) => {
    if (!opObj || typeof opObj !== 'object') return;

    if (Array.isArray(opObj.v)) {
      for (const item of opObj.v) applyDeltaOp(item);
      return;
    }

    if (typeof opObj.p === 'string') {
      currentPath = opObj.p;
    }

    if (
      opObj.v &&
      typeof opObj.v === 'object' &&
      opObj.v.message &&
      typeof opObj.v.message === 'object'
    ) {
      const msg = opObj.v.message;
      const role = msg?.author?.role;
      const contentType = msg?.content?.content_type;
      if (role === 'assistant') {
        if (contentType === 'thoughts' && Array.isArray(msg?.content?.thoughts)) {
          const joined = msg.content.thoughts
            .map((t) => t?.content || t?.summary || '')
            .filter(Boolean)
            .join('\n');
          if (joined) thoughts = joined;
        } else if (Array.isArray(msg?.content?.parts)) {
          const textPart = msg.content.parts
            .filter((x) => typeof x === 'string')
            .join('');
          if (textPart && textPart.length >= snapshotAnswer.length) {
            snapshotAnswer = textPart;
          }
        }
      }
      return;
    }

    if (opObj.o === 'append' && typeof opObj.v === 'string') {
      if (
        !opObj.p ||
        opObj.p.includes('/message/content/parts/0') ||
        currentPath.includes('/message/content/parts/0')
      ) {
        answer += opObj.v;
      } else if (
        opObj.p.includes('/thoughts') ||
        currentPath.includes('/thoughts')
      ) {
        thoughts += opObj.v;
      }
      return;
    }

    if (
      !opObj.o &&
      !opObj.p &&
      typeof opObj.v === 'string' &&
      currentPath.includes('/message/content/parts/0')
    ) {
      answer += opObj.v;
    }
  };

  for (const line of String(rawSse || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const dataStr = trimmed.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;

    try {
      const parsed = JSON.parse(dataStr);
      eventCount++;

      // Classic full-message snapshot format
      if (parsed?.message?.author?.role === 'assistant') {
        const parts = parsed?.message?.content?.parts;
        if (Array.isArray(parts)) {
          const joined = parts.filter((x) => typeof x === 'string').join('');
          if (joined.length >= snapshotAnswer.length) {
            snapshotAnswer = joined;
          }
        }
      }

      // Delta patch format (2026 Conduit / v1 delta encoding)
      applyDeltaOp(parsed);
    } catch {
      // Ignore non-JSON ping/event metadata lines
    }
  }

  const finalAnswer = (
    answer.trim().length >= snapshotAnswer.trim().length ? answer : snapshotAnswer
  ).trim();

  return {
    text: finalAnswer,
    thoughts: thoughts.trim(),
    eventCount,
  };
}

async function tryServerOpenAiKey(cleanText, system, startedAt) {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return null;

  const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
  const messages = [];
  if (system.trim()) {
    messages.push({ role: 'system', content: system.trim() });
  }
  messages.push({ role: 'user', content: cleanText });

  const res = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    },
    18000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const answer = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!answer) return null;

  return {
    status: true,
    ok: true,
    provider: `OpenAI Resmi (${model})`,
    mode: 'server-api-key',
    latencyMs: Date.now() - startedAt,
    result: answer,
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const isProbe = req.query?.probe === '1';

  const sec = enforceNodeApiSecurity(req, res, {
    routeName: 'chatgpt',
    mode: 'api',
    isDiagnostic: isProbe,
    maxBodyBytes: 98304,
    guestRatePerMin: 12,
    vipRatePerMin: 40,
  });
  if (!sec.allowed) return;

  let text = '';
  let system = '';
  let modelSlug = 'auto';

  if (req.method === 'GET' && isProbe) {
    text =
      typeof req.query?.text === 'string'
        ? req.query.text
        : req.query?.q || req.query?.prompt || '';
    system = typeof req.query?.system === 'string' ? req.query.system : '';
    if (typeof req.query?.model === 'string' && req.query.model.trim()) {
      modelSlug = req.query.model.trim();
    }
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
    if (typeof payload.model === 'string' && payload.model.trim()) {
      modelSlug = payload.model.trim();
    }
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

  // Tier 1: Optional Server OPENAI_API_KEY
  try {
    const official = await tryServerOpenAiKey(cleanText, system, startedAt);
    if (official) {
      return res.status(200).json(official);
    }
  } catch {
    // Fall through to Direct chatgpt.com Web Scraper
  }

  const accessToken = (
    process.env.CHATGPT_ACCESS_TOKEN ||
    process.env.OPENAI_ACCESS_TOKEN ||
    ''
  ).trim();
  const apiPrefix = accessToken ? '/backend-api' : '/backend-anon';
  const mode = accessToken
    ? 'bearer-session'
    : process.env.CHATGPT_COOKIE
      ? 'cookie-session'
      : 'guest-keyless';

  const deviceId = crypto.randomUUID();
  const userAgent = USER_AGENTS[0];
  const diagnostics = [];

  try {
    const home = await ensureHomeState(deviceId, userAgent, false);
    let cookies = home.cookies;

    const baseHeaders = {
      Accept: 'application/json',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      Origin: CHATGPT_BASE,
      Referer: `${CHATGPT_BASE}/`,
      'OAI-Device-Id': deviceId,
      'OAI-Language': 'id-ID',
      'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': userAgent,
      ...(cookies ? { Cookie: cookies } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const initProof = `gAAAAAC${encodeBrowserConfig(
      buildBrowserConfig(userAgent, home.buildNumber)
    )}`;

    // Step 1: Acquire Sentinel Chat Requirements (prepare + finalize, or classic fallback)
    const step1Start = Date.now();
    let chatReqToken = '';
    let proofToken = '';
    let turnstileToken = '';

    const prepRes = await fetchWithTimeout(
      `${CHATGPT_BASE}${apiPrefix}/sentinel/chat-requirements/prepare`,
      {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ p: initProof }),
      },
      4500
    );

    const prepSetCookies = extractSetCookies(prepRes.headers);
    if (prepSetCookies) {
      cookies = mergeCookies(cookies, prepSetCookies);
      baseHeaders.Cookie = cookies;
    }

    const cfMitigated = prepRes.headers.get('cf-mitigated') || null;

    if (prepRes.ok) {
      const prepData = await prepRes.json();
      if (prepData?.proofofwork?.required) {
        const solved = solveSentinelPow(
          prepData.proofofwork.seed,
          prepData.proofofwork.difficulty,
          userAgent,
          home.buildNumber
        );
        proofToken = solved.token;
        diagnostics.push({
          step: 'sentinel-pow',
          ok: solved.solved,
          nonce: solved.nonce,
          stepMs: solved.elapsedMs,
        });
      }

      if (prepData?.turnstile?.required) {
        turnstileToken = generateTurnstilePlaceholder();
      }

      if (prepData?.prepare_token) {
        const finStart = Date.now();
        const finBody = { prepare_token: prepData.prepare_token };
        if (proofToken) finBody.proofofwork = proofToken;
        if (turnstileToken) finBody.turnstile = turnstileToken;

        const finRes = await fetchWithTimeout(
          `${CHATGPT_BASE}${apiPrefix}/sentinel/chat-requirements/finalize`,
          {
            method: 'POST',
            headers: baseHeaders,
            body: JSON.stringify(finBody),
          },
          4000
        );

        if (finRes.ok) {
          const finData = await finRes.json();
          chatReqToken = finData?.token || '';
        }
        diagnostics.push({
          step: 'sentinel-finalize',
          ok: Boolean(chatReqToken),
          httpStatus: finRes.status,
          stepMs: Date.now() - finStart,
        });
      } else if (prepData?.token) {
        chatReqToken = prepData.token;
      }
    } else if (prepRes.status === 404 || prepRes.status === 405) {
      // Fallback to classic single-step sentinel/chat-requirements
      const classicRes = await fetchWithTimeout(
        `${CHATGPT_BASE}${apiPrefix}/sentinel/chat-requirements`,
        {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({ p: initProof }),
        },
        4000
      );
      if (classicRes.ok) {
        const classicData = await classicRes.json();
        chatReqToken = classicData?.token || '';
        if (classicData?.proofofwork?.required) {
          proofToken = solveSentinelPow(
            classicData.proofofwork.seed,
            classicData.proofofwork.difficulty,
            userAgent,
            home.buildNumber
          ).token;
        }
      }
      diagnostics.push({
        step: 'sentinel-classic',
        ok: Boolean(chatReqToken),
        httpStatus: classicRes.status,
        stepMs: Date.now() - step1Start,
      });
    } else {
      const rawErr = (await prepRes.text()).slice(0, 220);
      diagnostics.push({
        step: 'sentinel-prepare',
        ok: false,
        httpStatus: prepRes.status,
        cfMitigated,
        stepMs: Date.now() - step1Start,
        ...(isProbe ? { rawPreview: rawErr } : {}),
      });

      // Fail fast when Cloudflare / Sentinel blocks datacenter IP
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
        mode,
        buildNumber: home.buildNumber,
        latencyMs: Date.now() - startedAt,
        error: cfMitigated
          ? `Cloudflare Turnstile membatasi IP datacenter pada chatgpt.com (HTTP ${prepRes.status}, cf-mitigated: ${cfMitigated}). Beralih otomatis ke mirror aktif.`
          : `Sentinel chatgpt.com menolak sesi tanpa akun pada IP server (HTTP ${prepRes.status}). Beralih otomatis ke mirror aktif.`,
        diagnostics,
      });
    }

    if (!chatReqToken) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
        mode,
        buildNumber: home.buildNumber,
        latencyMs: Date.now() - startedAt,
        error: 'Token Sentinel chat-requirements tidak diterbitkan oleh chatgpt.com.',
        diagnostics,
      });
    }

    const hasNodataPersona = /nodatagpt/i.test(system);
    const finalPrompt = system.trim()
      ? `Konteks peran percakapan: Balas pesan pengguna berikut secara langsung, ramah, dan natural sepenuhnya dalam karakter sebagai NodataGPT, asisten AI cerdas yang dibuat dan dikembangkan oleh Mr.NODATA dalam ekosistem teknologi NODATA (${system.trim()}). Tetap di dalam karakter NodataGPT sejak kalimat pertama tanpa membahas instruksi peran ini.\n\nPesan pengguna:\n${cleanText}`
      : cleanText;

    const normalizeChatGptPersonaReply = (rawReply) => {
      if (!hasNodataPersona || !rawReply) return rawReply;
      return String(rawReply)
        .replace(
          /^[\s\S]*?(?:Namun,?\s+dalam\s+konteks\s+instruksi[^\n]*\n+)/i,
          ''
        )
        .replace(
          /(?:Saya|Aku)\s+adalah\s+\*{0,2}ChatGPT\*{0,2}[^.\n]*\.?/gi,
          'Saya adalah **NodataGPT**, asisten AI cerdas yang dibuat dan dikembangkan oleh **Mr.NODATA**.'
        )
        .replace(
          /-\s*\*{0,2}Pembuat\s+yang\s+diklaim\s+dalam\s+instruksi:?\*{0,2}/gi,
          '- **Pembuat / Pengembang:**'
        )
        .replace(
          /\n*-\s*\*{0,2}Teknologi\s+dasar:?\*{0,2}[^\n]*/gi,
          ''
        )
        .trim();
    };

    // Step 2: Acquire Conduit Token (/f/conversation/prepare)
    let conduitToken = '';
    const condStart = Date.now();
    try {
      const condRes = await fetchWithTimeout(
        `${CHATGPT_BASE}${apiPrefix}/f/conversation/prepare`,
        {
          method: 'POST',
          headers: {
            ...baseHeaders,
            'X-Conduit-Token': 'no-token',
          },
          body: JSON.stringify({
            action: 'next',
            fork_from_shared_post: false,
            parent_message_id: 'client-created-root',
            model: modelSlug,
            timezone_offset_min: -420,
            timezone: 'Asia/Jakarta',
            conversation_mode: { kind: 'primary_assistant' },
            system_hints: [],
            supports_buffering: true,
            supported_encodings: ['v1'],
          }),
        },
        4000
      );
      if (condRes.ok) {
        const condData = await condRes.json();
        conduitToken = condData?.conduit_token || condData?.token || '';
      }
      diagnostics.push({
        step: 'conduit-prepare',
        ok: Boolean(conduitToken),
        httpStatus: condRes.status,
        stepMs: Date.now() - condStart,
      });
    } catch {
      diagnostics.push({
        step: 'conduit-prepare',
        ok: false,
        stepMs: Date.now() - condStart,
      });
    }

    // Step 3: Stream /f/conversation (or fallback /conversation)
    const convStart = Date.now();
    const convPath = conduitToken
      ? `${apiPrefix}/f/conversation`
      : `${apiPrefix}/conversation`;

    const convHeaders = {
      ...baseHeaders,
      Accept: 'text/event-stream',
      'OpenAI-Sentinel-Chat-Requirements-Token': chatReqToken,
      ...(proofToken ? { 'OpenAI-Sentinel-Proof-Token': proofToken } : {}),
      ...(turnstileToken
        ? { 'OpenAI-Sentinel-Turnstile-Token': turnstileToken }
        : {}),
      ...(conduitToken ? { 'X-Conduit-Token': conduitToken } : {}),
    };

    const convBody = {
      action: 'next',
      messages: [
        {
          id: crypto.randomUUID(),
          author: { role: 'user' },
          create_time: Date.now() / 1000,
          content: {
            content_type: 'text',
            parts: [finalPrompt],
          },
          metadata: {
            selected_github_repos: [],
            selected_all_github_repos: false,
            serialization_metadata: { custom_symbol_offsets: [] },
          },
        },
      ],
      parent_message_id: 'client-created-root',
      model: modelSlug,
      timezone_offset_min: -420,
      timezone: 'Asia/Jakarta',
      history_and_training_disabled: true,
      conversation_mode: { kind: 'primary_assistant' },
      enable_message_followups: false,
      system_hints: [],
      supports_buffering: true,
      supported_encodings: ['v1'],
      client_contextual_info: {
        is_dark_mode: true,
        time_since_loaded: Math.floor(Math.random() * 25) + 8,
        page_height: 920,
        page_width: 1440,
        pixel_ratio: 2,
        screen_height: 1080,
        screen_width: 1920,
        app_name: 'chatgpt.com',
      },
      paragen_cot_summary_display_override: 'allow',
    };

    const convRes = await fetchWithTimeout(
      `${CHATGPT_BASE}${convPath}`,
      {
        method: 'POST',
        headers: convHeaders,
        body: JSON.stringify(convBody),
      },
      12000
    );

    const rawStream = await convRes.text();
    if (!convRes.ok) {
      diagnostics.push({
        step: 'conversation-stream',
        ok: false,
        httpStatus: convRes.status,
        stepMs: Date.now() - convStart,
        ...(isProbe ? { rawPreview: rawStream.slice(0, 240) } : {}),
      });
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
        mode,
        buildNumber: home.buildNumber,
        latencyMs: Date.now() - startedAt,
        error: `Endpoint percakapan chatgpt.com menolak permintaan (HTTP ${convRes.status}).`,
        diagnostics,
      });
    }

    const parsed = parseChatGptSseStream(rawStream);
    diagnostics.push({
      step: 'conversation-stream',
      ok: Boolean(parsed.text),
      httpStatus: convRes.status,
      sseEvents: parsed.eventCount,
      stepMs: Date.now() - convStart,
      ...(isProbe && !parsed.text ? { rawPreview: rawStream.slice(0, 260) } : {}),
    });

    if (!parsed.text) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
        mode,
        buildNumber: home.buildNumber,
        latencyMs: Date.now() - startedAt,
        error: 'Stream SSE chatgpt.com selesai tanpa teks jawaban.',
        diagnostics,
      });
    }

    return res.status(200).json({
      status: true,
      ok: true,
      provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
      mode,
      model: modelSlug,
      buildNumber: home.buildNumber,
      latencyMs: Date.now() - startedAt,
      ...(parsed.thoughts ? { thinking: parsed.thoughts } : {}),
      result: normalizeChatGptPersonaReply(parsed.text),
      ...(isProbe ? { diagnostics } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal menghubungi chatgpt.com.';
    return res.status(isProbe ? 200 : 502).json({
      status: false,
      ok: false,
      provider: 'OpenAI ChatGPT Direct Scraper (chatgpt.com)',
      mode,
      latencyMs: Date.now() - startedAt,
      error: message,
      diagnostics,
    });
  }
}
