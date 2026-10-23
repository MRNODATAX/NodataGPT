import type { AISettings, Chat, DB, Message } from "./types";

export interface AIResult {
  text: string;
  provider: AISettings["provider"];
  model: string;
}

export class AIError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function geminiUrl(baseUrl: string, model: string, apiKey: string): string {
  const base = (baseUrl || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
  const root = /\/v1(beta)?\d*$/.test(base) ? base : `${base}/v1beta`;
  return `${root}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function openAIUrl(baseUrl: string): string {
  const base = (baseUrl || "https://api.openai.com").replace(/\/+$/, "");
  if (/\/chat\/completions$/.test(base)) return base;
  if (/\/v\d+[a-z]*$/.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

interface Turn {
  role: "user" | "assistant";
  text: string;
}

const TIMEOUT_MS = 45_000;

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* body bukan JSON */
    }
    if (!res.ok) {
      const detail =
        (json as { error?: { message?: string } })?.error?.message ||
        raw.slice(0, 300) ||
        `HTTP ${res.status}`;
      throw new AIError(`Provider AI menolak permintaan (${res.status}): ${detail}`, 502);
    }
    return json;
  } catch (err) {
    if (err instanceof AIError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new AIError("Provider AI tidak merespons (timeout 45 detik)", 504);
    }
    throw new AIError(`Gagal menghubungi provider AI: ${(err as Error).message}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Panggil model sesuai provider yang dipilih pada Settings. */
export async function callAI(
  settings: AISettings,
  systemPrompt: string,
  turns: Turn[],
): Promise<AIResult> {
  const provider = settings.provider;
  if (!settings.apiKey) {
    throw new AIError("API key belum diisi. Buka Pengaturan → Auto Responder AI.", 400);
  }
  const model = settings.model?.trim() || (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");
  const temperature = clamp(settings.temperature ?? 0.8, 0, 2);
  const maxTokens = clamp(settings.maxTokens ?? 400, 64, 8192);

  if (provider === "gemini") {
    const contents = turns.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    }));
    const json = await post(
      geminiUrl(settings.baseUrl, model, settings.apiKey),
      { "x-goog-api-key": settings.apiKey },
      {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents.length ? contents : [{ role: "user", parts: [{ text: "Halo" }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      },
    );
    const candidates = json.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;
    const text = (candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) throw new AIError("Provider AI mengembalikan jawaban kosong", 502);
    return { text, provider, model };
  }

  const json = await post(
    openAIUrl(settings.baseUrl),
    { Authorization: `Bearer ${settings.apiKey}` },
    {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...turns.map((t) => ({ role: t.role, content: t.text })),
      ],
    },
  );
  const choices = json.choices as Array<{ message?: { content?: unknown } }> | undefined;
  const content = choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content.trim()
      : Array.isArray(content)
        ? content
            .map((part: { text?: string }) => part.text ?? "")
            .join("")
            .trim()
        : "";
  if (!text) throw new AIError("Provider AI mengembalikan jawaban kosong", 502);
  return { text, provider, model };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Bangun system prompt dari persona chat + konteks anggota. */
export function buildSystemPrompt(
  settings: AISettings,
  chat: Chat,
  db: DB,
  speakingAs: string,
): string {
  const persona = chat.ai.persona?.trim();
  const members = chat.memberIds
    .map((id) => db.users.find((u) => u.id === id))
    .filter((u): u is DB["users"][number] => Boolean(u))
    .map((u) => `${u.name} (${u.phone})${u.isSystem ? " [AI]" : ""}`)
    .join(", ");

  return [
    settings.systemPrompt?.trim() ||
      "Kamu adalah rekan chat yang ramah dan santai. Balas singkat dan natural dalam Bahasa Indonesia.",
    "",
    `Kamu membalas sebagai: ${speakingAs}.`,
    chat.type === "group"
      ? `Ini percakapan grup "${chat.name}" dengan anggota: ${members}.`
      : `Ini percakapan pribadi dengan: ${members}.`,
    persona ? `Kepribadian dan gaya bicaramu: ${persona}` : "",
    "",
    "Aturan:",
    "- Balas hanya isi pesan, tanpa nama pengirim dan tanpa tanda kutip pembungkus.",
    "- Panjang 1-3 kalimat, gaya chat manusia, boleh emoji secukupnya.",
    "- Jangan pernah mengaku sebagai AI, bot, atau model bahasa.",
    "- Jangan mengarang janji, harga, atau tautan yang tidak diminta.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Konversi riwayat chat menjadi giliran untuk model. */
export function buildTurns(
  messages: Message[],
  assistantId: string,
  limit: number,
): Turn[] {
  return messages
    .slice(-limit)
    .map<Message | null>((m) => (m.type === "image" ? null : m))
    .filter((m): m is Message => Boolean(m))
    .map((m) => ({
      role: m.senderId === assistantId ? "assistant" : "user",
      text: m.body.slice(0, 2000),
    }));
}
