import dns from 'node:dns';
import crypto from 'node:crypto';
import { enforceNodeApiSecurity } from '../lib/securityGate.js';

// Force IPv4-first DNS resolution on Vercel Node 24 to prevent IPv6 connect blackholes
dns.setDefaultResultOrder('ipv4first');

const QWEN_BASE = 'https://chat.qwen.ai';
const AUTH_QWEN_BASE = 'https://auth.qwen.ai';
const ALIBABA_WUM_URL = 'https://sg-wum.alibaba.com/w/wu.json';
const FALLBACK_UMID =
  'defaultFY2_load_failed with timeout@@https://chat.qwen.ai@@1000';

const QWEN_WEB_VERSION = '0.3.26';
const BAXIA_VERSION = '2.5.37';
const DEFAULT_QWEN_MODEL = 'qwen3.5-plus';

const CUSTOM_BASE64_CHARS =
  'DGi0YA7BemWnQjCl4+bR3f8SKIF9tUz/xhr2oEOgPpac=61ZqwTudLkM5vHyNXsVJ';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** @type {{ token: string, fetchedFromRemote: boolean, mintedAt: number } | null} */
let cachedUmidState = null;

/** @type {{ token: string, mode: string, mintedAt: number } | null} */
let cachedAuthState = null;

function randUint32() {
  return crypto.randomBytes(4).readUInt32BE(0);
}

function randomHex(len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

export function lzwCompressCustomBase64(uncompressed) {
  if (uncompressed == null) return '';
  let dictSize = 3;
  const dictionary = Object.create(null);
  const dictToCreate = Object.create(null);
  let w = '';
  let enlargeIn = 2;
  let numBits = 2;
  let value = 0;
  let position = 0;
  const result = [];
  const bits = 6;
  const charFunc = (idx) => CUSTOM_BASE64_CHARS[idx];

  for (let idx = 0; idx < uncompressed.length; idx++) {
    const c = uncompressed[idx];
    if (!(c in dictionary)) {
      dictionary[c] = dictSize++;
      dictToCreate[c] = true;
    }
    const wc = w + c;
    if (wc in dictionary) {
      w = wc;
    } else {
      if (w in dictToCreate) {
        let charCode = w.charCodeAt(0);
        if (charCode < 256) {
          for (let i = 0; i < numBits; i++) {
            value = value << 1;
            if (position === bits - 1) {
              position = 0;
              result.push(charFunc(value));
              value = 0;
            } else {
              position++;
            }
          }
          for (let i = 0; i < 8; i++) {
            value = (value << 1) | (charCode & 1);
            if (position === bits - 1) {
              position = 0;
              result.push(charFunc(value));
              value = 0;
            } else {
              position++;
            }
            charCode >>= 1;
          }
        } else {
          let flag = 1;
          for (let i = 0; i < numBits; i++) {
            value = (value << 1) | flag;
            if (position === bits - 1) {
              position = 0;
              result.push(charFunc(value));
              value = 0;
            } else {
              position++;
            }
            flag = 0;
          }
          for (let i = 0; i < 16; i++) {
            value = (value << 1) | (charCode & 1);
            if (position === bits - 1) {
              position = 0;
              result.push(charFunc(value));
              value = 0;
            } else {
              position++;
            }
            charCode >>= 1;
          }
        }
        enlargeIn--;
        if (enlargeIn === 0) {
          enlargeIn = 2 ** numBits;
          numBits++;
        }
        delete dictToCreate[w];
      } else {
        let charCode = dictionary[w];
        for (let i = 0; i < numBits; i++) {
          value = (value << 1) | (charCode & 1);
          if (position === bits - 1) {
            position = 0;
            result.push(charFunc(value));
            value = 0;
          } else {
            position++;
          }
          charCode >>= 1;
        }
      }
      enlargeIn--;
      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits;
        numBits++;
      }
      dictionary[wc] = dictSize++;
      w = c;
    }
  }

  if (w !== '') {
    if (w in dictToCreate) {
      let charCode = w.charCodeAt(0);
      if (charCode < 256) {
        for (let i = 0; i < numBits; i++) {
          value = value << 1;
          if (position === bits - 1) {
            position = 0;
            result.push(charFunc(value));
            value = 0;
          } else {
            position++;
          }
        }
        for (let i = 0; i < 8; i++) {
          value = (value << 1) | (charCode & 1);
          if (position === bits - 1) {
            position = 0;
            result.push(charFunc(value));
            value = 0;
          } else {
            position++;
          }
          charCode >>= 1;
        }
      } else {
        let flag = 1;
        for (let i = 0; i < numBits; i++) {
          value = (value << 1) | flag;
          if (position === bits - 1) {
            position = 0;
            result.push(charFunc(value));
            value = 0;
          } else {
            position++;
          }
          flag = 0;
        }
        for (let i = 0; i < 16; i++) {
          value = (value << 1) | (charCode & 1);
          if (position === bits - 1) {
            position = 0;
            result.push(charFunc(value));
            value = 0;
          } else {
            position++;
          }
          charCode >>= 1;
        }
      }
      enlargeIn--;
      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits;
        numBits++;
      }
      delete dictToCreate[w];
    } else {
      let charCode = dictionary[w];
      for (let i = 0; i < numBits; i++) {
        value = (value << 1) | (charCode & 1);
        if (position === bits - 1) {
          position = 0;
          result.push(charFunc(value));
          value = 0;
        } else {
          position++;
        }
        charCode >>= 1;
      }
    }
    enlargeIn--;
    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits++;
    }
  }

  let endMarker = 2;
  for (let i = 0; i < numBits; i++) {
    value = (value << 1) | (endMarker & 1);
    if (position === bits - 1) {
      position = 0;
      result.push(charFunc(value));
      value = 0;
    } else {
      position++;
    }
    endMarker >>= 1;
  }

  while (true) {
    value = value << 1;
    if (position === bits - 1) {
      result.push(charFunc(value));
      break;
    }
    position++;
  }

  return result.join('');
}

