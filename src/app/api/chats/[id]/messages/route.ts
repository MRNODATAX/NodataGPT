import { requireUser, HttpError } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import { isMember } from "@/lib/chats";
import { scheduleAutoReply } from "@/lib/autoresponder";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SendBody {
  body?: string;
  type?: "text" | "image";
  mediaUrl?: string;
  replyToId?: string;
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const payload = await readJson<SendBody>(request);

    const body = (payload.body ?? "").toString().trim();
    const type = payload.type === "image" ? "image" : "text";
    if (!body && !payload.mediaUrl) throw new HttpError(400, "Pesan tidak boleh kosong");
    if (body.length > 4000) throw new HttpError(400, "Pesan maksimal 4000 karakter");

    const message = await updateDB((db) => {
      const chat = db.chats.find((c) => c.id === id);
      if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
      if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");
      if (payload.replyToId && !db.messages.some((m) => m.id === payload.replyToId && m.chatId === id)) {
        throw new HttpError(400, "Pesan yang dibalas tidak ditemukan");
      }
      const item: Message = {
        id: crypto.randomUUID(),
        chatId: id,
        senderId: me.id,
        type,
        body: body || "📷 Foto",
        mediaUrl: payload.mediaUrl,
        replyToId: payload.replyToId,
        createdAt: new Date().toISOString(),
        readBy: [me.id],
        deletedFor: [],
      };
      db.messages.push(item);
      chat.archived = false;
      chat.lastRead[me.id] = item.createdAt;
      return item;
    });

    // Cek kelayakan auto-reply sebelum menjadwalkan (tanpa menahan respons).
    const db = await readDB();
    const chat = db.chats.find((c) => c.id === id);
    if (chat?.ai.enabled && db.ai.enabled && db.ai.apiKey) {
      scheduleAutoReply({ chatId: id, ownerId: me.id, messageId: message.id });
    }

    return ok({ message }, 201);
  });
}
