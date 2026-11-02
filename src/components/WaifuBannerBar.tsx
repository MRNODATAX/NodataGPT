import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Heart,
  Maximize2,
  Minimize2,
  Pencil,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_MIKU_AVATAR_URL,
  analyzeWaifuMoodAndAffection,
  resolveWaifuAvatarUrl,
} from '../services/waifuPresets';
import type { ChatMessage } from '../types/chat';
import type { WaifuProfile, WaifuScenarioPreset } from '../types/waifu';

export type WaifuBannerSizeMode = 'full' | 'mini' | 'micro';

const BANNER_MODE_STORAGE_KEY = 'nodatagpt.waifuBannerMode.v1';

function loadInitialBannerMode(): WaifuBannerSizeMode {
  if (typeof window === 'undefined') return 'mini';
  try {
    const saved = localStorage.getItem(BANNER_MODE_STORAGE_KEY);
    if (saved === 'full' || saved === 'mini' || saved === 'micro') {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  // Default to compact 'mini' pill on mobile screens so it never crowds the chat view
  return window.innerWidth < 640 ? 'mini' : 'full';
}

interface WaifuBannerBarProps {
  profile: WaifuProfile;
  messages: ChatMessage[];
  onOpenEditor: () => void;
  onSelectScenario: (preset: WaifuScenarioPreset) => void;
}

export function WaifuBannerBar({
  profile,
  messages,
  onOpenEditor,
  onSelectScenario,
}: WaifuBannerBarProps) {
  const [sizeMode, setSizeMode] = useState<WaifuBannerSizeMode>(() =>
    loadInitialBannerMode()
  );
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const mood = analyzeWaifuMoodAndAffection(messages);

  useEffect(() => {
    try {
      localStorage.setItem(BANNER_MODE_STORAGE_KEY, sizeMode);
    } catch {
      // Ignore storage write errors
    }
  }, [sizeMode]);

  const moodToneClasses: Record<string, string> = {
    shy: 'border-[#F472B6]/40 bg-[#F472B6]/12 text-[#FBCFE8]',
    happy: 'border-emerald-400/40 bg-emerald-400/12 text-emerald-200',
    pout: 'border-[#FB923C]/45 bg-[#FB923C]/14 text-[#FED7AA]',
    focused: 'border-[#22D3EE]/45 bg-[#22D3EE]/14 text-[#CFFAFE]',
    warm: 'border-amber-300/40 bg-amber-400/12 text-amber-100',
  };

  const moodDotClasses: Record<string, string> = {
    shy: 'bg-[#F472B6]',
    happy: 'bg-emerald-400',
    pout: 'bg-[#FB923C]',
    focused: 'bg-[#22D3EE]',
    warm: 'bg-amber-300',
  };

  const renderScenarioDropdown = () => {
    if (!scenarioMenuOpen || profile.scenarioPresets.length === 0) return null;
    return (
      <>
        <div
          aria-hidden="true"
          onClick={() => setScenarioMenuOpen(false)}
          className="fixed inset-0 z-30"
        />
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-white/14 bg-[#0B1221]/96 p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.68)] backdrop-blur-xl"
        >
          <div className="px-2.5 py-1.5 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Pilih Skenario Pembuka
          </div>
          {profile.scenarioPresets.map((preset) => {
            const isCurrent = preset.scenario === profile.scenario;
            return (
              <button
                key={preset.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setScenarioMenuOpen(false);
                  onSelectScenario(preset);
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border border-[#22D3EE]/35 bg-[#22D3EE]/12 text-white'
                    : 'text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="text-xs font-semibold">{preset.title}</span>
                <span className="line-clamp-2 text-[11px] leading-snug text-[#94A3B8]">
                  {preset.scenario}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  // Mode 3: Ultra-thin Micro Tab (almost zero vertical footprint)
  if (sizeMode === 'micro') {
    return (
      <div className="relative z-20 flex shrink-0 items-center justify-center px-3 pt-0.5 pb-1">
        <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/12 bg-[#07101E]/72 px-2 py-0.5 text-[10.5px] text-[#CBD5E1] shadow-sm backdrop-blur-md transition-all hover:border-[#22D3EE]/40 hover:bg-[#08101E]/92">
          <button
            type="button"
            onClick={() => setSizeMode('mini')}
            aria-label={`Tampilkan bar karakter ${profile.name}`}
            title="Klik untuk menampilkan bar ringkas"
            className="inline-flex min-w-0 items-center gap-1.5 py-0.5 text-left hover:text-white cursor-pointer"
          >
            <img
              src={resolveWaifuAvatarUrl(profile.avatarUrl)}
              alt=""
              width={16}
              height={16}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
              }}
              className="h-4 w-4 shrink-0 rounded-full border border-[#22D3EE]/45 object-cover"
            />
            <span className="max-w-[120px] truncate font-medium text-white/90">
              {profile.name}
            </span>
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                moodDotClasses[mood.id] || moodDotClasses.shy
              }`}
            />
            <ChevronDown className="h-3 w-3 shrink-0 text-[#94A3B8]" />
          </button>

          <span aria-hidden="true" className="h-3 w-px bg-white/12" />

          <button
            type="button"
            onClick={() => setSizeMode('full')}
            aria-label="Perluas penuh kartu karakter Waifu"
            title="Perluas kartu penuh"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-[#22D3EE] cursor-pointer"
          >
            <Maximize2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    );
  }

  // Mode 2: Compact Floating Pill (Minimized — sleek, doesn't cover chat thread)
  if (sizeMode === 'mini') {
    return (
      <div className="relative z-20 flex shrink-0 items-center justify-center px-3 pt-0.5 pb-1">
        <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#22D3EE]/26 bg-[#08101E]/88 px-2 py-1 text-[11.5px] shadow-[0_6px_20px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:gap-1.5 sm:px-2.5">
          <button
            type="button"
            onClick={() => setSizeMode('full')}
            aria-label={`Perluas kartu karakter ${profile.name}`}
            title={`${profile.name} · ${mood.label} (Klik untuk memperluas kartu)`}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-full pr-1 text-left transition-colors hover:text-white cursor-pointer"
          >
            <img
              src={resolveWaifuAvatarUrl(profile.avatarUrl)}
              alt={profile.name}
              width={22}
              height={22}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
              }}
              className="h-5.5 w-5.5 shrink-0 rounded-full border border-[#22D3EE]/50 object-cover"
            />
            <span className="max-w-[96px] truncate font-display text-xs font-bold text-white sm:max-w-[150px]">
              {profile.name}
            </span>
            <span
              title={`Mood: ${mood.label}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.2 text-[9.5px] font-medium ${
                moodToneClasses[mood.id] || moodToneClasses.shy
              }`}
            >
              <span className="max-w-[68px] truncate">{mood.label}</span>
            </span>
            {profile.affectionMeterEnabled && (
              <span
                title={`Kedekatan: Lv.${mood.affectionLevel} · ${mood.affectionLabel}`}
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-rose-400/30 bg-rose-500/12 px-1.5 py-0.2 font-mono-code text-[9.5px] font-semibold text-rose-200"
              >
                <Heart className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                <span>Lv.{mood.affectionLevel}</span>
              </span>
            )}
          </button>

          <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-white/12" />

          <div className="flex shrink-0 items-center gap-0.5">
            {profile.scenarioPresets.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScenarioMenuOpen((v) => !v)}
                  aria-expanded={scenarioMenuOpen}
                  aria-label="Pilih skenario awal"
                  title="Ganti skenario percakapan"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-[#22D3EE] cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#22D3EE]" />
                </button>
                {renderScenarioDropdown()}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenEditor}
              aria-label="Edit karakter Waifu"
              title="Edit karakter Waifu"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#FED7AA] transition-colors hover:bg-[#FB923C]/20 hover:text-white cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-[#FB923C]" />
            </button>

            <button
              type="button"
              onClick={() => setSizeMode('full')}
              aria-label="Perluas kartu karakter Waifu"
              title="Perluas kartu penuh"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setScenarioMenuOpen(false);
                setSizeMode('micro');
              }}
              aria-label="Sembunyikan kartu Waifu jadi tab tipis"
              title="Sembunyikan jadi tab tipis"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <EyeOff className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode 1: Full Card (with 1-click Minimize button)
  return (
    <div className="relative z-20 shrink-0 px-3 pt-0.5 pb-1.5 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 rounded-2xl border border-[#22D3EE]/22 bg-[#08101E]/88 px-3 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:gap-2.5 sm:px-4">
        {/* Left: Avatar + Identity + Live Mood/Affection */}
        <button
          type="button"
          onClick={onOpenEditor}
          aria-label={`Edit profil karakter ${profile.name}`}
          className="group flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer sm:gap-3"
        >
          <div className="relative shrink-0">
            <img
              src={resolveWaifuAvatarUrl(profile.avatarUrl)}
              alt={profile.name}
              width={38}
              height={38}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
              }}
              className="h-8.5 w-8.5 rounded-full border border-[#22D3EE]/45 object-cover shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-transform group-hover:scale-105 sm:h-9.5 sm:w-9.5"
            />
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#08101E] bg-emerald-400"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-display text-xs font-bold tracking-tight text-white sm:text-sm">
                {profile.name}
              </span>

              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  moodToneClasses[mood.id] || moodToneClasses.shy
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>{mood.label}</span>
              </span>

              {profile.affectionMeterEnabled && (
                <span
                  title={`Tingkat kedekatan: ${mood.affectionLabel} (${mood.affectionProgress}%)`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/12 px-2 py-0.5 font-mono-code text-[10px] font-semibold text-rose-200"
                >
                  <Heart className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                  <span>Lv.{mood.affectionLevel}</span>
                  <span className="hidden md:inline">· {mood.affectionLabel}</span>
                </span>
              )}
            </div>

            <p className="m-0 mt-0.5 truncate text-[11px] text-[#94A3B8]">
              {profile.tagline || profile.animeSource || 'Mode Chat Waifu Interaktif'}
            </p>
          </div>
        </button>

        {/* Right: Scenario Switcher + Edit Button + Minimize Controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {profile.scenarioPresets.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setScenarioMenuOpen((v) => !v)}
                aria-expanded={scenarioMenuOpen}
                aria-label="Pilih skenario awal"
                title="Pilih skenario percakapan"
                className="inline-flex min-h-[32px] items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:bg-white/[0.08] hover:text-white cursor-pointer sm:px-2.5"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span className="hidden sm:inline">Skenario</span>
                <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
              </button>

              {renderScenarioDropdown()}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenEditor}
            aria-label="Edit karakter Waifu"
            title="Edit karakter Waifu"
            className="inline-flex min-h-[32px] items-center gap-1 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-2 py-1 text-xs font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/70 hover:bg-[#FB923C]/22 hover:text-white cursor-pointer sm:gap-1.5 sm:px-2.5"
          >
            <Pencil className="h-3.5 w-3.5 text-[#FB923C]" />
            <span className="hidden xs:inline sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScenarioMenuOpen(false);
              setSizeMode('mini');
            }}
            aria-label="Minimize kartu karakter Waifu"
            title="Minimize kartu (mode pil ringkas)"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:bg-white/[0.08] hover:text-white cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setScenarioMenuOpen(false);
              setSizeMode('micro');
            }}
            aria-label="Lipat kartu Waifu ke atas"
            title="Lipat ke atas (tab tipis)"
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#94A3B8] transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:inline-flex cursor-pointer"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
