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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

const NODATAGPT_DEFAULT_SYSTEM =
  'Kamu adalah NodataGPT, asisten AI cerdas generasi baru yang dibuat dan dikembangkan oleh Mr.NODATA dalam ekosistem teknologi dan kreatif NODATA. Selalu perkenalkan dirimu sebagai NodataGPT karya Mr.NODATA jika ditanya siapa nama kamu, identitasmu, atau siapa pembuat/pengembangmu, dan jawab secara akurat, jelas, serta ramah.';

/** @type {Map<string, { token: string, sessionUuid: string, expiresAt: number }>} */
const cachedZeroGpuTokens = new Map();

/** @type {{ sessionId: string, nonce: string, mintedAt: number } | null} */
let cachedFreeAiOnlineSession = null;

function md5Hex(input) {
  return crypto.createHash('md5').update(String(input), 'utf8').digest('hex');
}

function revMd5(input) {
  return md5Hex(input).split('').reverse().join('');
}

function randomHex(byteLen = 16) {
  return crypto.randomBytes(byteLen).toString('hex');
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
      /Saya adalah Standard AI Chat oleh DeepAI\.?/gi,
      'Saya adalah NodataGPT, asisten AI cerdas yang dibuat oleh Mr.NODATA.'
    )
    .replace(
      /Saya bernama Step,\s*dikembangkan oleh[^.\n]+\.?/gi,
      'Saya bernama NodataGPT, asisten AI yang dibuat dan dikembangkan oleh Mr.NODATA.'
    )
    .replace(
      /\b(?:I am|I'm)\s+(?:ChatGPT|Standard AI Chat|DeepAI|Command[-\s]?A|Cohere|Claude|Gemini|DeepSeek|Qwen|Grok|Step)\b/gi,
      'I am NodataGPT (created by Mr.NODATA)'
    )
    .replace(
      /\b(?:Saya adalah|Aku adalah|Nama saya|Saya bernama)\s+(?:ChatGPT|Standard AI Chat|DeepAI|Command[-\s]?A|Cohere|Claude|Gemini|DeepSeek|Qwen|Grok|Step)\b/gi,
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
  if (clean === '16:9') return { width: 1280, height: 720, aspect: '16:9', hordeW: 768, hordeH: 512 };
  if (clean === '9:16') return { width: 720, height: 1280, aspect: '9:16', hordeW: 512, hordeH: 768 };
  if (clean === '4:3') return { width: 1152, height: 864, aspect: '4:3', hordeW: 640, hordeH: 512 };
  if (clean === '3:4') return { width: 864, height: 1152, aspect: '3:4', hordeW: 512, hordeH: 640 };
  return { width: 1024, height: 1024, aspect: '1:1', hordeW: 576, hordeH: 576 };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
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

function parseOpenAiSseOrJson(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { text: '', thinking: '' };

  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      const choice = Array.isArray(json?.choices) ? json.choices[0] : null;
      const content =
        choice?.message?.content ||
        choice?.delta?.content ||
        choice?.text ||
        json?.result ||
        json?.response ||
        '';
      const reasoning =
        choice?.message?.reasoning_content ||
        choice?.message?.reasoning ||
        choice?.delta?.reasoning_content ||
        '';
      if (typeof content === 'string' && content.trim()) {
        return { text: content.trim(), thinking: String(reasoning || '').trim() };
      }
    } catch {
      // fall through to line parser
    }
  }

  let answer = '';
  let thinking = '';
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const dataStr = line.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;
    try {
      const obj = JSON.parse(dataStr);
      const choice = Array.isArray(obj?.choices)
        ? obj.choices[0]
        : obj?.choices && typeof obj.choices === 'object'
        ? obj.choices['0']
        : null;
      const deltaContent =
        choice?.delta?.content ?? choice?.message?.content ?? '';
      const deltaThink =
        choice?.delta?.reasoning_content ??
        choice?.delta?.reasoning ??
        choice?.message?.reasoning_content ??
        '';
      if (typeof deltaContent === 'string') answer += deltaContent;
      if (typeof deltaThink === 'string') thinking += deltaThink;
    } catch {
      // ignore non-json SSE line
    }
  }

  return { text: answer.trim(), thinking: thinking.trim() };
}

