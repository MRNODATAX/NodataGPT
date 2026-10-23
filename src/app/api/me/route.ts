import { requireUser } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { handle, ok, readJson, str } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok({ user });
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson<{ name?: string; about?: string; avatarColor?: string }>(request);
    const updated = await updateDB((db) => {
      const user = db.users.find((u) => u.id === me.id);
      if (!user) return null;
      if (body.name !== undefined) user.name = str(body.name, "Nama", { max: 60 });
      if (body.about !== undefined) user.about = str(body.about, "Tentang", { max: 160, optional: true });
      if (body.avatarColor !== undefined) user.avatarColor = str(body.avatarColor, "Warna", { max: 20 });
      const { passwordHash: _hash, ...rest } = user;
      return rest;
    });
    return ok({ user: updated });
  });
}
