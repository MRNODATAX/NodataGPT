import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ExternalLink,
  Layers,
  LayoutGrid,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  RotateCcw,
  Video,
} from 'lucide-react';
import type { CctvCameraAngle, CctvCameraItem } from '../types/chat';
import { buildGoogleMapsSearchUrl } from '../services/osintInspector';

interface LiveCctvPlayerCardProps {
  camera: CctvCameraItem;
  compact?: boolean;
}

type PlayerStatus = 'loading' | 'live' | 'fallback-embed' | 'portal-only';
type HlsStage = 'direct' | 'proxy';

export function LiveCctvPlayerCard({
  camera,
  compact = false,
}: LiveCctvPlayerCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [angleIdx, setAngleIdx] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const safeAngleIdx =
    camera.angles && camera.angles.length > 0
      ? Math.min(angleIdx, camera.angles.length - 1)
      : 0;

  const activeAngle: CctvCameraAngle =
    camera.angles && camera.angles.length > 0
      ? camera.angles[safeAngleIdx]
      : {
          label: 'Kamera Utama',
          streamType: camera.streamType,
          streamUrl: camera.streamUrl,
          fallbackEmbedUrl: camera.fallbackEmbedUrl,
          proxyHlsFirst: camera.proxyHlsFirst,
        };

  const initialHlsStage: HlsStage = activeAngle.proxyHlsFirst ? 'proxy' : 'direct';

  const [hlsStage, setHlsStage] = useState<HlsStage>(initialHlsStage);
  const [status, setStatus] = useState<PlayerStatus>(
    activeAngle.streamType === 'portal' ? 'portal-only' : 'loading'
  );
  const [connectMs, setConnectMs] = useState<number | null>(null);
  const [snapshotTick, setSnapshotTick] = useState<number>(() => Date.now());

  // Reset angle when switching to a different camera
  useEffect(() => {
    setAngleIdx(0);
  }, [camera.id]);

  // Reset player state when camera, angle, or manual reload changes
  useEffect(() => {
    const nextStage: HlsStage = activeAngle.proxyHlsFirst ? 'proxy' : 'direct';
    setHlsStage(nextStage);
    setConnectMs(null);
    setStatus(activeAngle.streamType === 'portal' ? 'portal-only' : 'loading');
    setSnapshotTick(Date.now());
  }, [
    camera.id,
    safeAngleIdx,
    activeAngle.streamType,
    activeAngle.streamUrl,
    activeAngle.proxyHlsFirst,
    reloadNonce,
  ]);

  // Anti-Muter 3-Stage Fail-Fast HLS Engine:
  // Stage 1: Direct HLS (3.6s max, 0 retries) -> Stage 2: Same-Origin Relay Proxy (4.4s max) -> Stage 3: Instant Fallback Embed / Portal
  useEffect(() => {
    if (activeAngle.streamType !== 'hls') return;
    if (status === 'fallback-embed' || status === 'portal-only') return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    let hlsInstance: { destroy: () => void } | null = null;
    const startedAt = performance.now();

    const effectiveSourceUrl =
      hlsStage === 'proxy'
        ? `/api/proxy?cctvStream=1&url=${encodeURIComponent(activeAngle.streamUrl)}`
        : activeAngle.streamUrl;

    const escalateFailure = () => {
      if (cancelled) return;
      if (hlsStage === 'direct') {
        setHlsStage('proxy');
        return;
      }
      if (activeAngle.fallbackEmbedUrl) {
        setStatus('fallback-embed');
      } else {
        setStatus('portal-only');
      }
    };

    const stageTimeoutMs = hlsStage === 'direct' ? 3600 : 4400;
    const watchdog = window.setTimeout(() => {
      escalateFailure();
    }, stageTimeoutMs);

    const markLive = () => {
      if (cancelled) return;
      window.clearTimeout(watchdog);
      setConnectMs((prev) => prev ?? Math.max(40, Math.round(performance.now() - startedAt)));
      setStatus('live');
    };

    videoEl.addEventListener('playing', markLive);
    videoEl.addEventListener('loadeddata', markLive);

    void (async () => {
      try {
        const mod = await import('hls.js');
        const Hls = mod.default;
        if (cancelled) return;

        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingTimeOut: hlsStage === 'direct' ? 3400 : 4200,
            manifestLoadingMaxRetry: 0,
            levelLoadingTimeOut: 4000,
            levelLoadingMaxRetry: 0,
            fragLoadingTimeOut: 5000,
            fragLoadingMaxRetry: 1,
            xhrSetup: (xhr) => {
              if (hlsStage === 'proxy') {
                xhr.withCredentials = true;
              }
            },
          });
          hlsInstance = hls;
          hls.loadSource(effectiveSourceUrl);
          hls.attachMedia(videoEl);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            markLive();
            videoEl.play().catch(() => {
              // Muted autoplay supported; user can unmute/play anytime
            });
          });
          hls.on(Hls.Events.ERROR, (_ev, data) => {
            if (data?.fatal) {
              window.clearTimeout(watchdog);
              hls.destroy();
              hlsInstance = null;
              escalateFailure();
            }
          });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = effectiveSourceUrl;
          videoEl.onerror = () => {
            window.clearTimeout(watchdog);
            escalateFailure();
          };
          videoEl.play().catch(() => {});
        } else {
          window.clearTimeout(watchdog);
          escalateFailure();
        }
      } catch {
        window.clearTimeout(watchdog);
        escalateFailure();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      videoEl.removeEventListener('playing', markLive);
      videoEl.removeEventListener('loadeddata', markLive);
      videoEl.onerror = null;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [
    camera.id,
    safeAngleIdx,
    activeAngle.streamType,
    activeAngle.streamUrl,
    activeAngle.fallbackEmbedUrl,
    hlsStage,
    status,
    reloadNonce,
  ]);

  // Anti-Muter guard for YouTube / Embed iframes: never leave spinner stuck > 1.8s
  useEffect(() => {
    const isEmbedActive =
      activeAngle.streamType === 'youtube' ||
      activeAngle.streamType === 'iframe' ||
      status === 'fallback-embed';
    if (!isEmbedActive || status === 'live' || status === 'portal-only') return;

    const timer = window.setTimeout(() => {
      setStatus('live');
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [activeAngle.streamType, status, safeAngleIdx, reloadNonce]);

  // Real-time auto-refresh for snapshot traffic cameras (NYC 3.5s, Singapore/EU 16s)
  useEffect(() => {
    if (activeAngle.streamType !== 'snapshot') return;
    const intervalMs = activeAngle.streamUrl.includes('nyctmc.org') ? 3500 : 16000;
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setSnapshotTick(Date.now());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [camera.id, safeAngleIdx, activeAngle.streamType, activeAngle.streamUrl]);

  const mapsUrl = buildGoogleMapsSearchUrl(`${camera.lat},${camera.lon}`);
  const snapshotSrc =
    activeAngle.streamType === 'snapshot'
      ? `${activeAngle.streamUrl}${
          activeAngle.streamUrl.includes('?') ? '&' : '?'
        }t=${snapshotTick}`
      : '';

  const isEmbedMode =
    activeAngle.streamType === 'youtube' ||
    activeAngle.streamType === 'iframe' ||
    status === 'fallback-embed';

  const activeIframeUrl =
    status === 'fallback-embed' && activeAngle.fallbackEmbedUrl
      ? activeAngle.fallbackEmbedUrl
      : activeAngle.streamUrl;

  const badgeText =
    status === 'portal-only'
      ? 'PORTAL RESMI'
      : activeAngle.streamType === 'snapshot'
        ? 'LIVE FRAME'
        : isEmbedMode
          ? 'LIVE EMBED'
          : hlsStage === 'proxy'
            ? `LIVE RELAY${connectMs ? ` · ${connectMs}ms` : ''}`
            : `LIVE HLS${connectMs ? ` · ${connectMs}ms` : ''}`;

  const handleManualReload = () => {
    setReloadNonce((n) => n + 1);
  };

  const canToggleEmbedBackup =
    activeAngle.streamType === 'hls' && Boolean(activeAngle.fallbackEmbedUrl);

  return (
    <div
      data-testid="live-cctv-player-card"
      className="overflow-hidden rounded-2xl border border-white/12 bg-[#060B16]/95 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >
      {/* Top Status & Quick Control Strip */}
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
            {badgeText}
          </span>
          <span className="truncate font-display text-xs font-bold text-white sm:text-[13px]">
            {camera.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canToggleEmbedBackup && (
            <button
              type="button"
              onClick={() =>
                setStatus((prev) =>
                  prev === 'fallback-embed' ? 'loading' : 'fallback-embed'
                )
              }
              title="Ganti jalur pemutar HLS / Embed cadangan"
              className="inline-flex h-6 items-center gap-1 rounded-md border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2 font-mono-code text-[10px] font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/22 cursor-pointer"
            >
              <Layers className="h-3 w-3" />
              <span>{status === 'fallback-embed' ? 'Mode HLS' : 'Embed'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleManualReload}
            title="Muat ulang koneksi kamera real-time"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/50 hover:text-[#67E8F9] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <span className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono-code text-[10px] text-[#94A3B8] sm:inline-block">
            {camera.city}
          </span>
        </div>
      </div>

      {/* Multi-Angle Camera Switcher (when multiple angles exist on the same intersection) */}
      {camera.angles && camera.angles.length > 1 && (
        <div
          data-testid="cctv-angle-switcher"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-white/8 bg-[#050A14] px-3 py-1.5"
        >
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#94A3B8]">
            <Camera className="h-3 w-3 text-[#22D3EE]" />
            Sudut:
          </span>
          {camera.angles.map((ang, idx) => {
            const isSelected = idx === safeAngleIdx;
            return (
              <button
                key={`${camera.id}-angle-${idx}`}
                type="button"
                onClick={() => setAngleIdx(idx)}
                className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#22D3EE]/70 bg-[#22D3EE]/18 text-white'
                    : 'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:border-white/25 hover:text-white'
                }`}
              >
                {ang.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 16:9 Real-Time Video / Snapshot / Embed Viewport */}
      <div className="relative aspect-video w-full bg-[#03060D]">
        {activeAngle.streamType === 'hls' &&
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
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 px-4 text-center backdrop-blur-[2px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#22D3EE]" />
                  <span className="text-[11px] font-semibold text-[#E2E8F0]">
                    {hlsStage === 'proxy'
                      ? `Menghubungkan jalur relay cepat ${camera.city}...`
                      : `Menghubungkan stream langsung ${camera.city}...`}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    Fail-fast aktif (&lt; 4 dtk otomatis beralih jika terhalang CORS)
                  </span>
                </div>
              )}
            </>
          )}

        {activeAngle.streamType === 'snapshot' && status !== 'portal-only' && (
          <>
            <img
              src={snapshotSrc}
              alt={camera.name}
              onLoad={() => setStatus('live')}
              onError={() => setStatus('portal-only')}
              className="h-full w-full bg-black object-contain"
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

        {isEmbedMode && status !== 'portal-only' && (
          <>
            <iframe
              key={`${camera.id}-${safeAngleIdx}-${reloadNonce}-${activeIframeUrl}`}
              src={activeIframeUrl}
              title={camera.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              onLoad={() => setStatus('live')}
              className="h-full w-full border-0 bg-black"
            />
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
                <Loader2 className="h-5 w-5 animate-spin text-[#22D3EE]" />
              </div>
            )}
          </>
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
                Titik kamera ini menggunakan proteksi sesi portal internal instansi atau sedang jeda pemeliharaan. Anda dapat mencoba ulang koneksi atau membuka tayangan langsung di portal resminya:
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeAngle.streamType !== 'portal' && (
                <button
                  type="button"
                  onClick={handleManualReload}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#22D3EE]/45 bg-[#22D3EE]/14 px-3 py-2 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/24 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Coba Ulang</span>
                </button>
              )}
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
          Pemutar Real-Time Live CCTV ({safeIdx + 1}/{cameras.length})
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
