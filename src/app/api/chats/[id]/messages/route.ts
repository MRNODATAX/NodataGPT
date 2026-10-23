import { requireUser, HttpError } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import { isMember } from "@/lib/chats";
import { scheduleAutoReply } from "@/lib/autoresponder";
import type { Message, MessageType } from "@/lib/types";

const MESSAGE_TYPES: MessageType[] = ["text", "image", "video", "audio", "file"];

export const dynamic = "force-dynamic";

interface SendBody {
  body?: string;
  type?: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  replyToId?: string;
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const payload = await readJson<SendBody>(request);

    const body = (payload.body ?? "").toString().trim();
    const type: MessageType = MESSAGE_TYPES.includes(payload.type as MessageType)
      ? (payload.type as MessageType)
      : "text";
    if (type !== "text" && !payload.mediaUrl) {
      throw new HttpError(400, "Lampiran tidak ditemukan");
    }
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
        body: body || labelFor(type, payload.fileName),
        mediaUrl: payload.mediaUrl,
        fileName: payload.fileName?.slice(0, 120),
        fileSize: typeof payload.fileSize === "number" ? payload.fileSize : undefined,
        mimeType: payload.mimeType?.slice(0, 120),
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

/** Label fallback bila pengguna mengirim lampiran tanpa teks. */
function labelFor(type: MessageType, fileName?: string): string {
  switch (type) {
    case "image":
      return "📷 Foto";
    case "video":
      return "🎬 Video";
    case "audio":
      return "🎵 Pesan suara";
    case "file":
      return `📄 ${fileName || "Dokumen"}`;
    default:
      return "";
  }
}
