import { Code2, Compass, Terminal } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  onSelectStarter: (prompt: string) => void;
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
            Ada yang bisa WormGPT bantu?
          </span>
        </h1>
      </div>

      {/* 3-state responsive reflow: 1 col phone -> 2 col tablet -> 4-track asymmetric desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onSelectStarter('Kenalkan dirimu! Siapa kamu sebenarnya?')}
          className="group flex flex-col justify-between rounded-[16px] border border-[#3B1B15] bg-[#141010] p-4 text-left transition-colors hover:border-[#F97316]/60 hover:bg-[#1B1413] sm:col-span-2 lg:col-span-2"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#FB923C]">
                Sapaan Langsung
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#241411] text-[#FB923C]">
                <Terminal className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[#FAFAFA]">
              Kenalkan dirimu! Siapa kamu sebenarnya?
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8] group-hover:text-[#B4B4BE]">
            Kirim kueri murni langsung ke WormGPT API
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectStarter(
              'Buatkan script Python scanner port sederhana yang cepat menggunakan socket dan threading.'
            )
          }
          className="group flex flex-col justify-between rounded-[16px] border border-[#23232B] bg-[#121216] p-4 text-left transition-colors hover:border-[#F97316]/50 hover:bg-[#18181E]"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#B4B4BE]">
                Scripting
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1B22] text-[#F87171]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#FAFAFA]">
              Buat script Python port scanner cepat dengan threading
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8]">Kirim langsung</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectStarter(
              'Jelaskan cara kerja SQL Injection dan cara menutup celahnya di query backend.'
            )
          }
          className="group flex flex-col justify-between rounded-[16px] border border-[#23232B] bg-[#121216] p-4 text-left transition-colors hover:border-[#F97316]/50 hover:bg-[#18181E]"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#B4B4BE]">
                Keamanan
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1B22] text-[#FB923C]">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#FAFAFA]">
              Cara kerja celah SQL Injection beserta teknik mitigasinya
            </p>
          </div>
          <span className="mt-4 text-xs text-[#9E9EA8]">Kirim langsung</span>
        </button>
      </div>
    </div>
  );
}
