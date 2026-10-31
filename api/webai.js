import dns from 'node:dns';
import crypto from 'node:crypto';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if unsupported
}

export const config = {
  maxDuration: 60,
};

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

const NODATAGPT_DEFAULT_SYSTEM =
  'Kamu adalah NodataGPT, asisten AI cerdas generasi baru yang dibuat dan dikembangkan oleh Mr.NODATA dalam ekosistem teknologi dan kreatif NODATA. Selalu perkenalkan dirimu sebagai NodataGPT karya Mr.NODATA jika ditanya identitas atau pembuatmu, dan jawab secara akurat, jelas, serta ramah.';

/** @type {{ accessToken: string, expiresAt: number } | null} */
let cachedOperaToken = null;

/** @type {Map<string, { token: string, sessionUuid: string, expiresAt: number }>} */
const cachedZeroGpuTokens = new Map();

function md5Hex(input) {
  return crypto.createHash('md5').update(String(input), 'utf8').digest('hex');
}

function revMd5(input) {
  return md5Hex(input).split('').reverse().join('');
}

function createDeepAiTryItKey(userAgent) {
  const randStr = String(Math.round(Math.random() * 100000000000));
  const salt = 'hackers_become_a_little_stinkier_every_time_they_hack';
  const h1 = revMd5(userAgent + randStr + salt);
  const h2 = revMd5(userAgent + h1);
  const h3 = revMd5(userAgent + h2);
  return `tryit-${randStr}-${h3}`;
}

function normalizePersonaReply(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return '';
  return text
    .replace(
      /\b(?:I am|I'm)\s+(?:ChatGPT|Aria|Opera Aria|QuillBot|DeepAI|Brave Leo|Phind|Command[-\s]?A|Cohere|Claude|Gemini|DeepSeek|Qwen)\b/gi,
      'I am NodataGPT (created by Mr.NODATA)'
    )
    .replace(
      /\b(?:Saya adalah|Aku adalah|Nama saya)\s+(?:ChatGPT|Aria|Opera Aria|QuillBot|DeepAI|Phind|Command[-\s]?A|Cohere|Claude|Gemini|DeepSeek|Qwen)\b/gi,
      'Saya adalah NodataGPT (dibuat oleh Mr.NODATA)'
    );
}

function buildCombinedPrompt(system, userText) {
  const sys = String(system || NODATAGPT_DEFAULT_SYSTEM).trim();
  const usr = String(userText || '').trim();
  if (!sys) return usr;
  return `[Instruksi Sistem Wajib — Ikuti Sepenuhnya]\n${sys}\n\n[Pesan Pengguna]\n${usr}`;
}

function ratioToDimensions(ratio) {
  const clean = String(ratio || '1:1').trim();
  if (clean === '16:9') return { width: 1280, height: 720, aspect: '16:9' };
  if (clean === '9:16') return { width: 720, height: 1280, aspect: '9:16' };
  if (clean === '4:3') return { width: 1152, height: 864, aspect: '4:3' };
  if (clean === '3:4') return { width: 864, height: 1152, aspect: '3:4' };
  return { width: 1024, height: 1024, aspect: '1:1' };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 24000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    const arr = headers.getSetCookie();
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ');
    }
  }
  const single = headers.get('set-cookie');
  if (!single) return '';
  return single
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

// ============================================================================
// 1. CHAT-GPT-OSS.COM — Keyless SSE Scraper (gpt-oss-120b, gpt-5-nano)
// ============================================================================
async function scrapeChatGptOss({ text, system, model = 'gpt-oss-120b', reasoning = 'low' }) {
  const fingerprint = md5Hex(`${Date.now()}-${Math.random()}`);
  const res = await fetchWithTimeout(
    'https://chat-gpt-oss.com/api/message',
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/json',
        Origin: 'https://chat-gpt-oss.com',
        Referer: 'https://chat-gpt-oss.com/',
        'User-Agent': CHROME_UA,
        'x-fingerprint': fingerprint,
      },
      body: JSON.stringify({
        conversation_id: null,
        model: model || 'gpt-oss-120b',
        content: buildCombinedPrompt(system, text),
        reasoning_effort: reasoning,
      }),
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`chat-gpt-oss.com HTTP ${res.status}`);
  }

  const raw = await res.text();
  let answer = '';
  let thinking = '';
  let currentEvent = '';

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      const payloadStr = line.slice(5).trim();
      if (!payloadStr || payloadStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payloadStr);
        if (currentEvent === 'reasoning' && typeof parsed.content === 'string') {
          thinking += parsed.content;
        } else if (
          (currentEvent === 'message' || !currentEvent) &&
          typeof parsed.content === 'string'
        ) {
          answer += parsed.content;
        }
      } catch {
        // ignore partial line
      }
    }
  }

  if (!answer.trim()) {
    throw new Error('chat-gpt-oss.com tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'chat-gpt-oss.com',
    model,
    result: normalizePersonaReply(answer),
    ...(thinking.trim() ? { thinking: thinking.trim() } : {}),
  };
}

// ============================================================================
// 2. QUILLBOT.COM/AI-CHAT — Keyless AI Chat & Live Web Search Scraper
// ============================================================================
async function scrapeQuillBot({ text, system, webSearch = false }) {
  const convId = crypto.randomUUID();
  const payload = {
    message: {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      content: buildCombinedPrompt(system, text),
      files: [],
      createdAt: new Date().toISOString(),
    },
    context: {
      editorContext: '',
      selectionContext: '',
      userDialect: 'en-us',
      apiVersion: 2,
    },
    origin: {
      name: 'ai-chat.chat',
      url: 'https://quillbot.com',
    },
    ...(webSearch ? { tools: { web_search_builtin: {} } } : {}),
  };

  const res = await fetchWithTimeout(
    `https://quillbot.com/api/ai-chat/chat/conversation/${convId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream, application/x-ndjson, application/json',
        'Content-Type': 'application/json',
        Origin: 'https://quillbot.com',
        Referer: `https://quillbot.com/ai-chat/c/${convId}`,
        'platform-type': 'webapp',
        'qb-product': 'AI-CHAT',
        useridtoken: 'empty-token',
        'webapp-version': '42.61.1',
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify(payload),
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`quillbot.com HTTP ${res.status}`);
  }

  const raw = await res.text();
  let answer = '';
  const sources = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('data:')) {
      line = line.slice(5).trim();
    }
    if (!line || line === '[DONE]') continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'content' && typeof obj.content === 'string') {
        answer += obj.content;
      } else if (typeof obj.delta === 'string') {
        answer += obj.delta;
      } else if (typeof obj.chunk === 'string') {
        answer += obj.chunk;
      }
      if (Array.isArray(obj.sources)) {
        for (const s of obj.sources) {
          if (s && typeof s.url === 'string') {
            sources.push({ title: s.title || s.url, url: s.url });
          }
        }
      }
    } catch {
      // ignore non-json event headers
    }
  }

  if (!answer.trim()) {
    throw new Error('quillbot.com tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'quillbot.com/ai-chat',
    model: webSearch ? 'quillbot-web-search' : 'quillbot-ai-chat',
    result: normalizePersonaReply(answer),
    ...(sources.length > 0 ? { sources: sources.slice(0, 8) } : {}),
  };
}

