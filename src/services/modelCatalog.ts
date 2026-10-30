import type {
  AIModelDefinition,
  AppSettings,
  ImageModelCategory,
} from '../types/chat';
import {
  ROUTER_IMAGE_MODEL_ID,
  ROUTER_MODEL_PREFIX,
  ROUTER_PRESETS,
  ROUTER_PRIMARY_MODEL_ID,
  getRouterDisplayLabel,
  resolveRouterModelName,
} from './routerGateway';

export const AI_MODELS: AIModelDefinition[] = [
  {
    id: 'auto',
    name: 'Otomatis Pintar (Auto-Router)',
    shortName: 'Otomatis',
    provider: 'NodataGPT Smart Router',
    priority: 0,
    category: 'auto',
    description: 'Memilih model tercepat yang sehat dan otomatis beralih jika terjadi gangguan.',
    maxPromptChars: 8000,
    timeoutMs: 20000,
    accent: 'dual',
  },
  {
    id: ROUTER_PRIMARY_MODEL_ID,
    name: 'AI Router Gateway (9Router / OmniRoute)',
    shortName: 'AI Router',
    provider: '9Router · OmniRoute · OpenRouter',
    priority: 0,
    category: 'router',
    description:
      'Gunakan API Key & Base URL dari 9Router, OmniRoute (auto/coding, cc/claude-opus-4-7, dsb.), OpenRouter, atau gateway OpenAI-compatible kustom Anda.',
    maxPromptChars: 12000,
    timeoutMs: 42000,
    requiresKey: 'router',
    accent: 'dual',
  },
  // === 4 DIRECT UPSTREAM WEB SCRAPERS (GEMINI, CHATGPT, DEEPSEEK, QWEN.AI) ===
  {
    id: 'gemini',
    name: 'Gemini Flash (Direct Scraper)',
    shortName: 'Gemini Direct',
    provider: 'gemini.google.com + Mirror',
    priority: 1,
    category: 'scraper',
    description: 'Scraper langsung Google Gemini Web 102-slot StreamGenerate + auto-failover ke mirror aktif.',
    maxPromptChars: 8000,
    timeoutMs: 26000,
    accent: 'cyan',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (Direct Scraper)',
    shortName: 'ChatGPT Direct',
    provider: 'chatgpt.com + Synox Mirror',
    priority: 1,
    category: 'scraper',
    description: 'Scraper langsung chatgpt.com Sentinel PoW + Conduit SSE dengan failover ke Synox GPT-4o Mini.',
    maxPromptChars: 4500,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V3.2 (Direct Scraper)',
    shortName: 'DeepSeek Direct',
    provider: 'deepseek.com PoW + Mirror',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung chat.deepseek.com (DeepSeekHashV1 23-round Keccak PoW) + failover V3.2 Thinking.',
    maxPromptChars: 4500,
    timeoutMs: 25000,
    accent: 'orange',
  },
  {
    id: 'qwen-direct',
    name: 'Qwen 3.5 Plus (Direct Scraper)',
    shortName: 'Qwen Direct',
    provider: 'chat.qwen.ai + Synox Mirror',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung chat.qwen.ai v2 (ssxmod_itna + bx-ua + phase SSE) + failover Qwen3-Next 80B.',
    maxPromptChars: 5000,
    timeoutMs: 26000,
    accent: 'cyan',
  },

  // === SNOW API VERIFIED MODELS (api.snowping.cfd — Keyless + Auto-Fallback) ===
  {
    id: 'snow-gpt54-mini',
    name: 'GPT-5.4 Mini (Snow DuckAI)',
    shortName: 'Snow GPT-5.4 Mini',
    provider: 'Snow API',
    priority: 2,
    category: 'snow',
    description: 'Model GPT-5.4 Mini latensi cepat via jalur privasi DuckAI di Snow API dengan Auto-Fallback.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'snow-gpt54-nano',
    name: 'GPT-5.4 Nano (Snow DuckAI)',
    shortName: 'Snow GPT-5.4 Nano',
    provider: 'Snow API',
    priority: 3,
    category: 'snow',
    description: 'Varian ringan GPT-5.4 Nano berkecepatan tinggi di Snow API untuk tanya jawab instan.',
    maxPromptChars: 4000,
    timeoutMs: 20000,
    accent: 'cyan',
  },
  {
    id: 'snow-claude-haiku',
    name: 'Claude Haiku 4.5 (Snow DuckAI)',
    shortName: 'Snow Claude 4.5',
    provider: 'Snow API',
    priority: 3,
    category: 'snow',
    description: 'Claude Haiku 4.5 via DuckAI di Snow API dengan gaya bahasa tajam, terstruktur, dan responsif.',
    maxPromptChars: 4000,
    timeoutMs: 24000,
    accent: 'orange',
  },
  {
    id: 'snow-mistral-2603',
    name: 'Mistral Small 2603 (Snow DuckAI)',
    shortName: 'Mistral 2603',
    provider: 'Snow API',
    priority: 4,
    category: 'snow',
    description: 'Mistral Small rilis 2603 via DuckAI di Snow API untuk penalaran ringkas dan multibahasa.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'orange',
  },
  {
    id: 'snow-openai',
    name: 'ChatGPT Mobile (Snow API)',
    shortName: 'Snow ChatGPT',
    provider: 'Snow API',
    priority: 3,
    category: 'snow',
    description: 'Jalur ChatGPT Mobile di Snow API dengan adopsi persona NodataGPT murni dan cadangan Direct.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'snow-aicode',
    name: 'DeepAI Code Specialist (Snow)',
    shortName: 'Snow AICode',
    provider: 'Snow API',
    priority: 4,
    category: 'snow',
    description: 'Mesin pemrograman & diskusi teknis cepat (~1.5 dtk) di Snow API dengan cadangan Codestral.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'snow-felo',
    name: 'Felo AI Web Search (Snow API)',
    shortName: 'Snow Felo Search',
    provider: 'Snow API',
    priority: 5,
    category: 'snow',
    description: 'Mesin riset & pencarian web real-time Felo AI lengkap dengan kutipan tautan sumber aktual.',
    maxPromptChars: 2400,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'snow-gemini',
    name: 'Gemini Flash (Snow + Direct)',
    shortName: 'Snow Gemini',
    provider: 'Snow API + Direct',
    priority: 5,
    category: 'snow',
    description: 'Jalur Gemini Flash teks di Snow API yang otomatis beralih ke Gemini Direct Scraper bila limit.',
    maxPromptChars: 4000,
    timeoutMs: 24000,
    accent: 'cyan',
  },

  // === SYNOX CLOUD VERIFIED MODELS (apikey=FREE, Client-First Quota Safe) ===
  {
    id: 'synox-gpt4o',
    name: 'GPT-4o Mini (Synox Cloud)',
    shortName: 'Synox GPT-4o',
    provider: 'Synox Cloud',
    priority: 2,
    category: 'synox',
    description: 'Jalur GPT-4o Mini via Synox Cloud dengan sesi percakapan ringan dan respons cepat.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'synox-gpt5nano',
    name: 'GPT-5 Nano / GPT-6 Luna (Synox)',
    shortName: 'GPT-5 Nano',
    provider: 'Synox Cloud',
    priority: 3,
    category: 'synox',
    description: 'Model generasi GPT-5 Nano / GPT-6 Luna latensi rendah di Synox Cloud untuk tanya jawab instan.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'synox-qwen80b',
    name: 'Qwen3-Next 80B Instruct',
    shortName: 'Synox Qwen 80B',
    provider: 'Synox Cloud',
    priority: 3,
    category: 'synox',
    description: 'Model Qwen3-Next 80B parameter besar via Synox Cloud untuk analisis, logika, dan kode.',
    maxPromptChars: 4500,
    timeoutMs: 26000,
    accent: 'orange',
  },
  {
    id: 'synox-llama4',
    name: 'Llama 4 Scout 17B (Synox)',
    shortName: 'Synox Llama 4',
    provider: 'Synox Cloud',
    priority: 4,
    category: 'synox',
    description: 'Meta Llama 4 Scout 17B respons ~1.1 dtk dengan riwayat percakapan di jalur Synox Cloud.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'synox-coder',
    name: 'GLM-5 AI Coder (Multi-File)',
    shortName: 'Synox GLM-5 Coder',
    provider: 'Synox Cloud',
    priority: 5,
    category: 'synox',
    description: 'Mesin GLM-5 generator proyek kode multi-file (React/HTML/CSS/JS) siap pratinjau live Artifact.',
    maxPromptChars: 3500,
    timeoutMs: 32000,
    accent: 'cyan',
  },
  {
    id: 'synox-turboseek',
    name: 'TurboSeek Web Search AI',
    shortName: 'TurboSeek AI',
    provider: 'Synox Cloud',
    priority: 6,
    category: 'synox',
    description: 'Mesin penjawab berbasis pencarian web aktual lengkap dengan daftar tautan referensi.',
    maxPromptChars: 2400,
    timeoutMs: 26000,
    accent: 'orange',
  },
  {
    id: 'synox-unlimited',
    name: 'Unlimited & Algolia AI (Synox)',
    shortName: 'Synox Unlimited',
    provider: 'Synox Cloud',
    priority: 6,
    category: 'synox',
    description: 'Rantai 4-lapis Synox (UnlimitedAI → NovaAI → PowerBrain → Algolia) tahan gangguan.',
    maxPromptChars: 3500,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'synox-nova',
    name: 'Nova & PowerBrain AI (Synox)',
    shortName: 'Synox NovaAI',
    provider: 'Synox Cloud',
    priority: 7,
    category: 'synox',
    description: 'Jalur cepat ~1.3 dtk NovaAI & PowerBrain AI pada Synox Cloud untuk percakapan harian.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },

  // === CORE & MULTI-MIRROR MODELS ===
  {
    id: 'llm7',
    name: 'GPT-4o / Codestral Router',
    shortName: 'LLM7 Fast',
    provider: 'LLM7 OpenAI API',
    priority: 1,
    category: 'utama',
    description: 'Endpoint OpenAI-compatible latensi ~1.5 dtk tanpa kunci untuk diskusi dan kode.',
    maxPromptChars: 4500,
    timeoutMs: 26000,
    accent: 'cyan',
  },
  {
    id: 'stenly',
    name: 'ChatGPT Anonim',
    shortName: 'ChatGPT Stenly',
    provider: 'Stenly',
    priority: 3,
    category: 'utama',
    description: 'Konteks besar hingga 8.000 karakter, stabil untuk penjelasan panjang.',
    maxPromptChars: 8000,
    timeoutMs: 25000,
    accent: 'cyan',
  },
  {
    id: 'varhad-unlimited',
    name: 'UnlimitedAI Creative',
    shortName: 'UnlimitedAI',
    provider: 'Varhad API v2',
    priority: 4,
    category: 'utama',
    description: 'Model serbaguna Varhad v2 dengan jalur Hybrid Browser untuk diskusi & penulisan.',
    maxPromptChars: 4000,
    timeoutMs: 26000,
    accent: 'cyan',
  },
  {
    id: 'varhad-deepai',
    name: 'DeepAI Cepat',
    shortName: 'DeepAI v2',
    provider: 'Varhad API v2',
    priority: 5,
    category: 'utama',
    description: 'Jalur respons cepat DeepAI pada server Varhad v2 dengan parser 2-lapis.',
    maxPromptChars: 2800,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'nexray-overchat',
    name: 'Overchat Multi-AI',
    shortName: 'Overchat',
    provider: 'Nexray AI',
    priority: 6,
    category: 'utama',
    description: 'Jalur stabil bebas blokir untuk tanya jawab harian berbahasa Indonesia.',
    maxPromptChars: 3500,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'honcho',
    name: 'Claude Sonnet (Honcho)',
    shortName: 'Claude Sonnet',
    provider: 'Stenly',
    priority: 7,
    category: 'reasoning',
    description: 'Gaya bahasa natural, rapi, dan terstruktur untuk penulisan maupun kode.',
    maxPromptChars: 2000,
    timeoutMs: 25000,
    accent: 'orange',
  },
  {
    id: 'qwen3',
    name: 'Qwen3 Coder (Direct + Mirror)',
    shortName: 'Qwen3 Coder',
    provider: 'Qwen.ai + Synox + Stenly',
    priority: 8,
    category: 'reasoning',
    description: 'Scraper langsung Qwen3 Coder Plus + Synox Qwen 80B + Stenly untuk arsitektur kode.',
    maxPromptChars: 3500,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'llama4',
    name: 'Llama 4 Scout',
    shortName: 'Llama 4',
    provider: 'Stenly',
    priority: 10,
    category: 'utama',
    description: 'Generasi Llama 4 yang gesit untuk tanya jawab ringkas.',
    maxPromptChars: 2000,
    timeoutMs: 20000,
    accent: 'cyan',
  },
  {
    id: 'rin-chatgpt',
    name: 'ChatGPT 4o-mini',
    shortName: 'GPT-4o mini',
    provider: 'Rin API',
    priority: 11,
    category: 'utama',
    description: 'Kapasitas 4.000 karakter untuk percakapan serbaguna.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'rin-claude',
    name: 'Claude Haiku 4.5',
    shortName: 'Claude Haiku',
    provider: 'Rin API',
    priority: 12,
    category: 'reasoning',
    description: 'Varian Claude cepat dengan konteks 4.000 karakter.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'varhad-claude',
    name: 'Claude 3.5 Sonnet',
    shortName: 'Claude 3.5',
    provider: 'Varhad API v2',
    priority: 13,
    category: 'reasoning',
    description: 'Penalaran bertahap & penulisan kelas Sonnet 3.5 dengan Hybrid Browser + Auto-Mirror.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'comiku-deepai',
    name: 'DeepAI Assistant',
    shortName: 'DeepAI',
    provider: 'Comiku',
    priority: 14,
    category: 'utama',
    description: 'Jalur alternatif ringan untuk pertanyaan singkat.',
    maxPromptChars: 1200,
    timeoutMs: 25000,
    accent: 'cyan',
  },
  {
    id: 'comiku-overchat',
    name: 'Overchat Qwen-3',
    shortName: 'Overchat Qwen',
    provider: 'Comiku',
    priority: 15,
    category: 'reasoning',
    description: 'Model Qwen-3 via jalur Overchat untuk diskusi teknis.',
    maxPromptChars: 2000,
    timeoutMs: 25000,
    accent: 'cyan',
  },
  {
    id: 'bintang-llama4',
    name: 'Llama 4 Scout (Bintang)',
    shortName: 'Llama 4 Bintang',
    provider: 'BintangAPI',
    priority: 16,
    category: 'bintang',
    description: 'Server cadangan Llama 4 Scout yang responsif.',
    maxPromptChars: 2500,
    timeoutMs: 20000,
    accent: 'orange',
  },
  {
    id: 'bintang-deepv3',
    name: 'DeepSeek V3.2 (Bintang)',
    shortName: 'DeepSeek V3',
    provider: 'BintangAPI',
    priority: 17,
    category: 'bintang',
    description: 'DeepSeek V3.2 kapasitas 4.000 karakter.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'rin-qwen',
    name: 'Qwen3 80B',
    shortName: 'Qwen3 80B',
    provider: 'Rin API',
    priority: 18,
    category: 'reasoning',
    description: 'Model Qwen parameter besar 80B dengan konteks 4.000 karakter.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'bintang-deepv4',
    name: 'DeepSeek V4 Flash',
    shortName: 'DeepSeek V4',
    provider: 'BintangAPI',
    priority: 19,
    category: 'bintang',
    description: 'Varian DeepSeek V4 Flash berkecepatan tinggi.',
    maxPromptChars: 4000,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'wormgpt',
    name: 'Nodata Direct (Bintang)',
    shortName: 'Nodata Direct',
    provider: 'BintangAPI',
    priority: 20,
    category: 'bintang',
    description: 'Jalur respons lugas tanpa basa-basi dengan gaya teknis langsung.',
    maxPromptChars: 4000,
    timeoutMs: 25000,
    accent: 'orange',
  },
  {
    id: 'rin-aicostum',
    name: 'AI Persona Kustom',
    shortName: 'Persona Kustom',
    provider: 'Rin API',
    priority: 21,
    category: 'khusus',
    description: 'Endpoint khusus persona NodataGPT + gaya tambahan dari Pengaturan.',
    maxPromptChars: 2500,
    timeoutMs: 28000,
    accent: 'dual',
  },
  {
    id: 'math',
    name: 'MathGPT Spesialis',
    shortName: 'MathGPT',
    provider: 'Xemoz',
    priority: 90,
    category: 'khusus',
    description: 'Khusus perhitungan matematika, aljabar, kalkulus, dan statistik.',
    maxPromptChars: 1500,
    timeoutMs: 20000,
    accent: 'cyan',
  },
  {
    id: 'claude',
    name: 'Claude Nexray',
    shortName: 'Claude Nexray',
    provider: 'Nexray',
    priority: 91,
    category: 'khusus',
    description: 'Endpoint Claude cadangan untuk pertanyaan ringkas.',
    maxPromptChars: 1200,
    timeoutMs: 20000,
    accent: 'orange',
  },
  {
    id: 'gpt5',
    name: 'GPT-5.5 Experimental',
    shortName: 'GPT-5.5',
    provider: 'Xemoz',
    priority: 92,
    category: 'khusus',
    description: 'Endpoint eksperimental cepat untuk prompt pendek.',
    maxPromptChars: 1000,
    timeoutMs: 20000,
    accent: 'orange',
  },
  {
    id: 'gemini-resmi',
    name: 'Gemini 2.5 Flash (Kunci Pribadi)',
    shortName: 'Gemini Resmi',
    provider: 'Google AI Studio',
    priority: -2,
    category: 'resmi',
    description: 'Jalur resmi Google AI Studio menggunakan API Key pribadi Anda.',
    maxPromptChars: 16000,
    timeoutMs: 25000,
    requiresKey: 'gemini',
    accent: 'cyan',
  },
  {
    id: 'deepseek-resmi',
    name: 'DeepSeek Chat (Kunci Pribadi)',
    shortName: 'DeepSeek Resmi',
    provider: 'DeepSeek Official',
    priority: -1,
    category: 'resmi',
    description: 'Jalur resmi DeepSeek API menggunakan API Key pribadi Anda.',
    maxPromptChars: 16000,
    timeoutMs: 25000,
    requiresKey: 'deepseek',
    accent: 'orange',
  },
];

export const DEFAULT_FALLBACK_ORDER: string[] = [
  'llm7',
  'snow-openai',
  'snow-gpt54-mini',
  'synox-gpt4o',
  'synox-qwen80b',
  'snow-aicode',
  'snow-mistral-2603',
  'bintang-llama4',
  'snow-claude-haiku',
  'snow-gpt54-nano',
  'claude',
  'nexray-overchat',
  'synox-llama4',
  'synox-gpt5nano',
  'varhad-unlimited',
  'varhad-claude',
  'gemini',
  'chatgpt',
  'qwen-direct',
  'deepseek',
  'snow-felo',
  'synox-unlimited',
  'gpt5',
  'varhad-deepai',
  'qwen3',
  'llama4',
  'rin-chatgpt',
  'rin-qwen',
  'rin-aicostum',
  'comiku-overchat',
  'honcho',
  'stenly',
  'wormgpt',
  'rin-claude',
  'bintang-deepv4',
  'bintang-deepv3',
  'comiku-deepai',
];

export interface ImageEngineDefinition {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  category: ImageModelCategory;
  badge: string;
  description: string;
  delivery: 'gateway' | 'hybrid-json' | 'browser-img';
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  buildUrl: (prompt: string, ratio?: string) => string;
  buildBody?: (prompt: string, ratio?: string) => string;
  timeoutMs: number;
}

export interface ImageModelOption {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  category: ImageModelCategory;
  badge: string;
  description: string;
}

function resolveStableDiffDimensions(ratio = '1:1'): { width: number; height: number } {
  switch (ratio) {
    case '16:9':
    case '21:9':
      return { width: 1024, height: 576 };
    case '9:16':
      return { width: 576, height: 1024 };
    case '4:5':
    case '2:3':
      return { width: 640, height: 832 };
    case '3:2':
      return { width: 832, height: 640 };
    default:
      return { width: 768, height: 768 };
  }
}

export const IMAGE_ENGINES: ImageEngineDefinition[] = [
  {
    id: 'nexray-magicstudio',
    name: 'MagicStudio HD · Nexray',
    shortName: 'MagicStudio HD',
    provider: 'Nexray AI',
    category: 'cepat',
    badge: 'Tercepat ~1.6s',
    description: 'Render fotorealistik dan ilustrasi PNG tajam berkecepatan tinggi.',
    delivery: 'gateway',
    buildUrl: (prompt) =>
      `https://api.nexray.eu.cc/ai/magicstudio?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 28000,
  },
  {
    id: 'nexray-flux-v1',
    name: 'Flux v1 Pro · Nexray',
    shortName: 'Flux v1',
    provider: 'Nexray AI',
    category: 'artistik',
    badge: 'Artistik & Anime',
    description: 'Pencahayaan sinematik, konsep seni detail, anime, dan cyberpunk.',
    delivery: 'gateway',
    buildUrl: (prompt) =>
      `https://api.nexray.eu.cc/ai/v1/flux?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 32000,
  },
  {
    id: 'comiku-sdxl',
    name: 'SDXL Anime & Art 768×1024 · Comiku',
    shortName: 'Comiku SDXL',
    provider: 'Comiku AI',
    category: 'artistik',
    badge: 'SDXL 768×1024 PNG',
    description: 'Mesin Stable Diffusion XL (DPM++ 2M Karras + CodeFormer) resolusi potret 768×1024 tajam.',
    delivery: 'hybrid-json',
    buildUrl: (prompt) =>
      `https://comiku.my.id/imagecreator/txt2img?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 36000,
  },
  {
    id: 'nexray-writecream',
    name: 'WriteCream Studio · Nexray',
    shortName: 'WriteCream',
    provider: 'Nexray AI',
    category: 'cepat',
    badge: 'Multi-Rasio 16:9 / 9:16',
    description: 'Mendukung rasio kustom otomatis (1:1, 16:9, 9:16, 4:5, 3:2, 21:9) untuk wallpaper & story.',
    delivery: 'gateway',
    buildUrl: (prompt, ratio = '1:1') =>
      `https://api.nexray.eu.cc/ai/writecreamimg?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`,
    timeoutMs: 30000,
  },
  {
    id: 'nexray-ideogram',
    name: 'Ideogram Ultra · Nexray',
    shortName: 'Ideogram Ultra',
    provider: 'Nexray AI',
    category: 'desain',
    badge: 'Ultra HD + Tipografi',
    description: 'Resolusi tinggi (~1.5 MB PNG), paling akurat untuk poster, banner, dan teks di dalam gambar.',
    delivery: 'gateway',
    buildUrl: (prompt) =>
      `https://api.nexray.eu.cc/ai/ideogram?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 42000,
  },
  {
    id: 'varhad-img',
    name: 'Varhad Text2Image v2',
    shortName: 'Varhad Image',
    provider: 'Varhad API v2',
    category: 'artistik',
    badge: 'Hybrid v2',
    description: 'Generator gambar kreatif Varhad API v2 dengan koneksi langsung + cadangan gateway.',
    delivery: 'hybrid-json',
    buildUrl: (prompt) =>
      `https://v2.api-varhad.my.id/ai/text2image?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 32000,
  },
  {
    id: 'synox-stablediff',
    name: 'Stable Diffusion XL · Synox',
    shortName: 'Synox StableDiff',
    provider: 'Synox Cloud',
    category: 'artistik',
    badge: 'POST SDXL + Rasio',
    description: 'Mesin POST Stable Diffusion Synox Cloud dengan parameter steps, guidance, & dimensi rasio otomatis.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => 'https://api.synoxcloud.xyz/ai-generate/stablediff?apikey=FREE',
    buildBody: (prompt, ratio = '1:1') => {
      const dims = resolveStableDiffDimensions(ratio);
      return JSON.stringify({
        prompt,
        negative_prompt: 'blurry, low quality, deformed, watermark, bad anatomy',
        width: dims.width,
        height: dims.height,
        steps: 25,
        guidance_scale: 7.5,
        apikey: 'FREE',
      });
    },
    timeoutMs: 34000,
  },
  {
    id: 'synox-meigen',
    name: 'MeiGen AI Artwork · Synox',
    shortName: 'Synox MeiGen',
    provider: 'Synox Cloud',
    category: 'cepat',
    badge: 'Galeri AI ~2s',
    description: 'Pencarian & kurasi karya visual AI resolusi tinggi dari MeiGen AI (mendukung /meigen <kata kunci>).',
    delivery: 'hybrid-json',
    buildUrl: (prompt) =>
      `https://api.synoxcloud.xyz/search/meigen-ai?q=${encodeURIComponent(prompt)}&apikey=FREE`,
    timeoutMs: 24000,
  },
  {
    id: 'rin-flux',
    name: 'Rin Flux Direct',
    shortName: 'Rin Flux',
    provider: 'Rin API',
    category: 'direct',
    badge: 'Direct Browser',
    description: 'Mesin Flux alternatif yang dirender langsung melalui browser perangkat Anda.',
    delivery: 'browser-img',
    buildUrl: (prompt) =>
      `https://apiii-xrina.my.id/ai-image/flux?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 30000,
  },
  {
    id: 'rin-text2img',
    name: 'Rin Text2Img Direct',
    shortName: 'Rin Text2Img',
    provider: 'Rin API',
    category: 'direct',
    badge: 'Direct Browser',
    description: 'Generator foto & ilustrasi cepat jalur langsung browser klien.',
    delivery: 'browser-img',
    buildUrl: (prompt) =>
      `https://apiii-xrina.my.id/ai-image/text2img?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 30000,
  },
  {
    id: 'nexray-sologo',
    name: 'Sologo AI · Nexray',
    shortName: 'Sologo Logo',
    provider: 'Nexray AI',
    category: 'desain',
    badge: 'Spesialis Logo',
    description: 'Mesin khusus pembuatan logo modern, ikon brand, maskot, dan lambang vektor.',
    delivery: 'gateway',
    buildUrl: (prompt) =>
      `https://api.nexray.eu.cc/ai/sologo?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 36000,
  },
];

export const IMAGE_MODELS: ImageModelOption[] = [
  {
    id: 'auto',
    name: 'Otomatis Pintar (Image Router)',
    shortName: 'Auto Gambar',
    provider: 'NodataGPT Image Router',
    category: 'auto',
    badge: `${IMAGE_ENGINES.length} Mesin Siaga`,
    description:
      'Memilih mesin gambar paling tepat sesuai isi prompt (Ideogram untuk poster/teks, SDXL/Flux untuk anime & seni, WriteCream/StableDiff untuk rasio, Sologo untuk logo, MagicStudio HD untuk kecepatan) dengan Auto-Fallback otomatis.',
  },
  {
    id: ROUTER_IMAGE_MODEL_ID,
    name: 'AI Router Image (/v1/images/generations)',
    shortName: 'Router Image',
    provider: '9Router · OmniRoute · OpenAI',
    category: 'router',
    badge: 'Gateway /v1/images',
    description:
      'Membuat gambar menggunakan endpoint OpenAI-compatible /v1/images/generations pada OmniRoute / 9Router Anda dengan Auto-Fallback ke mesin gambar NodataGPT.',
  },
  ...IMAGE_ENGINES.map((e) => ({
    id: e.id,
    name: e.name,
    shortName: e.shortName,
    provider: e.provider,
    category: e.category,
    badge: e.badge,
    description: e.description,
  })),
];

export function buildDynamicRouterModelDefinitions(
  settings: AppSettings
): AIModelDefinition[] {
  const providerLabel = getRouterDisplayLabel(settings);
  const presetSuggestions =
    ROUTER_PRESETS[settings.routerPreset]?.suggestedModels || [];

  const uniqueModelNames: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (raw: string) => {
    const clean = raw.trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    uniqueModelNames.push(clean);
  };

  if (settings.routerModel?.trim()) {
    pushUnique(settings.routerModel);
  }
  for (const m of settings.routerDiscoveredModels || []) {
    pushUnique(m);
  }
  for (const s of presetSuggestions) {
    pushUnique(s);
  }

  return uniqueModelNames.slice(0, 60).map((modelId) => {
    const shortLabel =
      modelId.length > 20 ? `${modelId.slice(0, 19)}…` : modelId;
    const isFromDiscovery = (settings.routerDiscoveredModels || []).includes(
      modelId
    );
    return {
      id: `${ROUTER_MODEL_PREFIX}${modelId}`,
      name: `${modelId} (${providerLabel})`,
      shortName: shortLabel,
      provider: providerLabel,
      priority: 0,
      category: 'router',
      description: isFromDiscovery
        ? `Model / kombo aktif yang ditemukan langsung dari endpoint /v1/models pada ${providerLabel}.`
        : `Preset model / kombo pintar ${providerLabel} melalui /v1/chat/completions.`,
      maxPromptChars: 12000,
      timeoutMs: 42000,
      requiresKey: 'router',
      accent: modelId.startsWith('auto') ? 'dual' : 'cyan',
    };
  });
}

export function getModelById(
  id: string,
  settings?: AppSettings
): AIModelDefinition {
  if (settings && (id === ROUTER_PRIMARY_MODEL_ID || id.startsWith(ROUTER_MODEL_PREFIX))) {
    const resolved = resolveRouterModelName(id, settings);
    const providerLabel = getRouterDisplayLabel(settings);
    const shortResolved =
      resolved.length > 18 ? `${resolved.slice(0, 17)}…` : resolved;
    return {
      id,
      name: `${providerLabel} · ${resolved}`,
      shortName: `${providerLabel}: ${shortResolved}`,
      provider: providerLabel,
      priority: 0,
      category: 'router',
      description: `Terhubung ke gateway ${providerLabel} dengan model/combo "${resolved}".`,
      maxPromptChars: 12000,
      timeoutMs: 42000,
      requiresKey: 'router',
      accent: 'dual',
    };
  }
  if (id.startsWith(ROUTER_MODEL_PREFIX)) {
    const modelName = id.slice(ROUTER_MODEL_PREFIX.length);
    return {
      id,
      name: `AI Router · ${modelName}`,
      shortName: modelName.slice(0, 18),
      provider: 'AI Router Gateway',
      priority: 0,
      category: 'router',
      description: `Model "${modelName}" melalui AI Router Gateway.`,
      maxPromptChars: 12000,
      timeoutMs: 42000,
      requiresKey: 'router',
      accent: 'dual',
    };
  }
  return AI_MODELS.find((m) => m.id === id) || AI_MODELS[0];
}

export function getImageModelById(id: string): ImageModelOption {
  return IMAGE_MODELS.find((m) => m.id === id) || IMAGE_MODELS[0];
}
