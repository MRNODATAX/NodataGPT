import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1200;
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
        }, 220);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 transition-opacity duration-200 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Dual Cyan-Orange Orbital Ring */}
        <svg
          width="136"
          height="136"
          viewBox="0 0 136 136"
          className="animate-orbit-slow -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nodata-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="52%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
          </defs>
          <circle
            cx="68"
            cy="68"
            r="60"
            fill="none"
            stroke="#141B26"
            strokeWidth="2.5"
          />
          <circle
            cx="68"
            cy="68"
            r="60"
            fill="none"
            stroke="url(#nodata-ring-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * Math.max(progress, 18)) / 100}
          />
        </svg>

        <img
          src="/logo.png"
          alt="Logo NodataGPT"
          width={88}
          height={88}
          className="absolute h-[88px] w-[88px] rounded-full object-contain select-none"
        />
      </div>

      {/* Brand Wordmark directly below logo */}
      <div className="mt-5 text-center">
        <div className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
          <span className="text-[#22D3EE]">Nodata</span>
          <span className="text-[#FB923C]">GPT</span>
        </div>
        <p className="mt-1 text-xs font-medium tracking-wide text-[#9BA6B8]">
          Menyiapkan jaringan multi-model AI...
        </p>
      </div>

      {/* Linear Progress Bar */}
      <div className="mt-5 w-52 max-w-[72vw]">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#121824]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#06B6D4] to-[#FB923C] transition-[width] duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono-code text-[11px] text-[#9BA6B8]">
          <span>MULTI-MODEL</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
