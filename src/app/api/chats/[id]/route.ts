import { requireUser, HttpError } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import { toDetail, visibleMessages, isMember } from "@/lib/chats";
import { aiTyping } from "@/lib/autoresponder";

export const dynamic = "force-dynamic";

const publicUsers = (users: Awaited<ReturnType<typeof readDB>>["users"]) =>
  users.map(({ passwordHash: _hash, ...rest }) => rest);

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const db = await readDB();
    const chat = db.chats.find((c) => c.id === id);
    if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
    if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");

    const users = publicUsers(db.users);
    return ok({
      chat: toDetail(chat, db.messages, users, me.id),
      messages: visibleMessages(db.messages.filter((m) => m.chatId === id), me.id),
      aiTyping: aiTyping(id),
    });
  });
}

interface PatchBody {
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  aiEnabled?: boolean;
  aiPersona?: string;
  name?: string;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const body = await readJson<PatchBody>(request);

    const detail = await updateDB((db) => {
      const chat = db.chats.find((c) => c.id === id);
      if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
      if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");

      if (typeof body.pinned === "boolean") chat.pinned = body.pinned;
      if (typeof body.muted === "boolean") chat.muted = body.muted;
      if (typeof body.archived === "boolean") chat.archived = body.archived;
      if (typeof body.aiEnabled === "boolean") chat.ai.enabled = body.aiEnabled;
      if (typeof body.aiPersona === "string") chat.ai.persona = body.aiPersona.slice(0, 4000);
      if (typeof body.name === "string" && chat.type === "group") {
        if (!body.name.trim()) throw new HttpError(400, "Nama grup tidak boleh kosong");
        chat.name = body.name.trim().slice(0, 80);
      }
      return toDetail(chat, db.messages, publicUsers(db.users), me.id);
    });

    return ok({ chat: detail });
  });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    await updateDB((db) => {
      const chat = db.chats.find((c) => c.id === id);
      if (!chat) throw new HttpError(404, "Chat tidak ditemukan");
      if (!isMember(chat, me.id)) throw new HttpError(403, "Kamu bukan anggota chat ini");
      db.chats = db.chats.filter((c) => c.id !== id);
      db.messages = db.messages.filter((m) => m.chatId !== id);
    });
    return ok({ success: true });
  });
}
