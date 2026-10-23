#!/usr/bin/env node
import { rm } from "node:fs/promises";
import path from "node:path";

const file = process.env.VIBECHAT_DB || path.join(process.cwd(), "data", "db.json");
await rm(file, { force: true });
console.log(`Database direset. Seed baru dibuat saat server dijalankan: ${file}`);
