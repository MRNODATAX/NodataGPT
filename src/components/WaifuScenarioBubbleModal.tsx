import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Compass,
  Eye,
  Heart,
  Home,
  MessageCircleHeart,
  Moon,
  Pencil,
  RotateCcw,
  Sparkles,
  UserRoundPen,
  X,
} from 'lucide-react';
import {
  CASUAL_AYANG_PRESET_ID,
  CASUAL_AYANG_SCENARIO,
  DEFAULT_MIKU_AVATAR_URL,
  MIKU_SCENARIO_PRESETS,
  buildCasualAyangSnapshot,
  isCasualAyangScenario,
  resolveWaifuAvatarUrl,
} from '../services/waifuPresets';
import { isBuiltInExpressionProfile } from '../services/waifuExpressions';
import { MarkdownRenderer } from './MarkdownRenderer';
import type {
  WaifuProfile,
  WaifuScenarioCategory,
  WaifuScenarioPreset,
} from '../types/waifu';

interface WaifuScenarioBubbleModalProps {
  isOpen: boolean;
  profiles: WaifuProfile[];
  initialWaifu: WaifuProfile;
  onClose: () => void;
  onConfirmStartChat: (options: {
    profile: WaifuProfile;
    scenarioTitle: string;
    scenario: string;
    firstMessage: string;
    saveAsDefault: boolean;
  }) => void;
  onOpenCharacterStudio: () => void;
}

type FilterCategory = 'all' | Exclude<WaifuScenarioCategory, 'casual' | 'custom'>;

const CATEGORY_META: Array<{
  id: FilterCategory;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
}> = [
  { id: 'all', label: 'Semua Skenario', shortLabel: 'Semua', icon: Sparkles },
  { id: 'night', label: 'Malam & Kamar', shortLabel: 'Kamar/Malam', icon: Moon },
  { id: 'home', label: 'Di Rumah', shortLabel: 'Di Rumah', icon: Home },
  { id: 'outing', label: 'Jalan-Jalan', shortLabel: 'Jalan-Jalan', icon: Compass },
  { id: 'classic', label: 'Sekolah & Klasik', shortLabel: 'Klasik', icon: BookOpen },
];

