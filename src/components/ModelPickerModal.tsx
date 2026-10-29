import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ImageIcon,
  KeyRound,
  MessageSquare,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AIModelDefinition,
  AppSettings,
  ImageModelCategory,
  ModelCategory,
} from '../types/chat';
import { AI_MODELS, IMAGE_MODELS } from '../services/modelCatalog';
import {
  getImageEngineCooldownRemainingSec,
  getModelCooldownRemainingSec,
  isImageEngineCoolingDown,
  isModelCoolingDown,
  resetAllImageEngineCooldowns,
  resetAllModelCooldowns,
} from '../services/aiRouter';

interface ModelPickerModalProps {
  isOpen: boolean;
  initialTab?: 'chat' | 'image';
  onClose: () => void;
  settings: AppSettings;
  onSelectModel: (modelId: string) => void;
  onToggleAutoFallback: (enabled: boolean) => void;
  onSelectImageModel: (imageModelId: string) => void;
  onToggleImageAutoFallback: (enabled: boolean) => void;
  onOpenSettings: () => void;
}

const CHAT_CATEGORIES: Array<{ id: 'all' | ModelCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'utama', label: 'Utama & Cepat' },
  { id: 'reasoning', label: 'Kode & Logika' },
  { id: 'bintang', label: 'Bintang & WormGPT' },
  { id: 'khusus', label: 'Spesialis' },
  { id: 'resmi', label: 'Kunci Pribadi' },
];

const IMAGE_CATEGORIES: Array<{ id: 'all' | ImageModelCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'cepat', label: 'Cepat & Rasio' },
  { id: 'artistik', label: 'Artistik & Flux' },
  { id: 'desain', label: 'Poster & Logo' },
  { id: 'direct', label: 'Direct Browser' },
];

