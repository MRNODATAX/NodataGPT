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
  acceptsGeoLocation?: boolean;
  secondarySelect?: {
    label: string;
    defaultValue: string;
    options: Array<{ value: string; label: string }>;
  };
  countSelector?: {
    label: string;
    defaultCount: number;
    maxCount: number;
    presets: number[];
  };
  usageNotice?: {
    title: string;
    syntax: string;
    notes: string;
    examples: string[];
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
  galleryDownloadUrls?: string[];
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
  {
    id: 'soundcloud',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'SoundCloud Search & MP3 Downloader',
    shortName: 'SoundCloud MP3',
    slashCommand: '/soundcloud',
    badge: 'Cari Lagu + MP3',
    description:
      'Cari dan putar/unduh musik independen, remix, dan lagu SoundCloud langsung sebagai MP3.',
    placeholder: 'Ketik judul lagu atau nama musisi SoundCloud...',
    exampleInput: 'Hindia Evaluasi',
    requiresInput: true,
  },
  {
    id: 'cloudfile',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'MediaFire & Terabox Direct Downloader',
    shortName: 'MediaFire / Terabox',
    slashCommand: '/cloudfile',
    badge: 'Unduh Langsung 1-Klik',
    description:
      'Ekstrak tautan unduhan langsung dari berkas publik MediaFire maupun Terabox siap unduh 1-klik.',
    placeholder: 'Tempel tautan berkas MediaFire atau Terabox...',
    exampleInput: 'https://www.mediafire.com/file/...',
    requiresInput: true,
  },
  {
    id: 'pixiv',
    category: 'A',
    categoryLabel: 'Downloader Media',
    name: 'Pixiv Artwork HD Search & Downloader',
    shortName: 'Pixiv HD',
    slashCommand: '/pixiv',
    badge: 'Ilustrasi Anime HD',
    description:
      'Cari ilustrasi anime/digital art resolusi tinggi di Pixiv berdasarkan kata kunci atau ID karya.',
    placeholder: 'Ketik karakter/kata kunci anime atau ID karya Pixiv...',
    exampleInput: 'Raiden Shogun aesthetic',
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
    name: 'Berita Nasional Multi-Portal Live',
    shortName: 'Berita Nasional',
    slashCommand: '/berita',
    badge: 'CNN · Kompas · CNBC · Antara',
    description:
      'Pantau berita utama terbaru dari CNN Indonesia, Kompas, CNBC Indonesia, dan Antara secara real-time.',
    placeholder: 'Opsional: ketik topik berita yang dicari (atau kosongkan)...',
    exampleInput: '',
    requiresInput: false,
    secondarySelect: {
      label: 'Portal Berita',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'Semua Portal Utama' },
        { value: 'cnn', label: 'CNN Indonesia' },
        { value: 'kompas', label: 'Kompas.com' },
        { value: 'cnbc', label: 'CNBC Indonesia' },
        { value: 'antara', label: 'Antara News' },
      ],
    },
  },
  {
    id: 'websearch',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Pencarian Web DuckDuckGo Live',
    shortName: 'Web Search',
    slashCommand: '/search',
    badge: 'Hasil Web Aktual',
    description:
      'Telusuri artikel, dokumentasi, dan situs web terbaru di internet secara real-time via DuckDuckGo.',
    placeholder: 'Ketik kata kunci pencarian web...',
    exampleInput: 'perkembangan teknologi AI terbaru di Indonesia',
    requiresInput: true,
  },
  {
    id: 'translate',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Penerjemah Multi-Bahasa Pintar',
    shortName: 'Terjemahan Bahasa',
    slashCommand: '/translate',
    badge: 'Auto-Deteksi Bahasa',
    description:
      'Terjemahkan kalimat atau paragraf secara instan ke Bahasa Indonesia, Inggris, Jepang, Arab, Korea, & lainnya.',
    placeholder: 'Ketik atau tempel teks yang ingin diterjemahkan...',
    exampleInput: 'Artificial intelligence helps developers ship faster and more reliably.',
    requiresInput: true,
    secondarySelect: {
      label: 'Bahasa Tujuan',
      defaultValue: 'id',
      options: [
        { value: 'id', label: '🇮🇩 Indonesia' },
        { value: 'en', label: '🇬🇧 Inggris' },
        { value: 'ja', label: '🇯🇵 Jepang' },
        { value: 'ar', label: '🇸🇦 Arab' },
        { value: 'ko', label: '🇰🇷 Korea' },
        { value: 'zh-CN', label: '🇨🇳 Mandarin' },
        { value: 'de', label: '🇩🇪 Jerman' },
        { value: 'es', label: '🇪🇸 Spanyol' },
      ],
    },
  },
  {
    id: 'ocr',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Baca Teks dari Gambar / Foto (OCR AI)',
    shortName: 'OCR Baca Gambar',
    slashCommand: '/ocr',
    badge: 'Ekstrak Teks + Upload Foto',
    description:
      'Salin otomatis tulisan dari foto dokumen, struk, papan tulis, atau screenshot (dukung upload foto langsung).',
    placeholder: 'Tempel URL gambar atau klik Upload Foto dari Perangkat...',
    exampleInput: 'https://www.nodatagpt.web.id/logo.png',
    requiresInput: true,
    acceptsImageUpload: true,
  },
  {
    id: 'meme',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Meme Generator HD Instan',
    shortName: 'Meme Maker',
    slashCommand: '/meme',
    badge: 'PNG HD Siap Unduh',
    description:
      'Buat gambar meme populer resolusi tinggi lengkap dengan teks atas & bawah siap unduh 1-klik.',
    placeholder: 'Ketik Teks Atas | Teks Bawah (contoh: Pakai API Manual | Pakai NodataGPT)',
    exampleInput: 'Pakai API Manual | Pakai NodataGPT Auto-Fallback',
    requiresInput: true,
    secondarySelect: {
      label: 'Template Meme',
      defaultValue: 'drake',
      options: [
        { value: 'drake', label: 'Drake Hotline Bling' },
        { value: 'distracted', label: 'Distracted Boyfriend' },
        { value: 'cmm', label: 'Change My Mind' },
        { value: 'buzz', label: 'Buzz & Woody Everywhere' },
        { value: 'fine', label: 'This Is Fine' },
        { value: 'doge', label: 'Doge Classic' },
        { value: 'uno', label: 'Draw 25 UNO' },
      ],
    },
  },
  {
    id: 'stalker',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Cek Profil Publik (TikTok, GitHub & Negara)',
    shortName: 'Profil & Negara',
    slashCommand: '/stalk',
    badge: 'TikTok · GitHub · Negara',
    description:
      'Lihat statistik akun publik TikTok, repositori developer GitHub, atau profil lengkap negara dunia.',
    placeholder: 'Ketik username (mis. tiktok / torvalds) atau nama negara (mis. Indonesia)...',
    exampleInput: 'Indonesia',
    requiresInput: true,
    secondarySelect: {
      label: 'Jenis Pencarian Profil',
      defaultValue: 'tiktok',
      options: [
        { value: 'tiktok', label: '🎵 Profil TikTok' },
        { value: 'github', label: '💻 Developer GitHub' },
        { value: 'country', label: '🌍 Info Negara Dunia' },
      ],
    },
  },
  {
    id: 'randomimg',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Kreasi Visual Acak & Wallpaper 4K Studio',
    shortName: 'Random Image 4K',
    slashCommand: '/randomimage',
    badge: 'Tanpa API Key · Atur Jumlah ,N',
    description:
      'Eksplorasi gambar acak & wallpaper 4K/HD bebas kunci (Alam, Cyberpunk, Galaksi, Kota, Anime, Minimalis, HP Portrait, & Mockup) dengan pengaturan jumlah gambar (,1 s/d ,30), palet warna HEX, & Unduh 4K 1-Klik.',
    placeholder:
      'Opsional: ketik tema bebas (mis. samurai neon, ocean sunset) atau kosongkan...',
    exampleInput: 'cyberpunk rain neon',
    requiresInput: false,
    secondarySelect: {
      label: 'Mode Kreasi Visual',
      defaultValue: 'random',
      options: [
        { value: 'random', label: '🎲 Acak Bebas 4K' },
        { value: 'anime', label: '🎨 Anime & Ilustrasi HD' },
        { value: 'nature', label: '🌿 Alam & Lanskap' },
        { value: 'cyberpunk', label: '🌆 Cyberpunk & Tech' },
        { value: 'space', label: '🌌 Galaksi & Angkasa' },
        { value: 'city', label: '🏙️ Kota & Arsitektur' },
        { value: 'minimal', label: '✨ Minimalis & Abstract' },
        { value: 'portrait', label: '📱 Wallpaper HP (9:16)' },
        { value: 'mockup', label: '📸 Foto Mockup UI (Unsplash)' },
      ],
    },
    countSelector: {
      label: 'Jumlah Gambar Ditampilkan (1–30)',
      defaultCount: 4,
      maxCount: 30,
      presets: [2, 4, 6, 8, 10, 12, 16, 20, 24, 30],
    },
    usageNotice: {
      title: 'Panduan Command & Cara Pakai /randomimage',
      syntax: '/randomimage [mode / tema] ,<jumlah>',
      notes:
        'Tambahkan koma + angka di akhir perintah (misal ,10) untuk mengatur jumlah gambar (1–30). Kosongkan tema jika ingin murni acak sesuai mode.',
      examples: [
        '/randomimage anime ,10',
        '/randomimage cyberpunk ,8',
        '/randomimage portrait | alya kujou ,6',
        '/randomimage ,12',
      ],
    },
  },
  {
    id: 'pinterest',
    category: 'D',
    categoryLabel: 'Kreatif, Riset & Info ID',
    name: 'Pinterest HD Visual Search',
    shortName: 'Pinterest HD',
    slashCommand: '/pinterest',
    badge: 'Galeri HD · Atur Jumlah ,N',
    description:
      'Cari referensi desain, karakter anime, wallpaper, dan fotografi resolusi tinggi langsung dalam galeri chat dengan jumlah gambar fleksibel (1–30).',
    placeholder: 'Ketik kata kunci pencarian Pinterest (contoh: alya kujou)...',
    exampleInput: 'alya kujou',
    requiresInput: true,
    countSelector: {
      label: 'Jumlah Pin Ditampilkan (1–30)',
      defaultCount: 8,
      maxCount: 30,
      presets: [4, 6, 8, 10, 12, 16, 20, 24, 30],
    },
    usageNotice: {
      title: 'Panduan Command & Cara Pakai /pinterest',
      syntax: '/pinterest <kata kunci> ,<jumlah>',
      notes:
        'Tambahkan koma + angka di akhir kata kunci (misal ,10) untuk menentukan jumlah pin HD yang ditampilkan (maksimal 30 gambar).',
      examples: [
        '/pinterest alya kujou ,10',
        '/pinterest cyberpunk anime wallpaper ,15',
        '/pin minimalist ui design ,12',
      ],
    },
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
    name: 'Cuaca Akurat Hiper-Lokal (Desa / Kecamatan / GPS)',
    shortName: 'Cuaca Hiper-Lokal',
    slashCommand: '/cuaca',
    badge: 'Desa · GPS · BMKG · AQI · 5 Hari',
    description:
      'Cuaca presisi tinggi hingga tingkat desa, kelurahan, kecamatan, kota kecil, pegunungan (koreksi elevasi DEM 90m), maupun koordinat GPS lengkap dengan radar peluang hujan per jam, kualitas udara (AQI/PM2.5), & prakiraan 5 hari.',
    placeholder:
      'Ketik desa/kecamatan/kota (mis. Cibiru Bandung, Dieng Wonosobo, Cikarang) atau klik GPS...',
    exampleInput: 'Cibiru Bandung',
    requiresInput: false,
    acceptsGeoLocation: true,
  },
  {
    id: 'sholat',
    category: 'E',
    categoryLabel: 'Cuaca, Sholat & Finansial',
    name: 'Jadwal Sholat Resmi Kemenag RI',
    shortName: 'Jadwal Sholat',
    slashCommand: '/sholat',
    badge: 'Imsak s/d Isya + GPS',
    description:
      'Jadwal waktu sholat harian resmi Kementerian Agama RI (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya) seluruh kota/kabupaten Indonesia.',
    placeholder: 'Ketik kota/kabupaten di Indonesia atau klik GPS (mis. Wonosobo, Bandung)...',
    exampleInput: 'Bandung',
    requiresInput: false,
    acceptsGeoLocation: true,
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
  count?: number;
}

export function extractTrailingImageCount(
  rawText: string,
  defaultCount: number,
  maxCount = 30
): { cleanText: string; count: number; explicitCount: boolean } {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { cleanText: '', count: defaultCount, explicitCount: false };
  }

  // Case 1: Only ",10" or "10" entered (e.g. "/randomimage ,10" or "/randomimage 10")
  const onlyCountMatch = trimmed.match(/^,?\s*(\d{1,3})\s*$/);
  if (onlyCountMatch) {
    const parsedOnly = Math.min(Math.max(Number(onlyCountMatch[1]) || 1, 1), maxCount);
    return { cleanText: '', count: parsedOnly, explicitCount: true };
  }

  // Case 2: Trailing ",10" / " ,10" / ", 10" (e.g. "/pinterest alya kujou  ,10" or "/randomimage anime ,10")
  const trailingCommaMatch = trimmed.match(/^([\s\S]*?)\s*,\s*(\d{1,3})\s*$/);
  if (trailingCommaMatch) {
    const parsed = Math.min(
      Math.max(Number(trailingCommaMatch[2]) || defaultCount, 1),
      maxCount
    );
    return {
      cleanText: trailingCommaMatch[1].trim(),
      count: parsed,
      explicitCount: true,
    };
  }

  return { cleanText: trimmed, count: defaultCount, explicitCount: false };
}

