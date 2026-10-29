# NodataGPT — REA UI & Visual Reference Evidence Ledger

> Disusun menggunakan metodologi **`reverse-engineer-anything` (REA / `rea-agents` v6.8.0)** dari `https://github.com/morluto/rea`.
> Tanggal observasi: **29 Oktober 2026**.

## 1. Disiplin Epistemik REA

- **`[OBSERVED]`** — Diverifikasi langsung dari inspeksi halaman web target (`fetch_page`, bundel sumber, dan aturan CSS/DOM).
- **`[SOURCE-VERIFIED]`** — Diverifikasi langsung dari kode sumber repositori asli milik pengguna (`MRNODATAX/NodataNime` untuk `nodatanime.vercel.app`).
- **`[RECONSTRUCTED]`** — Sintesis bersih pada **NodataGPT** yang memadukan kelima referensi ke dalam palet **Obsidian + Electric Cyan (`#22D3EE`) + Blaze Orange (`#FB923C`)**.

---

## 2. Matriks Bukti dari 5 Referensi Target

| ID | Sumber Target | Status | Temuan Visual & Interaksi Kunci | Implementasi pada NodataGPT |
|---|---|---|---|---|
| `REA-01` | `https://nodatanime.vercel.app` (`MRNODATAX/NodataNime`) | `[SOURCE-VERIFIED]` | Kanvas `<canvas class="nd-starfield">` terisolasi GPU (`contain: strict; transform: translateZ(0)`) dengan **4-tier Sprite Atlas bintang** (`12px`, `24px`, `38px` halo, `38px` sinar silang 4-arah) + **sprite bintang jatuh `240x20`** (`meteorSprite`), `Float32Array` bebas GC, paralaks pointer desktop, guard resize address-bar mobile (`<130px`), adaptive FPS (`30fps` idle / `50fps` saat meteor melintas), serta panel kaca transparan (`backdrop-filter: blur(18px)`). | `src/components/StarfieldBackground.tsx` + sistem permukaan `.nd-glass-*` di `src/index.css` + splash dual-orbit `SplashScreen.tsx`. |
| `REA-02` | `https://gemini.google.com/` | `[OBSERVED]` | Sapaan hero gradien bercahaya (*"Hi, I'm Gemini. Where should we start?"*), bilah atas melayang yang sangat bersih (pemilih model di kiri atas, aksi ringkas di kanan), kapsul input membulat penuh (`28px`), dan chip aksi cepat yang tidak memenuhi layar ponsel. | Header kaca transparan satu baris di `App.tsx`, tipografi sapaan gradien kosmik & grid chip `2x2` ringkas mobile di `WelcomeScreen.tsx`. |
| `REA-03` | `https://claude.com` (`claude.ai`) | `[OBSERVED]` | Kedalaman permukaan editorial dengan *specular top-highlight* halus (`inset 0 1px 0 rgba(255,255,255,0.08)`), blok **Extended Thinking** yang dapat dibuka-tutup di atas jawaban, serta **Artifacts Preview** untuk melihat hasil render HTML/SVG secara langsung. | Akordion penalaran `<think>` otomatis di `ChatThread.tsx` dan tab **Pratinjau Live (Artifact)** bersandbox pada blok kode HTML/SVG di `MarkdownRenderer.tsx`. |
| `REA-04` | `https://qwen.ai` (`chat.qwen.ai`) | `[OBSERVED]` | Deretan *Capability Mode Pills* interaktif (`Thinking`, `Image Generation`, `Web Dev`, `Artifacts`, `Search`) dengan ikon berwarna dan umpan balik aktif yang tegas di sekitar area komposer & layar sambutan. | Pill mode kapabilitas taktil (`DeepThink`, `Gambar`, `Kode Web`, `Matematika`) di `WelcomeScreen.tsx` dan `ChatComposer.tsx`. |
| `REA-05` | `https://www.deepseek.com/` | `[OBSERVED]` | Atmosfer ruang angkasa dalam (*"Into the Unknown"*), tombol kapsul **DeepThink** langsung di dalam bilah komposer untuk mengaktifkan penalaran mendalam, serta indikator pemrosesan bercahaya. | Tombol **DeepThink** terintegrasi di `ChatComposer.tsx` yang memprioritaskan rantai model penalaran (`DeepSeek V3.2 Thinking` -> `DeepSeek V4` -> `Claude 3.5 Sonnet` -> `Qwen3 80B`) beserta auto-fallback. |
