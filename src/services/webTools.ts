import type { MediaDownloadItem } from '../types/chat';

export type WebToolCategoryId = 'A' | 'B' | 'D' | 'E';

export interface WebToolDefinition {
  id: string;
  category: WebToolCategoryId;
  categoryLabel: string;
  name: string;
  shortName: string;
  slashCommand: string;
  badge: string;
  description: string;
  placeholder: string;
  exampleInput: string;
  requiresInput: boolean;
  acceptsImageUpload?: boolean;
  secondarySelect?: {
    label: string;
    defaultValue: string;
    options: Array<{ value: string; label: string }>;
  };
}

export interface WebToolExecutionResult {
  content: string;
  answeredById: string;
  answeredByName: string;
  usedFallback: boolean;
  imageUrl?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  audioUrl?: string;
  audioTitle?: string;
  galleryUrls?: string[];
  downloadItems?: MediaDownloadItem[];
  summarizeTranscript?: string;
}

export interface WebToolStatusCallback {
  (info: {
    toolName: string;
    mirrorName: string;
    attempt: number;
    isFallback: boolean;
  }): void;
}

// Strictly Categories A, B, and D ONLY (Category C intentionally excluded per user directive)
export const WEB_TOOLS_CATALOG: WebToolDefinition[] = [
  // === CATEGORY A: MEDIA & SOCIAL DOWNLOADER ===
  {
    id: 'tiktok',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'TikTok HD + MP3 Downloader',
    shortName: 'TikTok HD',
    slashCommand: '/tiktok',
    badge: 'No Watermark + Audio',
    description:
      'Unduh video TikTok kualitas HD tanpa watermark, musik MP3/M4A asli, maupun slide foto.',
    placeholder: 'Tempel tautan video TikTok (https://www.tiktok.com/...)',
    exampleInput: 'https://www.tiktok.com/@tiktok/video/7106594312292453675',
    requiresInput: true,
  },
  {
    id: 'youtube',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'YouTube Video MP4 & MP3',
    shortName: 'YouTube DL',
    slashCommand: '/yt',
    badge: '720p MP4 / MP3',
    description:
      'Unduh video YouTube resolusi jernih (MP4) atau ekstrak audio musik (MP3) siap putar.',
    placeholder: 'Tempel tautan YouTube / Shorts (https://youtu.be/...)',
    exampleInput: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    requiresInput: true,
    secondarySelect: {
      label: 'Format Unduhan',
      defaultValue: '720',
      options: [
        { value: '720', label: 'Video MP4 (720p HD)' },
        { value: 'mp3', label: 'Audio Musik (MP3)' },
      ],
    },
  },
  {
    id: 'spotify',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'Spotify Track MP3 Downloader',
    shortName: 'Spotify MP3',
    slashCommand: '/spotify',
    badge: 'URL atau Judul Lagu',
    description:
      'Unduh lagu Spotify lengkap dengan cover album dari tautan track maupun pencarian judul lagu.',
    placeholder: 'Tautan track Spotify atau ketik judul lagu + penyanyi...',
    exampleInput: 'Tulus Hati Hati di Jalan',
    requiresInput: true,
  },
  {
    id: 'aio',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'All-in-One Social Downloader',
    shortName: 'AIO Social DL',
    slashCommand: '/aio',
    badge: 'IG · FB · X · CapCut',
    description:
      'Pengunduh lintas platform untuk Instagram Reels, Facebook, X/Twitter, Threads, CapCut, & TikTok.',
    placeholder: 'Tempel tautan postingan IG Reels / X / FB / TikTok...',
    exampleInput: 'https://www.tiktok.com/@tiktok/video/7106594312292453675',
    requiresInput: true,
  },

  // === CATEGORY B: AUDIO, AI MUSIC/VIDEO, VOICE & TRANSCRIPT ===
  {
    id: 'yttranscript',
    category: 'B',
    categoryLabel: 'Audio, Video AI & Suara',
    name: 'Transkrip YouTube + Ringkas AI',
    shortName: 'Transkrip YT',
    slashCommand: '/transkrip',
    badge: 'Teks + Ringkas 1-Klik',
    description:
      'Ekstrak teks transkrip penuh dari video YouTube lengkap dengan tombol ringkasan otomatis NodataGPT.',
    placeholder: 'Tempel tautan video YouTube yang memiliki subtitle...',
    exampleInput: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    requiresInput: true,
  },
  {
    id: 'text2video',
    category: 'B',
    categoryLabel: 'Audio, Video AI & Suara',
    name: 'AI Text-to-Video Generator',
    shortName: 'Text-to-Video',
    slashCommand: '/text2video',
    badge: 'MP4 + Efek Suara',
    description:
      'Ubah deskripsi teks menjadi klip video AI MP4 sinematik lengkap dengan efek audio otomatis.',
    placeholder: 'Deskripsikan adegan video AI yang ingin dibuat...',
    exampleInput: 'Futuristic cyberpunk Jakarta skyline at night with neon flying cars and rain',
    requiresInput: true,
    secondarySelect: {
      label: 'Rasio Video',
      defaultValue: '16:9',
      options: [
        { value: '16:9', label: '16:9 Landscape (Desktop / YouTube)' },
        { value: '9:16', label: '9:16 Portrait (Reels / TikTok / Shorts)' },
      ],
    },
  },
  {
    id: 'tts',
    category: 'B',
    categoryLabel: 'Audio, Video AI & Suara',
    name: 'Multi-Karakter AI Voice (TTS)',
    shortName: 'Suara AI (TTS)',
    slashCommand: '/tts',
    badge: 'Karakter Anime & Natural',
    description:
      'Ubah teks menjadi suara karakter AI ekspresif (Nahida, Raiden, Furina, Hu Tao, Zhongli, Google TTS).',
    placeholder: 'Ketik kalimat yang ingin diubah menjadi suara...',
    exampleInput: 'Halo semuanya! Perkenalkan saya NodataGPT karya Mr.NODATA.',
    requiresInput: true,
    secondarySelect: {
      label: 'Karakter Suara',
      defaultValue: 'nahida',
      options: [
        { value: 'nahida', label: 'Nahida (Cerah & Ramah)' },
        { value: 'furina', label: 'Furina (Ekspresif)' },
        { value: 'raiden', label: 'Raiden Shogun (Tenang & Tegas)' },
        { value: 'hutao', label: 'Hu Tao (Energik)' },
        { value: 'ganyu', label: 'Ganyu (Lembut)' },
        { value: 'zhongli', label: 'Zhongli (Bariton Berwibawa)' },
        { value: 'google', label: 'Natural Bahasa Indonesia (Google TTS)' },
      ],
    },
  },
  {
    id: 'aisong',
    category: 'B',
    categoryLabel: 'Audio, Video AI & Suara',
    name: 'AI Song & Lyrics Composer',
    shortName: 'AI Song Maker',
    slashCommand: '/aisong',
    badge: 'Musik & Lirik AI',
    description:
      'Rancang komposisi lagu & lirik orisinal bertema kustom lengkap dengan percobaan sintesis audio AI.',
    placeholder: 'Deskripsikan tema, suasana, atau genre lagu...',
    exampleInput: 'Lagu synthwave malam hari tentang petualangan di luar angkasa',
    requiresInput: true,
  },

  // === CATEGORY D: CREATIVE, SEARCH & REAL-TIME INDONESIA INFO ===
  {
    id: 'gempa',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Info Gempa Terkini BMKG',
    shortName: 'Gempa BMKG',
    slashCommand: '/gempa',
    badge: 'Live + Shakemap',
    description:
      'Data gempa bumi terbaru di Indonesia dari BMKG lengkap dengan magnitudo, wilayah, dan peta guncangan.',
    placeholder: 'Klik Jalankan untuk memuat data gempa terbaru BMKG...',
    exampleInput: '',
    requiresInput: false,
  },
  {
    id: 'berita',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Berita Nasional Terkini (Antara)',
    shortName: 'Berita Antara',
    slashCommand: '/berita',
    badge: 'Headline Real-Time',
    description:
      'Pantau berita utama nasional terbaru dari kantor berita Antara Indonesia secara langsung.',
    placeholder: 'Opsional: ketik kata kunci topik berita (atau kosongkan)...',
    exampleInput: '',
    requiresInput: false,
  },
  {
    id: 'pinterest',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Pinterest HD Visual Search',
    shortName: 'Pinterest HD',
    slashCommand: '/pinterest',
    badge: 'Galeri Visual HD',
    description:
      'Cari referensi desain, wallpaper, ilustrasi, dan fotografi resolusi tinggi langsung dalam galeri chat.',
    placeholder: 'Ketik kata kunci pencarian visual Pinterest...',
    exampleInput: 'cyberpunk anime aesthetic wallpaper',
    requiresInput: true,
  },
  {
    id: 'lirik',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Pencari Lirik Lagu Lengkap',
    shortName: 'Cari Lirik',
    slashCommand: '/lirik',
    badge: 'Lirik + Sampul Lagu',
    description:
      'Temukan lirik lagu Indonesia maupun internasional secara utuh beserta informasi penyanyi & sampul.',
    placeholder: 'Ketik judul lagu dan nama penyanyi...',
    exampleInput: 'Hati Hati di Jalan Tulus',
    requiresInput: true,
  },
  {
    id: 'wikipedia',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Pencarian Ensiklopedia Wikipedia',
    shortName: 'Wikipedia',
    slashCommand: '/wiki',
    badge: 'Referensi Cepat',
    description:
      'Cari ringkasan ensiklopedia faktual dan tautan referensi artikel langsung dari Wikipedia.',
    placeholder: 'Ketik tokoh, sejarah, sains, atau topik Wikipedia...',
    exampleInput: 'Kecerdasan buatan',
    requiresInput: true,
  },
  {
    id: 'emojimix',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Emoji Kitchen Mixer HD',
    shortName: 'EmojiMix',
    slashCommand: '/emojimix',
    badge: 'Stiker PNG Transparan',
    description:
      'Gabungkan dua emoji favorit menjadi satu stiker kombinasi unik kualitas tinggi ala Google Emoji Kitchen.',
    placeholder: 'Masukkan 2 emoji dipisahkan tanda + (contoh: 😎+🔥)',
    exampleInput: '😎+🔥',
    requiresInput: true,
  },
  {
    id: 'bratvid',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Brat Animated Maker (GIF/PNG)',
    shortName: 'Brat Animasi',
    slashCommand: '/bratvid',
    badge: 'Animasi Teks Brat',
    description:
      'Buat stiker teks animasi bergaya Brat yang siap diunduh dan dibagikan.',
    placeholder: 'Ketik teks untuk dijadikan animasi Brat...',
    exampleInput: 'nodatagpt selalu siap',
    requiresInput: true,
  },
  {
    id: 'stylefont',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Fancy Unicode Font Styler',
    shortName: 'StyleFont',
    slashCommand: '/stylefont',
    badge: '30+ Gaya Huruf',
    description:
      'Konversi nama atau kalimat biasa menjadi lebih dari 30 variasi huruf Unicode estetik siap salin.',
    placeholder: 'Ketik nama atau teks yang ingin dihias...',
    exampleInput: 'NodataGPT',
    requiresInput: true,
  },
  {
    id: 'removebg-tool',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Hapus Latar Gambar (RemoveBG HD)',
    shortName: 'RemoveBG HD',
    slashCommand: '/removebg',
    badge: 'PNG Transparan + Upload',
    description:
      'Hapus background foto menjadi PNG transparan HD (bisa tempel URL gambar atau unggah foto langsung dari HP/PC).',
    placeholder: 'Tempel tautan gambar atau klik tombol Upload Foto...',
    exampleInput: 'https://www.nodatagpt.web.id/logo.png',
    requiresInput: true,
    acceptsImageUpload: true,
  },
  {
    id: 'hd-tool',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Jernihkan Foto & Upscale (Remini HD)',
    shortName: 'Remini HD',
    slashCommand: '/hd',
    badge: 'AI Upscale + Upload',
    description:
      'Pertajam detail wajah dan resolusi foto buram menggunakan multi-server Remini & AI Upscale.',
    placeholder: 'Tempel tautan foto atau klik tombol Upload Foto...',
    exampleInput: 'https://www.nodatagpt.web.id/logo.png',
    requiresInput: true,
    acceptsImageUpload: true,
  },

  // === CATEGORY E: OFFICIAL WEATHER, PRAYER, CURRENCY, GOLD, CRYPTO & IDX STOCKS ===
  {
    id: 'cuaca',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Prakiraan Cuaca Real-Time',
    shortName: 'Cek Cuaca',
    slashCommand: '/cuaca',
    badge: 'Suhu + Prakiraan 3 Hari',
    description:
      'Pantau kondisi cuaca terkini berbahasa Indonesia (suhu, kelembapan, angin, UV, & prakiraan 3 hari) untuk kota mana pun.',
    placeholder: 'Ketik nama kota (contoh: Jakarta, Bandung, Surabaya, Tokyo)...',
    exampleInput: 'Jakarta',
    requiresInput: false,
  },
  {
    id: 'sholat',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Jadwal Sholat Resmi Kemenag RI',
    shortName: 'Jadwal Sholat',
    slashCommand: '/sholat',
    badge: 'Imsak s/d Isya Hari Ini',
    description:
      'Jadwal waktu sholat harian resmi Kementerian Agama RI (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya) seluruh Indonesia.',
    placeholder: 'Ketik kota/kabupaten di Indonesia (contoh: Jakarta, Bandung, Medan)...',
    exampleInput: 'Bandung',
    requiresInput: false,
  },
  {
    id: 'kurs',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Kurs Valuta Asing & Konverter Rupiah',
    shortName: 'Kurs Mata Uang',
    slashCommand: '/kurs',
    badge: 'USD · EUR · SGD · JPY · SAR',
    description:
      'Cek nilai tukar mata uang dunia ke Rupiah secara real-time atau hitung konversi nominal (mis. 150 USD, 500 SGD, 1000 MYR).',
    placeholder: 'Opsional: ketik nominal & kode mata uang (mis. 100 USD atau EUR)...',
    exampleInput: '100 USD',
    requiresInput: false,
  },
  {
    id: 'emas',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Harga Spot Emas Dunia (XAU & IDR/gr)',
    shortName: 'Harga Emas',
    slashCommand: '/emas',
    badge: 'Spot XAU/USD + Rupiah/Gram',
    description:
      'Pantau harga emas murni pasar dunia (XAU/USD per troy oz) lengkap dengan konversi otomatis Rupiah per gram.',
    placeholder: 'Opsional: ketik berat gram untuk simulasi nilai (contoh: 5 atau 10)...',
    exampleInput: '5',
    requiresInput: false,
  },
  {
    id: 'crypto',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Harga Pasar Crypto Live (CoinGecko)',
    shortName: 'Pasar Crypto',
    slashCommand: '/crypto',
    badge: 'BTC · ETH · SOL + IDR',
    description:
      'Pantau harga koin kripto teratas atau cari koin spesifik lengkap dengan harga USD & Rupiah, perubahan 24 jam, dan kapitalisasi pasar.',
    placeholder: 'Kosongkan untuk Top Crypto, atau ketik simbol/nama koin (mis. BTC, SOL, PEPE)...',
    exampleInput: '',
    requiresInput: false,
  },
  {
    id: 'saham',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Indeks IHSG & Saham BEI / Global',
    shortName: 'IHSG & Saham',
    slashCommand: '/saham',
    badge: 'IHSG · BBCA · BBRI · NVDA',
    description:
      'Pantau pergerakan Indeks IHSG (^JKSE), saham Bursa Efek Indonesia (BBCA, BBRI, TLKM, BMRI), maupun saham global (NVDA, AAPL).',
    placeholder: 'Kosongkan untuk IHSG, atau ketik kode saham (mis. BBCA, TLKM, NVDA)...',
    exampleInput: 'BBCA',
    requiresInput: false,
  },
  {
    id: 'quote',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Kutipan Motivasi & Tokoh Dunia',
    shortName: 'Kutipan Inspirasi',
    slashCommand: '/quote',
    badge: 'ZenQuotes Random',
    description:
      'Dapatkan kutipan inspiratif dan pemikiran bijak tokoh dunia secara instan.',
    placeholder: 'Klik Jalankan untuk memuat kutipan baru...',
    exampleInput: '',
    requiresInput: false,
  },
];