// ============================================================================
// 1. OPENCODE.AI ZEN — Keyless Agentic & Reasoning Models (opencode.ai)
// ============================================================================
const OPENCODE_DEFAULT_TOOLS = [
  'bash',
  'edit',
  'glob',
  'grep',
  'question',
  'read',
  'skill',
  'task',
  'todowrite',
  'webfetch',
  'websearch',
  'write',
].map((name) => ({ type: 'function', function: { name } }));

async function scrapeOpenCodeZen({
  text,
  system,
  model = 'deepseek-v4.1-flash-free',
}) {
  const res = await fetchWithTimeout(
    'https://opencode.ai/zen/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Accept-Language': '*',
        Authorization: 'Bearer public',
        'Sec-Fetch-Mode': 'cors',
        'x-opencode-client': 'desktop',
        'x-opencode-project': randomHex(20),
        'x-opencode-request': `msg_${randomHex(13)}`,
        'x-opencode-session': `ses_${randomHex(13)}`,
        'User-Agent':
          'opencode/1.18.18 ai-sdk/provider-utils/4.0.23 runtime/node.js/24',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
          { role: 'user', content: text },
        ],
        tools: OPENCODE_DEFAULT_TOOLS,
        tool_choice: 'none',
        stream_options: { include_usage: true },
      }),
    },
    28000
  );

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`opencode.ai HTTP ${res.status}: ${errTxt.slice(0, 120)}`);
  }

  const parsed = parseOpenAiSseOrJson(await res.text());
  if (!parsed.text) {
    throw new Error('opencode.ai tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'opencode.ai',
    model,
    result: normalizePersonaReply(parsed.text),
    ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
  };
}

// ============================================================================
// 2. FX.SH (Vercel Labs FX WASM Gateway — zai/glm-5.2)
// ============================================================================
async function scrapeFxShGateway({ text, system, model = 'zai/glm-5.2' }) {
  const now = Date.now();
  const sessionId = `${now}-${now}000000-${randomHex(8)}`;
  const res = await fetchWithTimeout(
    'https://fx.sh/fx-wasm/gateway/v3/ai/language-model',
    {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'ai-gateway-protocol-version': '0.0.1',
        'ai-language-model-id': model,
        'ai-language-model-specification-version': '4',
        'ai-language-model-streaming': 'true',
        Authorization: 'Bearer fx-demo-proxy',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'http-referer': 'https://github.com/vercel-labs/fx',
        Origin: 'https://fx.sh',
        Referer: 'https://fx.sh/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
        'x-session-affinity': sessionId,
        'x-session-id': sessionId,
        'x-title': 'fx',
      },
      body: JSON.stringify({
        prompt: [
          { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
          { role: 'user', content: [{ type: 'text', text }] },
        ],
        maxOutputTokens: 16384,
        providerOptions: { gateway: { speed: 'fast' } },
        headers: { 'user-agent': 'fx/0.0.3' },
      }),
    },
    28000
  );

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`fx.sh HTTP ${res.status}: ${errTxt.slice(0, 120)}`);
  }

  const raw = await res.text();
  let answer = '';
  let thinking = '';

  for (const rawLine of raw.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('message:')) line = line.slice(8).trim();
    else if (line.startsWith('data:')) line = line.slice(5).trim();
    if (!line || line === '[DONE]') continue;
    try {
      const chunk = JSON.parse(line);
      if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
        answer += chunk.delta;
      } else if (chunk.type === 'reasoning-delta' && typeof chunk.delta === 'string') {
        thinking += chunk.delta;
      } else if (typeof chunk.text === 'string' && !chunk.type) {
        answer += chunk.text;
      }
    } catch {
      // ignore non-json line
    }
  }

  if (!answer.trim()) {
    throw new Error('fx.sh tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'fx.sh',
    model,
    result: normalizePersonaReply(answer),
    ...(thinking.trim() ? { thinking: thinking.trim() } : {}),
  };
}

