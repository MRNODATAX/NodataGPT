import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

function getBootStageLabel(progress: number): string {
  if (progress < 32) return 'Menyiapkan antarmuka...';
  if (progress < 68) return 'Memuat sesi lokal...';
  if (progress < 96) return 'Menghubungkan endpoint WormGPT...';
  return 'Siap digunakan';
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState<number>(0);
  const [exiting, setExiting] = useState<boolean>(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durationMs = prefersReducedMotion ? 450 : 2100;
    const startTime = performance.now();
    let frameId = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const linear = Math.min(1, elapsed / durationMs);
      // Cubic ease-out feels snappy at start and settles cleanly at 100%
      const eased = 1 - Math.pow(1 - linear, 3);
      const current = Math.min(100, Math.round(eased * 100));
      setProgress(current);

      if (linear < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        finishTimer = setTimeout(() => {
          onComplete();
        }, prefersReducedMotion ? 60 : 300);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setProgress(100);
    setExiting(true);
    setTimeout(onComplete, 120);
  };

  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black px-6 py-10 transition-opacity duration-300 ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="h-11" aria-hidden="true" />

      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <div
          className="relative flex h-36 w-36 items-center justify-center"
          style={{
            filter: 'drop-shadow(0 0 28px rgba(173, 9, 10, 0.35))',
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 144 144"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="wormgpt-splash-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AD090A" />
                <stop offset="55%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="#17171D"
              strokeWidth="2.5"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="url(#wormgpt-splash-arc)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <img
            src="/logo.png"
            alt="Logo WormGPT"
            width={104}
            height={104}
            fetchPriority="high"
            className="h-[104px] w-[104px] rounded-full object-contain select-none"
          />
        </div>

        <div className="mt-5 font-display text-3xl font-bold tracking-tight text-[#FAFAFA] sm:text-4xl">
          <span>Worm</span>
          <span className="text-[#F97316]">GPT</span>
        </div>

        <div className="mt-7 w-full">
          <div
            role="progressbar"
            aria-label="Progres pembukaan WormGPT"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#16161C]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#AD090A] via-[#DC2626] to-[#F97316] transition-[width] duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-[#B4B4BE]">{getBootStageLabel(progress)}</span>
            <span className="font-mono font-medium tabular-nums text-[#FB923C]">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="min-h-11 rounded-lg px-5 text-xs font-medium text-[#9E9EA8] transition-colors hover:bg-[#141418] hover:text-[#FAFAFA]"
      >
        Lewati pembuka
      </button>
    </div>
  );
}
