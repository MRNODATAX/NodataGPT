import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Cpu, Layers, Sparkles, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

interface BootModule {
  id: string;
  label: string;
  threshold: number;
  icon: typeof Sparkles;
  accent: 'cyan' | 'orange';
}

const BOOT_MODULES: BootModule[] = [
  { id: 'starfield', label: 'Starfield GPU', threshold: 24, icon: Sparkles, accent: 'cyan' },
  { id: 'persona', label: 'Persona Mr.NODATA', threshold: 52, icon: Cpu, accent: 'orange' },
  { id: 'router', label: '25 Server AI', threshold: 78, icon: Layers, accent: 'cyan' },
  { id: 'fallback', label: 'Auto-Fallback', threshold: 96, icon: Zap, accent: 'orange' },
];

function getBootStageLabel(progress: number): string {
  if (progress < 26) return 'Menyalakan langit bintang & meteor GPU...';
  if (progress < 54) return 'Memuat sesi & identitas NodataGPT · Mr.NODATA...';
  if (progress < 82) return 'Menyinkronkan 25 jalur model AI & Auto-Fallback...';
  if (progress < 98) return 'Mengoptimalkan antarmuka Cosmic Glass...';
  return 'NodataGPT siap digunakan';
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const [warpNotice, setWarpNotice] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const warpBoostRef = useRef(0);
  const completedRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);

  const finishSplash = useCallback(
    (delayMs: number) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setFadingOut(true);
      finishTimerRef.current = window.setTimeout(() => {
        onComplete();
      }, delayMs);
    },
    [onComplete]
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durationMs = prefersReducedMotion ? 550 : 3350;
    const startTime = performance.now();
    let rafId = 0;

    const tick = () => {
      const rawElapsed = Math.max(0, performance.now() - startTime);
      setElapsedSec(rawElapsed / 1000);

      const linear = Math.min(1, rawElapsed / durationMs + warpBoostRef.current);
      // Smooth ease-out curve with tactile mid-stage cadence
      const eased = 1 - Math.pow(1 - linear, 2.35);
      const pct = Math.min(100, Math.round(eased * 100));
      setProgress(pct);

      if (linear < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        finishSplash(prefersReducedMotion ? 80 : 340);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    };
  }, [finishSplash]);

  const triggerInteractivePulse = () => {
    if (completedRef.current) return;
    warpBoostRef.current = Math.min(0.85, warpBoostRef.current + 0.16);
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev.slice(-3), id]);
    setWarpNotice(true);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item !== id));
    }, 700);
    window.setTimeout(() => {
      setWarpNotice(false);
    }, 900);
  };

  const handleSkip = () => {
    setProgress(100);
    finishSplash(150);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = ((e.clientX / w) - 0.5) * 14;
    const ny = ((e.clientY / h) - 0.5) * 14;
    setParallax({ x: nx, y: ny });
  };

  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat NodataGPT"
      onPointerMove={handlePointerMove}
      style={{
        background: `radial-gradient(circle at ${48 + parallax.x * 0.6}% ${38 + parallax.y * 0.6}%, rgba(34, 211, 238, 0.17), transparent 45%), radial-gradient(circle at ${54 - parallax.x * 0.5}% ${44 - parallax.y * 0.5}%, rgba(251, 146, 60, 0.15), transparent 45%), rgba(3, 5, 12, 0.86)`,
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between px-5 py-8 backdrop-blur-md transition-opacity duration-300 sm:py-10 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top Status Chip */}
      <div className="pt-safe flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 font-mono-code text-[10px] font-medium tracking-wider text-[#CBD5E1]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
        <span>NODATA COSMIC ENGINE v3.2</span>
        <span className="text-white/25">•</span>
        <span className="tabular-nums text-[#FB923C]">{elapsedSec.toFixed(1)} dtk</span>
      </div>

      {/* Center Interactive Orbital Core + Telemetry */}
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Interactive Orbital Logo Button */}
        <button
          type="button"
          onClick={triggerInteractivePulse}
          aria-label="Ketuk logo NodataGPT untuk akselerasi pemuatan"
          style={{
            transform: `translate3d(${parallax.x * 0.55}px, ${parallax.y * 0.55}px, 0)`,
          }}
          className="group relative flex h-[152px] w-[152px] items-center justify-center rounded-full transition-transform duration-150 ease-out focus:outline-none active:scale-95 cursor-pointer"
        >
          {/* Interactive Shockwave Ripples on Tap/Click */}
          {ripples.map((id) => (
            <span
              key={id}
              aria-hidden="true"
              className="animate-pulse-ring pointer-events-none absolute inset-2 rounded-full border-2 border-[#22D3EE]/70 shadow-[0_0_24px_rgba(251,146,60,0.45)]"
            />
          ))}

          {/* Live 0% -> 100% Progress Arc SVG (WormGPT Heritage + Cyan/Orange Upgrade) */}
          <svg
            width="152"
            height="152"
            viewBox="0 0 152 152"
            className="pointer-events-none absolute inset-0 -rotate-90"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nd-splash-progress-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="52%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>
            </defs>
            <circle
              cx="76"
              cy="76"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2.5"
            />
            <circle
              cx="76"
              cy="76"
              r={radius}
              fill="none"
              stroke="url(#nd-splash-progress-arc)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 60ms linear' }}
            />
          </svg>

          {/* Outer Spinning Cyan Orbital Arc */}
          <svg
            width="132"
            height="132"
            viewBox="0 0 132 132"
            className="animate-orbit-fast pointer-events-none absolute"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nd-outer-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="66"
              cy="66"
              r="57"
              fill="none"
              stroke="url(#nd-outer-orbit)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="165 360"
            />
          </svg>

          {/* Inner Counter-Rotating Blaze Orange Orbital Arc */}
          <svg
            width="112"
            height="112"
            viewBox="0 0 112 112"
            className="animate-orbit-reverse pointer-events-none absolute"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nd-inner-orbit" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#F97316" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="url(#nd-inner-orbit)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="130 310"
            />
          </svg>

          <img
            src="/logo.png"
            alt="Logo NodataGPT"
            width={82}
            height={82}
            fetchPriority="high"
            style={{
              boxShadow:
                '0 12px 34px rgba(34, 211, 238, 0.25), 0 12px 34px rgba(251, 146, 60, 0.2)',
            }}
            className="animate-logo-breath relative z-10 h-[82px] w-[82px] rounded-2xl border border-white/15 object-contain transition-transform duration-200 group-hover:scale-105 select-none"
          />
        </button>

        {/* Interactive Hint / Warp Feedback */}
        <div className="mt-2 h-5">
          {warpNotice ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#FB923C]/40 bg-[#FB923C]/15 px-2.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#FDBA74]">
              <Zap className="h-3 w-3" />
              Akselerasi Warp +16%
            </span>
          ) : (
            <span className="font-mono-code text-[10px] text-[#94A3B8]">
              Ketuk inti logo untuk akselerasi warp
            </span>
          )}
        </div>

        {/* Brand Wordmark directly below logo */}
        <div className="mt-2">
          <div className="font-display text-[30px] font-bold tracking-tight sm:text-[34px]">
            <span
              style={{ textShadow: '0 0 24px rgba(34, 211, 238, 0.42)' }}
              className="text-[#22D3EE]"
            >
              Nodata
            </span>
            <span
              style={{ textShadow: '0 0 24px rgba(251, 146, 60, 0.42)' }}
              className="text-[#FB923C]"
            >
              GPT
            </span>
          </div>
          <p className="mt-0.5 font-mono-code text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CBD5E1]">
            MULTI-MODEL AI • BY MR.NODATA
          </p>
        </div>

        {/* Interactive Telemetry & Progress Card */}
        <div className="nd-glass-card mt-5 w-full rounded-2xl p-3.5 text-left">
          <div
            role="progressbar"
            aria-label="Progres pembukaan NodataGPT"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#FB923C] to-white transition-[width] duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-[#CBD5E1]">{getBootStageLabel(progress)}</span>
            <span className="shrink-0 font-mono-code font-semibold tabular-nums text-[#22D3EE]">
              {progress}%
            </span>
          </div>

          {/* 4 Interactive Subsystem Pills */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {BOOT_MODULES.map((mod) => {
              const Icon = mod.icon;
              const ready = progress >= mod.threshold;
              const isCyan = mod.accent === 'cyan';
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={triggerInteractivePulse}
                  className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                    ready
                      ? isCyan
                        ? 'border-[#22D3EE]/35 bg-[#22D3EE]/12 text-white'
                        : 'border-[#FB923C]/35 bg-[#FB923C]/12 text-white'
                      : 'border-white/8 bg-black/30 text-[#94A3B8] hover:border-white/18'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        ready
                          ? isCyan
                            ? 'text-[#22D3EE]'
                            : 'text-[#FB923C]'
                          : 'text-[#64748B]'
                      }`}
                    />
                    <span className="truncate">{mod.label}</span>
                  </span>
                  {ready ? (
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isCyan ? 'text-[#22D3EE]' : 'text-[#FB923C]'
                      }`}
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white/25" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skip Action Button (WormGPT Heritage) */}
      <button
        type="button"
        onClick={handleSkip}
        className="pb-safe inline-flex min-h-[42px] items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white cursor-pointer"
      >
        Lewati pembuka
      </button>
    </div>
  );
}
