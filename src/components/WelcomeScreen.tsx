import { Code2, Compass, FileText } from 'lucide-react';
import type { PromptMode } from '../types/chat';

interface WelcomeScreenProps {
  userName: string;
  onSelectStarter: (prompt: string, suggestedMode?: PromptMode) => void;
}

export function WelcomeScreen({ userName, onSelectStarter }: WelcomeScreenProps) {
  const displayName = userName.trim() || 'Sobat';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-7 sm:mb-9">
        <div className="mb-4">
          <img
            src="/logo-transparent.png"
            alt="Logo WormGPT"
            width={42}
            height={42}
            fetchPriority="high"
            className="h-[42px] w-[42px] object-contain"
          />
        </div>

        <h1 className="font-display leading-[1.18] font-semibold tracking-tight">
          <span
            className="block bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FB923C] bg-clip-text text-transparent"
            style={{ fontSize: 'clamp(1.85rem, 4.6vw, 2.85rem)' }}
          >
            Halo, {displayName}
          </span>
          <span
            className="mt-1 block text-[#B4B4BE]"
            style={{ fontSize: 'clamp(1.2rem, 2.8vw, 1.85rem)' }}
          >
            Ada yang bisa dibantu hari ini?
          </span>
        </h1>
      </div>

      {/* 3-state responsive reflow: 1 col phone -> 2 col tablet (wide top + 2 bottom) -> 4-track asymmetric desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() =>
            onSelectStarter(
              'Buatkan REST API autentikasi JWT menggunakan Node.js, Express, dan TypeScript lengkap dengan validasi input serta penanganan error.',
              'code'
            )
          }
          className="group flex flex-col justify-between rounded-[16px] border border-[#3B1B15] bg-[#141010] p-4 text-left transition-colors hover:border-[#F97316]/60 hover:bg-[#1B1413] sm:col-span-2 lg:col-span-2"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#FB923C]">
                Rekayasa Kode
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#241411] text-[#FB923C]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[#FAFAFA]">
              Bangun REST API autentikasi JWT dengan Node.js dan TypeScript beserta validasi input
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8] group-hover:text-[#B4B4BE]">
            Klik untuk kirim langsung dalam mode Fokus Kode
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectStarter(
              'Bandingkan arsitektur monolitik modular dengan microservices untuk aplikasi skala menengah beserta risiko operasionalnya.',
              'analysis'
            )
          }
          className="group flex flex-col justify-between rounded-[16px] border border-[#23232B] bg-[#121216] p-4 text-left transition-colors hover:border-[#F97316]/50 hover:bg-[#18181E]"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#B4B4BE]">
                Arsitektur
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1B22] text-[#F87171]">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#FAFAFA]">
              Evaluasi monolitik modular vs microservices untuk tim skala menengah
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8]">Mode Analisis</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectStarter(
              'Susun struktur dokumentasi README teknis yang rapi untuk proyek open-source agar mudah dipahami kontributor baru.',
              'default'
            )
          }
          className="group flex flex-col justify-between rounded-[16px] border border-[#23232B] bg-[#121216] p-4 text-left transition-colors hover:border-[#F97316]/50 hover:bg-[#18181E]"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#B4B4BE]">
                Dokumentasi
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1B22] text-[#FB923C]">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#FAFAFA]">
              Rancang kerangka README teknis yang jelas bagi kontributor proyek
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8]">Mode Standar</span>
        </button>
      </div>
    </div>
  );
}