export function generateQwenSecurityArtifacts(userAgent = DEFAULT_USER_AGENT) {
  const nowMs = Date.now();
  const deviceId = randomHex(20);
  const pluginHash = randUint32();
  const canvasHash = randUint32();
  const uaHash1 = randUint32();
  const uaHash2 = randUint32();
  const urlHash = randUint32();
  const docHash = 20 + (randUint32() % 75);

  const fields = [
    deviceId,
    'websdk-2.3.15d',
    '1765348410850',
    '91',
    '1|15',
    'en-US',
    '-420',
    `16705151|${randUint32()}`,
    '1920|1080|283|1080|158|0|1920|1080|1920|922|0|0',
    '5',
    'MacIntel',
    '10',
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)|Google Inc. (Apple)',
    '30|30',
    '0',
    '28',
    `5|${pluginHash}`,
    String(canvasHash),
    String(uaHash1),
    '1',
    '0',
    '1',
    '0',
    'P',
    '0',
    '0',
    '0',
    '416',
    'Google Inc.',
    '8',
    '-1|0|0|0|0',
    String(uaHash2),
    '11',
    String(nowMs),
    String(urlHash),
    '0',
    String(docHash),
  ];

  const rawData1 = fields.join('^');
  const ssxmodItna = `1-${lzwCompressCustomBase64(rawData1)}`;

  const rawData2 = [
    fields[0],
    fields[1],
    fields[23],
    0,
    '',
    0,
    '',
    '',
    0,
    0,
    0,
    fields[32],
    fields[33],
    0,
    0,
    0,
    0,
    0,
  ].join('^');
  const ssxmodItna2 = `1-${lzwCompressCustomBase64(rawData2)}`;

  // Generate bx-ua ("231!" + AES-128-CBC(sha256(fp)[0:16], sha256(fp)[16:32]))
  const envPayload = {
    ua: userAgent,
    pl: 'MacIntel',
    lang: 'en-US',
    langs: ['en-US', 'id-ID', 'en'],
    hc: 10,
    dm: 8,
    mtp: 0,
    ce: true,
    sw: 1920,
    sh: 1080,
    aw: 1920,
    ah: 1040,
    cd: 24,
    pd: 24,
    dpr: 2,
    tzo: -420,
    tz: 'Asia/Jakarta',
    wd: false,
    glv: 'Google Inc. (Apple)',
    glr: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)',
     href: 'https://chat.qwen.ai/',
    host: 'chat.qwen.ai',
    ref: '',
  };
  const fp = crypto
    .createHash('sha256')
    .update(JSON.stringify(envPayload))
    .digest('hex')
    .slice(0, 32);
  const rnd = randomHex(16);
  const cs = crypto
    .createHash('sha256')
    .update(`${nowMs}:${fp}:${rnd}`)
    .digest('hex')
    .slice(0, 8);

  const bxBody = JSON.stringify({
    v: '231',
    ts: nowMs,
    fp,
    d: envPayload,
    rnd,
    seq: 1,
    cs,
  });
  const keyDigest = crypto.createHash('sha256').update(fp).digest();
  const cipher = crypto.createCipheriv(
    'aes-128-cbc',
    keyDigest.subarray(0, 16),
    keyDigest.subarray(16, 32)
  );
  const encrypted = Buffer.concat([
    cipher.update(bxBody, 'utf8'),
    cipher.final(),
  ]).toString('base64');

  return {
    bxUa: `231!${encrypted}`,
    cookieString: `ssxmod_itna=${ssxmodItna}; ssxmod_itna2=${ssxmodItna2}; qwen_age_verification=passed`,
  };
}

