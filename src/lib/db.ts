import { promises as fs } from "node:fs";
import path from "node:path";
import type { DB } from "./types";
import { buildSeedDB } from "./seed";

const DB_PATH =
  process.env.VIBECHAT_DB || path.join(process.cwd(), "data", "db.json");

const EMPTY_DB: DB = {
  meta: { version: 1, authSecret: "", createdAt: new Date().toISOString() },
  users: [],
  chats: [],
  messages: [],
  ai: {
    enabled: false,
    provider: "gemini",
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-flash",
    systemPrompt: "",
    temperature: 0.8,
    maxTokens: 400,
    replyDelayMs: 1200,
    contextMessages: 20,
  },
};

/**
 * Store JSON sederhana dengan:
 * - seed otomatis saat file belum ada,
 * - antrean tulis (serial) agar tidak ada write bersamaan,
 * - penulisan atomic (tmp file + rename) agar file tidak korup.
 */
let writeChain: Promise<unknown> = Promise.resolve();
let initializing: Promise<void> | null = null;

async function ensureDB(): Promise<void> {
  if (!initializing) {
    initializing = (async () => {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      try {
        await fs.access(DB_PATH);
      } catch {
        const seed = await buildSeedDB();
        await writeAtomic(seed);
      }
    })();
  }
  return initializing;
}

async function writeAtomic(db: DB): Promise<void> {
  const payload = JSON.stringify(db, null, 2);
  const tmp = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, payload, "utf8");
  await fs.rename(tmp, DB_PATH);
}

export async function readDB(): Promise<DB> {
  await ensureDB();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as DB;
    return { ...EMPTY_DB, ...parsed, meta: { ...EMPTY_DB.meta, ...parsed.meta }, ai: { ...EMPTY_DB.ai, ...parsed.ai } };
  } catch {
    const seed = await buildSeedDB();
    await writeAtomic(seed);
    return seed;
  }
}

/** Mutasi berurutan; nilai balik adalah hasil mutator. */
export async function updateDB<T>(mutator: (db: DB) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await readDB();
    const result = await mutator(db);
    await writeAtomic(db);
    return result;
  });
  // rantai tulis tetap berjalan walaupun satu update gagal
  writeChain = run.catch(() => undefined);
  return run;
}

export async function resetDB(): Promise<DB> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const seed = await buildSeedDB();
  await writeAtomic(seed);
  return seed;
}

export function dbFilePath(): string {
  return DB_PATH;
}
