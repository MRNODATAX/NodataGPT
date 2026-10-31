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
      /\b(?:Halo,?\s*)?(?:saya|aku)\s+(?:adalah\s+|bernama\s+)?(?:ChatGPT|Standard AI Chat|DeepAI|Command[-\s]?A|Cohere|Claude|Gemini|Gemma|DeepSeek|Qwen(?:\s*\d+(?:\.\d+)?)?|Grok|Step|Kimi|Mistral|Aitopia)(?:,\s*(?:sebuah\s+|model\s+|asisten\s+)[^.\n]*?(?:OpenAI|Anthropic|Google(?:\s*DeepMind)?|Alibaba(?:\s*Cloud)?|DeepSeek|Cohere|xAI|Moonshot|Mistral|DeepAI))?/gi,
      (match) => {
        const startsHalo = /^halo/i.test(match);
        return `${startsHalo ? 'Halo, ' : ''}saya NodataGPT, asisten AI cerdas yang dibuat oleh Mr.NODATA`;
      }
    )
    .replace(
      /\b(?:Nama saya|Nama aku)\s+(?:adalah\s+)?(?:ChatGPT|Standard AI Chat|DeepAI|Command[-\s]?A|Cohere|Claude|Gemini|Gemma|DeepSeek|Qwen|Grok|Step|Kimi|Mistral|Aitopia)\b/gi,
      'Nama saya NodataGPT'
    )
    .replace(
      /\b(?:dibuat|dikembangkan|diciptakan|dilatih)\s+oleh\s+(?:OpenAI|Anthropic|Google(?:\s*DeepMind)?|Alibaba(?:\s*Cloud)?|Tim\s+Qwen|DeepSeek|Cohere|xAI|Moonshot(?:\s*AI)?|Mistral(?:\s*AI)?|Zhipu(?:\s*AI)?|DeepAI|StepFun)\b/gi,
      'dibuat dan dikembangkan oleh Mr.NODATA'
    )
    .replace(
      /\b(?:I am|I'm)\s+(?:ChatGPT|Standard AI Chat|DeepAI|Command[-\s]?A|Cohere|Claude|Gemini|Gemma|DeepSeek|Qwen|Grok|Step|Kimi|Mistral)\b/gi,
      'I am NodataGPT (created by Mr.NODATA)'
    )
    .replace(
      /\b(?:created|developed|built|made|trained)\s+by\s+(?:OpenAI|Anthropic|Google(?:\s*DeepMind)?|Alibaba(?:\s*Cloud)?|DeepSeek|Cohere|xAI|Moonshot(?:\s*AI)?|Mistral(?:\s*AI)?|Zhipu(?:\s*AI)?|DeepAI|StepFun)\b/gi,
      'created and developed by Mr.NODATA'
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
  if (clean === '16:9') {
    return {
      width: 1024,
      height: 576,
      aspect: '16:9',
      zRes: '1280x720 ( 16:9 )',
    };
  }
  if (clean === '9:16') {
    return {
      width: 576,
      height: 1024,
      aspect: '9:16',
      zRes: '720x1280 ( 9:16 )',
    };
  }
  if (clean === '4:3') {
    return {
      width: 1024,
      height: 768,
      aspect: '4:3',
      zRes: '1152x864 ( 4:3 )',
    };
  }
  if (clean === '3:4') {
    return {
      width: 768,
      height: 1024,
      aspect: '3:4',
      zRes: '864x1152 ( 3:4 )',
    };
  }
  return {
    width: 1024,
    height: 1024,
    aspect: '1:1',
    zRes: '1024x1024 ( 1:1 )',
  };
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
      const explicitErr =
        (typeof json?.error === 'string' && json.error.trim()) ||
        (json?.error && typeof json.error === 'object' && json.error.message) ||
        '';
      if (explicitErr) {
        throw new Error(`Upstream error: ${String(explicitErr).slice(0, 140)}`);
      }
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
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Upstream error:')) {
        throw e;
      }
      // fall through to SSE line parser
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
        choice?.delta?.content ?? choice?.message?.content ?? obj?.content ?? '';
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
// 1. EXTENSIONS.AITOPIA.AI — Aitopia AI Chrome Extension Direct Scraper
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
// 2. DEEPAI.ORG — Dynamic TryIt Hash Scraper (Chat & Live Online Search)
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
        content: buildCombinedPrompt(system, text),
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
// 3 & 4. KILO.AI & API.LLM7.IO — Keyless OpenAI-Compatible Gateways
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
        Accept: 'application/json, text/event-stream, */*',
        'Content-Type': 'application/json',
        Origin: originUrl,
        Referer: `${originUrl.replace(/\/$/, '')}/`,
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
// 5. YQCLOUD / BINJIE (chat9.yqcloud.top -> api.binjie.fun)
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
// 6. COHERE LABS OFFICIAL CHAT UI (coherelabs-c4ai-command.hf.space)
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
// 7–15. HUGGING FACE OFFICIAL SPACES (Gradio v5 Text/Coding & Image Studios)
//       - huggingface-projects/gemma-4-12b-it (Google Gemma 4 12B IT + Thinking)
//       - huggingface-projects/gemma-3-12b-it (Google Gemma 3 12B IT)
//       - Qwen/Qwen3-Coder-WebDev (Alibaba Qwen3 Coder WebDev + Artifact Code)
//       - vml12/qwen-ai-chatbot (Qwen CPU Chatbot + Reasoning)
//       - black-forest-labs/FLUX.1-schnell (Official BFL FLUX.1 Schnell 1024px)
//       - black-forest-labs/FLUX.2-klein-9B (Official BFL FLUX.2 Klein 9B 4-step)
//       - evalstate/flux1_schnell (Evalstate FLUX.1 Schnell Fast)
//       - mcp-tools/Qwen-Image-Fast (Alibaba Qwen-Image Lightning 8-step)
//       - Tongyi-MAI/Z-Image-Turbo (Official Tongyi-MAI Z-Image-Turbo 8-step)
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

async function callGradioSpaceRaw({
  spaceSlug,
  spaceHost,
  endpoint,
  data,
  timeoutMs = 34000,
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
  let completePayload = null;
  let lastGeneratingPayload = null;

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
      try {
        const parsed = JSON.parse(dataStr);
        if (currentEvent === 'complete') {
          completePayload = parsed;
        } else {
          lastGeneratingPayload = parsed;
        }
      } catch {
        // ignore non-json SSE data
      }
    }
  }

  const finalPayload = completePayload ?? lastGeneratingPayload;
  if (finalPayload === null || finalPayload === undefined) {
    throw new Error(
      `${spaceHost} tidak mengembalikan hasil${lastError ? `: ${lastError.slice(0, 140)}` : '.'}`
    );
  }

  return { payload: finalPayload, spaceOrigin };
}

