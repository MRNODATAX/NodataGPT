import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
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

export type WaifuCardMode = 'docked' | 'compact' | 'expanded';

export const WAIFU_CARD_MODE_STORAGE_KEY = 'nodatagpt.waifuCardDock.v2';

export function loadInitialWaifuCardMode(): WaifuCardMode {
  if (typeof window === 'undefined') return 'docked';
  try {
    const saved = localStorage.getItem(WAIFU_CARD_MODE_STORAGE_KEY);
    if (saved === 'docked' || saved === 'compact' || saved === 'expanded') {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  // Default to zero-obstruction inline 'docked' mode on mobile (<768px) and sleek 'compact' bar on desktop
  return window.innerWidth < 768 ? 'docked' : 'compact';
}

export function saveWaifuCardMode(mode: WaifuCardMode): void {
  try {
    localStorage.setItem(WAIFU_CARD_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage write errors
  }
}

interface WaifuInlineDockedPillProps {
  profile: WaifuProfile;
  messages: ChatMessage[];
  allWaifuMessageLists?: ChatMessage[][];
  onExpandCard: () => void;
  onOpenEditor: () => void;
}

export function WaifuInlineDockedPill({
  profile,
  messages,
  allWaifuMessageLists,
  onExpandCard,
  onOpenEditor,
}: WaifuInlineDockedPillProps) {
  const mood = analyzeWaifuMoodAndAffection(messages, allWaifuMessageLists);
  const shortName = profile.name.trim().split(/\s+/)[0] || profile.name;

  const moodDotClasses: Record<string, string> = {
    shy: 'bg-[#F472B6]',
    happy: 'bg-emerald-400',
    pout: 'bg-[#FB923C]',
    focused: 'bg-[#22D3EE]',
    warm: 'bg-amber-300',
  };

  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#F472B6]/35 bg-[#120A18]/92 p-0.5 pl-1 pr-1.5 text-[11px] text-[#F8FAFC] shadow-[0_6px_20px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <button
        type="button"
        onClick={onExpandCard}
        title={`${profile.name} · Lv.${mood.affectionLevel} (${mood.currentLevelExp}/${mood.nextLevelExp} EXP) — Klik untuk membuka kartu Waifu`}
        aria-label={`Buka kartu karakter ${profile.name}`}
        className="group inline-flex min-w-0 items-center gap-1.5 rounded-full px-1 py-0.5 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
      >
        <div className="relative h-5 w-5 shrink-0">
          <img
            src={resolveWaifuAvatarUrl(profile.avatarUrl)}
            alt={profile.name}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== DEFAULT_MIKU_AVATAR_URL) {
                img.src = DEFAULT_MIKU_AVATAR_URL;
              }
            }}
            className="h-5 w-5 rounded-full border border-[#F472B6]/45 object-cover"
          />
          <span
            aria-hidden="true"
            className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full ring-1 ring-[#120A18] ${moodDotClasses[mood.id] || 'bg-[#F472B6]'}`}
          />
        </div>

        <span className="max-w-[72px] truncate font-semibold text-white sm:max-w-[120px]">
          {shortName}
        </span>

        {profile.affectionMeterEnabled && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F472B6]/15 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#F9A8D4]">
            <span>Lv.{mood.affectionLevel}</span>
            <span className="hidden text-[#CBD5E1] sm:inline">
              · {mood.currentLevelExp}/{mood.nextLevelExp} EXP
            </span>
          </span>
        )}

        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-[#CBD5E1] transition-colors group-hover:bg-[#22D3EE]/18 group-hover:text-[#67E8F9]">
          <span>Kartu</span>
          <ChevronDown className="h-3 w-3" />
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenEditor}
        title="Edit Karakter Waifu"
        aria-label="Edit Karakter Waifu"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-[#22D3EE]/16 hover:text-[#67E8F9] cursor-pointer"
      >
        <Pencil className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

interface WaifuBannerBarProps {
  profile: WaifuProfile;
  messages: ChatMessage[];
  allWaifuMessageLists?: ChatMessage[][];
  mode: WaifuCardMode;
  onChangeMode: (nextMode: WaifuCardMode) => void;
  onOpenEditor: () => void;
  onSelectScenario: (preset: WaifuScenarioPreset) => void;
}

export function WaifuBannerBar({
  profile,
  messages,
  allWaifuMessageLists,
  mode,
  onChangeMode,
  onOpenEditor,
  onSelectScenario,
}: WaifuBannerBarProps) {
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  if (mode === 'docked') {
    return null;
  }

  const mood = analyzeWaifuMoodAndAffection(messages, allWaifuMessageLists);

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

  // =========================================================================
  // COMPACT MODE ('compact'): Sleek 1-line adjustable bar with EXP + Minimize
  // =========================================================================
  if (mode === 'compact') {
    return (
      <div className="relative z-20 shrink-0 px-3 pt-1 pb-1.5">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#090F1C]/90 px-2.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          {/* Left: Avatar + Name + Mood + Live EXP Progress */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeMode('expanded')}
              title="Klik untuk membuka detail kartu Waifu"
              className="relative h-7 w-7 shrink-0 cursor-pointer"
            >
              <img
                src={resolveWaifuAvatarUrl(profile.avatarUrl)}
                alt={profile.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== DEFAULT_MIKU_AVATAR_URL) {
                    img.src = DEFAULT_MIKU_AVATAR_URL;
                  }
                }}
                className="h-7 w-7 rounded-full border border-[#F472B6]/40 object-cover"
              />
              <span
                aria-hidden="true"
                className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#090F1C] ${moodDotClasses[mood.id] || 'bg-[#F472B6]'}`}
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-bold text-white">
                  {profile.name}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${moodToneClasses[mood.id] || moodToneClasses.shy}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {mood.label}
                </span>

                {profile.affectionMeterEnabled && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#F472B6]/30 bg-[#F472B6]/10 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#F9A8D4]">
                    <Heart className="h-2.5 w-2.5 fill-[#F472B6] text-[#F472B6]" />
                    <span>Lv.{mood.affectionLevel}</span>
                    <span className="text-[#E2E8F0]">
                      {mood.currentLevelExp}/{mood.nextLevelExp} EXP
                    </span>
                    {mood.lastGainExp > 0 && (
                      <span className="text-emerald-300">+{mood.lastGainExp}</span>
                    )}
                  </span>
                )}
              </div>

              {profile.affectionMeterEnabled && (
                <div className="mt-1 flex max-w-[230px] items-center gap-1.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#F472B6] to-[#FB923C] transition-all duration-500"
                      style={{ width: `${mood.affectionProgress}%` }}
                    />
                  </div>
                  <span className="font-mono-code text-[9.5px] text-[#94A3B8]">
                    {mood.affectionLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Scenario + Edit + Detail + Minimize */}
          <div className="flex shrink-0 items-center gap-1">
            {profile.scenarioPresets.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScenarioMenuOpen((v) => !v)}
                  title="Ganti Skenario"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <BookOpen className="h-3 w-3 text-[#22D3EE]" />
                  <span className="hidden sm:inline">Skenario</span>
                </button>
                {renderScenarioDropdown()}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenEditor}
              title="Edit Karakter Waifu"
              className="inline-flex items-center gap-1 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-2 py-1 text-[10.5px] font-semibold text-[#67E8F9] transition-colors hover:border-[#22D3EE]/55 hover:bg-[#22D3EE]/18 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('expanded')}
              title="Perbesar tampilan detail kartu Waifu"
              aria-label="Perbesar kartu Waifu"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden md:inline">Detail</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('docked')}
              title="Minimize kartu ke samping Akses VIP agar tidak menutupi chat"
              aria-label="Minimize kartu Waifu"
              className="inline-flex items-center gap-1 rounded-lg border border-[#FB923C]/35 bg-[#FB923C]/12 px-2 py-1 text-[10.5px] font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/60 hover:bg-[#FB923C]/20 cursor-pointer"
            >
              <ChevronUp className="h-3 w-3" />
              <span>Minimize</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EXPANDED MODE ('expanded'): Full Character Card + RPG EXP Progress Bar
  // =========================================================================
  return (
    <div className="relative z-20 shrink-0 px-3 pt-1 pb-2">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/12 bg-gradient-to-r from-[#0B1220]/95 via-[#0F1628]/95 to-[#140F1F]/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          {/* Avatar + Character Bio */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onOpenEditor}
              title="Klik untuk mengedit profil Waifu"
              className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[#22D3EE]/35 bg-[#0F172A] shadow-[0_0_18px_rgba(34,211,238,0.16)] cursor-pointer"
            >
              <img
                src={resolveWaifuAvatarUrl(profile.avatarUrl)}
                alt={profile.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== DEFAULT_MIKU_AVATAR_URL) {
                    img.src = DEFAULT_MIKU_AVATAR_URL;
                  }
                }}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm font-bold tracking-tight text-white">
                  {profile.name}
                </h2>
                {profile.animeSource && (
                  <span className="truncate rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8]">
                    {profile.animeSource}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${moodToneClasses[mood.id] || moodToneClasses.shy}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {mood.label}
                </span>
              </div>

              <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#94A3B8]">
                {profile.tagline}
              </p>
            </div>
          </div>

          {/* Action Controls: Scenario + Edit + Ringkas + Minimize */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {profile.scenarioPresets.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScenarioMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#22D3EE]" />
                  <span>Skenario</span>
                  <ChevronDown className="h-3 w-3 opacity-75" />
                </button>
                {renderScenarioDropdown()}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2.5 py-1.5 text-[11px] font-semibold text-[#67E8F9] transition-colors hover:border-[#22D3EE]/60 hover:bg-[#22D3EE]/20 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('compact')}
              title="Ubah ke baris ringkas"
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Ringkas</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('docked')}
              title="Minimize kartu ke baris Akses VIP di atas"
              className="inline-flex items-center gap-1 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-2.5 py-1.5 text-[11px] font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/65 hover:bg-[#FB923C]/22 cursor-pointer"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Minimize</span>
            </button>
          </div>
        </div>

        {/* RPG EXP Leveling Bar */}
        {profile.affectionMeterEnabled && (
          <div className="mt-2.5 rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="inline-flex items-center gap-1.5 font-semibold text-white">
                <Heart className="h-3.5 w-3.5 fill-[#F472B6] text-[#F472B6]" />
                <span>
                  Afeksi Lv.{mood.affectionLevel} · {mood.affectionLabel}
                </span>
                {mood.lastGainExp > 0 && (
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/12 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-emerald-300">
                    +{mood.lastGainExp} EXP
                  </span>
                )}
              </div>

              <div className="font-mono-code text-[10.5px] text-[#CBD5E1]">
                <span className="font-bold text-[#F9A8D4]">
                  {mood.currentLevelExp}
                </span>
                <span className="text-[#94A3B8]">
                  {' '}
                  / {mood.nextLevelExp} EXP ({mood.affectionProgress}%)
                </span>
                <span className="hidden text-[#64748B] sm:inline">
                  {' '}
                  · Total {mood.totalExp} EXP
                </span>
              </div>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#F472B6] to-[#FB923C] transition-all duration-500"
                style={{ width: `${mood.affectionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
