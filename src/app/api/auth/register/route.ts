import { updateDB } from "@/lib/db";
import { setSessionCookie, toPublicUser, HttpError } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { handle, ok, readJson, str } from "@/lib/api";
import { AI_USER_ID } from "@/lib/seed";
import type { Chat, Message, User } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLORS = ["rose", "sky", "amber", "violet", "teal", "orange", "emerald", "indigo"];
const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, "");

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ name?: string; phone?: string; password?: string }>(request);
    const name = str(body.name, "Nama", { max: 60 });
    const phone = normalizePhone(str(body.phone, "Nomor telepon", { max: 20 }));
    const password = str(body.password, "Password", { max: 200 });
    if (phone.length < 8) throw new HttpError(400, "Nomor telepon minimal 8 digit");
    if (password.length < 6) throw new HttpError(400, "Password minimal 6 karakter");

    const created = await updateDB(async (db) => {
      if (db.users.some((u) => !u.isSystem && normalizePhone(u.phone) === phone)) {
        throw new HttpError(409, "Nomor telepon sudah terdaftar");
      }
      const user: User = {
        id: `u-${crypto.randomUUID().slice(0, 8)}`,
        name,
        phone,
        about: "Hai! Saya baru di VibeChat 👋",
        avatarColor: COLORS[db.users.length % COLORS.length],
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);

      // beri sapaan awal dari Vibe AI supaya akun baru tidak kosong
      const ai = db.users.find((u) => u.id === AI_USER_ID);
      if (ai) {
        const chat: Chat = {
          id: `c-${crypto.randomUUID().slice(0, 8)}`,
          type: "dm",
          avatarColor: "ai",
          memberIds: [user.id, AI_USER_ID],
          pinned: true,
          muted: false,
          archived: false,
          ai: { enabled: true, persona: "Asisten Vibe yang ramah dan membantu, menjelaskan fitur VibeChat dengan singkat." },
          lastRead: { [user.id]: new Date().toISOString() },
          createdAt: new Date().toISOString(),
        };
        const message: Message = {
          id: crypto.randomUUID(),
          chatId: chat.id,
          senderId: AI_USER_ID,
          type: "text",
          body: `Halo ${name.split(" ")[0]}! 👋 Selamat datang di VibeChat. Aktifkan auto-responder di Pengaturan untuk melihat AI membalas otomatis.`,
          createdAt: new Date().toISOString(),
          readBy: [AI_USER_ID],
          deletedFor: [],
        };
        db.chats.push(chat);
        db.messages.push(message);
      }
      return user;
    });

    await setSessionCookie(created.id);
    return ok({ user: toPublicUser(created) }, 201);
  });
}