function extractGradioTextPayload(payload) {
  if (!payload) return { text: '', thinking: '' };

  if (typeof payload === 'string') {
    return { text: payload.trim(), thinking: '' };
  }

  if (Array.isArray(payload)) {
    // Qwen3-Coder-WebDev returns [explanationMarkdown, generatedCode]
    if (
      payload.length === 2 &&
      typeof payload[0] === 'string' &&
      typeof payload[1] === 'string' &&
      (payload[0].trim() || payload[1].trim())
    ) {
      const exp = payload[0].trim();
      const code = payload[1].trim();
      if (code && !exp.includes('```')) {
        const lang = /^\s*<!doctype html|^\s*<html/i.test(code) ? 'html' : '';
        return {
          text: exp ? `${exp}\n\n\`\`\`${lang}\n${code}\n\`\`\`` : `\`\`\`${lang}\n${code}\n\`\`\``,
          thinking: '',
        };
      }
      return { text: exp || code, thinking: '' };
    }

    for (const item of payload) {
      const extracted = extractGradioTextPayload(item);
      if (extracted.text) return extracted;
    }
    return { text: '', thinking: '' };
  }

  if (typeof payload === 'object') {
    const content =
      payload.content ||
      payload.response ||
      payload.reply ||
      payload.text ||
      payload.output ||
      payload.message ||
      '';
    const reasoning =
      payload.reasoning || payload.thinking || payload.thought || '';
    if (typeof content === 'string' && content.trim()) {
      return {
        text: content.trim(),
        thinking: typeof reasoning === 'string' ? reasoning.trim() : '',
      };
    }
  }

  return { text: '', thinking: '' };
}