function formatQwenTimezoneHeader() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const jkt = new Date(Date.now() + 7 * 3600 * 1000);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${days[jkt.getUTCDay()]} ${months[jkt.getUTCMonth()]} ${pad2(
    jkt.getUTCDate()
  )} ${jkt.getUTCFullYear()} ${pad2(jkt.getUTCHours())}:${pad2(
    jkt.getUTCMinutes()
  )}:${pad2(jkt.getUTCSeconds())} GMT+0700`;
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

async function ensureBxUmidToken() {
  if (cachedUmidState && Date.now() - cachedUmidState.mintedAt < 10 * 60 * 1000) {
    return cachedUmidState;
  }

  try {
    const res = await fetchWithTimeout(
      ALIBABA_WUM_URL,
      {
        method: 'GET',
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Referer: `${QWEN_BASE}/`,
          Origin: QWEN_BASE,
        },
      },
      2600
    );
    if (res.ok) {
      const body = await res.text();
      const m = /(?:umx\.wu|__fycb)\('([^']+)'\)/.exec(body);
      if (m && m[1]) {
        cachedUmidState = {
          token: m[1],
          fetchedFromRemote: true,
          mintedAt: Date.now(),
        };
        return cachedUmidState;
      }
    }
  } catch {
    // Non-fatal: fall back to Qwen SDK timeout token
  }

  cachedUmidState = {
    token: FALLBACK_UMID,
    fetchedFromRemote: false,
    mintedAt: Date.now(),
  };
  return cachedUmidState;
}

async function resolveOptionalQwenBearerToken(securityCookies) {
  const directBearer = (process.env.QWEN_TOKEN || '').trim();
  if (directBearer) {
    return { token: directBearer, mode: 'bearer-token' };
  }

  if (cachedAuthState && Date.now() - cachedAuthState.mintedAt < 40 * 60 * 1000) {
    return cachedAuthState;
  }

  const rawCookie = (process.env.QWEN_COOKIE || '').trim();
  if (rawCookie) {
    try {
      const res = await fetchWithTimeout(
        `${AUTH_QWEN_BASE}/api/v2/auths/refresh`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': DEFAULT_USER_AGENT,
            Origin: QWEN_BASE,
            Referer: `${QWEN_BASE}/`,
            'x-request-origin': QWEN_BASE,
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            Cookie: `${rawCookie}; ${securityCookies}`,
          },
        },
        4000
      );
      if (res.ok) {
        const data = await res.json();
        const refreshed = data?.data?.access_token || data?.token || '';
        if (refreshed) {
          cachedAuthState = {
            token: refreshed,
            mode: 'cookie-refresh',
            mintedAt: Date.now(),
          };
          return cachedAuthState;
        }
      }
    } catch {
      // Ignore refresh failure
    }
  }

  const email = (process.env.QWEN_EMAIL || '').trim();
  const password = (process.env.QWEN_PASSWORD || '').trim();
  if (email && password) {
    try {
      const sha256Password = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
      const res = await fetchWithTimeout(
        `${QWEN_BASE}/api/v2/auths/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: QWEN_BASE,
            Referer: `${QWEN_BASE}/auth?action=signin`,
            'User-Agent': DEFAULT_USER_AGENT,
            Cookie: securityCookies,
          },
          body: JSON.stringify({ email, password: sha256Password }),
        },
        5000
      );
      if (res.ok) {
        const data = await res.json();
        const token = data?.token || data?.data?.token || '';
        if (token) {
          cachedAuthState = {
            token,
            mode: 'account-signin',
            mintedAt: Date.now(),
          };
          return cachedAuthState;
        }
      }
    } catch {
      // Ignore signin error
    }
  }

  return { token: '', mode: 'guest-keyless' };
}

