import { requireUser, HttpError } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { isMember } from "@/lib/chats";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    await updateDB((db) => {
      const chat = db.chats.find((c) => c.id === id);
      if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
      if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");
      chat.lastRead[me.id] = new Date().toISOString();
      for (const message of db.messages) {
        if (message.chatId !== id) continue;
        if (!message.readBy.includes(me.id)) message.readBy.push(me.id);
      }
    });
    return ok({ success: true });
  });
}