export function ModelPickerModal({
  isOpen,
  initialTab = 'chat',
  onClose,
  settings,
  onSelectModel,
  onToggleAutoFallback,
  onSelectImageModel,
  onToggleImageAutoFallback,
  onOpenSettings,
}: ModelPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>(initialTab);
  const [query, setQuery] = useState('');
  const [activeChatCategory, setActiveChatCategory] = useState<'all' | ModelCategory>(
    'all'
  );
  const [activeImageCategory, setActiveImageCategory] = useState<
    'all' | ImageModelCategory
  >('all');
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setQuery('');
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filteredChatModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AI_MODELS.filter((m) => {
      if (
        activeChatCategory !== 'all' &&
        m.category !== activeChatCategory &&
        m.id !== 'auto'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [query, activeChatCategory]);

  const filteredImageModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IMAGE_MODELS.filter((m) => {
      if (
        activeImageCategory !== 'all' &&
        m.category !== activeImageCategory &&
        m.id !== 'auto'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.badge.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [query, activeImageCategory]);

  if (!isOpen) return null;

  const hasCoolingChatModels = AI_MODELS.some((m) => isModelCoolingDown(m.id));
  const hasCoolingImageModels = IMAGE_MODELS.some((m) =>
    isImageEngineCoolingDown(m.id)
  );

  const isKeyConfigured = (model: AIModelDefinition): boolean => {
    if (!model.requiresKey) return true;
    if (model.requiresKey === 'gemini') return Boolean(settings.geminiApiKey.trim());
    if (model.requiresKey === 'deepseek')
      return Boolean(settings.deepseekApiKey.trim());
    return true;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-model-picker-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up flex max-h-[88dvh] w-full flex-col rounded-t-[26px] sm:max-h-[84dvh] sm:max-w-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2
              id="nodatagpt-model-picker-title"
              className="font-display text-base font-bold text-white sm:text-lg"
            >
              {activeTab === 'chat'
                ? `Pilih Model Chat AI (${AI_MODELS.length} Jalur)`
                : `Pilih Model Gambar AI (${IMAGE_MODELS.length} Jalur)`}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {activeTab === 'chat'
                ? 'Pilih spesifik atau gunakan router pintar otomatis'
                : 'Pilih mesin gambar favorit dengan Auto-Fallback ke mesin lain bila sibuk'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar model"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs: Model Chat vs Model Gambar */}
        <div className="space-y-2.5 border-b border-white/10 px-4 py-3 sm:px-5">
          <div
            role="tablist"
            aria-label="Kategori jenis model AI"
            className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/45 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              onClick={() => {
                setActiveTab('chat');
                setQuery('');
              }}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#0E7490] text-white shadow-[0_0_14px_rgba(34,211,238,0.24)]'
                  : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Model Chat ({AI_MODELS.length - 1})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'image'}
              onClick={() => {
                setActiveTab('image');
                setQuery('');
              }}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-[#EA580C] text-white shadow-[0_0_14px_rgba(251,146,60,0.28)]'
                  : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Model Gambar ({IMAGE_MODELS.length - 1})</span>
            </button>
          </div>

          {/* Dedicated Auto-Fallback Switch for Active Tab */}
          {activeTab === 'chat' ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Shuffle className="h-4 w-4 shrink-0 text-[#FB923C]" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Auto-Fallback Chat Saat Server Error
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Otomatis pindah ke model chat sehat lain bila server utama sibuk
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoFallback}
                onClick={() => onToggleAutoFallback(!settings.autoFallback)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                  settings.autoFallback ? 'bg-[#0E7490]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.autoFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FB923C]/25 bg-[#FB923C]/[0.06] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Shuffle className="h-4 w-4 shrink-0 text-[#FB923C]" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Auto-Fallback Gambar ke Mesin Lain
                  </p>
                  <p className="text-[11px] text-[#CBD5E1]">
                    Otomatis beralih ke model gambar sehat lain jika pilihan utama gagal/sibuk
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.imageAutoFallback}
                onClick={() => onToggleImageAutoFallback(!settings.imageAutoFallback)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                  settings.imageAutoFallback ? 'bg-[#EA580C]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.imageAutoFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Search + Cooldown Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'chat'
                    ? 'Cari Gemini, Claude, DeepSeek, Qwen, Varhad...'
                    : 'Cari MagicStudio, Ideogram, Flux, WriteCream, Varhad, Sologo...'
                }
                className={`h-10 w-full rounded-xl border border-white/10 bg-black/45 pr-3 pl-9 text-sm text-white placeholder-[#94A3B8] focus:outline-none ${
                  activeTab === 'image'
                    ? 'focus:border-[#FB923C]'
                    : 'focus:border-[#22D3EE]'
                }`}
              />
            </div>

            {activeTab === 'chat' && hasCoolingChatModels && (
              <button
                type="button"
                onClick={() => {
                  resetAllModelCooldowns();
                  setRefreshTick((t) => t + 1);
                }}
                title="Segarkan semua server chat yang sedang dingin"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-3 text-xs font-medium text-[#FB923C] hover:bg-[#FB923C]/20 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}

            {activeTab === 'image' && hasCoolingImageModels && (
              <button
                type="button"
                onClick={() => {
                  resetAllImageEngineCooldowns();
                  setRefreshTick((t) => t + 1);
                }}
                title="Segarkan semua server gambar yang sedang dingin"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-3 text-xs font-medium text-[#FB923C] hover:bg-[#FB923C]/20 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          {activeTab === 'chat' ? (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {CHAT_CATEGORIES.map((cat) => {
                const active = activeChatCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveChatCategory(cat.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0E7490] text-white'
                        : 'border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {IMAGE_CATEGORIES.map((cat) => {
                const active = activeImageCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveImageCategory(cat.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EA580C] text-white'
                        : 'border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Model List */}
        <div className="pb-safe flex-1 space-y-1.5 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'chat'
            ? filteredChatModels.map((model) => {
                const isSelected = settings.selectedModelId === model.id;
                const cooling = isModelCoolingDown(model.id);
                const remainSec = cooling ? getModelCooldownRemainingSec(model.id) : 0;
                const keyReady = isKeyConfigured(model);

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      if (!keyReady) {
                        onClose();
                        onOpenSettings();
                        return;
                      }
                      onSelectModel(model.id);
                      onClose();
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#22D3EE] bg-[#22D3EE]/12 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {model.id === 'auto' && (
                          <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
                        )}
                        <span className="text-sm font-semibold text-white">
                          {model.name}
                        </span>
                        <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono-code text-[10px] text-[#CBD5E1]">
                          {model.provider}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                        {model.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {!keyReady ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#FB923C]/40 bg-[#FB923C]/12 px-2 py-0.5 text-[10px] font-medium text-[#FB923C]">
                          <KeyRound className="h-2.5 w-2.5" />
                          Isi Key
                        </span>
                      ) : cooling ? (
                        <span className="rounded-full border border-[#FB923C]/40 bg-[#FB923C]/12 px-2 py-0.5 font-mono-code text-[10px] text-[#FB923C]">
                          Dingin {Math.ceil(remainSec / 60)}m
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2 py-0.5 font-mono-code text-[10px] text-[#22D3EE]">
                          Siap
                        </span>
                      )}

                      {isSelected && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22D3EE] text-[#050812]">
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            : filteredImageModels.map((imgModel) => {
                const isSelected = settings.selectedImageModelId === imgModel.id;
                const cooling = isImageEngineCoolingDown(imgModel.id);
                const remainSec = cooling
                  ? getImageEngineCooldownRemainingSec(imgModel.id)
                  : 0;

                return (
                  <button
                    key={imgModel.id}
                    type="button"
                    onClick={() => {
                      onSelectImageModel(imgModel.id);
                      onClose();
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FB923C] bg-[#FB923C]/14 shadow-[0_0_20px_rgba(251,146,60,0.14)]'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {imgModel.id === 'auto' ? (
                          <Sparkles className="h-3.5 w-3.5 text-[#FB923C]" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-[#22D3EE]" />
                        )}
                        <span className="text-sm font-semibold text-white">
                          {imgModel.name}
                        </span>
                        <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono-code text-[10px] text-[#CBD5E1]">
                          {imgModel.provider}
                        </span>
                        <span className="rounded border border-[#FB923C]/30 bg-[#FB923C]/10 px-1.5 py-0.5 font-mono-code text-[10px] text-[#FDBA74]">
                          {imgModel.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                        {imgModel.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {cooling ? (
                        <span className="rounded-full border border-[#FB923C]/40 bg-[#FB923C]/12 px-2 py-0.5 font-mono-code text-[10px] text-[#FB923C]">
                          Dingin {Math.ceil(remainSec / 60)}m
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2 py-0.5 font-mono-code text-[10px] text-[#22D3EE]">
                          Siap
                        </span>
                      )}

                      {isSelected && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FB923C] text-[#050812]">
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
