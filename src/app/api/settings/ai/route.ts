import { requireUser, HttpError } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import type { AISettings, AIProvider } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  enabled?: boolean;
  provider?: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  replyDelayMs?: number;
  contextMessages?: number;
}

/** Kunci API tidak pernah dikirim utuh ke browser. */
function mask(settings: AISettings) {
  const { apiKey, ...rest } = settings;
  return {
    ...rest,
    hasApiKey: Boolean(apiKey),
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 3)}••••••${apiKey.slice(-4)}` : "",
    keyFromEnv: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
  };
}

function effective(settings: AISettings): AISettings {
  if (settings.apiKey) return settings;
  const envKey =
    settings.provider === "gemini"
      ? process.env.GEMINI_API_KEY || process.env.AI_API_KEY
      : process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  return { ...settings, apiKey: envKey ?? "" };
}

export async function GET() {
  return handle(async () => {
    await requireUser();
    const db = await readDB();
    return ok({ settings: mask(db.ai) });
  });
}

export async function PUT(request: Request) {
  return handle(async () => {
    await requireUser();
    const body = await readJson<Body>(request);

    const settings = await updateDB((db) => {
      const next: AISettings = { ...db.ai };

      if (typeof body.enabled === "boolean") next.enabled = body.enabled;
      if (body.provider === "gemini" || body.provider === "custom") next.provider = body.provider;
      if (typeof body.apiKey === "string") {
        const key = body.apiKey.trim();
        if (key) next.apiKey = key.slice(0, 500);
        else if (body.apiKey === "") next.apiKey = "";
      }
      if (typeof body.baseUrl === "string") next.baseUrl = body.baseUrl.trim().slice(0, 300);
      if (typeof body.model === "string") next.model = body.model.trim().slice(0, 120);
      if (typeof body.systemPrompt === "string") next.systemPrompt = body.systemPrompt.slice(0, 4000);
      if (typeof body.temperature === "number" && Number.isFinite(body.temperature)) {
        next.temperature = Math.min(2, Math.max(0, body.temperature));
      }
      if (typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)) {
        next.maxTokens = Math.min(8192, Math.max(64, Math.round(body.maxTokens)));
      }
      if (typeof body.replyDelayMs === "number" && Number.isFinite(body.replyDelayMs)) {
        next.replyDelayMs = Math.min(15_000, Math.max(0, Math.round(body.replyDelayMs)));
      }
      if (typeof body.contextMessages === "number" && Number.isFinite(body.contextMessages)) {
        next.contextMessages = Math.min(100, Math.max(2, Math.round(body.contextMessages)));
      }

      if (next.enabled && !effective(next).apiKey) {
        throw new HttpError(400, "Isi API key terlebih dahulu sebelum mengaktifkan auto-responder");
      }
      if (next.provider === "custom" && next.enabled && !next.baseUrl) {
        throw new HttpError(400, "Endpoint AI wajib diisi untuk provider custom");
      }

      db.ai = next;
      return next;
    });

    return ok({ settings: mask(settings) });
  });
}
