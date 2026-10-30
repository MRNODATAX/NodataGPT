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
  cloudFallbackUrls?: string[];
  suggestedModels: string[];
}

export const ROUTER_PRESETS: Record<RouterPresetId, RouterPresetOption> = {
  '9router': {
    id: '9router',
    name: '9Router',
    badge: 'Local :20128 / Cloud',
    defaultBaseUrl: 'https://9router.com/v1',
    defaultModel: 'auto',
    keyPlaceholder: 'sk_9router... (atau pilih chip Lokal :20128)',
    description:
      'Universal AI Router (decolua/9router & 9router-go) kompatibel /v1/models?connected=1 & /v1/chat/completions. Mendukung 9Router Cloud, VPS/tunnel, maupun CLI lokal port 20128.',
    endpointChips: [
      { label: '9Router Cloud', url: 'https://9router.com/v1' },
      { label: '9Router Lokal (:20128)', url: 'http://localhost:20128/v1' },
      { label: '9Router Fork (:20127)', url: 'http://localhost:20127/v1' },
    ],
    cloudFallbackUrls: ['https://9router.com/v1'],
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
    defaultBaseUrl: 'https://omniroute.dev/v1',
    defaultModel: 'auto',
    keyPlaceholder: 'sk_omniroute... / sk_live_... (bukan oma_live_)',
    description:
      'AI Gateway 4-Tier (diegosouzapw/OmniRoute) dengan kombo pintar (auto, auto/coding, auto/fast, auto/smart), /v1/models?connected=1, & /v1/images/generations.',
    endpointChips: [
      { label: 'OmniRoute Cloud', url: 'https://omniroute.dev/v1' },
      { label: 'OmniRouter Hosted', url: 'https://omnirouter.li/v1' },
      { label: 'OmniRoute Lokal (:20128)', url: 'http://localhost:20128/v1' },
    ],
    cloudFallbackUrls: ['https://omniroute.dev/v1', 'https://omnirouter.li/v1'],
    suggestedModels: [
      'auto',
      'auto/coding',
      'auto/fast',
      'auto/smart',
      'auto/cheap',
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Key-Scoped /models/user',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    keyPlaceholder: 'sk-or-v1-...',
    description:
      'Gateway OpenRouter (/api/v1) dengan verifikasi kunci /auth/key & sinkronisasi daftar model khusus akun Anda (/api/v1/models/user).',
    endpointChips: [
      { label: 'OpenRouter Global', url: 'https://openrouter.ai/api/v1' },
      { label: 'OpenRouter US', url: 'https://us.openrouter.ai/api/v1' },
      { label: 'OpenRouter EU', url: 'https://eu.openrouter.ai/api/v1' },
    ],
    cloudFallbackUrls: ['https://openrouter.ai/api/v1'],
    suggestedModels: [
      'openrouter/auto',
      'openrouter/free',
      'deepseek/deepseek-r1:free',
      'qwen/qwen3-coder:free',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom / Multi-Gateway',
    badge: 'Groq · Gemini · VPS · Ollama',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'auto',
    keyPlaceholder: 'gsk_... / AIza... / nvapi-... / sk-... (auto-deteksi)',
    description:
      'Deteksi otomatis untuk Groq, Google Gemini, NVIDIA NIM, Anthropic, Cerebras, xAI, OpenAI, LiteLLM, NewAPI/OneAPI, Ollama (:11434/v1), & LM Studio (:1234/v1).',
    endpointChips: [
      { label: 'Groq Cloud', url: 'https://api.groq.com/openai/v1' },
      { label: 'Gemini OpenAI', url: 'https://generativelanguage.googleapis.com/v1beta/openai' },
      { label: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1' },
      { label: 'Ollama (:11434)', url: 'http://localhost:11434/v1' },
      { label: 'LM Studio (:1234)', url: 'http://localhost:1234/v1' },
    ],
    suggestedModels: ['auto', 'gpt-4o-mini', 'llama-3.3-70b-versatile'],
  },
};

export interface DetectedKeyProviderInfo {
  detected: boolean;
  providerName?: string;
  preset?: RouterPresetId;
  baseUrl?: string;
  defaultModel?: string;
  extractedKey?: string;
  warning?: string;
}

export function cleanRouterApiKey(rawKey: string): string {
  let cleaned = (rawKey || '')
    .replace(/[\u200B-\u200D\uFEFF\r\n\t]/g, '')
    .trim();
  if (!cleaned) return '';

  const stripQuotes = (s: string) =>
    s.replace(/^["'`\u201C\u201D\u2018\u2019]+|["'`\u201C\u201D\u2018\u2019,;]+$/g, '').trim();

  cleaned = stripQuotes(cleaned);
  // Strip common .env assignment prefixes if user pasted whole env line
  cleaned = cleaned.replace(
    /^(?:export\s+)?[A-Za-z0-9_]*(?:API_KEY|TOKEN|SECRET|KEY)\s*=\s*/i,
    ''
  );
  cleaned = stripQuotes(cleaned);
  // Strip Authorization: / x-api-key: / api-key: / Bearer prefixes
  cleaned = cleaned.replace(/^(?:Authorization|x-api-key|api-key)\s*:\s*/i, '').trim();
  cleaned = stripQuotes(cleaned);
  cleaned = cleaned.replace(/^Bearer\s+/i, '').trim();
  cleaned = stripQuotes(cleaned);

  return cleaned;
}

export function detectRouterProviderFromKey(rawKey: string): DetectedKeyProviderInfo {
  const cleaned = cleanRouterApiKey(rawKey);
  if (!cleaned) return { detected: false };

  // Handle full tokenized URL pasted directly into API key field (e.g. OmniRoute /api/v1/vscode/<TOKEN>)
  if (/^https?:\/\//i.test(cleaned)) {
    const normalized = normalizeRouterBaseUrl(cleaned, 'omniroute');
    const isOmni = /omnirout|\/vscode\//i.test(cleaned);
    const is9Router = /9router/i.test(cleaned);
    return {
      detected: true,
      providerName: isOmni
        ? 'OmniRoute Tokenized URL'
        : is9Router
          ? '9Router Endpoint URL'
          : 'Tokenized Router URL',
      preset: isOmni ? 'omniroute' : is9Router ? '9router' : 'custom',
      baseUrl: normalized,
      extractedKey: '',
    };
  }

  // Warn immediately if user pasted OmniRoute CLI management token (`oma_live_...`)
  if (/^oma_(?:live|test|mgmt|[a-z0-9])/i.test(cleaned)) {
    return {
      detected: true,
      providerName: 'OmniRoute Management Token',
      preset: 'omniroute',
      warning:
        'Token berawalan "oma_..." adalah Management Token CLI OmniRoute yang ditolak pada /v1/models & chat (HTTP 401). Buka Dashboard OmniRoute → menu Endpoints, lalu salin API Key khusus Endpoint.',
    };
  }

  if (/^sk-or-v1-/i.test(cleaned)) {
    return {
      detected: true,
      providerName: 'OpenRouter',
      preset: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openrouter/auto',
    };
  }

  if (/^gsk_[A-Za-z0-9_-]{10,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'Groq Cloud',
      preset: 'custom',
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.3-70b-versatile',
    };
  }

  if (/^nvapi-[A-Za-z0-9_-]{10,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'NVIDIA NIM',
      preset: 'custom',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      defaultModel: 'meta/llama-3.3-70b-instruct',
    };
  }

  if (/^csk-[A-Za-z0-9_-]{10,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'Cerebras Inference',
      preset: 'custom',
      baseUrl: 'https://api.cerebras.ai/v1',
      defaultModel: 'llama-3.3-70b',
    };
  }

  if (/^AIza[0-9A-Za-z_-]{12,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'Google Gemini (OpenAI Endpoint)',
      preset: 'custom',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      defaultModel: 'gemini-2.5-flash',
    };
  }

  if (/^sk-ant-/i.test(cleaned)) {
    return {
      detected: true,
      providerName: 'Anthropic Claude API',
      preset: 'custom',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5',
    };
  }

  if (/^xai-[A-Za-z0-9_-]{10,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'xAI Grok API',
      preset: 'custom',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-3-mini',
    };
  }

  if (/^pplx-[A-Za-z0-9_-]{10,}/.test(cleaned)) {
    return {
      detected: true,
      providerName: 'Perplexity Sonar API',
      preset: 'custom',
      baseUrl: 'https://api.perplexity.ai',
      defaultModel: 'sonar',
    };
  }

  if (
    /^sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}/.test(cleaned) ||
    (/^sk-[A-Za-z0-9]{20,}/.test(cleaned) && cleaned.includes('T3BlbkFJ'))
  ) {
    return {
      detected: true,
      providerName: 'OpenAI Official API',
      preset: 'custom',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    };
  }

  if (/^(?:sk_9router|9router_|9r_)/i.test(cleaned)) {
    return {
      detected: true,
      providerName: '9Router',
      preset: '9router',
    };
  }

  if (/^(?:sk_omni|omniroute_|omni_)/i.test(cleaned)) {
    return {
      detected: true,
      providerName: 'OmniRoute',
      preset: 'omniroute',
    };
  }

  return { detected: false };
}

function defaultPathForHost(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h.includes('openrouter.ai')) return '/api/v1';
  if (h === 'api.groq.com') return '/openai/v1';
  if (h === 'generativelanguage.googleapis.com') return '/v1beta/openai';
  if (h === 'api.perplexity.ai') return '';
  if (h === 'opencode.ai') return '/zen/v1';
  return '/v1';
}

export function normalizeRouterBaseUrl(
  rawUrl: string,
  preset: RouterPresetId = '9router'
): string {
  const fallback = ROUTER_PRESETS[preset]?.defaultBaseUrl || 'https://9router.com/v1';
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
      '/models/user',
      '/models/web',
      '/model/info',
      '/auth/key',
      '/chat/completions',
      '/completions',
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

    const host = parsed.hostname.toLowerCase();
    // Auto-correct known provider paths when user entered bare domain or wrong /v1 path
    if (!path) {
      path = defaultPathForHost(host);
    } else if (host === 'api.groq.com' && path === '/v1') {
      path = '/openai/v1';
    } else if (host === 'generativelanguage.googleapis.com' && path === '/v1') {
      path = '/v1beta/openai';
    } else if (host.includes('openrouter.ai') && path === '/v1') {
      path = '/api/v1';
    } else if (host === 'api.perplexity.ai' && path === '/v1') {
      path = '';
    }

    parsed.pathname = path;
    // Preserve auth query parameters (`?token=...`, `?api_key=...`, `?apiKey=...`, `?key=...`) used by OmniRoute
    const keptParams = new URLSearchParams();
    for (const [k, v] of parsed.searchParams.entries()) {
      if (/^(?:token|api_?key|key)$/i.test(k) && v.trim()) {
        keptParams.set(k, v.trim());
      }
    }
    parsed.search = keptParams.toString() ? `?${keptParams.toString()}` : '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function appendPathToRouterBase(baseUrl: string, subPath: string): string {
  const cleanSub = subPath.startsWith('/') ? subPath : `/${subPath}`;
  try {
    const parsed = new URL(baseUrl);
    const baseQuery = parsed.search;
    parsed.search = '';
    const subParts = cleanSub.split('?');
    let cleanBasePath = parsed.pathname.replace(/\/+$/, '');
    const stripSuffixes = [
      '/models/user',
      '/models/web',
      '/model/info',
      '/auth/key',
      '/chat/completions',
      '/completions',
      '/images/generations',
      '/videos/generations',
      '/audio/speech',
      '/responses',
      '/messages',
      '/models',
    ];
    for (const sfx of stripSuffixes) {
      if (cleanBasePath.toLowerCase().endsWith(sfx)) {
        cleanBasePath = cleanBasePath.slice(0, cleanBasePath.length - sfx.length);
        break;
      }
    }
    parsed.pathname = `${cleanBasePath}${subParts[0]}`;
    if (baseQuery && subParts[1]) {
      parsed.search = `${baseQuery}&${subParts[1]}`;
    } else if (baseQuery) {
      parsed.search = baseQuery;
    } else if (subParts[1]) {
      parsed.search = `?${subParts[1]}`;
    }
    return parsed.toString();
  } catch {
    return `${baseUrl.replace(/\/+$/, '')}${cleanSub}`;
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
  const hasInlineToken =
    /\/vscode\/[^/?#]+/i.test(normalizedBase) ||
    /[?&](?:token|api_?key|key)=[^&#]+/i.test(normalizedBase);
  const isLocal = isLocalOrPrivateRouterUrl(normalizedBase);

  return hasKey || hasInlineToken || isLocal;
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
  const discovered = settings.routerDiscoveredModels || [];
  const configured = (settings.routerModel || '').trim();

  // If discovered models exist from the API key, verify `configured` actually belongs to the key
  // (allow dynamic router aliases like `auto` or `openrouter/auto` if user deliberately typed them,
  // unless configured is just a stale default from another preset not present in `discovered`)
  if (discovered.length > 0) {
    if (configured && discovered.includes(configured)) {
      return configured;
    }
    const presetDefaults = new Set([
      'cc/claude-opus-4-7',
      'openrouter/auto',
      'auto',
      'gpt-4o-mini',
      'llama-3.3-70b-versatile',
    ]);
    if (!configured || presetDefaults.has(configured)) {
      return discovered[0];
    }
  }

  if (configured) return configured;
  if (discovered.length > 0) return discovered[0];
  return ROUTER_PRESETS[settings.routerPreset]?.defaultModel || 'auto';
}

export function getRouterDisplayLabel(settings: AppSettings): string {
  const detected = detectRouterProviderFromKey(settings.routerApiKey);
  if (detected.detected && detected.providerName && settings.routerPreset === 'custom') {
    return detected.providerName;
  }
  return ROUTER_PRESETS[settings.routerPreset]?.name || 'AI Router';
}

export function buildRouterHeaders(
  apiKey: string,
  targetUrl = ''
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/event-stream',
  };
  const cleanKey = cleanRouterApiKey(apiKey);
  const lowerUrl = targetUrl.toLowerCase();

  if (cleanKey) {
    headers['Authorization'] = `Bearer ${cleanKey}`;

    if (lowerUrl.includes('api.anthropic.com') || /^sk-ant-/i.test(cleanKey)) {
      headers['x-api-key'] = cleanKey;
      headers['anthropic-version'] = '2023-06-01';
    }
  }

  if (lowerUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://nodatagpt.web.id';
    headers['X-Title'] = 'NodataGPT';
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
  let directFailureResult: RawRouterTransportResult | null = null;

  // 1. Attempt direct browser fetch first (mandatory for localhost:20128, lowest latency for cloud)
  if (typeof window !== 'undefined') {
    const directAbort = new AbortController();
    const timer = window.setTimeout(
      () => directAbort.abort(),
      isLocal ? Math.min(timeoutMs, 8000) : Math.min(timeoutMs, 22000)
    );
    const onParentAbort = () => directAbort.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const reqHeaders: Record<string, string> = { ...headers };
      if (method === 'POST') {
        reqHeaders['Content-Type'] = 'application/json';
      }
      if (url.toLowerCase().includes('api.anthropic.com')) {
        reqHeaders['anthropic-dangerous-direct-browser-access'] = 'true';
      }

      const directRes = await fetch(url, {
        method,
        headers: reqHeaders,
        body: method === 'POST' ? body : undefined,
        signal: directAbort.signal,
      });

      const text = await directRes.text();
      if (directRes.ok) {
        return {
          ok: true,
          status: directRes.status,
          body: text,
          usedRelay: false,
        };
      }

      directFailureResult = {
        ok: false,
        status: directRes.status,
        body: text,
        usedRelay: false,
        error: extractRouterErrorMessage(text, directRes.status),
      };

      // For local endpoints or genuine upstream 400/401/402/404/422/429 JSON API errors, return directly
      const looksLikeWafOrCorsReject =
        !isLocal &&
        (directRes.status === 403 ||
          directRes.status === 405 ||
          directRes.status >= 500 ||
          text.trim().startsWith('<!DOCTYPE') ||
          text.includes('Just a moment'));

      if (!looksLikeWafOrCorsReject) {
        return directFailureResult;
      }
      // Otherwise fall through to /api/proxy Cloud Relay!
    } catch {
      if (signal?.aborted) {
        throw new DOMException('Permintaan dibatalkan oleh pengguna.', 'AbortError');
      }

      if (isLocal) {
        const isHttpsOrigin =
          typeof window !== 'undefined' && window.location.protocol === 'https:';
        const hint = isHttpsOrigin
          ? 'Pastikan server lokal 9Router / OmniRoute berjalan di perangkat Anda (mis. port 20128) dan izinkan akses jaringan lokal di browser, atau pilih chip Cloud (9Router Cloud / OmniRoute Cloud).'
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
    return (
      directFailureResult || {
        ok: false,
        status: 0,
        body: '',
        usedRelay: false,
        error: `Endpoint lokal (${url}) hanya dapat diakses langsung dari browser perangkat Anda.`,
      }
    );
  }

  // 2. Cloud HTTPS CORS Relay via /api/proxy (routerRelay: true)
  const relayHeaders: Record<string, string> = { ...headers };
  if (method === 'POST') {
    relayHeaders['Content-Type'] = 'application/json';
  }

  try {
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
  } catch {
    if (signal?.aborted) {
      throw new DOMException('Permintaan dibatalkan oleh pengguna.', 'AbortError');
    }
    return (
      directFailureResult || {
        ok: false,
        status: 502,
        body: '',
        usedRelay: true,
        error: 'Gagal menghubungi endpoint AI Router melalui Browser maupun Cloud Relay.',
      }
    );
  }
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
    if (trimmed.length <= 220 && !trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html')) {
      return trimmed;
    }
  }
  if (status === 401 || status === 403) {
    return `Autentikasi AI Router ditolak (HTTP ${status}). Pastikan API Key benar dan sesuai dengan penyedia Base URL.`;
  }
  if (status === 402) {
    return 'Saldo / kredit pada API Key AI Router tidak mencukupi untuk model ini (HTTP 402). Pilih model :free atau isi saldo.';
  }
  if (status === 404) {
    return 'Endpoint atau model pada AI Router tidak ditemukan (HTTP 404).';
  }
  if (status === 429) {
    return 'Kuota / rate-limit pada AI Router sedang penuh (HTTP 429).';
  }
  return `AI Router mengembalikan status HTTP ${status || 'gagal'}.`;
}

type ModelKindClassification = 'chat' | 'image' | 'exclude';

function classifyRouterModelEntry(rawItem: unknown, zeroCreditFreeOnly = false): {
  id: string;
  kind: ModelKindClassification;
  priorityBoost: number;
  isFreeModel: boolean;
} | null {
  if (typeof rawItem === 'string') {
    const id = rawItem.trim();
    if (!id) return null;
    const lower = id.toLowerCase();
    if (
      /(?:embedding|text-embedding|rerank|bge-|moderation|whisper|voxtral|tts-|speech|transcribe)/i.test(
        lower
      )
    ) {
      return { id, kind: 'exclude', priorityBoost: 0, isFreeModel: false };
    }
    if (
      /^(?:dall-e|gpt-image|imagen|ideogram|midjourney|stable-diffusion|sdxl|flux)/i.test(
        lower
      ) ||
      /\/(?:dall-e|gpt-image|imagen|stable-diffusion|sdxl|flux)[-/0-9a-z.]*$/i.test(lower)
    ) {
      return { id, kind: 'image', priorityBoost: 0, isFreeModel: lower.endsWith(':free') };
    }
    const isCombo =
      lower === 'auto' ||
      lower.startsWith('auto/') ||
      lower === 'openrouter/auto' ||
      lower === 'openrouter/free' ||
      lower.endsWith('-combo') ||
      lower === 'premium-coding';
    const isFree = lower.endsWith(':free') || lower === 'openrouter/free' || lower.endsWith('-free');
    if (zeroCreditFreeOnly && !isFree) {
      return { id, kind: 'exclude', priorityBoost: 0, isFreeModel: false };
    }
    return {
      id,
      kind: 'chat',
      priorityBoost: isCombo ? 2 : isFree ? 1 : 0,
      isFreeModel: isFree,
    };
  }

  if (!rawItem || typeof rawItem !== 'object') return null;
  const rec = rawItem as Record<string, unknown>;

  // Respect explicit active/disabled/connected flags returned by 9Router, OmniRoute, LiteLLM, NewAPI
  if (
    rec.disabled === true ||
    rec.enabled === false ||
    rec.active === false ||
    rec.connected === false ||
    rec.deprecated === true ||
    rec.is_disabled === true
  ) {
    return null;
  }

  const id =
    (typeof rec.id === 'string' && rec.id.trim()) ||
    (typeof rec.model_name === 'string' && rec.model_name.trim()) ||
    (typeof rec.name === 'string' && rec.name.trim() && !rec.name.includes(' ')
      ? rec.name.trim()
      : '') ||
    (typeof rec.model === 'string' && rec.model.trim()) ||
    '';
  if (!id) return null;

  const lower = id.toLowerCase();
  const modelType = String(rec.model_type || rec.type || '').toLowerCase();
  const ownedBy = String(rec.owned_by || '').toLowerCase();

  const arch = rec.architecture as Record<string, unknown> | undefined;
  const archModality = String(arch?.modality || '').toLowerCase();
  const outputModalities = Array.isArray(arch?.output_modalities)
    ? (arch.output_modalities as unknown[]).map((m) => String(m).toLowerCase())
    : Array.isArray((rec.modalities as Record<string, unknown> | undefined)?.output)
      ? (((rec.modalities as Record<string, unknown>).output as unknown[]) || []).map((m) =>
          String(m).toLowerCase()
        )
      : [];

  // Exclude non-chat audio/video/embedding/rerank/moderation models (e.g. LLM7 seedance/whisper, OpenAI embeddings)
  if (
    modelType === 'embedding' ||
    modelType === 'embeddings' ||
    modelType === 'rerank' ||
    modelType === 'audio' ||
    modelType === 'audio_to_text' ||
    modelType === 'text_to_audio' ||
    modelType === 'tts' ||
    modelType === 'stt' ||
    modelType === 'video' ||
    modelType === 'moderation' ||
    /(?:embedding|text-embedding|rerank|bge-|moderation|whisper|voxtral|tts-|seedance|kling-|veo-|wan2)/i.test(
      lower
    )
  ) {
    return { id, kind: 'exclude', priorityBoost: 0, isFreeModel: false };
  }

  const isImageOnly =
    modelType === 'image' ||
    modelType === 'images' ||
    modelType === 'text-to-image' ||
    (outputModalities.includes('image') && !outputModalities.includes('text')) ||
    (archModality.includes('->image') && !archModality.includes('text')) ||
    /^(?:dall-e|gpt-image|imagen|ideogram|midjourney|stable-diffusion|sdxl|flux)/i.test(
      lower
    ) ||
    /\/(?:dall-e|gpt-image|imagen|stable-diffusion|sdxl|flux)[-/0-9a-z.]*$/i.test(lower);

  // Detect free pricing on OpenRouter / OpenAI-compatible gateways
  const pricing = rec.pricing as Record<string, unknown> | undefined;
  const promptPrice = pricing?.prompt ?? pricing?.input;
  const completionPrice = pricing?.completion ?? pricing?.output;
  const isZeroPriced =
    pricing !== undefined &&
    (promptPrice === '0' || promptPrice === 0) &&
    (completionPrice === '0' || completionPrice === 0);
  const isFree =
    isZeroPriced ||
    lower.endsWith(':free') ||
    lower === 'openrouter/free' ||
    lower.endsWith('-free') ||
    String(rec.tier || '').toLowerCase() === 'free';

  if (isImageOnly) {
    return { id, kind: 'image', priorityBoost: 0, isFreeModel: isFree };
  }

  if (zeroCreditFreeOnly && !isFree) {
    return { id, kind: 'exclude', priorityBoost: 0, isFreeModel: false };
  }

  const isCombo =
    ownedBy === 'combo' ||
    modelType === 'combo' ||
    lower === 'auto' ||
    lower.startsWith('auto/') ||
    lower === 'openrouter/auto' ||
    lower === 'openrouter/free' ||
    lower.endsWith('-combo') ||
    lower === 'premium-coding';

  return {
    id,
    kind: 'chat',
    priorityBoost: isCombo ? 2 : isFree ? 1 : 0,
    isFreeModel: isFree,
  };
}

function parseModelListPayload(
  rawBody: string,
  options?: { zeroCreditFreeOnly?: boolean; preferFreeFirst?: boolean }
): { chatModels: string[]; imageModels: string[] } | null {
  try {
    const parsed = JSON.parse(rawBody) as {
      data?: unknown[];
      models?: unknown[];
      result?: unknown[];
    };
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data)
        ? parsed.data
        : Array.isArray(parsed?.models)
          ? parsed.models
          : Array.isArray(parsed?.result)
            ? parsed.result
            : null;

    if (!list) return null;

    const combos: string[] = [];
    const freeChat: string[] = [];
    const regularChat: string[] = [];
    const imageModels: string[] = [];
    const seenChat = new Set<string>();
    const seenImg = new Set<string>();

    for (const rawItem of list) {
      const classified = classifyRouterModelEntry(
        rawItem,
        Boolean(options?.zeroCreditFreeOnly)
      );
      if (!classified) continue;

      if (classified.kind === 'image') {
        if (!seenImg.has(classified.id)) {
          seenImg.add(classified.id);
          imageModels.push(classified.id);
        }
        continue;
      }

      if (classified.kind === 'chat' && !seenChat.has(classified.id)) {
        seenChat.add(classified.id);
        if (classified.priorityBoost >= 2) {
          combos.push(classified.id);
        } else if (options?.preferFreeFirst && classified.isFreeModel) {
          freeChat.push(classified.id);
        } else {
          regularChat.push(classified.id);
        }
      }
    }

    return {
      chatModels: [...combos, ...freeChat, ...regularChat].slice(0, 500),
      imageModels: imageModels.slice(0, 60),
    };
  } catch {
    return null;
  }
}

export interface RouterModelsDiscoveryResult {
  ok: boolean;
  models: string[];
  imageModels?: string[];
  detectedPreset?: RouterPresetId;
  detectedProviderName?: string;
  normalizedBaseUrl: string;
  latencyMs: number;
  usedRelay: boolean;
  keyNote?: string;
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
  const keyInfo = detectRouterProviderFromKey(apiKey);

  if (keyInfo.warning) {
    return {
      ok: false,
      models: [],
      normalizedBaseUrl: normalizeRouterBaseUrl(baseUrl, preset),
      latencyMs: Date.now() - startedAt,
      usedRelay: false,
      error: keyInfo.warning,
    };
  }

  let effectivePreset = preset;
  let effectiveBaseInput = baseUrl;
  let effectiveKey = cleanRouterApiKey(apiKey);

  // If user pasted a tokenized URL into the API key field
  if (keyInfo.detected && keyInfo.extractedKey === '' && keyInfo.baseUrl) {
    effectiveBaseInput = keyInfo.baseUrl;
    effectiveKey = '';
    if (keyInfo.preset) effectivePreset = keyInfo.preset;
  } else if (keyInfo.detected && keyInfo.baseUrl) {
    // Auto-align Base URL when user pasted a known provider key (e.g. sk-or-v1-, gsk_, AIza, nvapi-, sk-ant-)
    // while Base URL was still pointing to a different default host
    const currentNorm = normalizeRouterBaseUrl(baseUrl, preset);
    const expectedNorm = normalizeRouterBaseUrl(keyInfo.baseUrl, keyInfo.preset || preset);
    try {
      const curHost = new URL(currentNorm).hostname.toLowerCase();
      const expHost = new URL(expectedNorm).hostname.toLowerCase();
      const isDefaultHost =
        curHost === 'localhost' ||
        curHost === '127.0.0.1' ||
        curHost === '9router.com' ||
        curHost === 'omniroute.dev' ||
        curHost === 'omnirouter.li' ||
        curHost.includes('openrouter.ai') ||
        curHost === 'api.groq.com';
      if (curHost !== expHost && isDefaultHost) {
        effectiveBaseInput = expectedNorm;
        if (keyInfo.preset) effectivePreset = keyInfo.preset;
      }
    } catch {
      effectiveBaseInput = expectedNorm;
    }
  }

  const primaryBaseUrl = normalizeRouterBaseUrl(effectiveBaseInput, effectivePreset);

  // Build candidate Base URLs:
  // If user has a cloud API key but Base URL was left on localhost:20128, automatically include preset cloud URLs!
  const candidateBaseUrls: string[] = [primaryBaseUrl];
  if (isLocalOrPrivateRouterUrl(primaryBaseUrl) && effectiveKey.length > 0) {
    const cloudFallbacks = ROUTER_PRESETS[effectivePreset]?.cloudFallbackUrls || [];
    for (const cf of cloudFallbacks) {
      if (!candidateBaseUrls.includes(cf)) candidateBaseUrls.push(cf);
    }
    if (effectivePreset === '9router') {
      candidateBaseUrls.push('https://omniroute.dev/v1');
    } else if (effectivePreset === 'omniroute') {
      candidateBaseUrls.push('https://9router.com/v1');
    }
  }

  let lastError = 'Gagal memuat daftar model dari /v1/models.';
  let lastUsedRelay = false;

  for (const baseCandidate of candidateBaseUrls) {
    const isOpenRouter = /openrouter\.ai/i.test(baseCandidate);
    const is9RouterOrOmni =
      effectivePreset === '9router' ||
      effectivePreset === 'omniroute' ||
      /9router|omnirout|localhost:2012[78]|127\.0\.0\.1:2012[78]/i.test(baseCandidate);

    let zeroCreditFreeOnly = false;
    let preferFreeFirst = false;
    let keyNote: string | undefined;

    // 1. OpenRouter strict API key validation (`/auth/key`) so invalid keys never falsely "connect"
    //    and zero-balance free keys automatically surface `:free` models!
    if (isOpenRouter) {
      if (!effectiveKey) {
        return {
          ok: false,
          models: [],
          normalizedBaseUrl: baseCandidate,
          latencyMs: Date.now() - startedAt,
          usedRelay: false,
          error: 'Masukkan API Key OpenRouter (sk-or-v1-...) terlebih dahulu.',
        };
      }

      const authKeyUrl = appendPathToRouterBase(baseCandidate, '/auth/key');
      const authRes = await performRouterHttpCall({
        url: authKeyUrl,
        method: 'GET',
        headers: buildRouterHeaders(effectiveKey, authKeyUrl),
        timeoutMs: 14000,
        signal,
      });
      lastUsedRelay = authRes.usedRelay;

      if (authRes.status === 401 || authRes.status === 403) {
        return {
          ok: false,
          models: [],
          normalizedBaseUrl: baseCandidate,
          latencyMs: Date.now() - startedAt,
          usedRelay: authRes.usedRelay,
          error:
            'API Key OpenRouter ditolak (HTTP 401). Pastikan kunci sk-or-v1-... aktif dan belum dicabut.',
        };
      }

      if (authRes.ok && authRes.body) {
        try {
          const authJson = JSON.parse(authRes.body) as {
            data?: {
              label?: string;
              limit?: number | null;
              limit_remaining?: number | null;
              is_free_tier?: boolean;
              usage?: number;
            };
          };
          const d = authJson?.data;
          if (d) {
            if (d.is_free_tier) {
              preferFreeFirst = true;
              if (typeof d.limit_remaining === 'number' && d.limit_remaining <= 0) {
                zeroCreditFreeOnly = true;
                keyNote =
                  'Akun Free Tier ($0 kredit): menampilkan khusus model gratis (:free) yang bisa langsung dipakai.';
              } else {
                keyNote =
                  'Akun Free Tier terdeteksi: model gratis (:free) diprioritaskan di urutan teratas.';
              }
            } else if (typeof d.limit_remaining === 'number') {
              if (d.limit_remaining <= 0) {
                zeroCreditFreeOnly = true;
                keyNote =
                  'Sisa limit kredit $0: menyaring otomatis ke model gratis (:free).';
              } else {
                keyNote = `Sisa limit kredit kunci: $${d.limit_remaining.toFixed(2)}`;
              }
            }
          }
        } catch {
          // Ignore optional metadata parse error
        }
      }
    }

    // 2. Build ordered model-discovery endpoints for this baseCandidate:
    //    - OpenRouter: `/models/user` (key-scoped guardrails & allowlist!) -> `/models`
    //    - 9Router / OmniRoute: `/models?connected=1` (active connections only!) -> `/models`
    //    - Standard OpenAI-compatible: `/models`
    const modelPathsToTry: string[] = isOpenRouter
      ? ['/models/user', '/models']
      : is9RouterOrOmni
        ? ['/models?connected=1', '/models']
        : ['/models'];

    for (const modelSubPath of modelPathsToTry) {
      const targetModelsUrl = appendPathToRouterBase(baseCandidate, modelSubPath);
      const res = await performRouterHttpCall({
        url: targetModelsUrl,
        method: 'GET',
        headers: buildRouterHeaders(effectiveKey, targetModelsUrl),
        timeoutMs: 18000,
        signal,
      });

      lastUsedRelay = res.usedRelay;

      if (res.ok && res.body) {
        let parsedList = parseModelListPayload(res.body, {
          zeroCreditFreeOnly,
          preferFreeFirst,
        });

        // If zeroCreditFreeOnly filtered everything out on a custom key, retry without strict zero-credit exclusion
        if (parsedList && parsedList.chatModels.length === 0 && zeroCreditFreeOnly) {
          parsedList = parseModelListPayload(res.body, {
            zeroCreditFreeOnly: false,
            preferFreeFirst: true,
          });
        }

        // On `?connected=1`, if 0 models came back (e.g. older 9router build before PR #51), try plain `/models` next
        if (
          modelSubPath.includes('connected=1') &&
          (!parsedList || parsedList.chatModels.length === 0)
        ) {
          continue;
        }

        if (parsedList) {
          return {
            ok: true,
            models: parsedList.chatModels,
            imageModels: parsedList.imageModels,
            detectedPreset: keyInfo.preset || effectivePreset,
            detectedProviderName: keyInfo.providerName,
            normalizedBaseUrl: baseCandidate,
            latencyMs: Date.now() - startedAt,
            usedRelay: res.usedRelay,
            keyNote:
              keyNote ||
              (modelSubPath.includes('connected=1')
                ? 'Hanya menampilkan provider & combo yang benar-benar terhubung pada kunci Anda.'
                : modelSubPath === '/models/user'
                  ? 'Daftar model telah disinkronkan khusus sesuai izin API Key Anda (/models/user).'
                  : undefined),
          };
        }
      }

      // Hard auth error on this host -> stop trying subpaths on same host
      if (res.status === 401 || res.status === 403) {
        lastError = res.error || lastError;
        break;
      }

      // If `/models` returned 404 on a custom HTTPS domain, probe alternate OpenAI base paths (`/api/v1`, `/openai/v1`)
      if (res.status === 404 && modelSubPath === '/models' && !isLocalOrPrivateRouterUrl(baseCandidate)) {
        try {
          const u = new URL(baseCandidate);
          const altPaths = ['/api/v1', '/openai/v1', '/v1beta/openai', '/v1'].filter(
            (p) => p !== u.pathname.replace(/\/+$/, '')
          );
          for (const altP of altPaths) {
            const altBase = `${u.origin}${altP}`;
            const altModelsUrl = appendPathToRouterBase(altBase, '/models');
            const altRes = await performRouterHttpCall({
              url: altModelsUrl,
              method: 'GET',
              headers: buildRouterHeaders(effectiveKey, altModelsUrl),
              timeoutMs: 12000,
              signal,
            });
            if (altRes.ok && altRes.body) {
              const altParsed = parseModelListPayload(altRes.body, {
                preferFreeFirst,
              });
              if (altParsed && altParsed.chatModels.length > 0) {
                return {
                  ok: true,
                  models: altParsed.chatModels,
                  imageModels: altParsed.imageModels,
                  detectedPreset: keyInfo.preset || effectivePreset,
                  detectedProviderName: keyInfo.providerName,
                  normalizedBaseUrl: altBase,
                  latencyMs: Date.now() - startedAt,
                  usedRelay: altRes.usedRelay,
                };
              }
            }
          }
        } catch {
          // Ignore URL parse error
        }

        // Finally, some proxies (e.g. Perplexity `https://api.perplexity.ai` or custom chat-only gateways)
        // do not expose GET `/models` at all, only POST `/chat/completions`!
        const fallbackModel =
          keyInfo.defaultModel ||
          ROUTER_PRESETS[effectivePreset]?.defaultModel ||
          'auto';
        const pingUrl = appendPathToRouterBase(baseCandidate, '/chat/completions');
        const pingRes = await performRouterHttpCall({
          url: pingUrl,
          method: 'POST',
          headers: buildRouterHeaders(effectiveKey, pingUrl),
          body: JSON.stringify({
            model: fallbackModel,
            messages: [{ role: 'user', content: 'ok' }],
            max_tokens: 4,
            stream: false,
          }),
          timeoutMs: 16000,
          signal,
        });
        if (pingRes.ok) {
          const knownModels =
            /perplexity\.ai/i.test(baseCandidate)
              ? ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro']
              : [fallbackModel];
          return {
            ok: true,
            models: knownModels,
            detectedPreset: keyInfo.preset || effectivePreset,
            detectedProviderName: keyInfo.providerName,
            normalizedBaseUrl: baseCandidate,
            latencyMs: Date.now() - startedAt,
            usedRelay: pingRes.usedRelay,
            keyNote:
              'Gateway aktif (mode langsung /chat/completions tanpa endpoint /models publik).',
          };
        }
      }

      lastError = res.error || lastError;
    }
  }

  return {
    ok: false,
    models: [],
    normalizedBaseUrl: primaryBaseUrl,
    latencyMs: Date.now() - startedAt,
    usedRelay: lastUsedRelay,
    error: lastError,
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
            reasoningAcc += chunk.choices?.[0]?.message?.reasoning_content || '';
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

function isModelMismatchError(status: number, errorText: string): boolean {
  if (status === 404 || status === 400 || status === 402 || status === 422 || status === 503) {
    return /(?:model_not_found|model.*not\s+found|does\s+not\s+exist|do\s+not\s+have\s+access|no\s+active\s+connections\s+for\s+provider|no\s+endpoints\s+found|not\s+supported|unknown\s+model|invalid\s+model|unavailable\s+model|insufficient\s+credits|HTTP\s+402)/i.test(
      errorText
    );
  }
  return false;
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
  const keyDetected = detectRouterProviderFromKey(settings.routerApiKey);
  let activeBaseUrl = normalizeRouterBaseUrl(
    settings.routerBaseUrl,
    settings.routerPreset
  );

  // Auto-align Base URL if user pasted a known provider key without updating Base URL
  if (keyDetected.detected && keyDetected.baseUrl) {
    try {
      const curHost = new URL(activeBaseUrl).hostname.toLowerCase();
      const expUrl = normalizeRouterBaseUrl(
        keyDetected.baseUrl,
        keyDetected.preset || settings.routerPreset
      );
      const expHost = new URL(expUrl).hostname.toLowerCase();
      if (
        curHost !== expHost &&
        (curHost === 'localhost' ||
          curHost === '127.0.0.1' ||
          curHost === '9router.com' ||
          curHost === 'omniroute.dev')
      ) {
        activeBaseUrl = expUrl;
      }
    } catch {
      // Keep activeBaseUrl
    }
  }

  let targetModel =
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

  // Anthropic native `/v1/messages` support when calling `api.anthropic.com`
  if (/api\.anthropic\.com/i.test(activeBaseUrl)) {
    const messagesUrl = appendPathToRouterBase(activeBaseUrl, '/messages');
    const anthropicRes = await performRouterHttpCall({
      url: messagesUrl,
      method: 'POST',
      headers: buildRouterHeaders(settings.routerApiKey, messagesUrl),
      body: JSON.stringify({
        model: targetModel === 'auto' ? 'claude-sonnet-4-5' : targetModel,
        max_tokens: 4096,
        system: fullSystemPrompt,
        messages: [
          ...historyTurns,
          { role: 'user', content: prompt.trim() },
        ],
      }),
      timeoutMs: 42000,
      signal,
    });
    if (anthropicRes.ok && anthropicRes.body) {
      const parsed = parseRouterChatResponse(anthropicRes.body);
      if (parsed.content.trim().length >= 2) {
        return {
          content: parsed.content.trim(),
          thinkingContent: parsed.thinkingContent,
          resolvedModel: targetModel === 'auto' ? 'claude-sonnet-4-5' : targetModel,
          providerLabel: getRouterDisplayLabel(settings),
        };
      }
    }
    throw new Error(anthropicRes.error || 'Anthropic API tidak mengembalikan jawaban.');
  }

  const runChatAgainstBase = async (
    base: string,
    modelName: string
  ): Promise<{
    ok: boolean;
    status: number;
    content?: string;
    thinkingContent?: string;
    error: string;
  }> => {
    const completionsUrl = appendPathToRouterBase(base, '/chat/completions');
    const preferStreamFirst = /9router\.com/i.test(base);
    const headers = buildRouterHeaders(settings.routerApiKey, completionsUrl);

    const attemptModes: Array<{ stream: boolean; mergeSystemIntoUser: boolean }> = [
      { stream: preferStreamFirst, mergeSystemIntoUser: false },
      { stream: !preferStreamFirst, mergeSystemIntoUser: false },
    ];

    let errText = 'AI Router tidak mengembalikan jawaban.';
    let lastStatus = 0;

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
          model: modelName,
          messages: messagesPayload,
          stream: mode.stream,
        }),
        timeoutMs: 42000,
        signal,
      });

      lastStatus = res.status;

      if (res.ok && res.body) {
        const parsed = parseRouterChatResponse(res.body);
        if (parsed.content.trim().length >= 2) {
          return {
            ok: true,
            status: res.status,
            content: parsed.content.trim(),
            thinkingContent: parsed.thinkingContent,
            error: '',
          };
        }
      }

      errText = res.error || errText;

      if (
        i === 0 &&
        /system\s+role|developer\s+instruction|unsupported.*role/i.test(errText)
      ) {
        attemptModes.push({ stream: mode.stream, mergeSystemIntoUser: true });
      }

      if (
        res.status === 401 ||
        res.status === 403 ||
        res.status === 0 ||
        isModelMismatchError(res.status, errText)
      ) {
        break;
      }
    }

    return { ok: false, status: lastStatus, error: errText };
  };

  let firstAttempt = await runChatAgainstBase(activeBaseUrl, targetModel);

  // If Base URL was left on localhost:20128 while user actually pasted a cloud key, auto-failover to cloud URL
  if (
    !firstAttempt.ok &&
    firstAttempt.status === 0 &&
    isLocalOrPrivateRouterUrl(activeBaseUrl) &&
    cleanRouterApiKey(settings.routerApiKey).length > 0
  ) {
    const cloudUrl =
      ROUTER_PRESETS[settings.routerPreset]?.cloudFallbackUrls?.[0] ||
      'https://9router.com/v1';
    activeBaseUrl = cloudUrl;
    firstAttempt = await runChatAgainstBase(activeBaseUrl, targetModel);
  }

  if (firstAttempt.ok && firstAttempt.content) {
    return {
      content: firstAttempt.content,
      thinkingContent: firstAttempt.thinkingContent,
      resolvedModel: targetModel,
      providerLabel: getRouterDisplayLabel(settings),
    };
  }

  // Self-Healing on Model Mismatch (`model_not_found`, `no active connections`, `402` on paid model):
  // Live-discover what models the API key ACTUALLY owns and retry automatically!
  if (isModelMismatchError(firstAttempt.status, firstAttempt.error)) {
    const candidatesFromState = (settings.routerDiscoveredModels || []).filter(
      (m) => m !== targetModel
    );
    let fallbackCandidates = candidatesFromState.slice(0, 3);

    if (fallbackCandidates.length === 0) {
      const liveDisc = await discoverRouterModels({
        baseUrl: activeBaseUrl,
        apiKey: settings.routerApiKey,
        preset: settings.routerPreset,
        signal,
      });
      if (liveDisc.ok && liveDisc.models.length > 0) {
        activeBaseUrl = liveDisc.normalizedBaseUrl;
        fallbackCandidates = liveDisc.models
          .filter((m) => m !== targetModel)
          .slice(0, 3);
      }
    }

    for (const altModel of fallbackCandidates) {
      const retry = await runChatAgainstBase(activeBaseUrl, altModel);
      if (retry.ok && retry.content) {
        targetModel = altModel;
        return {
          content: retry.content,
          thinkingContent: retry.thinkingContent,
          resolvedModel: altModel,
          providerLabel: getRouterDisplayLabel(settings),
        };
      }
    }
  }

  throw new Error(firstAttempt.error);
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
  const imagesUrl = appendPathToRouterBase(normalizedBaseUrl, '/images/generations');
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
    headers: buildRouterHeaders(settings.routerApiKey, imagesUrl),
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
