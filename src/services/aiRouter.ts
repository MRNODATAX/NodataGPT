import type { AIModelDefinition, AppSettings, ChatMessage } from '../types/chat';
import {
  AI_MODELS,
  DEFAULT_FALLBACK_ORDER,
  IMAGE_ENGINES,
  getModelById,
} from './modelCatalog';

const CIRCUIT_STORAGE_KEY = 'nodatagpt.circuit.v1';
const STRIKE_THRESHOLD = 3;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per DAFTAR-API-AI-BOT-v1.15.0

interface CircuitEntry {
  strikes: number;
  cooldownUntil: number;
  lastError?: string;
}

type CircuitMap = Record<string, CircuitEntry>;

function loadCircuitMap(): CircuitMap {
  try {
    const raw = sessionStorage.getItem(CIRCUIT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCircuitMap(map: CircuitMap): void {
  try {
    sessionStorage.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function isModelCoolingDown(modelId: string): boolean {
  const entry = loadCircuitMap()[modelId];
  if (!entry) return false;
  return entry.cooldownUntil > Date.now();
}

export function getModelCooldownRemainingSec(modelId: string): number {
  const entry = loadCircuitMap()[modelId];
  if (!entry || entry.cooldownUntil <= Date.now()) return 0;
  return Math.ceil((entry.cooldownUntil - Date.now()) / 1000);
}

export function resetAllModelCooldowns(): void {
  saveCircuitMap({});
}

function recordModelSuccess(modelId: string): void {
  const map = loadCircuitMap();
  if (map[modelId]) {
    delete map[modelId];
    saveCircuitMap(map);
  }
}

function recordModelFailure(modelId: string, reason: string): void {
  const map = loadCircuitMap();
  const prev = map[modelId] ?? { strikes: 0, cooldownUntil: 0 };
  const nextStrikes = prev.strikes + 1;
  map[modelId] = {
    strikes: nextStrikes,
    cooldownUntil: nextStrikes >= STRIKE_THRESHOLD ? Date.now() + COOLDOWN_MS : 0,
    lastError: reason,
  };
  saveCircuitMap(map);
}

function sanitizeAnswerText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Reject upstream HTML error pages (Cloudflare / Nginx 502 / PHP fatal)
  if (
    /^<!doctype html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    /<title>\s*(502|503|504|403|404|Error|Just a moment)/i.test(trimmed)
  ) {
    return '';
  }

  // Strip Pollinations promotional footer if appended
  const cleaned = trimmed
    .replace(/\n*---\n*\*?Support Pollinations\.AI[\s\S]*$/i, '')
    .trim();

  return cleaned;
}

export function extractUniversalAnswer(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) return '';

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;

    if (data.status === false || data.ok === false || data.success === false) {
      return '';
    }

    // OpenAI / DeepSeek / LLM7 / Pollinations POST format
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const first = data.choices[0] as Record<string, unknown>;
      const msg = first?.message as Record<string, unknown> | undefined;
      if (typeof msg?.content === 'string' && msg.content.trim()) {
        return sanitizeAnswerText(msg.content);
      }
      if (typeof first?.text === 'string' && first.text.trim()) {
        return sanitizeAnswerText(first.text);
      }
    }

    // Google Gemini Official format
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      const first = data.candidates[0] as Record<string, unknown>;
      const content = first?.content as Record<string, unknown> | undefined;
      const parts = content?.parts as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(parts)) {
        const joined = parts
          .map((p) => (typeof p?.text === 'string' ? p.text : ''))
          .join('')
          .trim();
        if (joined) return sanitizeAnswerText(joined);
      }
    }

    // Direct string fields used across Indonesian AI endpoints
    const directKeys = [
      'result',
      'answer',
      'response',
      'reply',
      'message',
      'content',
      'text',
      'output',
      'jawaban',
      'pesan',
    ];
    for (const key of directKeys) {
      const val = data[key];
      if (typeof val === 'string' && val.trim()) {
        return sanitizeAnswerText(val);
      }
    }

    // Nested object container (`data`, `result`, `response`)
    const containerKeys = ['data', 'result', 'response', 'output'];
    for (const cKey of containerKeys) {
      const nested = data[cKey];
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const obj = nested as Record<string, unknown>;
        for (const key of directKeys) {
          const val = obj[key];
          if (typeof val === 'string' && val.trim()) {
            return sanitizeAnswerText(val);
          }
        }
      }
    }

    if (typeof data.error === 'string' || (data.error && typeof data.error === 'object')) {
      return '';
    }
  } catch {
    // Plain text response (e.g., Pollinations GET)
    return sanitizeAnswerText(trimmed);
  }

  return '';
}

