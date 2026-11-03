import { useState } from 'react';
import {
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Heart,
  Maximize2,
  Minimize2,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { isMikuCharacterProfile } from '../services/waifuExpressions';
import {
  DEFAULT_MIKU_AVATAR_URL,
  analyzeWaifuMoodAndAffection,
  isCasualAyangScenario,
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

  const moodDotClasses: Record<string, string> = {
    shy: 'bg-[#F472B6]',
    happy: 'bg-emerald-400',
    pout: 'bg-[#FB923C]',
    focused: 'bg-[#22D3EE]',
    warm: 'bg-amber-300',
  };

  return (
    <div className="inline-flex max-w-[calc(100vw-24px)] flex-nowrap items-center gap-1 rounded-full border border-[#F472B6]/35 bg-[#110A19]/92 p-0.5 pl-1 pr-1.5 text-[11px] text-[#F8FAFC] shadow-[0_6px_18px_rgba(0,0,0,0.42)] backdrop-blur-md">
      <button
        type="button"
        onClick={onExpandCard}
        title={`${profile.name} · Lv.${mood.affectionLevel} (${mood.currentLevelExp}/${mood.nextLevelExp} EXP) — Klik untuk membuka kartu Waifu`}
        aria-label={`Buka kartu karakter ${profile.name}`}
        className="group inline-flex min-w-0 flex-nowrap items-center gap-1.5 rounded-full px-1 py-0.5 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
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
            className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full ring-1 ring-[#110A19] ${moodDotClasses[mood.id] || 'bg-[#F472B6]'}`}
          />
        </div>

        <span className="max-w-[105px] truncate font-semibold text-white sm:max-w-[140px]">
          {profile.name}
        </span>

        {profile.affectionMeterEnabled && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F472B6]/15 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#F9A8D4]">
            <span>Lv.{mood.affectionLevel}</span>
            <span className="text-[#CBD5E1]">
              · {mood.currentLevelExp}/{mood.nextLevelExp}
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
  onOpenScenarioBubble?: () => void;
  onToggleExpressions?: () => void;
}

export function WaifuBannerBar({
  profile,
  messages,
  allWaifuMessageLists,
  mode,
  onChangeMode,
  onOpenEditor,
  onSelectScenario,
  onOpenScenarioBubble,
  onToggleExpressions,
}: WaifuBannerBarProps) {
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  if (mode === 'docked') {
    return null;
  }

  const mood = analyzeWaifuMoodAndAffection(messages, allWaifuMessageLists);
  const supportsExpressionPack = isMikuCharacterProfile(profile);
  const photosEnabled = profile.expressionImagesEnabled !== false;

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
          className="absolute top-full left-0 right-0 z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-white/14 bg-[#0B1221]/98 p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.72)] backdrop-blur-xl sm:right-auto sm:w-80"
        >
          <div className="px-2.5 py-1.5 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Mode Chat Ayang & Skenario
          </div>
          {profile.scenarioPresets.map((preset) => {
            const isCurrent = preset.scenario === profile.scenario;
            const isCasual = isCasualAyangScenario(preset.scenario);
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{preset.title}</span>
                  {isCasual && (
                    <span className="rounded-full border border-[#22D3EE]/40 bg-[#22D3EE]/15 px-1.5 py-0.2 text-[9px] font-bold uppercase text-[#67E8F9]">
                      Default
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-[11px] leading-snug text-[#94A3B8]">
                  {preset.shortHint || preset.scenario}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  // =========================================================================
  // COMPACT MODE ('compact'): Strict single-row layout (zero flex-wrap mess!)
  // =========================================================================
  if (mode === 'compact') {
    return (
      <div className="relative z-20 shrink-0 px-2.5 pt-1 pb-1 sm:px-4">
        <div className="mx-auto flex max-w-3xl flex-nowrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#080E1B]/92 px-2.5 py-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:px-3">
          {/* Left: Avatar + 2-micro-line Name & EXP bar */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChangeMode('expanded')}
              title="Klik untuk membuka detail kartu Waifu"
              className="relative h-8 w-8 shrink-0 cursor-pointer"
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
                className="h-8 w-8 rounded-xl border border-[#F472B6]/40 object-cover"
              />
              <span
                aria-hidden="true"
                className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#080E1B] ${moodDotClasses[mood.id] || 'bg-[#F472B6]'}`}
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-nowrap items-center gap-1.5">
                <span className="truncate text-xs font-bold text-white sm:text-[13px]">
                  {profile.name}
                </span>

                <span
                  className={`hidden shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium md:inline-flex ${moodToneClasses[mood.id] || moodToneClasses.shy}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {mood.label}
                </span>

                {profile.affectionMeterEnabled && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#F472B6]/30 bg-[#F472B6]/12 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#F9A8D4]">
                    <Heart className="h-2.5 w-2.5 fill-[#F472B6] text-[#F472B6]" />
                    <span>Lv.{mood.affectionLevel}</span>
                    {mood.lastGainExp > 0 && (
                      <span className="text-emerald-300">+{mood.lastGainExp}</span>
                    )}
                  </span>
                )}
              </div>

              {profile.affectionMeterEnabled ? (
                <div className="mt-1 flex flex-nowrap items-center gap-2">
                  <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-white/10 sm:w-28">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#F472B6] to-[#FB923C] transition-all duration-500"
                      style={{ width: `${mood.affectionProgress}%` }}
                    />
                  </div>
                  <span className="truncate font-mono-code text-[10px] text-[#94A3B8]">
                    {mood.currentLevelExp}/{mood.nextLevelExp} EXP
                    <span className="hidden sm:inline"> · {mood.affectionLabel}</span>
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 truncate text-[10.5px] text-[#94A3B8]">
                  {mood.label} · {profile.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Right: Clean uniform 32px controls (never wraps!) */}
          <div className="flex shrink-0 items-center gap-1">
            {supportsExpressionPack && onToggleExpressions && (
              <button
                type="button"
                onClick={onToggleExpressions}
                title={
                  photosEnabled
                    ? 'Foto ekspresi Miku aktif (klik untuk matikan)'
                    : 'Foto ekspresi Miku nonaktif (klik untuk aktifkan)'
                }
                aria-label="Toggle foto ekspresi Waifu"
                className={`hidden h-8 items-center gap-1 rounded-xl border px-2.5 text-[11px] font-semibold transition-colors sm:inline-flex cursor-pointer ${
                  photosEnabled
                    ? 'border-emerald-400/35 bg-emerald-400/12 text-emerald-200 hover:border-emerald-400/60'
                    : 'border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-white'
                }`}
              >
                <Camera className="h-3.5 w-3.5 shrink-0" />
                <span>Foto {photosEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {profile.scenarioPresets.length > 0 && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenScenarioBubble) {
                      onOpenScenarioBubble();
                    } else {
                      setScenarioMenuOpen((v) => !v);
                    }
                  }}
                  title="Pilih atau Edit Skenario Baru"
                  className="inline-flex h-8 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#22D3EE]" />
                  <span>Skenario</span>
                </button>
                {!onOpenScenarioBubble && renderScenarioDropdown()}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenEditor}
              title="Edit Karakter Waifu"
              aria-label="Edit Karakter Waifu"
              className="inline-flex h-8 w-8 items-center justify-center gap-1 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[11px] font-semibold text-[#67E8F9] transition-colors hover:border-[#22D3EE]/55 hover:bg-[#22D3EE]/18 sm:w-auto sm:px-2.5 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('expanded')}
              title="Perbesar tampilan detail kartu Waifu"
              aria-label="Perbesar kartu Waifu"
              className="inline-flex h-8 w-8 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:w-auto sm:px-2.5 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Detail</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('docked')}
              title="Minimize kartu agar tidak menutupi chat"
              aria-label="Minimize kartu Waifu"
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#FB923C]/35 bg-[#FB923C]/12 px-2 text-[10.5px] font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/60 hover:bg-[#FB923C]/20 sm:px-2.5 sm:text-[11px] cursor-pointer"
            >
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
              <span>Minimize</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EXPANDED MODE ('expanded'): Clean 3-Tier Mobile Bento Card (Zero clutter!)
  // =========================================================================
  return (
    <div className="relative z-20 shrink-0 px-2.5 pt-1 pb-1.5 sm:px-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/12 bg-gradient-to-r from-[#0B1220]/96 via-[#0F1628]/96 to-[#140F1F]/96 p-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-3">
        {/* Tier 1: Identity Header + Pinned Top-Right Minimize Button */}
        <div className="flex flex-nowrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenEditor}
              title="Klik untuk mengedit profil Waifu"
              className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#22D3EE]/35 bg-[#0F172A] shadow-[0_0_16px_rgba(34,211,238,0.14)] cursor-pointer sm:h-12 sm:w-12"
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
              <div className="flex flex-nowrap items-center gap-1.5">
                <h2 className="truncate text-[13.5px] font-bold tracking-tight text-white sm:text-sm">
                  {profile.name}
                </h2>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${moodToneClasses[mood.id] || moodToneClasses.shy}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {mood.label}
                </span>
              </div>

              <p className="mt-0.5 truncate text-[11px] text-[#94A3B8]">
                {profile.animeSource
                  ? `${profile.animeSource} • ${profile.tagline}`
                  : profile.tagline}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChangeMode('docked')}
            title="Minimize kartu agar tidak menutupi chat"
            aria-label="Minimize kartu Waifu"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-2.5 text-[11px] font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/65 hover:bg-[#FB923C]/22 cursor-pointer"
          >
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            <span>Minimize</span>
          </button>
        </div>

        {/* Tier 2: Full-Width RPG EXP Progress Box */}
        {profile.affectionMeterEnabled && (
          <div className="mt-2 rounded-xl border border-white/[0.07] bg-black/30 px-2.5 py-2">
            <div className="flex flex-nowrap items-center justify-between gap-2 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5 font-semibold text-white">
                <Heart className="h-3.5 w-3.5 shrink-0 fill-[#F472B6] text-[#F472B6]" />
                <span className="truncate">
                  Afeksi Lv.{mood.affectionLevel} · {mood.affectionLabel}
                </span>
                {mood.lastGainExp > 0 && (
                  <span className="shrink-0 rounded-full border border-emerald-400/35 bg-emerald-400/12 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-emerald-300">
                    +{mood.lastGainExp} EXP
                  </span>
                )}
              </div>

              <div className="shrink-0 font-mono-code text-[10.5px] text-[#CBD5E1]">
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

        {/* Tier 3: Symmetrical Mobile Grid (2x2 or 3-col) / Desktop Inline Toolbar */}
        <div
          className={`relative mt-2 grid gap-1.5 sm:flex sm:items-center sm:justify-end ${
            supportsExpressionPack && onToggleExpressions
              ? profile.scenarioPresets.length > 0
                ? 'grid-cols-2'
                : 'grid-cols-3'
              : profile.scenarioPresets.length > 0
                ? 'grid-cols-3'
                : 'grid-cols-2'
          }`}
        >
          {profile.scenarioPresets.length > 0 && (
            <div className="static sm:relative">
              <button
                type="button"
                onClick={() => {
                  if (onOpenScenarioBubble) {
                    onOpenScenarioBubble();
                  } else {
                    setScenarioMenuOpen((v) => !v);
                  }
                }}
                className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:w-auto sm:px-2.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                <span className="truncate">Skenario</span>
                {!onOpenScenarioBubble && (
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-75" />
                )}
              </button>
              {!onOpenScenarioBubble && renderScenarioDropdown()}
            </div>
          )}

          {supportsExpressionPack && onToggleExpressions && (
            <button
              type="button"
              onClick={onToggleExpressions}
              aria-label="Toggle foto ekspresi Waifu"
              className={`inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border px-2 text-[11px] font-semibold transition-colors sm:w-auto sm:px-2.5 cursor-pointer ${
                photosEnabled
                  ? 'border-emerald-400/35 bg-emerald-400/12 text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-400/18'
                  : 'border-white/10 bg-white/[0.04] text-[#94A3B8] hover:border-white/20 hover:text-white'
              }`}
            >
              <Camera className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Foto: {photosEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenEditor}
            className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2 text-[11px] font-semibold text-[#67E8F9] transition-colors hover:border-[#22D3EE]/60 hover:bg-[#22D3EE]/20 sm:w-auto sm:px-2.5 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('compact')}
            title="Ubah ke baris ringkas"
            className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:w-auto sm:px-2.5 cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Ringkas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
