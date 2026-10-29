import type { ChatAttachment, ChatMessage } from '../types/chat';

export const DEFAULT_WORMGPT_API = 'https://bintangapi.my.id/api/aichat/wormgpt?q=';

const METADATA_KEYS = new Set([
  'creator',
  'author',
  'owner',
  'powered_by',
  'poweredby',
  'status',
  'success',
  'code',
  'http_code',
  'timestamp',
  'time',
  'date',
  'model',
  'version',
  'id',
  'prompt',
  'question',
  'query',
  'q',
  'input',
]);

const PRIORITY_CONTENT_KEYS = [
  'result',
  'response',
  'answer',
  'reply',
  'ai',
  'wormgpt',
  'assistant',
  'bot',
  'completion',
  'content',
  'text',
  'output',
  'hasil',
  'jawaban',
  'pesan',
  'msg',
  'chat',
  'data',
  'message',
];

const GENERIC_STATUS_TEXTS = new Set(['success', 'ok', 'berhasil', 'true']);

export function buildApiUrl(baseUrl: string, query: string): string {
  const cleanBase = (baseUrl || DEFAULT_WORMGPT_API).trim();
  const encoded = encodeURIComponent(query);

  if (cleanBase.endsWith('=') || cleanBase.endsWith('?') || cleanBase.endsWith('&')) {
    return `${cleanBase}${encoded}`;
  }
  if (cleanBase.includes('?')) {
    return `${cleanBase}&q=${encoded}`;
  }
  return `${cleanBase}?q=${encoded}`;
}

export function composePromptQuery(options: {
  userInput: string;
  contextMemory: boolean;
  history: ChatMessage[];
  attachment: ChatAttachment | null;
}): string {
  const { userInput, contextMemory, history, attachment } = options;
  const trimmedInput = userInput.trim();

  // Send 100% raw user input by default so WormGPT's native API persona is untouched.
  if (!contextMemory && !attachment) {
    return trimmedInput;
  }

  const parts: string[] = [];

  if (contextMemory && history.length > 0) {
    const recentValid = history
      .filter((m) => m.status !== 'error' && m.content.trim().length > 0)
      .slice(-4);
    if (recentValid.length > 0) {
      let snippet = recentValid
        .map((m) => `${m.role === 'user' ? 'User' : 'WormGPT'}: ${m.content.slice(0, 300)}`)
        .join('\n');
      if (snippet.length > 1100) {
        snippet = snippet.slice(-1100);
      }
      parts.push(`${snippet}`);
    }
  }

  if (attachment) {
    const clippedFile = attachment.content.slice(0, 2400);
    parts.push(`[${attachment.name}]\n${clippedFile}`);
  }

  parts.push(trimmedInput);
  return parts.join('\n\n');
}

function extractFromParsedValue(value: unknown, depth = 0): string | null {
  if (depth > 5 || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => extractFromParsedValue(item, depth + 1))
      .filter((item): item is string => Boolean(item))
      .join('\n\n');
    return joined.length > 0 ? joined : null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.choices) && record.choices.length > 0) {
      const firstChoice = record.choices[0] as Record<string, unknown>;
      const fromChoice =
        extractFromParsedValue(firstChoice?.message, depth + 1) ??
        extractFromParsedValue(firstChoice?.delta, depth + 1) ??
        extractFromParsedValue(firstChoice?.text, depth + 1);
      if (fromChoice) return fromChoice;
    }

    const explicitFailure =
      record.status === false ||
      record.success === false ||
      (typeof record.status === 'number' && record.status >= 400);

    if (explicitFailure) {
      const errText =
        (typeof record.error === 'string' && record.error) ||
        (typeof record.message === 'string' && record.message) ||
        'Permintaan ditolak oleh server API.';
      throw new Error(errText);
    }

    for (const key of PRIORITY_CONTENT_KEYS) {
      if (!(key in record)) continue;
      if (
        key === 'message' &&
        typeof record.message === 'string' &&
        GENERIC_STATUS_TEXTS.has(record.message.trim().toLowerCase())
      ) {
        continue;
      }
      const candidate = extractFromParsedValue(record[key], depth + 1);
      if (candidate) return candidate;
    }

    let longestFallback: string | null = null;
    for (const [key, val] of Object.entries(record)) {
      if (METADATA_KEYS.has(key.toLowerCase())) continue;
      if (typeof val === 'string' && val.trim().length > 0) {
        if (GENERIC_STATUS_TEXTS.has(val.trim().toLowerCase())) continue;
        if (!longestFallback || val.trim().length > longestFallback.length) {
          longestFallback = val.trim();
        }
      }
    }
    if (longestFallback) return longestFallback;

    for (const [key, val] of Object.entries(record)) {
      if (METADATA_KEYS.has(key.toLowerCase())) continue;
      if (typeof val === 'object' && val !== null) {
        const nested = extractFromParsedValue(val, depth + 1);
        if (nested) return nested;
      }
    }
  }

  return null;
}

export function extractAiReply(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    throw new Error('Server mengembalikan respons kosong.');
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const extracted = extractFromParsedValue(parsed);
    if (extracted) {
      return extracted;
    }
    throw new Error('Format JSON dari API tidak memiliki teks balasan yang dikenali.');
  } catch (err) {
    if (err instanceof Error && !(err instanceof SyntaxError)) {
      throw err;
    }
    return trimmed;
  }
}

export async function fetchWormGptResponse(params: {
  prompt: string;
  apiUrl: string;
  signal?: AbortSignal;
}): Promise<string> {
  const cleanApiUrl = (params.apiUrl || DEFAULT_WORMGPT_API).trim();
  const targetUrl = buildApiUrl(cleanApiUrl, params.prompt);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      signal: params.signal,
    });

    if (!response.ok) {
      throw new Error(`Server API merespons dengan status HTTP ${response.status}.`);
    }

    const rawText = await response.text();
    return extractAiReply(rawText);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }

    // Fallback to Vercel serverless proxy when browser CORS blocks direct upstream calls.
    if (err instanceof TypeError && cleanApiUrl === DEFAULT_WORMGPT_API) {
      try {
        const proxyRes = await fetch(
          `/api/wormgpt?q=${encodeURIComponent(params.prompt)}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json, text/plain, */*' },
            signal: params.signal,
          }
        );
        const contentType = proxyRes.headers.get('content-type') || '';
        if (proxyRes.ok && !contentType.includes('text/html')) {
          const proxyText = await proxyRes.text();
          return extractAiReply(proxyText);
        }
      } catch (proxyErr) {
        if (proxyErr instanceof DOMException && proxyErr.name === 'AbortError') {
          throw proxyErr;
        }
      }
    }

    if (err instanceof Error && !(err instanceof TypeError)) {
      throw err;
    }

    throw new Error(
      'Gagal terhubung ke server WormGPT API. Periksa koneksi internet Anda lalu coba kembali.'
    );
  }
}
