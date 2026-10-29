import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import type { DevicePlatform } from '../hooks/usePwaInstall';

interface InstallPwaModalProps {
  isOpen: boolean;
  isStandalone: boolean;
  canPromptNatively: boolean;
  platform: DevicePlatform;
  onClose: () => void;
  onTriggerNativeInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function InstallPwaModal({
  isOpen,
  isStandalone,
  canPromptNatively,
  platform,
  onClose,
  onTriggerNativeInstall,
}: InstallPwaModalProps) {
  const [activeTab, setActiveTab] = useState<DevicePlatform>(platform);
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(platform);
  }, [platform]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await onTriggerNativeInstall();
    if (result === 'accepted') {
      setInstallNotice('Pemasangan WormGPT sedang diproses oleh sistem perangkat Anda.');
    } else if (result === 'dismissed') {
      setInstallNotice('Dialog pemasangan ditutup. Anda dapat memasang kapan saja dari menu browser.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-pwa-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-[16px] border border-[#2A2A34] bg-[#121216] p-5 text-[#FAFAFA] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Ikon Aplikasi WormGPT"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl border border-[#2C1814] object-contain"
            />
            <div>
              <h2 id="install-pwa-title" className="font-display text-lg font-semibold">
                Pasang WormGPT (PWA / APK)
              </h2>
              <p className="text-xs text-[#B4B4BE]">
                Jalankan penuh layar layaknya aplikasi Android mandiri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog pemasangan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] hover:bg-[#1B1B22] hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isStandalone ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#3B1B15] bg-[#191210] p-4 text-sm text-[#FAFAFA]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FB923C]" aria-hidden="true" />
            <span>WormGPT saat ini sudah berjalan dalam mode aplikasi mandiri (Standalone PWA).</span>
          </div>
        ) : (
          <>
            {canPromptNatively && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C2410C]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Pasang Aplikasi Sekarang</span>
                </button>
              </div>
            )}

            {installNotice && (
              <p className="mt-3 rounded-lg bg-[#1A1412] px-3 py-2 text-xs text-[#FB923C]">
                {installNotice}
              </p>
            )}

            <div className="mt-5">
              <div
                role="tablist"
                aria-label="Panduan pemasangan berdasarkan perangkat"
                className="grid grid-cols-3 gap-1 rounded-xl bg-[#0B0B0F] p-1"
              >
                {(
                  [
                    { id: 'android', label: 'Android' },
                    { id: 'ios', label: 'iOS' },
                    { id: 'desktop', label: 'Desktop' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-11 rounded-lg px-2 text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1D1412] text-[#FB923C]'
                        : 'text-[#B4B4BE] hover:text-[#FAFAFA]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-[#22222A] bg-[#0D0D12] p-4 text-sm leading-relaxed text-[#D4D4DC]">
                {activeTab === 'android' && (
                  <ol className="list-decimal space-y-2 pl-4">
                    <li>Buka halaman ini menggunakan browser <strong>Google Chrome</strong> di Android.</li>
                    <li>Ketuk ikon menu <strong>titik tiga</strong> di pojok kanan atas browser.</li>
                    <li>
                      Pilih <strong>Tambahkan ke layar utama</strong> lalu ketuk{' '}
                      <strong>Instal</strong> untuk memasang WebAPK WormGPT di laci aplikasi Anda.
                    </li>
                  </ol>
                )}

                {activeTab === 'ios' && (
                  <ol className="list-decimal space-y-2 pl-4">
                    <li>Buka halaman ini di browser <strong>Safari</strong> pada iPhone atau iPad.</li>
                    <li>
                      Ketuk tombol <strong>Bagikan</strong>{' '}
                      <Share className="inline h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" /> di
                      bilah bawah Safari.
                    </li>
                    <li>Gulir ke bawah dan ketuk <strong>Tambahkan ke Layar Utama</strong>.</li>
                  </ol>
                )}

                {activeTab === 'desktop' && (
                  <ol className="list-decimal space-y-2 pl-4">
                    <li>Buka di Google Chrome, Microsoft Edge, atau Brave Desktop.</li>
                    <li>
                      Klik ikon <Smartphone className="inline h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />{' '}
                      <strong>Pasang WormGPT</strong> pada sisi kanan bilah alamat URL.
                    </li>
                    <li>Konfirmasi klik <strong>Instal</strong> untuk membuka jendela mandiri.</li>
                  </ol>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-[#2B2B36] bg-[#18181F] px-5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#22222B]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