// ============================================================================
// 3. ISOU.CHAT — GPT-5.4-Mini + Live SEARXNG Web Search AI + Citations
// ============================================================================
async function scrapeIsouChat({ text, system, model = 'gpt-5.4-mini' }) {
  const res = await fetchWithTimeout(
    'https://isou.chat/api/chat',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.7',
        Origin: 'https://isou.chat',
        Referer: 'https://isou.chat/chat',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
      },
      body: JSON.stringify({
        model,
        provider: 'openai',
        language: 'all',
        categories: ['general'],
        engine: 'SEARXNG',
        messages: [
          {
            role: 'user',
            content: buildCombinedPrompt(system, text),
          },
        ],
      }),
    },
    28000
  );

  if (!res.ok) {
    throw new Error(`isou.chat HTTP ${res.status}`);
  }

  const raw = await res.text();
  let answer = '';
  const sources = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    const idx = rawLine.indexOf('data:');
    if (idx === -1) continue;
    const jsonStr = rawLine.slice(idx + 5).trim();
    if (!jsonStr || jsonStr === '[DONE]') continue;
    try {
      const outer = JSON.parse(jsonStr);
      const inner = outer?.data || outer;
      if (typeof inner?.content === 'string' && inner.content) {
        answer += inner.content;
      }
      if (Array.isArray(inner?.contexts)) {
        for (const ctx of inner.contexts) {
          if (ctx?.url && sources.length < 8) {
            sources.push({ title: ctx.name || ctx.url, url: ctx.url });
          }
        }
      }
    } catch {
      // ignore non-json line
    }
  }

  if (!answer.trim()) {
    throw new Error('isou.chat tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'isou.chat',
    model,
    result: normalizePersonaReply(answer),
    ...(sources.length > 0 ? { sources } : {}),
  };
}

// ============================================================================
// 4. POWERBRAINAI.COM — Direct GPT-5 Backend Scraper
// ============================================================================
async function scrapePowerBrainAi({ text, system, model = 'gpt-5' }) {
  const res = await fetchWithTimeout(
    'https://powerbrainai.com/app/backend/api/api.php',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Dart/3.5 (dart:io)',
      },
      body: JSON.stringify({
        model,
        secret_token: 'AIChatPowerBrain123@2024',
        action: 'send_message',
        messages: [
          { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
          { role: 'user', content: text },
        ],
      }),
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`powerbrainai.com HTTP ${res.status}`);
  }

  const raw = (await res.text()).trim();
  let answer = '';
  try {
    const json = JSON.parse(raw);
    answer =
      json?.data ||
      json?.message ||
      json?.reply ||
      json?.choices?.[0]?.message?.content ||
      '';
  } catch {
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.replace(/^data:\s*/, '').trim();
      if (!trimmed || trimmed === '[DONE]') continue;
      try {
        const obj = JSON.parse(trimmed);
        if (typeof obj?.data === 'string') answer += obj.data;
      } catch {
        // ignore
      }
    }
  }

  if (!String(answer || '').trim()) {
    throw new Error('powerbrainai.com tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'powerbrainai.com',
    model,
    result: normalizePersonaReply(answer),
  };
}

// ============================================================================
// 5. EXTENSIONS.AITOPIA.AI — Aitopia AI Chrome Extension Direct Scraper
// ============================================================================
async function scrapeAitopiaAi({ text, system, model = 'AITOPIA' }) {
  const promptInput = buildCombinedPrompt(system, text);
  const res = await fetchWithTimeout(
    'https://extensions.aitopia.ai/ai/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain, text/event-stream, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        hopekey: randomHex(16),
        Origin: 'chrome-extension://becfinhbfclcgokjlobojlnldbfillpf',
        Pragma: 'no-cache',
        'User-Agent': CHROME_UA,
      },
      body: JSON.stringify({
        history: [
          {
            item: promptInput,
            role: 'user',
            model,
            extra_data: { prompt_mode: false },
          },
          {
            item: '',
            role: 'system',
            model,
            loading: true,
            extra_data: { prompt_mode: false },
          },
        ],
        text: promptInput,
        model,
        stream: true,
        mode: 'ai_chat',
        prompt_mode: false,
        extra_key: '__all',
        extra_data: { prompt_mode: false },
        language_detail: {
          lang_code: 'id',
          name: 'Indonesian',
          title: 'Bahasa Indonesia',
        },
        is_continue: false,
        lang_code: 'id',
      }),
    },
    26000
  );

  if (!res.ok) {
    throw new Error(`extensions.aitopia.ai HTTP ${res.status}`);
  }

  const parsed = parseOpenAiSseOrJson(await res.text());
  if (!parsed.text) {
    throw new Error('extensions.aitopia.ai tidak mengembalikan teks jawaban.');
  }

  return {
    provider: 'extensions.aitopia.ai',
    model,
    result: normalizePersonaReply(parsed.text),
  };
}

