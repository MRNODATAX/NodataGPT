import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Heart,
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
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const mood = analyzeWaifuMoodAndAffection(messages);

  const moodToneClasses: Record<string, string> = {
    shy: 'border-[#F472B6]/40 bg-[#F472B6]/12 text-[#FBCFE8]',
    happy: 'border-emerald-400/40 bg-emerald-400/12 text-emerald-200',
    pout: 'border-[#FB923C]/45 bg-[#FB923C]/14 text-[#FED7AA]',
    focused: 'border-[#22D3EE]/45 bg-[#22D3EE]/14 text-[#CFFAFE]',
    warm: 'border-amber-300/40 bg-amber-400/12 text-amber-100',
  };

  return (
    <div className="relative z-20 shrink-0 px-3 pt-1 pb-1.5 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2.5 rounded-2xl border border-[#22D3EE]/22 bg-[#08101E]/88 px-3 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-4 sm:py-2.5">
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
              width={40}
              height={40}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
              }}
              className="h-9 w-9 rounded-full border border-[#22D3EE]/45 object-cover shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-transform group-hover:scale-105 sm:h-10 sm:w-10"
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

        {/* Right: Scenario Switcher + Edit Button */}
        <div className="flex shrink-0 items-center gap-1.5">
          {profile.scenarioPresets.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setScenarioMenuOpen((v) => !v)}
                aria-expanded={scenarioMenuOpen}
                aria-label="Pilih skenario percakapan"
                className="inline-flex min-h-[34px] items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span className="hidden sm:inline">Skenario</span>
                <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
              </button>

              {scenarioMenuOpen && (
                <>
                  <div
                    aria-hidden="true"
                    onClick={() => setScenarioMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-40 mt-2 w-64 origin-top-right rounded-2xl border border-white/14 bg-[#0B1221]/96 p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.68)] backdrop-blur-xl"
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
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenEditor}
            aria-label="Edit karakter Waifu"
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-2.5 py-1 text-xs font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/70 hover:bg-[#FB923C]/22 hover:text-white cursor-pointer sm:px-3"
          >
            <Pencil className="h-3.5 w-3.5 text-[#FB923C]" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
