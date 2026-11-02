import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileUp,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircleHeart,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRoundPen,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  DEFAULT_MIKU_AVATAR_URL,
  DEFAULT_MIKU_ID,
  WAIFU_ARCHETYPE_PRESETS,
  compressAvatarFileToDataUrl,
  createDefaultMikuProfile,
  exportWaifuToTavernCardV2,
  importWaifuFromTavernJson,
  resolveWaifuAvatarUrl,
} from '../services/waifuPresets';
import type { WaifuArchetype, WaifuProfile } from '../types/waifu';

interface WaifuStudioModalProps {
  isOpen: boolean;
  profiles: WaifuProfile[];
  activeWaifuId: string;
  onClose: () => void;
  onSaveProfile: (updated: WaifuProfile, makeActive?: boolean) => void;
  onSaveAndStartChat: (updated: WaifuProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onGenerateAiAvatar?: (prompt: string) => Promise<string>;
}

const ARCHETYPE_OPTIONS: Array<{ id: WaifuArchetype; label: string }> = [
  { id: 'dandere', label: 'Dandere (Pemalu · Miku)' },
  { id: 'tsundere', label: 'Tsundere' },
  { id: 'kuudere', label: 'Kuudere' },
  { id: 'deredere', label: 'Ceria (Deredere)' },
  { id: 'oneesan', label: 'Onee-san' },
  { id: 'custom', label: 'Kustom Bebas' },
];

export function WaifuStudioModal({
  isOpen,
  profiles,
  activeWaifuId,
  onClose,
  onSaveProfile,
  onSaveAndStartChat,
  onDeleteProfile,
  onGenerateAiAvatar,
}: WaifuStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'collection'>('editor');
  const [draft, setDraft] = useState<WaifuProfile>(() => createDefaultMikuProfile());
  const [showAdvancedDialogue, setShowAdvancedDialogue] = useState(false);
  const [showAvatarUrlInput, setShowAvatarUrlInput] = useState(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState('');
  const [aiAvatarBusy, setAiAvatarBusy] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const cardJsonInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const current =
      profiles.find((p) => p.id === activeWaifuId) ??
      profiles[0] ??
      createDefaultMikuProfile();
    setDraft({ ...current });
    setAvatarUrlDraft(
      current.avatarUrl.startsWith('http') ? current.avatarUrl : ''
    );
    setFeedbackBanner(null);
  }, [isOpen, activeWaifuId, profiles]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !aiAvatarBusy) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, aiAvatarBusy, onClose]);

  if (!isOpen) return null;

  const flashFeedback = (tone: 'ok' | 'err', text: string) => {
    setFeedbackBanner({ tone, text });
    window.setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 3400);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFileToDataUrl(file);
      setDraft((prev) => ({ ...prev, avatarUrl: dataUrl }));
      flashFeedback('ok', 'Foto avatar berhasil diperbarui.');
    } catch (err) {
      flashFeedback(
        'err',
        err instanceof Error ? err.message : 'Gagal memuat foto avatar.'
      );
    }
  };

  const handleGenerateAvatarWithAi = async () => {
    if (!onGenerateAiAvatar || aiAvatarBusy) return;
    setAiAvatarBusy(true);
    setFeedbackBanner(null);
    try {
      const charName = draft.name.trim() || 'Miku Nakano';
      const prompt = `High-quality modern anime avatar portrait of ${charName}${
        draft.animeSource ? ` from ${draft.animeSource}` : ''
      }, ${draft.likesAndQuirks.slice(0, 140)}, expressive gentle anime eyes, clean cel-shaded anime illustration, dark starry night background with soft cyan and warm amber rim light, centered head and shoulders 1:1 avatar, no text, no watermark`;
      const generatedUrl = await onGenerateAiAvatar(prompt);
      setDraft((prev) => ({ ...prev, avatarUrl: generatedUrl }));
      flashFeedback('ok', 'Avatar anime berhasil dilukis oleh AI!');
    } catch (err) {
      flashFeedback(
        'err',
        err instanceof Error
          ? err.message
          : 'Gagal membuat avatar AI. Coba lagi sebentar.'
      );
    } finally {
      setAiAvatarBusy(false);
    }
  };

  const handleApplyArchetypeHint = (arch: WaifuArchetype) => {
    setDraft((prev) => {
      if (arch === 'custom') {
        return { ...prev, archetype: 'custom' };
      }
      const tpl = WAIFU_ARCHETYPE_PRESETS[arch];
      return {
        ...prev,
        archetype: arch,
        personality: tpl.personalityHint,
        speechStyle: tpl.speechHint,
      };
    });
    if (arch !== 'custom') {
      flashFeedback(
        'ok',
        `Template sifat "${WAIFU_ARCHETYPE_PRESETS[arch].label}" diterapkan — bebas kamu sesuaikan lagi.`
      );
    }
  };

  const handleResetToDefaultMiku = () => {
    const freshMiku = createDefaultMikuProfile();
    setDraft(freshMiku);
    setAvatarUrlDraft('');
    flashFeedback(
      'ok',
      'Profil dikembalikan ke setelan asli Miku Nakano. Klik Simpan untuk menerapkan.'
    );
  };

  const handleCreateNewCustomProfile = () => {
    const newId = `waifu-${Date.now().toString(36)}`;
    const customBlank: WaifuProfile = {
      id: newId,
      name: 'Karakter Waifu Baru',
      animeSource: 'Karakter Orisinal / Anime Pilihanmu',
      tagline: 'Teman Ngobrol & Roleplay Pribadi',
      avatarUrl: DEFAULT_MIKU_AVATAR_URL,
      archetype: 'dandere',
      personality: WAIFU_ARCHETYPE_PRESETS.dandere.personalityHint,
      speechStyle: WAIFU_ARCHETYPE_PRESETS.dandere.speechHint,
      likesAndQuirks:
        'Suka mengobrol santai di malam hari, mendengarkan musik, dan memperhatikan hal-hal kecil tentang lawan bicaranya.',
      scenario:
        'Suasana santai berdua di kafe tenang saat malam berbintang.',
      firstMessage:
        '*Ia menoleh pelan saat melihatmu duduk di hadapannya, lalu tersenyum hangat sambil merapikan helaian rambutnya.*\n\n"Akhirnya kamu datang juga... hari ini gimana kabarmu? Cerita aja pelan-pelan, aku dengerin kok."',
      scenarioPresets: [],
      exampleDialogue: '',
      userNickname: draft.userNickname || 'Kamu',
      userRole: 'Orang terdekat & teman cerita favorit',
      affectionMeterEnabled: true,
      isBuiltInDefault: false,
      updatedAt: Date.now(),
    };
    setDraft(customBlank);
    setActiveTab('editor');
    flashFeedback(
      'ok',
      'Slot karakter baru disiapkan! Ubah nama, foto, & sifatnya lalu klik Simpan.'
    );
  };

  const handleExportCardJson = () => {
    try {
      const card = exportWaifuToTavernCardV2(draft);
      const blob = new Blob([JSON.stringify(card, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = (draft.name || 'waifu')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      a.href = url;
      a.download = `${slug || 'waifu'}-card-v2.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      flashFeedback('ok', 'Kartu karakter JSON (Tavern V2) berhasil diunduh.');
    } catch {
      flashFeedback('err', 'Gagal mengekspor kartu karakter JSON.');
    }
  };

  const handleImportCardJson = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const raw = await file.text();
      const imported = importWaifuFromTavernJson(raw);
      onSaveProfile(imported, true);
      setDraft(imported);
      setActiveTab('editor');
      flashFeedback(
        'ok',
        `Karakter "${imported.name}" berhasil diimpor dari kartu JSON!`
      );
    } catch (err) {
      flashFeedback(
        'err',
        err instanceof Error
          ? err.message
          : 'Format berkas JSON kartu karakter tidak valid.'
      );
    }
  };

  const sanitizeDraftBeforeSave = (): WaifuProfile => {
    const cleanName = draft.name.trim() || 'Miku Nakano';
    const cleanFirst =
      draft.firstMessage.trim() ||
      `*${cleanName} menatapmu sambil tersenyum tipis.*\n\n"Halo... senang bisa ngobrol berdua denganmu."`;
    return {
      ...draft,
      name: cleanName,
      animeSource: draft.animeSource.trim(),
      tagline: draft.tagline.trim() || `${cleanName} • Chat Waifu NodataGPT`,
      personality:
        draft.personality.trim() ||
        WAIFU_ARCHETYPE_PRESETS.dandere.personalityHint,
      speechStyle:
        draft.speechStyle.trim() || WAIFU_ARCHETYPE_PRESETS.dandere.speechHint,
      likesAndQuirks: draft.likesAndQuirks.trim(),
      scenario:
        draft.scenario.trim() ||
        'Percakapan santai berdua dalam suasana yang akrab.',
      firstMessage: cleanFirst,
      userNickname: draft.userNickname.trim() || 'Kamu',
      userRole: draft.userRole.trim() || 'Teman dekat',
      updatedAt: Date.now(),
    };
  };

  const handleSaveOnly = () => {
    const cleaned = sanitizeDraftBeforeSave();
    onSaveProfile(cleaned, true);
    flashFeedback('ok', `Profil "${cleaned.name}" berhasil disimpan!`);
  };

  const handleSaveAndChatNow = () => {
    const cleaned = sanitizeDraftBeforeSave();
    onSaveAndStartChat(cleaned);
    onClose();
  };

  const isBuiltInMiku =
    draft.id === DEFAULT_MIKU_ID || Boolean(draft.isBuiltInDefault);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waifu-studio-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        aria-hidden="true"
        onClick={() => {
          if (!aiAvatarBusy) onClose();
        }}
        className="fixed inset-0"
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/14 bg-[#070C18]/96 shadow-[0_24px_70px_rgba(0,0,0,0.82)] sm:max-h-[88dvh] sm:rounded-3xl">
        {/* Top Modal Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0A1122]/90 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12">
              <MessageCircleHeart className="h-4.5 w-4.5 text-[#22D3EE]" />
            </div>
            <div className="min-w-0">
              <h2
                id="waifu-studio-title"
                className="truncate font-display text-base font-bold tracking-tight text-white sm:text-lg"
              >
                Studio Karakter <span className="text-[#22D3EE]">Chat</span>{' '}
                <span className="text-[#FB923C]">Waifu</span>
              </h2>
              <p className="m-0 truncate text-xs text-[#94A3B8]">
                Default Miku Nakano • 100% bisa diedit bebas sesuai karakter favoritmu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Studio Karakter Waifu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 bg-[#080E1C]/85 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'border border-[#22D3EE]/45 bg-[#22D3EE]/15 text-white'
                  : 'text-[#94A3B8] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <UserRoundPen className="h-3.5 w-3.5 text-[#22D3EE]" />
              <span>Edit Karakter</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('collection')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'collection'
                  ? 'border border-[#FB923C]/45 bg-[#FB923C]/15 text-white'
                  : 'text-[#94A3B8] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-[#FB923C]" />
              <span>Koleksi & Kartu JSON ({profiles.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreateNewCustomProfile}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span className="hidden sm:inline">Karakter Baru</span>
            <span className="sm:hidden">Baru</span>
          </button>
        </div>

        {/* Status Toast Banner */}
        {feedbackBanner && (
          <div
            role="status"
            className={`mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium sm:mx-6 ${
              feedbackBanner.tone === 'ok'
                ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200'
                : 'border-[#FB923C]/45 bg-[#FB923C]/14 text-[#FED7AA]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              {/* 1. Avatar & Core Identity Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={resolveWaifuAvatarUrl(draft.avatarUrl)}
                      alt={draft.name}
                      width={68}
                      height={68}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                      }}
                      className="h-16 w-16 shrink-0 rounded-2xl border border-[#22D3EE]/45 object-cover shadow-[0_0_20px_rgba(34,211,238,0.2)] sm:h-[72px] sm:w-[72px]"
                    />

                    <div className="min-w-0 sm:hidden">
                      <div className="truncate font-display text-sm font-bold text-white">
                        {draft.name || 'Karakter Waifu'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#94A3B8]">
                        Foto profil karakter di ruang chat
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="hidden sm:block">
                      <div className="font-display text-sm font-bold text-white">
                        Foto Avatar Karakter
                      </div>
                      <p className="m-0 text-xs text-[#94A3B8]">
                        Unggah gambar dari perangkat, tempel tautan URL, atau lukis potret anime otomatis dengan AI.
                      </p>
                    </div>

                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2.5 py-1 text-xs font-semibold text-[#CFFAFE] transition-colors hover:bg-[#22D3EE]/22 cursor-pointer"
                      >
                        <ImagePlus className="h-3.5 w-3.5 text-[#22D3EE]" />
                        <span>Upload Foto</span>
                      </button>

                      {onGenerateAiAvatar && (
                        <button
                          type="button"
                          disabled={aiAvatarBusy}
                          onClick={handleGenerateAvatarWithAi}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/14 px-2.5 py-1 text-xs font-semibold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/24 disabled:opacity-50 cursor-pointer"
                        >
                          {aiAvatarBusy ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FB923C]" />
                              <span>Melukis...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-3.5 w-3.5 text-[#FB923C]" />
                              <span>Avatar AI</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAvatarUrlInput((v) => !v)}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                      >
                        <span>URL Gambar</span>
                      </button>

                      {draft.avatarUrl !== DEFAULT_MIKU_AVATAR_URL && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraft((prev) => ({
                              ...prev,
                              avatarUrl: DEFAULT_MIKU_AVATAR_URL,
                            }));
                            setAvatarUrlDraft('');
                          }}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-xl border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Foto Miku</span>
                        </button>
                      )}
                    </div>

                    {showAvatarUrlInput && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="url"
                          value={avatarUrlDraft}
                          onChange={(e) => setAvatarUrlDraft(e.target.value)}
                          placeholder="https://contoh.com/avatar-anime.jpg"
                          className="h-9 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/50 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const clean = avatarUrlDraft.trim();
                            if (/^https?:\/\//i.test(clean)) {
                              setDraft((prev) => ({ ...prev, avatarUrl: clean }));
                              setShowAvatarUrlInput(false);
                              flashFeedback('ok', 'URL foto avatar diterapkan.');
                            } else {
                              flashFeedback('err', 'Masukkan URL http/https yang valid.');
                            }
                          }}
                          className="inline-flex h-9 shrink-0 items-center rounded-xl bg-[#0E7490] px-3 text-xs font-semibold text-white hover:bg-[#0891B2] cursor-pointer"
                        >
                          Pakai
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + Anime Source + Tagline */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="waifu-name-input"
                      className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                    >
                      Nama Karakter Waifu
                    </label>
                    <input
                      id="waifu-name-input"
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Contoh: Miku Nakano"
                      className="h-10 w-full rounded-xl border border-white/12 bg-black/45 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="waifu-source-input"
                      className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                    >
                      Asal Anime / Cerita
                    </label>
                    <input
                      id="waifu-source-input"
                      type="text"
                      value={draft.animeSource}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          animeSource: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Gotoubun no Hanayome"
                      className="h-10 w-full rounded-xl border border-white/12 bg-black/45 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="waifu-tagline-input"
                      className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                    >
                      Julukan / Subjudul Singkat
                    </label>
                    <input
                      id="waifu-tagline-input"
                      type="text"
                      value={draft.tagline}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, tagline: e.target.value }))
                      }
                      placeholder="Contoh: Putri Ketiga Nakano • Pecinta Matcha & Sejarah Sengoku"
                      className="h-10 w-full rounded-xl border border-white/12 bg-black/45 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 2. User Persona (How Waifu Addresses the User) */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[#67E8F9]">
                    Peran & Panggilan untuk Kamu
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.affectionMeterEnabled}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          affectionMeterEnabled: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-[#22D3EE]"
                    />
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    <span>Mood & Level EXP</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="waifu-user-nick"
                      className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                    >
                      Panggilan ke Kamu
                    </label>
                    <input
                      id="waifu-user-nick"
                      type="text"
                      value={draft.userNickname}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          userNickname: e.target.value,
                        }))
                      }
                      placeholder='Contoh: Kamu / Fuutarou-kun / Nama kamu'
                      className="h-10 w-full rounded-xl border border-white/12 bg-black/45 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="waifu-user-role"
                      className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                    >
                      Hubungan / Peran Kamu
                    </label>
                    <input
                      id="waifu-user-role"
                      type="text"
                      value={draft.userRole}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          userRole: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Partner belajar & orang terdekat"
                      className="h-10 w-full rounded-xl border border-white/12 bg-black/45 px-3 text-base text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Editable Personality, Archetype, Speech Style & Quirks */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-[#FDBA74]">
                      Preset Gaya Karakter (Klik untuk Isi Cepat)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ARCHETYPE_OPTIONS.map((opt) => {
                      const selected = draft.archetype === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleApplyArchetypeHint(opt.id)}
                          className={`inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            selected
                              ? 'border-[#FB923C]/65 bg-[#FB923C]/18 text-[#FED7AA]'
                              : 'border-white/10 bg-black/40 text-[#CBD5E1] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="waifu-personality"
                    className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                  >
                    Kepribadian Inti (Bebas Diedit)
                  </label>
                  <textarea
                    id="waifu-personality"
                    rows={3}
                    value={draft.personality}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        personality: e.target.value,
                      }))
                    }
                    placeholder="Jelaskan sifat karakter, cara ia bereaksi saat dipuji, malu, atau cemburu..."
                    className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="waifu-speech"
                    className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                  >
                    Gaya Bicara & Ekspresi Narasi
                  </label>
                  <textarea
                    id="waifu-speech"
                    rows={2}
                    value={draft.speechStyle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        speechStyle: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Lembut, aku-kamu, jeda '...' saat gugup, narasi aksi *dalam tanda bintang*..."
                    className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="waifu-quirks"
                    className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                  >
                    Ciri Khas, Kesukaan & Kebiasaan Unik
                  </label>
                  <textarea
                    id="waifu-quirks"
                    rows={2}
                    value={draft.likesAndQuirks}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        likesAndQuirks: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Headphone biru di leher, suka matcha & sejarah Sengoku..."
                    className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                  />
                </div>
              </div>

              {/* 4. Scenario & Opening Greeting */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[#67E8F9]">
                    Skenario & Sapaan Pembuka
                  </span>

                  {draft.scenarioPresets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {draft.scenarioPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              scenario: preset.scenario,
                              firstMessage: preset.firstMessage,
                            }))
                          }
                          className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            draft.scenario === preset.scenario
                              ? 'border-[#22D3EE]/50 bg-[#22D3EE]/16 text-[#CFFAFE]'
                              : 'border-white/10 bg-black/40 text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="waifu-scenario"
                    className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                  >
                    Latar Situasi / Skenario Saat Ini
                  </label>
                  <textarea
                    id="waifu-scenario"
                    rows={2}
                    value={draft.scenario}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, scenario: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="waifu-first-msg"
                    className="mb-1 block text-xs font-semibold text-[#CBD5E1]"
                  >
                    Pesan Pembuka Otomatis (`First Message`)
                  </label>
                  <textarea
                    id="waifu-first-msg"
                    rows={4}
                    value={draft.firstMessage}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        firstMessage: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                  />
                </div>

                {/* Collapsible Example Dialogue (mes_example) */}
                <div className="border-t border-white/8 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDialogue((v) => !v)}
                    className="flex w-full items-center justify-between text-left text-xs font-medium text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    <span>Contoh Dialog Referensi AI (Opsional / Lanjutan)</span>
                    {showAdvancedDialogue ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {showAdvancedDialogue && (
                    <textarea
                      rows={4}
                      value={draft.exampleDialogue}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          exampleDialogue: e.target.value,
                        }))
                      }
                      placeholder="Contoh pertukaran dialog singkat agar AI makin konsisten meniru gaya bahasa karakter..."
                      className="mt-2 w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-base leading-relaxed text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none sm:text-xs"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Character Collection & Tavern V2 JSON Import/Export */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#22D3EE]/25 bg-[#091426]/80 p-3.5">
                <div className="min-w-0">
                  <div className="font-display text-xs font-bold text-white sm:text-sm">
                    Standar Kartu Karakter Tavern V2 (`chara_card_v2`)
                  </div>
                  <p className="m-0 mt-0.5 text-xs text-[#94A3B8]">
                    Simpan backup karakter editanmu atau impor file `.json` karakter dari komunitas.
                  </p>
                </div>

                <input
                  ref={cardJsonInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportCardJson}
                  className="hidden"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => cardJsonInputRef.current?.click()}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#22D3EE]/40 bg-[#22D3EE]/12 px-3 py-1.5 text-xs font-semibold text-[#CFFAFE] hover:bg-[#22D3EE]/22 cursor-pointer"
                  >
                    <FileUp className="h-3.5 w-3.5 text-[#22D3EE]" />
                    <span>Impor JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCardJson}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-3 py-1.5 text-xs font-semibold text-[#FED7AA] hover:bg-[#FB923C]/22 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-[#FB923C]" />
                    <span>Ekspor JSON</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {profiles.map((item) => {
                  const isSelected = item.id === draft.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 transition-colors ${
                        isSelected
                          ? 'border-[#22D3EE]/55 bg-[#22D3EE]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={resolveWaifuAvatarUrl(item.avatarUrl)}
                          alt={item.name}
                          width={48}
                          height={48}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                          }}
                          className="h-12 w-12 shrink-0 rounded-xl border border-white/15 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-display text-sm font-bold text-white">
                              {item.name}
                            </span>
                            {item.id === activeWaifuId && (
                              <span className="rounded-full bg-emerald-400/18 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="m-0 mt-0.5 line-clamp-2 text-xs text-[#94A3B8]">
                            {item.tagline || item.animeSource}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-white/8 pt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDraft({ ...item });
                            setActiveTab('editor');
                          }}
                          className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <UserRoundPen className="h-3.5 w-3.5 text-[#22D3EE]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSaveAndStartChat(item);
                            onClose();
                          }}
                          className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-xl bg-[#0E7490] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0891B2] cursor-pointer"
                        >
                          <MessageCircleHeart className="h-3.5 w-3.5" />
                          <span>Chat</span>
                        </button>

                        {!item.isBuiltInDefault && item.id !== DEFAULT_MIKU_ID && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteProfile(item.id);
                              if (draft.id === item.id) {
                                const fallback =
                                  profiles.find((p) => p.id === DEFAULT_MIKU_ID) ??
                                  createDefaultMikuProfile();
                                setDraft({ ...fallback });
                              }
                            }}
                            aria-label={`Hapus karakter ${item.name}`}
                            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-[#94A3B8] hover:border-rose-400/50 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="pb-safe flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0A1122]/92 px-4 py-3 sm:px-6">
          {isBuiltInMiku ? (
            <button
              type="button"
              onClick={handleResetToDefaultMiku}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#FB923C]" />
              <span>Reset Default Miku</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onDeleteProfile(draft.id);
                const fallback =
                  profiles.find((p) => p.id === DEFAULT_MIKU_ID) ??
                  createDefaultMikuProfile();
                setDraft({ ...fallback });
                flashFeedback('ok', 'Karakter kustom dihapus.');
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/12 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/22 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Karakter</span>
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#22D3EE]/45 bg-[#22D3EE]/14 px-3.5 py-1.5 text-xs font-semibold text-[#CFFAFE] transition-colors hover:bg-[#22D3EE]/24 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 text-[#22D3EE]" />
              <span>Simpan</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndChatNow}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#EA580C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(251,146,60,0.28)] transition-colors hover:bg-[#F97316] cursor-pointer"
            >
              <MessageCircleHeart className="h-3.5 w-3.5" />
              <span>Simpan & Mulai Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
