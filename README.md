# WormGPT (Web & PWA APK)

Aplikasi web percakapan AI dan Progressive Web App (PWA / WebAPK) dengan tata letak terinspirasi Google Gemini dan skema warna Hitam, Oranye, serta Merah.

## Fitur Utama

- **Opening Progress Screen**: Layar pembuka hitam pekat menampilkan logo WormGPT, nama **WormGPT** tepat di bawah logo, serta indikator progres `0%` hingga `100%`.
- **Tata Letak Gaya Google Gemini**:
  - Panel samping yang dapat diciutkan menjadi bilah ikon `72px` di desktop atau dibuka sebagai laci geser di ponsel.
  - Sapaan pembuka dengan kartu instruksi awal untuk kode, arsitektur, dan dokumentasi.
  - Kotak input melayang di bagian bawah dengan tinggi baris otomatis, lampiran file teks/kode (`.ts`, `.js`, `.py`, `.json`, `.md`, `.sql`, dll.), dikte suara (Web Speech API), dan tombol pilih mode kerja.
- **Format Respons & Kode**:
  - Mendukung Markdown lengkap, tabel responsif, dan pewarnaan sintaks kode otomatis.
  - Tombol **Salin** dan **Unduh** langsung pada setiap blok kode.
  - Fitur salin jawaban, buat ulang respons, ubah pesan pengguna, baca suara (Text-to-Speech), dan ekspor percakapan ke file `.md`.
- **Integrasi Endpoint API**:
  - Terhubung langsung ke `https://bintangapi.my.id/api/aichat/wormgpt?q=` dan dapat disesuaikan melalui menu **Pengaturan**.
- **Siap Dipasang sebagai PWA / Android APK**:
  - Dilengkapi `manifest.webmanifest`, Workbox Service Worker offline shell, ikon `192x192`, `512x512`, `maskable`, serta `public/twa-manifest.json`.

## Menjalankan Proyek Secara Lokal

```bash
npm install
npm run dev
```

Untuk membuat bundel produksi:

```bash
npm run build
npm run preview
```

## Cara Memasang sebagai Aplikasi Android (PWA / APK)

1. **WebAPK Langsung (Tanpa Build Tambahan)**:
   - Deploy hasil `npm run build` (folder `dist/`) ke layanan HTTPS seperti Vercel, Netlify, atau Cloudflare Pages.
   - Buka URL di Google Chrome Android, lalu ketuk tombol **Pasang APK** di bagian atas aplikasi (atau menu titik tiga Chrome -> **Tambahkan ke layar utama** -> **Instal**).
2. **File `.apk` / `.aab` Mandiri**:
   - Masukkan URL hasil deploy ke [PWABuilder](https://www.pwabuilder.com/) atau jalankan `@bubblewrap/cli` menggunakan konfigurasi yang sudah disediakan pada `public/twa-manifest.json`.
