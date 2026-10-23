import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import { callAI } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Uji koneksi provider AI tanpa menyimpan hasil ke chat. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireUser();
    const body = await readJson<{ prompt?: string }>(request).catch(() => ({ prompt: undefined }));
    const db = await readDB();
    const settings = db.ai;

    const started = Date.now();
    const result = await callAI(
      settings,
      "Kamu adalah asisten uji koneksi. Jawab sangat singkat.",
      [{ role: "user", text: body.prompt?.slice(0, 300) || "Balas dengan satu kalimat: koneksi berhasil." }],
    );

    return ok({
      ok: true,
      provider: result.provider,
      model: result.model,
      latencyMs: Date.now() - started,
      reply: result.text,
    });
  });
}