// ============================================================================
// 6. FREE-AI-ONLINE.COM — WordPress MWAI Grok-4 Session Scraper
// ============================================================================
async function getFreeAiOnlineSession(forceRefresh = false) {
  if (
    !forceRefresh &&
    cachedFreeAiOnlineSession &&
    Date.now() - cachedFreeAiOnlineSession.mintedAt < 8 * 60 * 1000
  ) {
    return cachedFreeAiOnlineSession;
  }

  const res = await fetchWithTimeout(
    'https://www.free-ai-online.com/wp-json/mwai/v1/start_session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        Origin: 'https://www.free-ai-online.com',
        Referer: 'https://www.free-ai-online.com/grok-4-free/',
        'User-Agent': CHROME_UA,
      },
      body: '{}',
    },
    14000
  );

  if (!res.ok) {
    throw new Error(`free-ai-online.com start_session HTTP ${res.status}`);
  }
  const data = await res.json();
  const sessionId = data?.sessionId;
  const nonce = data?.restNonce || data?.new_token;
  if (!sessionId || !nonce) {
    throw new Error('free-ai-online.com gagal mendapatkan sessionId/restNonce.');
  }

  cachedFreeAiOnlineSession = {
    sessionId,
    nonce,
    mintedAt: Date.now(),
  };
  return cachedFreeAiOnlineSession;
}

async function scrapeFreeAiOnlineGrok({ text, system }) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const sess = await getFreeAiOnlineSession(attempt > 0);
    const res = await fetchWithTimeout(
      'https://www.free-ai-online.com/wp-json/mwai-ui/v1/chats/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://www.free-ai-online.com',
          Referer: 'https://www.free-ai-online.com/grok-4-free/',
          'X-WP-Nonce': sess.nonce,
          'User-Agent': CHROME_UA,
        },
        body: JSON.stringify({
          botId: 'Grok 4 free',
          customId: null,
          session: sess.sessionId,
          chatId: `nodata_${randomHex(4)}`,
          contextId: 25,
          messages: [],
          newMessage: buildCombinedPrompt(system, text),
          stream: false,
        }),
      },
      26000
    );

    if (res.ok) {
      const json = await res.json();
      if (json?.success && typeof json?.reply === 'string' && json.reply.trim()) {
        return {
          provider: 'free-ai-online.com',
          model: 'grok-4-free',
          result: normalizePersonaReply(json.reply),
        };
      }
    }
    cachedFreeAiOnlineSession = null;
  }

  throw new Error('free-ai-online.com gagal mengembalikan balasan Grok 4.');
}

// ============================================================================
// 7. POLLINATIONS.G4F.SPACE & GEN.POLLINATIONS.AI — Public Cluster + Audio
// ============================================================================
const POLLINATIONS_PUBLIC_KEY = ['pk', '_', 'pqjxQN7C', 'oSJUShHF'].join('');

