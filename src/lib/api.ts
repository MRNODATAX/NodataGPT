import { NextResponse } from "next/server";
import { HttpError } from "./auth";
import { AIError } from "./ai";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Bungkus handler agar error konsisten dan tidak membocorkan stack trace. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) return fail(error.message, error.status);
    if (error instanceof AIError) return fail(error.message, error.status);
    if (error instanceof SyntaxError) return fail("Body JSON tidak valid", 400);
    console.error("[vibechat]", error);
    return fail("Terjadi kesalahan pada server", 500);
  }
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Body JSON tidak valid");
  }
}

export function str(value: unknown, name: string, { max = 2000, optional = false } = {}): string {
  if (value === undefined || value === null || value === "") {
    if (optional) return "";
    throw new HttpError(400, `${name} wajib diisi`);
  }
  if (typeof value !== "string") throw new HttpError(400, `${name} harus berupa teks`);
  const trimmed = value.trim();
  if (!optional && !trimmed) throw new HttpError(400, `${name} wajib diisi`);
  if (trimmed.length > max) throw new HttpError(400, `${name} maksimal ${max} karakter`);
  return trimmed;
}