export function parseQwenPhaseSse(rawBody) {
  const trimmed = String(rawBody || '').trim();

  // Detect Baxia anti-bot JSON returned with HTTP 200 instead of SSE
  if (trimmed.startsWith('{')) {
    try {
      const errObj = JSON.parse(trimmed);
      const retJoin = Array.isArray(errObj?.ret) ? errObj.ret.join(' ') : '';
      if (
        retJoin.includes('RGV587_ERROR') ||
        retJoin.includes('FAIL_SYS_USER_VALIDATE') ||
        errObj?.data?.url?.includes('punish')
      ) {
        return {
          text: '',
          thinking: '',
          imageUrl: '',
          baxiaBlocked: true,
          error: 'Alibaba Baxia WAF (RGV587_ERROR) membatasi IP datacenter pada chat.qwen.ai.',
        };
      }
      if (errObj?.success === false || errObj?.code) {
        return {
          text: '',
          thinking: '',
          imageUrl: '',
          baxiaBlocked: false,
          error: `${errObj.code || 'QwenError'}: ${errObj.details || errObj.message || 'Permintaan ditolak oleh chat.qwen.ai'}`,
        };
      }
    } catch {
      // Continue SSE parsing
    }
  }

  let answer = '';
  let thinking = '';
  let imageUrl = '';
  let eventCount = 0;

  for (const line of trimmed.split('\n')) {
    const cleanLine = line.trim();
    if (!cleanLine.startsWith('data:')) continue;
    const dataStr = cleanLine.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;

    try {
      const chunk = JSON.parse(dataStr);
      eventCount++;

      if (chunk?.error) {
        return {
          text: answer.trim(),
          thinking: thinking.trim(),
          imageUrl,
          baxiaBlocked: false,
          error: `${chunk.error.code || 'Error'}: ${chunk.error.details || ''}`,
        };
      }

      const choices = chunk?.choices;
      if (!Array.isArray(choices) || choices.length === 0) continue;
      const delta = choices[0]?.delta;
      if (!delta || typeof delta !== 'object') continue;

      const phase = delta.phase || 'answer';
      const content = typeof delta.content === 'string' ? delta.content : '';

      if (phase === 'thinking_summary' || phase === 'think') {
        if (content) thinking += content;
        const summaryArr = delta?.extra?.summary_thought?.content;
        if (Array.isArray(summaryArr) && summaryArr.length > 0) {
          thinking = summaryArr.join('\n');
        }
      } else if (phase === 'image_gen') {
        if (/^https?:\/\//i.test(content.trim())) {
          imageUrl = content.trim();
        }
      } else if (phase === 'answer') {
        if (content) answer += content;
      }
    } catch {
      // Ignore non-JSON lines
    }
  }

  return {
    text: answer.trim(),
    thinking: thinking.trim(),
    imageUrl,
    eventCount,
    baxiaBlocked: false,
    error: null,
  };
}