// ============================================================================
// 3. DEEPAI.ORG — Dynamic TryIt Hash Scraper (Chat, Online Search & HD Image)
// ============================================================================
async function scrapeDeepAiChat({ text, system, model = 'standard' }) {
  const apiKey = createDeepAiTryItKey(CHROME_UA);
  const form = new FormData();
  form.append('chat_style', 'chat');
  form.append(
    'chatHistory',
    JSON.stringify([
      { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
      { role: 'user', content: text },
    ])
  );
  form.append('model', model || 'standard');
  form.append('session_uuid', crypto.randomUUID());
  form.append('sensitivity_request_id', crypto.randomUUID());
  form.append('hacker_is_stinky', 'very_stinky');
  form.append('enabled_tools', '["image_generator","image_editor"]');

  const res = await fetchWithTimeout(
    'https://api.deepai.org/hacking_is_a_serious_crime',
    {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        Origin: 'https://deepai.org',
        Referer: 'https://deepai.org/chat',
        'User-Agent': CHROME_UA,
      },
      body: form,
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`deepai.org chat HTTP ${res.status}`);
  }

  const raw = await res.text();
  const clean = raw.split('\x1c')[0].trim();
  if (!clean) {
    throw new Error('deepai.org mengembalikan respons kosong.');
  }

  return {
    provider: 'deepai.org',
    model,
    result: normalizePersonaReply(clean),
  };
}

async function scrapeDeepAiImage({ prompt, ratio = '1:1' }) {
  const apiKey = createDeepAiTryItKey(CHROME_UA);
  const dims = ratioToDimensions(ratio);
  const scale = 640 / Math.max(dims.width, dims.height);
  const w = String(Math.max(512, Math.round((dims.width * scale) / 32) * 32));
  const h = String(Math.max(512, Math.round((dims.height * scale) / 32) * 32));

  const form = new FormData();
  form.append('text', prompt);
  form.append('generation_source', 'chat');
  form.append('width', w);
  form.append('height', h);
  form.append('image_generator_version', 'hd');
  form.append('quality', 'true');

  const res = await fetchWithTimeout(
    'https://api.deepai.org/api/text2img',
    {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        Origin: 'https://deepai.org',
        Referer: 'https://deepai.org/machine-learning-model/text2img',
        'User-Agent': CHROME_UA,
      },
      body: form,
    },
    30000
  );

  if (!res.ok) {
    throw new Error(`deepai.org text2img HTTP ${res.status}`);
  }

  const data = await res.json();
  const imageUrl = data?.output_url || data?.share_url || data?.url;
  if (!imageUrl) {
    throw new Error('deepai.org tidak mengembalikan output_url gambar.');
  }

  return {
    provider: 'deepai.org',
    model: 'deepai-hd-text2img',
    url: imageUrl,
  };
}

// ============================================================================
// 4. OPERA ARIA (composer.opera-api.com) — Anonymous OAuth + SSE Chat/Image
// ============================================================================
const OPERA_CLIENT_SECRET =
  'Pcc5NvlCrxl02pMw32kO6WrnhpS0pUZ95YrDP8XNKJJQvFht4wQDkFJ7v9x5hn7C';