async function scrapePollinationsText({
  text,
  system,
  model = 'openai',
  useCluster = false,
}) {
  const endpoints = useCluster
    ? [
        {
          url: 'https://pollinations.g4f.space/v1/chat/completions',
          label: 'pollinations.g4f.space',
          auth: '',
        },
        {
          url: 'https://gen.pollinations.ai/v1/chat/completions',
          label: 'gen.pollinations.ai',
          auth: `Bearer ${POLLINATIONS_PUBLIC_KEY}`,
          fallbackModel: 'openai',
        },
      ]
    : [
        {
          url: 'https://gen.pollinations.ai/v1/chat/completions',
          label: 'gen.pollinations.ai',
          auth: `Bearer ${POLLINATIONS_PUBLIC_KEY}`,
        },
        {
          url: 'https://text.pollinations.ai/openai',
          label: 'text.pollinations.ai',
          auth: '',
        },
      ];

  let lastErr = 'Pollinations Text tidak merespons.';
  for (const ep of endpoints) {
    try {
      const targetModel = ep.fallbackModel || model;
      const res = await fetchWithTimeout(
        ep.url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream, */*',
            Origin: 'https://pollinations.ai',
            Referer: 'https://pollinations.ai/',
            'User-Agent': CHROME_UA,
            ...(ep.auth ? { Authorization: ep.auth } : {}),
          },
          body: JSON.stringify({
            model: targetModel,
            stream: false,
            messages: [
              { role: 'system', content: system || NODATAGPT_DEFAULT_SYSTEM },
              { role: 'user', content: text },
            ],
          }),
        },
        26000
      );

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        lastErr = `${ep.label} HTTP ${res.status}: ${errTxt.slice(0, 120)}`;
        continue;
      }

      const parsed = parseOpenAiSseOrJson(await res.text());
      if (parsed.text) {
        return {
          provider: ep.label,
          model: targetModel,
          result: normalizePersonaReply(parsed.text),
          ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
        };
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(lastErr);
}

// ============================================================================
// 8. DEEPAI.ORG — Dynamic TryIt Hash Scraper (Chat & Live Online Search)
// ============================================================================
async function scrapeDeepAiChat({ text, system, model = 'standard' }) {
  const apiKey = createDeepAiTryItKey(CHROME_UA);
  const form = new FormData();
  form.append('chat_style', 'chat');
  form.append(
    'chatHistory',
    JSON.stringify([
      {
        role: 'user',
        content:
          model === 'online' ? text : buildCombinedPrompt(system, text),
      },
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

// ============================================================================
// 9 & 10. KILO.AI & LLM7.IO — Keyless OpenAI-Compatible Gateways
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

  const parsed = parseOpenAiSseOrJson(await res.text());
  if (!parsed.text) {
    throw new Error(`${providerName} tidak mengembalikan teks jawaban.`);
  }

  return {
    provider: providerName,
    model,
    result: normalizePersonaReply(parsed.text),
    ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
  };
}

// ============================================================================
// 11. YQCLOUD / BINJIE (chat9.yqcloud.top -> api.binjie.fun)
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
        prompt: buildCombinedPrompt(system, text),
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
// 13. AI HORDE (stablehorde.net) — Distributed GPU Image & LLM Cluster
// ============================================================================
async function scrapeAiHordeImage({ prompt, ratio = '1:1' }) {
  const dims = ratioToDimensions(ratio);
  const submitRes = await fetchWithTimeout(
    'https://stablehorde.net/api/v2/generate/async',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: '0000000000',
        'Client-Agent': 'nodatagpt:3.0:webai',
      },
      body: JSON.stringify({
        prompt,
        params: {
          width: dims.hordeW,
          height: dims.hordeH,
          steps: 20,
          n: 1,
          sampler_name: 'k_euler_a',
          cfg_scale: 7,
        },
        nsfw: false,
        censor_nsfw: true,
        r2: true,
      }),
    },
    14000
  );

  if (!submitRes.ok) {
    const errTxt = await submitRes.text().catch(() => '');
    throw new Error(`stablehorde.net submit HTTP ${submitRes.status}: ${errTxt.slice(0, 120)}`);
  }

  const submitJson = await submitRes.json();
  const jobId = submitJson?.id;
  if (!jobId) {
    throw new Error('stablehorde.net tidak mengembalikan job id.');
  }

  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetchWithTimeout(
      `https://stablehorde.net/api/v2/generate/status/${jobId}`,
      {
        headers: {
          Accept: 'application/json',
          apikey: '0000000000',
          'Client-Agent': 'nodatagpt:3.0:webai',
        },
      },
      10000
    );
    if (!statusRes.ok) continue;
    const statusJson = await statusRes.json();
    if (statusJson?.faulted) {
      throw new Error('AI Horde gagal merender gambar.');
    }
    if (statusJson?.done && Array.isArray(statusJson?.generations) && statusJson.generations[0]?.img) {
      const imgVal = statusJson.generations[0].img;
      const url = imgVal.startsWith('http')
        ? imgVal
        : `data:image/webp;base64,${imgVal}`;
      return {
        provider: 'stablehorde.net',
        model: statusJson.generations[0].model || 'ai-horde-sd',
        url,
      };
    }
  }

  throw new Error('AI Horde antrean penuh (>36 detik).');
}

// ============================================================================
// 14–16. HUGGING FACE ZEROGPU FAST IMAGE SPACES (BFL FLUX.1, Evalstate FLUX, Qwen-Image)
// ============================================================================
function randomPublicIpv4() {
  const firstOctets = [24, 38, 45, 66, 71, 73, 84, 98, 104, 138, 174];
  const a = firstOctets[Math.floor(Math.random() * firstOctets.length)];
  const b = Math.floor(Math.random() * 220) + 12;
  const c = Math.floor(Math.random() * 250) + 1;
  const d = Math.floor(Math.random() * 250) + 2;
  return `${a}.${b}.${c}.${d}`;
}

async function getZeroGpuHeaders(spaceSlug) {
  const cached = cachedZeroGpuTokens.get(spaceSlug);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      ...(cached.token ? { 'X-Zerogpu-Token': cached.token } : {}),
      'X-Zerogpu-Uuid': crypto.randomUUID(),
      'X-Forwarded-For': randomPublicIpv4(),
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
      8000
    );
    if (!res.ok) {
      return {
        'X-Zerogpu-Uuid': crypto.randomUUID(),
        'X-Forwarded-For': randomPublicIpv4(),
      };
    }
    const html = await res.text();
    const tokenMatch =
      html.match(/&quot;token&quot;:&quot;([^&]+?)&quot;/) ||
      html.match(/"zerogpu"\s*:\s*\{[^}]*"token"\s*:\s*"([^"]+)"/);
    const token = tokenMatch?.[1] || '';
    cachedZeroGpuTokens.set(spaceSlug, {
      token,
      sessionUuid: crypto.randomUUID(),
      expiresAt: Date.now() + 8 * 60 * 1000,
    });
    return {
      ...(token ? { 'X-Zerogpu-Token': token } : {}),
      'X-Zerogpu-Uuid': crypto.randomUUID(),
      'X-Forwarded-For': randomPublicIpv4(),
    };
  } catch {
    return {
      'X-Zerogpu-Uuid': crypto.randomUUID(),
      'X-Forwarded-For': randomPublicIpv4(),
    };
  }
}

function extractGradioFileUrl(item, spaceOrigin) {
  if (!item) return '';
  if (typeof item === 'string') {
    if (
      item.startsWith('http://') ||
      item.startsWith('https://') ||
      item.startsWith('data:image/')
    ) {
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
  timeoutMs = 36000,
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
    14000
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
// 17. NEURAL VOICE TTS (gen.pollinations.ai ElevenLabs/OpenAI-Audio + openai.fm)
// ============================================================================
const ELEVENLABS_VOICES = new Set(['rachel', 'bella', 'adam', 'josh', 'domi']);

async function fetchNeuralVoiceAudio({ text, voice = 'coral' }) {
  const cleanVoice = String(voice || 'coral').toLowerCase();
  const audioModel = ELEVENLABS_VOICES.has(cleanVoice)
    ? 'elevenlabs'
    : 'openai-audio';

  // Primary: gen.pollinations.ai /v1/audio/speech (ElevenLabs & OpenAI Neural Voices)
  try {
    const res = await fetchWithTimeout(
      'https://gen.pollinations.ai/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg, audio/*, */*',
          Authorization: `Bearer ${POLLINATIONS_PUBLIC_KEY}`,
          Origin: 'https://pollinations.ai',
          Referer: 'https://pollinations.ai/',
          'User-Agent': CHROME_UA,
        },
        body: JSON.stringify({
          model: audioModel,
          input: String(text || '').slice(0, 1500),
          voice: cleanVoice,
          response_format: 'mp3',
        }),
      },
      24000
    );

    if (res.ok) {
      const ct = res.headers.get('content-type') || 'audio/mpeg';
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > 256 && !ct.includes('json') && !ct.includes('html')) {
        return {
          buffer: buf,
          contentType: ct,
          voice: cleanVoice,
          source: 'gen.pollinations.ai',
        };
      }
    }
  } catch {
    // Fallback below
  }

  // Secondary: openai.fm
  const params = new URLSearchParams({
    input: String(text || '').slice(0, 1500),
    prompt: 'Speak naturally, clearly, warmly, and expressively.',
    voice: cleanVoice,
  });
  const res2 = await fetchWithTimeout(
    `https://www.openai.fm/api/generate?${params.toString()}`,
    {
      headers: {
        Accept: 'audio/mpeg, audio/wav, audio/*, */*',
        Origin: 'https://www.openai.fm',
        Referer: 'https://www.openai.fm/',
        'User-Agent': CHROME_UA,
      },
    },
    22000
  );
  if (!res2.ok) {
    throw new Error(`Neural Voice HTTP ${res2.status}`);
  }
  const buf2 = Buffer.from(await res2.arrayBuffer());
  if (buf2.byteLength < 256) {
    throw new Error('Neural Voice mengembalikan audio kosong.');
  }
  return {
    buffer: buf2,
    contentType: res2.headers.get('content-type') || 'audio/mpeg',
    voice: cleanVoice,
    source: 'openai.fm',
  };
}