async function tryServerDashScopeKey(cleanText, system, startedAt) {
  const apiKey = (process.env.DASHSCOPE_API_KEY || '').trim();
  if (!apiKey) return null;

  const model = (process.env.DASHSCOPE_MODEL || 'qwen-plus').trim();
  const messages = [];
  if (system.trim()) {
    messages.push({ role: 'system', content: system.trim() });
  }
  messages.push({ role: 'user', content: cleanText });

  const res = await fetchWithTimeout(
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
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
    provider: `Alibaba DashScope Resmi (${model})`,
    mode: 'server-api-key',
    latencyMs: Date.now() - startedAt,
    result: answer,
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const isProbe = req.query?.probe === '1';

  const gateSec = enforceNodeApiSecurity(req, res, {
    routeName: 'qwen',
    mode: 'api',
    isDiagnostic: isProbe,
    maxBodyBytes: 98304,
    guestRatePerMin: 12,
    vipRatePerMin: 40,
  });
  if (!gateSec.allowed) return;

  let text = '';
  let system = '';
  let model = DEFAULT_QWEN_MODEL;
  let thinking = false;

  if (req.method === 'GET' && isProbe) {
    text =
      typeof req.query?.text === 'string'
        ? req.query.text
        : req.query?.q || req.query?.prompt || '';
    system = typeof req.query?.system === 'string' ? req.query.system : '';
    thinking = req.query?.thinking === '1' || req.query?.thinking === 'true';
    if (typeof req.query?.model === 'string' && req.query.model.trim()) {
      model = req.query.model.trim();
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
    thinking = Boolean(payload.thinking);
    if (typeof payload.model === 'string' && payload.model.trim()) {
      model = payload.model.trim();
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

  // Tier 1: Optional Server DASHSCOPE_API_KEY
  try {
    const official = await tryServerDashScopeKey(cleanText, system, startedAt);
    if (official) {
      return res.status(200).json(official);
    }
  } catch {
    // Fall through to Direct chat.qwen.ai Web Scraper
  }

  const diagnostics = [];
  const sec = generateQwenSecurityArtifacts(DEFAULT_USER_AGENT);
  const umidState = await ensureBxUmidToken();
  const auth = await resolveOptionalQwenBearerToken(sec.cookieString);
  const chatMode = auth.token ? 'normal' : 'guest';

  let sessionCookies = process.env.QWEN_COOKIE
    ? `${process.env.QWEN_COOKIE.trim()}; ${sec.cookieString}`
    : sec.cookieString;

  const absorbSetCookies = (headersObj) => {
    const rawList =
      typeof headersObj?.getSetCookie === 'function'
        ? headersObj.getSetCookie()
        : headersObj?.get('set-cookie')
          ? [headersObj.get('set-cookie')]
          : [];
    const map = new Map();
    for (const part of sessionCookies.split(';')) {
      const eq = part.indexOf('=');
      if (eq > 0) map.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
    }
    for (const raw of rawList) {
      const first = String(raw || '').split(';')[0]?.trim();
      const eq = first ? first.indexOf('=') : -1;
      if (eq > 0) map.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
    }
    sessionCookies = Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  };

  const buildQwenHeaders = (extra = {}) => {
    const headers = {
      Accept: 'application/json, text/event-stream, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7',
      'Content-Type': 'application/json',
      Origin: QWEN_BASE,
      Referer: `${QWEN_BASE}/`,
      'User-Agent': DEFAULT_USER_AGENT,
      'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      source: 'web',
      version: QWEN_WEB_VERSION,
      'bx-v': BAXIA_VERSION,
      'bx-umidtoken': umidState.token,
      'bx-ua': sec.bxUa,
      'X-Accel-Buffering': 'no',
      'X-Requested-With': 'XMLHttpRequest',
      'x-request-id': crypto.randomUUID(),
      timezone: formatQwenTimezoneHeader(),
      Cookie: sessionCookies,
      ...extra,
    };
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }
    return headers;
  };

  try {
    // Step 1: Create Qwen v2 Chat Session (/api/v2/chats/new)
    const nowMs = Date.now();
    const newChatStart = Date.now();
    const newChatPayload = {
      chatId: '',
      models: [model],
      project_id: '',
      timestamp: nowMs,
      chat_type: 't2t',
      chat_mode: chatMode,
    };

    const newChatRes = await fetchWithTimeout(
      `${QWEN_BASE}/api/v2/chats/new`,
      {
        method: 'POST',
        headers: buildQwenHeaders(),
        body: JSON.stringify(newChatPayload),
      },
      4500
    );

    absorbSetCookies(newChatRes.headers);
    const newChatRaw = await newChatRes.text();
    let conversationId = '';

    if (newChatRaw.trim().startsWith('<')) {
      diagnostics.push({
        step: 'chats-new',
        ok: false,
        httpStatus: newChatRes.status,
        wafHtml: true,
        stepMs: Date.now() - newChatStart,
      });
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
        mode: auth.mode,
        bxUmidRemote: umidState.fetchedFromRemote,
        latencyMs: Date.now() - startedAt,
        error: `WAF Alibaba memblokir pembuatan sesi pada chat.qwen.ai (HTTP ${newChatRes.status}). Beralih otomatis ke mirror aktif.`,
        diagnostics,
      });
    }

    let newChatJson = null;
    try {
      newChatJson = JSON.parse(newChatRaw);
    } catch {
      newChatJson = null;
    }

    const baxiaRet = Array.isArray(newChatJson?.ret)
      ? newChatJson.ret.join(' ')
      : '';
    if (
      baxiaRet.includes('RGV587_ERROR') ||
      baxiaRet.includes('FAIL_SYS_USER_VALIDATE')
    ) {
      diagnostics.push({
        step: 'chats-new',
        ok: false,
        httpStatus: newChatRes.status,
        baxiaBlocked: true,
        stepMs: Date.now() - newChatStart,
      });
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
        mode: auth.mode,
        bxUmidRemote: umidState.fetchedFromRemote,
        latencyMs: Date.now() - startedAt,
        error:
          'Alibaba Baxia (RGV587_ERROR) membatasi sesi tanpa akun dari IP datacenter. Beralih otomatis ke mirror Qwen aktif.',
        diagnostics,
      });
    }

    if (newChatRes.ok && newChatJson?.success && newChatJson?.data?.id) {
      conversationId = newChatJson.data.id;
      diagnostics.push({
        step: 'chats-new',
        ok: true,
        httpStatus: newChatRes.status,
        chatId: conversationId,
        stepMs: Date.now() - newChatStart,
      });
    } else {
      diagnostics.push({
        step: 'chats-new',
        ok: false,
        httpStatus: newChatRes.status,
        stepMs: Date.now() - newChatStart,
        ...(isProbe ? { rawPreview: newChatRaw.slice(0, 240) } : {}),
      });
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
        mode: auth.mode,
        bxUmidRemote: umidState.fetchedFromRemote,
        latencyMs: Date.now() - startedAt,
        error:
          newChatJson?.data?.details ||
          newChatJson?.message ||
          `chat.qwen.ai mewajibkan sesi terautentikasi pada IP ini (HTTP ${newChatRes.status}). Beralih otomatis ke mirror Qwen aktif.`,
        diagnostics,
      });
    }

    // Step 2: Stream Completion (/api/v2/chat/completions?chat_id=<id>)
    const compStart = Date.now();
    const nowSec = Math.floor(Date.now() / 1000);
    const finalPrompt = system.trim()
      ? `Konteks peran percakapan: Balas pesan pengguna berikut secara langsung dan natural dalam karakter sebagai NodataGPT, asisten AI cerdas yang dibuat dan dikembangkan oleh Mr.NODATA (${system.trim()}).\n\nPesan pengguna:\n${cleanText}`
      : cleanText;

    const compPayload = {
      stream: true,
      version: '2.1',
      incremental_output: true,
      chatId: conversationId,
      chat_id: conversationId,
      chat_mode: chatMode,
      model,
      parentId: '',
      parent_id: null,
      timestamp: nowSec,
      messages: [
        {
          id: null,
          fid: crypto.randomUUID(),
          parentId: null,
          parent_id: null,
          childrenIds: [crypto.randomUUID()],
          role: 'user',
          content: finalPrompt,
          user_action: 'chat',
          files: [],
          timestamp: nowSec,
          models: [model],
          model: '',
          chat_type: 't2t',
          sub_chat_type: 't2t',
          extra: { meta: { subChatType: 't2t' } },
          feature_config: {
            thinking_enabled: thinking,
            output_schema: 'phase',
            research_mode: 'normal',
            auto_thinking: thinking,
            thinking_mode: thinking ? 'Auto' : 'Fast',
            auto_search: false,
          },
        },
      ],
    };

    const compRes = await fetchWithTimeout(
      `${QWEN_BASE}/api/v2/chat/completions?chat_id=${encodeURIComponent(
        conversationId
      )}`,
      {
        method: 'POST',
        headers: buildQwenHeaders({
          Accept: 'text/event-stream, application/json',
        }),
        body: JSON.stringify(compPayload),
      },
      12000
    );

    const rawSse = await compRes.text();
    const parsed = parseQwenPhaseSse(rawSse);

    diagnostics.push({
      step: 'chat-completions',
      ok: Boolean(compRes.ok && parsed.text),
      httpStatus: compRes.status,
      sseEvents: parsed.eventCount ?? 0,
      baxiaBlocked: parsed.baxiaBlocked,
      stepMs: Date.now() - compStart,
      ...(isProbe && !parsed.text ? { rawPreview: rawSse.slice(0, 260) } : {}),
    });

    if (!compRes.ok || !parsed.text) {
      return res.status(isProbe ? 200 : 502).json({
        status: false,
        ok: false,
        provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
        mode: auth.mode,
        model,
        bxUmidRemote: umidState.fetchedFromRemote,
        latencyMs: Date.now() - startedAt,
        error:
          parsed.error ||
          `Endpoint completions chat.qwen.ai menolak permintaan (HTTP ${compRes.status}). Beralih otomatis ke mirror aktif.`,
        diagnostics,
      });
    }

    return res.status(200).json({
      status: true,
      ok: true,
      provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
      mode: auth.mode,
      model,
      bxUmidRemote: umidState.fetchedFromRemote,
      latencyMs: Date.now() - startedAt,
      ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
      result: parsed.text,
      ...(isProbe ? { diagnostics } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal menghubungi chat.qwen.ai.';
    return res.status(isProbe ? 200 : 502).json({
      status: false,
      ok: false,
      provider: 'Alibaba Qwen Direct Scraper (chat.qwen.ai)',
      mode: auth.mode,
      bxUmidRemote: umidState.fetchedFromRemote,
      latencyMs: Date.now() - startedAt,
      error: message,
      diagnostics,
    });
  }
}
