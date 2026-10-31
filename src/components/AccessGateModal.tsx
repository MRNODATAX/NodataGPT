import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import {
  FREE_TRIAL_LIMIT,
  WHATSAPP_DISPLAY_NUMBER,
  buildWhatsAppRequestKeyUrl,
  submitAccessKeyUnlock,
  type AccessGateState,
} from '../services/accessGate';

interface AccessGateModalProps {
  isOpen: boolean;
  isHardLocked: boolean;
  gateState: AccessGateState;
  onClose: () => void;
  onUnlocked: (nextState: AccessGateState) => void;
  onOpenByokSettings: () => void;
}

export function AccessGateModal({
  isOpen,
  isHardLocked,
  gateState,
  onClose,
  onUnlocked,
  onOpenByokSettings,
}: AccessGateModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setErrorMsg(null);
      setUnlockedSuccess(false);
      setSubmitting(false);
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHardLocked && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isHardLocked, submitting, onClose]);

  if (!isOpen) return null;

  const usedCount = Math.min(FREE_TRIAL_LIMIT, Math.max(0, gateState.used));
  const remainingCount = Math.max(0, FREE_TRIAL_LIMIT - usedCount);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip.trim()) {
          setPassword(clip.trim());
          setErrorMsg(null);
          inputRef.current?.focus();
        }
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || unlockedSuccess) return;

    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMsg('Silakan masukkan sandi akses terlebih dahulu.');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const result = await submitAccessKeyUnlock(trimmed);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(
        result.error || 'Sandi akses tidak sesuai. Silakan coba lagi atau minta kunci via WhatsApp.'
      );
      return;
    }

    setUnlockedSuccess(true);
    window.setTimeout(() => {
      onUnlocked(result.state);
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nd-lock-screen-title"
      onClick={() => {
        if (!isHardLocked && !submitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020617]/90 p-3.5 backdrop-blur-xl sm:p-5"
    >
      {/* Ambient Cyan & Orange Cosmic Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/12 blur-[95px]" />
        <div className="absolute right-1/3 bottom-1/4 h-64 w-64 rounded-full bg-[#FB923C]/12 blur-[95px]" />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-y-auto rounded-3xl border border-white/14 bg-[#070B16]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(34,211,238,0.12)] sm:p-6"
      >
        {/* Top Row: Security Pill + Optional Close (only when not hard-locked) */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-code text-[10.5px] font-semibold tracking-wider uppercase ${
              unlockedSuccess
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : isHardLocked
                  ? 'border-[#FB923C]/45 bg-[#FB923C]/14 text-[#FED7AA]'
                  : 'border-[#22D3EE]/40 bg-[#22D3EE]/12 text-[#A5F3FC]'
            }`}
          >
            {unlockedSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>AKSES VIP TERBUKA</span>
              </>
            ) : isHardLocked ? (
              <>
                <Lock className="h-3 w-3 text-[#FB923C]" />
                <span>LAYAR TERKUNCI · {FREE_TRIAL_LIMIT}/{FREE_TRIAL_LIMIT} SELESAI</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span>UJI COBA · SISA {remainingCount}/{FREE_TRIAL_LIMIT}</span>
              </>
            )}
          </span>

          {!isHardLocked && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog kunci akses"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Brand Lock Emblem & Heading */}
        <div className="mt-4 flex shrink-0 flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/14 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_0_28px_rgba(34,211,238,0.16)]">
            <img
              src="/logo-transparent.png"
              alt="NodataGPT"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span
              className={`absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-md ${
                unlockedSuccess
                  ? 'border-emerald-300/50 bg-emerald-500 text-slate-950'
                  : isHardLocked
                    ? 'border-[#FB923C]/60 bg-[#0F172A] text-[#FB923C]'
                    : 'border-[#22D3EE]/60 bg-[#0F172A] text-[#22D3EE]'
              }`}
            >
              {unlockedSuccess ? (
                <Unlock className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
            </span>
          </div>

          <h2
            id="nd-lock-screen-title"
            className="mt-3.5 font-display text-xl font-bold tracking-tight text-white sm:text-[22px]"
          >
            {unlockedSuccess ? (
              'Selamat Datang di Mode VIP!'
            ) : isHardLocked ? (
              <>
                Akses <span className="text-[#22D3EE]">Nodata</span>
                <span className="text-[#FB923C]">GPT</span> Terkunci
              </>
            ) : (
              <>
                Buka Akses Penuh <span className="text-[#22D3EE]">Nodata</span>
                <span className="text-[#FB923C]">GPT</span>
              </>
            )}
          </h2>

          <p className="mt-1.5 max-w-[360px] text-xs leading-relaxed text-[#94A3B8] sm:text-[13px]">
            {unlockedSuccess
              ? 'Verifikasi berhasil. Seluruh model AI, generator gambar, dan Web Tools kini aktif tanpa batas.'
              : isHardLocked
                ? 'Anda telah mencoba NodataGPT sebanyak 5 kali. Masukkan sandi akses untuk membuka kunci dan melanjutkan percakapan tanpa batas.'
                : `Anda memiliki sisa ${remainingCount} dari ${FREE_TRIAL_LIMIT} uji coba gratis. Masukkan sandi sekarang jika sudah memiliki kunci akses VIP.`}
          </p>
        </div>

        {/* 5-Segment Trial Progress Bar */}
        <div className="mt-4 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-[#CBD5E1]">Kuota Uji Coba Gratis</span>
            <span className="font-mono-code font-semibold text-[#F8FAFC]">
              {usedCount} / {FREE_TRIAL_LIMIT} Terpakai
            </span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {Array.from({ length: FREE_TRIAL_LIMIT }).map((_, idx) => {
              const consumed = idx < usedCount;
              return (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    consumed
                      ? isHardLocked
                        ? 'bg-gradient-to-r from-[#FB923C] to-[#F97316] shadow-[0_0_8px_rgba(251,146,60,0.45)]'
                        : 'bg-gradient-to-r from-[#22D3EE] to-[#06B6D4]'
                      : 'bg-white/10'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Password Unlock Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex shrink-0 flex-col gap-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="nd-access-password-input"
                className="text-xs font-semibold text-[#E2E8F0]"
              >
                Sandi / Kunci Akses VIP
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#94A3B8] transition-colors hover:border-[#22D3EE]/40 hover:text-[#22D3EE] cursor-pointer"
              >
                <ClipboardPaste className="h-3 w-3" />
                <span>Tempel</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <KeyRound className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#22D3EE]" />
              <input
                ref={inputRef}
                id="nd-access-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Masukkan sandi akses..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={submitting || unlockedSuccess}
                className="h-12 w-full rounded-xl border border-white/15 bg-[#0B1222] pr-11 pl-10 font-mono-code text-sm text-white placeholder-[#64748B] transition-colors focus:border-[#22D3EE]/70 focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/35 bg-rose-500/12 px-3 py-2 text-xs leading-relaxed text-rose-200"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || unlockedSuccess}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0891B2] via-[#06B6D4] to-[#22D3EE] px-4 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi Kunci...</span>
              </>
            ) : unlockedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Kunci Terbuka!</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Buka Kunci Akses Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-3.5 flex shrink-0 items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-medium text-[#64748B]">
            Belum punya sandi akses?
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* WhatsApp Request Key CTA (0881080593445) */}
        <a
          href={buildWhatsAppRequestKeyUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-[50px] shrink-0 items-center justify-between gap-3 rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-3.5 py-2.5 text-left transition-all hover:border-emerald-400/65 hover:bg-emerald-500/18"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-emerald-200 sm:text-[13px]">
                Minta Kunci Akses via WhatsApp
              </div>
              <div className="truncate font-mono-code text-[11px] text-emerald-300/85">
                WhatsApp Admin: {WHATSAPP_DISPLAY_NUMBER}
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-lg bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition-transform group-hover:translate-x-0.5">
            Chat WA →
          </span>
        </a>

        {/* Secondary Footer: Voluntary Continue OR BYOK Personal API Key */}
        <div className="mt-3.5 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3 text-[11px] text-[#94A3B8]">
          <button
            type="button"
            onClick={onOpenByokSettings}
            className="text-left underline decoration-white/25 underline-offset-4 transition-colors hover:text-[#22D3EE] cursor-pointer"
          >
            Gunakan API Key Pribadi (BYOK)
          </button>

          {!isHardLocked && (
            <button
              type="button"
              onClick={onClose}
              className="font-medium text-[#CBD5E1] transition-colors hover:text-white cursor-pointer"
            >
              Lanjut Uji Coba ({remainingCount}x tersisa)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