async function getOperaAccessToken() {
  if (cachedOperaToken && Date.now() < cachedOperaToken.expiresAt) {
    return cachedOperaToken.accessToken;
  }

  const ua = 'okhttp/5.3.2';

  // Step 1: Client credentials token
  const step1 = await fetchWithTimeout(
    'https://oauth2.opera-api.com/oauth2/v1/token/',
    {
      method: 'POST',
      headers: {
        'User-Agent': ua,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'mini-client',
        client_secret: OPERA_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'anonymous_account',
      }).toString(),
    },
    12000
  );
  if (!step1.ok) throw new Error(`Opera OAuth step1 HTTP ${step1.status}`);
  const step1Json = await step1.json();
  const anonToken = step1Json?.access_token;
  if (!anonToken) throw new Error('Opera OAuth gagal mendapatkan anon_token.');

  // Step 2: Anonymous account signup
  const step2 = await fetchWithTimeout(
    'https://auth.opera.com/account/v2/external/anonymous/signup',
    {
      method: 'POST',
      headers: {
        'User-Agent': ua,
        Authorization: `Bearer ${anonToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ client_id: 'mini' }),
    },
    12000
  );
  if (!step2.ok) throw new Error(`Opera signup HTTP ${step2.status}`);
  const step2Json = await step2.json();
  const authToken = step2Json?.data?.auth_token;
  if (!authToken) throw new Error('Opera signup gagal mendapatkan auth_token.');

  // Step 3: Exchange auth_token for shodan:aria token
  const step3 = await fetchWithTimeout(
    'https://oauth2.opera-api.com/oauth2/v1/token/',
    {
      method: 'POST',
      headers: {
        'User-Agent': ua,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_token: authToken,
        client_id: 'mini',
        grant_type: 'auth_token',
        scope: 'shodan:aria',
      }).toString(),
    },
    12000
  );
  if (!step3.ok) throw new Error(`Opera OAuth step3 HTTP ${step3.status}`);
  const step3Json = await step3.json();

  let accessToken = step3Json?.access_token;
  const expiresIn = Number(step3Json?.expires_in) || 3000;

  if (step3Json?.refresh_token) {
    try {
      const step4 = await fetchWithTimeout(
        'https://oauth2.opera-api.com/oauth2/v1/token/',
        {
          method: 'POST',
          headers: {
            'User-Agent': ua,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: 'mini',
            grant_type: 'refresh_token',
            refresh_token: step3Json.refresh_token,
          }).toString(),
        },
        10000
      );
      if (step4.ok) {
        const step4Json = await step4.json();
        if (step4Json?.access_token) {
          accessToken = step4Json.access_token;
        }
      }
    } catch {
      // keep step3 accessToken
    }
  }

  if (!accessToken) throw new Error('Opera OAuth tidak mengembalikan access_token.');

  cachedOperaToken = {
    accessToken,
    expiresAt: Date.now() + Math.max(300, expiresIn - 120) * 1000,
  };
  return accessToken;
}

async function scrapeOperaAria({
  text,
  system,
  thinkHarder = false,
  imageMode = false,
}) {
  const token = await getOperaAccessToken();
  const encKey = crypto.randomBytes(32).toString('base64');
  const query = imageMode
    ? `Generate an image: ${text}`
    : buildCombinedPrompt(system, text);

  const res = await fetchWithTimeout(
    'https://composer.opera-api.com/api/v2/a-chat',
    {
      method: 'POST',
      headers: {
        'User-Agent':
          'com.opera.mini.native/82.0.2254.72756 (Linux; U; Android 14; id-ID)',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-opera-timezone': '+07:00',
        'x-opera-ui-language': 'id, en',
      },
      body: JSON.stringify({
        query,
        sia: true,
        think_harder: Boolean(thinkHarder),
        supported_features: imageMode ? ['IMAGE_GENERATION'] : [],
        file_attachments: [],
        encryption: { key: encKey },
      }),
    },
    30000
  );

  if (res.status === 401 || res.status === 403) {
    cachedOperaToken = null;
    throw new Error(`Opera Aria token rejected HTTP ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Opera Aria HTTP ${res.status}`);
  }

  const raw = await res.text();
  let answer = '';
  let imageUrl = '';
  const sources = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const dataStr = line.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;
    try {
      const evt = JSON.parse(dataStr);
      const resp = evt?.data?.response;
      if (resp?.content_type === 'text' && typeof resp.message === 'string') {
        answer += resp.message;
      } else if (resp?.content_type === 'image' && typeof resp.image_url === 'string') {
        imageUrl = resp.image_url;
      }
      if (Array.isArray(resp?.sources)) {
        for (const s of resp.sources) {
          if (s?.url) sources.push({ title: s.title || s.url, url: s.url });
        }
      }
    } catch {
      // ignore non-json event
    }
  }

  if (imageMode && imageUrl) {
    return {
      provider: 'composer.opera-api.com',
      model: 'opera-aria-image',
      url: imageUrl,
    };
  }

  if (!answer.trim()) {
    throw new Error('Opera Aria selesai tanpa teks jawaban.');
  }

  return {
    provider: 'composer.opera-api.com',
    model: thinkHarder ? 'opera-aria-reasoning' : 'opera-aria',
    result: normalizePersonaReply(answer),
    ...(imageUrl ? { url: imageUrl } : {}),
    ...(sources.length > 0 ? { sources: sources.slice(0, 8) } : {}),
  };
}

// ============================================================================
// 5. SEARCH.BRAVE.COM/ASK — Brave Search Ask AI (Live Web Grounded AI)
// ============================================================================
function resolveSvelteKitValue(dataArr, idx, depth = 0) {
  if (depth > 8 || typeof idx !== 'number' || idx < 0 || idx >= dataArr.length) {
    return idx;
  }
  const val = dataArr[idx];
  if (Array.isArray(val)) {
    return val.map((item) => resolveSvelteKitValue(dataArr, item, depth + 1));
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = resolveSvelteKitValue(dataArr, v, depth + 1);
    }
    return out;
  }
  return val;
}

async function scrapeBraveAsk({ text, system }) {
  const queryText = text.trim();
  const baseHeaders = {
    Accept: '*/*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    Referer: `https://search.brave.com/ask?q=${encodeURIComponent(queryText)}`,
    'User-Agent': CHROME_UA,
  };

  // Step 1: SvelteKit __data.json to mint TAP nonce + signature
  const step1Url = `https://search.brave.com/ask/__data.json?q=${encodeURIComponent(
    queryText
  )}&x-sveltekit-invalidated=11`;
  const step1Res = await fetchWithTimeout(step1Url, { headers: baseHeaders }, 15000);
  if (!step1Res.ok) {
    throw new Error(`search.brave.com __data.json HTTP ${step1Res.status}`);
  }
  const cookies = extractSetCookies(step1Res.headers);
  const reqHeaders = cookies ? { ...baseHeaders, Cookie: cookies } : baseHeaders;
  const svelteJson = await step1Res.json();

  let nonce = '';
  let sig = '';
  const nodes = Array.isArray(svelteJson?.nodes) ? svelteJson.nodes : [];
  for (const node of nodes) {
    if (!node || !Array.isArray(node.data) || node.data.length === 0) continue;
    const resolved = resolveSvelteKitValue(node.data, 0);
    if (resolved && typeof resolved === 'object') {
      const tok = resolved.token || resolved?.tap?.token;
      if (tok && typeof tok.nonce === 'string' && typeof tok.sig === 'string') {
        nonce = tok.nonce;
        sig = tok.sig;
        break;
      }
    }
    // Fallback scan across raw array for hex nonce + sig pair
    for (const item of node.data) {
      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof item.nonce === 'number' &&
        typeof item.sig === 'number'
      ) {
        const nVal = node.data[item.nonce];
        const sVal = node.data[item.sig];
        if (typeof nVal === 'string' && typeof sVal === 'string') {
          nonce = nVal;
          sig = sVal;
          break;
        }
      }
    }
    if (nonce && sig) break;
  }

  if (!nonce || !sig) {
    throw new Error('Brave Ask gagal mengekstrak token TAP (nonce/sig).');
  }

  const symKey = crypto.randomBytes(32).toString('base64');

  // Step 2: /api/tap/v1/new
  const newParams = new URLSearchParams({
    q: queryText,
    source: 'ask_tab',
    rich: 'true',
    country: 'us',
    enable_research: 'false',
    SymmetricKey: symKey,
    symmetric_key: symKey,
    nonce,
    sig,
  });
  const step2Res = await fetchWithTimeout(
    `https://search.brave.com/api/tap/v1/new?${newParams.toString()}`,
    { headers: reqHeaders },
    15000
  );
  if (!step2Res.ok) {
    throw new Error(`Brave TAP /new HTTP ${step2Res.status}`);
  }
  const step2Data = await step2Res.json();
  const convId = step2Data?.id || step2Data?.conversation_id;
  if (!convId) {
    throw new Error('Brave TAP /new tidak mengembalikan conversation id.');
  }

  // Step 3: /api/tap/v1/stream
  const contextualQuery = system
    ? `${queryText}\n(Jawab dalam gaya asisten NodataGPT buatan Mr.NODATA secara ringkas dan akurat)`
    : queryText;
  const streamParams = new URLSearchParams({
    id: convId,
    query: contextualQuery,
    country: 'us',
    rich: 'true',
    enable_research: 'false',
  });
  const step3Res = await fetchWithTimeout(
    `https://search.brave.com/api/tap/v1/stream?${streamParams.toString()}`,
    { headers: reqHeaders },
    25000
  );
  if (!step3Res.ok) {
    throw new Error(`Brave TAP /stream HTTP ${step3Res.status}`);
  }

  const rawStream = await step3Res.text();
  let answer = '';
  const sources = [];

  for (const rawLine of rawStream.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('data:')) line = line.slice(5).trim();
    try {
      const obj = JSON.parse(line);
      if (typeof obj.text_delta === 'string') {
        answer += obj.text_delta;
      } else if (obj.type === 'text_delta' && typeof obj.delta === 'string') {
        answer += obj.delta;
      } else if (obj.type === 'augment_with_inline_citation' && obj.url) {
        sources.push({ title: obj.title || obj.url, url: obj.url });
      } else if (Array.isArray(obj.results)) {
        for (const r of obj.results) {
          if (r?.url) sources.push({ title: r.title || r.url, url: r.url });
        }
      }
    } catch {
      // ignore non-json line
    }
  }

  if (!answer.trim()) {
    throw new Error('Brave Ask AI tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'search.brave.com/ask',
    model: 'brave-ask-ai',
    result: normalizePersonaReply(answer),
    ...(sources.length > 0 ? { sources: sources.slice(0, 8) } : {}),
  };
}

