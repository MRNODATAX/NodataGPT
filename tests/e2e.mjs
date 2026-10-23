/**
 * Uji end-to-end VibeChat (UI + API + auto-responder).
 *
 * Menjalankan dua provider AI tiruan:
 *  - port 4010: endpoint OpenAI-compatible
 *  - port 4011: endpoint Gemini (generateContent)
 *
 * Pemakaian:
 *   1. npm run dev            (terminal 1)
 *   2. npx playwright install chromium   (sekali, butuh unduhan browser)
 *   3. npm run test:e2e       (terminal 2)
 *
 * Base URL bisa diubah lewat BASE_URL=http://localhost:3000
 */
import http from "node:http";
import { chromium as pw } from "playwright-core";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// --- Provider AI tiruan -----------------------------------------------------
const mocks = [];
function startMock(port, handler) {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => handler(req, res, body));
  });
  server.listen(port, "127.0.0.1");
  mocks.push(server);
}

startMock(4010, (_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "Halo dari endpoint kustom! 🚀" } }] }));
});

startMock(4011, (_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      candidates: [{ content: { role: "model", parts: [{ text: "Halo dari Gemini tiruan! 🌿 Semua adapter bekerja." }] } }],
    }),
  );
});

const results = [];
const check = (name, pass, extra = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? " :: " + extra : ""}`);
};

const browser = await pw.launch({ executablePath: await chromium.executablePath(), args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"], headless: true });
const errors = [];
const api = [];
const attach = (page, label) => {
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${label}: ${m.text()}`));
  page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 400) api.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
};

async function session(label, phone = "628111111111", password = "vibe123") {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.fill("#phone", phone);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".wa-app", { timeout: 20000 });
  await page.waitForTimeout(600);
  return page;
}

const page = await session("owner");
check("Daftar chat termuat", (await page.locator(".wa-item").count()) >= 7, `${await page.locator(".wa-item").count()} chat`);

/* kirim pesan + tick */
await page.click('.wa-item:has-text("Bima Saputra")');
await page.waitForSelector(".wa-composer-field textarea");
await page.waitForTimeout(500);
const stamp = `uji-${Date.now()}`;
await page.fill(".wa-composer-field textarea", stamp);
await page.click(".composer-send");
await page.waitForTimeout(1000);
check("Kirim pesan teks", (await page.locator(".msg-row .bubble-text").last().innerText()).includes(stamp));
const tickBefore = await page.locator(".msg-row.out .tick").last().getAttribute("class");
check("Centang awal belum biru", !tickBefore.includes("read"), tickBefore.trim());

/* emoji picker */
await page.click('button[aria-label="Emoji"]');
await page.waitForTimeout(400);
const emojiCount = await page.locator(".emoji-grid button").count();
await page.locator(".emoji-grid button").first().click();
const draft = await page.inputValue(".wa-composer-field textarea");
check("Pemilih emoji menyisipkan karakter", emojiCount > 20 && draft.length > 0, `${emojiCount} emoji`);
await page.fill(".wa-composer-field textarea", "");

/* lampiran menu */
await page.click('button[aria-label="Lampiran"]');
await page.waitForTimeout(300);
const attachOptions = await page.locator(".wa-pop button.opt").allInnerTexts();
check("Menu lampiran tampil", attachOptions.some((t) => t.includes("Foto")), attachOptions.join("/"));
await page.keyboard.press("Escape");
await page.mouse.click(800, 120);

/* upload gambar */
await page.setInputFiles('input[type="file"]', "/tmp/t.png");
await page.waitForTimeout(1000);
await page.click(".composer-send");
await page.waitForTimeout(1400);
check("Kirim gambar (upload server)", (await page.locator(".bubble-image").count()) > 0);

/* balasan kutipan */
const target = page.locator(".msg-row.in").first();
await target.hover();
await page.waitForTimeout(200);
await target.locator(".bubble-tools button").first().click();
await page.waitForTimeout(300);
await page.locator('.bubble-tools .wa-menu button:has-text("Balas")').click();
await page.waitForTimeout(300);
check("Panel balasan muncul", await page.locator(".composer-reply").isVisible());
await page.fill(".wa-composer-field textarea", "balasan kutipan uji");
await page.click(".composer-send");
await page.waitForTimeout(1200);
check("Kutipan tampil di bubble", (await page.locator(".msg-row.out .bubble-quote").count()) > 0);

