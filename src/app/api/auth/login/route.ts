import { readDB } from "@/lib/db";
import { setSessionCookie, toPublicUser, HttpError } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { handle, ok, readJson, str } from "@/lib/api";

export const dynamic = "force-dynamic";

const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, "");

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ phone?: string; password?: string }>(request);
    const phone = normalizePhone(str(body.phone, "Nomor telepon", { max: 20 }));
    const password = str(body.password, "Password", { max: 200 });

    const db = await readDB();
    const user = db.users.find(
      (u) => !u.isSystem && normalizePhone(u.phone) === phone,
    );
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Nomor telepon atau password salah");
    }
    await setSessionCookie(user.id);
    return ok({ user: toPublicUser(user) });
  });
}
