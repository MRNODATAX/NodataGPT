import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1250;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setFadingOut(true);
        window.setTimeout(() => {
          onComplete();
        }, 260);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat NodataGPT"
      style={{
        background:
          'radial-gradient(circle at 46% 42%, rgba(34, 211, 238, 0.14), transparent 44%), radial-gradient(circle at 55% 44%, rgba(251, 146, 60, 0.13), transparent 44%), radial-gradient(ellipse 75% 55% at 50% 0%, rgba(190, 215, 255, 0.10), transparent 62%), #03050c',
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 transition-opacity duration-300 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Dual Counter-Rotating Orbital Rings + Breathing Logo (NodataNime Spec) */}
      <div className="relative flex h-[126px] w-[126px] items-center justify-center">
        {/* Outer Cyan Orbital Arc */}
        <svg
          width="126"
          height="126"
          viewBox="0 0 126 126"
          className="animate-orbit-fast pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nd-outer-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="63"
            cy="63"
            r="58"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
          />
          <circle
            cx="63"
            cy="63"
            r="58"
            fill="none"
            stroke="url(#nd-outer-orbit)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray="210 365"
          />
        </svg>

        {/* Inner Blaze Orange Counter-Rotating Arc */}
        <svg
          width="104"
          height="104"
          viewBox="0 0 104 104"
          className="animate-orbit-reverse pointer-events-none absolute"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nd-inner-orbit" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="52"
            cy="52"
            r="47"
            fill="none"
            stroke="url(#nd-inner-orbit)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="150 300"
          />
        </svg>

        <img
          src="/logo.png"
          alt="Logo NodataGPT"
          width={74}
          height={74}
          style={{
            boxShadow:
              '0 10px 30px rgba(34, 211, 238, 0.22), 0 10px 30px rgba(251, 146, 60, 0.18)',
          }}
          className="animate-logo-breath relative z-10 h-[74px] w-[74px] rounded-2xl border border-white/10 object-contain select-none"
        />
      </div>

      {/* Brand Wordmark directly below logo */}
      <div className="mt-5 text-center">
        <div className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">
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
        <p className="mt-1 font-mono-code text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CBD5E1]">
          MULTI-MODEL AI • BY MR.NODATA
        </p>
      </div>

      {/* Linear Progress Bar */}
      <div className="mt-5 w-48 max-w-[70vw]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#FB923C] to-white transition-[width] duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono-code text-[10px] text-[#94A3B8]">
          <span>STARFIELD & ROUTER</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
