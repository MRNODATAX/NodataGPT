import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Direktori kontak untuk membuat chat baru. */
export async function GET(request: Request) {
  return handle(async () => {
    const me = await requireUser();
    const q = new URL(request.url).searchParams.get("q")?.toLowerCase().trim() ?? "";
    const db = await readDB();
    const users = db.users
      .filter((u) => u.id !== me.id)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.phone.includes(q))
      .map(({ passwordHash: _hash, ...rest }) => rest);
    return ok({ users });
  });
}
