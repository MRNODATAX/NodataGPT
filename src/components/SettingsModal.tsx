import { useEffect, useState } from 'react';
import { Play, RotateCcw, Trash2, X } from 'lucide-react';
import { DEFAULT_WORMGPT_API } from '../services/wormgptApi';
import type { WormGptSettings } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  settings: WormGptSettings;
  totalSessions: number;
  onClose: () => void;
  onSaveSettings: (next: WormGptSettings) => void;
  onReplaySplash: () => void;
  onClearAllHistory: () => void;
}

export function SettingsModal({
  isOpen,
  settings,
  totalSessions,
  onClose,
  onSaveSettings,
  onReplaySplash,
  onClearAllHistory,
}: SettingsModalProps) {
  const [userName, setUserName] = useState(settings.userName);
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [contextMemory, setContextMemory] = useState(settings.contextMemory);
  const [streamEffect, setStreamEffect] = useState(settings.streamEffect);
  const [confirmClear, setConfirmClear] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUserName(settings.userName);
      setApiUrl(settings.apiUrl);
      setContextMemory(settings.contextMemory);
      setStreamEffect(settings.streamEffect);
      setConfirmClear(false);
      setUrlError(null);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = apiUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setUrlError('URL endpoint harus diawali dengan https:// atau http://');
      return;
    }
    setUrlError(null);
    onSaveSettings({
      ...settings,
      userName: userName.trim() || 'Sobat',
      apiUrl: trimmedUrl,
      contextMemory,
      streamEffect,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wormgpt-settings-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[16px] border border-[#2A2A34] bg-[#121216] p-5 text-[#FAFAFA] sm:p-6">
        <div className="flex items-center justify-between">
          <h2 id="wormgpt-settings-title" className="font-display text-lg font-semibold">
            Pengaturan WormGPT
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] hover:bg-[#1B1B22] hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="setting-user-name"
              className="mb-1.5 block text-xs font-semibold text-[#FAFAFA]"
            >
              Nama Sapaan
            </label>
            <input
              id="setting-user-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Sobat"
              className="min-h-11 w-full rounded-xl border border-[#262630] bg-[#0B0B0F] px-3.5 text-sm text-[#FAFAFA] placeholder:text-[#9E9EA8] focus:border-[#F97316]"
            />
            <p className="mt-1 text-xs text-[#9E9EA8]">
              Ditampilkan pada sapaan pembuka halaman utama.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="setting-api-url"
                className="text-xs font-semibold text-[#FAFAFA]"
              >
                Endpoint API WormGPT
              </label>
              <button
                type="button"
                onClick={() => {
                  setApiUrl(DEFAULT_WORMGPT_API);
                  setUrlError(null);
                }}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#FB923C] hover:bg-[#1E1513]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Default</span>
              </button>
            </div>
            <input
              id="setting-api-url"
              type="url"
              value={apiUrl}
              onChange={(e) => {
                setApiUrl(e.target.value);
                if (urlError) setUrlError(null);
              }}
              className="min-h-11 w-full rounded-xl border border-[#262630] bg-[#0B0B0F] px-3.5 font-mono text-xs text-[#FAFAFA] focus:border-[#F97316]"
            />
            {urlError ? (
              <p role="alert" className="mt-1 text-xs text-[#F87171]">
                {urlError}
              </p>
            ) : (
              <p className="mt-1 text-xs text-[#9E9EA8]">
                Pertanyaan akan dikirim secara otomatis melalui parameter kueri URL ini.
              </p>
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-[#22222B] bg-[#0C0C10] p-3.5">
            <label
              htmlFor="setting-memory-checkbox"
              className="flex min-h-11 items-center justify-between gap-3"
            >
              <span>
                <span className="block text-sm font-medium text-[#FAFAFA]">
                  Memori Konteks Percakapan
                </span>
                <span className="block text-xs text-[#9E9EA8]">
                  Sertakan ringkasan pesan sebelumnya saat mengirim pertanyaan lanjutan
                </span>
              </span>
              <input
                id="setting-memory-checkbox"
                type="checkbox"
                checked={contextMemory}
                onChange={(e) => setContextMemory(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#F97316]"
              />
            </label>

            <div className="border-t border-[#1D1D25]" />

            <label
              htmlFor="setting-stream-checkbox"
              className="flex min-h-11 items-center justify-between gap-3"
            >
              <span>
                <span className="block text-sm font-medium text-[#FAFAFA]">
                  Animasi Teks Bertahap
                </span>
                <span className="block text-xs text-[#9E9EA8]">
                  Tampilkan jawaban mengalir halus seperti ruang chat Gemini
                </span>
              </span>
              <input
                id="setting-stream-checkbox"
                type="checkbox"
                checked={streamEffect}
                onChange={(e) => setStreamEffect(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#F97316]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#22222B] bg-[#0C0C10] p-3.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplaySplash();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3B1B15] bg-[#181110] px-3.5 text-xs font-medium text-[#FB923C] hover:bg-[#231714]"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Putar Ulang Opening</span>
            </button>

            {!confirmClear ? (
              <button
                type="button"
                disabled={totalSessions === 0}
                onClick={() => setConfirmClear(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#451A1A] bg-[#1A0E0E] px-3.5 text-xs font-medium text-[#F87171] hover:bg-[#261313] disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hapus Semua Riwayat ({totalSessions})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-11 rounded-xl px-3 text-xs font-medium text-[#B4B4BE] hover:bg-[#1B1B22]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllHistory();
                    setConfirmClear(false);
                  }}
                  className="min-h-11 rounded-xl bg-[#B91C1C] px-3.5 text-xs font-semibold text-white hover:bg-[#991B1B]"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-[#2B2B36] bg-[#18181F] px-4 text-xs font-semibold text-[#FAFAFA] hover:bg-[#22222B]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-[#B91C1C] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#C2410C]"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
