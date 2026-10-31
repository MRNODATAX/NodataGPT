import {
  ArrowUpRight,
  BrainCircuit,
  Calculator,
  Code2,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { ToolsIcon } from './ToolsIcon';
import type { AIModelDefinition } from '../types/chat';
import { IMAGE_ENGINES } from '../services/modelCatalog';

interface WelcomeScreenProps {
  activeModel: AIModelDefinition;
  autoFallback: boolean;
  healthyCount: number;
  deepThink: boolean;
  imageMode: boolean;
  onToggleDeepThink: () => void;
  onToggleImageMode: () => void;
  onSelectModelDirect: (modelId: string) => void;
  onSelectStarter: (
    prompt: string,
    options?: { imageMode?: boolean; deepThink?: boolean }
  ) => void;
  onOpenModelPicker: () => void;
  onOpenToolsStudio: () => void;
}

interface StarterItem {
  id: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  prompt: string;
  tag: string;
  imageMode?: boolean;
  deepThink?: boolean;
  accent: 'cyan' | 'orange';
  icon: typeof Code2;
}

const STARTERS: StarterItem[] = [
  {
    id: 'code',
    shortLabel: 'Kode & Artifact UI',
    title: 'Buat komponen UI interaktif siap pratinjau',
    subtitle: 'Mendukung pratinjau HTML/SVG langsung di chat',
    prompt:
      'Buatkan satu halaman HTML + CSS modern berupa kalkulator interaktif bertema gelap futuristik cyan dan oranye lengkap dalam satu blok kode html.',
    tag: 'Artifact',
    accent: 'cyan',
    icon: Code2,
  },
  {
    id: 'deepthink',
    shortLabel: 'Penalaran DeepThink',
    title: 'Bedah arsitektur sistem & solusi mendalam',
    subtitle: 'Rantai penalaran DeepSeek & Claude Sonnet',
    prompt:
      'Analisis arsitektur terbaik untuk aplikasi chat real-time skala 100 ribu pengguna aktif, mulai dari WebSocket gateway, database, hingga strategi caching.',
    tag: 'DeepThink',
    deepThink: true,
    accent: 'orange',
    icon: BrainCircuit,
  },
  {
    id: 'image',
    shortLabel: 'Buat Gambar AI',
    title: 'Visualisasikan ide menjadi karya gambar AI',
    subtitle: `${IMAGE_ENGINES.length} mesin gambar AI pilihan + Auto-Fallback otomatis`,
    prompt:
      'Cinematic anime night sky over futuristic Tokyo rooftop with shooting stars, glowing cyan and warm orange city lights, masterpiece 4k',
    tag: 'Gambar AI',
    imageMode: true,
    accent: 'orange',
    icon: ImageIcon,
  },
  {
    id: 'math',
    shortLabel: 'Riset & Matematika',
    title: 'Selesaikan perhitungan & logika bertahap',
    subtitle: 'Penjelasan rumus rapi langkah demi langkah',
    prompt:
      'Jelaskan langkah demi langkah cara mencari turunan dan titik ekstrem dari fungsi f(x) = x^3 - 6x^2 + 9x + 2 beserta kesimpulannya.',
    tag: 'Logika',
    accent: 'cyan',
    icon: Calculator,
  },
];

export function WelcomeScreen({
  deepThink,
  imageMode,
  onToggleDeepThink,
  onToggleImageMode,
  onSelectModelDirect,
  onSelectStarter,
  onOpenToolsStudio,
}: WelcomeScreenProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-4 sm:px-6 sm:py-9">
      {/* Minimalist Hero Greeting Stage */}
      <div className="mb-5 flex flex-col items-center text-center sm:mb-7 sm:items-start sm:text-left">
        <h1 className="font-display text-[26px] font-bold leading-[1.2] tracking-tight text-white sm:text-[38px]">
          <span className="nd-hero-gradient">Jelajahi ide tanpa batas</span>{' '}
          <span className="block sm:inline">
            di <span className="text-[#22D3EE]">Nodata</span>
            <span className="text-[#FB923C]">GPT</span>
          </span>
        </h1>

        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#CBD5E1] sm:mt-2.5 sm:text-[15px]">
          Ruang percakapan multi-model dengan penalaran DeepThink, pratinjau kode live, dan pengalihan server otomatis.
        </p>

        {/* Quick Capability Mode Pills (Scrollbar hidden for sleek minimalist look) */}
        <div
          aria-label="Mode kemampuan cepat"
          className="mt-4 flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={onToggleDeepThink}
            aria-pressed={deepThink}
            className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
              deepThink
                ? 'border-[#22D3EE]/70 bg-[#22D3EE]/18 text-[#67E8F9] shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:text-white'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>DeepThink</span>
          </button>

          <button
            type="button"
            onClick={onToggleImageMode}
            aria-pressed={imageMode}
            className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
              imageMode
                ? 'border-[#FB923C]/70 bg-[#FB923C]/18 text-[#FDBA74] shadow-[0_0_16px_rgba(251,146,60,0.2)]'
                : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#FB923C]" />
            <span>Buat Gambar</span>
          </button>

          <button
            type="button"
            onClick={onOpenToolsStudio}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-3 py-1 text-xs font-medium text-[#CFFAFE] backdrop-blur-md transition-all hover:border-[#22D3EE]/65 hover:text-white cursor-pointer"
          >
            <ToolsIcon className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>Tools Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModelDirect('qwen3')}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#CBD5E1] backdrop-blur-md transition-all hover:border-[#22D3EE]/40 hover:text-white cursor-pointer"
          >
            <Code2 className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>Qwen3 Coder</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModelDirect('varhad-claude')}
            className="hidden min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#CBD5E1] backdrop-blur-md transition-all hover:border-[#FB923C]/40 hover:text-white sm:inline-flex cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FB923C]" />
            <span>Claude Sonnet</span>
          </button>
        </div>
      </div>

      {/* MOBILE (< sm): Compact 2x2 Frosted Glass Cards (Fits cleanly in single mobile screen) */}
      <div
        aria-label="Ide percakapan cepat"
        className="grid grid-cols-2 gap-2.5 sm:hidden"
      >
        {STARTERS.map((item) => {
          const Icon = item.icon;
          const isCyan = item.accent === 'cyan';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onSelectStarter(item.prompt, {
                  imageMode: item.imageMode,
                  deepThink: item.deepThink,
                })
              }
              className={`nd-glass-card flex min-h-[76px] flex-col justify-between rounded-2xl p-3 text-left cursor-pointer ${
                !isCyan ? 'nd-glass-card-orange' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                    isCyan
                      ? 'border-[#22D3EE]/30 bg-[#22D3EE]/14 text-[#22D3EE]'
                      : 'border-[#FB923C]/30 bg-[#FB923C]/14 text-[#FB923C]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-mono-code text-[10px] font-medium text-[#94A3B8]">
                  {item.tag}
                </span>
              </div>
              <span className="mt-2 line-clamp-1 text-[13px] font-semibold text-white">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* DESKTOP & TABLET (>= sm): Dimensional Cosmic Glass Cards */}
      <div
        aria-label="Contoh topik percakapan"
        className="hidden sm:grid sm:grid-cols-2 sm:gap-3.5"
      >
        {STARTERS.map((item) => {
          const Icon = item.icon;
          const isCyan = item.accent === 'cyan';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onSelectStarter(item.prompt, {
                  imageMode: item.imageMode,
                  deepThink: item.deepThink,
                })
              }
              className={`nd-glass-card group flex min-h-[116px] flex-col justify-between rounded-2xl p-4 text-left cursor-pointer ${
                !isCyan ? 'nd-glass-card-orange' : ''
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono-code text-[11px] font-semibold ${
                    isCyan
                      ? 'border-[#22D3EE]/28 bg-[#22D3EE]/12 text-[#22D3EE]'
                      : 'border-[#FB923C]/28 bg-[#FB923C]/12 text-[#FB923C]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.tag}
                </span>

                <ArrowUpRight className="h-4 w-4 text-[#94A3B8] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </div>

              <div className="mt-3">
                <p className="text-[14.5px] font-semibold leading-snug text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-[#94A3B8]">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