export async function uploadImageToTempPublicUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Pilih berkas gambar yang valid (PNG, JPG, atau WEBP).');
  }

  const readAsDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Gagal membaca berkas gambar.'));
      reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      reader.readAsDataURL(blob);
    });

  let dataUrl = await readAsDataUrl(file);
  let mimeType = file.type || 'image/jpeg';

  // Compress large camera photos (> 2.2 MB) cleanly in browser canvas before upload
  if (file.size > 2.2 * 1024 * 1024 && typeof document !== 'undefined') {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Gagal memuat gambar.'));
        el.src = dataUrl;
      });
      const maxSide = 1920;
      const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        mimeType = 'image/jpeg';
      }
    } catch {
      // Fall back to original dataUrl if under 4 MB
    }
  }

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      action: 'uploadImage',
      base64: dataUrl,
      mimeType,
      fileName: file.name,
    }),
  });

  const json = (await res.json()) as {
    ok?: boolean;
    url?: string;
    error?: string;
  };

  if (!res.ok || !json.ok || !json.url) {
    throw new Error(json.error || 'Gagal mengunggah foto ke server sementara.');
  }

  return json.url;
}

interface ToolHttpResult {
  ok: boolean;
  kind?: 'text' | 'image' | 'audio';
  body?: string;
  imageUrl?: string;
  audioUrl?: string;
  error?: string;
}

async function fetchToolEndpoint(
  targetUrl: string,
  timeoutMs = 28000,
  signal?: AbortSignal
): Promise<ToolHttpResult> {
  // 1. Try browser-direct call first for speed & per-user IP quota isolation
  if (typeof window !== 'undefined') {
    const directAbort = new AbortController();
    const timer = window.setTimeout(() => directAbort.abort(), Math.min(timeoutMs, 20000));
    const onParentAbort = () => directAbort.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json, image/*, audio/*, */*' },
        signal: directAbort.signal,
      });

      if (res.ok) {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.startsWith('image/')) {
          const blob = await res.blob();
          if (blob.size > 256) {
            return {
              ok: true,
              kind: 'image',
              imageUrl: URL.createObjectURL(blob),
            };
          }
        } else if (ct.startsWith('audio/')) {
          const blob = await res.blob();
          if (blob.size > 256) {
            return {
              ok: true,
              kind: 'audio',
              audioUrl: URL.createObjectURL(blob),
            };
          }
        } else {
          const text = await res.text();
          if (text.trim().length > 2) {
            return { ok: true, kind: 'text', body: text };
          }
        }
      }
    } catch {
      if (signal?.aborted) {
        throw new DOMException('Permintaan dibatalkan oleh pengguna.', 'AbortError');
      }
      // Fall through to /api/proxy
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  // 2. Serverless proxy fallback
  const proxyRes = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      targetUrl,
      method: 'GET',
      timeoutMs,
    }),
    signal,
  });

  const json = (await proxyRes.json()) as {
    ok?: boolean;
    kind?: 'text' | 'image' | 'audio';
    body?: string;
    imageUrl?: string;
    audioUrl?: string;
    error?: string;
  };

  return {
    ok: Boolean(proxyRes.ok && json.ok),
    kind: json.kind,
    body: json.body,
    imageUrl: json.imageUrl,
    audioUrl: json.audioUrl,
    error: json.error,
  };
}

function safeParseJson(raw?: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.trim());
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export interface ParsedWebToolCommand {
  toolId: string;
  arg: string;
  subOption?: string;
}

