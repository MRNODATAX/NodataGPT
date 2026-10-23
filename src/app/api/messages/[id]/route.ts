import { requireUser, HttpError } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Hapus pesan: `?scope=me` (hapus lokal) atau `?scope=all` (untuk semua). */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    const { id } = await ctx.params;
    const scope = new URL(request.url).searchParams.get("scope") === "all" ? "all" : "me";

    await updateDB((db) => {
      const message = db.messages.find((m) => m.id === id);
      if (!message) throw new HttpError(404, "Pesan tidak ditemukan");
      const chat = db.chats.find((c) => c.id === message.chatId);
      if (!chat || !chat.memberIds.includes(me.id)) {
        throw new HttpError(403, "Kamu tidak punya akses ke pesan ini");
      }
      if (scope === "all") {
        if (message.senderId !== me.id) {
          throw new HttpError(403, "Hanya pengirim yang bisa menghapus pesan untuk semua orang");
        }
        db.messages = db.messages.filter((m) => m.id !== id);
      } else {
        if (!message.deletedFor.includes(me.id)) message.deletedFor.push(me.id);
      }
    });

    return ok({ success: true, scope });
  });
}
