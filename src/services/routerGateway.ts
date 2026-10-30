import type { AppSettings, ChatMessage, RouterPresetId } from '../types/chat';

export const ROUTER_PRIMARY_MODEL_ID = 'custom-ai-router';
export const ROUTER_MODEL_PREFIX = 'router:';
export const ROUTER_IMAGE_MODEL_ID = 'router-image';

export interface RouterPresetOption {
  id: RouterPresetId;
  name: string;
  badge: string;
  defaultBaseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  description: string;
  endpointChips: Array<{ label: string; url: string }>;
  suggestedModels: string[];
}

export const ROUTER_PRESETS: Record<RouterPresetId, RouterPresetOption> = {
  '9router': {
    id: '9router',
    name: '9Router',
    badge: 'Local :20128 / Cloud',
    defaultBaseUrl: 'http://localhost:20128/v1',
    defaultModel: 'cc/claude-opus-4-7',
    keyPlaceholder: 'sk_9router... (opsional bila lokal REQUIRE_API_KEY=false)',
    description:
      'Universal AI Router (decolua/9router) kompatibel OpenAI /v1/chat/completions & /v1/models. Mendukung CLI lokal port 20128, 9router.com, maupun VPS/tunnel.',
    endpointChips: [
      { label: '9Router Lokal (:20128)', url: 'http://localhost:20128/v1' },
      { label: '9Router Fork (:20127)', url: 'http://localhost:20127/v1' },
      { label: '9Router Cloud', url: 'https://9router.com/v1' },
    ],
    suggestedModels: [
      'cc/claude-opus-4-7',
      'kr/claude-sonnet-4.5',
      'if/kimi-k2-thinking',
      'if/glm-4.7',
      'premium-coding',
    ],
  },
  omniroute: {
    id: 'omniroute',
    name: 'OmniRoute',
    badge: 'Smart Combo auto/*',
    defaultBaseUrl: 'http://localhost:20128/v1',
    defaultModel: 'auto',
    keyPlaceholder: 'sk_omniroute... / sk_live_... (opsional untuk lokal)',
    description:
      'AI Gateway 4-Tier (diegosouzapw/OmniRoute) dengan kombo pintar zero-config (auto, auto/coding, auto/fast, auto/smart), /v1/models, & /v1/images/generations.',
    endpointChips: [
      { label: 'OmniRoute Lokal (:20128)', url: 'http://localhost:20128/v1' },
      { label: 'OmniRoute Cloud', url: 'https://omniroute.dev/v1' },
      { label: 'OmniRouter Hosted', url: 'https://omnirouter.li/v1' },
    ],
    suggestedModels: [
      'auto',
      'auto/coding',
      'auto/fast',
      'auto/smart',
      'auto/cheap',
      'cc/claude-opus-4-7',
      'if/kimi-k2-thinking',
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Cloud Multi-Provider',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    keyPlaceholder: 'sk-or-v1-...',
    description:
      'Gateway cloud OpenRouter (/api/v1) dengan akses ratusan model OpenAI, Anthropic, Google, DeepSeek, Qwen, dan model :free.',
    endpointChips: [
      { label: 'OpenRouter API v1', url: 'https://openrouter.ai/api/v1' },
    ],
    suggestedModels: [
      'openrouter/auto',
      'deepseek/deepseek-r1:free',
      'qwen/qwen3-coder:free',
      'google/gemini-2.5-flash',
      'anthropic/claude-sonnet-4.5',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Router / VPS',
    badge: 'OpenAI-Compatible',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'auto',
    keyPlaceholder: 'sk-... (atau kosongkan bila tanpa autentikasi)',
    description:
      'Gateway OpenAI-compatible kustom seperti LiteLLM, NewAPI/OneAPI, Ollama (:11434/v1), LM Studio (:1234/v1), Groq, atau reverse proxy VPS sendiri.',
    endpointChips: [
      { label: 'Ollama (:11434)', url: 'http://localhost:11434/v1' },
      { label: 'LM Studio (:1234)', url: 'http://localhost:1234/v1' },
      { label: 'Groq OpenAI', url: 'https://api.groq.com/openai/v1' },
    ],
    suggestedModels: ['auto', 'gpt-4o-mini', 'llama3.3', 'qwen2.5-coder'],
  },
};

export function cleanRouterApiKey(rawKey: string): string {
  const trimmed = (rawKey || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/^Bearer\s+/i, '').trim();
}

export function normalizeRouterBaseUrl(
  rawUrl: string,
  preset: RouterPresetId = '9router'
): string {
  const fallback = ROUTER_PRESETS[preset]?.defaultBaseUrl || 'http://localhost:20128/v1';
  let candidate = (rawUrl || '').trim();
  if (!candidate) return fallback;

  if (!/^https?:\/\//i.test(candidate)) {
    const looksLocal =
      /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(
        candidate
      );
    candidate = `${looksLocal ? 'http' : 'https'}://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    let path = parsed.pathname.replace(/\/+$/, '');

    // Strip endpoint suffixes if user pasted full endpoint URL
    const endpointSuffixes = [
      '/chat/completions',
      '/images/generations',
      '/videos/generations',
      '/audio/speech',
      '/responses',
      '/messages',
      '/models',
    ];
    for (const suffix of endpointSuffixes) {
      if (path.toLowerCase().endsWith(suffix)) {
        path = path.slice(0, path.length - suffix.length);
        break;
      }
    }

    if (!path) {
      if (parsed.hostname.toLowerCase().includes('openrouter.ai')) {
        path = '/api/v1';
      } else {
        path = '/v1';
      }
    }

    parsed.pathname = path;
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function isLocalOrPrivateRouterUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:') return true;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.ts.net') ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

export function isRouterConfiguredAndReady(settings: AppSettings): boolean {
  if (!settings.routerEnabled) return false;
  const normalizedBase = normalizeRouterBaseUrl(
    settings.routerBaseUrl,
    settings.routerPreset
  );
  if (!normalizedBase) return false;

  const hasKey = cleanRouterApiKey(settings.routerApiKey).length > 0;
  const isHeaderlessTokenUrl = /\/vscode\/[^/]+/i.test(normalizedBase);
  const isLocal = isLocalOrPrivateRouterUrl(normalizedBase);

  return hasKey || isHeaderlessTokenUrl || isLocal;
}

export function isRouterModelSelection(modelId: string): boolean {
  return (
    modelId === ROUTER_PRIMARY_MODEL_ID ||
    modelId.startsWith(ROUTER_MODEL_PREFIX)
  );
}

export function resolveRouterModelName(
  selectedModelId: string,
  settings: AppSettings
): string {
  if (selectedModelId.startsWith(ROUTER_MODEL_PREFIX)) {
    const explicit = selectedModelId.slice(ROUTER_MODEL_PREFIX.length).trim();
    if (explicit) return explicit;
  }
  const configured = (settings.routerModel || '').trim();
  if (configured) return configured;
  return ROUTER_PRESETS[settings.routerPreset]?.defaultModel || 'auto';
}

export function getRouterDisplayLabel(settings: AppSettings): string {
  return ROUTER_PRESETS[settings.routerPreset]?.name || 'AI Router';
}

function buildRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/event-stream',
  };
  const cleanKey = cleanRouterApiKey(apiKey);
  if (cleanKey) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  }
  return headers;
}

interface RawRouterTransportResult {
  ok: boolean;
  status: number;
  body: string;
  usedRelay: boolean;
  error?: string;
}

async function performRouterHttpCall({
  url,
  method,
  headers,
  body,
  timeoutMs = 34000,
  signal,
}: {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<RawRouterTransportResult> {
  const isLocal = isLocalOrPrivateRouterUrl(url);

  // 1. Always attempt direct browser fetch first (mandatory for localhost:20128, lowest latency for cloud)
  if (typeof window !== 'undefined') {
    const directAbort = new AbortController();
    const timer = window.setTimeout(() => directAbort.abort(), timeoutMs);
    const onParentAbort = () => directAbort.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const reqHeaders: Record<string, string> = { ...headers };
      if (method === 'POST') {
        reqHeaders['Content-Type'] = 'application/json';
      }

      const directRes = await fetch(url, {
        method,
        headers: reqHeaders,
        body: method === 'POST' ? body : undefined,
        signal: directAbort.signal,
      });

      const text = await directRes.text();
      return {
        ok: directRes.ok,
        status: directRes.status,
        body: text,
        usedRelay: false,
        error: directRes.ok ? undefined : extractRouterErrorMessage(text, directRes.status),
      };
    } catch (err) {
      if (signal?.aborted) {
        throw new DOMException('Permintaan dibatalkan oleh pengguna.', 'AbortError');
      }

      if (isLocal) {
        const isHttpsOrigin =
          typeof window !== 'undefined' && window.location.protocol === 'https:';
        const hint = isHttpsOrigin
          ? 'Pastikan aplikasi 9Router / OmniRoute aktif di perangkat Anda (mis. `9router` atau `omniroute` pada port 20128) dan izinkan akses jaringan lokal di browser, atau gunakan URL HTTPS Tunnel/Cloud.'
          : 'Pastikan server lokal 9Router / OmniRoute sedang berjalan di port yang sesuai.';
        return {
          ok: false,
          status: 0,
          body: '',
          usedRelay: false,
          error: `Tidak dapat menjangkau router lokal (${url}). ${hint}`,
        };
      }
      // Public HTTPS endpoint hit CORS or network block in browser -> fall through to /api/proxy relay
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  if (isLocal) {
    return {
      ok: false,
      status: 0,
      body: '',
      usedRelay: false,
      error: `Endpoint lokal (${url}) hanya dapat diakses langsung dari browser perangkat Anda.`,
    };
  }

  // 2. Cloud HTTPS CORS Relay via /api/proxy (routerRelay: true)
  const relayHeaders: Record<string, string> = { ...headers };
  if (method === 'POST') {
    relayHeaders['Content-Type'] = 'application/json';
  }

  const proxyRes = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      targetUrl: url,
      method,
      headers: relayHeaders,
      body: method === 'POST' ? body : undefined,
      timeoutMs,
      routerRelay: true,
    }),
    signal,
  });

  const proxyJson = (await proxyRes.json()) as {
    ok?: boolean;
    status?: number;
    body?: string;
    error?: string;
  };

  const upstreamBody = typeof proxyJson.body === 'string' ? proxyJson.body : '';
  const status = Number(proxyJson.status) || proxyRes.status;
  const ok = Boolean(proxyRes.ok && proxyJson.ok);

  return {
    ok,
    status,
    body: upstreamBody,
    usedRelay: true,
    error: ok
      ? undefined
      : proxyJson.error || extractRouterErrorMessage(upstreamBody, status),
  };
}

function extractRouterErrorMessage(rawBody: string, status: number): string {
  const trimmed = (rawBody || '').trim();
  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: string | { message?: string; code?: string };
        message?: string;
        detail?: string;
      };
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim();
      }
      if (
        parsed.error &&
        typeof parsed.error === 'object' &&
        typeof parsed.error.message === 'string'
      ) {
        return parsed.error.message.trim();
      }
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
    } catch {
      // Plain text error body
    }
    if (trimmed.length <= 200 && !trimmed.startsWith('<!DOCTYPE')) {
      return trimmed;
    }
  }
  if (status === 401 || status === 403) {
    return `Autentikasi AI Router ditolak (HTTP ${status}). Periksa kembali API Key Anda.`;
  }
  if (status === 404) {
    return 'Endpoint AI Router tidak ditemukan (HTTP 404). Pastikan Base URL diakhiri /v1.';
  }
  if (status === 429) {
    return 'Kuota / rate-limit pada AI Router sedang penuh (HTTP 429).';
  }
  return `AI Router mengembalikan status HTTP ${status || 'gagal'}.`;
}

export interface RouterModelsDiscoveryResult {
  ok: boolean;
  models: string[];
  normalizedBaseUrl: string;
  latencyMs: number;
  usedRelay: boolean;
  error?: string;
}

export async function discoverRouterModels({
  baseUrl,
  apiKey,
  preset = '9router',
  signal,
}: {
  baseUrl: string;
  apiKey: string;
  preset?: RouterPresetId;
  signal?: AbortSignal;
}): Promise<RouterModelsDiscoveryResult> {
  const startedAt = Date.now();
  const normalizedBaseUrl = normalizeRouterBaseUrl(baseUrl, preset);
  const modelsUrl = `${normalizedBaseUrl}/models`;

  const res = await performRouterHttpCall({
    url: modelsUrl,
    method: 'GET',
    headers: buildRouterHeaders(apiKey),
    timeoutMs: 18000,
    signal,
  });

  const latencyMs = Date.now() - startedAt;

  if (!res.ok) {
    return {
      ok: false,
      models: [],
      normalizedBaseUrl,
      latencyMs,
      usedRelay: res.usedRelay,
      error: res.error || 'Gagal memuat daftar model dari /v1/models.',
    };
  }

  const discovered = new Set<string>();
  try {
    const parsed = JSON.parse(res.body) as {
      data?: unknown[];
      models?: unknown[];
    };
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data)
        ? parsed.data
        : Array.isArray(parsed?.models)
          ? parsed.models
          : [];

    for (const item of list) {
      if (typeof item === 'string' && item.trim()) {
        discovered.add(item.trim());
      } else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const id =
          (typeof rec.id === 'string' && rec.id.trim()) ||
          (typeof rec.name === 'string' && rec.name.trim()) ||
          (typeof rec.model === 'string' && rec.model.trim()) ||
          '';
        if (id) discovered.add(id);
      }
    }
  } catch {
    return {
      ok: false,
      models: [],
      normalizedBaseUrl,
      latencyMs,
      usedRelay: res.usedRelay,
      error: 'Respons /v1/models bukan format JSON OpenAI yang valid.',
    };
  }

  return {
    ok: true,
    models: Array.from(discovered).slice(0, 120),
    normalizedBaseUrl,
    latencyMs,
    usedRelay: res.usedRelay,
  };
}

function splitEmbeddedThinkTags(rawText: string): {
  content: string;
  thinkingContent?: string;
} {
  const thinkBlocks: string[] = [];
  const cleaned = rawText
    .replace(/<think>([\s\S]*?)<\/think>/gi, (_, inner: string) => {
      if (inner && inner.trim()) {
        thinkBlocks.push(inner.trim());
      }
      return '';
    })
    .trim();

  return {
    content: cleaned,
    thinkingContent: thinkBlocks.length > 0 ? thinkBlocks.join('\n\n') : undefined,
  };
}

function coerceMessageContent(val: unknown): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const rec = part as Record<string, unknown>;
          if (typeof rec.text === 'string') return rec.text;
          if (typeof rec.content === 'string') return rec.content;
        }
        return '';
      })
      .join('');
  }
  return '';
}

export function parseRouterChatResponse(rawBody: string): {
  content: string;
  thinkingContent?: string;
} {
  const trimmed = (rawBody || '').trim();
  if (!trimmed) return { content: '' };

  // 1. Handle SSE stream payloads (`data: {...}`) — used by 9router.com & streaming gateways
  if (trimmed.includes('data:') && !trimmed.startsWith('{')) {
    let contentAcc = '';
    let reasoningAcc = '';

    const lines = trimmed.split(/\r?\n/);
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('data:')) continue;
      const payload = cleanLine.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{
            delta?: {
              content?: unknown;
              reasoning_content?: string;
              reasoning?: string;
            };
            message?: {
              content?: unknown;
              reasoning_content?: string;
            };
          }>;
          type?: string;
          delta?: { text?: string; thinking?: string };
        };

        const choice = chunk.choices?.[0];
        if (choice?.delta) {
          contentAcc += coerceMessageContent(choice.delta.content);
          if (typeof choice.delta.reasoning_content === 'string') {
            reasoningAcc += choice.delta.reasoning_content;
          } else if (typeof choice.delta.reasoning === 'string') {
            reasoningAcc += choice.delta.reasoning;
          }
        } else if (choice?.message) {
          contentAcc += coerceMessageContent(choice.message.content);
          if (typeof choice.message.reasoning_content === 'string') {
            reasoningAcc += choice.message.reasoning_content;
          }
        } else if (chunk.delta) {
          if (typeof chunk.delta.text === 'string') contentAcc += chunk.delta.text;
          if (typeof chunk.delta.thinking === 'string')
            reasoningAcc += chunk.delta.thinking;
        }
      } catch {
        // Ignore malformed SSE comment/heartbeat line
      }
    }

    const split = splitEmbeddedThinkTags(contentAcc);
    const mergedThinking = [reasoningAcc.trim(), split.thinkingContent || '']
      .filter(Boolean)
      .join('\n\n');

    return {
      content: split.content,
      thinkingContent: mergedThinking || undefined,
    };
  }

  // 2. Handle Standard OpenAI / Responses / Anthropic JSON payloads
  try {
    const parsed = JSON.parse(trimmed) as {
      choices?: Array<{
        message?: {
          content?: unknown;
          reasoning_content?: string;
          reasoning?: string;
        };
        text?: string;
      }>;
      output_text?: string;
      output?: Array<{
        content?: Array<{ text?: string }>;
      }>;
      content?: unknown;
    };

    const firstChoice = parsed.choices?.[0];
    if (firstChoice) {
      const rawMsg =
        coerceMessageContent(firstChoice.message?.content) ||
        (typeof firstChoice.text === 'string' ? firstChoice.text : '');
      const reasoning =
        firstChoice.message?.reasoning_content || firstChoice.message?.reasoning || '';
      const split = splitEmbeddedThinkTags(rawMsg);
      const mergedThinking = [reasoning.trim(), split.thinkingContent || '']
        .filter(Boolean)
        .join('\n\n');

      return {
        content: split.content,
        thinkingContent: mergedThinking || undefined,
      };
    }

    if (typeof parsed.output_text === 'string' && parsed.output_text.trim()) {
      return splitEmbeddedThinkTags(parsed.output_text);
    }

    if (Array.isArray(parsed.output)) {
      const joined = parsed.output
        .flatMap((item) => item.content || [])
        .map((c) => c.text || '')
        .join('');
      if (joined.trim()) return splitEmbeddedThinkTags(joined);
    }

    const anthropicText = coerceMessageContent(parsed.content);
    if (anthropicText.trim()) {
      return splitEmbeddedThinkTags(anthropicText);
    }
  } catch {
    // Not JSON
  }

  return { content: '' };
}

export async function executeRouterChatCompletion({
  prompt,
  history,
  settings,
  systemPersona,
  modelIdOverride,
  deepThink,
  signal,
}: {
  prompt: string;
  history: ChatMessage[];
  settings: AppSettings;
  systemPersona: string;
  modelIdOverride?: string;
  deepThink?: boolean;
  signal?: AbortSignal;
}): Promise<{
  content: string;
  thinkingContent?: string;
  resolvedModel: string;
  providerLabel: string;
}> {
  const normalizedBaseUrl = normalizeRouterBaseUrl(
    settings.routerBaseUrl,
    settings.routerPreset
  );
  const completionsUrl = `${normalizedBaseUrl}/chat/completions`;
  const targetModel =
    (modelIdOverride || '').trim() ||
    resolveRouterModelName(settings.selectedModelId, settings);

  const deepThinkAddendum = deepThink
    ? '\n\nMode DeepThink aktif: Lakukan analisis mendalam langkah demi langkah di dalam tag <think>...</think> terlebih dahulu, lalu berikan jawaban akhir yang jernih, terstruktur, dan tuntas di luar tag tersebut.'
    : '';
  const fullSystemPrompt = `${systemPersona}${deepThinkAddendum}`;

  const historyTurns: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (settings.memoryContextEnabled && history.length > 0) {
    const recent = history
      .filter((m) => !m.isError && m.content.trim().length > 0 && !m.imageUrl)
      .slice(-8);
    for (const m of recent) {
      historyTurns.push({
        role: m.role,
        content: m.content.slice(0, 3000),
      });
    }
  }

  const standardMessages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [
    { role: 'system', content: fullSystemPrompt },
    ...historyTurns,
    { role: 'user', content: prompt.trim() },
  ];

  // Public 9router.com cloud prefers SSE (`stream: true`), while standard gateways work great with `stream: false`
  const preferStreamFirst = /9router\.com/i.test(normalizedBaseUrl);
  const headers = buildRouterHeaders(settings.routerApiKey);

  const attemptModes: Array<{ stream: boolean; mergeSystemIntoUser: boolean }> = [
    { stream: preferStreamFirst, mergeSystemIntoUser: false },
    { stream: !preferStreamFirst, mergeSystemIntoUser: false },
  ];

  let lastError = 'AI Router tidak mengembalikan jawaban.';

  for (let i = 0; i < attemptModes.length; i++) {
    const mode = attemptModes[i];
    const messagesPayload = mode.mergeSystemIntoUser
      ? [
          ...historyTurns,
          {
            role: 'user' as const,
            content: `Konteks peran percakapan: ${fullSystemPrompt}\n\nPesan pengguna:\n${prompt.trim()}`,
          },
        ]
      : standardMessages;

    const res = await performRouterHttpCall({
      url: completionsUrl,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: messagesPayload,
        stream: mode.stream,
      }),
      timeoutMs: 42000,
      signal,
    });

    if (res.ok && res.body) {
      const parsed = parseRouterChatResponse(res.body);
      if (parsed.content.trim().length >= 2) {
        return {
          content: parsed.content.trim(),
          thinkingContent: parsed.thinkingContent,
          resolvedModel: targetModel,
          providerLabel: getRouterDisplayLabel(settings),
        };
      }
    }

    lastError = res.error || lastError;

    // If upstream explicitly rejected `system` role, queue a system-merged retry once
    if (
      i === 0 &&
      /system\s+role|developer\s+instruction|unsupported.*role/i.test(lastError)
    ) {
      attemptModes.push({ stream: mode.stream, mergeSystemIntoUser: true });
    }

    // Do not retry on hard auth or local-unreachable errors
    if (res.status === 401 || res.status === 403 || res.status === 0) {
      break;
    }
  }

  throw new Error(lastError);
}

export async function generateRouterImage({
  prompt,
  ratio = '1:1',
  settings,
  signal,
}: {
  prompt: string;
  ratio?: string;
  settings: AppSettings;
  signal?: AbortSignal;
}): Promise<{ imageUrl: string; modelUsed: string; providerLabel: string }> {
  const normalizedBaseUrl = normalizeRouterBaseUrl(
    settings.routerBaseUrl,
    settings.routerPreset
  );
  const imagesUrl = `${normalizedBaseUrl}/images/generations`;
  const modelToUse =
    (settings.routerImageModel || '').trim() || 'openai/gpt-image-2';

  const size =
    ratio === '16:9' || ratio === '21:9'
      ? '1536x1024'
      : ratio === '9:16'
        ? '1024x1536'
        : '1024x1024';

  const res = await performRouterHttpCall({
    url: imagesUrl,
    method: 'POST',
    headers: buildRouterHeaders(settings.routerApiKey),
    body: JSON.stringify({
      model: modelToUse,
      prompt,
      n: 1,
      size,
    }),
    timeoutMs: 44000,
    signal,
  });

  if (!res.ok) {
    throw new Error(res.error || 'Gagal membuat gambar melalui AI Router.');
  }

  try {
    const parsed = JSON.parse(res.body) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      url?: string;
    };
    const first = parsed.data?.[0];
    if (first?.url && /^https?:\/\//i.test(first.url)) {
      return {
        imageUrl: first.url,
        modelUsed: modelToUse,
        providerLabel: getRouterDisplayLabel(settings),
      };
    }
    if (first?.b64_json && first.b64_json.length > 64) {
      return {
        imageUrl: `data:image/png;base64,${first.b64_json}`,
        modelUsed: modelToUse,
        providerLabel: getRouterDisplayLabel(settings),
      };
    }
    if (parsed.url && /^https?:\/\//i.test(parsed.url)) {
      return {
        imageUrl: parsed.url,
        modelUsed: modelToUse,
        providerLabel: getRouterDisplayLabel(settings),
      };
    }
  } catch {
    // Fall through
  }

  throw new Error('Respons /v1/images/generations tidak memuat URL atau base64 gambar.');
}
