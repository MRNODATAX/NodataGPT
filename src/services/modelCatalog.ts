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
  // === NEW MULTI-SITE DIRECT WEB AI SCRAPERS (/api/webai — Keyless + Auto-Fallback) ===
  {
    id: 'webai-gptoss-120b',
    name: 'GPT-OSS 120B (Direct Scraper)',
    shortName: 'GPT-OSS 120B',
    provider: 'chat-gpt-oss.com Direct',
    priority: 2,
    category: 'scraper',
    description: 'Scraper SSE langsung ke chat-gpt-oss.com (model OpenAI GPT-OSS 120B + penalaran cepat) bebas kunci.',
    maxPromptChars: 7500,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'webai-gpt5-nano',
    name: 'GPT-5 Nano (Direct Scraper)',
    shortName: 'GPT-5 Nano Web',
    provider: 'chat-gpt-oss.com Direct',
    priority: 2,
    category: 'scraper',
    description: 'Scraper SSE langsung ke chat-gpt-oss.com untuk model ringan super cepat GPT-5 Nano.',
    maxPromptChars: 7500,
    timeoutMs: 25000,
    accent: 'cyan',
  },
  {
    id: 'webai-quillbot',
    name: 'QuillBot AI Chat (Direct Scraper)',
    shortName: 'QuillBot AI',
    provider: 'quillbot.com/ai-chat',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung ke QuillBot AI Chat (quillbot.com) untuk penulisan rapi, parafrasa, analisis & diskusi.',
    maxPromptChars: 7000,
    timeoutMs: 27000,
    accent: 'cyan',
  },
  {
    id: 'webai-quillbot-search',
    name: 'QuillBot Web Search AI (Direct Scraper)',
    shortName: 'QuillBot Search',
    provider: 'quillbot.com Live Web',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung QuillBot AI dengan mesin pencarian internet real-time (web_search_builtin) + sitasi.',
    maxPromptChars: 6500,
    timeoutMs: 29000,
    accent: 'orange',
  },
  {
    id: 'webai-brave-ask',
    name: 'Brave Ask AI · Live Web (Direct Scraper)',
    shortName: 'Brave Ask AI',
    provider: 'search.brave.com/ask',
    priority: 2,
    category: 'scraper',
    description: 'Scraper TAP SvelteKit langsung ke Brave Search Ask AI (search.brave.com/ask) untuk riset web aktual & sitasi.',
    maxPromptChars: 5500,
    timeoutMs: 29000,
    accent: 'orange',
  },
  {
    id: 'webai-opera-aria',
    name: 'Opera Aria AI (Direct Scraper)',
    shortName: 'Opera Aria',
    provider: 'composer.opera-api.com',
    priority: 2,
    category: 'scraper',
    description: 'Scraper OAuth anonim resmi Opera Browser Aria AI (composer.opera-api.com) responsif & cerdas.',
    maxPromptChars: 6500,
    timeoutMs: 30000,
    accent: 'cyan',
  },
  {
    id: 'webai-opera-reasoning',
    name: 'Opera Aria Think Harder (Reasoning)',
    shortName: 'Aria Reasoning',
    provider: 'composer.opera-api.com',
    priority: 2,
    category: 'scraper',
    description: 'Mode penalaran mendalam (think_harder) pada scraper langsung Opera Aria AI untuk logika & pemecahan masalah.',
    maxPromptChars: 6500,
    timeoutMs: 32000,
    accent: 'orange',
  },
  {
    id: 'webai-deepai-chat',
    name: 'DeepAI Gemma 4 & Chat (Direct Scraper)',
    shortName: 'DeepAI Direct',
    provider: 'deepai.org Dynamic Hash',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung api.deepai.org dengan generator kunci kriptografis tryit dinamis tanpa akun.',
    maxPromptChars: 6500,
    timeoutMs: 27000,
    accent: 'cyan',
  },
  {
    id: 'webai-deepai-online',
    name: 'DeepAI Online Search (Direct Scraper)',
    shortName: 'DeepAI Online',
    provider: 'deepai.org Live Search',
    priority: 2,
    category: 'scraper',
    description: 'Mode pencarian online real-time langsung ke api.deepai.org untuk informasi terkini di internet.',
    maxPromptChars: 6000,
    timeoutMs: 29000,
    accent: 'orange',
  },
  {
    id: 'webai-cohere-command',
    name: 'Cohere Command-A 2025 (Direct Scraper)',
    shortName: 'Command-A Direct',
    provider: 'Cohere Labs Official',
    priority: 2,
    category: 'scraper',
    description: 'Scraper percakapan langsung ke Cohere Labs Official Space (command-a-03-2025) 256K enterprise.',
    maxPromptChars: 7500,
    timeoutMs: 30000,
    accent: 'cyan',
  },
  {
    id: 'webai-phind-coder',
    name: 'Phind AI Coder (Direct Scraper)',
    shortName: 'Phind Coder',
    provider: 'phindai.org Direct',
    priority: 2,
    category: 'scraper',
    description: 'Scraper langsung ke phindai.org spesialis pemrograman, debugging kode, arsitektur & algoritma.',
    maxPromptChars: 6500,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'webai-kilo-nemotron',
    name: 'NVIDIA Nemotron 3.5 Super 120B (Kilo)',
    shortName: 'Nemotron 3.5 120B',
    provider: 'kilo.ai Gateway',
    priority: 2,
    category: 'scraper',
    description: 'Gateway bebas kunci kilo.ai menjalankan NVIDIA Nemotron 3.5 Super VL 120B (konteks 262K & penalaran).',
    maxPromptChars: 9000,
    timeoutMs: 29000,
    accent: 'dual',
  },
  {
    id: 'webai-kilo-beam',
    name: 'Reflection Beam 1M Coder (Kilo)',
    shortName: 'Reflection Beam 1M',
    provider: 'kilo.ai Gateway',
    priority: 2,
    category: 'scraper',
    description: 'Model coding & arsitektur perangkat lunak Reflection Beam konteks 1 Juta token via kilo.ai bebas kunci.',
    maxPromptChars: 9500,
    timeoutMs: 29000,
    accent: 'orange',
  },
  {
    id: 'webai-orcarouter',
    name: 'OrcaRouter Free AI (Direct Gateway)',
    shortName: 'OrcaRouter AI',
    provider: 'orcarouter.ai Direct',
    priority: 2,
    category: 'scraper',
    description: 'Router OpenAI-compatible bebas kunci langsung ke api.orcarouter.ai (orcarouter/free) latensi rendah.',
    maxPromptChars: 8000,
    timeoutMs: 27000,
    accent: 'cyan',
  },
  {
    id: 'webai-teach-anything',
    name: 'Teach-Anything Edu AI (Direct Scraper)',
    shortName: 'TeachAnything AI',
    provider: 'teach-anything.com',
    priority: 3,
    category: 'scraper',
    description: 'Scraper langsung ke teach-anything.com untuk penjelasan konsep edukasi terstruktur & mudah dipahami.',
    maxPromptChars: 5500,
    timeoutMs: 25000,
    accent: 'cyan',
  },
  {
    id: 'webai-yqcloud',
    name: 'YQCloud GPT Network (Direct Scraper)',
    shortName: 'YQCloud Direct',
    provider: 'chat9.yqcloud.top',
    priority: 3,
    category: 'scraper',
    description: 'Scraper streaming langsung ke jaringan chat9.yqcloud.top dengan dukungan konteks web aktif.',
    maxPromptChars: 5500,
    timeoutMs: 26000,
    accent: 'cyan',
  },

  // === ZELAI CLOUD INDONESIA (ai.zelai.qzz.io/v1 — Keyless OpenAI Wire + Auto-Fallback) ===
  {
    id: 'zelai-mimo-flash',
    name: 'Xiaomi MiMo V2.6 Flash (ZelAI)',
    shortName: 'MiMo V2.6 Flash',
    provider: 'ZelAI Cloud ID',
    priority: 2,
    category: 'zelai',
    description: 'Xiaomi MiMo V2.6 Flash bebas kunci via ZelAI Indonesia (OpenAI /v1/chat/completions) super cepat.',
    maxPromptChars: 9000,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'zelai-deepseek-v41',
    name: 'DeepSeek V4.1 Flash (ZelAI)',
    shortName: 'DeepSeek V4.1',
    provider: 'ZelAI Cloud ID',
    priority: 2,
    category: 'zelai',
    description: 'DeepSeek V4.1 Flash generasi terbaru untuk coding, penalaran tajam, dan percakapan multi-turn.',
    maxPromptChars: 9000,
    timeoutMs: 25000,
    accent: 'orange',
  },
  {
    id: 'zelai-nemotron-550b',
    name: 'NVIDIA Nemotron-3 Ultra 550B (ZelAI)',
    shortName: 'Nemotron 550B',
    provider: 'ZelAI Cloud ID',
    priority: 3,
    category: 'zelai',
    description: 'Model flagship NVIDIA Nemotron-3 Ultra 550B-A55B untuk analisis kompleks, arsitektur, dan sains.',
    maxPromptChars: 9000,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'zelai-glm53-flash',
    name: 'Zhipu GLM-5.3 Flash (ZelAI)',
    shortName: 'GLM-5.3 Flash',
    provider: 'ZelAI Cloud ID',
    priority: 3,
    category: 'zelai',
    description: 'Zhipu AI GLM-5.3 Flash responsif untuk diskusi multibahasa, ringkasan, dan penulisan kreatif.',
    maxPromptChars: 9000,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'zelai-minimax-m27',
    name: 'MiniMax M2.7 (ZelAI)',
    shortName: 'MiniMax M2.7',
    provider: 'ZelAI Cloud ID',
    priority: 4,
    category: 'zelai',
    description: 'MiniMax M2.7 dengan konteks panjang untuk penulisan terstruktur, riset, dan tanya jawab mendalam.',
    maxPromptChars: 9000,
    timeoutMs: 26000,
    accent: 'orange',
  },
  {
    id: 'zelai-ciora-coding',
    name: 'Ciora Coding Agent (ZelAI)',
    shortName: 'Ciora Coding',
    provider: 'ZelAI Cloud ID',
    priority: 4,
    category: 'zelai',
    description: 'Agen spesialis rekayasa perangkat lunak, debugging, TypeScript/Python, dan pembuatan kode penuh.',
    maxPromptChars: 10000,
    timeoutMs: 28000,
    accent: 'cyan',
  },
  {
    id: 'zelai-gptoss-20b',
    name: 'GPT-OSS 20B (ZelAI)',
    shortName: 'GPT-OSS 20B',
    provider: 'ZelAI Cloud ID',
    priority: 5,
    category: 'zelai',
    description: 'OpenAI GPT-OSS 20B latensi rendah via gateway ZelAI dengan Auto-Fallback otomatis.',
    maxPromptChars: 8000,
    timeoutMs: 22000,
    accent: 'cyan',
  },

  // === SIPUTZX & FAA VERIFIED MODELS (GPT-OSS 120B, QwQ 32B, R1, WebPilot, Blackbox) ===
  {
    id: 'siput-gptoss-120b',
    name: 'GPT-OSS 120B (SiputZX)',
    shortName: 'GPT-OSS 120B',
    provider: 'SiputZX AI',
    priority: 4,
    category: 'utama',
    description: 'OpenAI GPT-OSS 120B skala besar tanpa API key untuk jawaban presisi tinggi dan analisis teknis.',
    maxPromptChars: 4000,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'siput-glm47-flash',
    name: 'GLM-4.7 Flash (SiputZX)',
    shortName: 'GLM-4.7 Flash',
    provider: 'SiputZX AI',
    priority: 5,
    category: 'utama',
    description: 'GLM-4.7 Flash cepat dan ringan dengan penalaran bersih serta dukungan Bahasa Indonesia alami.',
    maxPromptChars: 4000,
    timeoutMs: 22000,
    accent: 'cyan',
  },
  {
    id: 'siput-qwq-32b',
    name: 'Qwen QwQ 32B Reasoning (SiputZX)',
    shortName: 'QwQ 32B Think',
    provider: 'SiputZX AI',
    priority: 5,
    category: 'reasoning',
    description: 'Model penalaran mendalam Qwen QwQ 32B untuk logika, algoritma, matematika, dan pemecahan masalah.',
    maxPromptChars: 3800,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'siput-deepseek-r1',
    name: 'DeepSeek R1 Reasoning (SiputZX)',
    shortName: 'DeepSeek R1',
    provider: 'SiputZX AI',
    priority: 5,
    category: 'reasoning',
    description: 'DeepSeek R1 Chain-of-Thought untuk pembuktian logis, audit kode, dan analisis mendalam.',
    maxPromptChars: 3800,
    timeoutMs: 28000,
    accent: 'orange',
  },
  {
    id: 'faa-claude',
    name: 'Claude AI Hybrid (Faa)',
    shortName: 'Faa Claude',
    provider: 'Faa API',
    priority: 6,
    category: 'utama',
    description: 'Jalur alternatif Claude AI responsif tanpa kunci API dengan Auto-Fallback ke mirror Claude.',
    maxPromptChars: 3500,
    timeoutMs: 24000,
    accent: 'orange',
  },
  {
    id: 'faa-blackbox',
    name: 'Blackbox Code AI (Faa)',
    shortName: 'Blackbox Code',
    provider: 'Faa API',
    priority: 6,
    category: 'reasoning',
    description: 'Asisten pemrograman Blackbox AI khusus sintaks modern, refactoring, dan arsitektur full-stack.',
    maxPromptChars: 4000,
    timeoutMs: 24000,
    accent: 'cyan',
  },
  {
    id: 'faa-webpilot',
    name: 'WebPilot Live Search AI (Faa)',
    shortName: 'WebPilot Search',
    provider: 'Faa API',
    priority: 7,
    category: 'khusus',
    description: 'Mesin AI pencarian web real-time lengkap dengan daftar tautan sumber referensi aktual.',
    maxPromptChars: 2500,
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
    provider: 'Multi-Mirror OpenAI Router',
    priority: 9,
    category: 'utama',
    description: 'Jalur OpenAI-compatible multi-mirror dengan auto-fallback otomatis ke Snow & Synox GPT-4o.',
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
  'zelai-mimo-flash',
  'zelai-deepseek-v41',
  'snow-openai',
  'zelai-glm53-flash',
  'synox-gpt4o',
  'siput-gptoss-120b',
  'snow-gpt54-mini',
  'zelai-nemotron-550b',
  'synox-qwen80b',
  'siput-glm47-flash',
  'zelai-minimax-m27',
  'zelai-ciora-coding',
  'faa-claude',
  'bintang-llama4',
  'synox-llama4',
  'nexray-overchat',
  'snow-claude-haiku',
  'snow-aicode',
  'faa-blackbox',
  'zelai-gptoss-20b',
  'siput-qwq-32b',
  'siput-deepseek-r1',
  'snow-mistral-2603',
  'snow-gpt54-nano',
  'stenly',
  'varhad-unlimited',
  'varhad-deepai',
  'claude',
  'synox-gpt5nano',
  'varhad-claude',
  'gemini',
  'chatgpt',
  'qwen-direct',
  'deepseek',
  'webai-gptoss-120b',
  'webai-kilo-nemotron',
  'webai-quillbot',
  'webai-deepai-chat',
  'webai-orcarouter',
  'webai-opera-aria',
  'webai-cohere-command',
  'webai-kilo-beam',
  'webai-phind-coder',
  'webai-brave-ask',
  'webai-quillbot-search',
  'webai-deepai-online',
  'webai-gpt5-nano',
  'webai-teach-anything',
  'webai-yqcloud',
  'faa-webpilot',
  'snow-felo',
  'synox-unlimited',
  'synox-nova',
  'gpt5',
  'qwen3',
  'llama4',
  'comiku-overchat',
  'comiku-deepai',
  'honcho',
  'wormgpt',
  'rin-aicostum',
  'rin-chatgpt',
  'rin-qwen',
  'rin-claude',
  'bintang-deepv4',
  'bintang-deepv3',
  'llm7',
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

function resolvePollinationsDimensions(ratio = '1:1'): { width: number; height: number } {
  switch (ratio) {
    case '16:9':
    case '21:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '4:5':
    case '2:3':
      return { width: 832, height: 1088 };
    case '3:2':
      return { width: 1088, height: 832 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function mapGrokRatio(ratio = '1:1'): string {
  switch (ratio) {
    case '16:9':
    case '21:9':
      return '16:9';
    case '9:16':
      return '9:16';
    case '4:5':
    case '2:3':
      return '3:4';
    case '3:2':
      return '4:3';
    default:
      return '1:1';
  }
}

export const IMAGE_ENGINES: ImageEngineDefinition[] = [
  {
    id: 'zelai-zimage-turbo',
    name: 'Z-Image Turbo · ZelAI Cloud',
    shortName: 'ZelAI Z-Image',
    provider: 'ZelAI Cloud ID',
    category: 'cepat',
    badge: 'OpenAI /v1/images',
    description:
      'Mesin Z-Image Turbo bebas kunci via gateway ZelAI Indonesia untuk foto realistis, anime, dan konsep visual tajam.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => 'https://ai.zelai.qzz.io/v1/images/generations',
    buildBody: (prompt, ratio = '1:1') => {
      const dims = resolvePollinationsDimensions(ratio);
      return JSON.stringify({
        model: 'z-image-turbo',
        prompt,
        size: `${dims.width}x${dims.height}`,
      });
    },
    timeoutMs: 32000,
  },
  {
    id: 'pollinations-flux',
    name: 'Pollinations Flux Instant',
    shortName: 'Pollinations Flux',
    provider: 'Pollinations AI',
    category: 'cepat',
    badge: 'Instan ~0.6s',
    description:
      'Mesin Flux berkecepatan super tinggi (~0.6 dtk) bebas watermark dengan dukungan multi-rasio otomatis.',
    delivery: 'gateway',
    buildUrl: (prompt, ratio = '1:1') => {
      const dims = resolvePollinationsDimensions(ratio);
      const seed = Math.floor(Math.random() * 900000) + 100000;
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}`;
    },
    timeoutMs: 26000,
  },
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
    id: 'bintang-grok',
    name: 'Grok Imagine 2K · Bintang',
    shortName: 'Bintang Grok 2K',
    provider: 'BintangAPI',
    category: 'desain',
    badge: '2K + Multi-Rasio',
    description:
      'Mesin RenderForest Grok Text-to-Image resolusi 2K tajam dengan dukungan rasio 1:1, 16:9, 9:16, 4:3, & 3:4.',
    delivery: 'hybrid-json',
    buildUrl: (prompt, ratio = '1:1') => {
      const grokRatio = mapGrokRatio(ratio);
      return `https://bintangapi.my.id/api/aiimg/grok?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(grokRatio)}&resolution=2K`;
    },
    timeoutMs: 42000,
  },
  {
    id: 'bintang-zimage',
    name: 'Z-Image Photoreal · Bintang',
    shortName: 'Bintang Z-Image',
    provider: 'BintangAPI',
    category: 'artistik',
    badge: 'Fotorealistik HD',
    description:
      'Mesin Z-Image berdetail tinggi untuk potret realistis, lanskap sinematik, dan konsep karakter.',
    delivery: 'hybrid-json',
    buildUrl: (prompt) =>
      `https://bintangapi.my.id/api/aiimg/zimage?prompt=${encodeURIComponent(prompt)}`,
    timeoutMs: 44000,
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
    id: 'webai-bfl-flux-schnell',
    name: 'FLUX.1 Schnell · Black Forest Labs (ZeroGPU)',
    shortName: 'BFL FLUX.1 Schnell',
    provider: 'Black Forest Labs Space',
    category: 'direct',
    badge: 'Direct ZeroGPU 1024px',
    description:
      'Scraper Gradio v5 langsung ke Space resmi Black Forest Labs FLUX.1-Schnell (1024x1024, mendukung semua rasio + mirror).',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'bfl-flux-schnell',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 38000,
  },
  {
    id: 'webai-bfl-flux-dev',
    name: 'FLUX.1 Dev 28-Step · Black Forest Labs',
    shortName: 'BFL FLUX.1 Dev HD',
    provider: 'Black Forest Labs Space',
    category: 'artistik',
    badge: 'Ultra Detail 28-Step',
    description:
      'Scraper langsung ke Space resmi Black Forest Labs FLUX.1-Dev 28-step untuk detail tekstur, pencahayaan & anatomi kelas studio.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'bfl-flux-dev',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 46000,
  },
  {
    id: 'webai-sd35-large',
    name: 'Stable Diffusion 3.5 Large · Stability AI',
    shortName: 'SD 3.5 Large',
    provider: 'Stability AI Official Space',
    category: 'artistik',
    badge: 'Stability Official',
    description:
      'Scraper langsung ke Space resmi Stability AI Stable Diffusion 3.5 Large (8B MMDiT) dengan komposisi & tipografi tajam.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'stability-sd35',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 46000,
  },
  {
    id: 'webai-qwen-image',
    name: 'Qwen-Image Lightning · Alibaba Space',
    shortName: 'Qwen-Image Fast',
    provider: 'Qwen-Image ZeroGPU',
    category: 'cepat',
    badge: 'Lightning 8-Step',
    description:
      'Scraper langsung ke mcp-tools/Qwen-Image-Fast (Alibaba Qwen-Image Lightning 8-step) mendukung multi-rasio & teks poster.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'qwen-image-fast',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 38000,
  },
  {
    id: 'webai-zimage-turbo',
    name: 'Tongyi Z-Image Turbo · ZeroGPU Direct',
    shortName: 'Z-Image ZeroGPU',
    provider: 'Tongyi-MAI Space',
    category: 'direct',
    badge: 'Direct ZeroGPU',
    description:
      'Scraper langsung ke Space mrfakename/Z-Image-Turbo (Tongyi-MAI 9-step) fotorealistik & anime resolusi tinggi.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'tongyi-zimage',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 38000,
  },
  {
    id: 'webai-deepai-hd',
    name: 'DeepAI HD Text2Img (Direct Scraper)',
    shortName: 'DeepAI HD Studio',
    provider: 'deepai.org Direct',
    category: 'direct',
    badge: 'Direct Scraper HD',
    description:
      'Scraper langsung ke generator gambar HD deepai.org menggunakan kunci kriptografis tryit dinamis tanpa akun.',
    delivery: 'hybrid-json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    buildUrl: () => '/api/webai',
    buildBody: (prompt, ratio) =>
      JSON.stringify({
        provider: 'deepai-image',
        mode: 'image',
        prompt,
        ratio: ratio || '1:1',
      }),
    timeoutMs: 32000,
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
  const discoveredList = settings.routerDiscoveredModels || [];
  const hasDiscovered = discoveredList.length > 0;
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

  if (hasDiscovered) {
    // Strictly show ONLY the real models discovered from the user's API key
    // (plus `routerModel` only if the user manually entered a custom alias that isn't a stale preset default)
    const configured = (settings.routerModel || '').trim();
    const stalePresetDefaults = new Set([
      'cc/claude-opus-4-7',
      'openrouter/auto',
      'auto',
      'gpt-4o-mini',
      'llama-3.3-70b-versatile',
    ]);
    if (configured && (discoveredList.includes(configured) || !stalePresetDefaults.has(configured))) {
      pushUnique(configured);
    }
    for (const m of discoveredList) {
      pushUnique(m);
    }
  } else {
    if (settings.routerModel?.trim()) {
      pushUnique(settings.routerModel);
    }
    for (const s of presetSuggestions) {
      pushUnique(s);
    }
  }

  return uniqueModelNames.slice(0, 500).map((modelId) => {
    const shortLabel =
      modelId.length > 22 ? `${modelId.slice(0, 21)}…` : modelId;
    const isFromDiscovery = discoveredList.includes(modelId);
    return {
      id: `${ROUTER_MODEL_PREFIX}${modelId}`,
      name: `${modelId} (${providerLabel})`,
      shortName: shortLabel,
      provider: providerLabel,
      priority: 0,
      category: 'router',
      description: isFromDiscovery
        ? `Model aktif terverifikasi langsung dari API Key Anda pada ${providerLabel}.`
        : `Contoh model / combo ${providerLabel} (klik Tes Koneksi di Pengaturan untuk memuat daftar model asli kunci Anda).`,
      maxPromptChars: 12000,
      timeoutMs: 42000,
      requiresKey: 'router',
      accent: modelId.startsWith('auto') || modelId.endsWith(':free') ? 'dual' : 'cyan',
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
