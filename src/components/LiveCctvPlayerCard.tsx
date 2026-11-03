import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  LayoutGrid,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Video,
} from 'lucide-react';
import type { CctvCameraItem } from '../types/chat';
import { buildGoogleMapsSearchUrl } from '../services/osintInspector';

interface LiveCctvPlayerCardProps {
  camera: CctvCameraItem;
  compact?: boolean;
}

export function LiveCctvPlayerCard({
  camera,
  compact = false,
}: LiveCctvPlayerCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'fallback-embed' | 'portal-only'>(
    camera.streamType === 'portal' ? 'portal-only' : 'loading'
  );
  const [snapshotTick, setSnapshotTick] = useState<number>(() => Date.now());

  // Reset player state when camera changes
  useEffect(() => {
    setStatus(camera.streamType === 'portal' ? 'portal-only' : 'loading');
    setSnapshotTick(Date.now());
  }, [camera.id, camera.streamType, camera.streamUrl]);

  // HLS (.m3u8) Engine — dynamic import('hls.js') + native Safari fallback + watchdog
  useEffect(() => {
    if (camera.streamType !== 'hls') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    let hlsInstance: { destroy: () => void } | null = null;

    const triggerFallback = () => {
      if (cancelled) return;
      if (camera.fallbackEmbedUrl) {
        setStatus('fallback-embed');
      } else {
        setStatus('portal-only');
      }
    };

    const watchdog = window.setTimeout(() => {
      setStatus((prev) => {
        if (prev === 'loading') {
          return camera.fallbackEmbedUrl ? 'fallback-embed' : 'portal-only';
        }
        return prev;
      });
    }, 10500);

    const onPlaying = () => {
      if (!cancelled) {
        window.clearTimeout(watchdog);
        setStatus('live');
      }
    };

    videoEl.addEventListener('playing', onPlaying);
    videoEl.addEventListener('loadeddata', onPlaying);

    void (async () => {
      try {
        const mod = await import('hls.js');
        const Hls = mod.default;
        if (cancelled) return;

        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingTimeOut: 9000,
            levelLoadingTimeOut: 9000,
          });
          hlsInstance = hls;
          hls.loadSource(camera.streamUrl);
          hls.attachMedia(videoEl);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            window.clearTimeout(watchdog);
            setStatus('live');
            videoEl.play().catch(() => {
              // Autoplay muted allowed; user can tap play if browser requires gesture
            });
          });
          hls.on(Hls.Events.ERROR, (_ev, data) => {
            if (data?.fatal) {
              window.clearTimeout(watchdog);
              hls.destroy();
              hlsInstance = null;
              triggerFallback();
            }
          });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = camera.streamUrl;
          videoEl.play().catch(() => {});
        } else {
          triggerFallback();
        }
      } catch {
        triggerFallback();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      videoEl.removeEventListener('playing', onPlaying);
      videoEl.removeEventListener('loadeddata', onPlaying);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [camera.id, camera.streamType, camera.streamUrl, camera.fallbackEmbedUrl]);

  // Auto-refresh interval for live snapshot traffic cams (pauses when tab hidden)
  useEffect(() => {
    if (camera.streamType !== 'snapshot') return;
    const intervalMs = camera.streamUrl.includes('nyctmc.org') ? 5000 : 18000;
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setSnapshotTick(Date.now());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [camera.id, camera.streamType, camera.streamUrl]);

  const mapsUrl = buildGoogleMapsSearchUrl(`${camera.lat},${camera.lon}`);
  const snapshotSrc =
    camera.streamType === 'snapshot'
      ? `${camera.streamUrl}${camera.streamUrl.includes('?') ? '&' : '?'}t=${snapshotTick}`
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
              : camera.streamType === 'snapshot'
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
        {camera.streamType === 'hls' && status !== 'fallback-embed' && status !== 'portal-only' && (
          <>
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              controls
              poster={camera.posterUrl}
              className="h-full w-full object-contain bg-black"
            />
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-[2px]">
                <Loader2 className="h-6 w-6 animate-spin text-[#22D3EE]" />
                <span className="text-[11px] font-medium text-[#CBD5E1]">
                  Menghubungkan stream HLS {camera.city}...
                </span>
              </div>
            )}
          </>
        )}

        {camera.streamType === 'snapshot' && status !== 'portal-only' && (
          <>
            <img
              src={snapshotSrc}
              alt={camera.name}
              onLoad={() => setStatus('live')}
              onError={() => setStatus('portal-only')}
              className="h-full w-full object-contain bg-black"
            />
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55">
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
          status !== 'portal-only' && (
            <iframe
              src={activeIframeUrl}
              title={camera.name}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => setStatus('live')}
              className="h-full w-full border-0 bg-black"
            />
          )}

        {status === 'portal-only' && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[#061220] via-[#050912] to-[#160E07] px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#22D3EE]">
              <Radio className="h-5 w-5" />
            </span>
            <div className="max-w-sm">
              <p className="font-display text-xs font-bold text-white sm:text-sm">
                Stream Langsung di Portal {camera.operator}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                Server instansi membatasi penyematan pihak ketiga (CORS/X-Frame) demi keamanan jaringan daerah. Buka tayangan penuh langsung di portal resminya:
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

      <LiveCctvPlayerCard camera={currentCam} />
    </div>
  );
}
