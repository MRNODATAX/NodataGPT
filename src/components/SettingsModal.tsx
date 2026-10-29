import { useEffect, useState } from 'react';
import { KeyRound, Play, Sparkles, Trash2, X } from 'lucide-react';
import type { AppSettings } from '../types/chat';
import { AI_MODELS } from '../services/modelCatalog';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  conversationCount: number;
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onReplaySplash: () => void;
  onClearAllChats: () => void;
}

export function SettingsModal({
  isOpen,
  settings,
  conversationCount,
  onClose,
  onUpdateSettings,
  onReplaySplash,
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up flex max-h-[88dvh] w-full flex-col rounded-t-[26px] sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:py-4">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-safe flex-1 space-y-4 overflow-y-auto p-5">
          {/* Live Starfield & Shooting Stars */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                <span>Langit Malam & Bintang Jatuh Live</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Latar bintang berkelip dan meteor melintas hemat baterai di balik panel kaca.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.starfieldEnabled}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  starfieldEnabled: !settings.starfieldEnabled,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.starfieldEnabled ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.starfieldEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Typewriter Stream Effect + Live Seconds Timer */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Animasi Ketik AI & Timer Detik Live
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Tampilkan efek mengetik bertahap ala mesin ketik beserta hitungan detik real-time saat menulis.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.streamEffect}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  streamEffect: !settings.streamEffect,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.streamEffect ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.streamEffect ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Replay Opening Animation */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Animasi Pembuka NodataGPT
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Putar ulang animasi loading pembuka NodataGPT kapan saja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplaySplash();
              }}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-3 py-1.5 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/22 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Putar Ulang</span>
            </button>
          </div>

          {/* Auto Fallback */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-Fallback Chat Multi-Server
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Otomatis beralih ke model chat sehat berikutnya bila server yang dipilih sibuk.
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

          {/* Image Auto Fallback */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-Fallback Model Gambar AI
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Otomatis beralih ke mesin pembuat gambar sehat lain jika model gambar pilihan gagal atau padat.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.imageAutoFallback}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  imageAutoFallback: !settings.imageAutoFallback,
                })
              }
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

          {/* Memory Context */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Ingatan Konteks Percakapan
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Sertakan ringkasan pesan sebelumnya agar diskusi tetap nyambung.
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
                settings.memoryContextEnabled ? 'bg-[#0E7490]' : 'bg-white/20'
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
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Kirim dengan Tombol Enter (Desktop)
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
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
                settings.enterToSend ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.enterToSend ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Global NodataGPT Personalization */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="nodatagpt-persona-input"
                className="block text-sm font-medium text-white"
              >
                Personalisasi Global NodataGPT
              </label>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#67E8F9]">
                Aktif di {AI_MODELS.length - 1} Model · Mr.NODATA
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Identitas resmi sebagai asisten AI NodataGPT buatan Mr.NODATA otomatis diterapkan ke seluruh model AI yang dipanggil. Anda juga dapat menambahkan preferensi gaya bicara di bawah ini:
            </p>
            <textarea
              id="nodatagpt-persona-input"
              rows={2}
              value={settings.customPersona}
              onChange={(e) =>
                onUpdateSettings({ ...settings, customPersona: e.target.value })
              }
              placeholder="Opsional: Tambahkan gaya khusus (misal: gunakan gaya santai, sertakan analogi praktis, atau fokus pada TypeScript)..."
              className="w-full rounded-xl border border-white/10 bg-black/45 p-2.5 text-xs leading-relaxed text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          {/* Optional Personal API Keys */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
              <KeyRound className="h-4 w-4" />
              <span>Kunci API Pribadi (Opsional, Prioritas 0)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#94A3B8]">
              Disimpan lokal di perangkat Anda saja. Kosongkan bila ingin memakai{' '}
              {AI_MODELS.filter((m) => m.id !== 'auto' && !m.requiresKey).length} model tanpa kunci.
            </p>
            <div>
              <label
                htmlFor="gemini-key-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
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
                className="h-9 w-full rounded-lg border border-white/10 bg-black/55 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="deepseek-key-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
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
                className="h-9 w-full rounded-lg border border-white/10 bg-black/55 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>

          {/* Clear History */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-white">Data Percakapan Lokal</p>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Tersimpan {conversationCount} percakapan di peramban ini.
            </p>

            {!confirmClear ? (
              <button
                type="button"
                disabled={conversationCount === 0}
                onClick={() => setConfirmClear(true)}
                className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-3.5 py-2 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#FB923C]/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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
                  className="inline-flex min-h-[42px] items-center rounded-xl border border-white/20 px-3.5 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white cursor-pointer"
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