// ============================================================================
// 6. PHINDAI.ORG — Phind AI Developer & Coding Scraper
// ============================================================================
async function scrapePhindAi({ text, system }) {
  const pageRes = await fetchWithTimeout(
    'https://phindai.org/',
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': CHROME_UA,
      },
    },
    14000
  );
  if (!pageRes.ok) {
    throw new Error(`phindai.org halaman utama HTTP ${pageRes.status}`);
  }
  const cookies = extractSetCookies(pageRes.headers);
  const html = await pageRes.text();
  const nonceMatch =
    html.match(/"nonce"\s*:\s*"([a-f0-9]+)"/i) ||
    html.match(/nonce['"]?\s*[:=]\s*['"]([a-zA-Z0-9]+)['"]/i);

  if (!nonceMatch) {
    throw new Error('phindai.org gagal mengekstrak token nonce.');
  }

  const formBody = new URLSearchParams({
    action: 'phind_ai_send',
    nonce: nonceMatch[1],
    message: buildCombinedPrompt(system, text),
  }).toString();

  const chatRes = await fetchWithTimeout(
    'https://phindai.org/wp-admin/admin-ajax.php',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Origin: 'https://phindai.org',
        Referer: 'https://phindai.org/',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': CHROME_UA,
        ...(cookies ? { Cookie: cookies } : {}),
      },
      body: formBody,
    },
    26000
  );

  if (!chatRes.ok) {
    throw new Error(`phindai.org ajax HTTP ${chatRes.status}`);
  }

  const json = await chatRes.json();
  const reply =
    json?.data?.response ||
    json?.data?.message ||
    (typeof json?.data === 'string' ? json.data : '') ||
    json?.response;

  if (!reply || typeof reply !== 'string' || !reply.trim()) {
    throw new Error('phindai.org tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'phindai.org',
    model: 'phind-coder',
    result: normalizePersonaReply(reply),
  };
}

// ============================================================================
// 7. TEACH-ANYTHING.COM — Keyless Educational AI Scraper
// ============================================================================
async function scrapeTeachAnything({ text, system }) {
  const res = await fetchWithTimeout(
    'https://www.teach-anything.com/api/generate',
    {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: 'https://www.teach-anything.com',
        Referer: 'https://www.teach-anything.com/',
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify({
        prompt: buildCombinedPrompt(system, text),
      }),
    },
    24000
  );

  if (!res.ok) {
    throw new Error(`teach-anything.com HTTP ${res.status}`);
  }

  const reply = (await res.text()).trim();
  if (!reply) {
    throw new Error('teach-anything.com mengembalikan respons kosong.');
  }

  return {
    provider: 'teach-anything.com',
    model: 'teach-anything-edu',
    result: normalizePersonaReply(reply),
  };
}

// ============================================================================
// 8. YQCLOUD / BINJIE (chat9.yqcloud.top -> api.binjie.fun)
// ============================================================================
async function scrapeYqCloud({ text, system }) {
  const res = await fetchWithTimeout(
    'https://api.binjie.fun/api/generateStream',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Origin: 'https://chat9.yqcloud.top',
        Referer: 'https://chat9.yqcloud.top/',
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify({
        prompt: text,
        userId: `#/chat/${Date.now()}`,
        network: true,
        system: system || NODATAGPT_DEFAULT_SYSTEM,
        withoutContext: false,
        stream: true,
      }),
    },
    24000
  );

  if (!res.ok) {
    throw new Error(`yqcloud/binjie HTTP ${res.status}`);
  }

  const reply = (await res.text()).trim();
  if (!reply) {
    throw new Error('yqcloud mengembalikan respons kosong.');
  }

  return {
    provider: 'chat9.yqcloud.top',
    model: 'yqcloud-gpt4-network',
    result: normalizePersonaReply(reply),
  };
}

