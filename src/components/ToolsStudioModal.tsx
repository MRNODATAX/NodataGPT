import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudSun,
  Download,
  Film,
  ImagePlus,
  Loader2,
  LocateFixed,
  Play,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  WEB_TOOLS_CATALOG,
  type WebToolCategoryId,
  type WebToolDefinition,
  buildSlashCommandFromTool,
  uploadImageToTempPublicUrl,
} from '../services/webTools';
import { ToolsIcon } from './ToolsIcon';

interface ToolsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (commandText: string) => void;
  onInsertCommand: (commandText: string) => void;
}

const CATEGORY_TABS: Array<{
  id: 'all' | WebToolCategoryId;
  label: string;
}> = [
  { id: 'all', label: `Semua (${WEB_TOOLS_CATALOG.length})` },
  {
    id: 'A',
    label: `A · Downloader (${WEB_TOOLS_CATALOG.filter((t) => t.category === 'A').length})`,
  },
  {
    id: 'B',
    label: `B · Audio & Video AI (${WEB_TOOLS_CATALOG.filter((t) => t.category === 'B').length})`,
  },
  {
    id: 'D',
    label: `D · Kreatif & Info ID (${WEB_TOOLS_CATALOG.filter((t) => t.category === 'D').length})`,
  },
  {
    id: 'E',
    label: `E · Cuaca, Sholat & Finansial (${WEB_TOOLS_CATALOG.filter((t) => t.category === 'E').length})`,
  },
];

