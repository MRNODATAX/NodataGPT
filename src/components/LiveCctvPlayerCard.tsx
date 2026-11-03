import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  LayoutGrid,
  Loader2,
  MapPin,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Video,
} from 'lucide-react';
import type { CctvCameraItem } from '../types/chat';
import { buildGoogleMapsSearchUrl } from '../services/osintInspector';

interface LiveCctvPlayerCardProps {
  camera: CctvCameraItem;
  compact?: boolean;
}

type PlayerStatus =
  | 'loading'
  | 'live'
  | 'snapshot-fallback'
  | 'fallback-embed'
  | 'portal-only';

export function LiveCctvPlayerCard({
  camera,
  compact = false,
}: LiveCctvPlayerCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const getInitialStatus = (cam: CctvCameraItem): PlayerStatus => {
    if (cam.streamType === 'portal') return 'portal-only';
    if (cam.streamType === 'youtube' || cam.streamType === 'iframe') {
      return 'live';
    }
    return 'loading';
  };

  const camKey = `${camera.id}|${camera.streamType}|${camera.streamUrl}`;
  const [prevCamKey, setPrevCamKey] = useState(camKey);
  const [status, setStatus] = useState<PlayerStatus>(() =>
    getInitialStatus(camera)
  );
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [snapshotTick, setSnapshotTick] = useState<number>(() => Date.now());

  // Synchronously reset state on camera switch so <video ref={videoRef}> mounts on frame 1!
  if (prevCamKey !== camKey) {
    setPrevCamKey(camKey);
    setNeedsTapToPlay(false);
    setSnapshotTick(Date.now());
    setStatus(getInitialStatus(camera));
  }

  const handleManualRetry = useCallback(() => {
    setNeedsTapToPlay(false);
    setSnapshotTick(Date.now());
    setStatus(getInitialStatus(camera));
    setRetryCount((c) => c + 1);
  }, [camera]);

  // HLS (.m3u8) Engine — verified lowLatencyMode:false + true first-frame watchdog (zero infinite spin!)
  useEffect(() => {
    if (camera.streamType !== 'hls') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    let recoveredOnce = false;
    let frameConfirmed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsInstance: any = null;

    const detachVideoCleanly = () => {
      try {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      } catch {
        // ignore detach errors
      }
    };

    const triggerFallback = () => {
      if (cancelled || frameConfirmed) return;
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch {
          // ignore
        }
        hlsInstance = null;
      }
      detachVideoCleanly();

      if (camera.posterUrl) {
        setStatus('snapshot-fallback');
      } else if (camera.fallbackEmbedUrl) {
        setStatus('fallback-embed');
      } else {
        setStatus('portal-only');
      }
    };

    // Strict 7.5s First-Frame Watchdog: only cleared once <video> actually decodes real media data!
    const watchdog = window.setTimeout(() => {
      if (!frameConfirmed) {
        triggerFallback();
      }
    }, 7500);

    const markFrameReady = () => {
      if (cancelled || frameConfirmed) return;
      frameConfirmed = true;
      window.clearTimeout(watchdog);
      setStatus('live');
    };

    const onLoadedData = () => {
      if (videoEl.readyState >= 2) {
        markFrameReady();
      }
    };

    const onVideoError = () => {
      if (!frameConfirmed) {
        window.clearTimeout(watchdog);
        triggerFallback();
      }
    };

    videoEl.addEventListener('playing', markFrameReady);
    videoEl.addEventListener('loadeddata', onLoadedData);
    videoEl.addEventListener('canplay', onLoadedData);
    videoEl.addEventListener('error', onVideoError);

    const attemptAutoPlay = () => {
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (!cancelled) {
            // Browser blocked autoplay (e.g. iOS Low Power Mode) — show tap-to-play button, not spinner!
            frameConfirmed = true;
            window.clearTimeout(watchdog);
            setNeedsTapToPlay(true);
            setStatus('live');
          }
        });
      }
    };

    void (async () => {
      try {
        const mod = await import('hls.js');
        const Hls = mod.default;
        if (cancelled) return;

        // Prefer native HLS on iOS/macOS Safari where available & hls.js isn't needed
        if (!Hls || !Hls.isSupported()) {
          if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = camera.streamUrl;
            attemptAutoPlay();
          } else {
            window.clearTimeout(watchdog);
            triggerFallback();
          }
          return;
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // Standard ATCS/Nginx/Wowza HLS requires lowLatencyMode: false!
          maxBufferLength: 12,
          maxMaxBufferLength: 28,
          backBufferLength: 20,
          manifestLoadingTimeOut: 6000,
          manifestLoadingMaxRetry: 1,
          levelLoadingTimeOut: 6000,
          levelLoadingMaxRetry: 1,
          fragLoadingTimeOut: 6500,
          fragLoadingMaxRetry: 1,
        });
        hlsInstance = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_ev: unknown, data: { levels?: unknown[] }) => {
          if (cancelled) return;
          if (Array.isArray(data?.levels) && data.levels.length === 0) {
            window.clearTimeout(watchdog);
            triggerFallback();
            return;
          }
          attemptAutoPlay();
        });

        hls.on(
          Hls.Events.ERROR,
          (_ev: unknown, data: { fatal?: boolean; type?: string }) => {
            if (cancelled || !data?.fatal) return;
            if (!recoveredOnce && data.type === 'mediaError') {
              recoveredOnce = true;
              try {
                hls.recoverMediaError();
                return;
              } catch {
                // fall through
              }
            }
            window.clearTimeout(watchdog);
            triggerFallback();
          }
        );

        hls.attachMedia(videoEl);
        hls.loadSource(camera.streamUrl);
      } catch {
        window.clearTimeout(watchdog);
        triggerFallback();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      videoEl.removeEventListener('playing', markFrameReady);
      videoEl.removeEventListener('loadeddata', onLoadedData);
      videoEl.removeEventListener('canplay', onLoadedData);
      videoEl.removeEventListener('error', onVideoError);
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch {
          // ignore
        }
        hlsInstance = null;
      }
      detachVideoCleanly();
    };
  }, [
    camera.id,
    camera.streamType,
    camera.streamUrl,
    camera.posterUrl,
    camera.fallbackEmbedUrl,
    retryCount,
  ]);

  // Snapshot watchdog + auto-refresh interval (pauses when tab hidden)
  const isSnapshotActive =
    camera.streamType === 'snapshot' || status === 'snapshot-fallback';

  useEffect(() => {
    if (!isSnapshotActive) return;
    const snapWatchdog = window.setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'portal-only' : prev));
    }, 6500);

    const baseUrl =
      status === 'snapshot-fallback' && camera.posterUrl
        ? camera.posterUrl
        : camera.streamUrl;
    const intervalMs = baseUrl.includes('nyctmc.org') ? 4000 : 15000;
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setSnapshotTick(Date.now());
    }, intervalMs);

    return () => {
      window.clearTimeout(snapWatchdog);
      window.clearInterval(id);
    };
  }, [
    isSnapshotActive,
    status,
    camera.id,
    camera.streamUrl,
    camera.posterUrl,
    retryCount,
  ]);

  const mapsUrl = buildGoogleMapsSearchUrl(`${camera.lat},${camera.lon}`);
  const activeSnapshotBase =
    status === 'snapshot-fallback' && camera.posterUrl
      ? camera.posterUrl
      : camera.streamUrl;
  const snapshotSrc = isSnapshotActive
    ? `${activeSnapshotBase}${activeSnapshotBase.includes('?') ? '&' : '?'}t=${snapshotTick}`
    : '';

  const activeIframeUrl =
    status === 'fallback-embed' && camera.fallbackEmbedUrl
      ? camera.fallbackEmbedUrl
      : camera.streamUrl;

  return (
    <div
      data-testid="live-cctv-player-card"
      className="overflow-hidden rounded-2xl border border-white/12 bg-[#060B16]/95 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >
      {/* Top Status Strip */}
      <div className="flex items-center justify-between gap-2 border-b border-white/8 bg-black/45 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono-code text-[10px] font-bold ${
              status === 'portal-only'
                ? 'border border-[#FB923C]/35 bg-[#FB923C]/14 text-[#FED7AA]'
                : 'border border-emerald-400/40 bg-emerald-500/16 text-emerald-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === 'portal-only'
                  ? 'bg-[#FB923C]'
                  : 'animate-pulse bg-emerald-400'
              }`}
            />
            {status === 'portal-only'
              ? 'PORTAL RESMI'
              : isSnapshotActive
                ? 'LIVE FRAME'
                : 'LIVE'}
          </span>
          <span className="truncate font-display text-xs font-bold text-white sm:text-[13px]">
            {camera.name}
          </span>
        </div>

        <span className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono-code text-[10px] text-[#94A3B8] sm:inline-block">
          {camera.city}
        </span>
      </div>

      {/* 16:9 Video / Snapshot / Embed Viewport */}
      <div className="relative aspect-video w-full bg-[#03060D]">
        {camera.streamType === 'hls' &&
          status !== 'snapshot-fallback' &&
          status !== 'fallback-embed' &&
          status !== 'portal-only' && (
            <>
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                controls
                poster={camera.posterUrl}
                className="h-full w-full bg-black object-contain"
              />
              {status === 'loading' && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-[2px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#22D3EE]" />
                  <span className="text-[11px] font-medium text-[#CBD5E1]">
                    Menghubungkan kamera {camera.city}...
                  </span>
                </div>
              )}
              {needsTapToPlay && (
                <button
                  type="button"
                  onClick={() => {
                    setNeedsTapToPlay(false);
                    videoRef.current?.play().catch(() => {});
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-[2px] cursor-pointer"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#22D3EE]/50 bg-[#0E7490] shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                  <span className="text-xs font-bold">Ketuk untuk Putar Live</span>
                </button>
              )}
            </>
          )}

        {isSnapshotActive && status !== 'portal-only' && (
          <>
            <img
              src={snapshotSrc}
              alt={camera.name}
              onLoad={() => setStatus((prev) => (prev === 'loading' ? 'live' : prev))}
              onError={() => setStatus('portal-only')}
              className="h-full w-full bg-black object-contain"
            />
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-6 w-6 animate-spin text-[#22D3EE]" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSnapshotTick(Date.now())}
              title="Segarkan frame kamera sekarang"
              className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs transition-colors hover:border-[#22D3EE]/60 hover:text-[#67E8F9] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 text-[#22D3EE]" />
              <span>Segarkan</span>
            </button>
          </>
        )}

        {(camera.streamType === 'youtube' ||
          camera.streamType === 'iframe' ||
          status === 'fallback-embed') &&
          status !== 'portal-only' &&
          status !== 'snapshot-fallback' && (
            <iframe
              src={activeIframeUrl}
              title={camera.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full border-0 bg-black"
            />
          )}

        {status === 'portal-only' && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[#061220] via-[#050912] to-[#160E07] px-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#22D3EE]">
              <Radio className="h-5 w-5" />
            </span>
            <div className="max-w-sm">
              <p className="font-display text-xs font-bold text-white sm:text-sm">
                Buka Tayangan di Portal {camera.operator}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                {camera.streamType === 'portal'
                  ? 'Instansi daerah mempublikasikan stream melalui portal peta resmi. Klik tombol di bawah untuk menonton langsung:'
                  : 'Stream sedang penuh/dibatasi CORS oleh jaringan daerah. Anda dapat mencoba ulang atau membuka langsung di portal resminya:'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={camera.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E7490] px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(34,211,238,0.25)] transition-colors hover:bg-[#0891B2]"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Buka Live CCTV Resmi</span>
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                <span>Titik Google Maps</span>
              </a>
              {camera.streamType !== 'portal' && (
                <button
                  type="button"
                  onClick={handleManualRetry}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 py-2 text-xs font-semibold text-[#E2E8F0] transition-colors hover:bg-white/12 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#22D3EE]" />
                  <span>Coba Lagi</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Geo & Action Footer */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 bg-black/55 px-3 ${
          compact ? 'py-2' : 'py-2.5'
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-[#CBD5E1]">
            {camera.city}, {camera.provinceOrCountry} ·{' '}
            <span className="text-[#94A3B8]">{camera.operator}</span>
          </p>
          <p className="font-mono-code text-[10px] text-[#64748B]">
            GPS: {camera.lat.toFixed(4)}, {camera.lon.toFixed(4)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/12 px-2.5 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/22"
          >
            <MapPin className="h-3 w-3 text-emerald-300" />
            <span>Maps</span>
          </a>
          <a
            href={camera.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 text-[11px] font-medium text-[#E2E8F0] transition-colors hover:border-[#22D3EE]/45 hover:text-white"
          >
            <ExternalLink className="h-3 w-3 text-[#22D3EE]" />
            <span>Sumber</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function InChatCctvDeck({
  cameras,
  onOpenCommandCenter,
}: {
  cameras: CctvCameraItem[];
  onOpenCommandCenter?: (initialCamera?: CctvCameraItem) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!cameras || cameras.length === 0) return null;

  const safeIdx = Math.min(activeIdx, cameras.length - 1);
  const currentCam = cameras[safeIdx];

  return (
    <div
      data-testid="inchat-cctv-deck"
      className="mt-3 space-y-2.5 rounded-2xl border border-[#22D3EE]/25 bg-[#040914]/90 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#67E8F9]">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          Pemutar Live CCTV Langsung ({safeIdx + 1}/{cameras.length})
        </span>

        {onOpenCommandCenter && (
          <button
            type="button"
            onClick={() => onOpenCommandCenter(currentCam)}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#FB923C]/45 bg-[#FB923C]/16 px-3 text-[11px] font-bold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/26 cursor-pointer"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-[#FB923C]" />
            <span>Buka Ruang Pantau Multi-CCTV</span>
          </button>
        )}
      </div>

      {/* Camera Switcher Pills */}
      {cameras.length > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {cameras.map((cam, idx) => {
            const active = idx === safeIdx;
            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-all cursor-pointer ${
                  active
                    ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/25 hover:text-white'
                }`}
              >
                {idx + 1}. {cam.city} · {cam.name.slice(0, 22)}
              </button>
            );
          })}
        </div>
      )}

      <LiveCctvPlayerCard key={currentCam.id} camera={currentCam} />
    </div>
  );
}