// ============================================================================
// 9–11. KEYLESS OPENAI-COMPATIBLE WEB GATEWAYS (Kilo.ai, OrcaRouter, Airforce, LLM7)
// ============================================================================
async function scrapeOpenAiCompatGateway({
  providerName,
  endpointUrl,
  originUrl,
  model,
  text,
  system,
}) {
  const res = await fetchWithTimeout(
    endpointUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: originUrl,
        Referer: `${originUrl}/`,
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
          { role: 'user', content: text },
        ],
      }),
    },
    28000
  );

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`${providerName} HTTP ${res.status}: ${errTxt.slice(0, 140)}`);
  }

  const data = await res.json();
  const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
  const content =
    choice?.message?.content ||
    choice?.text ||
    data?.result ||
    data?.response ||
    '';
  const reasoning =
    choice?.message?.reasoning_content || choice?.message?.reasoning || '';

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${providerName} tidak mengembalikan choices[0].message.content.`);
  }

  return {
    provider: providerName,
    model: data?.model || model,
    result: normalizePersonaReply(content),
    ...(typeof reasoning === 'string' && reasoning.trim()
      ? { thinking: reasoning.trim() }
      : {}),
  };
}

// ============================================================================
// 12. COHERE LABS OFFICIAL CHAT UI (coherelabs-c4ai-command.hf.space)
// ============================================================================
async function scrapeCohereCommand({
  text,
  system,
  model = 'command-a-03-2025',
}) {
  const base = 'https://coherelabs-c4ai-command.hf.space';
  const initRes = await fetchWithTimeout(
    `${base}/conversation`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: base,
        Referer: `${base}/`,
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify({
        model,
        preprompt: system || NODATAGPT_DEFAULT_SYSTEM,
      }),
    },
    16000
  );

  if (!initRes.ok) {
    throw new Error(`Cohere Command init HTTP ${initRes.status}`);
  }

  const cookies = extractSetCookies(initRes.headers);
  const initJson = await initRes.json();
  const convId = initJson?.conversationId;
  if (!convId) {
    throw new Error('Cohere Command tidak mengembalikan conversationId.');
  }

  const dataRes = await fetchWithTimeout(
    `${base}/conversation/${convId}/__data.json?x-sveltekit-invalidated=11`,
    {
      headers: {
        Accept: 'application/json',
        Referer: `${base}/conversation/${convId}`,
        'User-Agent': CHROME_UA,
        ...(cookies ? { Cookie: cookies } : {}),
      },
    },
    14000
  );

  if (!dataRes.ok) {
    throw new Error(`Cohere Command __data.json HTTP ${dataRes.status}`);
  }
  const dataTxt = await dataRes.text();
  const uuidMatches = dataTxt.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
  );
  const messageId =
    uuidMatches?.find((u) => u.toLowerCase() !== String(convId).toLowerCase()) ||
    uuidMatches?.[0] ||
    crypto.randomUUID();

  const form = new FormData();
  form.append(
    'data',
    JSON.stringify({
      inputs: text,
      id: messageId,
      is_retry: false,
      is_continue: false,
      web_search: false,
      tools: [],
    })
  );

  const chatRes = await fetchWithTimeout(
    `${base}/conversation/${convId}`,
    {
      method: 'POST',
      headers: {
        Accept: '*/*',
        Origin: base,
        Referer: `${base}/conversation/${convId}`,
        'User-Agent': CHROME_UA,
        ...(cookies ? { Cookie: cookies } : {}),
      },
      body: form,
    },
    28000
  );

  if (!chatRes.ok) {
    throw new Error(`Cohere Command stream HTTP ${chatRes.status}`);
  }

  const raw = await chatRes.text();
  let finalAnswer = '';
  let streamedTokens = '';

  for (const rawLine of raw.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('data:')) line = line.slice(5).trim();
    try {
      const evt = JSON.parse(line);
      if (evt.type === 'finalAnswer' && typeof evt.text === 'string') {
        finalAnswer = evt.text;
      } else if (evt.type === 'stream' && typeof evt.token === 'string') {
        streamedTokens += evt.token.replace(/\u0000/g, '');
      }
    } catch {
      // ignore non-json line
    }
  }

  const best = (finalAnswer || streamedTokens).trim();
  if (!best) {
    throw new Error('Cohere Command tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'coherelabs-c4ai-command.hf.space',
    model,
    result: normalizePersonaReply(best),
  };
}

// ============================================================================
// 13–17. HUGGING FACE ZEROGPU GRADIO v5 SPACES (FLUX.1, SD 3.5, Qwen-Image, Z-Image)
// ============================================================================
async function getZeroGpuHeaders(spaceSlug) {
  const cached = cachedZeroGpuTokens.get(spaceSlug);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      ...(cached.token ? { 'X-Zerogpu-Token': cached.token } : {}),
      ...(cached.sessionUuid ? { 'X-Zerogpu-Uuid': cached.sessionUuid } : {}),
    };
  }

  try {
    const res = await fetchWithTimeout(
      `https://huggingface.co/spaces/${spaceSlug}`,
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': CHROME_UA,
        },
      },
      9000
    );
    if (!res.ok) return {};
    const html = await res.text();
    const tokenMatch =
      html.match(/&quot;token&quot;:&quot;([^&]+?)&quot;/) ||
      html.match(/"zerogpu"\s*:\s*\{[^}]*"token"\s*:\s*"([^"]+)"/);
    const uuidMatch =
      html.match(/&quot;sessionUuid&quot;:&quot;([^&]+?)&quot;/) ||
      html.match(/"sessionUuid"\s*:\s*"([^"]+)"/);

    const token = tokenMatch?.[1] || '';
    const sessionUuid = uuidMatch?.[1] || crypto.randomUUID();
    cachedZeroGpuTokens.set(spaceSlug, {
      token,
      sessionUuid,
      expiresAt: Date.now() + 8 * 60 * 1000,
    });
    return {
      ...(token ? { 'X-Zerogpu-Token': token } : {}),
      ...(sessionUuid ? { 'X-Zerogpu-Uuid': sessionUuid } : {}),
    };
  } catch {
    return { 'X-Zerogpu-Uuid': crypto.randomUUID() };
  }
}