export function ToolsStudioModal({
  isOpen,
  onClose,
  onRunCommand,
  onInsertCommand,
}: ToolsStudioModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | WebToolCategoryId>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<WebToolDefinition | null>(
    null
  );
  const [inputValue, setInputValue] = useState('');
  const [subOption, setSubOption] = useState('');
  const [countValue, setCountValue] = useState<number>(8);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTool(null);
      setInputValue('');
      setSearchQuery('');
      setUploadingPhoto(false);
      setUploadError('');
      setUploadedPreviewUrl('');
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return WEB_TOOLS_CATALOG.filter((tool) => {
      if (activeCategory !== 'all' && tool.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortName.toLowerCase().includes(q) ||
        tool.slashCommand.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.badge.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleChooseTool = (tool: WebToolDefinition, initialMode?: string) => {
    setSelectedTool(tool);
    setInputValue('');
    setSubOption(initialMode || tool.secondarySelect?.defaultValue || '');
    setCountValue(tool.countSelector?.defaultCount || 8);
    setUploadError('');
    setUploadedPreviewUrl('');
    setLocatingGps(false);
    setGpsNotice('');
  };

  const handleUseBrowserGps = () => {
    if (!selectedTool || typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsNotice('Perangkat/browser ini tidak mendukung sensor GPS otomatis. Ketik nama desa/kecamatan secara manual.');
      return;
    }
    setLocatingGps(true);
    setGpsNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setLocatingGps(false);
        setInputValue(coords);
        setGpsNotice(`Koordinat GPS akurat terdeteksi (${coords}) — klik Jalankan!`);
      },
      (err) => {
        setLocatingGps(false);
        setGpsNotice(
          err.code === 1
            ? 'Izin lokasi ditolak browser. Anda tetap bisa mengetik desa, kecamatan, atau kota secara langsung.'
            : 'Gagal membaca titik GPS. Ketik nama desa/kecamatan/kota secara manual.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    setUploadError('');
    try {
      const publicUrl = await uploadImageToTempPublicUrl(file);
      setInputValue(publicUrl);
      setUploadedPreviewUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal mengunggah berkas foto.'
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExecuteSelected = () => {
    if (!selectedTool || uploadingPhoto) return;
    if (selectedTool.requiresInput && !inputValue.trim()) return;
    const cmd = buildSlashCommandFromTool(
      selectedTool,
      inputValue,
      subOption,
      selectedTool.countSelector ? countValue : undefined
    );
    onClose();
    onRunCommand(cmd);
  };

  const getCategoryIcon = (cat: WebToolCategoryId) => {
    if (cat === 'A') return Download;
    if (cat === 'B') return Film;
    if (cat === 'E') return CloudSun;
    return Sparkles;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-tools-studio-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up flex max-h-[88dvh] w-full flex-col rounded-t-[26px] sm:max-h-[85dvh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#22D3EE]">
              <ToolsIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2
                id="nodatagpt-tools-studio-title"
                className="font-display text-base font-bold text-white sm:text-lg"
              >
                NodataGPT Web Tools Studio
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {WEB_TOOLS_CATALOG.length} fitur aktif (Downloader, Audio/Video AI, Cuaca, Sholat, Kurs, Emas, Crypto &amp; Saham) dengan Auto-Fallback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Tools Studio"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Category Tabs */}
        <div className="space-y-2.5 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari TikTok, YouTube, Cuaca, Sholat, Kurs, Emas, Crypto, IHSG, RemoveBG..."
              className="h-10 w-full rounded-xl border border-white/10 bg-black/50 pr-3 pl-9 text-sm text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0E7490] text-white shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                      : 'border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Tool Inline Launcher */}
        {selectedTool && (
          <div className="max-h-[54dvh] overflow-y-auto border-b border-[#22D3EE]/30 bg-gradient-to-r from-[#071525]/95 via-[#091220]/95 to-[#1A1008]/90 px-4 py-3.5 sm:max-h-[58dvh] sm:px-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold text-white">
                    {selectedTool.name}
                  </span>
                  <code className="rounded border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-1.5 py-0.5 font-mono-code text-[11px] text-[#67E8F9]">
                    {selectedTool.slashCommand}
                  </code>
                </div>
                <p className="mt-0.5 text-xs text-[#CBD5E1]">
                  {selectedTool.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                aria-label="Tutup form tool"
                className="rounded-lg p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {selectedTool.usageNotice && (
                <div className="rounded-xl border border-[#22D3EE]/25 bg-black/50 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[11px] font-bold text-[#67E8F9]">
                      📌 {selectedTool.usageNotice.title}
                    </span>
                    <code className="rounded border border-[#FB923C]/35 bg-[#FB923C]/12 px-1.5 py-0.5 font-mono-code text-[10px] text-[#FDBA74]">
                      {selectedTool.usageNotice.syntax}
                    </code>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#CBD5E1]">
                    {selectedTool.usageNotice.notes}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#94A3B8]">
                      Klik contoh:
                    </span>
                    {selectedTool.usageNotice.examples.map((exCmd) => (
                      <button
                        key={exCmd}
                        type="button"
                        onClick={() => {
                          onClose();
                          onInsertCommand(exCmd);
                        }}
                        title="Masukkan contoh command ini ke kolom chat"
                        className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono-code text-[10px] text-[#E2E8F0] transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/14 hover:text-white cursor-pointer"
                      >
                        {exCmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTool.commandCatalog &&
                selectedTool.commandCatalog.length > 0 && (
                  <div className="rounded-xl border border-white/12 bg-black/55 p-2.5">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[#FDBA74]">
                        📋 Daftar Lengkap {selectedTool.commandCatalog.length} Command yang Bisa Digunakan (Klik untuk Pilih Mode):
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        Mendukung <code className="text-[#67E8F9]">/randomimg</code> &amp;{' '}
                        <code className="text-[#67E8F9]">/randomimage</code>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {selectedTool.commandCatalog.map((item) => {
                        const isModeActive = subOption === item.value;
                        return (
                          <div
                            key={item.value}
                            onClick={() => setSubOption(item.value)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSubOption(item.value);
                              }
                            }}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                              isModeActive
                                ? 'border-[#22D3EE] bg-[#22D3EE]/18 text-white shadow-[0_0_10px_rgba(34,211,238,0.18)]'
                                : 'border-white/10 bg-white/[0.03] text-[#E2E8F0] hover:border-white/25 hover:bg-white/[0.07]'
                            }`}
                          >
                            <span className="truncate text-[11px] font-semibold">
                              {item.label}
                            </span>
                            <code className="shrink-0 rounded border border-[#FB923C]/35 bg-black/65 px-1.5 py-0.5 font-mono-code text-[10px] text-[#FED7AA]">
                              {item.command}
                            </code>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {selectedTool.secondarySelect && !selectedTool.commandCatalog && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#CBD5E1]">
                    {selectedTool.secondarySelect.label}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTool.secondarySelect.options.map((opt) => {
                      const activeOpt = subOption === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSubOption(opt.value)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            activeOpt
                              ? 'border-[#FB923C] bg-[#FB923C]/20 text-white'
                              : 'border-white/12 bg-black/50 text-[#CBD5E1] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTool.countSelector && (
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="text-[11px] font-medium text-[#CBD5E1]">
                      {selectedTool.countSelector.label}
                    </label>
                    <code className="font-mono-code text-[10px] text-[#67E8F9]">
                      Command:{' '}
                      {buildSlashCommandFromTool(
                        selectedTool,
                        inputValue || (selectedTool.requiresInput ? selectedTool.exampleInput : ''),
                        subOption,
                        countValue
                      )}
                    </code>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedTool.countSelector.presets.map((preset) => {
                      const isPicked = countValue === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCountValue(preset)}
                          className={`rounded-lg border px-2.5 py-1 font-mono-code text-xs font-semibold transition-colors cursor-pointer ${
                            isPicked
                              ? 'border-[#22D3EE] bg-[#22D3EE]/22 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                              : 'border-white/12 bg-black/50 text-[#CBD5E1] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          ,{preset}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/60 px-2 py-0.5">
                      <span className="text-[10px] text-[#94A3B8]">Custom:</span>
                      <input
                        type="number"
                        min={1}
                        max={selectedTool.countSelector.maxCount}
                        value={countValue}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v)) {
                            setCountValue(
                              Math.min(
                                Math.max(v, 1),
                                selectedTool.countSelector?.maxCount || 30
                              )
                            );
                          }
                        }}
                        aria-label="Jumlah gambar custom"
                        className="w-11 bg-transparent text-center font-mono-code text-xs font-bold text-[#FDBA74] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedTool.acceptsImageUpload && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-white/10 bg-black/45 p-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handlePhotoUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FB923C]/45 bg-[#FB923C]/15 px-3 text-xs font-semibold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FB923C]" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5 text-[#FB923C]" />
                    )}
                    <span>
                      {uploadingPhoto
                        ? 'Mengunggah Foto...'
                        : 'Upload Foto dari Perangkat'}
                    </span>
                  </button>

                  {uploadedPreviewUrl && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                      <img
                        src={uploadedPreviewUrl}
                        alt="Pratinjau foto"
                        className="h-8 w-8 rounded-md border border-white/15 object-cover"
                      />
                      <span>Foto siap diproses — klik Jalankan!</span>
                    </div>
                  )}

                  {uploadError && (
                    <span className="text-[11px] text-rose-300">{uploadError}</span>
                  )}
                </div>
              )}

              {selectedTool.acceptsGeoLocation && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#22D3EE]/25 bg-black/45 p-2.5">
                  <button
                    type="button"
                    disabled={locatingGps}
                    onClick={handleUseBrowserGps}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#22D3EE]/45 bg-[#22D3EE]/15 px-3 text-xs font-semibold text-[#A5F3FC] transition-colors hover:bg-[#22D3EE]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {locatingGps ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22D3EE]" />
                    ) : (
                      <LocateFixed className="h-3.5 w-3.5 text-[#22D3EE]" />
                    )}
                    <span>
                      {locatingGps
                        ? 'Mendeteksi Titik GPS...'
                        : 'Gunakan Lokasi GPS Saya'}
                    </span>
                  </button>
                  <span className="text-[11px] text-[#CBD5E1]">
                    {gpsNotice ||
                      'Atau ketik nama desa, kelurahan, kecamatan, gunung, maupun kota kecil.'}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteSelected();
                    }
                  }}
                  placeholder={selectedTool.placeholder}
                  className="h-10 flex-1 rounded-xl border border-white/15 bg-black/65 px-3 text-sm text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
                />

                <div className="flex shrink-0 items-center gap-1.5">
                  {selectedTool.exampleInput && (
                    <button
                      type="button"
                      onClick={() => setInputValue(selectedTool.exampleInput)}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/12 bg-white/[0.05] px-3 text-xs font-medium text-[#CBD5E1] hover:border-white/25 hover:text-white cursor-pointer"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-[#FB923C]" />
                      <span>Contoh</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      uploadingPhoto ||
                      (selectedTool.requiresInput && !inputValue.trim())
                    }
                    onClick={() => {
                      const cmd = buildSlashCommandFromTool(
                        selectedTool,
                        inputValue,
                        subOption,
                        selectedTool.countSelector ? countValue : undefined
                      );
                      onClose();
                      onInsertCommand(cmd);
                    }}
                    className="inline-flex h-10 items-center rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-3 text-xs font-semibold text-[#67E8F9] hover:bg-[#22D3EE]/20 disabled:opacity-45 cursor-pointer"
                  >
                    Ke Input
                  </button>

                  <button
                    type="button"
                    disabled={
                      uploadingPhoto ||
                      (selectedTool.requiresInput && !inputValue.trim())
                    }
                    onClick={handleExecuteSelected}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0E7490] px-4 text-xs font-bold text-white shadow-[0_0_16px_rgba(34,211,238,0.25)] hover:bg-[#0891B2] disabled:opacity-45 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Jalankan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tool Grid */}
        <div className="pb-safe flex-1 overflow-y-auto p-3.5 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredTools.map((tool) => {
              const Icon = getCategoryIcon(tool.category);
              const isChosen = selectedTool?.id === tool.id;
              const isOrange = tool.category === 'B' || tool.category === 'E';

              const hasCatalog = Boolean(
                tool.commandCatalog && tool.commandCatalog.length > 0
              );

              return (
                <div
                  key={tool.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleChooseTool(tool)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleChooseTool(tool);
                    }
                  }}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    hasCatalog ? 'sm:col-span-2' : ''
                  } ${
                    isChosen
                      ? 'border-[#22D3EE] bg-[#22D3EE]/12 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                          isOrange
                            ? 'border-[#FB923C]/35 bg-[#FB923C]/14 text-[#FB923C]'
                            : 'border-[#22D3EE]/35 bg-[#22D3EE]/14 text-[#22D3EE]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="rounded-md border border-white/10 bg-black/50 px-1.5 py-0.5 font-mono-code text-[10px] text-[#CBD5E1]">
                        {tool.id === 'randomimg'
                          ? '/randomimage · /randomimg'
                          : tool.slashCommand}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-sm font-bold text-white">
                      {tool.name}
                    </h3>
                    <p
                      className={`mt-1 text-xs leading-relaxed text-[#94A3B8] ${
                        hasCatalog ? '' : 'line-clamp-2'
                      }`}
                    >
                      {tool.description}
                    </p>

                    {hasCatalog && tool.commandCatalog && (
                      <div className="mt-2.5 rounded-xl border border-[#22D3EE]/20 bg-black/50 p-2.5">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[10.5px] font-bold text-[#67E8F9]">
                            📌 Semua Command Random Image yang Bisa Digunakan (Klik Mode untuk Pakai):
                          </span>
                          <span className="font-mono-code text-[10px] text-[#FDBA74]">
                            Tambah ,jumlah (1–30) · misal ,10
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                          {tool.commandCatalog.map((catItem) => (
                            <button
                              key={catItem.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChooseTool(tool, catItem.value);
                              }}
                              className="flex items-center justify-between gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-left transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/15 cursor-pointer"
                            >
                              <span className="truncate text-[10.5px] font-medium text-[#F1F5F9]">
                                {catItem.label}
                              </span>
                              <code className="shrink-0 rounded bg-black/70 px-1.5 py-0.5 font-mono-code text-[9.5px] text-[#67E8F9]">
                                {catItem.command}
                              </code>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono-code text-[10px] font-medium ${
                        tool.category === 'A'
                          ? 'bg-[#22D3EE]/12 text-[#67E8F9]'
                          : tool.category === 'B'
                            ? 'bg-[#FB923C]/14 text-[#FDBA74]'
                            : tool.category === 'E'
                              ? 'bg-emerald-500/14 text-emerald-300'
                              : 'bg-white/10 text-[#E2E8F0]'
                      }`}
                    >
                      {tool.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-[#22D3EE]">
                      Pilih →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
