import { promises as fs } from "node:fs";
import path from "node:path";
import { requireUser, HttpError } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  return handle(async () => {
    await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Berkas tidak ditemukan");
    if (file.size > MAX_BYTES) throw new HttpError(413, "Ukuran gambar maksimal 8 MB");
    const ext = ALLOWED[file.type];
    if (!ext) throw new HttpError(415, "Format gambar harus PNG, JPG, WEBP, atau GIF");

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await fs.writeFile(path.join(dir, name), buffer);

    return ok({ url: `/uploads/${name}`, size: file.size, type: file.type }, 201);
  });
}