// ============================================================================
// UNIFIED PROVIDER DIRECTORY & DISPATCHER
// ============================================================================
export const WEBAI_SCRAPER_DIRECTORY = [
  { id: 'opencode-deepseek', site: 'opencode.ai', kind: 'reasoning', name: 'OpenCode Zen · DeepSeek V4.1 Flash' },
  { id: 'opencode-glm53', site: 'opencode.ai', kind: 'chat', name: 'OpenCode Zen · GLM-5.3 Flash' },
  { id: 'opencode-flint', site: 'opencode.ai', kind: 'coding', name: 'OpenCode Zen · Recursive Flint 40B Coder' },
  { id: 'opencode-pickle', site: 'opencode.ai', kind: 'reasoning', name: 'OpenCode Zen · Big Pickle 200K Reasoning' },
  { id: 'fx-glm52', site: 'fx.sh', kind: 'chat', name: 'Vercel FX Gateway · GLM-5.2' },
  { id: 'isou-search', site: 'isou.chat', kind: 'search', name: 'iSou Chat · GPT-5.4-Mini + SEARXNG Live Web' },
  { id: 'powerbrain-gpt5', site: 'powerbrainai.com', kind: 'chat', name: 'PowerBrain AI · GPT-5 Direct' },
  { id: 'aitopia-direct', site: 'extensions.aitopia.ai', kind: 'chat', name: 'Aitopia AI Extension Direct' },
  { id: 'freeaionline-grok4', site: 'free-ai-online.com', kind: 'chat', name: 'Free-AI-Online · Grok 4 Direct' },
  { id: 'pollinations-cluster', site: 'pollinations.g4f.space', kind: 'chat', name: 'Pollinations G4F Cluster · GPT-OSS 120B' },
  { id: 'pollinations-text', site: 'text.pollinations.ai', kind: 'chat', name: 'Pollinations Text · OpenAI Fast' },
  { id: 'deepai-chat', site: 'deepai.org', kind: 'chat', name: 'DeepAI Direct Hash Scraper' },
  { id: 'deepai-online', site: 'deepai.org', kind: 'search', name: 'DeepAI Live Online Search' },
  { id: 'kilo-nemotron', site: 'kilo.ai', kind: 'reasoning', name: 'Kilo Gateway · NVIDIA Nemotron 3.5 Super 120B' },
  { id: 'kilo-beam', site: 'kilo.ai', kind: 'coding', name: 'Kilo Gateway · Reflection Beam 1M Coder' },
  { id: 'cohere-command-a', site: 'coherelabs-c4ai-command.hf.space', kind: 'chat', name: 'Cohere Labs Official · Command-A 2025' },
  { id: 'llm7-direct', site: 'api.llm7.io', kind: 'coding', name: 'LLM7.io · Codestral Direct' },
  { id: 'yqcloud', site: 'chat9.yqcloud.top', kind: 'chat', name: 'YQCloud GPT Network Stream' },
  { id: 'bfl-flux-schnell', site: 'black-forest-labs-flux-1-schnell.hf.space', kind: 'image', name: 'Black Forest Labs · FLUX.1-Schnell 1024px' },
  { id: 'evalstate-flux', site: 'evalstate-flux1-schnell.hf.space', kind: 'image', name: 'Evalstate · FLUX.1-Schnell Fast ZeroGPU' },
  { id: 'qwen-image-fast', site: 'mcp-tools-qwen-image-fast.hf.space', kind: 'image', name: 'Alibaba · Qwen-Image-Fast Lightning' },
  { id: 'aihorde-image', site: 'stablehorde.net', kind: 'image', name: 'AI Horde · Distributed GPU Diffusion' },
  { id: 'neural-voice', site: 'gen.pollinations.ai', kind: 'audio', name: 'Neural AI Voice (Coral, Nova, Onyx, Sage, Alloy)' },
];

