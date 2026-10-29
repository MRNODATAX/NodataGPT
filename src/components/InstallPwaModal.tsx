import { useEffect } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  canPromptNativeInstall: boolean;
  isIos: boolean;
  isAndroid: boolean;
  onTriggerNativeInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

export function InstallPwaModal({
  isOpen,
  onClose,
  canPromptNativeInstall,
  isIos,
  isAndroid,
  onTriggerNativeInstall,
}: InstallPwaModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await onTriggerNativeInstall();
    if (result === 'accepted') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-install-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up pb-safe w-full rounded-t-[26px] p-5 sm:max-w-md sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Ikon Aplikasi NodataGPT"
              width={48}
              height={48}
              className="h-12 w-12 rounded-2xl border border-white/12 object-contain"
            />
            <div>
              <h2
                id="nodatagpt-install-title"
                className="font-display text-lg font-bold text-white"
              >
                Pasang NodataGPT
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Aplikasi layar penuh Android & Desktop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan pemasangan"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-4 space-y-2 text-xs text-[#CBD5E1]">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22D3EE]" />
            <span>Tampil penuh tanpa bilah alamat layaknya aplikasi native</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FB923C]" />
            <span>Ikon NodataGPT langsung muncul di layar utama HP Anda</span>
          </li>
        </ul>

        {canPromptNativeInstall ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0E7490] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0891B2] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Pasang Sekarang</span>
          </button>
        ) : isIos ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-relaxed text-[#F8FAFC]">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-[#22D3EE]">
              <Share className="h-4 w-4" />
              <span>Cara Pasang di iPhone / iPad (Safari):</span>
            </p>
            <ol className="list-decimal space-y-1.5 pl-4 text-[#CBD5E1]">
              <li>Ketuk ikon <strong className="text-white">Bagikan (Share)</strong> di Safari.</li>
              <li>Pilih <strong className="text-white">Tambahkan ke Layar Utama</strong>.</li>
              <li>Ketuk <strong className="text-white">Tambah</strong> di pojok kanan atas.</li>
            </ol>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-relaxed text-[#F8FAFC]">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-[#22D3EE]">
              <Smartphone className="h-4 w-4" />
              <span>
                {isAndroid
                  ? 'Cara Pasang APK (WebAPK) di Chrome Android:'
                  : 'Cara Pasang Aplikasi:'}
              </span>
            </p>
            <ol className="list-decimal space-y-1.5 pl-4 text-[#CBD5E1]">
              <li>Buka menu titik tiga <strong className="text-white">(⋮)</strong> di pojok kanan atas Chrome.</li>
              <li>Pilih <strong className="text-white">Instal aplikasi</strong> atau <strong className="text-white">Tambahkan ke layar utama</strong>.</li>
              <li>Konfirmasi pemasangan agar NodataGPT muncul di daftar aplikasi.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
