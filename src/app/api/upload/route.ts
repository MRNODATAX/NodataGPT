import { promises as fs } from "node:fs";
import path from "node:path";
import { requireUser, HttpError } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import type { MessageType } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Batas per kategori (byte). Ubah di sini bila kuota host berubah. */
const LIMITS = {
  image: 8 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  file: 25 * 1024 * 1024,
} as const;

/** MIME -> [ekstensi, kategori] */
const ALLOWED: Record<string, [string, MessageType]> = {
  // gambar
  "image/png": ["png", "image"],
  "image/jpeg": ["jpg", "image"],
  "image/webp": ["webp", "image"],
  "image/gif": ["gif", "image"],
  // video
  "video/mp4": ["mp4", "video"],
  "video/webm": ["webm", "video"],
  "video/quicktime": ["mov", "video"],
  // audio
  "audio/mpeg": ["mp3", "audio"],
  "audio/mp4": ["m4a", "audio"],
  "audio/ogg": ["ogg", "audio"],
  "audio/webm": ["weba", "audio"],
  "audio/wav": ["wav", "audio"],
  // dokumen
  "application/pdf": ["pdf", "file"],
  "text/plain": ["txt", "file"],
  "text/csv": ["csv", "file"],
  "text/markdown": ["md", "file"],
  "application/json": ["json", "file"],
  "application/zip": ["zip", "file"],
  "application/x-zip-compressed": ["zip", "file"],
  "application/msword": ["doc", "file"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx", "file"],
  "application/vnd.ms-excel": ["xls", "file"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx", "file"],
  "application/vnd.ms-powerpoint": ["ppt", "file"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx", "file"],
};

/** Cadangan bila peramban mengirim MIME generik (application/octet-stream). */
const BY_EXT: Record<string, [string, MessageType]> = {
  png: ["png", "image"],
  jpg: ["jpg", "image"],
  jpeg: ["jpg", "image"],
  webp: ["webp", "image"],
  gif: ["gif", "image"],
  mp4: ["mp4", "video"],
  webm: ["webm", "video"],
  mov: ["mov", "video"],
  mp3: ["mp3", "audio"],
  m4a: ["m4a", "audio"],
  ogg: ["ogg", "audio"],
  weba: ["weba", "audio"],
  wav: ["wav", "audio"],
  pdf: ["pdf", "file"],
  txt: ["txt", "file"],
  csv: ["csv", "file"],
  md: ["md", "file"],
  json: ["json", "file"],
  zip: ["zip", "file"],
  doc: ["doc", "file"],
  docx: ["docx", "file"],
  xls: ["xls", "file"],
  xlsx: ["xlsx", "file"],
  ppt: ["ppt", "file"],
  pptx: ["pptx", "file"],
};

function humanLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Bersihkan nama file agar aman di filesystem & header. */
function safeName(name: string): string {
  return (
    name
      .replace(/\.[^./\\]*$/, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .slice(0, 60) || "berkas"
  );
}

export async function POST(request: Request) {
  return handle(async () => {
    await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Berkas tidak ditemukan");
    if (file.size === 0) throw new HttpError(400, "Berkas kosong");

    const extFromName = file.name?.split(".").pop()?.toLowerCase() ?? "";
    const match = ALLOWED[file.type] ?? BY_EXT[extFromName];
    if (!match) {
      throw new HttpError(
        415,
        `Jenis berkas tidak didukung (${file.type || "tidak dikenal"}). Gunakan gambar, video, audio, atau dokumen umum (PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP, TXT, CSV).`,
      );
    }
    const [ext, kind] = match;
    const limit = LIMITS[kind as keyof typeof LIMITS];
    if (file.size > limit) {
      throw new HttpError(413, `Ukuran maksimal untuk ${kind} adalah ${humanLimit(limit)}`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    // nama acak: cegah tabrakan & path traversal; nama asli disimpan di metadata pesan
    const stored = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await fs.writeFile(path.join(dir, stored), buffer);

    // MIME kanonik: penting saat peramban mengirim application/octet-stream
    const canonical =
      Object.entries(ALLOWED).find(([, value]) => value[0] === ext && value[1] === kind)?.[0] ?? file.type;

    return ok(
      {
        url: `/uploads/${stored}`,
        type: canonical,
        kind,
        size: file.size,
        name: file.name?.slice(0, 120) || `${safeName("berkas")}.${ext}`,
      },
      201,
    );
  });
}
