import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  KeyRound,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import type { AIModelDefinition, AppSettings, ModelCategory } from '../types/chat';
import { AI_MODELS } from '../services/modelCatalog';
import {
  getModelCooldownRemainingSec,
  isModelCoolingDown,
  resetAllModelCooldowns,
} from '../services/aiRouter';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSelectModel: (modelId: string) => void;
  onToggleAutoFallback: (enabled: boolean) => void;
  onOpenSettings: () => void;
}

const CATEGORIES: Array<{ id: 'all' | ModelCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'utama', label: 'Utama & Cepat' },
  { id: 'reasoning', label: 'Kode & Logika' },
  { id: 'bintang', label: 'Bintang & WormGPT' },
  { id: 'khusus', label: 'Spesialis' },
  { id: 'resmi', label: 'Kunci Pribadi' },
];

export function ModelPickerModal({
  isOpen,
  onClose,
  settings,
  onSelectModel,
  onToggleAutoFallback,
  onOpenSettings,
}: ModelPickerModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ModelCategory>('all');
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AI_MODELS.filter((m) => {
      if (activeCategory !== 'all' && m.category !== activeCategory && m.id !== 'auto') {
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
  }, [query, activeCategory]);

  if (!isOpen) return null;

  const hasCoolingModels = AI_MODELS.some((m) => isModelCoolingDown(m.id));

  const isKeyConfigured = (model: AIModelDefinition): boolean => {
    if (!model.requiresKey) return true;
    if (model.requiresKey === 'gemini') return Boolean(settings.geminiApiKey.trim());
    if (model.requiresKey === 'deepseek') return Boolean(settings.deepseekApiKey.trim());
    return true;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-model-picker-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up flex max-h-[86dvh] w-full flex-col rounded-t-[26px] border border-[#1C2433] bg-[#0B0F17] shadow-2xl sm:max-h-[82dvh] sm:max-w-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#293548]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C2433] px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2
              id="nodatagpt-model-picker-title"
              className="font-display text-base font-bold text-white sm:text-lg"
            >
              Pilih Model AI ({AI_MODELS.length} Jalur)
            </h2>
            <p className="text-xs text-[#9BA6B8]">
              Pilih spesifik atau biarkan router memilihkan yang tercepat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar model"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#B6C0D0] hover:bg-[#151C28] hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auto-Fallback Master Bar + Search */}
        <div className="space-y-2.5 border-b border-[#1C2433] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1C2433] bg-[#101622] px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <Shuffle className="h-4 w-4 shrink-0 text-[#FB923C]" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Auto-Fallback Saat Server Error
                </p>
                <p className="text-[11px] text-[#9BA6B8]">
                  Otomatis pindah ke model cadangan jika timeout
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoFallback}
              onClick={() => onToggleAutoFallback(!settings.autoFallback)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.autoFallback ? 'bg-[#0E7490]' : 'bg-[#263042]'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.autoFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9BA6B8]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari Gemini, Claude, DeepSeek, Qwen, WormGPT..."
                className="h-10 w-full rounded-xl border border-[#1C2433] bg-[#10141D] pr-3 pl-9 text-sm text-white placeholder-[#9BA6B8] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
            {hasCoolingModels && (
              <button
                type="button"
                onClick={() => {
                  resetAllModelCooldowns();
                  setRefreshTick((t) => t + 1);
                }}
                title="Segarkan semua server yang sedang dingin"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/10 px-3 text-xs font-medium text-[#FB923C] hover:bg-[#FB923C]/20 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Horizontal Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0E7490] text-white'
                      : 'border border-[#1C2433] bg-[#10141D] text-[#B6C0D0] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Model List */}
        <div className="pb-safe flex-1 space-y-1.5 overflow-y-auto p-3 sm:p-4">
          {filteredModels.map((model) => {
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
                className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#22D3EE] bg-[#121E2B]'
                    : 'border-[#1C2433] bg-[#10141D] hover:border-[#293548] hover:bg-[#151B27]'
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
                    <span className="rounded bg-[#182132] px-1.5 py-0.5 font-mono-code text-[10px] text-[#B6C0D0]">
                      {model.provider}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#9BA6B8]">
                    {model.description}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {!keyReady ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#FB923C]/40 bg-[#FB923C]/10 px-2 py-0.5 text-[10px] font-medium text-[#FB923C]">
                      <KeyRound className="h-2.5 w-2.5" />
                      Isi Key
                    </span>
                  ) : cooling ? (
                    <span className="rounded-full border border-[#FB923C]/40 bg-[#FB923C]/10 px-2 py-0.5 font-mono-code text-[10px] text-[#FB923C]">
                      Dingin {Math.ceil(remainSec / 60)}m
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-2 py-0.5 font-mono-code text-[10px] text-[#22D3EE]">
                      Siap
                    </span>
                  )}

                  {isSelected && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22D3EE] text-[#080A0F]">
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