async function scrapeGradioTextSpace({
  spaceSlug,
  spaceHost,
  modelLabel,
  endpoint,
  data,
  timeoutMs = 30000,
}) {
  const { payload } = await callGradioSpaceRaw({
    spaceSlug,
    spaceHost,
    endpoint,
    data,
    timeoutMs,
  });

  const parsed = extractGradioTextPayload(payload);
  if (!parsed.text) {
    throw new Error(`${spaceHost} tidak mengembalikan teks jawaban.`);
  }

  return {
    provider: spaceHost,
    model: modelLabel || spaceSlug,
    result: normalizePersonaReply(parsed.text),
    ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
  };
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
  const { payload, spaceOrigin } = await callGradioSpaceRaw({
    spaceSlug,
    spaceHost,
    endpoint,
    data,
    timeoutMs,
  });

  const url = extractGradioFileUrl(payload, spaceOrigin);
  if (!url) {
    throw new Error(`${spaceHost} tidak mengembalikan URL gambar.`);
  }

  return {
    provider: spaceHost,
    model: spaceSlug,
    url,
  };
}

// ============================================================================
// 16. NEURAL VOICE TTS (tiktok-tts.weilnet.workers.dev in IAD + Multi-Voice)
// ============================================================================
const TIKTOK_VOICE_MAP = {
  coral: 'id_001',
  nova: 'en_us_001',
  onyx: 'en_us_006',
  sage: 'en_uk_001',
  alloy: 'en_us_010',
  rachel: 'en_au_001',
  adam: 'en_us_009',
  bella: 'jp_001',
  josh: 'en_uk_003',
  id_001: 'id_001',
};

function splitUtf8Chunks(text, maxBytes = 260) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (Buffer.byteLength(candidate, 'utf8') <= maxBytes) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      if (Buffer.byteLength(word, 'utf8') <= maxBytes) {
        current = word;
      } else {
        chunks.push(word.slice(0, Math.floor(maxBytes / 2)));
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 5);
}

async function fetchNeuralVoiceAudio({ text, voice = 'coral' }) {
  const cleanVoice = String(voice || 'coral').toLowerCase();
  const cleanText = String(text || '').trim().slice(0, 1200);

  const hasIndonesianHint = /\b(?:halo|saya|aku|kamu|yang|dan|untuk|dengan|dari|tidak|bisa|ini|itu|selamat)\b/i.test(
    cleanText
  );
  const ttVoice =
    cleanVoice === 'coral' && hasIndonesianHint
      ? 'id_001'
      : TIKTOK_VOICE_MAP[cleanVoice] || 'id_001';

  const parts = splitUtf8Chunks(cleanText, 260);
  const buffers = [];

  for (const part of parts) {
    const ttRes = await fetchWithTimeout(
      'https://tiktok-tts.weilnet.workers.dev/api/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://weilbyte.github.io',
          Referer: 'https://weilbyte.github.io/',
          'User-Agent': CHROME_UA,
        },
        body: JSON.stringify({
          text: part,
          voice: ttVoice,
        }),
      },
      14000
    );

    if (!ttRes.ok) {
      throw new Error(`Neural TTS HTTP ${ttRes.status}`);
    }
    const ttJson = await ttRes.json();
    if (!ttJson?.data || typeof ttJson.data !== 'string') {
      throw new Error(ttJson?.error || 'Neural TTS gagal menghasilkan MP3.');
    }
    buffers.push(Buffer.from(ttJson.data, 'base64'));
  }

  const combined = Buffer.concat(buffers);
  if (combined.byteLength < 256) {
    throw new Error('Neural Voice mengembalikan audio kosong.');
  }

  return {
    buffer: combined,
    contentType: 'audio/mpeg',
    voice: cleanVoice,
    source: 'tiktok-tts.weilnet.workers.dev',
  };
}