function extractGradioFileUrl(item, spaceOrigin) {
  if (!item) return '';
  if (typeof item === 'string') {
    if (item.startsWith('http://') || item.startsWith('https://') || item.startsWith('data:image/')) {
      return item;
    }
    if (item.startsWith('/')) {
      return `${spaceOrigin}/gradio_api/file=${item}`;
    }
    return '';
  }
  if (Array.isArray(item)) {
    for (const sub of item) {
      const hit = extractGradioFileUrl(sub, spaceOrigin);
      if (hit) return hit;
    }
    return '';
  }
  if (typeof item === 'object') {
    if (typeof item.url === 'string' && item.url.startsWith('http')) {
      return item.url;
    }
    if (typeof item.image === 'object' && item.image) {
      const hit = extractGradioFileUrl(item.image, spaceOrigin);
      if (hit) return hit;
    }
    if (typeof item.path === 'string' && item.path) {
      return `${spaceOrigin}/gradio_api/file=${item.path}`;
    }
  }
  return '';
}

async function callGradioImageSpace({
  spaceSlug,
  spaceHost,
  endpoint,
  data,
  timeoutMs = 38000,
}) {
  const spaceOrigin = `https://${spaceHost}`;
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const zeroGpuHeaders = await getZeroGpuHeaders(spaceSlug);
  const commonHeaders = {
    'User-Agent': CHROME_UA,
    Origin: spaceOrigin,
    Referer: `${spaceOrigin}/`,
    ...zeroGpuHeaders,
  };

  // Gradio 5 /gradio_api/call/<endpoint>
  const callRes = await fetchWithTimeout(
    `${spaceOrigin}/gradio_api/call/${cleanEndpoint}`,
    {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ data }),
    },
    15000
  );

  if (!callRes.ok) {
    const errBody = await callRes.text().catch(() => '');
    throw new Error(`${spaceHost} call HTTP ${callRes.status}: ${errBody.slice(0, 120)}`);
  }

  const callJson = await callRes.json();
  const eventId = callJson?.event_id;
  if (!eventId) {
    throw new Error(`${spaceHost} tidak mengembalikan event_id.`);
  }

  const streamRes = await fetchWithTimeout(
    `${spaceOrigin}/gradio_api/call/${cleanEndpoint}/${eventId}`,
    {
      headers: {
        ...commonHeaders,
        Accept: 'text/event-stream',
      },
    },
    timeoutMs
  );

  if (!streamRes.ok) {
    throw new Error(`${spaceHost} stream HTTP ${streamRes.status}`);
  }

  const rawSse = await streamRes.text();
  let currentEvent = '';
  let lastError = '';

  for (const rawLine of rawSse.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === 'null') continue;
      if (currentEvent === 'error') {
        lastError = dataStr;
        continue;
      }
      if (currentEvent === 'complete' || !currentEvent) {
        try {
          const parsed = JSON.parse(dataStr);
          const url = extractGradioFileUrl(parsed, spaceOrigin);
          if (url) {
            return {
              provider: spaceHost,
              model: spaceSlug,
              url,
            };
          }
        } catch {
          // ignore
        }
      }
    }
  }

  throw new Error(
    `${spaceHost} gagal menghasilkan gambar${lastError ? `: ${lastError.slice(0, 140)}` : '.'}`
  );
}

// ============================================================================
// 18. OPENAI.FM — Official OpenAI Expressive Neural Voice Scraper (GPT-4o-Mini-TTS)
// ============================================================================
const OPENAI_FM_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
  'verse',
]);