/* baca di akun lain -> centang biru */
const bima = await session("bima", "6281200000003");
await bima.locator(".wa-item").filter({ has: bima.locator(".wa-item-name", { hasText: /^Kamu$/ }) }).first().click();
await bima.waitForTimeout(1200);
check("Akun lain menerima pesan", (await bima.locator(".msg-row").last().innerText()).includes("balasan kutipan uji"));
await page.waitForTimeout(4500);
check("Centang biru setelah dibaca", (await page.locator(".msg-row.out .tick").last().getAttribute("class")).includes("read"));

/* pencarian dalam chat */
await page.click('button[aria-label="Cari pesan"]');
await page.fill(".wa-thread-search input", "kutipan");
await page.waitForTimeout(600);
const hits = await page.locator(".msg-row.hit").count();
check("Pencarian dalam chat + sorotan", hits > 0, await page.locator(".wa-thread-search .hit-count").innerText());
await page.click('button[aria-label="Tutup pencarian"]');

/* hapus untuk semua (pesan terakhir milik sendiri) */
const rowsBefore = await page.locator(".msg-row").count();
const own = page.locator(".msg-row.out").last();
await own.hover();
await own.locator(".bubble-tools button").first().click();
await page.waitForTimeout(300);
await page.locator('.bubble-tools .wa-menu button:has-text("Hapus untuk semua")').click();
await page.waitForTimeout(1500);
check("Hapus pesan untuk semua", (await page.locator(".msg-row").count()) === rowsBefore - 1, `${rowsBefore} -> ${await page.locator(".msg-row").count()}`);

/* pin + arsip via menu header */
await page.click('button[aria-label="Menu chat"]');
await page.waitForTimeout(300);
const pinLabel = await page.locator(".wa-conv .wa-menu button").allInnerTexts();
await page.locator('.wa-conv .wa-menu button:has-text("Sematkan chat")').click();
await page.waitForTimeout(1000);
await page.click('button[aria-label="Menu chat"]');
await page.waitForTimeout(300);
await page.locator('.wa-conv .wa-menu button:has-text("Arsipkan chat")').click();
await page.waitForTimeout(1400);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.click('.wa-chip:has-text("Arsip")');
await page.waitForTimeout(900);
const archivedNames = await page.locator(".wa-item-name").allInnerTexts();
check("Chat masuk folder arsip", archivedNames.includes("Bima Saputra"), archivedNames.join(", "));
await page.click('.wa-item:has-text("Bima Saputra")');
await page.waitForTimeout(800);
await page.click('button[aria-label="Menu chat"]');
await page.waitForTimeout(300);
await page.locator('.wa-conv .wa-menu button:has-text("Keluarkan dari arsip")').click();
await page.waitForTimeout(1200);
await page.click('.wa-chip:has-text("Semua")');
await page.waitForTimeout(500);
check("Keluarkan dari arsip", (await page.locator(".wa-item-name").allInnerTexts()).includes("Bima Saputra"));

/* Gemini adapter */
await page.click('button[aria-label="Pengaturan asisten AI"]');
await page.waitForSelector(".modal");
await page.click('.modal .segmented button:has-text("Google Gemini")');
await page.fill("#baseurl", "http://127.0.0.1:4011");
await page.fill("#model", "gemini-2.5-flash");
await page.fill("#apikey", "AIza-uji");
await page.click('.modal button:has-text("Uji koneksi")');
await page.waitForTimeout(2600);
const okText = await page.locator(".modal .alert.success").innerText().catch(() => "");
check("Uji koneksi Gemini (adapter)", okText.includes("Koneksi berhasil"), okText.replace(/\n/g, " ").slice(0, 64));
// aktifkan auto-responder global
const globalSwitch = page.locator(".modal .wa-switch").first();
if (!(await globalSwitch.getAttribute("class")).includes("on")) {
  await globalSwitch.click();
  await page.waitForTimeout(1200);
}
const stillOn = (await page.locator(".modal .wa-switch").first().getAttribute("class")).includes("on");
check("Uji koneksi tidak mematikan auto-responder", stillOn);
await page.click('.modal-footer .btn.primary');
await page.waitForTimeout(800);
const savedToast = await page.locator(".toast").count();
check("Simpan pengaturan AI memberi konfirmasi", savedToast > 0);
await page.click('.modal-footer .btn.ghost');
await page.waitForSelector(".modal", { state: "detached" });
await page.waitForTimeout(400);

