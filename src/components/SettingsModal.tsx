import { useEffect, useState } from 'react';
import { KeyRound, Trash2, X } from 'lucide-react';
import type { AppSettings } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  conversationCount: number;
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onClearAllChats: () => void;
}

export function SettingsModal({
  isOpen,
  settings,
  conversationCount,
  onClose,
  onUpdateSettings,
  onClearAllChats,
}: SettingsModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-settings-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up flex max-h-[88dvh] w-full flex-col rounded-t-[26px] border border-[#1C2433] bg-[#0B0F17] shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#293548]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#1C2433] px-5 py-3.5 sm:py-4">
          <h2
            id="nodatagpt-settings-title"
            className="font-display text-base font-bold text-white sm:text-lg"
          >
            Pengaturan NodataGPT
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#B6C0D0] hover:bg-[#151C28] hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-safe flex-1 space-y-4 overflow-y-auto p-5">
          {/* Auto Fallback */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-Fallback Multi-Server
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#9BA6B8]">
                Otomatis beralih ke model sehat berikutnya bila server yang dipilih mengalami timeout atau gangguan.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoFallback}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  autoFallback: !settings.autoFallback,
                })
              }
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

          {/* Memory Context */}
          <div className="flex items-start justify-between gap-4 border-t border-[#1C2433] pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Ingatan Konteks Percakapan
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#9BA6B8]">
                Sertakan ringkasan pesan sebelumnya agar diskusi tetap nyambung pada API stateless.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.memoryContextEnabled}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  memoryContextEnabled: !settings.memoryContextEnabled,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.memoryContextEnabled ? 'bg-[#0E7490]' : 'bg-[#263042]'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.memoryContextEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Enter to Send */}
          <div className="flex items-start justify-between gap-4 border-t border-[#1C2433] pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Kirim dengan Tombol Enter (Desktop)
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#9BA6B8]">
                Tekan Enter untuk mengirim dan Shift + Enter untuk baris baru.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enterToSend}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  enterToSend: !settings.enterToSend,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.enterToSend ? 'bg-[#0E7490]' : 'bg-[#263042]'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.enterToSend ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Custom Persona for Rin aicostum */}
          <div className="space-y-1.5 border-t border-[#1C2433] pt-4">
            <label
              htmlFor="nodatagpt-persona-input"
              className="block text-sm font-medium text-white"
            >
              Instruksi Karakter (Model AI Persona Kustom)
            </label>
            <textarea
              id="nodatagpt-persona-input"
              rows={2}
              value={settings.customPersona}
              onChange={(e) =>
                onUpdateSettings({ ...settings, customPersona: e.target.value })
              }
              placeholder="Contoh: Kamu adalah mentor senior full-stack yang lugas..."
              className="w-full rounded-xl border border-[#1C2433] bg-[#10141D] p-2.5 text-xs leading-relaxed text-white placeholder-[#9BA6B8] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          {/* Optional Personal API Keys */}
          <div className="space-y-3 rounded-xl border border-[#1C2433] bg-[#10141D] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
              <KeyRound className="h-4 w-4" />
              <span>Kunci API Pribadi (Opsional, Prioritas 0)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#9BA6B8]">
              Disimpan lokal di perangkat Anda saja. Kosongkan bila ingin memakai 23 model tanpa kunci.
            </p>
            <div>
              <label
                htmlFor="gemini-key-input"
                className="mb-1 block text-xs font-medium text-[#B6C0D0]"
              >
                Google AI Studio API Key (Gemini 2.5 Flash)
              </label>
              <input
                id="gemini-key-input"
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, geminiApiKey: e.target.value })
                }
                placeholder="AIzaSy..."
                className="h-9 w-full rounded-lg border border-[#1C2433] bg-[#080A0F] px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="deepseek-key-input"
                className="mb-1 block text-xs font-medium text-[#B6C0D0]"
              >
                DeepSeek Official API Key
              </label>
              <input
                id="deepseek-key-input"
                type="password"
                value={settings.deepseekApiKey}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, deepseekApiKey: e.target.value })
                }
                placeholder="sk-..."
                className="h-9 w-full rounded-lg border border-[#1C2433] bg-[#080A0F] px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>

          {/* Clear History */}
          <div className="border-t border-[#1C2433] pt-4">
            <p className="text-sm font-medium text-white">Data Percakapan Lokal</p>
            <p className="mt-0.5 text-xs text-[#9BA6B8]">
              Tersimpan {conversationCount} percakapan di peramban ini.
            </p>

            {!confirmClear ? (
              <button
                type="button"
                disabled={conversationCount === 0}
                onClick={() => setConfirmClear(true)}
                className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/10 px-3.5 py-2 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#FB923C]/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Semua Riwayat</span>
              </button>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllChats();
                    setConfirmClear(false);
                  }}
                  className="inline-flex min-h-[42px] items-center rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#F97316] cursor-pointer"
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex min-h-[42px] items-center rounded-xl border border-[#293548] px-3.5 py-2 text-xs font-medium text-[#B6C0D0] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