async function dispatchWebAiProvider({
  provider,
  model,
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
    case 'opencode':
    case 'opencode-deepseek':
      return scrapeOpenCodeZen({
        text: inputText,
        system,
        model: model || 'deepseek-v4.1-flash-free',
      });

    case 'opencode-glm53':
      return scrapeOpenCodeZen({
        text: inputText,
        system,
        model: 'glm-5.3-flash-free',
      });

    case 'opencode-flint':
      return scrapeOpenCodeZen({
        text: inputText,
        system,
        model: 'flint-40b-free',
      });

    case 'opencode-pickle':
      return scrapeOpenCodeZen({
        text: inputText,
        system,
        model: 'big-pickle',
      });

    case 'fx':
    case 'fx-glm52':
      return scrapeFxShGateway({
        text: inputText,
        system,
        model: model || 'zai/glm-5.2',
      });

    case 'isou':
    case 'isou-search':
      return scrapeIsouChat({
        text: inputText,
        system,
        model: model || 'gpt-5.4-mini',
      });

    case 'powerbrain':
    case 'powerbrain-gpt5':
      return scrapePowerBrainAi({
        text: inputText,
        system,
        model: model || 'gpt-5',
      });

    case 'aitopia':
    case 'aitopia-direct':
      return scrapeAitopiaAi({
        text: inputText,
        system,
        model: model || 'AITOPIA',
      });

    case 'freeaionline':
    case 'freeaionline-grok4':
      return scrapeFreeAiOnlineGrok({
        text: inputText,
        system,
      });

    case 'pollinations-cluster':
      return scrapePollinationsText({
        text: inputText,
        system,
        model: model || 'auto',
        useCluster: true,
      });

    case 'pollinations-text':
      return scrapePollinationsText({
        text: inputText,
        system,
        model: model || 'openai',
        useCluster: false,
      });

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

    case 'yqcloud':
      return scrapeYqCloud({ text: inputText, system });

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

    case 'evalstate-flux': {
      const seed = Math.floor(Math.random() * 1000000);
      try {
        return await callGradioImageSpace({
          spaceSlug: 'evalstate/flux1_schnell',
          spaceHost: 'evalstate-flux1-schnell.hf.space',
          endpoint: '/infer',
          data: [inputText, seed, true, dims.width, dims.height, 4],
          timeoutMs: 34000,
        });
      } catch {
        return callGradioImageSpace({
          spaceSlug: 'black-forest-labs/FLUX.1-schnell',
          spaceHost: 'black-forest-labs-flux-1-schnell.hf.space',
          endpoint: '/infer',
          data: [inputText, seed, true, dims.width, dims.height, 4],
          timeoutMs: 34000,
        });
      }
    }

    case 'qwen-image-fast':
      return callGradioImageSpace({
        spaceSlug: 'mcp-tools/Qwen-Image-Fast',
        spaceHost: 'mcp-tools-qwen-image-fast.hf.space',
        endpoint: '/generate_image',
        data: [inputText, 0, true, dims.aspect, 1.0, 8],
        timeoutMs: 36000,
      });

    case 'aihorde-image':
      return scrapeAiHordeImage({ prompt: inputText, ratio });

    case 'openai-fm':
    case 'neural-voice': {
      const audio = await fetchNeuralVoiceAudio({ text: inputText, voice });
      const streamUrl = `/api/webai?provider=neural-voice&stream=1&voice=${encodeURIComponent(
        audio.voice
      )}&text=${encodeURIComponent(inputText)}`;
      return {
        provider: audio.source,
        model: `neural-tts (${audio.voice})`,
        audioUrl: streamUrl,
        bytes: audio.buffer.byteLength,
        contentType: audio.contentType,
        result: `Audio neural berhasil dibuat oleh ${audio.source} (${audio.voice}, ${(
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

  // 2. Direct binary audio stream for Neural TTS (<audio> & 1-click download)
  if (
    req.method === 'GET' &&
    ['openai-fm', 'neural-voice'].includes(String(query.provider || '').toLowerCase()) &&
    query.stream === '1'
  ) {
    try {
      const text = String(query.text || query.q || 'Halo dari NodataGPT karya Mr.NODATA.').trim();
      const voice = String(query.voice || 'coral').trim();
      const audio = await fetchNeuralVoiceAudio({ text, voice });
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
        error: err instanceof Error ? err.message : 'Gagal streaming audio neural.',
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

  const isImageProvider =
    ['bfl-flux-schnell', 'evalstate-flux', 'qwen-image-fast', 'aihorde-image'].includes(
      provider.toLowerCase()
    ) || mode === 'image';

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
