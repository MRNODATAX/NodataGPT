import { useEffect, useMemo, useState } from 'react';
import {
  Globe2,
  LayoutGrid,
  Loader2,
  MapPin,
  Maximize2,
  Radio,
  Search,
  Shuffle,
  X,
} from 'lucide-react';
import type { CctvCameraItem } from '../types/chat';
import {
  CURATED_CCTV_CAMERAS,
  INDONESIA_REGION_GROUPS,
  WORLD_REGION_GROUPS,
  getAllAvailableCctvCameras,
} from '../services/cctvDirectory';
import { LiveCctvPlayerCard } from './LiveCctvPlayerCard';

interface CctvCommandCenterModalProps {
  isOpen: boolean;
  initialCamera?: CctvCameraItem | null;
  onClose: () => void;
}

export function CctvCommandCenterModal({
  isOpen,
  initialCamera,
  onClose,
}: CctvCommandCenterModalProps) {
  const [cameras, setCameras] = useState<CctvCameraItem[]>(CURATED_CCTV_CAMERAS);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [scope, setScope] = useState<'all' | 'indonesia' | 'world'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'quad'>('single');
  const [selectedCamId, setSelectedCamId] = useState<string>(
    CURATED_CCTV_CAMERAS[0]?.id || ''
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initialCamera) {
      setSelectedCamId(initialCamera.id);
      setScope('all');
      setRegionFilter('Semua');
    }

    const ctrl = new AbortController();
    setLoadingDynamic(true);
    void getAllAvailableCctvCameras(ctrl.signal)
      .then((merged) => {
        if (!ctrl.signal.aborted && merged.length > 0) {
          setCameras(merged);
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingDynamic(false);
      });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      ctrl.abort();
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, initialCamera, onClose]);

  const regionChips = useMemo(() => {
    if (scope === 'indonesia') {
      return INDONESIA_REGION_GROUPS.map((r) =>
        r === 'Semua Indonesia' ? 'Semua' : r
      );
    }
    if (scope === 'world') {
      return WORLD_REGION_GROUPS.map((r) => (r === 'Semua Dunia' ? 'Semua' : r));
    }
    return [
      'Semua',
      'Jabodetabek',
      'Jawa Barat',
      'Jateng & DIY',
      'Jawa Timur',
      'Bali & Nusra',
      'Sumatera',
      'Jalan Tol, Nasional & Gunung',
      'Timur Tengah (Makkah & Madinah)',
      'Asia Tenggara & Timur',
      'Amerika Utara',
      'Eropa & Antariksa',
    ];
  }, [scope]);

  const filteredCameras = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cameras.filter((cam) => {
      if (scope !== 'all' && cam.scope !== scope) return false;
      if (regionFilter !== 'Semua' && cam.regionGroup !== regionFilter) {
        return false;
      }
      if (!q) return true;
      const hay =
        `${cam.name} ${cam.city} ${cam.provinceOrCountry} ${cam.regionGroup} ${cam.operator}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cameras, scope, regionFilter, searchQuery]);

  if (!isOpen) return null;

  const activeCamera =
    filteredCameras.find((c) => c.id === selectedCamId) ||
    cameras.find((c) => c.id === selectedCamId) ||
    filteredCameras[0] ||
    cameras[0];

  const quadCameras: CctvCameraItem[] = (() => {
    const base = filteredCameras.length > 0 ? filteredCameras : cameras;
    const startIdx = Math.max(
      0,
      base.findIndex((c) => c.id === activeCamera?.id)
    );
    const out: CctvCameraItem[] = [];
    for (let i = 0; i < Math.min(4, base.length); i++) {
      out.push(base[(startIdx + i) % base.length]);
    }
    return out;
  })();

  const handleJumpRandom = () => {
    const pool = filteredCameras.length > 0 ? filteredCameras : cameras;
    if (pool.length === 0) return;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCamId(picked.id);
  };

  const indonesiaCount = cameras.filter((c) => c.scope === 'indonesia').length;
  const worldCount = cameras.filter((c) => c.scope === 'world').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-cctv-center-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        data-testid="cctv-command-center-modal"
        className="nd-glass-sheet animate-sheet-up flex max-h-[93dvh] w-full flex-col overflow-hidden rounded-t-[26px] sm:max-h-[90dvh] sm:max-w-6xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Command Header */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-white/10 bg-[#050914]/95 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/14 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.2)]">
              <Radio className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="nodatagpt-cctv-center-title"
                  className="truncate font-display text-base font-bold text-white sm:text-lg"
                >
                  Ruang Pantau Live CCTV Publik
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono-code text-[10.5px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {cameras.length} Titik ({indonesiaCount} ID · {worldCount} Dunia)
                </span>
                {loadingDynamic && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#67E8F9]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sinkronisasi API Live...
                  </span>
                )}
              </div>
              <p className="hidden text-xs text-[#94A3B8] sm:block">
                ATCS Dishub Daerah, Jalan Nasional PUPR, Bali Satu Data, LTA Singapura, NYC DOT, Makkah/Madinah &amp; NASA ISS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop/Tablet Single vs 2x2 Wall Toggle */}
            <div className="hidden items-center rounded-xl border border-white/12 bg-black/50 p-0.5 sm:inline-flex">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-[#0E7490] text-white'
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>1 Layar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('quad')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'quad'
                    ? 'bg-[#0E7490] text-white'
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid 2×2</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpRandom}
              title="Lompat ke kamera acak"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#FB923C]/35 bg-[#FB923C]/14 px-3 text-xs font-semibold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/24 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5 text-[#FB923C]" />
              <span className="hidden sm:inline">Acak</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Ruang Pantau CCTV"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scope + Search + Region Filter Strip */}
        <div className="shrink-0 space-y-2.5 border-b border-white/10 bg-[#060B16]/85 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Scope Segmented Pills */}
            <div className="inline-flex shrink-0 rounded-xl border border-white/12 bg-black/55 p-1">
              {[
                { id: 'all', label: `⚡ Semua (${cameras.length})` },
                { id: 'indonesia', label: `🇮🇩 Indonesia (${indonesiaCount})` },
                { id: 'world', label: `🌍 Dunia (${worldCount})` },
              ].map((tab) => {
                const active = scope === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setScope(tab.id as 'all' | 'indonesia' | 'world');
                      setRegionFilter('Semua');
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-[#0E7490] to-[#0891B2] text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                        : 'text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kota, simpang, pulau, jalan tol, Makkah, Singapura, New York, Tokyo..."
                className="h-10 w-full rounded-xl border border-white/12 bg-black/60 pr-3 pl-9.5 text-sm text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>

          {/* Region Chips */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {regionChips.map((chip) => {
              const active = regionFilter === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setRegionFilter(chip)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border border-emerald-400/45 bg-emerald-500/20 text-emerald-200'
                      : 'border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/25 hover:text-white'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="pb-safe grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto overscroll-contain p-4 lg:grid-cols-12 lg:overflow-hidden sm:p-5">
          {/* Left / Top Stage: Live Video Feed(s) */}
          <div className="lg:col-span-8 lg:overflow-y-auto lg:pr-1">
            {activeCamera ? (
              viewMode === 'quad' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {quadCameras.map((cam) => (
                    <LiveCctvPlayerCard key={cam.id} camera={cam} compact />
                  ))}
                </div>
              ) : (
                <LiveCctvPlayerCard camera={activeCamera} />
              )
            ) : null}
          </div>

          {/* Right / Bottom Stage: Camera Directory List */}
          <div className="flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-black/45 lg:col-span-4 lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3.5 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                <Globe2 className="h-3.5 w-3.5 text-[#22D3EE]" />
                Daftar Kamera ({filteredCameras.length})
              </span>
              <span className="font-mono-code text-[10px] text-[#94A3B8]">
                Klik untuk Pantau
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
              {filteredCameras.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-[#94A3B8]">
                  Tidak ada kamera yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredCameras.map((cam) => {
                  const isSelected = activeCamera?.id === cam.id;
                  const isDirectStream = cam.streamType !== 'portal';
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => setSelectedCamId(cam.id)}
                      className={`flex w-full items-start justify-between gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#22D3EE]/60 bg-[#22D3EE]/16 text-white shadow-[0_0_14px_rgba(34,211,238,0.16)]'
                          : 'border-white/8 bg-white/[0.03] text-[#E2E8F0] hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isDirectStream ? 'bg-emerald-400' : 'bg-[#FB923C]'
                            }`}
                          />
                          <p className="truncate font-display text-xs font-bold">
                            {cam.name}
                          </p>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#94A3B8]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#67E8F9]" />
                          <span>
                            {cam.city}, {cam.provinceOrCountry}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono-code text-[9.5px] font-semibold ${
                          isDirectStream
                            ? 'border border-emerald-400/30 bg-emerald-500/14 text-emerald-300'
                            : 'border border-[#FB923C]/30 bg-[#FB923C]/12 text-[#FED7AA]'
                        }`}
                      >
                        {cam.streamType === 'hls'
                          ? 'HLS'
                          : cam.streamType === 'snapshot'
                            ? 'LIVE IMG'
                            : cam.streamType === 'portal'
                              ? 'PORTAL'
                              : 'EMBED'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