/* aktifkan auto-reply di chat lalu kirim pesan */
await page.click('button[aria-label="Info chat"]');
await page.waitForTimeout(500);
const aiSwitch = page.locator(".wa-info .wa-row-toggle:has-text('AI membalas chat ini') .wa-switch");
if (!(await aiSwitch.getAttribute("class")).includes("on")) await aiSwitch.click();
await page.waitForTimeout(900);
await page.click('button[aria-label="Tutup info chat"]');
await page.waitForTimeout(300);
await page.fill(".wa-composer-field textarea", "Tes balasan Gemini tiruan");
await page.click(".composer-send");
await page.waitForTimeout(1000);
check("Indikator AI mengetik", (await page.locator(".typing-bubble").count()) > 0);
await page.waitForTimeout(4000);
const aiReply = await page.locator(".msg-row.ai .bubble-text").last().innerText().catch(() => "");
check("Balasan auto-responder diterima", aiReply.includes("Gemini tiruan"), aiReply.slice(0, 44));

/* provider mati -> pesan peringatan */
await page.click('button[aria-label="Pengaturan asisten AI"]');
await page.waitForSelector(".modal");
await page.fill("#baseurl", "http://127.0.0.1:4999");
await page.click('.modal-footer .btn.primary');
await page.waitForTimeout(800);
await page.click('.modal-footer .btn.ghost');
await page.waitForSelector(".modal", { state: "detached" });
await page.waitForTimeout(400);
await page.fill(".wa-composer-field textarea", "Tes provider mati");
await page.click(".composer-send");
await page.waitForTimeout(5500);
check("Provider gagal ditangani", (await page.locator(".bubble-text:has-text('Auto-responder gagal')").count()) > 0);

/* grup baru */
await page.click('button[aria-label="Obrolan baru"]');
await page.waitForSelector(".modal");
await page.click('.modal .segmented button:nth-child(2)');
await page.fill("#group-name", "Design Squad");
await page.click('.modal .contact:has-text("Nabila Rahma")');
await page.click('.modal .contact:has-text("Citra Dewi")');
await page.click(".modal-footer .btn.primary");
await page.waitForTimeout(1800);
check("Buat grup baru", (await page.locator(".wa-conv-name").first().innerText()).includes("Design Squad"));

/* registrasi akun baru */
const freshCtx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const fp = await freshCtx.newPage();
attach(fp, "baru");
await fp.goto(`${BASE}/`, { waitUntil: "networkidle" });
await fp.click('.auth-tabs button:has-text("Daftar")');
await fp.fill("#name", "Penguji Baru");
await fp.fill("#phone", "6281299900011");
await fp.fill("#password", "rahasia123");
await fp.click('button[type="submit"]');
await fp.waitForSelector(".wa-app", { timeout: 20000 });
await fp.waitForTimeout(1200);
check("Registrasi akun + chat sambutan", (await fp.locator(".wa-item").count()) >= 1);
await freshCtx.close();

/* mobile */
const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mobCtx.newPage();
attach(mp, "mobile");
await mp.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mp.fill("#phone", "628111111111");
await mp.fill("#password", "vibe123");
await mp.click('button[type="submit"]');
await mp.waitForSelector(".wa-app");
await mp.waitForTimeout(900);
const sidebar = await mp.locator(".wa-sidebar").isVisible();
await mp.click(".wa-item");
await mp.waitForTimeout(900);
const conv = await mp.locator(".wa-conv").isVisible();
const sidebarGone = !(await mp.locator(".wa-sidebar").isVisible());
await mp.click('button[aria-label="Kembali"]');
await mp.waitForTimeout(500);
check("Mobile navigasi daftar ↔ chat", sidebar && conv && sidebarGone && (await mp.locator(".wa-sidebar").isVisible()));
await mobCtx.close();

console.log("\nHTTP >=400:", api.length ? api.slice(0, 6) : "none");
console.log("JS errors:", errors.length ? errors.slice(0, 6) : "none");
const failed = results.filter((r) => !r.pass);
console.log(`\nRINGKASAN: ${results.length - failed.length}/${results.length} lolos`);
if (failed.length) console.log("GAGAL:", failed.map((f) => f.name).join(" | "));
await browser.close();