export function detectWebToolCommand(rawInput: string): ParsedWebToolCommand | null {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) return null;

  const match = trimmed.match(/^\/([a-z0-9_-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;

  const cmd = match[1].toLowerCase();
  const rest = (match[2] || '').trim();

  switch (cmd) {
    case 'tiktok':
    case 'tt':
      return { toolId: 'tiktok', arg: rest };
    case 'yt':
    case 'youtube':
    case 'ytmp4':
      return { toolId: 'youtube', arg: rest, subOption: '720' };
    case 'ytmp3':
      return { toolId: 'youtube', arg: rest, subOption: 'mp3' };
    case 'spotify':
    case 'spotdl':
      return { toolId: 'spotify', arg: rest };
    case 'aio':
    case 'dl':
      return { toolId: 'aio', arg: rest };
    case 'transkrip':
    case 'yttranscript':
    case 'transcript':
      return { toolId: 'yttranscript', arg: rest };
    case 'text2video':
    case 't2v': {
      const ratioMatch = rest.match(/^(16:9|9:16)\s*\|\s*([\s\S]+)$/);
      if (ratioMatch) {
        return {
          toolId: 'text2video',
          arg: ratioMatch[2].trim(),
          subOption: ratioMatch[1],
        };
      }
      const inlineRatio = /\b9:16\b/.test(rest) ? '9:16' : '16:9';
      return { toolId: 'text2video', arg: rest, subOption: inlineRatio };
    }
    case 'tts':
    case 'suara':
    case 'text2voice': {
      const voicePipe = rest.match(/^([a-z0-9_-]{3,16})\s*\|\s*([\s\S]+)$/i);
      if (voicePipe) {
        return {
          toolId: 'tts',
          arg: voicePipe[2].trim(),
          subOption: voicePipe[1].toLowerCase(),
        };
      }
      return { toolId: 'tts', arg: rest, subOption: 'nahida' };
    }
    case 'aisong':
    case 'musik':
    case 'laguai':
      return { toolId: 'aisong', arg: rest };
    case 'emojimix':
      return { toolId: 'emojimix', arg: rest };
    case 'bratvid':
      return { toolId: 'bratvid', arg: rest };
    case 'stylefont':
    case 'fancytext':
    case 'font':
      return { toolId: 'stylefont', arg: rest };
    case 'wiki':
    case 'wikipedia':
      return { toolId: 'wikipedia', arg: rest };
    case 'lirik':
    case 'lyrics':
      return { toolId: 'lirik', arg: rest };
    case 'pinterest':
    case 'pin':
      return { toolId: 'pinterest', arg: rest };
    case 'gempa':
    case 'bmkg':
      return { toolId: 'gempa', arg: rest };
    case 'berita':
    case 'antara':
      return { toolId: 'berita', arg: rest };
    case 'cuaca':
    case 'weather':
    case 'cekcuaca':
      return { toolId: 'cuaca', arg: rest };
    case 'sholat':
    case 'jadwalsholat':
    case 'imsak':
      return { toolId: 'sholat', arg: rest };
    case 'kurs':
    case 'valas':
    case 'currency':
      return { toolId: 'kurs', arg: rest };
    case 'emas':
    case 'gold':
    case 'xau':
      return { toolId: 'emas', arg: rest };
    case 'crypto':
    case 'koin':
    case 'btc':
      return { toolId: 'crypto', arg: cmd === 'btc' && !rest ? 'bitcoin' : rest };
    case 'saham':
    case 'stock':
    case 'idx':
      return { toolId: 'saham', arg: rest };
    case 'ihsg':
      return { toolId: 'saham', arg: rest || '^JKSE' };
    case 'quote':
    case 'quotes':
    case 'kutipan':
    case 'motivasi':
      return { toolId: 'quote', arg: rest };
    default:
      return null;
  }
}

export function buildSlashCommandFromTool(
  tool: WebToolDefinition,
  inputValue: string,
  subOption?: string
): string {
  const clean = inputValue.trim();
  if (tool.id === 'youtube') {
    const cmd = subOption === 'mp3' ? '/ytmp3' : '/yt';
    return `${cmd} ${clean}`.trim();
  }
  if (tool.id === 'text2video' && subOption) {
    return `/text2video ${subOption} | ${clean}`.trim();
  }
  if (tool.id === 'tts' && subOption) {
    return `/tts ${subOption} | ${clean}`.trim();
  }
  if (!clean) return tool.slashCommand;
  return `${tool.slashCommand} ${clean}`;
}

function cleanGeniusLyricsHeader(rawLyrics: string): string {
  return rawLyrics
    .replace(/^\d+\s*Contributors[\s\S]*?Lyrics(?=\[|\n|[A-Za-z])/i, '')
    .trim();
}

function splitEmojiPair(raw: string): { combined: string; e1: string; e2: string } | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  if (cleaned.includes('+')) {
    const parts = cleaned
      .split('+')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return { combined: `${parts[0]}+${parts[1]}`, e1: parts[0], e2: parts[1] };
    }
  }

  const spaceParts = cleaned.split(/\s+/).filter(Boolean);
  if (spaceParts.length >= 2) {
    return {
      combined: `${spaceParts[0]}+${spaceParts[1]}`,
      e1: spaceParts[0],
      e2: spaceParts[1],
    };
  }

  const graphemes =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? Array.from(
          new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(cleaned),
          (s) => s.segment
        ).filter((g) => g.trim().length > 0)
      : Array.from(cleaned);

  if (graphemes.length >= 2) {
    return {
      combined: `${graphemes[0]}+${graphemes[1]}`,
      e1: graphemes[0],
      e2: graphemes[1],
    };
  }
  return null;
}

export async function executeWebToolCommand({
  command,
  signal,
  onStatus,
}: {
  command: ParsedWebToolCommand;
  signal?: AbortSignal;
  onStatus?: WebToolStatusCallback;
}): Promise<WebToolExecutionResult> {
  const { toolId, arg, subOption } = command;

  // === 1. TIKTOK DOWNLOADER ===
  if (toolId === 'tiktok') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Masukkan tautan video TikTok yang valid. Contoh: `/tiktok https://www.tiktok.com/@tiktok/video/7106594312292453675`'
      );
    }

    onStatus?.({
      toolName: 'TikTok HD Downloader',
      mirrorName: 'Snow TikTok Engine',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/downloader/tiktok?url=${encodeURIComponent(arg)}`,
      28000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    if (r1.ok && res1 && (typeof res1.play === 'string' || Array.isArray(res1.images))) {
      const title = String(res1.title || 'Video TikTok');
      const author = String(res1.author || 'TikTok Creator');
      const playUrl = typeof res1.play === 'string' ? res1.play : '';
      const musicUrl = typeof res1.music === 'string' ? res1.music : '';
      const coverUrl =
        (typeof res1.cover === 'string' && res1.cover.startsWith('http') && res1.cover) ||
        (typeof res1.origin_cover === 'string' &&
          res1.origin_cover.startsWith('http') &&
          res1.origin_cover) ||
        undefined;
      const images = Array.isArray(res1.images)
        ? res1.images.filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
        : [];
      const info = (res1.info as Record<string, unknown> | undefined) || {};
      const statsLine = [
        info.views ? `👁️ ${info.views}` : '',
        info.likes ? `❤️ ${info.likes}` : '',
        info.comment ? `💬 ${info.comment}` : '',
      ]
        .filter(Boolean)
        .join(' · ');

      const downloads: MediaDownloadItem[] = [];
      if (playUrl) {
        downloads.push({ label: 'Unduh Video HD (No WM)', url: playUrl, kind: 'video' });
      }
      if (musicUrl) {
        downloads.push({ label: 'Unduh Audio Musik', url: musicUrl, kind: 'audio' });
      }

      return {
        content: [
          `### 🎬 TikTok berhasil dimuat`,
          `**Kreator:** ${author}`,
          `**Deskripsi:** ${title}`,
          statsLine ? `**Statistik:** ${statsLine}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        answeredById: 'snow-tiktok',
        answeredByName: 'TikTok HD · Snow API',
        usedFallback: false,
        videoUrl: images.length === 0 ? playUrl || undefined : undefined,
        videoPosterUrl: images.length === 0 ? coverUrl : undefined,
        audioUrl: images.length > 0 && musicUrl ? musicUrl : undefined,
        galleryUrls: images.length > 0 ? images.slice(0, 12) : undefined,
        downloadItems: downloads,
      };
    }

    // Fallback 2: Synox Cloud
    onStatus?.({
      toolName: 'TikTok HD Downloader',
      mirrorName: 'Synox Cloud TikTok',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/download/tiktok?url=${encodeURIComponent(arg)}&apikey=FREE`,
      26000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = j2?.result as Record<string, unknown> | undefined;
    if (r2.ok && res2 && Array.isArray(res2.downloads) && res2.downloads.length > 0) {
      const downloads: MediaDownloadItem[] = [];
      let videoUrl: string | undefined;
      for (const d of res2.downloads as Array<Record<string, unknown>>) {
        const u = typeof d.url === 'string' ? d.url : '';
        const t = String(d.type || 'Unduh Media');
        if (!u.startsWith('http')) continue;
        const isAudio = /mp3|audio|music/i.test(t);
        if (!videoUrl && !isAudio) videoUrl = u;
        downloads.push({
          label: t,
          url: u,
          kind: isAudio ? 'audio' : 'video',
        });
      }
      if (downloads.length > 0) {
        return {
          content: `### 🎬 TikTok berhasil dimuat *(Auto-Fallback Synox)*\n\n**Judul:** ${String(res2.title || 'Video TikTok')}`,
          answeredById: 'synox-tiktok',
          answeredByName: 'TikTok DL · Synox Cloud',
          usedFallback: true,
          videoUrl,
          downloadItems: downloads,
        };
      }
    }

    // Fallback 3: Varhad v2
    onStatus?.({
      toolName: 'TikTok HD Downloader',
      mirrorName: 'Varhad TikTok v2',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      `https://v2.api-varhad.my.id/download/tt?url=${encodeURIComponent(arg)}`,
      26000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    const res3 = j3?.result as Record<string, unknown> | undefined;
    if (r3.ok && res3 && (typeof res3.mp4_hd === 'string' || typeof res3.mp4 === 'string')) {
      const hd = typeof res3.mp4_hd === 'string' ? res3.mp4_hd : '';
      const sd = typeof res3.mp4 === 'string' ? res3.mp4 : '';
      const mp3 = typeof res3.mp3 === 'string' ? res3.mp3 : '';
      const thumb3 =
        typeof res3.thumbnail === 'string' && res3.thumbnail.startsWith('http')
          ? res3.thumbnail
          : undefined;
      const downloads: MediaDownloadItem[] = [];
      if (sd) downloads.push({ label: 'Unduh MP4 (Hemat Kuota)', url: sd, kind: 'video' });
      if (hd && hd !== sd) downloads.push({ label: 'Unduh MP4 HD', url: hd, kind: 'video' });
      if (mp3) downloads.push({ label: 'Unduh MP3', url: mp3, kind: 'audio' });
      return {
        content: `### 🎬 TikTok berhasil dimuat *(Auto-Fallback Varhad)*\n\n**Judul:** ${String(res3.title || 'Video TikTok')}`,
        answeredById: 'varhad-tiktok',
        answeredByName: 'TikTok DL · Varhad v2',
        usedFallback: true,
        videoUrl: sd || hd || undefined,
        videoPosterUrl: thumb3,
        downloadItems: downloads,
      };
    }

    // Fallback 4: TikWM Official HD (0.7s No-Watermark + Audio + Carousel)
    onStatus?.({
      toolName: 'TikTok HD Downloader',
      mirrorName: 'TikWM Official HD',
      attempt: 4,
      isFallback: true,
    });
    const r4 = await fetchToolEndpoint(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(arg)}&hd=1`,
      24000,
      signal
    );
    const j4 = safeParseJson(r4.body);
    const res4 = j4?.data as Record<string, unknown> | undefined;
    if (
      r4.ok &&
      Number(j4?.code) === 0 &&
      res4 &&
      (typeof res4.play === 'string' ||
        typeof res4.hdplay === 'string' ||
        Array.isArray(res4.images))
    ) {
      const hdPlay =
        typeof res4.hdplay === 'string' && res4.hdplay.startsWith('http')
          ? res4.hdplay
          : '';
      const stdPlay =
        typeof res4.play === 'string' && res4.play.startsWith('http')
          ? res4.play
          : '';
      const cover4 =
        (typeof res4.cover === 'string' && res4.cover.startsWith('http') && res4.cover) ||
        (typeof res4.origin_cover === 'string' &&
          res4.origin_cover.startsWith('http') &&
          res4.origin_cover) ||
        undefined;
      const musicUrl =
        typeof res4.music === 'string' && res4.music.startsWith('http')
          ? res4.music
          : '';
      const images = Array.isArray(res4.images)
        ? res4.images.filter(
            (u): u is string => typeof u === 'string' && u.startsWith('http')
          )
        : [];
      const authorObj = (res4.author as Record<string, unknown> | undefined) || {};
      const authorName = String(
        authorObj.nickname || authorObj.unique_id || 'TikTok Creator'
      );
      const downloads: MediaDownloadItem[] = [];
      if (stdPlay) {
        downloads.push({ label: 'Unduh MP4 (No WM · Hemat)', url: stdPlay, kind: 'video' });
      }
      if (hdPlay && hdPlay !== stdPlay) {
        downloads.push({ label: 'Unduh MP4 HD Original (No WM)', url: hdPlay, kind: 'video' });
      }
      if (musicUrl) {
        downloads.push({ label: 'Unduh Audio MP3', url: musicUrl, kind: 'audio' });
      }

      return {
        content: [
          `### 🎬 TikTok berhasil dimuat *(Auto-Fallback TikWM HD)*`,
          `**Kreator:** ${authorName}`,
          `**Deskripsi:** ${String(res4.title || 'Video TikTok')}`,
        ].join('\n\n'),
        answeredById: 'tikwm-official',
        answeredByName: 'TikTok HD · TikWM',
        usedFallback: true,
        videoUrl: images.length === 0 ? stdPlay || hdPlay || undefined : undefined,
        videoPosterUrl: images.length === 0 ? cover4 : undefined,
        audioUrl: images.length > 0 && musicUrl ? musicUrl : undefined,
        galleryUrls: images.length > 0 ? images.slice(0, 12) : undefined,
        downloadItems: downloads,
      };
    }

    // Fallback 5: BintangAPI TikTok
    onStatus?.({
      toolName: 'TikTok HD Downloader',
      mirrorName: 'Bintang TikTok Engine',
      attempt: 5,
      isFallback: true,
    });
    const r5 = await fetchToolEndpoint(
      `https://bintangapi.my.id/api/downloader/tiktok?url=${encodeURIComponent(arg)}`,
      26000,
      signal
    );
    const j5 = safeParseJson(r5.body);
    const res5 = (j5?.data || j5?.result) as Record<string, unknown> | undefined;
    if (r5.ok && res5) {
      const videoObj = (res5.video as Record<string, unknown> | undefined) || {};
      const musicObj = (res5.music as Record<string, unknown> | undefined) || {};
      const playUrl = String(
        videoObj.no_watermark_hd ||
          videoObj.no_watermark ||
          res5.play ||
          res5.url ||
          ''
      );
      const musicUrl = String(musicObj.url || res5.music || '');
      if (playUrl.startsWith('http')) {
        const downloads: MediaDownloadItem[] = [
          { label: 'Unduh Video HD (No WM)', url: playUrl, kind: 'video' },
        ];
        if (musicUrl.startsWith('http')) {
          downloads.push({ label: 'Unduh Audio MP3', url: musicUrl, kind: 'audio' });
        }
        return {
          content: `### 🎬 TikTok berhasil dimuat *(Auto-Fallback BintangAPI)*\n\n**Deskripsi:** ${String(res5.title || res5.caption || 'Video TikTok')}`,
          answeredById: 'bintang-tiktok',
          answeredByName: 'TikTok HD · BintangAPI',
          usedFallback: true,
          videoUrl: playUrl,
          downloadItems: downloads,
        };
      }
    }

    throw new Error('Gagal mengunduh tautan TikTok tersebut. Pastikan video bersifat publik.');
  }

  // === 2. YOUTUBE MP4 / MP3 DOWNLOADER ===
  if (toolId === 'youtube') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Masukkan tautan video YouTube yang valid. Contoh: `/yt https://www.youtube.com/watch?v=dQw4w9WgXcQ` atau `/ytmp3 <url>`'
      );
    }
    const format = subOption === 'mp3' ? 'mp3' : '720';
    const isAudio = format === 'mp3';

    onStatus?.({
      toolName: isAudio ? 'YouTube MP3' : 'YouTube MP4',
      mirrorName: 'Snow YouTube Engine',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/downloader/youtube?url=${encodeURIComponent(arg)}&format=${format}`,
      34000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const vidInfo = res1?.video as Record<string, unknown> | undefined;
    const dlInfo = res1?.download as Record<string, unknown> | undefined;
    const dlUrl = typeof dlInfo?.url === 'string' ? dlInfo.url : '';

    if (r1.ok && dlUrl.startsWith('http')) {
      const title = String(vidInfo?.title || 'Media YouTube');
      const duration = vidInfo?.duration ? ` · **Durasi:** ${String(vidInfo.duration)}` : '';
      const size = dlInfo?.size ? ` · **Ukuran:** ${String(dlInfo.size)}` : '';
      const thumb = typeof vidInfo?.thumbnail === 'string' ? vidInfo.thumbnail : undefined;

      return {
        content: `### ▶️ YouTube ${isAudio ? 'Audio MP3' : 'Video MP4'} Siap\n\n**Judul:** ${title}${duration}${size}`,
        answeredById: 'snow-youtube',
        answeredByName: 'YouTube DL · Snow API',
        usedFallback: false,
        imageUrl: isAudio ? thumb : undefined,
        videoUrl: !isAudio ? dlUrl : undefined,
        videoPosterUrl: !isAudio ? thumb : undefined,
        audioUrl: isAudio ? dlUrl : undefined,
        audioTitle: title,
        downloadItems: [
          {
            label: isAudio ? 'Unduh Audio MP3' : 'Unduh Video MP4 (720p)',
            url: dlUrl,
            kind: isAudio ? 'audio' : 'video',
          },
        ],
      };
    }

    // Fallback 2: Synox Cloud YouTube
    onStatus?.({
      toolName: isAudio ? 'YouTube MP3' : 'YouTube MP4',
      mirrorName: 'Synox Cloud YouTube',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/download/youtube?url=${encodeURIComponent(arg)}&apikey=FREE`,
      32000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = (j2?.result || j2?.data) as Record<string, unknown> | undefined;
    if (r2.ok && res2) {
      const candidateUrl =
        (isAudio
          ? (res2.mp3 as string) || (res2.audio as string)
          : (res2.mp4 as string) || (res2.video as string)) ||
        (res2.download_url as string) ||
        (res2.url as string) ||
        '';
      if (typeof candidateUrl === 'string' && candidateUrl.startsWith('http')) {
        const title = String(res2.title || 'Media YouTube');
        return {
          content: `### ▶️ YouTube Siap *(Auto-Fallback Synox)*\n\n**Judul:** ${title}`,
          answeredById: 'synox-youtube',
          answeredByName: 'YouTube DL · Synox Cloud',
          usedFallback: true,
          videoUrl: !isAudio ? candidateUrl : undefined,
          audioUrl: isAudio ? candidateUrl : undefined,
          audioTitle: title,
          downloadItems: [
            {
              label: isAudio ? 'Unduh Audio MP3' : 'Unduh Video MP4',
              url: candidateUrl,
              kind: isAudio ? 'audio' : 'video',
            },
          ],
        };
      }
    }

    // Fallback 3: AIO Nexray
    onStatus?.({
      toolName: 'YouTube Downloader',
      mirrorName: 'Nexray AIO Engine',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      `https://api.nexray.eu.cc/downloader/aio?url=${encodeURIComponent(arg)}`,
      30000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    const res3 = j3?.result as Record<string, unknown> | undefined;
    if (r3.ok && res3 && Array.isArray(res3.medias) && res3.medias.length > 0) {
      const medias = res3.medias as Array<Record<string, unknown>>;
      const picked =
        medias.find((m) =>
          isAudio ? /audio|mp3|m4a/i.test(String(m.type || m.extension)) : /video|mp4/i.test(String(m.type || m.extension))
        ) || medias[0];
      const u = typeof picked?.url === 'string' ? picked.url : '';
      if (u.startsWith('http')) {
        return {
          content: `### ▶️ YouTube Siap *(Auto-Fallback Nexray)*\n\n**Judul:** ${String(res3.title || 'Media YouTube')}`,
          answeredById: 'nexray-yt',
          answeredByName: 'YouTube DL · Nexray',
          usedFallback: true,
          videoUrl: !isAudio ? u : undefined,
          audioUrl: isAudio ? u : undefined,
          downloadItems: [
            {
              label: isAudio ? 'Unduh Audio' : 'Unduh Video',
              url: u,
              kind: isAudio ? 'audio' : 'video',
            },
          ],
        };
      }
    }

    // Fallback 4 (Audio MP3): Varhad YTMP3 v2 (200 OK verified)
    if (isAudio) {
      onStatus?.({
        toolName: 'YouTube MP3',
        mirrorName: 'Varhad YTMP3 v2',
        attempt: 4,
        isFallback: true,
      });
      const r4 = await fetchToolEndpoint(
        `https://v2.api-varhad.my.id/download/ytmp3?url=${encodeURIComponent(arg)}`,
        30000,
        signal
      );
      const j4 = safeParseJson(r4.body);
      const res4 = j4?.result as Record<string, unknown> | undefined;
      const dl4 = typeof res4?.download === 'string' ? res4.download : '';
      if (r4.ok && dl4.startsWith('http')) {
        const title4 = String(res4?.title || 'Audio YouTube MP3');
        return {
          content: `### ▶️ YouTube Audio MP3 Siap *(Auto-Fallback Varhad v2)*\n\n**Judul:** ${title4}`,
          answeredById: 'varhad-ytmp3',
          answeredByName: 'YouTube MP3 · Varhad v2',
          usedFallback: true,
          audioUrl: dl4,
          audioTitle: title4,
          downloadItems: [
            {
              label: 'Unduh Audio MP3',
              url: dl4,
              kind: 'audio',
            },
          ],
        };
      }
    }

    throw new Error('Gagal mengunduh video YouTube tersebut. Coba gunakan tautan publik lain.');
  }

  // === 3. SPOTIFY DOWNLOADER + AUTO-SEARCH ===
  if (toolId === 'spotify') {
    if (!arg) {
      throw new Error(
        'Masukkan tautan lagu Spotify atau ketik judul lagu. Contoh: `/spotify Tulus Monokrom`'
      );
    }

    let trackUrl = arg;
    if (!/^https?:\/\/open\.spotify\.com\/track\//i.test(arg)) {
      onStatus?.({
        toolName: 'Spotify Downloader',
        mirrorName: 'Snow Spotify Search',
        attempt: 1,
        isFallback: false,
      });
      const searchRes = await fetchToolEndpoint(
        `https://api.snowping.cfd/api/search/spotify?query=${encodeURIComponent(arg)}`,
        22000,
        signal
      );
      const searchJson = safeParseJson(searchRes.body);
      const list = Array.isArray(searchJson?.result)
        ? (searchJson.result as Array<Record<string, unknown>>)
        : [];
      const firstTrack =
        list.find(
          (item) =>
            String(item.type || '').toLowerCase() === 'track' &&
            typeof item.url === 'string'
        ) || list.find((item) => typeof item.url === 'string');

      if (firstTrack && typeof firstTrack.url === 'string') {
        trackUrl = firstTrack.url;
      } else {
        throw new Error(
          `Lagu Spotify untuk kata kunci "${arg}" tidak ditemukan. Coba tempel tautan track Spotify langsung.`
        );
      }
    }

    onStatus?.({
      toolName: 'Spotify Track MP3',
      mirrorName: 'Snow Spotify DL',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/downloader/spotify?url=${encodeURIComponent(trackUrl)}`,
      30000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const dlUrl = typeof res1?.download_url === 'string' ? res1.download_url : '';
    if (r1.ok && dlUrl.startsWith('http')) {
      const title = String(res1?.title || 'Spotify Track');
      const artist = String(res1?.artist || 'Artis');
      const cover = typeof res1?.cover === 'string' ? res1.cover : undefined;

      return {
        content: `### 🎵 Spotify Track Siap Diputar\n\n**Judul:** ${title}\n**Artis:** ${artist}\n**Tautan Spotify:** [Buka di Spotify](${trackUrl})`,
        answeredById: 'snow-spotify',
        answeredByName: 'Spotify DL · Snow API',
        usedFallback: false,
        imageUrl: cover,
        audioUrl: dlUrl,
        audioTitle: `${title} — ${artist}`,
        downloadItems: [
          { label: `Unduh MP3 (${title})`, url: dlUrl, kind: 'audio' },
        ],
      };
    }

    // Fallback Synox Spotify
    onStatus?.({
      toolName: 'Spotify Track MP3',
      mirrorName: 'Synox Spotify DL',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/download/spotify?url=${encodeURIComponent(trackUrl)}&apikey=FREE`,
      28000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = (j2?.result || j2?.data) as Record<string, unknown> | undefined;
    const dl2 =
      (typeof res2?.download_url === 'string' && res2.download_url) ||
      (typeof res2?.download === 'string' && res2.download) ||
      (typeof res2?.url === 'string' && res2.url) ||
      '';
    if (r2.ok && dl2.startsWith('http')) {
      const title = String(res2?.title || 'Spotify Track');
      return {
        content: `### 🎵 Spotify Track Siap *(Auto-Fallback Synox)*\n\n**Judul:** ${title}`,
        answeredById: 'synox-spotify',
        answeredByName: 'Spotify DL · Synox Cloud',
        usedFallback: true,
        imageUrl: typeof res2?.thumbnail === 'string' ? res2.thumbnail : undefined,
        audioUrl: dl2,
        audioTitle: title,
        downloadItems: [{ label: 'Unduh MP3 Spotify', url: dl2, kind: 'audio' }],
      };
    }

    throw new Error('Gagal mengunduh audio lagu Spotify tersebut saat ini.');
  }

  // === 4. ALL-IN-ONE SOCIAL DOWNLOADER ===
  if (toolId === 'aio') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Masukkan tautan media sosial publik (IG Reels, FB, X/Twitter, TikTok, CapCut). Contoh: `/aio https://...`'
      );
    }

    // Mirror 1: Nexray AIO
    onStatus?.({
      toolName: 'All-in-One Downloader',
      mirrorName: 'Nexray AIO Hub',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.nexray.eu.cc/downloader/aio?url=${encodeURIComponent(arg)}`,
      28000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    if (r1.ok && res1 && Array.isArray(res1.medias) && res1.medias.length > 0) {
      const downloads: MediaDownloadItem[] = [];
      let videoUrl: string | undefined;
      let audioUrl: string | undefined;

      for (const m of res1.medias as Array<Record<string, unknown>>) {
        const u = typeof m.url === 'string' ? m.url : '';
        if (!u.startsWith('http')) continue;
        const typeStr = String(m.type || m.extension || '').toLowerCase();
        const qual = String(m.quality || m.extension || 'Media').toUpperCase();
        const isAudio = /audio|mp3|m4a/.test(typeStr);
        if (!videoUrl && !isAudio && /video|mp4/.test(typeStr)) videoUrl = u;
        if (!audioUrl && isAudio) audioUrl = u;
        downloads.push({
          label: `Unduh ${qual}`,
          url: u,
          kind: isAudio ? 'audio' : 'video',
        });
      }

      if (downloads.length > 0) {
        return {
          content: `### 📥 Media Berhasil Diambil\n\n**Judul:** ${String(res1.title || 'Media Sosial')}${res1.author ? `\n**Kreator:** ${String(res1.author)}` : ''}`,
          answeredById: 'nexray-aio',
          answeredByName: 'AIO Downloader · Nexray',
          usedFallback: false,
          videoUrl,
          videoPosterUrl:
            videoUrl && typeof res1.thumbnail === 'string' && res1.thumbnail.startsWith('http')
              ? res1.thumbnail
              : undefined,
          audioUrl: !videoUrl ? audioUrl : undefined,
          imageUrl:
            !videoUrl && typeof res1.thumbnail === 'string'
              ? res1.thumbnail
              : undefined,
          downloadItems: downloads.slice(0, 6),
        };
      }
    }

    // Mirror 2: Synox AIO
    onStatus?.({
      toolName: 'All-in-One Downloader',
      mirrorName: 'Synox Cloud AIO',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/download/aio?url=${encodeURIComponent(arg)}&apikey=FREE`,
      28000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = j2?.result as Record<string, unknown> | undefined;
    if (r2.ok && res2 && Array.isArray(res2.downloads) && res2.downloads.length > 0) {
      const downloads: MediaDownloadItem[] = [];
      let videoUrl: string | undefined;
      for (const d of res2.downloads as Array<Record<string, unknown>>) {
        const u = typeof d.url === 'string' ? d.url : '';
        if (!u.startsWith('http')) continue;
        const label = String(d.type || d.quality || 'Unduh Media');
        const isAudio = /audio|mp3/i.test(label);
        if (!videoUrl && !isAudio) videoUrl = u;
        downloads.push({
          label,
          url: u,
          kind: isAudio ? 'audio' : 'video',
        });
      }
      if (downloads.length > 0) {
        return {
          content: `### 📥 Media Berhasil Diambil *(Auto-Fallback Synox)*\n\n**Judul:** ${String(res2.title || 'Media Sosial')}`,
          answeredById: 'synox-aio',
          answeredByName: 'AIO Downloader · Synox Cloud',
          usedFallback: true,
          videoUrl,
          downloadItems: downloads.slice(0, 6),
        };
      }
    }

    // Mirror 3: Rin AIO2
    onStatus?.({
      toolName: 'All-in-One Downloader',
      mirrorName: 'Rin AIO v2',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      `https://apiii-xrina.my.id/download/aio2?url=${encodeURIComponent(arg)}`,
      28000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    const outer = j3?.data as Record<string, unknown> | undefined;
    const inner = (outer?.data || outer) as Record<string, unknown> | undefined;
    if (r3.ok && inner && Array.isArray(inner.formats)) {
      const downloads: MediaDownloadItem[] = [];
      let videoUrl: string | undefined;
      for (const f of inner.formats as Array<Record<string, unknown>>) {
        const u = typeof f.downloadUrl === 'string' ? f.downloadUrl : '';
        if (!u.startsWith('http')) continue;
        const kind = String(f.kind || '').toLowerCase();
        const isAudio = kind === 'audio';
        if (!videoUrl && kind === 'video') videoUrl = u;
        downloads.push({
          label: String(f.label || 'Unduh Media'),
          url: u,
          kind: isAudio ? 'audio' : 'video',
        });
      }
      if (downloads.length > 0) {
        return {
          content: `### 📥 Media ${String(inner.platform || '')} Berhasil Diambil *(Auto-Fallback Rin)*\n\n**Judul:** ${String(inner.title || 'Media Sosial')}`,
          answeredById: 'rin-aio2',
          answeredByName: 'AIO v2 · Rin API',
          usedFallback: true,
          videoUrl:
            videoUrl ||
            (typeof inner.previewUrl === 'string' && inner.previewUrl.startsWith('http')
              ? inner.previewUrl
              : undefined),
          downloadItems: downloads.slice(0, 6),
        };
      }
    }

    throw new Error('Tidak dapat mengekstrak media dari tautan tersebut. Pastikan tautan bersifat publik.');
  }

  // === 5. YOUTUBE TRANSCRIPT EXTRACTOR ===
  if (toolId === 'yttranscript') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Masukkan tautan video YouTube untuk diekstrak transkripnya. Contoh: `/transkrip https://www.youtube.com/watch?v=...`'
      );
    }

    for (const [idx, lang] of ['id', 'en'].entries()) {
      onStatus?.({
        toolName: 'Transkrip YouTube',
        mirrorName: `Snow Transcript (${lang.toUpperCase()})`,
        attempt: idx + 1,
        isFallback: idx > 0,
      });
      const r = await fetchToolEndpoint(
        `https://api.snowping.cfd/api/tools/yttranscript?url=${encodeURIComponent(arg)}&lang=${lang}`,
        24000,
        signal
      );
      const j = safeParseJson(r.body);
      const resObj = j?.result as Record<string, unknown> | undefined;
      const text = typeof resObj?.result === 'string' ? resObj.result.trim() : '';
      if (r.ok && text.length > 20) {
        const cleanTranscript = text.replace(/\s+/g, ' ').trim();
        return {
          content: `### 📝 Transkrip Video YouTube (${lang.toUpperCase()})\n\n> **Sumber:** ${arg}\n\n${cleanTranscript}`,
          answeredById: 'snow-yttranscript',
          answeredByName: 'YT Transcript · Snow API',
          usedFallback: idx > 0,
          summarizeTranscript: cleanTranscript.slice(0, 6500),
        };
      }
    }

    // Fallback Nexray YT Transcribe
    onStatus?.({
      toolName: 'Transkrip YouTube',
      mirrorName: 'Nexray YT Transcribe',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      `https://api.nexray.eu.cc/tools/yt-transcribe?url=${encodeURIComponent(arg)}`,
      36000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    const d3 = j3?.data as Record<string, unknown> | undefined;
    const t3 = typeof d3?.transcript === 'string' ? d3.transcript.trim() : '';
    if (r3.ok && t3.length > 20) {
      return {
        content: `### 📝 Transkrip Video YouTube *(Auto-Fallback Nexray)*\n\n> **Sumber:** ${arg}\n\n${t3}`,
        answeredById: 'nexray-yttranscribe',
        answeredByName: 'YT Transcribe · Nexray',
        usedFallback: true,
        summarizeTranscript: t3.slice(0, 6500),
      };
    }

    throw new Error('Transkrip / subtitle tidak tersedia pada video YouTube tersebut.');
  }

  // === 6. AI TEXT-TO-VIDEO ===
  if (toolId === 'text2video') {
    if (!arg) {
      throw new Error(
        'Masukkan deskripsi adegan video AI. Contoh: `/text2video futuristic neon city at night`'
      );
    }
    const ratio = subOption === '9:16' ? '9:16' : '16:9';

    onStatus?.({
      toolName: 'AI Text-to-Video',
      mirrorName: 'Snow Video AI Engine',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/aigenerate/text2video?prompt=${encodeURIComponent(arg)}&ratio=${encodeURIComponent(ratio)}&sound=true`,
      45000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const vidUrl = typeof res1?.url === 'string' ? res1.url : '';
    if (r1.ok && vidUrl.startsWith('http')) {
      return {
        content: `### 🎥 Video AI Berhasil Dibuat (${ratio})\n\n**Prompt:** *"${arg}"*`,
        answeredById: 'snow-text2video',
        answeredByName: 'Text2Video AI · Snow API',
        usedFallback: false,
        videoUrl: vidUrl,
        downloadItems: [
          { label: `Unduh Video AI MP4 (${ratio})`, url: vidUrl, kind: 'video' },
        ],
      };
    }

    throw new Error(
      'Server AI Text-to-Video sedang padat. Silakan coba lagi beberapa saat lagi.'
    );
  }

  // === 7. MULTI-CHARACTER AI VOICE (TTS) ===
  if (toolId === 'tts') {
    if (!arg) {
      throw new Error(
        'Masukkan teks yang ingin diubah menjadi suara. Contoh: `/tts Halo saya NodataGPT!`'
      );
    }
    const voice = (subOption || 'nahida').toLowerCase();

    if (voice !== 'google') {
      onStatus?.({
        toolName: 'AI Voice TTS',
        mirrorName: `Snow Voice (${voice})`,
        attempt: 1,
        isFallback: false,
      });
      const r1 = await fetchToolEndpoint(
        `https://api.snowping.cfd/api/tools/text2voice?text=${encodeURIComponent(arg.slice(0, 600))}&voice=${encodeURIComponent(voice)}`,
        28000,
        signal
      );
      const j1 = safeParseJson(r1.body);
      const res1 = j1?.result as Record<string, unknown> | undefined;
      const audioUrl =
        (typeof res1?.audio_url === 'string' && res1.audio_url) ||
        (typeof res1?.url === 'string' && res1.url) ||
        '';
      if (r1.ok && audioUrl.startsWith('http')) {
        return {
          content: `### 🎙️ Suara AI Karakter (${voice.toUpperCase()})\n\n> "${arg}"`,
          answeredById: 'snow-tts',
          answeredByName: `AI Voice (${voice}) · Snow API`,
          usedFallback: false,
          audioUrl,
          audioTitle: ` Karakter ${voice.toUpperCase()}`,
          downloadItems: [
            { label: 'Unduh Audio MP3', url: audioUrl, kind: 'audio' },
          ],
        };
      }
    }

    // Fallback or Google TTS mode: Synox Google TTS (returns binary audio/mpeg via proxy)
    onStatus?.({
      toolName: 'AI Voice TTS',
      mirrorName: 'Synox Google TTS',
      attempt: voice === 'google' ? 1 : 2,
      isFallback: voice !== 'google',
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/tools/google-tts?text=${encodeURIComponent(arg.slice(0, 450))}&apikey=FREE`,
      24000,
      signal
    );
    if (r2.ok && r2.audioUrl) {
      return {
        content: `### 🎙️ Suara Natural Bahasa Indonesia\n\n> "${arg}"`,
        answeredById: 'synox-google-tts',
        answeredByName: 'Google TTS · Synox Cloud',
        usedFallback: voice !== 'google',
        audioUrl: r2.audioUrl,
        audioTitle: 'Suara Natural Indonesia',
      };
    }

    throw new Error('Gagal menghasilkan suara AI saat ini. Coba ulangi beberapa detik lagi.');
  }

  // === 8. AI SONG & LYRICS COMPOSER ===
  if (toolId === 'aisong') {
    if (!arg) {
      throw new Error(
        'Masukkan tema atau genre lagu yang ingin dibuat. Contoh: `/aisong chill lofi malam hujan di Jakarta`'
      );
    }

    onStatus?.({
      toolName: 'AI Song Maker',
      mirrorName: 'Synox Music + Snow Songwriter',
      attempt: 1,
      isFallback: false,
    });

    // Try Synox AI Music Audio first (non-blocking if rate-limited)
    let musicAudioUrl: string | undefined;
    try {
      const mRes = await fetchToolEndpoint(
        `https://api.synoxcloud.xyz/ai-generate/music?prompt=${encodeURIComponent(arg)}&genre=pop&mood=chill&vocal=female&tempo=medium&apikey=FREE`,
        30000,
        signal
      );
      const mJson = safeParseJson(mRes.body);
      const mObj = (mJson?.result || mJson?.data) as Record<string, unknown> | undefined;
      const candidateAudio =
        (typeof mObj?.audio_url === 'string' && mObj.audio_url) ||
        (typeof mObj?.url === 'string' && mObj.url) ||
        (typeof mObj?.music === 'string' && mObj.music) ||
        '';
      if (mRes.ok && candidateAudio.startsWith('http')) {
        musicAudioUrl = candidateAudio;
      }
    } catch {
      // Continue to Snow AI Songwriter
    }

    const sRes = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/aigenerate/aisong?prompt=${encodeURIComponent(arg)}`,
      26000,
      signal
    );
    const sJson = safeParseJson(sRes.body);
    const lyrics = typeof sJson?.result === 'string' ? sJson.result.trim() : '';

    if (musicAudioUrl || lyrics) {
      return {
        content: [
          `### 🎼 Komposisi Lagu AI — *"${arg}"*`,
          lyrics ? `\n\`\`\`text\n${lyrics}\n\`\`\`` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        answeredById: musicAudioUrl ? 'synox-aisong' : 'snow-aisong',
        answeredByName: musicAudioUrl
          ? 'AI Music + Songwriter · Synox & Snow'
          : 'AI Songwriter · Snow API',
        usedFallback: false,
        audioUrl: musicAudioUrl,
        audioTitle: `AI Song — ${arg.slice(0, 36)}`,
        downloadItems: musicAudioUrl
          ? [{ label: 'Unduh Lagu AI (MP3)', url: musicAudioUrl, kind: 'audio' }]
          : undefined,
      };
    }

    throw new Error('Gagal menyusun lagu AI saat ini. Silakan coba lagi.');
  }

  // === 9. EMOJIMIX ===
  if (toolId === 'emojimix') {
    const pair = splitEmojiPair(arg);
    if (!pair) {
      throw new Error(
        'Masukkan 2 emoji untuk digabungkan! Contoh: `/emojimix 😎+🔥` atau `/emojimix 🐱+👑`'
      );
    }

    onStatus?.({
      toolName: 'Emoji Kitchen Mixer',
      mirrorName: 'Snow EmojiMix HD',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/tools/emojimix?emoji=${encodeURIComponent(pair.combined)}`,
      20000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const imgUrl =
      (typeof res1?.url === 'string' && res1.url) ||
      (typeof res1?.googleUrl === 'string' && res1.googleUrl) ||
      r1.imageUrl ||
      '';
    if (r1.ok && imgUrl) {
      return {
        content: `### ✨ EmojiMix Berhasil Dibuat: ${pair.e1} + ${pair.e2}`,
        answeredById: 'snow-emojimix',
        answeredByName: 'EmojiMix · Snow API',
        usedFallback: false,
        imageUrl: imgUrl,
        downloadItems: [
          { label: 'Unduh Stiker PNG', url: imgUrl, kind: 'image' },
        ],
      };
    }

    throw new Error(
      `Kombinasi emoji ${pair.e1} + ${pair.e2} belum didukung oleh Google Emoji Kitchen. Coba pasangan emoji ekspresi wajah atau hewan populer lainnya!`
    );
  }

  // === 10. BRAT ANIMATED VIDEO/GIF MAKER ===
  if (toolId === 'bratvid') {
    if (!arg) {
      throw new Error('Masukkan teks untuk animasi Brat. Contoh: `/bratvid nodatagpt keren`');
    }

    onStatus?.({
      toolName: 'Brat Animated Maker',
      mirrorName: 'Snow BratVid Engine',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/maker/bratVid?text=${encodeURIComponent(arg)}`,
      22000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const mediaUrl = typeof res1?.url === 'string' ? res1.url : r1.imageUrl || '';
    if (r1.ok && mediaUrl) {
      const isMp4 = /\.mp4(\?|$)/i.test(mediaUrl);
      return {
        content: `### 🟩 Animasi Brat Selesai: *"${arg}"*`,
        answeredById: 'snow-bratvid',
        answeredByName: 'BratVid · Snow API',
        usedFallback: false,
        imageUrl: !isMp4 ? mediaUrl : undefined,
        videoUrl: isMp4 ? mediaUrl : undefined,
        downloadItems: [
          {
            label: isMp4 ? 'Unduh Brat MP4' : 'Unduh Animasi GIF',
            url: mediaUrl,
            kind: isMp4 ? 'video' : 'image',
          },
        ],
      };
    }

    // Fallback Brat Static PNG
    onStatus?.({
      toolName: 'Brat Maker',
      mirrorName: 'Snow BratImg Fallback',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/maker/bratImg?text=${encodeURIComponent(arg)}`,
      18000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = j2?.result as Record<string, unknown> | undefined;
    const pngUrl = typeof res2?.url === 'string' ? res2.url : r2.imageUrl || '';
    if (r2.ok && pngUrl) {
      return {
        content: `### 🟩 Stiker Brat Selesai: *"${arg}"*`,
        answeredById: 'snow-bratimg',
        answeredByName: 'Brat Maker · Snow API',
        usedFallback: true,
        imageUrl: pngUrl,
      };
    }

    throw new Error('Gagal membuat animasi Brat saat ini.');
  }

  // === 11. STYLEFONT / FANCY UNICODE TEXT ===
  if (toolId === 'stylefont') {
    if (!arg) {
      throw new Error('Masukkan teks yang ingin diubah gayanya. Contoh: `/stylefont NodataGPT`');
    }

    onStatus?.({
      toolName: 'Fancy Unicode StyleFont',
      mirrorName: 'Snow StyleFont',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/tools/stylefont?text=${encodeURIComponent(arg)}`,
      18000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    if (r1.ok && res1 && typeof res1 === 'object' && !Array.isArray(res1)) {
      const entries = Object.entries(res1)
        .filter(
          ([name, val]) =>
            name.toLowerCase() !== 'tag' &&
            typeof val === 'string' &&
            val.trim().length > 0
        )
        .slice(0, 30);

      if (entries.length > 0) {
        const lines = entries.map(
          ([name, val]) => `- **${name}:** \`${String(val).trim()}\``
        );
        return {
          content: `### ✨ Variasi Huruf Unicode — *"${arg}"*\n\n${lines.join('\n')}`,
          answeredById: 'snow-stylefont',
          answeredByName: 'StyleFont · Snow API',
          usedFallback: false,
        };
      }
    }

    // Fallback Synox FancyText
    onStatus?.({
      toolName: 'Fancy Unicode StyleFont',
      mirrorName: 'Synox FancyText',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api.synoxcloud.xyz/tools/fancytext?text=${encodeURIComponent(arg)}&apikey=FREE`,
      18000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    if (r2.ok && Array.isArray(j2?.result)) {
      const items = (j2.result as Array<Record<string, unknown>>)
        .filter(
          (i) =>
            typeof i.hasil === 'string' &&
            i.hasil.trim().length > 0 &&
            !/error generating/i.test(i.hasil)
        )
        .slice(0, 30);
      if (items.length > 0) {
        const lines = items.map(
          (i) => `- **${String(i.nama_font || 'Style')}:** \`${String(i.hasil).replace(/\n+/g, ' ').trim()}\``
        );
        return {
          content: `### ✨ Variasi Huruf Unicode — *"${arg}"*\n\n${lines.join('\n')}`,
          answeredById: 'synox-fancytext',
          answeredByName: 'FancyText · Synox Cloud',
          usedFallback: true,
        };
      }
    }

    throw new Error('Gagal menghasilkan variasi gaya huruf Unicode.');
  }

  // === 12. WIKIPEDIA SEARCH ===
  if (toolId === 'wikipedia') {
    if (!arg) {
      throw new Error('Masukkan topik ensiklopedia yang ingin dicari. Contoh: `/wiki Indonesia`');
    }

    onStatus?.({
      toolName: 'Wikipedia Search',
      mirrorName: 'Varhad Wikipedia v2',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://v2.api-varhad.my.id/search/wikipedia?q=${encodeURIComponent(arg)}`,
      20000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    if (r1.ok && j1?.result) {
      const list = Array.isArray(j1.result)
        ? (j1.result as Array<Record<string, unknown>>)
        : [j1.result as Record<string, unknown>];
      const valid = list.filter((i) => i && (i.title || i.description || i.extract));
      if (valid.length > 0) {
        const topThumb =
          typeof valid[0].thumbnail === 'string' && valid[0].thumbnail.startsWith('http')
            ? valid[0].thumbnail
            : undefined;
        const formatted = valid
          .slice(0, 5)
          .map((item, idx) => {
            const title = String(item.title || arg);
            const desc = String(item.description || item.extract || '').trim();
            const link = typeof item.url === 'string' ? item.url : '';
            return `${idx + 1}. **${title}**${desc ? `\n   ${desc}` : ''}${link ? `\n   🔗 [Baca selengkapnya di Wikipedia](${link})` : ''}`;
          })
          .join('\n\n');

        return {
          content: `### 📚 Hasil Ensiklopedia Wikipedia — *"${arg}"*\n\n${formatted}`,
          answeredById: 'varhad-wiki',
          answeredByName: 'Wikipedia · Varhad v2',
          usedFallback: false,
          imageUrl: topThumb,
        };
      }
    }

    // Fallback Stenly Wikipedia
    onStatus?.({
      toolName: 'Wikipedia Search',
      mirrorName: 'Stenly Wikipedia',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://www.stenly.org/api/search/wikipedia?q=${encodeURIComponent(arg)}`,
      20000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = (j2?.result || j2?.data) as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
    if (r2.ok && res2) {
      const arr = Array.isArray(res2) ? res2 : [res2];
      if (arr.length > 0) {
        const formatted = arr
          .slice(0, 5)
          .map((item, idx) => {
            const title = String(item.title || item.judul || arg);
            const desc = String(item.extract || item.description || item.penjelasan || item.isi || '').trim();
            const link = typeof item.url === 'string' ? item.url : typeof item.link === 'string' ? item.link : '';
            return `${idx + 1}. **${title}**${desc ? `\n   ${desc}` : ''}${link ? `\n   🔗 [Buka Artikel](${link})` : ''}`;
          })
          .join('\n\n');
        return {
          content: `### 📚 Hasil Wikipedia — *"${arg}"*\n\n${formatted}`,
          answeredById: 'stenly-wiki',
          answeredByName: 'Wikipedia · Stenly',
          usedFallback: true,
        };
      }
    }

    throw new Error(`Artikel Wikipedia untuk "${arg}" belum ditemukan.`);
  }

  // === 13. LYRICS SEARCH ===
  if (toolId === 'lirik') {
    if (!arg) {
      throw new Error('Masukkan judul lagu untuk mencari lirik. Contoh: `/lirik Hati Hati di Jalan`');
    }

    onStatus?.({
      toolName: 'Pencari Lirik Lagu',
      mirrorName: 'Snow Genius Lyrics',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/search/lirik?q=${encodeURIComponent(arg)}`,
      22000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const rawLyrics = typeof res1?.lyrics === 'string' ? res1.lyrics : '';
    if (r1.ok && rawLyrics.trim().length > 15) {
      const title = String(res1?.full_title || res1?.title || arg);
      const artist = res1?.artist ? `\n**Artis:** ${String(res1.artist)}` : '';
      const thumb = typeof res1?.thumbnail === 'string' ? res1.thumbnail : undefined;
      const cleanLyrics = cleanGeniusLyricsHeader(rawLyrics);

      return {
        content: `### 🎤 Lirik Lagu: ${title}${artist}\n\n\`\`\`text\n${cleanLyrics}\n\`\`\``,
        answeredById: 'snow-lirik',
        answeredByName: 'Lyrics Search · Snow API',
        usedFallback: false,
        imageUrl: thumb,
      };
    }

    // Fallback Comiku Lyrics
    onStatus?.({
      toolName: 'Pencari Lirik Lagu',
      mirrorName: 'Comiku Lyrics',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://comiku.my.id/search/lirik?q=${encodeURIComponent(arg)}`,
      22000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const res2 = (j2?.result || j2?.data) as Record<string, unknown> | undefined;
    const l2 =
      (typeof res2?.lyrics === 'string' && res2.lyrics) ||
      (typeof res2?.lirik === 'string' && res2.lirik) ||
      '';
    if (r2.ok && l2.trim().length > 15) {
      return {
        content: `### 🎤 Lirik Lagu: ${String(res2?.title || arg)}\n\n\`\`\`text\n${l2.trim()}\n\`\`\``,
        answeredById: 'comiku-lirik',
        answeredByName: 'Lyrics · Comiku',
        usedFallback: true,
      };
    }

    throw new Error(`Lirik untuk lagu "${arg}" tidak ditemukan.`);
  }

  // === 14. PINTEREST HD VISUAL SEARCH ===
  if (toolId === 'pinterest') {
    if (!arg) {
      throw new Error(
        'Masukkan kata kunci gambar Pinterest. Contoh: `/pinterest cyberpunk city aesthetic`'
      );
    }

    onStatus?.({
      toolName: 'Pinterest HD Search',
      mirrorName: 'Snow Pinterest Visual',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.snowping.cfd/api/search/pinterest?query=${encodeURIComponent(arg)}`,
      24000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    if (r1.ok && Array.isArray(j1?.result)) {
      const urls = (j1.result as unknown[])
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const rec = item as Record<string, unknown>;
            return String(rec.image || rec.url || rec.images_url || '');
          }
          return '';
        })
        .filter((u) => /^https?:\/\//i.test(u))
        .slice(0, 12);

      if (urls.length > 0) {
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${urls.length} Pin HD)`,
          answeredById: 'snow-pinterest',
          answeredByName: 'Pinterest HD · Snow API',
          usedFallback: false,
          galleryUrls: urls,
        };
      }
    }

    // Fallback Stenly Pinterest
    onStatus?.({
      toolName: 'Pinterest HD Search',
      mirrorName: 'Stenly Pinterest',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://www.stenly.org/api/search/pinterest?q=${encodeURIComponent(arg)}`,
      24000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const arr2 = Array.isArray(j2?.result)
      ? j2.result
      : Array.isArray(j2?.data)
        ? j2.data
        : [];
    const urls2 = (arr2 as unknown[])
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          return String(rec.image || rec.url || rec.img || '');
        }
        return '';
      })
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 12);

    if (urls2.length > 0) {
      return {
        content: `### 📌 Galeri Visual Pinterest — *"${arg}"* *(Auto-Fallback Stenly)*`,
        answeredById: 'stenly-pinterest',
        answeredByName: 'Pinterest · Stenly',
        usedFallback: true,
        galleryUrls: urls2,
      };
    }

    // Fallback 3: BintangAPI Pinterest HD (48 Original HD Pins)
    onStatus?.({
      toolName: 'Pinterest HD Search',
      mirrorName: 'Bintang Pinterest HD',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      `https://bintangapi.my.id/api/search/pinterest?q=${encodeURIComponent(arg)}`,
      24000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    if (r3.ok && Array.isArray(j3?.data)) {
      const urls3 = (j3.data as Array<Record<string, unknown>>)
        .map((rec) => String(rec.image || rec.thumbnail || ''))
        .filter((u) => /^https?:\/\//i.test(u))
        .slice(0, 12);
      if (urls3.length > 0) {
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${urls3.length} Pin HD · BintangAPI)`,
          answeredById: 'bintang-pinterest',
          answeredByName: 'Pinterest HD · BintangAPI',
          usedFallback: true,
          galleryUrls: urls3,
        };
      }
    }

    // Fallback 4: Varhad Pinterest v2
    onStatus?.({
      toolName: 'Pinterest HD Search',
      mirrorName: 'Varhad Pinterest v2',
      attempt: 4,
      isFallback: true,
    });
    const r4 = await fetchToolEndpoint(
      `https://v2.api-varhad.my.id/search/pinterest?query=${encodeURIComponent(arg)}`,
      22000,
      signal
    );
    const j4 = safeParseJson(r4.body);
    if (r4.ok && Array.isArray(j4?.result)) {
      const urls4 = (j4.result as unknown[])
        .map((u) => (typeof u === 'string' ? u : ''))
        .filter((u) => /^https?:\/\//i.test(u))
        .slice(0, 12);
      if (urls4.length > 0) {
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* *(Auto-Fallback Varhad v2)*`,
          answeredById: 'varhad-pinterest',
          answeredByName: 'Pinterest · Varhad v2',
          usedFallback: true,
          galleryUrls: urls4,
        };
      }
    }

    throw new Error(`Tidak ditemukan pin visual untuk kata kunci "${arg}".`);
  }

  // === 15. INFO GEMPA TERKINI BMKG + SHAKEMAP ===
  if (toolId === 'gempa') {
    onStatus?.({
      toolName: 'Info Gempa BMKG',
      mirrorName: 'Synox BMKG Live',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      'https://api.synoxcloud.xyz/indonesia/gempa?apikey=FREE',
      20000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const res1 = j1?.result as Record<string, unknown> | undefined;
    const gempa = (res1?.gempa || res1) as Record<string, unknown> | undefined;
    if (r1.ok && gempa && (gempa.wilayah || gempa.Wilayah || gempa.lokasi)) {
      const tanggal = String(gempa.tanggal || gempa.Tanggal || '-');
      const jam = String(gempa.jam || gempa.Jam || '-');
      const mag = String(gempa.magnitude || gempa.Magnitude || '-');
      const kedalaman = String(gempa.kedalaman || gempa.Kedalaman || '-');
      const wilayah = String(gempa.wilayah || gempa.Wilayah || gempa.lokasi || '-');
      const koordinat = String(gempa.koordinat || gempa.Coordinates || '-');
      const potensi = String(gempa.potensi || gempa.Potensi || '-');
      const dirasakan = String(gempa.dirasakan || gempa.Dirasakan || '-');
      const rawShake = String(gempa.shakemap || gempa.Shakemap || '');
      const shakemapUrl = rawShake
        ? rawShake.startsWith('http')
          ? rawShake
          : `https://data.bmkg.go.id/DataMKG/TEWS/${rawShake}`
        : undefined;

      return {
        content: [
          `### 🌋 Info Gempa Bumi Terkini — BMKG Indonesia`,
          `| Parameter | Detail Resmi BMKG |`,
          `| :--- | :--- |`,
          `| **Waktu Kejadian** | ${tanggal} · ${jam} |`,
          `| **Magnitudo** | **M ${mag}** |`,
          `| **Kedalaman** | ${kedalaman} |`,
          `| **Lokasi Wilayah** | ${wilayah} |`,
          `| **Koordinat** | ${koordinat} |`,
          `| **Potensi** | ${potensi} |`,
          `| **Dirasakan (MMI)** | ${dirasakan} |`,
        ].join('\n'),
        answeredById: 'synox-bmkg',
        answeredByName: 'BMKG Live · Synox Cloud',
        usedFallback: false,
        imageUrl: shakemapUrl,
      };
    }

    // Fallback 2: Comiku CekGempa
    onStatus?.({
      toolName: 'Info Gempa BMKG',
      mirrorName: 'Comiku BMKG Mirror',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      'https://comiku.my.id/tools/cekgempa',
      20000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const g2 = (j2?.result || j2?.data) as Record<string, unknown> | undefined;
    if (r2.ok && g2 && (g2.lokasi || g2.wilayah || g2.Wilayah)) {
      const rawShake = String(g2.shakemap || g2.Shakemap || g2.gambar || '');
      return {
        content: [
          `### 🌋 Info Gempa Bumi Terkini — BMKG *(Auto-Fallback Comiku)*`,
          `- **Waktu:** ${String(g2.tanggal || g2.Tanggal || '-')} ${String(g2.waktu || g2.jam || g2.Jam || '')}`,
          `- **Magnitudo:** **M ${String(g2.magnitude || g2.Magnitude || '-')}**`,
          `- **Kedalaman:** ${String(g2.kedalaman || g2.Kedalaman || '-')}`,
          `- **Wilayah:** ${String(g2.lokasi || g2.wilayah || g2.Wilayah || '-')}`,
          `- **Koordinat:** ${String(g2.koordinat || g2.Coordinates || '-')}`,
          `- **Potensi:** ${String(g2.potensi || g2.Potensi || '-')}`,
        ].join('\n'),
        answeredById: 'comiku-bmkg',
        answeredByName: 'BMKG · Comiku',
        usedFallback: true,
        imageUrl: rawShake.startsWith('http') ? rawShake : undefined,
      };
    }

    // Fallback 3: Rin BMKG
    onStatus?.({
      toolName: 'Info Gempa BMKG',
      mirrorName: 'Rin BMKG Info',
      attempt: 3,
      isFallback: true,
    });
    const r3 = await fetchToolEndpoint(
      'https://apiii-xrina.my.id/info/bmkg-gempa',
      20000,
      signal
    );
    const j3 = safeParseJson(r3.body);
    const g3 = (j3?.result || j3?.data) as Record<string, unknown> | undefined;
    if (r3.ok && g3) {
      return {
        content: `### 🌋 Info Gempa Terkini BMKG\n\n\`\`\`json\n${JSON.stringify(g3, null, 2)}\n\`\`\``,
        answeredById: 'rin-bmkg',
        answeredByName: 'BMKG · Rin API',
        usedFallback: true,
      };
    }

    throw new Error('Gagal memuat data gempa terkini dari server BMKG.');
  }

  // === 16. BERITA NASIONAL ANTARA ===
  if (toolId === 'berita') {
    const filterKeyword = arg.trim().toLowerCase();

    const mirrors = [
      {
        id: 'bintang-antara',
        name: 'Antara News · BintangAPI',
        url: 'https://bintangapi.my.id/api/info/berita/antara',
      },
      {
        id: 'synox-antara',
        name: 'Antara News · Synox Cloud',
        url: 'https://api.synoxcloud.xyz/berita/antara?apikey=FREE',
      },
      {
        id: 'nexray-antara',
        name: 'Antara News · Nexray',
        url: 'https://api.nexray.eu.cc/berita/antara',
      },
    ];

    for (let i = 0; i < mirrors.length; i++) {
      const m = mirrors[i];
      onStatus?.({
        toolName: 'Berita Antara Indonesia',
        mirrorName: m.name,
        attempt: i + 1,
        isFallback: i > 0,
      });
      const r = await fetchToolEndpoint(m.url, 22000, signal);
      const j = safeParseJson(r.body);
      const rawList = Array.isArray(j?.data)
        ? j.data
        : Array.isArray(j?.result)
          ? j.result
          : [];

      if (r.ok && rawList.length > 0) {
        const articles = (rawList as Array<Record<string, unknown>>).filter(
          (a) => a && (a.title || a.judul)
        );
        const filtered = filterKeyword
          ? articles.filter((a) =>
              `${String(a.title || a.judul || '')} ${String(a.description || a.deskripsi || '')}`
                .toLowerCase()
                .includes(filterKeyword)
            )
          : articles;

        const chosen = (filtered.length > 0 ? filtered : articles).slice(0, 8);
        const topThumb =
          typeof chosen[0]?.thumbnail === 'string' &&
          chosen[0].thumbnail.startsWith('http')
            ? chosen[0].thumbnail
            : typeof chosen[0]?.image === 'string' && chosen[0].image.startsWith('http')
              ? chosen[0].image
              : undefined;

        const formatted = chosen
          .map((a, idx) => {
            const title = String(a.title || a.judul || 'Berita Terkini').trim();
            const link = String(a.link || a.url || '').trim();
            const desc = String(a.description || a.deskripsi || '')
              .replace(/<[^>]+>/g, '')
              .trim();
            const date = String(a.pubDate || a.tanggal || a.date || '').trim();
            return `${idx + 1}. **${title}**${date ? ` *(${date})*` : ''}${desc ? `\n   ${desc.slice(0, 200)}${desc.length > 200 ? '...' : ''}` : ''}${link ? `\n   🔗 [Baca Berita Lengkap](${link})` : ''}`;
          })
          .join('\n\n');

        return {
          content: `### 📰 Berita Terkini Antara Indonesia${filterKeyword && filtered.length > 0 ? ` — Topik *"${arg}"*` : ''}\n\n${formatted}`,
          answeredById: m.id,
          answeredByName: m.name,
          usedFallback: i > 0,
          imageUrl: topThumb,
        };
      }
    }

    throw new Error('Gagal memuat daftar berita terkini dari Antara News.');
  }

  // === 17. CUACA REAL-TIME (WTTR.IN + COMIKU FALLBACK) ===
  if (toolId === 'cuaca') {
    const city = (arg || 'Jakarta').trim();
    onStatus?.({
      toolName: 'Prakiraan Cuaca',
      mirrorName: 'wttr.in Global Weather',
      attempt: 1,
      isFallback: false,
    });

    const r1 = await fetchToolEndpoint(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=id`,
      20000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const curArr = Array.isArray(j1?.current_condition)
      ? (j1.current_condition as Array<Record<string, unknown>>)
      : [];

    if (r1.ok && curArr.length > 0) {
      const cur = curArr[0];
      const areaArr = Array.isArray(j1?.nearest_area)
        ? (j1.nearest_area as Array<Record<string, unknown>>)
        : [];
      const areaObj = areaArr[0] || {};
      const areaName =
        (Array.isArray(areaObj.areaName) &&
          String((areaObj.areaName[0] as Record<string, unknown>)?.value || '')) ||
        city;
      const countryName =
        (Array.isArray(areaObj.country) &&
          String((areaObj.country[0] as Record<string, unknown>)?.value || '')) ||
        '';
      const descId =
        (Array.isArray(cur.lang_id) &&
          String((cur.lang_id[0] as Record<string, unknown>)?.value || '')) ||
        (Array.isArray(cur.weatherDesc) &&
          String((cur.weatherDesc[0] as Record<string, unknown>)?.value || '')) ||
        'Cerah Berawan';

      const forecastArr = Array.isArray(j1?.weather)
        ? (j1.weather as Array<Record<string, unknown>>).slice(0, 3)
        : [];
      const forecastRows = forecastArr
        .map((day) => {
          const dt = String(day.date || '-');
          const minT = String(day.mintempC || '-');
          const maxT = String(day.maxtempC || '-');
          const avgT = String(day.avgtempC || '-');
          const astro = Array.isArray(day.astronomy)
            ? (day.astronomy[0] as Record<string, unknown>)
            : undefined;
          const sun = astro
            ? `${String(astro.sunrise || '')} – ${String(astro.sunset || '')}`
            : '-';
          return `| ${dt} | **${minT}°C – ${maxT}°C** (rata² ${avgT}°C) | ${sun} |`;
        })
        .join('\n');

      return {
        content: [
          `### 🌤️ Cuaca Terkini — ${areaName}${countryName ? `, ${countryName}` : ''}`,
          `| Parameter | Kondisi Saat Ini |`,
          `| :--- | :--- |`,
          `| **Kondisi Langit** | **${descId}** |`,
          `| **Suhu Udara** | **${String(cur.temp_C || '-')} °C** *(terasa seperti ${String(cur.FeelsLikeC || '-')} °C)* |`,
          `| **Kelembapan** | ${String(cur.humidity || '-')} % |`,
          `| **Kecepatan Angin** | ${String(cur.windspeedKmph || '-')} km/jam (${String(cur.winddir16Point || '-')}) |`,
          `| **Indeks UV / Jarak Pandang** | UV ${String(cur.uvIndex || '-')} · ${String(cur.visibility || '-')} km |`,
          forecastRows
            ? `\n#### 📅 Prakiraan 3 Hari ke Depan\n| Tanggal | Rentang Suhu | Matahari Terbit – Terbenam |\n| :--- | :--- | :--- |\n${forecastRows}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
        answeredById: 'wttr-cuaca',
        answeredByName: 'Weather Live · wttr.in',
        usedFallback: false,
      };
    }

    // Fallback: Comiku CekCuaca
    onStatus?.({
      toolName: 'Prakiraan Cuaca',
      mirrorName: 'Comiku Weather',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://comiku.my.id/tools/cekcuaca?kota=${encodeURIComponent(city)}`,
      18000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    const d2 = (j2?.result || j2?.data) as Record<string, unknown> | undefined;
    if (r2.ok && d2) {
      return {
        content: `### 🌤️ Cuaca Terkini — ${city}\n\n\`\`\`json\n${JSON.stringify(d2, null, 2)}\n\`\`\``,
        answeredById: 'comiku-cuaca',
        answeredByName: 'Cuaca · Comiku',
        usedFallback: true,
      };
    }

    throw new Error(`Gagal memuat data cuaca untuk kota "${city}".`);
  }

  // === 18. JADWAL SHOLAT RESMI KEMENAG RI ===
  if (toolId === 'sholat') {
    const cityKeyword = (arg || 'Jakarta').trim();
    onStatus?.({
      toolName: 'Jadwal Sholat Kemenag',
      mirrorName: 'MyQuran Kemenag API',
      attempt: 1,
      isFallback: false,
    });

    let kotaId = '1301'; // Default: Kota Jakarta
    let lokasiLabel = 'KOTA JAKARTA';

    if (cityKeyword.toLowerCase() !== 'jakarta') {
      const searchRes = await fetchToolEndpoint(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cityKeyword)}`,
        16000,
        signal
      );
      const searchJson = safeParseJson(searchRes.body);
      const kotaList = Array.isArray(searchJson?.data)
        ? (searchJson.data as Array<Record<string, unknown>>)
        : [];
      if (kotaList.length === 0) {
        throw new Error(
          `Kota/kabupaten "${cityKeyword}" tidak ditemukan pada database Kemenag RI. Coba nama kota seperti Bandung, Surabaya, Medan, atau Yogyakarta.`
        );
      }
      kotaId = String(kotaList[0].id || '1301');
      lokasiLabel = String(kotaList[0].lokasi || cityKeyword);
    }

    // Format today's date in Asia/Jakarta (WIB)
    const wibParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-');
    const [yyyy, mm, dd] =
      wibParts.length === 3 ? wibParts : ['2026', '10', '31'];

    const jadwalRes = await fetchToolEndpoint(
      `https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(kotaId)}/${yyyy}/${mm}/${dd}`,
      18000,
      signal
    );
    const jadwalJson = safeParseJson(jadwalRes.body);
    const dataObj = jadwalJson?.data as Record<string, unknown> | undefined;
    const jadwal = dataObj?.jadwal as Record<string, unknown> | undefined;

    if (jadwalRes.ok && jadwal && jadwal.subuh) {
      const lokasi = String(dataObj?.lokasi || lokasiLabel);
      const daerah = String(dataObj?.daerah || 'INDONESIA');
      const tanggal = String(jadwal.tanggal || `${dd}/${mm}/${yyyy}`);

      return {
        content: [
          `### 🕌 Jadwal Sholat Resmi Kemenag RI — ${lokasi} (${daerah})`,
          `**Tanggal:** ${tanggal}`,
          ``,
          `| Waktu Ibadah | Jam Lokal |`,
          `| :--- | :--- |`,
          `| **Imsak** | \`${String(jadwal.imsak || '-')}\` |`,
          `| **Subuh** | **\`${String(jadwal.subuh || '-')}\`** |`,
          `| **Terbit** | \`${String(jadwal.terbit || '-')}\` |`,
          `| **Dhuha** | \`${String(jadwal.dhuha || '-')}\` |`,
          `| **Dzuhur** | **\`${String(jadwal.dzuhur || '-')}\`** |`,
          `| **Ashar** | **\`${String(jadwal.ashar || '-')}\`** |`,
          `| **Maghrib** | **\`${String(jadwal.maghrib || '-')}\`** |`,
          `| **Isya** | **\`${String(jadwal.isya || '-')}\`** |`,
        ].join('\n'),
        answeredById: 'myquran-kemenag',
        answeredByName: 'Jadwal Sholat · MyQuran Kemenag',
        usedFallback: false,
      };
    }

    throw new Error(`Gagal memuat jadwal sholat untuk wilayah "${cityKeyword}".`);
  }

  // === 19. KURS VALUTA ASING & KONVERTER RUPIAH ===
  if (toolId === 'kurs') {
    const fmtIdr = (n: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: n >= 100 ? 0 : 2,
      }).format(n);
    const fmtNum = (n: number) =>
      new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(n);

    // Parse optional input like "100 USD", "250 SGD ke IDR", "EUR", "1000000 IDR ke USD"
    const cleanArg = arg.trim();
    const convMatch = cleanArg.match(
      /^([\d.,]+)?\s*([A-Za-z]{3})(?:\s+(?:ke|to|in)\s+([A-Za-z]{3}))?$/i
    );

    const amount = convMatch?.[1]
      ? Number(convMatch[1].replace(/,/g, '')) || 1
      : 1;
    const baseCurrency = convMatch?.[2]
      ? convMatch[2].toUpperCase()
      : 'USD';
    const targetCurrency = convMatch?.[3]
      ? convMatch[3].toUpperCase()
      : 'IDR';

    onStatus?.({
      toolName: 'Kurs Valuta Asing',
      mirrorName: 'ExchangeRate-API Live',
      attempt: 1,
      isFallback: false,
    });

    const r1 = await fetchToolEndpoint(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`,
      18000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const rates = j1?.rates as Record<string, number> | undefined;

    if (r1.ok && rates && typeof rates === 'object') {
      if (convMatch) {
        const rate = rates[targetCurrency];
        if (typeof rate !== 'number') {
          throw new Error(
            `Kode mata uang "${targetCurrency}" tidak ditemukan. Contoh: \`/kurs 100 USD\` atau \`/kurs 500 SGD ke IDR\`.`
          );
        }
        const total = amount * rate;
        const formattedTotal =
          targetCurrency === 'IDR'
            ? fmtIdr(total)
            : `${fmtNum(total)} ${targetCurrency}`;
        const formattedUnit =
          targetCurrency === 'IDR'
            ? fmtIdr(rate)
            : `${fmtNum(rate)} ${targetCurrency}`;

        return {
          content: [
            `### 💱 Konversi Kurs Mata Uang Real-Time`,
            `- **Nominal:** **${fmtNum(amount)} ${baseCurrency}** = **${formattedTotal}**`,
            `- **Kurs Satuan:** 1 ${baseCurrency} = ${formattedUnit}`,
            `- **Pembaruan Pasar:** ${String(j1?.time_last_update_utc || 'Terbaru')}`,
          ].join('\n'),
          answeredById: 'er-api-kurs',
          answeredByName: 'Kurs Live · ExchangeRate-API',
          usedFallback: false,
        };
      }

      // Default `/kurs`: show major global currencies in IDR!
      const idrPerUsd = Number(rates.IDR || 0);
      const majorCodes: Array<{ code: string; label: string }> = [
        { code: 'USD', label: '🇺🇸 Dolar Amerika Serikat' },
        { code: 'SGD', label: '🇸🇬 Dolar Singapura' },
        { code: 'EUR', label: '🇪🇺 Euro Eropa' },
        { code: 'MYR', label: '🇲🇾 Ringgit Malaysia' },
        { code: 'SAR', label: '🇸🇦 Riyal Arab Saudi' },
        { code: 'JPY', label: '🇯🇵 Yen Jepang (per 1 JPY)' },
        { code: 'GBP', label: '🇬🇧 Poundsterling Inggris' },
        { code: 'AUD', label: '🇦🇺 Dolar Australia' },
        { code: 'CNY', label: '🇨🇳 Yuan Tiongkok' },
      ];

      const rows = majorCodes
        .map(({ code, label }) => {
          const perUsd = Number(rates[code] || 0);
          if (!perUsd || !idrPerUsd) return '';
          const inIdr = code === 'USD' ? idrPerUsd : idrPerUsd / perUsd;
          return `| **1 ${code}** | ${label} | **${fmtIdr(inIdr)}** |`;
        })
        .filter(Boolean)
        .join('\n');

      return {
        content: [
          `### 💱 Tabel Kurs Valuta Asing terhadap Rupiah (IDR)`,
          `| Kode | Mata Uang | Nilai Tukar (IDR) |`,
          `| :--- | :--- | :--- |`,
          rows,
          `\n*Tips: Ketik \`/kurs 150 USD\` atau \`/kurs 1000 SAR\` untuk menghitung konversi nominal otomatis.*`,
        ].join('\n'),
        answeredById: 'er-api-kurs',
        answeredByName: 'Kurs Live · ExchangeRate-API',
        usedFallback: false,
      };
    }

    throw new Error('Gagal memuat data kurs mata uang terbaru.');
  }

  // === 20. HARGA SPOT EMAS DUNIA (XAU/USD + IDR/GRAM) ===
  if (toolId === 'emas') {
    onStatus?.({
      toolName: 'Harga Spot Emas',
      mirrorName: 'Gold-API Spot XAU',
      attempt: 1,
      isFallback: false,
    });

    const [goldRes, fxRes] = await Promise.all([
      fetchToolEndpoint('https://api.gold-api.com/price/XAU', 18000, signal),
      fetchToolEndpoint('https://open.er-api.com/v6/latest/USD', 18000, signal),
    ]);

    const goldJson = safeParseJson(goldRes.body);
    const fxJson = safeParseJson(fxRes.body);
    const spotUsdOz = Number(goldJson?.price || 0);
    const idrRate = Number(
      (fxJson?.rates as Record<string, unknown> | undefined)?.IDR || 16500
    );

    if (goldRes.ok && spotUsdOz > 0) {
      const TROY_OZ_GRAMS = 31.1034768;
      const usdPerGram = spotUsdOz / TROY_OZ_GRAMS;
      const idrPerGram = usdPerGram * idrRate;
      const idrPerOz = spotUsdOz * idrRate;

      const fmtUsd = (n: number) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
        }).format(n);
      const fmtIdr = (n: number) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(n);

      const gramMatch = arg.trim().match(/^([\d.,]+)/);
      const customGrams = gramMatch
        ? Number(gramMatch[1].replace(/,/g, '')) || 0
        : 0;

      return {
        content: [
          `### 🪙 Harga Spot Emas Dunia (XAU) & Estimasi Rupiah`,
          `| Satuan Ukuran | Harga Pasar Spot (24K) |`,
          `| :--- | :--- |`,
          `| **1 Troy Ounce (31,10 gr)** | **${fmtUsd(spotUsdOz)}** *(${fmtIdr(idrPerOz)})* |`,
          `| **1 Gram Emas Murni** | **${fmtIdr(idrPerGram)}** *(${fmtUsd(usdPerGram)})* |`,
          `| **5 Gram Emas Murni** | **${fmtIdr(idrPerGram * 5)}** |`,
          `| **10 Gram Emas Murni** | **${fmtIdr(idrPerGram * 10)}** |`,
          customGrams > 0 && customGrams !== 1 && customGrams !== 5 && customGrams !== 10
            ? `| **Simulasi ${customGrams} Gram** | **${fmtIdr(idrPerGram * customGrams)}** |`
            : '',
          `\n*Kurs acuan: 1 USD = ${fmtIdr(idrRate)} · Diperbarui: ${String(goldJson?.updatedAt || 'Real-time')}*`,
        ]
          .filter(Boolean)
          .join('\n'),
        answeredById: 'gold-api-xau',
        answeredByName: 'Spot Gold XAU · Gold-API',
        usedFallback: false,
      };
    }

    throw new Error('Gagal memuat harga spot emas dunia saat ini.');
  }

  // === 21. HARGA PASAR CRYPTO LIVE (COINGECKO) ===
  if (toolId === 'crypto') {
    onStatus?.({
      toolName: 'Pasar Crypto Live',
      mirrorName: 'CoinGecko Market API',
      attempt: 1,
      isFallback: false,
    });

    const queryCoin = arg.trim();
    let targetIds = '';

    if (queryCoin) {
      const searchRes = await fetchToolEndpoint(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(queryCoin)}`,
        18000,
        signal
      );
      const searchJson = safeParseJson(searchRes.body);
      const coinsFound = Array.isArray(searchJson?.coins)
        ? (searchJson.coins as Array<Record<string, unknown>>)
        : [];
      if (coinsFound.length > 0) {
        targetIds = coinsFound
          .slice(0, 5)
          .map((c) => String(c.id || ''))
          .filter(Boolean)
          .join(',');
      }
    }

    const marketUrl = targetIds
      ? `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(targetIds)}&order=market_cap_desc`
      : 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1';

    const [mktRes, fxRes] = await Promise.all([
      fetchToolEndpoint(marketUrl, 20000, signal),
      fetchToolEndpoint('https://open.er-api.com/v6/latest/USD', 16000, signal),
    ]);

    const idrRate = Number(
      (safeParseJson(fxRes.body)?.rates as Record<string, unknown> | undefined)
        ?.IDR || 16500
    );

    let list: Array<Record<string, unknown>> = [];
    if (mktRes.ok && mktRes.body) {
      try {
        const parsed = JSON.parse(mktRes.body.trim());
        if (Array.isArray(parsed)) {
          list = parsed as Array<Record<string, unknown>>;
        }
      } catch {
        // Ignore parse error
      }
    }

    if (list.length > 0) {
      const fmtUsd = (n: number) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: n >= 1 ? 2 : 6,
        }).format(n);
      const fmtIdr = (n: number) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: n >= 100 ? 0 : 2,
        }).format(n);

      const rows = list
        .map((c) => {
          const sym = String(c.symbol || '').toUpperCase();
          const name = String(c.name || sym);
          const priceUsd = Number(c.current_price || 0);
          const chg = Number(c.price_change_percentage_24h || 0);
          const badge = chg >= 0 ? `🟢 +${chg.toFixed(2)}%` : `🔴 ${chg.toFixed(2)}%`;
          return `| **${name}** (\`${sym}\`) | **${fmtUsd(priceUsd)}** | ${fmtIdr(priceUsd * idrRate)} | ${badge} |`;
        })
        .join('\n');

      const topImg =
        queryCoin && typeof list[0]?.image === 'string' && list[0].image.startsWith('http')
          ? list[0].image
          : undefined;

      return {
        content: [
          `### ₿ Pasar Aset Kripto Real-Time${queryCoin ? ` — *"${queryCoin}"*` : ' (Top Market Cap)'}`,
          `| Aset Kripto | Harga (USD) | Estimasi (IDR) | 24 Jam |`,
          `| :--- | :--- | :--- | :--- |`,
          rows,
        ].join('\n'),
        answeredById: 'coingecko-live',
        answeredByName: 'Crypto Market · CoinGecko',
        usedFallback: false,
        imageUrl: topImg,
      };
    }

    throw new Error(
      `Data koin kripto${queryCoin ? ` untuk "${queryCoin}"` : ''} tidak dapat dimuat saat ini.`
    );
  }

  // === 22. INDEKS IHSG & SAHAM BEI / GLOBAL (YAHOO FINANCE) ===
  if (toolId === 'saham') {
    const rawTicker = (arg || '^JKSE').trim().toUpperCase();
    const knownGlobalTickers = new Set([
      'AAPL',
      'MSFT',
      'NVDA',
      'TSLA',
      'AMZN',
      'GOOG',
      'GOOGL',
      'META',
      'NFLX',
      'AMD',
      'INTC',
      'COIN',
      'PLTR',
      'ORCL',
      'UBER',
      'BABA',
      'DIS',
      'SPY',
      'QQQ',
    ]);

    const tickerCandidates: string[] = [];
    if (rawTicker === 'IHSG' || rawTicker === 'JKSE' || rawTicker === '^JKSE') {
      tickerCandidates.push('^JKSE');
    } else if (rawTicker.includes('.') || rawTicker.startsWith('^')) {
      tickerCandidates.push(rawTicker);
    } else if (/^[A-Z]{4}$/.test(rawTicker) && !knownGlobalTickers.has(rawTicker)) {
      tickerCandidates.push(`${rawTicker}.JK`, rawTicker);
    } else {
      tickerCandidates.push(rawTicker, `${rawTicker}.JK`);
    }

    onStatus?.({
      toolName: 'Indeks IHSG & Saham',
      mirrorName: 'Yahoo Finance Live Chart',
      attempt: 1,
      isFallback: false,
    });

    for (const sym of tickerCandidates) {
      const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
      ];

      for (const u of urls) {
        const res = await fetchToolEndpoint(u, 18000, signal);
        const json = safeParseJson(res.body);
        const chart = json?.chart as Record<string, unknown> | undefined;
        const resultArr = Array.isArray(chart?.result)
          ? (chart.result as Array<Record<string, unknown>>)
          : [];
        const meta = resultArr[0]?.meta as Record<string, unknown> | undefined;

        if (res.ok && meta && typeof meta.regularMarketPrice === 'number') {
          const price = Number(meta.regularMarketPrice);
          const prevClose = Number(
            meta.chartPreviousClose ?? meta.previousClose ?? price
          );
          const diff = price - prevClose;
          const pct = prevClose > 0 ? (diff / prevClose) * 100 : 0;
          const currency = String(meta.currency || 'IDR');
          const name = String(meta.longName || meta.shortName || sym);
          const dayHigh =
            typeof meta.regularMarketDayHigh === 'number'
              ? meta.regularMarketDayHigh
              : null;
          const dayLow =
            typeof meta.regularMarketDayLow === 'number'
              ? meta.regularMarketDayLow
              : null;
          const w52High =
            typeof meta.fiftyTwoWeekHigh === 'number'
              ? meta.fiftyTwoWeekHigh
              : null;
          const w52Low =
            typeof meta.fiftyTwoWeekLow === 'number'
              ? meta.fiftyTwoWeekLow
              : null;

          const fmtVal = (v: number) =>
            new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
              maximumFractionDigits: 2,
            }).format(v);

          const trendBadge =
            diff >= 0
              ? `🟢 +${fmtVal(diff)} (+${pct.toFixed(2)}%)`
              : `🔴 ${fmtVal(diff)} (${pct.toFixed(2)}%)`;

          return {
            content: [
              `### 📈 Data Pasar Saham / Indeks — ${name} (\`${String(meta.symbol || sym)}\`)`,
              `| Indikator Pasar | Nilai Terkini |`,
              `| :--- | :--- |`,
              `| **Harga Pasar** | **${fmtVal(price)} ${currency}** |`,
              `| **Perubahan Harian** | **${trendBadge}** *(Prev Close: ${fmtVal(prevClose)})* |`,
              dayLow !== null && dayHigh !== null
                ? `| **Rentang Hari Ini** | ${fmtVal(dayLow)} – ${fmtVal(dayHigh)} ${currency} |`
                : '',
              w52Low !== null && w52High !== null
                ? `| **Rentang 52 Minggu** | ${fmtVal(w52Low)} – ${fmtVal(w52High)} ${currency} |`
                : '',
              `| **Bursa** | ${String(meta.fullExchangeName || meta.exchangeName || '-')} |`,
            ]
              .filter(Boolean)
              .join('\n'),
            answeredById: 'yahoo-finance',
            answeredByName: 'Market Data · Yahoo Finance',
            usedFallback: false,
          };
        }
      }
    }

    throw new Error(
      `Kode saham/indeks "${rawTicker}" tidak ditemukan. Contoh: \`/ihsg\`, \`/saham BBCA\`, \`/saham TLKM\`, atau \`/saham NVDA\`.`
    );
  }

  // === 23. KUTIPAN MOTIVASI & INSPIRASI (ZENQUOTES) ===
  if (toolId === 'quote') {
    onStatus?.({
      toolName: 'Kutipan Inspirasi',
      mirrorName: 'ZenQuotes Live',
      attempt: 1,
      isFallback: false,
    });

    const r1 = await fetchToolEndpoint('https://zenquotes.io/api/random', 16000, signal);
    if (r1.ok && r1.body) {
      try {
        const arr = JSON.parse(r1.body.trim()) as Array<Record<string, unknown>>;
        if (Array.isArray(arr) && arr[0]?.q) {
          const quoteText = String(arr[0].q).trim();
          const author = String(arr[0].a || 'Anonim').trim();
          return {
            content: `### 💬 Kutipan Inspirasi Hari Ini\n\n> *"${quoteText}"*\n>\n> — **${author}**`,
            answeredById: 'zenquotes',
            answeredByName: 'Inspirasi · ZenQuotes',
            usedFallback: false,
          };
        }
      } catch {
        // Ignore parse error
      }
    }

    throw new Error('Gagal memuat kutipan inspirasi saat ini.');
  }

  throw new Error(`Perintah tool "${toolId}" tidak dikenali.`);
}