export function detectWebToolCommand(rawInput: string): ParsedWebToolCommand | null {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) {
    if (
      trimmed.length <= 120 &&
      !/\b(?:perbedaan|pengertian|definisi|jelaskan|apa\s+itu|buat(?:kan)?|kode|script|html|aplikasi|website|puisi|cerita)\b/i.test(
        trimmed
      )
    ) {
      const natWeather = trimmed.match(
        /^(?:tolong\s+|coba\s+)?(?:cek\s+|lihat\s+|info\s+|prakiraan\s+|ramalan\s+|bagaimana\s+|gimana\s+|berapa\s+)?(?:suhu\s+(?:dan\s+|&\s+)?)?cuaca(?:\s+(?:hari\s+ini|sekarang|terkini|saat\s+ini|malam\s+ini|siang\s+ini|pagi\s+ini|besok))?\s+(?:di|untuk|daerah|wilayah)\s+([^\n?]{2,80})\??$/i
      );
      if (natWeather && natWeather[1]?.trim()) {
        const cleanLoc = natWeather[1]
          .replace(/\b(?:hari\s+ini|sekarang|terkini|saat\s+ini)\b/gi, '')
          .trim();
        if (cleanLoc.length >= 2) {
          return { toolId: 'cuaca', arg: cleanLoc };
        }
      }
    }
    return null;
  }

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
    case 'soundcloud':
    case 'sc':
      return { toolId: 'soundcloud', arg: rest };
    case 'cloudfile':
    case 'mediafire':
    case 'mf':
    case 'terabox':
      return { toolId: 'cloudfile', arg: rest };
    case 'pixiv':
      return { toolId: 'pixiv', arg: rest };
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
    case 'pin': {
      const parsedPin = extractTrailingImageCount(rest, 8, 30);
      return {
        toolId: 'pinterest',
        arg: parsedPin.cleanText,
        count: parsedPin.count,
      };
    }
    case 'random':
    case 'randomimg':
    case 'randomimage':
    case 'wallpaper':
    case 'wall': {
      // Support "/random image anime ,10" or "/random img anime ,10" as well!
      const normalizedRest =
        cmd === 'random'
          ? rest.replace(/^(?:image|img|wallpaper|wall)\b\s*/i, '').trim()
          : rest;
      const parsedRand = extractTrailingImageCount(normalizedRest, 4, 30);
      const bodyText = parsedRand.cleanText;

      const modePipe = bodyText.match(
        /^(random|nature|cyberpunk|space|city|anime|minimal|portrait|mockup)\s*\|\s*([\s\S]*)$/i
      );
      if (modePipe) {
        return {
          toolId: 'randomimg',
          arg: modePipe[2].trim(),
          subOption: modePipe[1].toLowerCase(),
          count: parsedRand.count,
        };
      }
      if (
        /^(random|nature|cyberpunk|space|city|anime|minimal|portrait|mockup)$/i.test(
          bodyText
        )
      ) {
        return {
          toolId: 'randomimg',
          arg: '',
          subOption: bodyText.toLowerCase(),
          count: parsedRand.count,
        };
      }
      return {
        toolId: 'randomimg',
        arg: bodyText,
        subOption: 'random',
        count: parsedRand.count,
      };
    }
    case 'gempa':
    case 'bmkg':
      return { toolId: 'gempa', arg: rest };
    case 'berita':
    case 'news': {
      const portalPipe = rest.match(/^(all|cnn|kompas|cnbc|antara)\s*\|\s*([\s\S]*)$/i);
      if (portalPipe) {
        return {
          toolId: 'berita',
          arg: portalPipe[2].trim(),
          subOption: portalPipe[1].toLowerCase(),
        };
      }
      if (/^(cnn|kompas|cnbc|antara)$/i.test(rest)) {
        return { toolId: 'berita', arg: '', subOption: rest.toLowerCase() };
      }
      return { toolId: 'berita', arg: rest, subOption: 'all' };
    }
    case 'antara':
      return { toolId: 'berita', arg: rest, subOption: 'antara' };
    case 'cnn':
      return { toolId: 'berita', arg: rest, subOption: 'cnn' };
    case 'kompas':
      return { toolId: 'berita', arg: rest, subOption: 'kompas' };
    case 'cnbc':
      return { toolId: 'berita', arg: rest, subOption: 'cnbc' };
    case 'search':
    case 'cari':
    case 'ddg':
    case 'websearch':
      return { toolId: 'websearch', arg: rest };
    case 'translate':
    case 'tr':
    case 'terjemah': {
      const langPipe = rest.match(/^([a-z]{2}(?:-[A-Z]{2})?)\s*\|\s*([\s\S]+)$/);
      if (langPipe) {
        return {
          toolId: 'translate',
          arg: langPipe[2].trim(),
          subOption: langPipe[1],
        };
      }
      return { toolId: 'translate', arg: rest, subOption: 'id' };
    }
    case 'ocr':
    case 'bacateks':
      return { toolId: 'ocr', arg: rest };
    case 'meme': {
      const tplPipe = rest.match(/^([a-z0-9_-]{2,20})\s*\|\s*([\s\S]+\|[\s\S]+)$/i);
      if (tplPipe) {
        return {
          toolId: 'meme',
          arg: tplPipe[2].trim(),
          subOption: tplPipe[1].toLowerCase(),
        };
      }
      return { toolId: 'meme', arg: rest, subOption: 'drake' };
    }
    case 'stalk':
    case 'profil': {
      const kindPipe = rest.match(/^(tiktok|github|country)\s*\|\s*([\s\S]+)$/i);
      if (kindPipe) {
        return {
          toolId: 'stalker',
          arg: kindPipe[2].trim(),
          subOption: kindPipe[1].toLowerCase(),
        };
      }
      return { toolId: 'stalker', arg: rest, subOption: 'tiktok' };
    }
    case 'tiktokstalk':
    case 'ttstalk':
      return { toolId: 'stalker', arg: rest, subOption: 'tiktok' };
    case 'ghstalk':
    case 'github':
      return { toolId: 'stalker', arg: rest, subOption: 'github' };
    case 'negara':
    case 'country':
      return { toolId: 'stalker', arg: rest, subOption: 'country' };
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
  subOption?: string,
  countValue?: number
): string {
  // Strip any accidental trailing ",N" already typed by user in inputValue if countSelector is active
  const rawTrimmed = inputValue.trim();
  const clean =
    tool.countSelector && countValue
      ? extractTrailingImageCount(rawTrimmed, countValue, tool.countSelector.maxCount)
          .cleanText
      : rawTrimmed;
  const countSuffix =
    tool.countSelector && countValue && countValue > 0 ? ` ,${countValue}` : '';

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
  if (tool.id === 'berita' && subOption && subOption !== 'all') {
    return clean ? `/berita ${subOption} | ${clean}` : `/berita ${subOption}`;
  }
  if (tool.id === 'translate' && subOption) {
    return `/translate ${subOption} | ${clean}`.trim();
  }
  if (tool.id === 'meme' && subOption) {
    const normalizedMeme = clean.includes('|') ? clean : `${clean} | `;
    return `/meme ${subOption} | ${normalizedMeme}`.trim();
  }
  if (tool.id === 'stalker' && subOption) {
    return `/stalk ${subOption} | ${clean}`.trim();
  }
  if (tool.id === 'pinterest') {
    if (!clean) return `/pinterest${countSuffix}`;
    return `/pinterest ${clean}${countSuffix}`;
  }
  if (tool.id === 'randomimg') {
    const mode = subOption || 'random';
    if (!clean && mode === 'random') {
      return countValue && countValue !== 4
        ? `/randomimage ,${countValue}`
        : '/randomimage';
    }
    if (!clean) return `/randomimage ${mode}${countSuffix}`;
    if (mode === 'random') return `/randomimage ${clean}${countSuffix}`;
    return `/randomimage ${mode} | ${clean}${countSuffix}`;
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

function encodeMemegenSegment(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '_';
  return encodeURIComponent(
    cleaned
      .replace(/_/g, '__')
      .replace(/-/g, '--')
      .replace(/\s+/g, '_')
      .replace(/\?/g, '~q')
      .replace(/%/g, '~p')
      .replace(/#/g, '~h')
      .replace(/\//g, '~s')
      .replace(/"/g, "''")
  );
}

function describeWmoWeatherCode(
  code: number | undefined,
  isDay = 1
): { label: string; emoji: string } {
  switch (Number(code)) {
    case 0:
      return isDay
        ? { label: 'Cerah', emoji: '☀️' }
        : { label: 'Langit Malam Cerah', emoji: '🌙' };
    case 1:
      return isDay
        ? { label: 'Cerah Berawan', emoji: '🌤️' }
        : { label: 'Malam Cerah Berawan', emoji: '🌙' };
    case 2:
      return { label: 'Berawan Sebagian', emoji: '⛅' };
    case 3:
      return { label: 'Mendung / Berawan Tebal', emoji: '☁️' };
    case 45:
    case 48:
      return { label: 'Berkabut', emoji: '🌫️' };
    case 51:
      return { label: 'Gerimis Ringan', emoji: '🌦️' };
    case 53:
      return { label: 'Gerimis Sedang', emoji: '🌦️' };
    case 55:
    case 56:
    case 57:
      return { label: 'Gerimis Rapat', emoji: '🌧️' };
    case 61:
      return { label: 'Hujan Ringan', emoji: '🌧️' };
    case 63:
      return { label: 'Hujan Sedang', emoji: '🌧️' };
    case 65:
    case 66:
    case 67:
      return { label: 'Hujan Lebat', emoji: '🌧️' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Hujan Salju', emoji: '❄️' };
    case 80:
      return { label: 'Hujan Lokal Ringan', emoji: '🌦️' };
    case 81:
      return { label: 'Hujan Lokal Sedang', emoji: '🌧️' };
    case 82:
      return { label: 'Hujan Deras Lokal', emoji: '⛈️' };
    case 95:
      return { label: 'Hujan Disertai Petir', emoji: '⛈️' };
    case 96:
    case 99:
      return { label: 'Badai Petir & Angin Kencang', emoji: '⛈️' };
    default:
      return { label: 'Berawan', emoji: '⛅' };
  }
}

function compassFromDegrees(deg?: number): string {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '-';
  const dirs = [
    'Utara',
    'Timur Laut',
    'Timur',
    'Tenggara',
    'Selatan',
    'Barat Daya',
    'Barat',
    'Barat Laut',
  ];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return `${dirs[idx]} (${Math.round(deg)}°)`;
}

function formatAqiBadge(usAqi?: number): string {
  if (typeof usAqi !== 'number' || Number.isNaN(usAqi)) return '-';
  const v = Math.round(usAqi);
  if (v <= 50) return `🟢 **${v}** (Baik / Udara Segar)`;
  if (v <= 100) return `🟡 **${v}** (Sedang)`;
  if (v <= 150) return `🟠 **${v}** (Kurang Sehat bagi Sensitif)`;
  if (v <= 200) return `🔴 **${v}** (Tidak Sehat)`;
  if (v <= 300) return `🟣 **${v}** (Sangat Tidak Sehat)`;
  return `🟤 **${v}** (Berbahaya)`;
}

interface ResolvedHyperLocalGeo {
  lat: number;
  lon: number;
  displayTitle: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  country?: string;
  countryCode?: string;
  elevation?: number;
  geocoderSource: string;
}

function parseSafeJsonAny(raw?: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

async function resolveHyperLocalGeoPoint(
  rawQuery: string,
  signal?: AbortSignal
): Promise<ResolvedHyperLocalGeo | null> {
  const cleaned = rawQuery
    .replace(/^(?:di|kota|wilayah|daerah)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();

  // 1. Direct GPS coordinate input (`-6.9175, 107.6191`)
  const coordMatch = cleaned.match(
    /^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/
  );
  if (coordMatch) {
    const lat = Number(coordMatch[1]);
    const lon = Number(coordMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      const revRes = await fetchToolEndpoint(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&accept-language=id`,
        14000,
        signal
      );
      const revObj = safeParseJson(revRes.body);
      const addr = (revObj?.address || {}) as Record<string, unknown>;
      const desa = String(
        addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || ''
      ).trim();
      const kecamatan = String(
        addr.city_district || addr.district || addr.municipality || addr.subdistrict || ''
      ).trim();
      const kabupaten = String(
        addr.city || addr.county || addr.regency || addr.town || ''
      ).trim();
      const provinsi = String(addr.state || addr.region || '').trim();
      const country = String(addr.country || '').trim();
      const countryCode = String(addr.country_code || '').toLowerCase();

      const parts = [desa, kecamatan, kabupaten, provinsi, country].filter(Boolean);
      const uniqueParts = parts.filter((p, i) => parts.indexOf(p) === i);

      return {
        lat,
        lon,
        displayTitle:
          uniqueParts.slice(0, 4).join(', ') ||
          `Koordinat GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        desa: desa || undefined,
        kecamatan: kecamatan || undefined,
        kabupaten: kabupaten || undefined,
        provinsi: provinsi || undefined,
        country: country || undefined,
        countryCode: countryCode || undefined,
        geocoderSource: 'GPS + OpenStreetMap Nominatim',
      };
    }
  }

  // 2. OpenStreetMap Nominatim Search (accurate down to Desa, Kelurahan, Kecamatan, Gunung, Jalan)
  const nomRes = await fetchToolEndpoint(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleaned)}&format=jsonv2&addressdetails=1&limit=5&accept-language=id`,
    15000,
    signal
  );
  const nomArr = parseSafeJsonAny(nomRes.body);
  if (nomRes.ok && Array.isArray(nomArr) && nomArr.length > 0) {
    const items = nomArr as Array<Record<string, unknown>>;
    // Prefer Indonesian administrative match when multiple countries share a village/town name, unless user typed a foreign country
    const idCandidate = items.find((it) => {
      const a = (it.address || {}) as Record<string, unknown>;
      return String(a.country_code || '').toLowerCase() === 'id';
    });
    const best = idCandidate || items[0];
    const lat = Number(best.lat);
    const lon = Number(best.lon);

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const addr = (best.address || {}) as Record<string, unknown>;
      const primaryName = String(best.name || '').trim();
      const desa = String(
        addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || ''
      ).trim();
      const kecamatan = String(
        addr.city_district || addr.district || addr.municipality || addr.subdistrict || ''
      ).trim();
      const kabupaten = String(
        addr.city || addr.county || addr.regency || addr.town || ''
      ).trim();
      const provinsi = String(addr.state || addr.region || '').trim();
      const country = String(addr.country || '').trim();
      const countryCode = String(addr.country_code || '').toLowerCase();

      const rawLabelParts = [
        primaryName,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        countryCode === 'id' ? 'Indonesia' : country,
      ].filter(Boolean);
      const deduped: string[] = [];
      for (const p of rawLabelParts) {
        if (!deduped.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
          deduped.push(p);
        }
      }

      return {
        lat,
        lon,
        displayTitle: deduped.slice(0, 4).join(', ') || String(best.display_name || cleaned),
        desa: desa || undefined,
        kecamatan: kecamatan || undefined,
        kabupaten: kabupaten || undefined,
        provinsi: provinsi || undefined,
        country: country || undefined,
        countryCode: countryCode || undefined,
        geocoderSource: 'OpenStreetMap Nominatim',
      };
    }
  }

  // 3. Open-Meteo Global Geocoding Fallback (with DEM elevation)
  const simpleName = cleaned.split(',')[0].trim() || cleaned;
  const omGeoRes = await fetchToolEndpoint(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(simpleName)}&count=5&language=id&format=json`,
    14000,
    signal
  );
  const omGeoJson = safeParseJson(omGeoRes.body);
  const omResults = Array.isArray(omGeoJson?.results)
    ? (omGeoJson.results as Array<Record<string, unknown>>)
    : [];
  if (omGeoRes.ok && omResults.length > 0) {
    const lowerClean = cleaned.toLowerCase();
    const matchedResult =
      omResults.find((r) => {
        const a1 = String(r.admin1 || '').toLowerCase();
        const a2 = String(r.admin2 || '').toLowerCase();
        return (a1 && lowerClean.includes(a1)) || (a2 && lowerClean.includes(a2));
      }) ||
      omResults.find((r) => String(r.country_code || '').toLowerCase() === 'id') ||
      omResults[0];

    const lat = Number(matchedResult.latitude);
    const lon = Number(matchedResult.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const name = String(matchedResult.name || simpleName).trim();
      const admin3 = String(matchedResult.admin3 || '').trim();
      const admin2 = String(matchedResult.admin2 || '').trim();
      const admin1 = String(matchedResult.admin1 || '').trim();
      const country = String(matchedResult.country || '').trim();
      const countryCode = String(matchedResult.country_code || '').toLowerCase();
      const elev =
        typeof matchedResult.elevation === 'number'
          ? matchedResult.elevation
          : undefined;

      const labelParts = [name, admin3, admin2, admin1, country].filter(Boolean);
      const deduped = labelParts.filter(
        (p, idx) =>
          labelParts.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === idx
      );

      return {
        lat,
        lon,
        displayTitle: deduped.slice(0, 4).join(', '),
        desa: admin3 ? name : undefined,
        kecamatan: admin3 || undefined,
        kabupaten: admin2 || undefined,
        provinsi: admin1 || undefined,
        country: country || undefined,
        countryCode: countryCode || undefined,
        elevation: elev,
        geocoderSource: 'Open-Meteo Geocoding',
      };
    }
  }

  return null;
}

async function executeAccurateWeatherLookup(
  rawQuery: string,
  signal?: AbortSignal,
  onStatus?: WebToolStatusCallback
): Promise<WebToolExecutionResult | null> {
  const query = (rawQuery || 'Jakarta').trim();

  // Case A: Direct BMKG Official Village Code (`adm4` format XX.XX.XX.XXXX)
  let bmkgVillageSection = '';
  let geo: ResolvedHyperLocalGeo | null = null;

  if (/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(query)) {
    onStatus?.({
      toolName: 'Cuaca Hiper-Lokal',
      mirrorName: 'BMKG Publik Desa/Kelurahan',
      attempt: 1,
      isFallback: false,
    });
    const bmkgRes = await fetchToolEndpoint(
      `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(query)}`,
      16000,
      signal
    );
    const bmkgJson = safeParseJson(bmkgRes.body);
    const lokasi = bmkgJson?.lokasi as Record<string, unknown> | undefined;
    if (bmkgRes.ok && lokasi && lokasi.lat && lokasi.lon) {
      geo = {
        lat: Number(lokasi.lat),
        lon: Number(lokasi.lon),
        displayTitle: [
          lokasi.desa,
          lokasi.kecamatan,
          lokasi.kotkab,
          lokasi.provinsi,
        ]
          .filter(Boolean)
          .join(', '),
        desa: String(lokasi.desa || ''),
        kecamatan: String(lokasi.kecamatan || ''),
        kabupaten: String(lokasi.kotkab || ''),
        provinsi: String(lokasi.provinsi || ''),
        country: 'Indonesia',
        countryCode: 'id',
        geocoderSource: `BMKG ADM4 (${query})`,
      };

      const dataArr = Array.isArray(bmkgJson?.data)
        ? (bmkgJson.data as Array<Record<string, unknown>>)
        : [];
      const rawCuacaGroups = Array.isArray(dataArr[0]?.cuaca)
        ? (dataArr[0].cuaca as unknown[])
        : [];
      const flatSlots = rawCuacaGroups
        .flatMap((g) => (Array.isArray(g) ? (g as Array<Record<string, unknown>>) : []))
        .slice(0, 6);

      if (flatSlots.length > 0) {
        const bmkgRows = flatSlots
          .map((s) => {
            const dt = String(s.local_datetime || '').slice(11, 16) || '-';
            const day = String(s.local_datetime || '').slice(5, 10) || '';
            return `| ${day} \`${dt}\` | **${String(s.t ?? '-')}°C** | ${String(s.hu ?? '-')}% | ${String(s.weather_desc || '-')} | ${String(s.ws ?? '-')} km/j (${String(s.wd || '-')}) |`;
          })
          .join('\n');
        bmkgVillageSection = [
          `\n#### 🏛️ Data Resmi BMKG Tingkat Desa/Kelurahan (\`${query}\`)`,
          `| Waktu Lokal | Suhu | Lembap | Kondisi BMKG | Angin |`,
          `| :--- | :--- | :--- | :--- | :--- |`,
          bmkgRows,
        ].join('\n');
      }
    }
  }

  // Case B: Resolve place name / village / subdistrict / GPS via Dual Geocoder
  if (!geo) {
    onStatus?.({
      toolName: 'Cuaca Hiper-Lokal',
      mirrorName: 'Geokoding Presisi (Desa/Kecamatan/GPS)',
      attempt: 1,
      isFallback: false,
    });
    geo = await resolveHyperLocalGeoPoint(query, signal);
  }

  if (!geo) return null;

  onStatus?.({
    toolName: 'Cuaca Hiper-Lokal',
    mirrorName: `Open-Meteo DEM 90m + AQI (${geo.desa || geo.kecamatan || geo.kabupaten || 'Live'})`,
    attempt: 1,
    isFallback: false,
  });

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=5`;

  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&current=us_aqi,european_aqi,pm2_5,pm10&timezone=auto`;

  const canQueryFaaVillage =
    !bmkgVillageSection &&
    geo.countryCode === 'id' &&
    Boolean(geo.kabupaten && geo.kecamatan && geo.desa);

  const faaVillageUrl = canQueryFaaVillage
    ? `https://api-faa.my.id/faa/cuaca?kabupaten=${encodeURIComponent(
        geo.kabupaten!
      )}&kecamatan=${encodeURIComponent(geo.kecamatan!)}&desa=${encodeURIComponent(
        geo.desa!
      )}`
    : '';

  const [forecastSettled, aqiSettled, faaSettled] = await Promise.allSettled([
    fetchToolEndpoint(forecastUrl, 18000, signal),
    fetchToolEndpoint(aqiUrl, 12000, signal),
    faaVillageUrl
      ? fetchToolEndpoint(faaVillageUrl, 11000, signal)
      : Promise.resolve(null),
  ]);

  const fRes =
    forecastSettled.status === 'fulfilled' ? forecastSettled.value : null;
  const fJson = safeParseJson(fRes?.body);
  const current = fJson?.current as Record<string, unknown> | undefined;
  if (!fRes?.ok || !current || typeof current.temperature_2m !== 'number') {
    return null;
  }

  const aqiRes = aqiSettled.status === 'fulfilled' ? aqiSettled.value : null;
  const aqiJson = safeParseJson(aqiRes?.body);
  const aqiCur = aqiJson?.current as Record<string, unknown> | undefined;

  if (
    !bmkgVillageSection &&
    faaSettled.status === 'fulfilled' &&
    faaSettled.value?.ok
  ) {
    const faaJson = safeParseJson(faaSettled.value.body);
    const pred = faaJson?.prediksi_harian as Record<string, unknown> | undefined;
    if (faaJson?.status === true && pred && typeof pred.ringkas === 'string') {
      const detail = typeof pred.detail === 'string' ? ` ${pred.detail}` : '';
      bmkgVillageSection = `\n> 🏛️ **Ringkasan Desa/Kelurahan (${geo.desa}, Kec. ${geo.kecamatan}):** ${pred.ringkas}${detail}`;
    }
  }

  const elevationMeters =
    typeof fJson?.elevation === 'number'
      ? Math.round(fJson.elevation)
      : typeof geo.elevation === 'number'
        ? Math.round(geo.elevation)
        : undefined;
  const tzName = String(fJson?.timezone || 'Lokal');
  const obsTimeRaw = String(current.time || '');
  const obsTimeFormatted = obsTimeRaw.includes('T')
    ? obsTimeRaw.replace('T', ' pukul ')
    : obsTimeRaw;

  const isDay = Number(current.is_day ?? 1);
  const wmo = describeWmoWeatherCode(Number(current.weather_code ?? 1), isDay);
  const temp = Number(current.temperature_2m).toFixed(1);
  const feels = Number(current.apparent_temperature ?? current.temperature_2m).toFixed(1);
  const hum = Math.round(Number(current.relative_humidity_2m ?? 0));
  const cloud = Math.round(Number(current.cloud_cover ?? 0));
  const precip = Number(current.precipitation ?? 0).toFixed(1);
  const wind = Number(current.wind_speed_10m ?? 0).toFixed(1);
  const gusts = Number(current.wind_gusts_10m ?? 0).toFixed(1);
  const windDir = compassFromDegrees(
    typeof current.wind_direction_10m === 'number'
      ? current.wind_direction_10m
      : undefined
  );
  const pressure =
    typeof current.surface_pressure === 'number'
      ? `${Math.round(current.surface_pressure)} hPa`
      : '-';
  const uvNow =
    typeof current.uv_index === 'number' ? Number(current.uv_index).toFixed(1) : '-';

  const usAqi =
    typeof aqiCur?.us_aqi === 'number' ? aqiCur.us_aqi : undefined;
  const pm25 =
    typeof aqiCur?.pm2_5 === 'number' ? `${aqiCur.pm2_5.toFixed(1)} µg/m³` : null;
  const pm10 =
    typeof aqiCur?.pm10 === 'number' ? `${aqiCur.pm10.toFixed(1)} µg/m³` : null;

  // Build next 12 hours radar (every 2 hours = 6 crisp rows so mobile stays super clean!)
  const hourly = fJson?.hourly as Record<string, unknown> | undefined;
  const hTimes = Array.isArray(hourly?.time) ? (hourly.time as string[]) : [];
  const hTemps = Array.isArray(hourly?.temperature_2m)
    ? (hourly.temperature_2m as number[])
    : [];
  const hProbs = Array.isArray(hourly?.precipitation_probability)
    ? (hourly.precipitation_probability as number[])
    : [];
  const hCodes = Array.isArray(hourly?.weather_code)
    ? (hourly.weather_code as number[])
    : [];

  let startHourIdx = hTimes.findIndex((t) => t >= obsTimeRaw.slice(0, 13));
  if (startHourIdx < 0) startHourIdx = 0;

  const hourlyRows: string[] = [];
  for (let offset = 1; offset <= 12 && startHourIdx + offset < hTimes.length; offset += 2) {
    const idx = startHourIdx + offset;
    const hhmm = String(hTimes[idx] || '').slice(11, 16) || '-';
    const ht = typeof hTemps[idx] === 'number' ? `${hTemps[idx].toFixed(1)}°C` : '-';
    const hp = typeof hProbs[idx] === 'number' ? `${Math.round(hProbs[idx])}%` : '0%';
    const hw = describeWmoWeatherCode(hCodes[idx], 1);
    hourlyRows.push(`| \`${hhmm}\` | **${ht}** | ${hp} | ${hw.emoji} ${hw.label} |`);
  }

  // Build 5-day forecast table
  const daily = fJson?.daily as Record<string, unknown> | undefined;
  const dDates = Array.isArray(daily?.time) ? (daily.time as string[]) : [];
  const dCodes = Array.isArray(daily?.weather_code)
    ? (daily.weather_code as number[])
    : [];
  const dMax = Array.isArray(daily?.temperature_2m_max)
    ? (daily.temperature_2m_max as number[])
    : [];
  const dMin = Array.isArray(daily?.temperature_2m_min)
    ? (daily.temperature_2m_min as number[])
    : [];
  const dRainProb = Array.isArray(daily?.precipitation_probability_max)
    ? (daily.precipitation_probability_max as number[])
    : [];
  const dRainSum = Array.isArray(daily?.precipitation_sum)
    ? (daily.precipitation_sum as number[])
    : [];
  const dSunrise = Array.isArray(daily?.sunrise) ? (daily.sunrise as string[]) : [];
  const dSunset = Array.isArray(daily?.sunset) ? (daily.sunset as string[]) : [];

  const dailyRows = dDates
    .slice(0, 5)
    .map((dt, i) => {
      const dw = describeWmoWeatherCode(dCodes[i], 1);
      const minT = typeof dMin[i] === 'number' ? dMin[i].toFixed(1) : '-';
      const maxT = typeof dMax[i] === 'number' ? dMax[i].toFixed(1) : '-';
      const rProb =
        typeof dRainProb[i] === 'number' ? `${Math.round(dRainProb[i])}%` : '-';
      const rMm =
        typeof dRainSum[i] === 'number' && dRainSum[i] > 0
          ? ` (${dRainSum[i].toFixed(1)} mm)`
          : '';
      const sr = String(dSunrise[i] || '').slice(11, 16);
      const ss = String(dSunset[i] || '').slice(11, 16);
      const sun = sr && ss ? `${sr}–${ss}` : '-';
      return `| ${dt} | ${dw.emoji} ${dw.label} | **${minT}°–${maxT}°C** | ${rProb}${rMm} | ${sun} |`;
    })
    .join('\n');

  const metaBadges = [
    `📍 **Koordinat:** \`${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}\``,
    elevationMeters !== undefined ? `⛰️ **Elevasi DEM:** \`${elevationMeters} mdpl\`` : '',
    `🕒 **Zona Waktu:** \`${tzName}\` (${obsTimeFormatted})`,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    content: [
      `### ${wmo.emoji} Cuaca Akurat Hiper-Lokal — ${geo.displayTitle}`,
      metaBadges,
      bmkgVillageSection,
      ``,
      `| Parameter Meteorologi | Kondisi Real-Time (Interval 15 Menit) |`,
      `| :--- | :--- |`,
      `| **Kondisi Langit** | **${wmo.emoji} ${wmo.label}** *(tutupan awan ${cloud}%)* |`,
      `| **Suhu Udara Aktual** | **${temp} °C** *(terasa seperti **${feels} °C**)* |`,
      `| **Curah Hujan Saat Ini** | **${precip} mm** |`,
      `| **Kelembapan Udara** | **${hum} %** · Tekanan **${pressure}** |`,
      `| **Angin & Hembusan** | **${wind} km/jam** *(hembusan s/d ${gusts} km/jam)* dari **${windDir}** |`,
      `| **Indeks UV** | **UV ${uvNow}** |`,
      usAqi !== undefined
        ? `| **Kualitas Udara (AQI / ISPU)** | ${formatAqiBadge(usAqi)}${pm25 ? ` · PM2.5: \`${pm25}\`` : ''}${pm10 ? ` · PM10: \`${pm10}\`` : ''} |`
        : '',
      hourlyRows.length > 0
        ? `\n#### 🌧️ Radar Peluang Hujan 12 Jam ke Depan\n| Jam Lokal | Suhu | Peluang Hujan | Prakiraan Langit |\n| :--- | :--- | :--- | :--- |\n${hourlyRows.join('\n')}`
        : '',
      dailyRows
        ? `\n#### 📅 Prakiraan Harian 5 Hari ke Depan\n| Tanggal | Kondisi | Suhu Min–Maks | Peluang & Curah Hujan | Terbit–Terbenam |\n| :--- | :--- | :--- | :--- | :--- |\n${dailyRows}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    answeredById: 'hyperlocal-openmeteo-bmkg',
    answeredByName: `Hyper-Local Weather · ${geo.geocoderSource} + Open-Meteo DEM`,
    usedFallback: false,
  };
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
  const { toolId, arg, subOption, count } = command;

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
        // Mirror 2: Izuka Spotify Search
        onStatus?.({
          toolName: 'Spotify Downloader',
          mirrorName: 'Izuka Spotify Search',
          attempt: 2,
          isFallback: true,
        });
        const izukaSearch = await fetchToolEndpoint(
          `https://my.izuka-api.xyz/api/search/spotify-search?query=${encodeURIComponent(arg)}`,
          20000,
          signal
        );
        const izukaJson = safeParseJson(izukaSearch.body);
        const izukaList = Array.isArray(izukaJson?.data)
          ? (izukaJson.data as Array<Record<string, unknown>>)
          : Array.isArray(izukaJson?.result)
            ? (izukaJson.result as Array<Record<string, unknown>>)
            : [];
        const izukaHit = izukaList.find(
          (item) => typeof item.url === 'string' && item.url.includes('spotify.com')
        );
        if (izukaHit && typeof izukaHit.url === 'string') {
          trackUrl = izukaHit.url;
        } else {
          throw new Error(
            `Lagu Spotify untuk kata kunci "${arg}" tidak ditemukan. Coba tempel tautan track Spotify langsung.`
          );
        }
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
        downloadItems: [{ label: 'Unduh Stiker Brat', url: pngUrl, kind: 'image' }],
      };
    }

    // Fallback 3: SiputZX Animated Brat GIF
    onStatus?.({
      toolName: 'Brat Animated Maker',
      mirrorName: 'SiputZX Brat GIF',
      attempt: 3,
      isFallback: true,
    });
    const gifUrl3 = `https://brat.siputzx.my.id/gif?text=${encodeURIComponent(arg)}`;
    const r3 = await fetchToolEndpoint(gifUrl3, 22000, signal);
    if (r3.ok && r3.imageUrl) {
      return {
        content: `### 🟩 Animasi Brat GIF Selesai: *"${arg}"*`,
        answeredById: 'siput-bratgif',
        answeredByName: 'Brat GIF · SiputZX',
        usedFallback: true,
        imageUrl: r3.imageUrl,
        downloadItems: [{ label: 'Unduh Animasi GIF', url: gifUrl3, kind: 'image' }],
      };
    }

    // Fallback 4: Shinana Brat Animated
    onStatus?.({
      toolName: 'Brat Animated Maker',
      mirrorName: 'Shinana Brat HF',
      attempt: 4,
      isFallback: true,
    });
    const gifUrl4 = `https://shinana-brat.hf.space/brat-animated?text=${encodeURIComponent(arg)}`;
    const r4 = await fetchToolEndpoint(gifUrl4, 24000, signal);
    if (r4.ok && r4.imageUrl) {
      return {
        content: `### 🟩 Animasi Brat Selesai: *"${arg}"*`,
        answeredById: 'shinana-brat',
        answeredByName: 'Brat Animated · Shinana',
        usedFallback: true,
        imageUrl: r4.imageUrl,
        downloadItems: [{ label: 'Unduh Animasi Brat', url: gifUrl4, kind: 'image' }],
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

  // === 14. PINTEREST HD VISUAL SEARCH (CONFIGURABLE COUNT ,1 .. ,30) ===
  if (toolId === 'pinterest') {
    const requestedCount = Math.min(Math.max(count || 8, 1), 30);

    if (!arg || /^(help|cara|panduan|info|command|\?)$/i.test(arg.trim())) {
      return {
        content: [
          `### 📌 Pemberitahuan Command & Cara Pakai \`/pinterest\``,
          `Gunakan perintah **\`/pinterest\`** *(atau alias **\`/pin\`**)* untuk mencari referensi gambar HD dengan jumlah tampilan yang bebas Anda atur (**1 s/d 30 gambar**).`,
          ``,
          `- **Format Perintah:** \`/pinterest <kata kunci> ,<jumlah>\``,
          `- **Jumlah Default:** \`8\` gambar *(jika tanpa \`,jumlah\`)* · **Maksimal:** \`30\` gambar`,
          ``,
          `**Contoh Pemakaian Langsung:**`,
          `- \`/pinterest alya kujou ,10\` *(tampilkan 10 pin HD Alya Kujou)*`,
          `- \`/pinterest cyberpunk anime wallpaper ,16\` *(tampilkan 16 wallpaper HD)*`,
          `- \`/pin minimalist mobile ui design ,12\` *(tampilkan 12 referensi desain UI)*`,
        ].join('\n'),
        answeredById: 'pinterest-guide',
        answeredByName: 'Panduan Command · Pinterest HD',
        usedFallback: false,
      };
    }

    const pinUsageTip = `\n\n> 💡 **Cara Atur Jumlah Pin:** Tambahkan \`,jumlah\` *(1–30)* di akhir perintah — contoh: \`/pinterest ${arg} ,10\` atau \`/pinterest ${arg} ,20\`. Klik tombol **Unduh** pada tiap kartu untuk menyimpan gambar langsung.`;

    // Helper to fetch BintangAPI (up to 49 Original HD pins)
    const fetchBintangPins = async (): Promise<string[]> => {
      const rB = await fetchToolEndpoint(
        `https://bintangapi.my.id/api/search/pinterest?q=${encodeURIComponent(arg)}`,
        24000,
        signal
      );
      const jB = safeParseJson(rB.body);
      if (rB.ok && Array.isArray(jB?.data)) {
        return (jB.data as Array<Record<string, unknown>>)
          .map((rec) => String(rec.image || rec.thumbnail || ''))
          .filter((u) => /^https?:\/\//i.test(u));
      }
      return [];
    };

    // If user asks for > 20 images (e.g. ,25 or ,30), BintangAPI serves up to 49 HD pins in 1 call!
    if (requestedCount > 20) {
      onStatus?.({
        toolName: `Pinterest HD (${requestedCount} Pin)`,
        mirrorName: 'Bintang Pinterest HD (49-Pin Feed)',
        attempt: 1,
        isFallback: false,
      });
      const bintangUrls = await fetchBintangPins();
      if (bintangUrls.length > 0) {
        const finalLarge = Array.from(new Set(bintangUrls)).slice(0, requestedCount);
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${finalLarge.length} Pin HD)${pinUsageTip}`,
          answeredById: 'bintang-pinterest',
          answeredByName: 'Pinterest HD · BintangAPI',
          usedFallback: false,
          galleryUrls: finalLarge,
          galleryDownloadUrls: finalLarge,
        };
      }
    }

    onStatus?.({
      toolName: `Pinterest HD (${requestedCount} Pin)`,
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
      let urls = (j1.result as unknown[])
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const rec = item as Record<string, unknown>;
            return String(rec.image || rec.url || rec.images_url || '');
          }
          return '';
        })
        .filter((u) => /^https?:\/\//i.test(u));

      // Top up from BintangAPI if Snow returned fewer pins than requestedCount
      if (urls.length > 0 && urls.length < requestedCount) {
        const extraUrls = await fetchBintangPins();
        urls = Array.from(new Set([...urls, ...extraUrls]));
      }

      const sliced1 = Array.from(new Set(urls)).slice(0, requestedCount);
      if (sliced1.length > 0) {
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${sliced1.length} Pin HD)${pinUsageTip}`,
          answeredById: 'snow-pinterest',
          answeredByName: 'Pinterest HD · Snow API',
          usedFallback: false,
          galleryUrls: sliced1,
          galleryDownloadUrls: sliced1,
        };
      }
    }

    // Fallback 2: BintangAPI Pinterest HD (49 Original HD Pins)
    onStatus?.({
      toolName: `Pinterest HD (${requestedCount} Pin)`,
      mirrorName: 'Bintang Pinterest HD',
      attempt: 2,
      isFallback: true,
    });
    const urls3 = (await fetchBintangPins()).slice(0, requestedCount);
    if (urls3.length > 0) {
      return {
        content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${urls3.length} Pin HD · BintangAPI)${pinUsageTip}`,
        answeredById: 'bintang-pinterest',
        answeredByName: 'Pinterest HD · BintangAPI',
        usedFallback: true,
        galleryUrls: urls3,
        galleryDownloadUrls: urls3,
      };
    }

    // Fallback 3: Stenly Pinterest
    onStatus?.({
      toolName: 'Pinterest HD Search',
      mirrorName: 'Stenly Pinterest',
      attempt: 3,
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
      .slice(0, requestedCount);

    if (urls2.length > 0) {
      return {
        content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${urls2.length} Pin · Stenly)${pinUsageTip}`,
        answeredById: 'stenly-pinterest',
        answeredByName: 'Pinterest · Stenly',
        usedFallback: true,
        galleryUrls: urls2,
        galleryDownloadUrls: urls2,
      };
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
        .slice(0, requestedCount);
      if (urls4.length > 0) {
        return {
          content: `### 📌 Galeri Visual Pinterest — *"${arg}"* (${urls4.length} Pin · Varhad v2)${pinUsageTip}`,
          answeredById: 'varhad-pinterest',
          answeredByName: 'Pinterest · Varhad v2',
          usedFallback: true,
          galleryUrls: urls4,
          galleryDownloadUrls: urls4,
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

  // === 16. BERITA NASIONAL MULTI-PORTAL (CNN, KOMPAS, CNBC, ANTARA) ===
  if (toolId === 'berita') {
    const portalChoice = (subOption || 'all').toLowerCase();
    const filterKeyword = arg.trim().toLowerCase();

    const portalDefs: Record<
      string,
      Array<{ id: string; portalLabel: string; name: string; url: string }>
    > = {
      cnn: [
        {
          id: 'siput-cnn',
          portalLabel: 'CNN Indonesia',
          name: 'CNN Indonesia · SiputZX',
          url: 'https://api.siputzx.my.id/api/berita/cnn',
        },
      ],
      kompas: [
        {
          id: 'siput-kompas',
          portalLabel: 'Kompas.com',
          name: 'Kompas.com · SiputZX',
          url: 'https://api.siputzx.my.id/api/berita/kompas',
        },
      ],
      cnbc: [
        {
          id: 'siput-cnbc',
          portalLabel: 'CNBC Indonesia',
          name: 'CNBC Indonesia · SiputZX',
          url: 'https://api.siputzx.my.id/api/berita/cnbcindonesia',
        },
      ],
      antara: [
        {
          id: 'bintang-antara',
          portalLabel: 'Antara News',
          name: 'Antara News · BintangAPI',
          url: 'https://bintangapi.my.id/api/info/berita/antara',
        },
        {
          id: 'synox-antara',
          portalLabel: 'Antara News',
          name: 'Antara News · Synox Cloud',
          url: 'https://api.synoxcloud.xyz/berita/antara?apikey=FREE',
        },
        {
          id: 'nexray-antara',
          portalLabel: 'Antara News',
          name: 'Antara News · Nexray',
          url: 'https://api.nexray.eu.cc/berita/antara',
        },
      ],
    };

    const mirrors =
      portalChoice === 'cnn'
        ? [...portalDefs.cnn, ...portalDefs.kompas, ...portalDefs.antara]
        : portalChoice === 'kompas'
          ? [...portalDefs.kompas, ...portalDefs.cnn, ...portalDefs.antara]
          : portalChoice === 'cnbc'
            ? [...portalDefs.cnbc, ...portalDefs.cnn, ...portalDefs.antara]
            : portalChoice === 'antara'
              ? [...portalDefs.antara, ...portalDefs.cnn]
              : [
                  ...portalDefs.cnn,
                  ...portalDefs.kompas,
                  ...portalDefs.cnbc,
                  ...portalDefs.antara,
                ];

    if (portalChoice === 'all') {
      onStatus?.({
        toolName: 'Berita Nasional Multi-Portal',
        mirrorName: 'CNN · Kompas · CNBC · Antara',
        attempt: 1,
        isFallback: false,
      });
      const multiSettled = await Promise.allSettled([
        fetchToolEndpoint('https://api.siputzx.my.id/api/berita/cnn', 16000, signal),
        fetchToolEndpoint('https://api.siputzx.my.id/api/berita/kompas', 16000, signal),
        fetchToolEndpoint('https://bintangapi.my.id/api/info/berita/antara', 16000, signal),
      ]);
      const portalNames = ['CNN Indonesia', 'Kompas', 'Antara'];
      const mergedArticles: Array<{
        portal: string;
        title: string;
        link: string;
        desc: string;
        date: string;
        thumb?: string;
      }> = [];

      multiSettled.forEach((st, pIdx) => {
        if (st.status !== 'fulfilled' || !st.value.ok) return;
        const j = safeParseJson(st.value.body);
        const list = Array.isArray(j?.data)
          ? j.data
          : Array.isArray(j?.result)
            ? j.result
            : [];
        for (const raw of (list as Array<Record<string, unknown>>).slice(0, 5)) {
          const title = String(raw.title || raw.judul || '').trim();
          if (!title) continue;
          const link = String(raw.link || raw.url || '').trim();
          const desc = String(raw.description || raw.deskripsi || raw.category || '')
            .replace(/<[^>]+>/g, '')
            .trim();
          const date = String(raw.pubDate || raw.tanggal || raw.date || raw.time || '').trim();
          const thumbRaw = String(
            raw.image_full || raw.image_thumbnail || raw.thumbnail || raw.image || ''
          ).trim();
          mergedArticles.push({
            portal: portalNames[pIdx],
            title,
            link,
            desc,
            date,
            thumb: thumbRaw.startsWith('http') ? thumbRaw : undefined,
          });
        }
      });

      if (mergedArticles.length > 0) {
        const filtered = filterKeyword
          ? mergedArticles.filter((a) =>
              `${a.title} ${a.desc}`.toLowerCase().includes(filterKeyword)
            )
          : mergedArticles;
        const chosen = (filtered.length > 0 ? filtered : mergedArticles).slice(0, 9);
        const topThumb = chosen.find((c) => c.thumb)?.thumb;
        const formatted = chosen
          .map(
            (a, idx) =>
              `${idx + 1}. **[${a.portal}] ${a.title}**${a.date ? ` *(${a.date})*` : ''}${a.desc ? `\n   ${a.desc.slice(0, 180)}${a.desc.length > 180 ? '...' : ''}` : ''}${a.link ? `\n   🔗 [Baca Selengkapnya](${a.link})` : ''}`
          )
          .join('\n\n');
        return {
          content: `### 📰 Berita Utama Nasional Terkini (CNN · Kompas · Antara)${filterKeyword && filtered.length > 0 ? ` — Topik *"${arg}"*` : ''}\n\n${formatted}`,
          answeredById: 'multi-berita-id',
          answeredByName: 'CNN · Kompas · Antara Live',
          usedFallback: false,
          imageUrl: topThumb,
        };
      }
    }

    for (let i = 0; i < mirrors.length; i++) {
      const m = mirrors[i];
      onStatus?.({
        toolName: `Berita ${m.portalLabel}`,
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
              `${String(a.title || a.judul || '')} ${String(a.description || a.deskripsi || a.category || '')}`
                .toLowerCase()
                .includes(filterKeyword)
            )
          : articles;

        const chosen = (filtered.length > 0 ? filtered : articles).slice(0, 8);
        const rawTopThumb = String(
          chosen[0]?.image_full ||
            chosen[0]?.image_thumbnail ||
            chosen[0]?.thumbnail ||
            chosen[0]?.image ||
            ''
        ).trim();
        const topThumb = rawTopThumb.startsWith('http') ? rawTopThumb : undefined;

        const formatted = chosen
          .map((a, idx) => {
            const title = String(a.title || a.judul || 'Berita Terkini').trim();
            const link = String(a.link || a.url || '').trim();
            const desc = String(a.description || a.deskripsi || a.category || '')
              .replace(/<[^>]+>/g, '')
              .trim();
            const date = String(a.pubDate || a.tanggal || a.date || a.time || '').trim();
            return `${idx + 1}. **${title}**${date ? ` *(${date})*` : ''}${desc ? `\n   ${desc.slice(0, 200)}${desc.length > 200 ? '...' : ''}` : ''}${link ? `\n   🔗 [Baca Berita Lengkap](${link})` : ''}`;
          })
          .join('\n\n');

        return {
          content: `### 📰 Berita Terkini ${m.portalLabel}${filterKeyword && filtered.length > 0 ? ` — Topik *"${arg}"*` : ''}\n\n${formatted}`,
          answeredById: m.id,
          answeredByName: m.name,
          usedFallback: i > 0,
          imageUrl: topThumb,
        };
      }
    }

    throw new Error('Gagal memuat daftar berita nasional terkini.');
  }

  // === 17. CUACA HIPER-LOKAL AKURAT (DESA / KECAMATAN / KOTA / GPS / ADM4 BMKG) ===
  if (toolId === 'cuaca') {
    const city = (arg || 'Jakarta').trim();
    const hyperLocalRes = await executeAccurateWeatherLookup(city, signal, onStatus);
    if (hyperLocalRes) {
      return hyperLocalRes;
    }

    // Last-resort fallback: wttr.in Global Weather
    onStatus?.({
      toolName: 'Cuaca Hiper-Lokal',
      mirrorName: 'wttr.in Global Weather (Cadangan)',
      attempt: 2,
      isFallback: true,
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
        usedFallback: true,
      };
    }

    throw new Error(
      `Lokasi "${city}" tidak ditemukan. Coba ketik nama desa + kecamatan/kota (mis. "Cibiru Bandung", "Dieng Wonosobo") atau gunakan tombol Lokasi GPS.`
    );
  }

  // === 18. JADWAL SHOLAT RESMI KEMENAG RI ===
  if (toolId === 'sholat') {
    let cityKeyword = (arg || 'Jakarta').trim();
    onStatus?.({
      toolName: 'Jadwal Sholat Kemenag',
      mirrorName: 'MyQuran Kemenag API',
      attempt: 1,
      isFallback: false,
    });

    // If user passed GPS coordinates or subdistrict/desa not directly in Kemenag's kab/kota table, resolve Kabupaten/Kota via Nominatim
    if (/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/.test(cityKeyword)) {
      const resolvedGeo = await resolveHyperLocalGeoPoint(cityKeyword, signal);
      if (resolvedGeo?.kabupaten) {
        cityKeyword = resolvedGeo.kabupaten
          .replace(/^(?:Kota|Kabupaten|Kab\.)\s+/i, '')
          .trim();
      }
    }

    let kotaId = '1301'; // Default: Kota Jakarta
    let lokasiLabel = 'KOTA JAKARTA';

    if (cityKeyword.toLowerCase() !== 'jakarta') {
      let kotaList: Array<Record<string, unknown>> = [];
      const searchRes = await fetchToolEndpoint(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cityKeyword)}`,
        16000,
        signal
      );
      const searchJson = safeParseJson(searchRes.body);
      if (Array.isArray(searchJson?.data)) {
        kotaList = searchJson.data as Array<Record<string, unknown>>;
      }

      // If user typed a village/kecamatan (e.g. "Cibiru" or "Dieng"), resolve parent Kabupaten/Kota via Nominatim!
      if (kotaList.length === 0) {
        const geoParent = await resolveHyperLocalGeoPoint(cityKeyword, signal);
        const parentKab = (geoParent?.kabupaten || '')
          .replace(/^(?:Kota|Kabupaten|Kab\.)\s+/i, '')
          .trim();
        if (parentKab) {
          const retryRes = await fetchToolEndpoint(
            `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(parentKab)}`,
            15000,
            signal
          );
          const retryJson = safeParseJson(retryRes.body);
          if (Array.isArray(retryJson?.data)) {
            kotaList = retryJson.data as Array<Record<string, unknown>>;
          }
        }
      }

      if (kotaList.length === 0) {
        throw new Error(
          `Kota/kabupaten "${cityKeyword}" tidak ditemukan pada database Kemenag RI. Coba nama kota/kabupaten seperti Bandung, Wonosobo, Surabaya, Medan, atau klik tombol GPS.`
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

  // === 24. SOUNDCLOUD SEARCH & MP3 DOWNLOADER ===
  if (toolId === 'soundcloud') {
    if (!arg) {
      throw new Error(
        'Masukkan judul lagu atau nama musisi SoundCloud. Contoh: `/soundcloud Hindia Evaluasi`'
      );
    }
    onStatus?.({
      toolName: 'SoundCloud MP3',
      mirrorName: 'Neosoft SoundCloud Play',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.neosoft.best/api/downloader/soundcloud-play?q=${encodeURIComponent(arg)}`,
      30000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const meta1 = (j1?.metadata || j1?.result || j1?.data || {}) as Record<string, unknown>;
    const audio1 = String(
      j1?.audioUrl || j1?.downloadUrl || meta1.audioUrl || meta1.download || meta1.url || ''
    ).trim();

    if (r1.ok && audio1.startsWith('http')) {
      const title = String(meta1.title || arg).trim();
      const artist = String(meta1.author || meta1.artist || meta1.username || '').trim();
      const dur = meta1.duration ? ` · **Durasi:** ${String(meta1.duration)}` : '';
      const thumbRaw = String(meta1.thumbnail || meta1.image || '').trim();
      const srcLink = String(meta1.url || meta1.permalink_url || '').trim();
      return {
        content: [
          `### 🎧 SoundCloud MP3 Siap Diputar & Diunduh`,
          `**Judul:** ${title}${artist ? `\n**Artis:** ${artist}` : ''}${dur}`,
          srcLink.startsWith('http') ? `🔗 [Buka di SoundCloud](${srcLink})` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        answeredById: 'neosoft-soundcloud',
        answeredByName: 'SoundCloud MP3 · Neosoft',
        usedFallback: false,
        imageUrl: thumbRaw.startsWith('http') ? thumbRaw : undefined,
        audioUrl: audio1,
        audioTitle: artist ? `${artist} — ${title}` : title,
        downloadItems: [
          {
            label: 'Unduh Audio SoundCloud (MP3)',
            url: audio1,
            kind: 'audio',
          },
        ],
      };
    }

    throw new Error(
      `Lagu SoundCloud untuk "${arg}" belum dapat dimuat saat ini. Coba kata kunci judul + musisi lain.`
    );
  }

  // === 25. MEDIAFIRE & TERABOX CLOUD FILE DOWNLOADER ===
  if (toolId === 'cloudfile') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Tempel tautan berkas publik MediaFire atau Terabox. Contoh: `/cloudfile https://www.mediafire.com/file/...`'
      );
    }
    const isTerabox = /terabox|1024tera|mirrobox|nephobox|4funbox|momerybox|tibibox/i.test(
      arg
    );

    onStatus?.({
      toolName: isTerabox ? 'Terabox Downloader' : 'MediaFire Downloader',
      mirrorName: `Neosoft ${isTerabox ? 'Terabox' : 'MediaFire'}`,
      attempt: 1,
      isFallback: false,
    });
    const endpoint = isTerabox
      ? `https://api.neosoft.best/api/downloader/terabox?url=${encodeURIComponent(arg)}`
      : `https://api.neosoft.best/api/downloader/mediafire?url=${encodeURIComponent(arg)}`;

    const r1 = await fetchToolEndpoint(endpoint, 32000, signal);
    const j1 = safeParseJson(r1.body);
    const data1 = (j1?.data || j1?.result || j1 || {}) as Record<string, unknown>;
    const list1 = Array.isArray(data1.list)
      ? (data1.list as Array<Record<string, unknown>>)
      : Array.isArray(j1?.files)
        ? (j1.files as Array<Record<string, unknown>>)
        : [];
    const primaryObj = list1[0] || data1;
    const dlUrl = String(
      primaryObj.downloadUrl ||
        primaryObj.download_url ||
        primaryObj.download ||
        primaryObj.dlink ||
        primaryObj.direct_link ||
        primaryObj.url ||
        ''
    ).trim();

    if (r1.ok && dlUrl.startsWith('http') && dlUrl !== arg) {
      const fileName = String(
        primaryObj.filename ||
          primaryObj.fileName ||
          primaryObj.server_filename ||
          primaryObj.name ||
          primaryObj.title ||
          'Berkas Cloud'
      ).trim();
      const fileSize = String(
        primaryObj.filesize || primaryObj.size || primaryObj.sizeH || '-'
      ).trim();
      const mime = String(primaryObj.filetype || primaryObj.mime || '').trim();

      return {
        content: [
          `### 📦 Berkas ${isTerabox ? 'Terabox' : 'MediaFire'} Siap Diunduh`,
          `| Informasi Berkas | Detail |`,
          `| :--- | :--- |`,
          `| **Nama Berkas** | \`${fileName}\` |`,
          `| **Ukuran** | **${fileSize}** |`,
          mime ? `| **Tipe Berkas** | ${mime} |` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        answeredById: isTerabox ? 'neosoft-terabox' : 'neosoft-mediafire',
        answeredByName: `${isTerabox ? 'Terabox' : 'MediaFire'} DL · Neosoft`,
        usedFallback: false,
        downloadItems: [
          {
            label: `Unduh ${fileName.slice(0, 28)}`,
            url: dlUrl,
            kind: 'file',
          },
        ],
      };
    }

    throw new Error(
      `Gagal mengekstrak tautan langsung dari ${isTerabox ? 'Terabox' : 'MediaFire'}. Pastikan berkas bersifat publik dan tidak dikunci kata sandi.`
    );
  }

  // === 26. PIXIV ARTWORK HD SEARCH & DOWNLOADER ===
  if (toolId === 'pixiv') {
    if (!arg) {
      throw new Error(
        'Masukkan kata kunci karakter/ilustrasi atau ID karya Pixiv. Contoh: `/pixiv Raiden Shogun`'
      );
    }

    const illustIdMatch =
      arg.match(/pixiv\.net\/(?:en\/)?artworks\/(\d+)/i) ||
      arg.match(/^(\d{6,12})$/);

    const wrapPximg = (u: string, nameTag: string): string => {
      const clean = u.trim();
      if (!clean.startsWith('http')) return '';
      if (/pximg\.net/i.test(clean)) {
        return `/api/download?url=${encodeURIComponent(clean)}&filename=${encodeURIComponent(nameTag)}.jpg`;
      }
      return clean;
    };

    if (illustIdMatch) {
      const pid = illustIdMatch[1];
      onStatus?.({
        toolName: 'Pixiv HD Downloader',
        mirrorName: 'Neosoft Pixiv Artwork',
        attempt: 1,
        isFallback: false,
      });
      const rId = await fetchToolEndpoint(
        `https://api.neosoft.best/api/pixiv/download?id=${encodeURIComponent(pid)}`,
        24000,
        signal
      );
      const jId = safeParseJson(rId.body);
      const dId = (jId?.data || jId?.result || jId || {}) as Record<string, unknown>;
      const rawUrls: string[] = Array.isArray(dId.images)
        ? (dId.images as unknown[]).map((x) =>
            typeof x === 'string'
              ? x
              : String((x as Record<string, unknown>)?.original || (x as Record<string, unknown>)?.url || '')
          )
        : [String(dId.original || dId.image || dId.url || '')];
      const validRaw = rawUrls.filter((u) => u.startsWith('http'));

      if (rId.ok && validRaw.length > 0) {
        const title = String(dId.title || `Pixiv #${pid}`);
        const author = String(dId.author || dId.artist || '-');
        const gallery = validRaw
          .slice(0, 8)
          .map((u, idx) => wrapPximg(u, `pixiv-${pid}-${idx + 1}`));
        return {
          content: `### 🎨 Karya Pixiv HD — ${title}\n**Ilustrator:** ${author} · **ID:** \`${pid}\``,
          answeredById: 'neosoft-pixiv-dl',
          answeredByName: 'Pixiv HD · Neosoft',
          usedFallback: false,
          imageUrl: gallery.length === 1 ? gallery[0] : undefined,
          galleryUrls: gallery.length > 1 ? gallery : undefined,
          downloadItems: validRaw.slice(0, 4).map((u, idx) => ({
            label:
              validRaw.length > 1
                ? `Unduh Ilustrasi HD #${idx + 1}`
                : 'Unduh Ilustrasi HD',
            url: u,
            kind: 'image' as const,
          })),
        };
      }
    }

    onStatus?.({
      toolName: 'Pixiv HD Search',
      mirrorName: 'Neosoft Pixiv Search',
      attempt: 1,
      isFallback: false,
    });
    const rSearch = await fetchToolEndpoint(
      `https://api.neosoft.best/api/pixiv/search?q=${encodeURIComponent(arg)}`,
      24000,
      signal
    );
    const jSearch = safeParseJson(rSearch.body);
    const arr = Array.isArray(jSearch?.results)
      ? jSearch.results
      : Array.isArray(jSearch?.data)
        ? jSearch.data
        : Array.isArray(jSearch?.result)
          ? jSearch.result
          : [];

    if (rSearch.ok && arr.length > 0) {
      const items = (arr as Array<Record<string, unknown>>).slice(0, 10);
      const rawImgs: Array<{ raw: string; proxied: string; title: string; id: string }> = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const raw = String(
          it.image || it.imageUrl || it.original || it.thumbnail || it.url || ''
        ).trim();
        if (!raw.startsWith('http')) continue;
        const pid = String(it.id || i + 1);
        rawImgs.push({
          raw,
          proxied: wrapPximg(raw, `pixiv-${pid}`),
          title: String(it.title || `Ilustrasi #${pid}`),
          id: pid,
        });
      }

      if (rawImgs.length > 0) {
        const listCaption = rawImgs
          .slice(0, 6)
          .map((x, idx) => `${idx + 1}. **${x.title}** *(ID: \`${x.id}\`)*`)
          .join('\n');
        return {
          content: `### 🎨 Galeri Ilustrasi Pixiv — *"${arg}"*\n\n${listCaption}`,
          answeredById: 'neosoft-pixiv-search',
          answeredByName: 'Pixiv Search · Neosoft',
          usedFallback: false,
          galleryUrls: rawImgs.map((x) => x.proxied),
          downloadItems: rawImgs.slice(0, 3).map((x, idx) => ({
            label: `Unduh HD #${idx + 1}`,
            url: x.raw,
            kind: 'image' as const,
          })),
        };
      }
    }

    throw new Error(`Ilustrasi Pixiv untuk "${arg}" tidak ditemukan.`);
  }

  // === 27. DUCKDUCKGO LIVE WEB SEARCH ===
  if (toolId === 'websearch') {
    if (!arg) {
      throw new Error(
        'Masukkan kata kunci pencarian web. Contoh: `/search perkembangan teknologi AI Indonesia`'
      );
    }

    onStatus?.({
      toolName: 'Pencarian Web Live',
      mirrorName: 'SiputZX DuckDuckGo',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api.siputzx.my.id/api/s/duckduckgo?query=${encodeURIComponent(arg)}`,
      20000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const list1 = Array.isArray(j1?.data)
      ? (j1.data as Array<Record<string, unknown>>)
      : Array.isArray(j1?.result)
        ? (j1.result as Array<Record<string, unknown>>)
        : [];

    if (r1.ok && list1.length > 0) {
      const formatted = list1
        .slice(0, 8)
        .map((item, idx) => {
          const title = String(item.title || 'Hasil Web').trim();
          const url = String(item.url || item.link || '').trim();
          const snippet = String(item.snippet || item.description || '')
            .replace(/<[^>]+>/g, '')
            .trim();
          return `${idx + 1}. **[${title}](${url})**${snippet ? `\n   ${snippet}` : ''}`;
        })
        .join('\n\n');

      return {
        content: `### 🌐 Hasil Pencarian Web DuckDuckGo — *"${arg}"*\n\n${formatted}`,
        answeredById: 'siput-ddg',
        answeredByName: 'DuckDuckGo Search · SiputZX',
        usedFallback: false,
      };
    }

    // Fallback: Faa WebPilot Live Search
    onStatus?.({
      toolName: 'Pencarian Web Live',
      mirrorName: 'Faa WebPilot Search',
      attempt: 2,
      isFallback: true,
    });
    const r2 = await fetchToolEndpoint(
      `https://api-faa.my.id/faa/webpilot?text=${encodeURIComponent(arg)}`,
      24000,
      signal
    );
    const j2 = safeParseJson(r2.body);
    if (r2.ok && typeof j2?.result === 'string' && j2.result.trim()) {
      const srcs = Array.isArray(j2.source)
        ? (j2.source as Array<Record<string, unknown>>)
            .slice(0, 6)
            .map((s) => `- [${String(s.title || s.link)}](${String(s.link || s.url)})`)
            .join('\n')
        : '';
      return {
        content: `### 🌐 Ringkasan & Referensi Web — *"${arg}"*\n\n${j2.result.trim()}${srcs ? `\n\n#### Sumber Web:\n${srcs}` : ''}`,
        answeredById: 'faa-webpilot-tool',
        answeredByName: 'WebPilot Search · Faa API',
        usedFallback: true,
      };
    }

    throw new Error(`Pencarian web untuk "${arg}" gagal dimuat.`);
  }

  // === 28. MULTI-LANGUAGE TRANSLATOR ===
  if (toolId === 'translate') {
    if (!arg) {
      throw new Error(
        'Masukkan teks yang ingin diterjemahkan. Contoh: `/translate id | Hello world, how are you today?`'
      );
    }
    const toLang = (subOption || 'id').trim();
    onStatus?.({
      toolName: 'Penerjemah Bahasa',
      mirrorName: `SiputZX Translate (→ ${toLang.toUpperCase()})`,
      attempt: 1,
      isFallback: false,
    });

    const r1 = await fetchToolEndpoint(
      `https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(arg)}&to=${encodeURIComponent(toLang)}`,
      18000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const d1 = (j1?.data || j1?.result || {}) as Record<string, unknown>;
    const translated = String(
      d1.text || d1.translatedText || d1.translation || (typeof j1?.result === 'string' ? j1.result : '')
    ).trim();

    if (r1.ok && translated) {
      const fromLang = String(d1.from || d1.source || 'auto').toUpperCase();
      return {
        content: [
          `### 🌍 Hasil Terjemahan (\`${fromLang}\` → \`${toLang.toUpperCase()}\`)`,
          `**Teks Asli:**\n> ${arg.replace(/\n/g, '\n> ')}`,
          ``,
          `**Hasil Terjemahan:**\n${translated}`,
        ].join('\n'),
        answeredById: 'siput-translate',
        answeredByName: 'Translator · SiputZX',
        usedFallback: false,
      };
    }

    throw new Error('Gagal menerjemahkan teks saat ini. Silakan coba beberapa saat lagi.');
  }

  // === 29. AI OCR IMAGE TEXT EXTRACTOR ===
  if (toolId === 'ocr') {
    if (!/^https?:\/\//i.test(arg)) {
      throw new Error(
        'Tempel tautan gambar publik atau gunakan tombol **Upload Foto dari Perangkat** pada menu Tools Studio (`/ocr`).'
      );
    }

    onStatus?.({
      toolName: 'OCR Baca Teks Gambar',
      mirrorName: 'Faa Vision OCR',
      attempt: 1,
      isFallback: false,
    });
    const r1 = await fetchToolEndpoint(
      `https://api-faa.my.id/faa/ocr?url=${encodeURIComponent(arg)}`,
      26000,
      signal
    );
    const j1 = safeParseJson(r1.body);
    const resObj = j1?.result as Record<string, unknown> | string | undefined;
    const extracted =
      typeof resObj === 'string'
        ? resObj.trim()
        : typeof resObj?.text === 'string'
          ? resObj.text.trim()
          : typeof j1?.text === 'string'
            ? j1.text.trim()
            : '';

    if (r1.ok && extracted) {
      return {
        content: `### 🔍 Hasil Ekstraksi Teks OCR\n\n\`\`\`text\n${extracted}\n\`\`\``,
        answeredById: 'faa-ocr',
        answeredByName: 'Vision OCR · Faa API',
        usedFallback: false,
        imageUrl: arg,
      };
    }

    throw new Error(
      'Tidak ditemukan teks yang terbaca pada gambar tersebut, atau gambar terlalu buram.'
    );
  }

  // === 30. MEME GENERATOR HD ===
  if (toolId === 'meme') {
    if (!arg) {
      throw new Error(
        'Masukkan teks meme dengan pemisah `|`. Contoh: `/meme drake | Pakai API Ribet | Pakai NodataGPT`'
      );
    }
    const tpl = (subOption || 'drake').toLowerCase();
    const parts = arg.split('|').map((s) => s.trim());
    const topText = parts[0] || ' ';
    const bottomText = parts.slice(1).join(' ') || ' ';

    onStatus?.({
      toolName: 'Meme Generator HD',
      mirrorName: `Memegen (${tpl.toUpperCase()})`,
      attempt: 1,
      isFallback: false,
    });

    const memeUrl = `https://api.memegen.link/images/${encodeURIComponent(tpl)}/${encodeMemegenSegment(topText)}/${encodeMemegenSegment(bottomText)}.png?width=1000`;
    const r1 = await fetchToolEndpoint(memeUrl, 20000, signal);
    const displayImg = r1.imageUrl || memeUrl;

    return {
      content: `### 😂 Meme HD Selesai Dibuat (*Template: ${tpl.toUpperCase()}*)`,
      answeredById: 'memegen-hd',
      answeredByName: 'Meme Maker HD · Memegen',
      usedFallback: false,
      imageUrl: displayImg,
      downloadItems: [
        {
          label: 'Unduh Meme PNG HD',
          url: memeUrl,
          kind: 'image',
        },
      ],
    };
  }

  // === 31. PUBLIC PROFILE & COUNTRY INFO (TIKTOK, GITHUB, NEGARA) ===
  if (toolId === 'stalker') {
    const mode = (subOption || 'tiktok').toLowerCase();
    const cleanTarget = arg.replace(/^@/, '').trim();
    if (!cleanTarget) {
      throw new Error(
        'Masukkan username atau nama negara. Contoh: `/stalk tiktok | tiktok`, `/ghstalk torvalds`, atau `/negara Indonesia`.'
      );
    }

    if (mode === 'country') {
      onStatus?.({
        toolName: 'Profil Negara Dunia',
        mirrorName: 'SiputZX Country Info',
        attempt: 1,
        isFallback: false,
      });
      const rc = await fetchToolEndpoint(
        `https://api.siputzx.my.id/api/tools/countryInfo?name=${encodeURIComponent(cleanTarget)}`,
        18000,
        signal
      );
      const jc = safeParseJson(rc.body);
      const dc = (jc?.data || jc?.result) as Record<string, unknown> | undefined;
      if (rc.ok && dc && dc.name) {
        const flagUrl = typeof dc.flag === 'string' && dc.flag.startsWith('http') ? dc.flag : undefined;
        const langs = Array.isArray(dc.languages)
          ? dc.languages.join(', ')
          : String(dc.languages || '-');
        const curr = Array.isArray(dc.currency)
          ? dc.currency.join(', ')
          : typeof dc.currency === 'object' && dc.currency
            ? JSON.stringify(dc.currency)
            : String(dc.currency || '-');
        const areaObj = dc.area as Record<string, unknown> | undefined;
        const areaStr = areaObj?.km2
          ? `${Number(areaObj.km2).toLocaleString('id-ID')} km²`
          : String(dc.area || '-');

        return {
          content: [
            `### 🌍 Profil Negara — ${String(dc.name)}`,
            `| Atribut Negara | Informasi Resmi |`,
            `| :--- | :--- |`,
            `| **Ibu Kota** | **${String(dc.capital || '-')}** |`,
            `| **Kawasan / Benua** | ${String(dc.continent ? (dc.continent as Record<string, unknown>).name || dc.continent : dc.region || '-')} |`,
            `| **Bentuk Pemerintahan** | ${String(dc.constitutionalForm || '-')} |`,
            `| **Bahasa Resmi** | ${langs} |`,
            `| **Mata Uang** | ${curr} |`,
            `| **Kode Telepon** | \`${String(dc.phoneCode || '-')}\` |`,
            `| **Luas Wilayah** | ${areaStr} |`,
            typeof dc.googleMaps === 'string' && dc.googleMaps.startsWith('http')
              ? `\n🗺️ [Lihat Peta Negara di Google Maps](${dc.googleMaps})`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
          answeredById: 'siput-country',
          answeredByName: 'Country Info · SiputZX',
          usedFallback: false,
          imageUrl: flagUrl,
        };
      }
      throw new Error(`Data negara "${cleanTarget}" tidak ditemukan.`);
    }

    if (mode === 'github') {
      onStatus?.({
        toolName: 'Profil Developer GitHub',
        mirrorName: 'SiputZX GitHub Stalker',
        attempt: 1,
        isFallback: false,
      });
      const rg = await fetchToolEndpoint(
        `https://api.siputzx.my.id/api/stalk/github?user=${encodeURIComponent(cleanTarget)}`,
        18000,
        signal
      );
      const jg = safeParseJson(rg.body);
      const dg = (jg?.data || jg?.result) as Record<string, unknown> | undefined;
      if (rg.ok && dg && (dg.username || dg.login)) {
        const uname = String(dg.username || dg.login);
        const nick = String(dg.nickname || dg.name || uname);
        const avatar = String(dg.profile_pic || dg.avatar || dg.avatar_url || '');
        const bio = String(dg.bio || '-');
        const repos = String(dg.public_repo ?? dg.public_repos ?? 0);
        const followers = Number(dg.followers ?? 0).toLocaleString('id-ID');
        const following = Number(dg.following ?? 0).toLocaleString('id-ID');
        const loc = String(dg.location || '-');
        const url = String(dg.url || dg.html_url || `https://github.com/${uname}`);

        return {
          content: [
            `### 💻 Profil GitHub — ${nick} (\`@${uname}\`)`,
            `| Statistik & Info | Detail |`,
            `| :--- | :--- |`,
            `| **Bio** | ${bio} |`,
            `| **Repositori Publik** | **${repos}** repo |`,
            `| **Followers / Following** | **${followers}** pengikut · **${following}** mengikuti |`,
            `| **Lokasi / Organisasi** | ${loc}${dg.company ? ` · ${String(dg.company)}` : ''} |`,
            `\n🔗 [Buka Profil GitHub @${uname}](${url})`,
          ].join('\n'),
          answeredById: 'siput-github',
          answeredByName: 'GitHub Profile · SiputZX',
          usedFallback: false,
          imageUrl: avatar.startsWith('http') ? avatar : undefined,
        };
      }
      throw new Error(`Akun GitHub "@${cleanTarget}" tidak ditemukan.`);
    }

    // Default: TikTok Profile
    onStatus?.({
      toolName: 'Profil Publik TikTok',
      mirrorName: 'Neosoft TikTok Stalker',
      attempt: 1,
      isFallback: false,
    });
    const rt = await fetchToolEndpoint(
      `https://api.neosoft.best/api/stalker/tiktok?username=${encodeURIComponent(cleanTarget)}`,
      22000,
      signal
    );
    const jt = safeParseJson(rt.body);
    const rootT = (jt?.data || jt?.result || jt || {}) as Record<string, unknown>;
    const userT = (rootT.user || rootT) as Record<string, unknown>;
    const statsT = (rootT.stats || userT.stats || {}) as Record<string, unknown>;

    if (rt.ok && (userT.uniqueId || userT.username || userT.nickname)) {
      const uid = String(userT.uniqueId || userT.username || cleanTarget);
      const nick = String(userT.nickname || userT.name || uid);
      const bio = String(userT.signature || userT.bio || '-');
      const avatar = String(
        userT.avatarLarger || userT.avatarMedium || userT.avatar || ''
      ).trim();
      const followers = Number(
        statsT.followerCount ?? userT.followers ?? 0
      ).toLocaleString('id-ID');
      const following = Number(
        statsT.followingCount ?? userT.following ?? 0
      ).toLocaleString('id-ID');
      const hearts = Number(
        statsT.heartCount ?? statsT.heart ?? userT.hearts ?? 0
      ).toLocaleString('id-ID');
      const videos = Number(
        statsT.videoCount ?? userT.videos ?? 0
      ).toLocaleString('id-ID');

      return {
        content: [
          `### 🎵 Profil Publik TikTok — ${nick} (\`@${uid}\`)${userT.verified ? ' ✅' : ''}`,
          `| Statistik Akun | Jumlah |`,
          `| :--- | :--- |`,
          `| **Pengikut (Followers)** | **${followers}** |`,
          `| **Total Suka (Likes)** | **${hearts}** |`,
          `| **Jumlah Video** | **${videos}** video · Mengikuti **${following}** |`,
          `| **Bio** | ${bio} |`,
          `\n🔗 [Buka TikTok @${uid}](https://www.tiktok.com/@${encodeURIComponent(uid)})`,
        ].join('\n'),
        answeredById: 'neosoft-tiktok-stalk',
        answeredByName: 'TikTok Profile · Neosoft',
        usedFallback: false,
        imageUrl: avatar.startsWith('http') ? avatar : undefined,
      };
    }

    throw new Error(`Akun TikTok "@${cleanTarget}" tidak ditemukan atau bersifat privat.`);
  }

  // === 32. KREASI VISUAL ACAK & WALLPAPER 4K STUDIO (100% KEYLESS + CONFIGURABLE COUNT ,1 .. ,30 + USAGE GUIDE) ===
  if (toolId === 'randomimg') {
    const mode = (subOption || 'random').toLowerCase();
    const customTheme = arg.trim();
    const requestedCount = Math.min(Math.max(count || 4, 1), 30);

    const randomImgCommandNotice = [
      `---`,
      `#### 📌 Pemberitahuan Command & Cara Pakai \`/randomimage\``,
      `- **Format Command:** \`/randomimage [mode / tema bebas] ,<jumlah 1–30>\` *(alias: \`/randomimg\`, \`/wallpaper\`, \`/wall\`)*`,
      `- **Pilihan Mode Cepat:** \`random\` · \`anime\` · \`cyberpunk\` · \`nature\` · \`space\` · \`city\` · \`minimal\` · \`portrait\` *(HP 9:16)* · \`mockup\` *(Unsplash)*`,
      `- **Contoh Siap Pakai:** \`/randomimage anime ,10\` · \`/randomimage cyberpunk ,8\` · \`/randomimage portrait | samurai neon ,6\` · \`/randomimage ,12\``,
      `- **Unduh Resolusi Asli 4K/HD:** Klik tombol **Unduh** langsung pada masing-masing kartu gambar **#1–#${requestedCount}** atau perbesar dulu di Lightbox.`,
    ].join('\n');

    if (/^(help|cara|panduan|info|command|\?)$/i.test(customTheme)) {
      return {
        content: [
          `### 📖 Panduan Lengkap Command & Cara Pakai \`/randomimage\``,
          `Fitur **Random Image & Wallpaper 4K Studio** berjalan **100% tanpa API key** dan mendukung pengaturan jumlah gambar **1 hingga 30 gambar** sekaligus.`,
          ``,
          `| Fungsi | Format Command | Contoh Penggunaan |`,
          `| :--- | :--- | :--- |`,
          `| **Acak Bebas 4K** | \`/randomimage ,<jumlah>\` | \`/randomimage ,10\` |`,
          `| **Mode Kategori** | \`/randomimage <mode> ,<jumlah>\` | \`/randomimage anime ,10\` |`,
          `| **Tema Kustom Bebas** | \`/randomimage <tema bebas> ,<jumlah>\` | \`/randomimage ocean sunset ,8\` |`,
          `| **Mode + Tema Spesifik** | \`/randomimage <mode> \\| <tema> ,<jumlah>\` | \`/randomimage portrait \\| alya kujou ,6\` |`,
          `| **Panduan Cepat** | \`/randomimage help\` | \`/randomimage cara\` |`,
          ``,
          `**Daftar Mode Resmi:** \`random\`, \`anime\`, \`cyberpunk\`, \`nature\`, \`space\`, \`city\`, \`minimal\`, \`portrait\` *(rasio 9:16 HP)*, \`mockup\` *(fotografi Unsplash HD)*.`,
        ].join('\n'),
        answeredById: 'randomimg-guide',
        answeredByName: 'Panduan Command · Random Image 4K',
        usedFallback: false,
      };
    }

    const modeLabels: Record<string, string> = {
      random: 'Acak Bebas 4K/HD',
      nature: 'Alam & Lanskap',
      cyberpunk: 'Cyberpunk & Sci-Fi',
      space: 'Galaksi & Luar Angkasa',
      city: 'Kota Malam & Arsitektur',
      anime: 'Anime & Ilustrasi HD',
      minimal: 'Minimalis & Abstract Desain',
      portrait: 'Wallpaper HP Portrait (9:16)',
      mockup: 'Fotografi Mockup Desain (Unsplash HD)',
    };
    const activeLabel = modeLabels[mode] || 'Kreasi Visual Acak';

    // Mode Mockup: Unsplash Picsum Curated High-Res Photography (Zero API Key, up to 30 items)
    if (mode === 'mockup' && !customTheme) {
      onStatus?.({
        toolName: `Random Image Studio (${requestedCount} Foto)`,
        mirrorName: 'Unsplash Picsum HD',
        attempt: 1,
        isFallback: false,
      });
      const randPage = Math.floor(Math.random() * 25) + 1;
      const rPic = await fetchToolEndpoint(
        `https://picsum.photos/v2/list?page=${randPage}&limit=30`,
        18000,
        signal
      );
      const picArr = parseSafeJsonAny(rPic.body);
      if (rPic.ok && Array.isArray(picArr) && picArr.length > 0) {
        const shuffled = [...(picArr as Array<Record<string, unknown>>)]
          .sort(() => Math.random() - 0.5)
          .slice(0, requestedCount);
        const previews = shuffled.map(
          (p) => `https://picsum.photos/id/${String(p.id)}/960/640`
        );
        const fullOriginals = shuffled.map((p, idx) =>
          String(p.download_url || previews[idx])
        );
        const rows = shuffled
          .slice(0, 12)
          .map(
            (p, idx) =>
              `| **#${idx + 1}** | **${String(p.author || 'Unsplash Photographer')}** | \`${String(p.width)}×${String(p.height)} px\` | [Sumber Unsplash](${String(p.url || '')}) |`
          )
          .join('\n');
        const extraRowNote =
          shuffled.length > 12
            ? `\n*...serta ${shuffled.length - 12} foto HD lainnya langsung tampil pada galeri di bawah.*`
            : '';
        return {
          content: [
            `### 📸 Kreasi Foto Mockup & Desain UI Acak — ${shuffled.length} Gambar *(Tanpa API Key)*`,
            `Menampilkan **${shuffled.length} foto resolusi tinggi bebas pakai** *(pratinjau hemat kuota + tombol Unduh Original pada tiap kartu)*:`,
            ``,
            `| Karya | Fotografer | Resolusi Asli | Referensi |`,
            `| :--- | :--- | :--- | :--- |`,
            rows + extraRowNote,
            ``,
            randomImgCommandNotice,
          ].join('\n'),
          answeredById: 'picsum-unsplash-hd',
          answeredByName: 'Random Mockup HD · Unsplash Picsum',
          usedFallback: false,
          galleryUrls: previews,
          galleryDownloadUrls: fullOriginals,
          downloadItems:
            shuffled.length <= 6
              ? shuffled.map((p, idx) => ({
                  label: `Unduh Original #${idx + 1} (${String(p.width)}×${String(p.height)})`,
                  url: fullOriginals[idx],
                  kind: 'image' as const,
                }))
              : undefined,
        };
      }
    }

    // Primary Engine: Wallhaven 4K Curated Random API (Supports custom keywords, categories, ratios, & HEX color palettes, 1..30 items!)
    onStatus?.({
      toolName: `Random Image 4K (${requestedCount} Gambar)`,
      mirrorName: `Wallhaven 4K (${activeLabel})`,
      attempt: 1,
      isFallback: false,
    });

    const presetQueryMap: Record<string, string> = {
      nature: 'nature landscape',
      cyberpunk: 'cyberpunk neon futuristic',
      space: 'space galaxy nebula cosmos',
      city: 'cityscape night architecture',
      minimal: 'minimalism abstract',
    };

    const isPortraitReq =
      mode === 'portrait' || /\b(?:portrait|9:16|hp|mobile|vertikal)\b/i.test(customTheme);
    const cleanedCustom = customTheme
      .replace(/\b(?:portrait|9:16|landscape|16:9)\b/gi, '')
      .trim();
    const effectiveQuery = cleanedCustom || presetQueryMap[mode] || '';
    const categoriesParam = mode === 'anime' && !cleanedCustom ? '010' : '110';
    const ratioParam = isPortraitReq ? '&ratios=portrait' : '&ratios=landscape';

    const buildWhUrl = (seedVal: string) =>
      `https://wallhaven.cc/api/v1/search?sorting=random&purity=100` +
      `&categories=${categoriesParam}${ratioParam}&seed=${seedVal}` +
      (effectiveQuery ? `&q=${encodeURIComponent(effectiveQuery)}` : '');

    const seed1 = Math.random().toString(36).slice(2, 8);
    const whRequests = [fetchToolEndpoint(buildWhUrl(seed1), 18000, signal)];
    if (requestedCount > 24) {
      const seed2 = Math.random().toString(36).slice(2, 8);
      whRequests.push(fetchToolEndpoint(buildWhUrl(seed2), 18000, signal));
    }

    const whResponses = await Promise.all(whRequests);
    const seenWhIds = new Set<string>();
    const whCombined: Array<Record<string, unknown>> = [];
    for (const rWh of whResponses) {
      const jWh = safeParseJson(rWh.body);
      if (rWh.ok && Array.isArray(jWh?.data)) {
        for (const item of jWh.data as Array<Record<string, unknown>>) {
          const itemId = String(item.id || item.path || Math.random());
          if (!seenWhIds.has(itemId)) {
            seenWhIds.add(itemId);
            whCombined.push(item);
          }
        }
      }
    }

    if (whCombined.length > 0) {
      const picked = whCombined.slice(0, requestedCount);
      const previewUrls: string[] = [];
      const fullDownloadUrls: string[] = [];
      const dlItems: MediaDownloadItem[] = [];
      const tableRows: string[] = [];

      picked.forEach((item, idx) => {
        const thumbs = (item.thumbs || {}) as Record<string, unknown>;
        const thumbUrl = String(
          thumbs.large || thumbs.original || item.path || ''
        ).trim();
        const fullUrl = String(item.path || thumbUrl).trim();
        if (!thumbUrl.startsWith('http')) return;

        const resStr = String(item.resolution || '-');
        const bytes = Number(item.file_size || 0);
        const sizeMb =
          bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : 'HD';
        const colors = Array.isArray(item.colors)
          ? (item.colors as string[])
              .slice(0, 5)
              .map((c) => `\`${c.toUpperCase()}\``)
              .join(' ')
          : '-';

        previewUrls.push(thumbUrl);
        fullDownloadUrls.push(fullUrl);
        if (picked.length <= 6) {
          dlItems.push({
            label: `Unduh HD/4K #${idx + 1} (${resStr} · ${sizeMb})`,
            url: fullUrl,
            kind: 'image',
          });
        }
        if (idx < 12) {
          tableRows.push(
            `| **#${idx + 1}** | **${resStr}** *(${sizeMb})* | ${colors} |`
          );
        }
      });

      if (previewUrls.length > 0) {
        const extraRowsInfo =
          previewUrls.length > 12
            ? [`*...serta ${previewUrls.length - 12} gambar HD/4K lainnya langsung ditampilkan pada galeri di bawah.*`]
            : [];
        return {
          content: [
            `### 🎨 Kreasi Visual Acak & Wallpaper 4K — ${activeLabel}${customTheme ? ` (*"${customTheme}"*)` : ''} (${previewUrls.length} Gambar)`,
            `Menampilkan **${previewUrls.length} visual acak berkualitas tinggi** tanpa API key *(pratinjau hemat kuota + palet warna HEX + tombol **Unduh 4K** pada tiap kartu)*:`,
            ``,
            `| Visual | Resolusi & Ukuran Asli | Ekstraksi Palet Warna Desain (HEX) |`,
            `| :--- | :--- | :--- |`,
            ...tableRows,
            ...extraRowsInfo,
            ``,
            randomImgCommandNotice,
          ].join('\n'),
          answeredById: 'wallhaven-random-4k',
          answeredByName: 'Random 4K Studio · Wallhaven',
          usedFallback: false,
          galleryUrls: previewUrls,
          galleryDownloadUrls: fullDownloadUrls,
          downloadItems: dlItems.length > 0 ? dlItems : undefined,
        };
      }
    }

    // Fallback 2 (Anime mode): Nekos.best High-Res Artist Illustrations (supports 1..30 via batching!)
    if (mode === 'anime') {
      onStatus?.({
        toolName: `Random Anime HD (${requestedCount} Gambar)`,
        mirrorName: 'Nekos.best Artist HD',
        attempt: 2,
        isFallback: true,
      });
      const batch1Count = Math.min(requestedCount, 20);
      const batch2Count = requestedCount > 20 ? requestedCount - 20 : 0;
      const nekoCalls = [
        fetchToolEndpoint(
          `https://nekos.best/api/v2/waifu?amount=${batch1Count}`,
          16000,
          signal
        ),
      ];
      if (batch2Count > 0) {
        nekoCalls.push(
          fetchToolEndpoint(
            `https://nekos.best/api/v2/neko?amount=${batch2Count}`,
            16000,
            signal
          )
        );
      }
      const nekoResponses = await Promise.all(nekoCalls);
      const nekoList: Array<Record<string, unknown>> = [];
      for (const rNeko of nekoResponses) {
        const jNeko = safeParseJson(rNeko.body);
        if (rNeko.ok && Array.isArray(jNeko?.results)) {
          nekoList.push(...(jNeko.results as Array<Record<string, unknown>>));
        }
      }

      const slicedNeko = nekoList.slice(0, requestedCount);
      const urls = slicedNeko
        .map((x) => String(x.url || '').trim())
        .filter((u) => u.startsWith('http'));

      if (urls.length > 0) {
        const credits = slicedNeko
          .slice(0, 12)
          .map(
            (x, idx) =>
              `${idx + 1}. Ilustrator: **[${String(x.artist_name || 'Artist')}](${String(x.source_url || x.artist_href || '#')})**`
          )
          .join('\n');
        return {
          content: [
            `### 🎨 Kreasi Ilustrasi Anime Acak HD (${urls.length} Gambar)`,
            credits,
            ``,
            randomImgCommandNotice,
          ].join('\n'),
          answeredById: 'nekos-best-hd',
          answeredByName: 'Anime HD · Nekos.best',
          usedFallback: true,
          galleryUrls: urls,
          galleryDownloadUrls: urls,
          downloadItems:
            urls.length <= 6
              ? urls.map((u, idx) => ({
                  label: `Unduh Ilustrasi HD #${idx + 1}`,
                  url: u,
                  kind: 'image' as const,
                }))
              : undefined,
        };
      }
    }

    // Fallback 3: Pollinations AI Instant Creative Render (100% Keyless, Custom Prompt Capable!)
    onStatus?.({
      toolName: 'Random Creative AI',
      mirrorName: 'Pollinations Flux Creative',
      attempt: 3,
      isFallback: true,
    });
    const creativePrompt =
      customTheme ||
      `${presetQueryMap[mode] || 'breathtaking cinematic masterpiece photography'}, ultra detailed 8k lighting`;
    const pSeed = Math.floor(Math.random() * 900000) + 100000;
    const w = isPortraitReq ? 720 : 1280;
    const h = isPortraitReq ? 1280 : 720;
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(creativePrompt)}?width=${w}&height=${h}&nologo=true&seed=${pSeed}`;
    const rPoll = await fetchToolEndpoint(pollUrl, 24000, signal);
    if (rPoll.ok && rPoll.imageUrl) {
      return {
        content: [
          `### ✨ Kreasi Visual AI Acak Selesai — *${activeLabel}*`,
          ``,
          randomImgCommandNotice,
        ].join('\n'),
        answeredById: 'pollinations-random-creative',
        answeredByName: 'Creative Random · Pollinations Flux',
        usedFallback: true,
        imageUrl: rPoll.imageUrl,
        downloadItems: [
          {
            label: `Unduh Gambar HD (${w}×${h})`,
            url: pollUrl,
            kind: 'image',
          },
        ],
      };
    }

    throw new Error('Gagal memuat gambar acak saat ini. Silakan coba klik Jalankan kembali.');
  }

  throw new Error(`Perintah tool "${toolId}" tidak dikenali.`);
}