async function fetchOpenAiFmAudio({
  text,
  voice = 'coral',
  vibePrompt = 'Speak naturally, clearly, warmly, and expressively.',
}) {
  const selectedVoice = OPENAI_FM_VOICES.has(String(voice).toLowerCase())
    ? String(voice).toLowerCase()
    : 'coral';
  const params = new URLSearchParams({
    input: String(text || '').slice(0, 1500),
    prompt: vibePrompt,
    voice: selectedVoice,
  });

  const res = await fetchWithTimeout(
    `https://www.openai.fm/api/generate?${params.toString()}`,
    {
      headers: {
        Accept: 'audio/mpeg, audio/wav, audio/*, */*',
        Origin: 'https://www.openai.fm',
        Referer: 'https://www.openai.fm/',
        'User-Agent': CHROME_UA,
      },
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`openai.fm HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || 'audio/mpeg';
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength < 256) {
    throw new Error('openai.fm mengembalikan audio terlalu kecil / kosong.');
  }

  return { buffer, contentType, voice: selectedVoice };
}

// ============================================================================
// UNIFIED PROVIDER DISPATCHER
// ============================================================================
export const WEBAI_SCRAPER_DIRECTORY = [
  { id: 'chatgptoss-120b', site: 'chat-gpt-oss.com', kind: 'chat', name: 'GPT-OSS 120B Direct' },
  { id: 'chatgptoss-nano', site: 'chat-gpt-oss.com', kind: 'chat', name: 'GPT-5 Nano Direct' },
  { id: 'quillbot-chat', site: 'quillbot.com/ai-chat', kind: 'chat', name: 'QuillBot AI Chat' },
  { id: 'quillbot-search', site: 'quillbot.com/ai-chat', kind: 'search', name: 'QuillBot Live Web Search' },
  { id: 'deepai-chat', site: 'deepai.org', kind: 'chat', name: 'DeepAI Chat (Gemma 4 / DeepSeek V3.2)' },
  { id: 'deepai-online', site: 'deepai.org', kind: 'search', name: 'DeepAI Live Online Search' },
  { id: 'deepai-image', site: 'deepai.org', kind: 'image', name: 'DeepAI HD Text2Img Studio' },
  { id: 'opera-aria', site: 'composer.opera-api.com', kind: 'chat', name: 'Opera Aria AI Direct' },
  { id: 'opera-aria-reasoning', site: 'composer.opera-api.com', kind: 'reasoning', name: 'Opera Aria Think Harder' },
  { id: 'brave-ask', site: 'search.brave.com/ask', kind: 'search', name: 'Brave Search Ask AI' },
  { id: 'phindai', site: 'phindai.org', kind: 'coding', name: 'Phind AI Developer Search' },
  { id: 'teach-anything', site: 'teach-anything.com', kind: 'chat', name: 'Teach-Anything Edu AI' },
  { id: 'yqcloud', site: 'chat9.yqcloud.top', kind: 'chat', name: 'YQCloud GPT Network' },
  { id: 'kilo-nemotron', site: 'kilo.ai', kind: 'reasoning', name: 'Kilo Gateway · NVIDIA Nemotron 3.5 Super 120B' },
  { id: 'kilo-beam', site: 'kilo.ai', kind: 'coding', name: 'Kilo Gateway · Reflection Beam 1M' },
  { id: 'kilo-auto', site: 'kilo.ai', kind: 'chat', name: 'Kilo Gateway · Auto Free Router' },
  { id: 'orcarouter', site: 'orcarouter.ai', kind: 'chat', name: 'OrcaRouter Free AI Gateway' },
  { id: 'airforce', site: 'api.airforce', kind: 'chat', name: 'Airforce AI Gateway' },
  { id: 'llm7-direct', site: 'api.llm7.io', kind: 'chat', name: 'LLM7.io Open Research Gateway' },
  { id: 'cohere-command-a', site: 'coherelabs-c4ai-command.hf.space', kind: 'chat', name: 'Cohere Command-A Official' },
  { id: 'bfl-flux-schnell', site: 'black-forest-labs-flux-1-schnell.hf.space', kind: 'image', name: 'Black Forest Labs FLUX.1-Schnell' },
  { id: 'bfl-flux-dev', site: 'black-forest-labs-flux-1-dev.hf.space', kind: 'image', name: 'Black Forest Labs FLUX.1-Dev HD' },
  { id: 'stability-sd35', site: 'stabilityai-stable-diffusion-3-5-large.hf.space', kind: 'image', name: 'Stability AI SD 3.5 Large' },
  { id: 'qwen-image-fast', site: 'mcp-tools-qwen-image-fast.hf.space', kind: 'image', name: 'Alibaba Qwen-Image-Fast Lightning' },
  { id: 'tongyi-zimage', site: 'mrfakename-z-image-turbo.hf.space', kind: 'image', name: 'Tongyi-MAI Z-Image-Turbo' },
  { id: 'openai-fm', site: 'openai.fm', kind: 'audio', name: 'OpenAI.fm GPT-4o-Mini-TTS Neural Voice' },
];

async function dispatchWebAiProvider({
  provider,
  model,
  mode,
  text,
  prompt,
  system,
  ratio = '1:1',
  voice = 'coral',
}) {
  const id = String(provider || '').trim().toLowerCase();
  const inputText = String(text || prompt || '').trim();
  const dims = ratioToDimensions(ratio);

  switch (id) {
    case 'chatgptoss':
    case 'chatgptoss-120b':
      return scrapeChatGptOss({
        text: inputText,
        system,
        model: model || 'gpt-oss-120b',
        reasoning: mode === 'high' ? 'high' : 'low',
      });

    case 'chatgptoss-nano':
      return scrapeChatGptOss({
        text: inputText,
        system,
        model: 'gpt-5-nano',
        reasoning: 'low',
      });

    case 'quillbot':
    case 'quillbot-chat':
      return scrapeQuillBot({ text: inputText, system, webSearch: false });

    case 'quillbot-search':
      return scrapeQuillBot({ text: inputText, system, webSearch: true });

    case 'deepai':
    case 'deepai-chat':
      return scrapeDeepAiChat({
        text: inputText,
        system,
        model: model || 'standard',
      });

    case 'deepai-online':
      return scrapeDeepAiChat({
        text: inputText,
        system,
        model: 'online',
      });

    case 'deepai-gemma4':
      return scrapeDeepAiChat({
        text: inputText,
        system,
        model: 'gemma-4',
      });

    case 'deepai-image':
      return scrapeDeepAiImage({ prompt: inputText, ratio });

    case 'opera':
    case 'opera-aria':
      return scrapeOperaAria({
        text: inputText,
        system,
        thinkHarder: false,
        imageMode: mode === 'image',
      });

    case 'opera-aria-reasoning':
      return scrapeOperaAria({
        text: inputText,
        system,
        thinkHarder: true,
        imageMode: false,
      });

    case 'brave':
    case 'brave-ask':
      return scrapeBraveAsk({ text: inputText, system });

    case 'phind':
    case 'phindai':
      return scrapePhindAi({ text: inputText, system });

    case 'teach-anything':
      return scrapeTeachAnything({ text: inputText, system });

    case 'yqcloud':
      return scrapeYqCloud({ text: inputText, system });

    case 'kilo':
    case 'kilo-auto':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: model || 'kilo-auto/free',
        text: inputText,
        system,
      });

    case 'kilo-nemotron':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: 'nvidia/nemotron-3.5-super-vl:free',
        text: inputText,
        system,
      });

    case 'kilo-beam':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: 'reflection/beam-free',
        text: inputText,
        system,
      });

    case 'kilo-glyph':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: 'stealth/glyph-cluster',
        text: inputText,
        system,
      });

    case 'orcarouter':
      return scrapeOpenAiCompatGateway({
        providerName: 'orcarouter.ai',
        endpointUrl: 'https://api.orcarouter.ai/v1/chat/completions',
        originUrl: 'https://orcarouter.ai',
        model: model || 'orcarouter/free',
        text: inputText,
        system,
      });

    case 'airforce':
      return scrapeOpenAiCompatGateway({
        providerName: 'api.airforce',
        endpointUrl: 'https://api.airforce/v1/chat/completions',
        originUrl: 'https://api.airforce',
        model: model || 'llama-4-maverick',
        text: inputText,
        system,
      });

    case 'llm7':
    case 'llm7-direct':
      return scrapeOpenAiCompatGateway({
        providerName: 'api.llm7.io',
        endpointUrl: 'https://api.llm7.io/v1/chat/completions',
        originUrl: 'https://llm7.io',
        model: model || 'default',
        text: inputText,
        system,
      });

    case 'cohere':
    case 'cohere-command-a':
      return scrapeCohereCommand({
        text: inputText,
        system,
        model: model || 'command-a-03-2025',
      });

    case 'bfl-flux-schnell': {
      const seed = Math.floor(Math.random() * 1000000);
      try {
        return await callGradioImageSpace({
          spaceSlug: 'black-forest-labs/FLUX.1-schnell',
          spaceHost: 'black-forest-labs-flux-1-schnell.hf.space',
          endpoint: '/infer',
          data: [inputText, seed, true, dims.width, dims.height, 4],
          timeoutMs: 34000,
        });
      } catch {
        return callGradioImageSpace({
          spaceSlug: 'evalstate/flux1_schnell',
          spaceHost: 'evalstate-flux1-schnell.hf.space',
          endpoint: '/infer',
          data: [inputText, seed, true, dims.width, dims.height, 4],
          timeoutMs: 34000,
        });
      }
    }

    case 'bfl-flux-dev':
      return callGradioImageSpace({
        spaceSlug: 'black-forest-labs/FLUX.1-dev',
        spaceHost: 'black-forest-labs-flux-1-dev.hf.space',
        endpoint: '/infer',
        data: [
          inputText,
          Math.floor(Math.random() * 1000000),
          true,
          dims.width,
          dims.height,
          3.5,
          28,
        ],
        timeoutMs: 44000,
      });

    case 'stability-sd35':
      return callGradioImageSpace({
        spaceSlug: 'stabilityai/stable-diffusion-3-5-large',
        spaceHost: 'stabilityai-stable-diffusion-3-5-large.hf.space',
        endpoint: '/infer',
        data: [
          inputText,
          'blurry, low quality, distorted, watermark, deformed',
          Math.floor(Math.random() * 1000000),
          true,
          dims.width,
          dims.height,
          4.5,
          28,
        ],
        timeoutMs: 44000,
      });

    case 'qwen-image-fast':
      return callGradioImageSpace({
        spaceSlug: 'mcp-tools/Qwen-Image-Fast',
        spaceHost: 'mcp-tools-qwen-image-fast.hf.space',
        endpoint: '/generate_image',
        data: [inputText, 0, true, dims.aspect, 1.0, 8],
        timeoutMs: 36000,
      });

    case 'tongyi-zimage':
      return callGradioImageSpace({
        spaceSlug: 'mrfakename/Z-Image-Turbo',
        spaceHost: 'mrfakename-z-image-turbo.hf.space',
        endpoint: '/generate_image',
        data: [inputText, dims.height, dims.width, 9, 42, true],
        timeoutMs: 36000,
      });

    case 'openai-fm': {
      const audio = await fetchOpenAiFmAudio({ text: inputText, voice });
      const streamUrl = `/api/webai?provider=openai-fm&stream=1&voice=${encodeURIComponent(
        audio.voice
      )}&text=${encodeURIComponent(inputText)}`;
      return {
        provider: 'openai.fm',
        model: `gpt-4o-mini-tts (${audio.voice})`,
        audioUrl: streamUrl,
        bytes: audio.buffer.byteLength,
        contentType: audio.contentType,
        result: `Audio neural berhasil dibuat oleh openai.fm (${audio.voice}, ${(
          audio.buffer.byteLength / 1024
        ).toFixed(1)} KB).`,
      };
    }

    default:
      throw new Error(`Provider WebAI tidak dikenal: "${provider}".`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const startedAt = Date.now();
  const query = req.query || {};

  // 1. Catalog listing
  if (req.method === 'GET' && query.catalog === '1') {
    return res.status(200).json({
      ok: true,
      status: true,
      count: WEBAI_SCRAPER_DIRECTORY.length,
      providers: WEBAI_SCRAPER_DIRECTORY,
    });
  }

  // 2. Direct binary audio stream for OpenAI.fm Neural TTS (<audio> & 1-click download)
  if (
    req.method === 'GET' &&
    String(query.provider || '').toLowerCase() === 'openai-fm' &&
    query.stream === '1'
  ) {
    try {
      const text = String(query.text || query.q || 'Halo dari NodataGPT karya Mr.NODATA.').trim();
      const voice = String(query.voice || 'coral').trim();
      const audio = await fetchOpenAiFmAudio({ text, voice });
      res.setHeader('Content-Type', audio.contentType || 'audio/mpeg');
      res.setHeader('Content-Length', String(audio.buffer.byteLength));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      if (query.download === '1') {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="nodatagpt-voice-${audio.voice}-${Date.now()}.mp3"`
        );
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }
      return res.status(200).send(audio.buffer);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        status: false,
        error: err instanceof Error ? err.message : 'Gagal streaming audio openai.fm.',
      });
    }
  }

  // 3. Parse request parameters (GET probe or POST live)
  let body = {};
  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }
  }

  const isProbe = query.probe === '1' || body.probe === true;
  const provider = String(body.provider || query.provider || '').trim();
  const model = String(body.model || query.model || '').trim();
  const mode = String(body.mode || query.mode || '').trim();
  const ratio = String(body.ratio || query.ratio || '1:1').trim();
  const voice = String(body.voice || query.voice || 'coral').trim();
  const system = String(body.system || query.system || NODATAGPT_DEFAULT_SYSTEM).trim();

  const isImageProvider = [
    'deepai-image',
    'bfl-flux-schnell',
    'bfl-flux-dev',
    'stability-sd35',
    'qwen-image-fast',
    'tongyi-zimage',
  ].includes(provider.toLowerCase()) || mode === 'image';

  const defaultProbeText = isImageProvider
    ? 'futuristic neon cyan and orange glowing cybernetic fox emblem on dark obsidian background, ultra sharp digital art'
    : 'Halo! Siapa nama kamu dan siapa pembuatmu? Jawab singkat 1 kalimat.';

  const text = String(
    body.text || body.prompt || query.text || query.q || (isProbe ? defaultProbeText : '')
  ).trim();

  if (!provider) {
    return res.status(400).json({
      ok: false,
      status: false,
      error: 'Parameter "provider" wajib diisi.',
      availableProviders: WEBAI_SCRAPER_DIRECTORY.map((p) => p.id),
    });
  }

  if (!text) {
    return res.status(400).json({
      ok: false,
      status: false,
      error: 'Parameter "text" atau "prompt" wajib diisi.',
    });
  }

  try {
    const out = await dispatchWebAiProvider({
      provider,
      model,
      mode,
      text,
      system,
      ratio,
      voice,
    });

    return res.status(200).json({
      ok: true,
      status: true,
      latencyMs: Date.now() - startedAt,
      ...out,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal menjalankan WebAI scraper.';
    return res.status(isProbe ? 200 : 502).json({
      ok: false,
      status: false,
      provider,
      latencyMs: Date.now() - startedAt,
      error: message,
    });
  }
}