export function WaifuScenarioBubbleModal({
  isOpen,
  profiles,
  initialWaifu,
  onClose,
  onConfirmStartChat,
  onOpenCharacterStudio,
}: WaifuScenarioBubbleModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialWaifu.id);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(CASUAL_AYANG_PRESET_ID);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isEditingBubble, setIsEditingBubble] = useState(false);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftScenario, setDraftScenario] = useState('');
  const [draftFirstMessage, setDraftFirstMessage] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? initialWaifu,
    [profiles, selectedProfileId, initialWaifu]
  );

  const rawPresets = useMemo<WaifuScenarioPreset[]>(() => {
    if (selectedProfile.scenarioPresets && selectedProfile.scenarioPresets.length > 0) {
      return selectedProfile.scenarioPresets;
    }
    if (isBuiltInExpressionProfile(selectedProfile)) {
      return MIKU_SCENARIO_PRESETS;
    }
    return [];
  }, [selectedProfile]);

  const defaultCasualPreset = useMemo<WaifuScenarioPreset>(() => {
    const existing = rawPresets.find(
      (p) =>
        p.id === CASUAL_AYANG_PRESET_ID ||
        p.category === 'casual' ||
        isCasualAyangScenario(p.scenario)
    );
    if (existing) return existing;
    const casualSnap = buildCasualAyangSnapshot(selectedProfile);
    return {
      id: CASUAL_AYANG_PRESET_ID,
      title: 'Chat Biasa Bareng Ayang',
      category: 'casual',
      shortHint:
        'Default tanpa skenario — ngobrol santai harian layaknya chat sama pacar sendiri',
      scenario: casualSnap.scenario,
      firstMessage: casualSnap.firstMessage,
    };
  }, [rawPresets, selectedProfile]);

  const roleplayPresets = useMemo<WaifuScenarioPreset[]>(
    () =>
      rawPresets.filter(
        (p) =>
          p.id !== defaultCasualPreset.id &&
          p.category !== 'casual' &&
          !isCasualAyangScenario(p.scenario)
      ),
    [rawPresets, defaultCasualPreset.id]
  );

  const allSelectablePresets = useMemo<WaifuScenarioPreset[]>(
    () => [defaultCasualPreset, ...roleplayPresets],
    [defaultCasualPreset, roleplayPresets]
  );

  // Sync initial profile whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSelectedProfileId(initialWaifu.id);
  }, [isOpen, initialWaifu.id]);

  // Default to "Chat Biasa Bareng Ayang" (Tanpa Skenario) unless user explicitly saved a custom default on the profile
  useEffect(() => {
    if (!isOpen) return;
    setActiveCategory('all');
    setSaveAsDefault(false);
    setIsCustomMode(false);
    setIsEditingBubble(false);

    setSelectedPresetId(defaultCasualPreset.id);
    setDraftTitle(defaultCasualPreset.title);
    setDraftScenario(defaultCasualPreset.scenario);
    setDraftFirstMessage(defaultCasualPreset.firstMessage);
  }, [isOpen, selectedProfile.id, defaultCasualPreset]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const filteredRoleplayPresets = useMemo(() => {
    if (activeCategory === 'all') {
      return roleplayPresets;
    }
    return roleplayPresets.filter((p) => (p.category ?? 'classic') === activeCategory);
  }, [roleplayPresets, activeCategory]);

  const activePresetObj = useMemo(
    () => allSelectablePresets.find((p) => p.id === selectedPresetId) ?? null,
    [allSelectablePresets, selectedPresetId]
  );

  const isCasualSelected =
    !isCustomMode &&
    (selectedPresetId === defaultCasualPreset.id ||
      isCasualAyangScenario(draftScenario));

  const isModifiedFromPreset = useMemo(() => {
    if (isCustomMode || !activePresetObj) return false;
    return (
      draftTitle.trim() !== activePresetObj.title.trim() ||
      draftScenario.trim() !== activePresetObj.scenario.trim() ||
      draftFirstMessage.trim() !== activePresetObj.firstMessage.trim()
    );
  }, [isCustomMode, activePresetObj, draftTitle, draftScenario, draftFirstMessage]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: WaifuScenarioPreset) => {
    setSelectedPresetId(preset.id);
    setIsCustomMode(false);
    setIsEditingBubble(false);
    setDraftTitle(preset.title);
    setDraftScenario(preset.scenario);
    setDraftFirstMessage(preset.firstMessage);
  };

  const handleQuickStartCasual = () => {
    onConfirmStartChat({
      profile: buildCasualAyangSnapshot(selectedProfile),
      scenarioTitle: defaultCasualPreset.title,
      scenario: defaultCasualPreset.scenario || CASUAL_AYANG_SCENARIO,
      firstMessage: defaultCasualPreset.firstMessage,
      saveAsDefault: false,
    });
    onClose();
  };

  const handleActivateCustomWrite = () => {
    setSelectedPresetId('custom');
    setIsCustomMode(true);
    setIsEditingBubble(true);
    if (!draftTitle.trim() || activePresetObj) {
      setDraftTitle('Skenario Sendiri');
    }
  };

  const handleResetToPreset = () => {
    const target = activePresetObj ?? defaultCasualPreset;
    setDraftTitle(target.title);
    setDraftScenario(target.scenario);
    setDraftFirstMessage(target.firstMessage);
    setIsCustomMode(false);
    setIsEditingBubble(false);
  };

  const handleStart = () => {
    const cleanFirstMsg = draftFirstMessage.trim();
    if (!cleanFirstMsg) return;
    const cleanScenario =
      isCasualSelected || !draftScenario.trim()
        ? CASUAL_AYANG_SCENARIO
        : draftScenario.trim();
    const cleanTitle =
      draftTitle.trim() ||
      (isCasualSelected ? 'Chat Biasa Bareng Ayang' : 'Chat Waifu');

    const baseProfile = isCasualSelected
      ? buildCasualAyangSnapshot(selectedProfile)
      : selectedProfile;

    onConfirmStartChat({
      profile: baseProfile,
      scenarioTitle: cleanTitle,
      scenario: cleanScenario,
      firstMessage: cleanFirstMsg,
      saveAsDefault,
    });
    onClose();
  };

  const avatarSrc = resolveWaifuAvatarUrl(selectedProfile.avatarUrl);
  const firstName = selectedProfile.name.split(' ')[0] || selectedProfile.name;
  const hasCategorizedPresets = roleplayPresets.some((p) => Boolean(p.category));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih skenario dan sapaan pembuka Chat Waifu"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-x border-[#22D3EE]/30 bg-gradient-to-b from-[#0C1426]/98 via-[#090E1B]/99 to-[#060912] shadow-[0_-18px_55px_rgba(0,0,0,0.85)] sm:max-h-[87dvh] sm:max-w-[650px] sm:rounded-3xl sm:border sm:shadow-[0_24px_70px_rgba(0,0,0,0.85)]"
      >
        {/* Subtle Top Glow Accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none h-[2px] w-full shrink-0 bg-gradient-to-r from-[#22D3EE] via-[#F472B6] to-[#FB923C]"
        />

        {/* Pinned Header */}
        <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <img
              src={avatarSrc}
              alt={selectedProfile.name}
              width={40}
              height={40}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
              }}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-[#22D3EE]/55 object-cover shadow-[0_0_14px_rgba(34,211,238,0.22)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate font-display text-sm font-bold text-white sm:text-base">
                  Chat Waifu Baru
                </h2>
                <span className="shrink-0 rounded-full border border-[#F472B6]/40 bg-[#F472B6]/14 px-2 py-0.5 text-[10px] font-semibold text-pink-200">
                  Default: Chat Ayang
                </span>
              </div>
              <p className="truncate text-[11px] text-[#94A3B8] sm:text-xs">
                {selectedProfile.name} · Tanpa skenario (chat biasa) atau pilih 12 skenario
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCharacterStudio();
              }}
              title="Edit profil karakter Waifu atau ganti karakter"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/45 hover:bg-white/[0.09] hover:text-white cursor-pointer"
            >
              <UserRoundPen className="h-3.5 w-3.5 text-[#22D3EE]" />
              <span className="hidden xs:inline sm:inline">Karakter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pemilih skenario Waifu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
          {/* Optional Character Switcher when user has >1 Waifu profile */}
          {profiles.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {profiles.map((prof) => {
                const active = prof.id === selectedProfile.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedProfileId(prof.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'border-[#22D3EE]/60 bg-[#22D3EE]/16 text-white'
                        : 'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <img
                      src={resolveWaifuAvatarUrl(prof.avatarUrl)}
                      alt=""
                      width={16}
                      height={16}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                      }}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span>{prof.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured Default Option: Chat Biasa Bareng Ayang (Tanpa Skenario) */}
          <div
            onClick={() => handleSelectPreset(defaultCasualPreset)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectPreset(defaultCasualPreset);
              }
            }}
            className={`group relative flex flex-col gap-2 rounded-2xl border p-3 transition-all cursor-pointer sm:flex-row sm:items-center sm:justify-between ${
              isCasualSelected
                ? 'border-[#22D3EE]/70 bg-gradient-to-r from-[#22D3EE]/16 via-[#131F3A] to-[#F472B6]/16 shadow-[0_8px_24px_rgba(34,211,238,0.16)]'
                : 'border-white/12 bg-white/[0.03] hover:border-[#22D3EE]/40 hover:bg-white/[0.06]'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F472B6]/20 text-[#F472B6]">
                  <Heart className="h-3 w-3 fill-current" />
                </span>
                <span className="text-xs font-bold text-white sm:text-[13px]">
                  {defaultCasualPreset.title}
                </span>
                <span className="rounded-full border border-[#22D3EE]/45 bg-[#22D3EE]/16 px-2 py-0.2 text-[9.5px] font-bold uppercase tracking-wide text-[#67E8F9]">
                  Default · Tanpa Skenario
                </span>
                {isCasualSelected && (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#22D3EE] text-[#041019]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#CBD5E1]">
                Ngobrol santai sehari-hari layaknya chat WA/DM sama ayang sendiri tanpa terikat skenario tempat.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickStartCasual();
              }}
              className="inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#22D3EE]/45 bg-[#22D3EE]/18 px-3 text-[11px] font-bold text-white transition-all hover:bg-[#22D3EE]/28 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#67E8F9]" />
              <span>Langsung Chat</span>
            </button>
          </div>

          {/* Section 1: Optional Roleplay Scenario Templates */}
          {roleplayPresets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-code text-[10.5px] font-semibold uppercase tracking-wider text-[#67E8F9]">
                  Opsional: Pilih Skenario Roleplay ({roleplayPresets.length})
                </span>
                <button
                  type="button"
                  onClick={handleActivateCustomWrite}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    isCustomMode
                      ? 'border-[#FB923C]/65 bg-[#FB923C]/18 text-[#FED7AA]'
                      : 'border-[#FB923C]/35 bg-[#FB923C]/10 text-[#FDBA74] hover:border-[#FB923C]/60 hover:text-white'
                  }`}
                >
                  <Pencil className="h-3 w-3" />
                  <span>+ Tulis Sendiri</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              {hasCategorizedPresets && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {CATEGORY_META.map((cat) => {
                    const Icon = cat.icon;
                    const active = !isCustomMode && activeCategory === cat.id;
                    const count =
                      cat.id === 'all'
                        ? roleplayPresets.length
                        : roleplayPresets.filter(
                            (p) => (p.category ?? 'classic') === cat.id
                          ).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setIsCustomMode(false);
                        }}
                        className={`inline-flex h-7.5 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-[#22D3EE]/55 bg-[#22D3EE]/16 text-white shadow-[0_0_12px_rgba(34,211,238,0.16)]'
                            : 'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <Icon className="h-3 w-3 text-[#22D3EE]" />
                        <span className="sm:hidden">{cat.shortLabel}</span>
                        <span className="hidden sm:inline">{cat.label}</span>
                        <span className="rounded-full bg-white/10 px-1.5 py-0.2 font-mono-code text-[9.5px] text-[#CBD5E1]">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Compact 2-Column Scrollable Template Cards */}
              <div className="grid max-h-[164px] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:max-h-[188px]">
                {filteredRoleplayPresets.map((preset) => {
                  const selected = !isCustomMode && selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[#22D3EE]/65 bg-gradient-to-br from-[#22D3EE]/16 via-[#0F1B33] to-[#FB923C]/14 text-white shadow-[0_6px_18px_rgba(34,211,238,0.14)]'
                          : 'border-white/10 bg-white/[0.03] text-[#CBD5E1] hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="line-clamp-1 text-xs font-bold leading-snug text-white">
                          {preset.title}
                        </span>
                        {selected && (
                          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#22D3EE] text-[#041019]">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-[#94A3B8]">
                        {preset.shortHint || preset.scenario}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Card Bubble Preview & Inline Custom Editor */}
          <div className="rounded-2xl border border-[#22D3EE]/28 bg-gradient-to-b from-[#0E182D]/95 to-[#080D18]/98 p-3 sm:p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <MessageCircleHeart className="h-4 w-4 shrink-0 text-[#F472B6]" />
                <span className="truncate font-display text-xs font-bold text-white sm:text-[13px]">
                  {isCustomMode
                    ? 'Skenario & Sapaan Kustom'
                    : isCasualSelected
                      ? `Mode Default: ${draftTitle}`
                      : `Bubble Skenario: ${draftTitle}`}
                </span>
                {isModifiedFromPreset && (
                  <span className="rounded-full border border-[#FB923C]/40 bg-[#FB923C]/15 px-1.5 py-0.2 text-[9.5px] font-semibold text-[#FED7AA]">
                    Diedit
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {(isModifiedFromPreset || isCustomMode) && (
                  <button
                    type="button"
                    onClick={handleResetToPreset}
                    title="Kembalikan ke template awal"
                    className="inline-flex h-7.5 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingBubble((v) => !v)}
                  className={`inline-flex h-7.5 items-center gap-1 rounded-xl border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    isEditingBubble
                      ? 'border-[#22D3EE]/55 bg-[#22D3EE]/18 text-[#67E8F9]'
                      : 'border-[#FB923C]/40 bg-[#FB923C]/12 text-[#FED7AA] hover:border-[#FB923C]/65'
                  }`}
                >
                  {isEditingBubble ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Lihat Bubble</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3 w-3" />
                      <span>Edit Sendiri</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditingBubble ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="waifu-bubble-title"
                    className="mb-1 block text-[11px] font-semibold text-[#CBD5E1]"
                  >
                    Judul Mode / Skenario Chat
                  </label>
                  <input
                    id="waifu-bubble-title"
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Contoh: Chat Biasa Bareng Ayang / Malam Minggu..."
                    className="h-9 w-full rounded-xl border border-white/12 bg-black/50 px-3 text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="waifu-bubble-scenario"
                    className="mb-1 block text-[11px] font-semibold text-[#CBD5E1]"
                  >
                    Latar Skenario (Kosongkan untuk Chat Biasa Bareng Ayang)
                  </label>
                  <textarea
                    id="waifu-bubble-scenario"
                    rows={3}
                    value={draftScenario}
                    onChange={(e) => setDraftScenario(e.target.value)}
                    placeholder="Kosongkan jika ingin ngobrol santai biasa dengan ayang tanpa skenario khusus..."
                    className="w-full rounded-xl border border-white/12 bg-black/50 p-2.5 text-xs leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label
                      htmlFor="waifu-bubble-greeting"
                      className="text-[11px] font-semibold text-[#CBD5E1]"
                    >
                      Sapaan Pembuka {firstName}
                    </label>
                    <span className="text-[10px] text-[#94A3B8]">
                      Bebas sapaan chat santai atau *aksi*
                    </span>
                  </div>
                  <textarea
                    id="waifu-bubble-greeting"
                    rows={4}
                    value={draftFirstMessage}
                    onChange={(e) => setDraftFirstMessage(e.target.value)}
                    placeholder={`Tulis chat pertama saat ${firstName} menyapamu...`}
                    className="w-full rounded-xl border border-white/12 bg-black/50 p-2.5 text-xs leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#22D3EE]"
                  />
                  <span>Jadikan sapaan ini default untuk {firstName}</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Mode / Scene Context Chip */}
                <div className="rounded-xl border border-white/8 bg-black/35 px-3 py-2">
                  <div className="mb-0.5 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#67E8F9]">
                    {isCasualSelected ? 'Mode Percakapan (Default)' : 'Latar Skenario'}
                  </div>
                  <p className="text-xs leading-relaxed text-[#CBD5E1]">
                    {draftScenario || selectedProfile.scenario}
                  </p>
                </div>

                {/* Live Chat Greeting Bubble Preview */}
                <div className="nd-assistant-surface rounded-2xl px-3.5 py-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <img
                      src={avatarSrc}
                      alt=""
                      width={22}
                      height={22}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                      }}
                      className="h-5.5 w-5.5 rounded-full border border-[#22D3EE]/50 object-cover"
                    />
                    <span className="text-xs font-bold text-white">
                      {selectedProfile.name}
                    </span>
                    <span className="rounded-full border border-[#F472B6]/30 bg-[#F472B6]/12 px-2 py-0.2 text-[9.5px] font-semibold text-pink-200">
                      {isCasualSelected ? 'Chat Ayang' : 'Sapaan Pembuka'}
                    </span>
                  </div>
                  <div className="max-h-[175px] overflow-y-auto pr-1 text-xs sm:max-h-[205px]">
                    <MarkdownRenderer
                      content={draftFirstMessage || selectedProfile.firstMessage}
                      waifuMode
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="pb-safe flex shrink-0 items-center justify-between gap-2.5 border-t border-white/10 bg-[#060A13]/95 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-[#CBD5E1] transition-colors hover:bg-white/[0.09] hover:text-white cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!draftFirstMessage.trim()}
            onClick={handleStart}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0891B2] via-[#0E7490] to-[#EA580C] px-4 text-xs font-bold text-white shadow-[0_8px_24px_rgba(14,116,144,0.38)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-initial sm:px-6 sm:text-sm cursor-pointer"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isCasualSelected
                ? `Mulai Chat Biasa · ${firstName}`
                : `Mulai Skenario · ${firstName}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
