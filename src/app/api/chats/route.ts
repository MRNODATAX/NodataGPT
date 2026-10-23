import { requireUser, HttpError } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { handle, ok, readJson } from "@/lib/api";
import { toSummary } from "@/lib/chats";
import type { Chat } from "@/lib/types";
import type { ChatSummary } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    const db = await readDB();
    const users = db.users.map(({ passwordHash: _hash, ...rest }) => rest);
    const chats: ChatSummary[] = db.chats
      .filter((chat) => chat.memberIds.includes(me.id))
      .map((chat) => toSummary(chat, db.messages, users, me.id))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    return ok({ chats, users, me });
  });
}

interface CreateBody {
  type?: "dm" | "group";
  memberIds?: string[];
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson<CreateBody>(request);
    const type = body.type === "group" ? "group" : "dm";
    const memberIds = Array.from(new Set([me.id, ...(body.memberIds ?? [])]));

    const created = await updateDB((db) => {
      if (memberIds.length < 2) throw new HttpError(400, "Pilih minimal satu kontak");
      for (const id of memberIds) {
        if (!db.users.some((u) => u.id === id)) throw new HttpError(404, `Kontak ${id} tidak ditemukan`);
      }
      if (type === "dm") {
        if (memberIds.length !== 2) throw new HttpError(400, "Chat pribadi hanya untuk 1 kontak");
        const existing = db.chats.find(
          (c) =>
            c.type === "dm" &&
            c.memberIds.length === 2 &&
            memberIds.every((id) => c.memberIds.includes(id)),
        );
        if (existing) {
          existing.archived = false;
          return { chat: existing, existed: true };
        }
      }
      if (type === "group" && !body.name?.trim()) {
        throw new HttpError(400, "Nama grup wajib diisi");
      }
      const chat: Chat = {
        id: `c-${crypto.randomUUID().slice(0, 8)}`,
        type,
        name: type === "group" ? body.name!.trim().slice(0, 80) : undefined,
        avatarColor: type === "group" ? "sky" : "emerald",
        memberIds,
        pinned: false,
        muted: false,
        archived: false,
        ai: { enabled: false },
        lastRead: { [me.id]: new Date().toISOString() },
        createdAt: new Date().toISOString(),
      };
      db.chats.push(chat);
      return { chat, existed: false };
    });

    return ok(created, created.existed ? 200 : 201);
  });
}
