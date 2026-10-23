import { requireUser, HttpError } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { isMember } from "@/lib/chats";
import { aiTyping } from "@/lib/autoresponder";

export const dynamic = "force-dynamic";

/** Status "AI sedang mengetik" untuk polling ringan. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const db = await readDB();
    const chat = db.chats.find((c) => c.id === id);
    if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
    if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");
    return ok({ typing: aiTyping(id) });
  });
}
