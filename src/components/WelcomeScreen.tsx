import { Calculator, Code2, ImageIcon, Layers, Sparkles } from 'lucide-react';
import type { AIModelDefinition } from '../types/chat';

interface WelcomeScreenProps {
  activeModel: AIModelDefinition;
  autoFallback: boolean;
  healthyCount: number;
  onSelectStarter: (prompt: string, imageMode?: boolean) => void;
  onOpenModelPicker: () => void;
}

interface StarterItem {
  id: string;
  shortLabel: string;
  title: string;
  prompt: string;
  tag: string;
  imageMode?: boolean;
  accent: 'cyan' | 'orange';
  icon: typeof Code2;
}

const STARTERS: StarterItem[] = [
  {
    id: 'code',
    shortLabel: 'Tulis & Debug Kode',
    title: 'Bangun REST API & autentikasi JWT',
    prompt:
      'Buatkan contoh kode REST API autentikasi JWT di Node.js dengan struktur bersih dan penanganan error yang rapi.',
    tag: 'Kode',
    accent: 'cyan',
    icon: Code2,
  },
  {
    id: 'research',
    shortLabel: 'Analisis & Ide',
    title: 'Bandingkan arsitektur aplikasi modern',
    prompt:
      'Jelaskan perbandingan kelebihan dan kekurangan PostgreSQL vs MongoDB untuk aplikasi skala menengah beserta kapan harus memilihnya.',
    tag: 'Analisis',
    accent: 'orange',
    icon: Sparkles,
  },
  {
    id: 'image',
    shortLabel: 'Buat Gambar AI',
    title: 'Ilustrasi futuristik siber kota malam',
    prompt:
      'Futuristic cyberpunk Jakarta skyline at night with glowing cyan and orange neon lights, ultra detailed digital art',
    tag: 'Gambar AI',
    imageMode: true,
    accent: 'orange',
    icon: ImageIcon,
  },
  {
    id: 'math',
    shortLabel: 'Hitung & Logika',
    title: 'Selesaikan soal matematika langkah demi langkah',
    prompt:
      'Jelaskan langkah demi langkah cara mencari turunan dan titik ekstrem dari fungsi f(x) = x^3 - 6x^2 + 9x + 2.',
    tag: 'Matematika',
    accent: 'cyan',
    icon: Calculator,
  },
];

export function WelcomeScreen({
  activeModel,
  autoFallback,
  healthyCount,
  onSelectStarter,
  onOpenModelPicker,
}: WelcomeScreenProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-10">
      {/* Hero Identity */}
      <div className="mb-5 flex flex-col items-center text-center sm:mb-9 sm:items-start sm:text-left">
        <div className="mb-3.5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1C2433] bg-black p-1.5 shadow-sm sm:h-14 sm:w-14">
            <img
              src="/logo-transparent.png"
              alt="Ikon NodataGPT"
              width={44}
              height={44}
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
          </div>
          <button
            type="button"
            onClick={onOpenModelPicker}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-[#1C2433] bg-[#10141D] px-3.5 py-1.5 text-xs font-medium text-[#B6C0D0] transition-colors hover:border-[#293548] hover:text-white cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>{activeModel.shortName}</span>
            <span className="text-[#293548]">•</span>
            <span className={autoFallback ? 'text-[#FB923C]' : 'text-[#9BA6B8]'}>
              {autoFallback ? `${healthyCount} server siaga` : 'Mode tunggal'}
            </span>
          </button>
        </div>

        <h1 className="font-display text-[24px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Halo, mau bahas apa di{' '}
          <span className="text-[#22D3EE]">Nodata</span>
          <span className="text-[#FB923C]">GPT</span>?
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#B6C0D0] sm:mt-2.5 sm:text-base">
          Terhubung ke puluhan model AI dengan pengalihan otomatis saat server sibuk.
        </p>
      </div>

      {/* MOBILE (< sm): Clean 2x2 Compact Action Chips (Fits 100% in single mobile viewport) */}
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
              onClick={() => onSelectStarter(item.prompt, item.imageMode)}
              className="flex min-h-[68px] flex-col justify-between rounded-2xl border border-[#1C2433] bg-[#10141D] p-3 text-left transition-colors active:bg-[#171D29] cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                    isCyan
                      ? 'bg-[#22D3EE]/12 text-[#22D3EE]'
                      : 'bg-[#FB923C]/12 text-[#FB923C]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-mono-code text-[10px] font-medium text-[#9BA6B8]">
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

      {/* DESKTOP & TABLET (>= sm): Full Gemini Structured Cards */}
      <div
        aria-label="Contoh topik percakapan"
        className="hidden sm:grid sm:grid-cols-2 sm:gap-3"
      >
        {STARTERS.map((item) => {
          const Icon = item.icon;
          const isCyan = item.accent === 'cyan';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStarter(item.prompt, item.imageMode)}
              className="group flex min-h-[104px] flex-col justify-between rounded-2xl border border-[#1C2433] bg-[#10141D] p-4 text-left transition-colors duration-150 hover:border-[#293548] hover:bg-[#171D29] cursor-pointer"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono-code text-[11px] font-medium ${
                    isCyan
                      ? 'bg-[#22D3EE]/12 text-[#22D3EE]'
                      : 'bg-[#FB923C]/12 text-[#FB923C]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.tag}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium leading-snug text-[#FAFAFA] group-hover:text-white">
                {item.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