function buildEffectivePrompt(
  prompt: string,
  history: ChatMessage[],
  settings: AppSettings,
  maxChars: number
): string {
  const cleanPrompt = prompt.trim();
  if (!settings.memoryContextEnabled || history.length === 0) {
    return cleanPrompt.length > maxChars ? cleanPrompt.slice(-maxChars) : cleanPrompt;
  }

  const recent = history
    .filter((m) => !m.isError && m.content.trim().length > 0 && !m.imageUrl)
    .slice(-4);

  if (recent.length === 0) {
    return cleanPrompt.length > maxChars ? cleanPrompt.slice(-maxChars) : cleanPrompt;
  }

  const contextLines = recent.map((m) => {
    const speaker = m.role === 'user' ? 'User' : 'Assistant';
    const snippet = m.content.length > 360 ? `${m.content.slice(0, 360)}...` : m.content;
    return `${speaker}: ${snippet}`;
  });

  const combined = `Konteks percakapan sebelumnya:\n${contextLines.join('\n')}\n\nPertanyaan terbaru:\n${cleanPrompt}`;
  if (combined.length > maxChars) {
    return cleanPrompt.length > maxChars ? cleanPrompt.slice(-maxChars) : cleanPrompt;
  }
  return combined;
}

interface ProxyRequestSpec {
  targetUrl: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs: number;
}

function buildModelRequests(
  model: AIModelDefinition,
  query: string,
  settings: AppSettings
): ProxyRequestSpec[] {
  const q = encodeURIComponent(query);
  const t = model.timeoutMs;

  switch (model.id) {
    case 'gemini':
      return [{ targetUrl: `https://api.neosoft.best/api/ai/gemini?text=${q}`, timeoutMs: t }];

    case 'chatgpt':
      return [
        {
          targetUrl: `https://text.pollinations.ai/${q}?model=openai-fast`,
          timeoutMs: t,
        },
        {
          targetUrl: 'https://text.pollinations.ai/openai',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: [{ role: 'user', content: query }],
          }),
          timeoutMs: 18000,
        },
      ];

    case 'stenly':
      return [{ targetUrl: `https://stenly.org/api/ai/chatgpt?q=${q}`, timeoutMs: t }];

    case 'llm7':
      return [
        {
          targetUrl: 'https://api.llm7.io/v1/chat/completions',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: query }],
          }),
          timeoutMs: t,
        },
      ];

    case 'deepseek':
      return [
        {
          targetUrl: `https://api-xemoz-official.my.id/api/ai/deepseek-v3.2-thinking.php?pesan=${q}`,
          timeoutMs: t,
        },
      ];

    case 'honcho':
      return [{ targetUrl: `https://stenly.org/api/ai/honcho?text=${q}`, timeoutMs: t }];

    case 'qwen3':
      return [{ targetUrl: `https://stenly.org/api/ai/qwen3?text=${q}`, timeoutMs: t }];

    case 'llama4':
      return [{ targetUrl: `https://stenly.org/api/ai/llama4?text=${q}`, timeoutMs: t }];

    case 'rin-chatgpt':
      return [{ targetUrl: `https://apiii-xrina.my.id/ai/chatgpt?text=${q}`, timeoutMs: t }];

    case 'rin-claude':
      return [{ targetUrl: `https://apiii-xrina.my.id/ai/claudehaiku?text=${q}`, timeoutMs: t }];

    case 'varhad-claude':
      return [{ targetUrl: `https://v2.api-varhad.my.id/ai/claude?prompt=${q}`, timeoutMs: t }];

    case 'comiku-deepai':
      return [{ targetUrl: `https://comiku.my.id/ai/deepai?text=${q}`, timeoutMs: t }];

    case 'comiku-overchat':
      return [
        {
          targetUrl: `https://comiku.my.id/ai/overchat?q=${q}&model=qwen-3`,
          timeoutMs: t,
        },
      ];

    case 'bintang-llama4':
      return [{ targetUrl: `https://bintangapi.my.id/api/aichat/llama-4?text=${q}`, timeoutMs: t }];

    case 'bintang-deepv3':
      return [{ targetUrl: `https://bintangapi.my.id/api/aichat/deep-v3?text=${q}`, timeoutMs: t }];

    case 'rin-qwen':
      return [{ targetUrl: `https://apiii-xrina.my.id/ai/qwen?text=${q}`, timeoutMs: t }];

    case 'bintang-deepv4':
      return [{ targetUrl: `https://bintangapi.my.id/api/aichat/deep-v4?text=${q}`, timeoutMs: t }];

    case 'wormgpt':
      return [{ targetUrl: `https://bintangapi.my.id/api/aichat/wormgpt?q=${q}`, timeoutMs: t }];

    case 'rin-aicostum': {
      const persona = encodeURIComponent(
        settings.customPersona.trim() ||
          'Kamu adalah asisten AI NodataGPT yang cerdas, lugas, dan membantu.'
      );
      return [
        {
          targetUrl: `https://apiii-xrina.my.id/ai/aicostum?prompt=${persona}&text=${q}`,
          timeoutMs: t,
        },
      ];
    }

    case 'math':
      return [
        {
          targetUrl: `https://api-xemoz-official.my.id/api/ai/mathgpt-ai.php?q=${q}`,
          timeoutMs: t,
        },
      ];

    case 'claude':
      return [{ targetUrl: `https://api.nexray.eu.cc/ai/claude?text=${q}`, timeoutMs: t }];

    case 'gpt5':
      return [
        {
          targetUrl: `https://api-xemoz-official.my.id/api/ai/gpt-5.5.php?pesan=${q}`,
          timeoutMs: t,
        },
      ];

    case 'gemini-resmi': {
      const key = settings.geminiApiKey.trim();
      if (!key) return [];
      return [
        {
          targetUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
          }),
          timeoutMs: t,
        },
      ];
    }

    case 'deepseek-resmi': {
      const key = settings.deepseekApiKey.trim();
      if (!key) return [];
      return [
        {
          targetUrl: 'https://api.deepseek.com/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: query }],
          }),
          timeoutMs: t,
        },
      ];
    }

    default:
      return [{ targetUrl: `https://api.neosoft.best/api/ai/gemini?text=${q}`, timeoutMs: 20000 }];
  }
}

