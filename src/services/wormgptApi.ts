import type { ChatAttachment, ChatMessage, PromptMode } from '../types/chat';

export const DEFAULT_WORMGPT_API = 'https://bintangapi.my.id/api/aichat/wormgpt?q=';

const METADATA_KEYS = new Set([
  'creator',
  'author',
  'owner',
  'powered_by',
  'poweredby',
  'status',
  'code',
  'http_code',
  'timestamp',
  'time',
  'date',
  'model',
  'version',
  'id',
]);

const PRIORITY_CONTENT_KEYS = [
  'result',
  'response',
  'answer',
  'reply',
  'content',
  'text',
  'output',
  'wormgpt',
  'jawaban',
  'pesan',
  'chat',
  'data',
  'message',
];

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
  mode: PromptMode;
  contextMemory: boolean;
  history: ChatMessage[];
  attachment: ChatAttachment | null;
}): string {
  const { userInput, mode, contextMemory, history, attachment } = options;
  const parts: string[] = [];

  if (mode === 'code') {
    parts.push('[Fokus: berikan solusi kode yang bersih, lengkap, dan langsung siap dijalankan]');
  } else if (mode === 'analysis') {
    parts.push('[Fokus: uraikan analisis secara terstruktur, jelas, dan mendalam]');
  }

  // Keep GET query under ~1.8KB so reverse proxies do not reject with HTTP 414.
  if (contextMemory && history.length > 0) {
    const recentValid = history
      .filter((m) => m.status !== 'error' && m.content.trim().length > 0)
      .slice(-4);
    if (recentValid.length > 0) {
      let snippet = recentValid
        .map((m) => `${m.role === 'user' ? 'User' : 'WormGPT'}: ${m.content.slice(0, 320)}`)
        .join('\n');
      if (snippet.length > 1200) {
        snippet = snippet.slice(-1200);
      }
      parts.push(`Konteks sebelumnya:\n${snippet}`);
    }
  }

  if (attachment) {
    const clippedFile = attachment.content.slice(0, 2400);
    parts.push(`Lampiran (${attachment.name}):\n\`\`\`\n${clippedFile}\n\`\`\``);
  }

  parts.push(userInput.trim());
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
      if (key in record) {
        const candidate = extractFromParsedValue(record[key], depth + 1);
        if (candidate) return candidate;
      }
    }

    let longestFallback: string | null = null;
    for (const [key, val] of Object.entries(record)) {
      if (METADATA_KEYS.has(key.toLowerCase())) continue;
      if (typeof val === 'string' && val.trim().length > 0) {
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
    if (
      err instanceof Error &&
      (err.message.includes('Permintaan ditolak') ||
        err.message.includes('Format JSON') ||
        ! (err instanceof SyntaxError))
    ) {
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
