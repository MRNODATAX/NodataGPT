import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { readDB } from "./db";
import type { User } from "./types";

const COOKIE = "vibe_session";
const MAX_AGE = 60 * 60 * 24 * 30;

async function secret(): Promise<string> {
  const db = await readDB();
  return process.env.AUTH_SECRET || db.meta.authSecret || "vibechat-dev-secret";
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload, await secret())}`;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, await secret());
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return typeof data.sub === "string" ? data.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

/** User yang sedang login, atau null. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const db = await readDB();
  const user = db.users.find((u) => u.id === userId && !u.isSystem);
  return user ? toPublicUser(user) : null;
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu");
  return user;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
