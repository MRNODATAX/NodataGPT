# NodataGPT (Web + Multi-Model Router + PWA APK)

**NodataGPT** adalah aplikasi web percakapan AI multi-model responsif untuk perangkat **Mobile** maupun **Desktop**, dilengkapi sistem **Auto-Fallback** otomatis saat server sibuk, pembuatan gambar AI 4-engine, dan dukungan pemasangan **PWA / WebAPK Android**.

![Logo NodataGPT](./public/logo.png)

## Fitur Utama
- **Identitas & Tema NodataGPT:** Logo simpul heksagonal setengah Cyan (`#22D3EE`) dan setengah Oranye (`#FB923C`) di atas latar Obsidian (`#000000` / `#080A0F`) lengkap dengan layar pembuka berprogres.
- **24+ Jalur Model AI + Auto-Fallback & Circuit Breaker:**
  - Mencakup Gemini, ChatGPT Cepat, Stenly, LLM7, DeepSeek V3.2/V4, Claude Sonnet/Haiku, Qwen3 Coder/80B, Llama 4 Scout, BintangAPI, WormGPT Classic, MathGPT, hingga dukungan kunci pribadi resmi Google AI Studio & DeepSeek.
  - Apabila model yang dipilih mengalami gangguan atau *timeout*, router otomatis mengalihkan permintaan ke server sehat berikutnya dan menandai server bermasalah selama 10 menit setelah 3 kegagalan beruntun.
- **Pembuat Gambar AI Multi-Engine:** Terintegrasi 4 mesin gambar AI (`Pollinations Flux`, `Rin Flux`, `Rin Text2Img`, `Varhad Image`) dengan pengalihan otomatis.
- **Tata Letak Responsif Mobile & Desktop (Gaya Google Gemini):**
  - **Mobile (`320px–430px`):** Bilah atas ringkas bebas tumpang tindih, *Bottom Sheet* pemilih model, chip pembuka 2x2 satu layar penuh, dan kapsul komposer satu baris.
  - **Desktop (`>= 1024px`):** Bilah samping yang dapat diciutkan (`72px` / `284px`), kolom baca terpusat, kartu ide terstruktur, dan pintasan `Ctrl/Cmd + K`.
- **Serverless Gateway (`/api/proxy`):** Menangani *forwarding* ke server AI pihak ketiga dari sisi server Vercel agar bebas kendala CORS di peramban HP maupun desktop.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

## Build Produksi & PWA

```bash
npm run build
npm run preview
```