async function callGateway(spec: ProxyRequestSpec, signal?: AbortSignal): Promise<{
  ok: boolean;
  kind?: 'text' | 'image';
  body?: string;
  imageUrl?: string;
  error?: string;
}> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      targetUrl: spec.targetUrl,
      method: spec.method ?? 'GET',
      headers: spec.headers,
      body: spec.body,
      timeoutMs: spec.timeoutMs,
    }),
    signal,
  });

  const json = (await response.json()) as {
    ok?: boolean;
    kind?: 'text' | 'image';
    body?: string;
    imageUrl?: string;
    error?: string;
  };

  return {
    ok: Boolean(response.ok && json.ok),
    kind: json.kind,
    body: json.body,
    imageUrl: json.imageUrl,
    error: json.error,
  };
}

function buildCandidateChain(settings: AppSettings): AIModelDefinition[] {
  const unlockedOfficial: AIModelDefinition[] = [];
  if (settings.geminiApiKey.trim()) {
    unlockedOfficial.push(getModelById('gemini-resmi'));
  }
  if (settings.deepseekApiKey.trim()) {
    unlockedOfficial.push(getModelById('deepseek-resmi'));
  }

  const baseFallback = DEFAULT_FALLBACK_ORDER.map((id) => getModelById(id));

  if (settings.selectedModelId === 'auto') {
    const merged = [...unlockedOfficial, ...baseFallback];
    const healthy = merged.filter((m) => !isModelCoolingDown(m.id));
    return healthy.length > 0 ? healthy : merged;
  }

  const chosen = getModelById(settings.selectedModelId);

  if (!settings.autoFallback) {
    return [chosen];
  }

  const rest = [...unlockedOfficial, ...baseFallback].filter(
    (m) => m.id !== chosen.id && !isModelCoolingDown(m.id)
  );
  return [chosen, ...rest];
}

export interface RouterStatusUpdate {
  modelName: string;
  attempt: number;
  isFallback: boolean;
  previousFailedModel?: string;
}

export interface RouterResult {
  content: string;
  answeredById: string;
  answeredByName: string;
  usedFallback: boolean;
  attemptsCount: number;
  imageUrl?: string;
}