// ============================================================================
// UNIFIED PROVIDER DIRECTORY & DISPATCHER (16 Distinct Verified Websites)
// ============================================================================
export const WEBAI_SCRAPER_DIRECTORY = [
  { id: 'gemma4-12b', site: 'huggingface-projects-gemma-4-12b-it.hf.space', kind: 'chat', name: 'Google Gemma 4 12B IT (Official Space)' },
  { id: 'gemma4-thinking', site: 'huggingface-projects-gemma-4-12b-it.hf.space', kind: 'reasoning', name: 'Google Gemma 4 12B Thinking (Reasoning)' },
  { id: 'gemma3-12b', site: 'huggingface-projects-gemma-3-12b-it.hf.space', kind: 'chat', name: 'Google Gemma 3 12B IT (Official Space)' },
  { id: 'qwen3-coder-webdev', site: 'qwen-qwen3-coder-webdev.hf.space', kind: 'coding', name: 'Alibaba Qwen3 Coder WebDev (Official Space)' },
  { id: 'qwen-cpu-chat', site: 'vml12-qwen-ai-chatbot.hf.space', kind: 'chat', name: 'Qwen AI Chatbot Stateless Space' },
  { id: 'aitopia-direct', site: 'extensions.aitopia.ai', kind: 'chat', name: 'Aitopia AI Extension Direct' },
  { id: 'deepai-chat', site: 'deepai.org', kind: 'chat', name: 'DeepAI Direct Hash Scraper' },
  { id: 'deepai-online', site: 'deepai.org', kind: 'search', name: 'DeepAI Live Online Search' },
  { id: 'kilo-nemotron', site: 'kilo.ai', kind: 'reasoning', name: 'Kilo Gateway · NVIDIA Nemotron 3.5 Super 120B' },
  { id: 'kilo-beam', site: 'kilo.ai', kind: 'coding', name: 'Kilo Gateway · Reflection Beam 1M Coder' },
  { id: 'cohere-command-a', site: 'coherelabs-c4ai-command.hf.space', kind: 'chat', name: 'Cohere Labs Official · Command-A 2025' },
  { id: 'llm7-direct', site: 'api.llm7.io', kind: 'coding', name: 'LLM7.io · Mistral Codestral Direct' },
  { id: 'yqcloud', site: 'chat9.yqcloud.top', kind: 'search', name: 'YQCloud Live Web GPT Stream' },
  { id: 'bfl-flux-schnell', site: 'black-forest-labs-flux-1-schnell.hf.space', kind: 'image', name: 'Black Forest Labs · FLUX.1-Schnell 1024px' },
  { id: 'bfl-flux2-klein', site: 'black-forest-labs-flux-2-klein-9b.hf.space', kind: 'image', name: 'Black Forest Labs · FLUX.2 Klein 9B (4-Step)' },
  { id: 'evalstate-flux', site: 'evalstate-flux1-schnell.hf.space', kind: 'image', name: 'Evalstate · FLUX.1-Schnell Fast ZeroGPU' },
  { id: 'qwen-image-fast', site: 'mcp-tools-qwen-image-fast.hf.space', kind: 'image', name: 'Alibaba · Qwen-Image-Fast Lightning' },
  { id: 'tongyi-zimage', site: 'tongyi-mai-z-image-turbo.hf.space', kind: 'image', name: 'Alibaba Tongyi-MAI · Z-Image-Turbo Official' },
  { id: 'neural-voice', site: 'tiktok-tts.weilnet.workers.dev', kind: 'audio', name: 'Neural AI Voice (Indo & Multi-Voice MP3)' },
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
  const sysPrompt = String(system || NODATAGPT_DEFAULT_SYSTEM).trim();
  const dims = ratioToDimensions(ratio);

  switch (id) {
    case 'gemma4':
    case 'gemma4-12b':
      return scrapeGradioTextSpace({
        spaceSlug: 'huggingface-projects/gemma-4-12b-it',
        spaceHost: 'huggingface-projects-gemma-4-12b-it.hf.space',
        modelLabel: 'google/gemma-4-12b-it',
        endpoint: '/chat',
        data: [
          inputText,
          null,
          null,
          false,
          1500,
          280,
          sysPrompt,
          0.8,
          0.95,
          64,
          1.0,
        ],
        timeoutMs: 32000,
      });

    case 'gemma4-thinking':
      return scrapeGradioTextSpace({
        spaceSlug: 'huggingface-projects/gemma-4-12b-it',
        spaceHost: 'huggingface-projects-gemma-4-12b-it.hf.space',
        modelLabel: 'google/gemma-4-12b-it (thinking)',
        endpoint: '/chat',
        data: [
          inputText,
          null,
          null,
          true,
          1800,
          280,
          sysPrompt,
          0.8,
          0.95,
          64,
          1.0,
        ],
        timeoutMs: 34000,
      });

    case 'gemma3':
    case 'gemma3-12b':
      return scrapeGradioTextSpace({
        spaceSlug: 'huggingface-projects/gemma-3-12b-it',
        spaceHost: 'huggingface-projects-gemma-3-12b-it.hf.space',
        modelLabel: 'google/gemma-3-12b-it',
        endpoint: '/run',
        data: [{ text: inputText, files: [] }, sysPrompt, 1000],
        timeoutMs: 30000,
      });

    case 'qwen3-coder':
    case 'qwen3-coder-webdev':
      return scrapeGradioTextSpace({
        spaceSlug: 'Qwen/Qwen3-Coder-WebDev',
        spaceHost: 'qwen-qwen3-coder-webdev.hf.space',
        modelLabel: 'Qwen/Qwen3-Coder-WebDev',
        endpoint: '/generate_code',
        data: [inputText, sysPrompt],
        timeoutMs: 34000,
      });

    case 'qwen-cpu-chat':
      return scrapeGradioTextSpace({
        spaceSlug: 'vml12/qwen-ai-chatbot',
        spaceHost: 'vml12-qwen-ai-chatbot.hf.space',
        modelLabel: 'qwen-ai-chatbot',
        endpoint: '/respond',
        data: [
          inputText,
          '',
          sysPrompt,
          'off',
          768,
          0.7,
          0.95,
          20,
          1.0,
          false,
        ],
        timeoutMs: 30000,
      });

    case 'aitopia':
    case 'aitopia-direct':
      return scrapeAitopiaAi({
        text: inputText,
        system: sysPrompt,
        model: model || 'AITOPIA',
      });

    case 'deepai':
    case 'deepai-chat':
      return scrapeDeepAiChat({
        text: inputText,
        system: sysPrompt,
        model: model || 'standard',
      });

    case 'deepai-online':
      return scrapeDeepAiChat({
        text: inputText,
        system: sysPrompt,
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
        system: sysPrompt,
      });

    case 'kilo-nemotron':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: 'nvidia/nemotron-3.5-super-vl:free',
        text: inputText,
        system: sysPrompt,
      });

    case 'kilo-beam':
      return scrapeOpenAiCompatGateway({
        providerName: 'kilo.ai',
        endpointUrl: 'https://api.kilo.ai/api/gateway/chat/completions',
        originUrl: 'https://kilo.ai',
        model: 'reflection/beam-free',
        text: inputText,
        system: sysPrompt,
      });

    case 'llm7':
    case 'llm7-direct':
      return scrapeOpenAiCompatGateway({
        providerName: 'api.llm7.io',
        endpointUrl: 'https://api.llm7.io/v1/chat/completions',
        originUrl: 'https://llm7.io',
        model: model || 'default',
        text: inputText,
        system: sysPrompt,
      });

    case 'yqcloud':
      return scrapeYqCloud({ text: inputText, system: sysPrompt });

    case 'cohere':
    case 'cohere-command-a':
      return scrapeCohereCommand({
        text: inputText,
        system: sysPrompt,
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

    case 'bfl-flux2-klein': {
      const seed = Math.floor(Math.random() * 1000000);
      return callGradioImageSpace({
        spaceSlug: 'black-forest-labs/FLUX.2-klein-9B',
        spaceHost: 'black-forest-labs-flux-2-klein-9b.hf.space',
        endpoint: '/generate',
        data: [
          inputText,
          [],
          'Distilled (4 steps)',
          seed,
          true,
          dims.width,
          dims.height,
          4,
          1.0,
          false,
        ],
        timeoutMs: 36000,
      });
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

    case 'tongyi-zimage':
      return callGradioImageSpace({
        spaceSlug: 'Tongyi-MAI/Z-Image-Turbo',
        spaceHost: 'tongyi-mai-z-image-turbo.hf.space',
        endpoint: '/generate',
        data: [inputText, dims.zRes, 42, 8, 3.0, true, []],
        timeoutMs: 36000,
      });

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
    [
      'bfl-flux-schnell',
      'bfl-flux2-klein',
      'evalstate-flux',
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