export async function sendMultiModelChat({
  prompt,
  history,
  settings,
  signal,
  onStatus,
}: {
  prompt: string;
  history: ChatMessage[];
  settings: AppSettings;
  signal?: AbortSignal;
  onStatus?: (status: RouterStatusUpdate) => void;
}): Promise<RouterResult> {
  const candidates = buildCandidateChain(settings).slice(0, 8);
  let lastFailedName: string | undefined;
  let lastReason = 'Tidak ada server model yang merespons saat ini.';

  for (let idx = 0; idx < candidates.length; idx++) {
    if (signal?.aborted) {
      throw new DOMException('Permintaan dibatalkan oleh pengguna.', 'AbortError');
    }

    const model = candidates[idx];
    const isFallback = idx > 0 && settings.selectedModelId !== 'auto';

    onStatus?.({
      modelName: model.shortName,
      attempt: idx + 1,
      isFallback: idx > 0,
      previousFailedModel: lastFailedName,
    });

    const effectiveQuery = buildEffectivePrompt(
      prompt,
      history,
      settings,
      model.maxPromptChars
    );
    const specs = buildModelRequests(model, effectiveQuery, settings);

    if (specs.length === 0) {
      lastFailedName = model.shortName;
      lastReason = `Kunci API untuk ${model.name} belum diisi di Pengaturan.`;
      continue;
    }

    let modelSucceeded = false;
    for (const spec of specs) {
      try {
        const res = await callGateway(spec, signal);
        if (res.ok && typeof res.body === 'string') {
          const parsed = extractUniversalAnswer(res.body);
          if (parsed.length >= 2) {
            recordModelSuccess(model.id);
            modelSucceeded = true;
            return {
              content: parsed,
              answeredById: model.id,
              answeredByName: `${model.shortName} · ${model.provider}`,
              usedFallback: isFallback || (settings.selectedModelId === 'auto' && idx > 0),
              attemptsCount: idx + 1,
            };
          }
        }
        lastReason = res.error || `${model.shortName} mengembalikan respons kosong.`;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        lastReason =
          err instanceof Error ? err.message : `Gagal menghubungi ${model.shortName}.`;
      }
    }

    if (!modelSucceeded) {
      recordModelFailure(model.id, lastReason);
      lastFailedName = model.shortName;
    }
  }

  throw new Error(
    `${lastReason} Silakan coba kirim ulang atau pilih model lain dari daftar.`
  );
}

export async function generateMultiEngineImage({
  prompt,
  signal,
  onStatus,
}: {
  prompt: string;
  signal?: AbortSignal;
  onStatus?: (status: RouterStatusUpdate) => void;
}): Promise<RouterResult> {
  const cleanPrompt = prompt.trim();
  let lastFailedName: string | undefined;

  for (let idx = 0; idx < IMAGE_ENGINES.length; idx++) {
    if (signal?.aborted) {
      throw new DOMException('Pembuatan gambar dibatalkan.', 'AbortError');
    }

    const engine = IMAGE_ENGINES[idx];
    onStatus?.({
      modelName: engine.name,
      attempt: idx + 1,
      isFallback: idx > 0,
      previousFailedModel: lastFailedName,
    });

    try {
      const res = await callGateway(
        {
          targetUrl: engine.buildUrl(cleanPrompt),
          method: 'GET',
          timeoutMs: engine.timeoutMs,
        },
        signal
      );

      if (res.ok && res.kind === 'image' && res.imageUrl) {
        return {
          content: `Gambar berhasil dibuat dari deskripsi: "${cleanPrompt}"`,
          answeredById: engine.id,
          answeredByName: engine.name,
          usedFallback: idx > 0,
          attemptsCount: idx + 1,
          imageUrl: res.imageUrl,
        };
      }

      if (res.ok && typeof res.body === 'string') {
        try {
          const parsed = JSON.parse(res.body) as Record<string, unknown>;
          const candidateUrl =
            (typeof parsed.result === 'string' && parsed.result) ||
            (typeof parsed.url === 'string' && parsed.url) ||
            (typeof parsed.image === 'string' && parsed.image) ||
            (parsed.data &&
            typeof parsed.data === 'object' &&
            typeof (parsed.data as Record<string, unknown>).url === 'string'
              ? ((parsed.data as Record<string, unknown>).url as string)
              : '');

          if (candidateUrl && /^https?:\/\//i.test(candidateUrl)) {
            return {
              content: `Gambar berhasil dibuat dari deskripsi: "${cleanPrompt}"`,
              answeredById: engine.id,
              answeredByName: engine.name,
              usedFallback: idx > 0,
              attemptsCount: idx + 1,
              imageUrl: candidateUrl,
            };
          }
        } catch {
          // Not JSON, fall through to next engine
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }

    lastFailedName = engine.name;
  }

  throw new Error(
    'Seluruh server pembuat gambar sedang padat. Coba ulangi beberapa saat lagi.'
  );
}

export function getHealthyModelCount(): number {
  return AI_MODELS.filter((m) => m.id !== 'auto' && !m.requiresKey && !isModelCoolingDown(m.id))
    .length;
}
