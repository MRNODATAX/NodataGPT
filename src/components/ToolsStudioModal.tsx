import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Aperture,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  CloudSun,
  CreditCard,
  Download,
  FileText,
  Film,
  Globe,
  ImagePlus,
  LayoutGrid,
  Loader2,
  LocateFixed,
  Mail,
  MessageCircle,
  PhoneCall,
  Play,
  QrCode,
  Radar,
  Radio,
  ScanSearch,
  Search,
  Sparkles,
  Terminal,
  UserCheck,
  Video,
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
import { decodeQrFromFile } from '../services/osintInspector';
import {
  EXIF_PARSED_PREFIX,
  WA_TXT_EXPORT_PREFIX,
  extractExifTokenFromFile,
} from '../services/osintSocialAndRecon';
import { ToolsIcon } from './ToolsIcon';

interface ToolsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (commandText: string, displayLabel?: string) => void;
  onInsertCommand: (commandText: string) => void;
  onOpenCctvCommandCenter?: () => void;
}

const CATEGORY_META: Record<
  WebToolCategoryId,
  {
    shortTab: string;
    sectionTitle: string;
    sectionSubtitle: string;
    accent: 'emerald' | 'cyan' | 'orange';
  }
> = {
  OSINT: {
    shortTab: '🛰️ OSINT & CCTV',
    sectionTitle: 'OSINT, Forensik & Live CCTV',
    sectionSubtitle: 'Live CCTV Indonesia/Dunia, pelacakan nomor, medsos, QRIS, EXIF & jaringan',
    accent: 'emerald',
  },
  A: {
    shortTab: '📥 Downloader',
    sectionTitle: 'Downloader Media & Cloud',
    sectionSubtitle: 'Unduh video, musik MP3, galeri foto & berkas tanpa iklan',
    accent: 'cyan',
  },
  B: {
    shortTab: '🎬 Audio & Video',
    sectionTitle: 'Studio Audio & Video AI',
    sectionSubtitle: 'Text-to-Video, transkrip YouTube, vokal splitter, lirik & TTS',
    accent: 'orange',
  },
  D: {
    shortTab: '✨ Kreatif & Riset',
    sectionTitle: 'Kreatif, Gambar & Riset Web',
    sectionSubtitle: 'Edit foto AI, 10 mode gambar HD, OCR, pencarian web & berita aktual',
    accent: 'cyan',
  },
  E: {
    shortTab: '🌤️ Cuaca & Finansial',
    sectionTitle: 'Cuaca, Sholat & Finansial',
    sectionSubtitle: 'Cuaca tingkat desa, jadwal sholat Kemenag, kurs, emas, kripto & saham',
    accent: 'orange',
  },
};

const CATEGORY_ORDER: WebToolCategoryId[] = ['OSINT', 'A', 'B', 'D', 'E'];

const CATEGORY_TABS: Array<{
  id: 'all' | WebToolCategoryId;
  label: string;
  count: number;
}> = [
  { id: 'all', label: '⚡ Semua', count: WEB_TOOLS_CATALOG.length },
  ...CATEGORY_ORDER.map((catId) => ({
    id: catId,
    label: CATEGORY_META[catId].shortTab,
    count: WEB_TOOLS_CATALOG.filter((t) => t.category === catId).length,
  })),
];

export function ToolsStudioModal({
  isOpen,
  onClose,
  onRunCommand,
  onInsertCommand,
  onOpenCctvCommandCenter,
}: ToolsStudioModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | WebToolCategoryId>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<WebToolDefinition | null>(
    null
  );
  const [expandedRandomModes, setExpandedRandomModes] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [subOption, setSubOption] = useState('');
  const [countValue, setCountValue] = useState<number>(8);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState('');
  const [uploadedPayloadLabel, setUploadedPayloadLabel] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');
  const [pastedFeedback, setPastedFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textFileInputRef = useRef<HTMLInputElement | null>(null);
  const toolInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTool(null);
      setInputValue('');
      setSearchQuery('');
      setUploadingPhoto(false);
      setUploadError('');
      setUploadedPreviewUrl('');
      setUploadedPayloadLabel('');
      setPastedFeedback(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTool) {
          setSelectedTool(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, selectedTool]);

  useEffect(() => {
    if (!selectedTool || typeof window === 'undefined') return;
    if (window.innerWidth >= 640) {
      const id = window.setTimeout(() => {
        toolInputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(id);
    }
  }, [selectedTool]);

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

  const groupedSections = useMemo(() => {
    const isGroupedAll = activeCategory === 'all' && !searchQuery.trim();
    if (!isGroupedAll) {
      return [
        {
          id: activeCategory,
          title:
            activeCategory === 'all'
              ? `Hasil Pencarian (${filteredTools.length})`
              : CATEGORY_META[activeCategory].sectionTitle,
          subtitle:
            activeCategory === 'all'
              ? ''
              : CATEGORY_META[activeCategory].sectionSubtitle,
          accent:
            activeCategory === 'all'
              ? ('cyan' as const)
              : CATEGORY_META[activeCategory].accent,
          tools: filteredTools,
        },
      ];
    }

    return CATEGORY_ORDER.map((catId) => ({
      id: catId,
      title: CATEGORY_META[catId].sectionTitle,
      subtitle: CATEGORY_META[catId].sectionSubtitle,
      accent: CATEGORY_META[catId].accent,
      tools: filteredTools.filter((t) => t.category === catId),
    })).filter((sec) => sec.tools.length > 0);
  }, [activeCategory, searchQuery, filteredTools]);

  if (!isOpen) return null;

  const handleChooseTool = (tool: WebToolDefinition, initialMode?: string) => {
    setSelectedTool(tool);
    setInputValue('');
    setSubOption(initialMode || tool.secondarySelect?.defaultValue || '');
    setCountValue(tool.countSelector?.defaultCount || 8);
    setUploadError('');
    setUploadedPreviewUrl('');
    setUploadedPayloadLabel('');
    setLocatingGps(false);
    setGpsNotice('');
    setPastedFeedback(false);
  };

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const clip = (await navigator.clipboard.readText()).trim();
        if (clip) {
          setInputValue(clip);
          setPastedFeedback(true);
          window.setTimeout(() => setPastedFeedback(false), 1800);
          return;
        }
      }
    } catch {
      // Clipboard permission may require manual long-press paste on some browsers
    }
    toolInputRef.current?.focus();
  };

  const handleUseBrowserGps = () => {
    if (
      !selectedTool ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setGpsNotice(
        'Perangkat/browser ini tidak mendukung sensor GPS otomatis. Ketik nama desa/kecamatan secara manual.'
      );
      return;
    }
    setLocatingGps(true);
    setGpsNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setLocatingGps(false);
        setInputValue(coords);
        setGpsNotice(
          `Koordinat GPS akurat terdeteksi (${coords}) — klik Jalankan!`
        );
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
      if (selectedTool?.id === 'exif') {
        const exifToken = await extractExifTokenFromFile(file);
        const readerUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        setInputValue(exifToken);
        setUploadedPreviewUrl(readerUrl);
        setUploadedPayloadLabel(`[Scan Foto Asli: ${file.name}]`);
        return;
      }

      if (selectedTool?.id === 'qris') {
        const localDecoded = await decodeQrFromFile(file);
        if (localDecoded) {
          const readerUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          setInputValue(localDecoded);
          setUploadedPreviewUrl(readerUrl);
          setUploadedPayloadLabel('');
          return;
        }
        throw new Error(
          'Barcode QR tidak terdeteksi jelas pada foto ini. Pastikan kotak QRIS tidak terpotong, terang, dan tidak buram.'
        );
      }

      const publicUrl = await uploadImageToTempPublicUrl(file);
      setInputValue(publicUrl);
      setUploadedPreviewUrl(publicUrl);
      setUploadedPayloadLabel('');
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

  const handleTextFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    setUploadError('');
    try {
      const rawText = await file.text();
      if (!rawText.trim()) {
        throw new Error('Berkas .txt kosong.');
      }
      setInputValue(`${WA_TXT_EXPORT_PREFIX}${rawText.slice(0, 450000)}`);
      setUploadedPayloadLabel(`[Export Chat WA: ${file.name}]`);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal membaca berkas teks.'
      );
    } finally {
      setUploadingPhoto(false);
      if (textFileInputRef.current) {
        textFileInputRef.current.value = '';
      }
    }
  };

  const isBinaryPayloadLoaded =
    inputValue.startsWith(EXIF_PARSED_PREFIX) ||
    inputValue.startsWith(WA_TXT_EXPORT_PREFIX);

  const canRunSelected = Boolean(
    selectedTool &&
      !uploadingPhoto &&
      (!selectedTool.requiresInput || inputValue.trim().length > 0)
  );

  const liveCommandPreview = selectedTool
    ? buildSlashCommandFromTool(
        selectedTool,
        isBinaryPayloadLoaded
          ? uploadedPayloadLabel || '[Berkas Siap Dianalisis]'
          : inputValue ||
              (selectedTool.requiresInput ? selectedTool.exampleInput : ''),
        subOption,
        selectedTool.countSelector ? countValue : undefined
      )
    : '';

  const handleExecuteSelected = () => {
    if (!selectedTool || !canRunSelected) return;
    const cmd = buildSlashCommandFromTool(
      selectedTool,
      inputValue,
      subOption,
      selectedTool.countSelector ? countValue : undefined
    );
    const displayCmd = isBinaryPayloadLoaded
      ? buildSlashCommandFromTool(
          selectedTool,
          uploadedPayloadLabel || '[Berkas Dianalisis]',
          subOption,
          selectedTool.countSelector ? countValue : undefined
        )
      : undefined;
    onClose();
    onRunCommand(cmd, displayCmd);
  };

  const handleInsertSelected = () => {
    if (!selectedTool || !canRunSelected) return;
    if (isBinaryPayloadLoaded) {
      handleExecuteSelected();
      return;
    }
    const cmd = buildSlashCommandFromTool(
      selectedTool,
      inputValue,
      subOption,
      selectedTool.countSelector ? countValue : undefined
    );
    onClose();
    onInsertCommand(cmd);
  };

  const getToolIcon = (tool: WebToolDefinition) => {
    if (tool.id === 'cctv') return Radio;
    if (tool.id === 'qris') return QrCode;
    if (tool.id === 'ceknomor') return PhoneCall;
    if (tool.id === 'waosint') return MessageCircle;
    if (tool.id === 'ttosint') return Video;
    if (tool.id === 'igosint') return Camera;
    if (tool.id === 'cekemail') return Mail;
    if (tool.id === 'exif') return Aperture;
    if (tool.id === 'username') return UserCheck;
    if (tool.id === 'domain') return Globe;
    if (tool.id === 'ip') return Radar;
    if (tool.id === 'ceknik') return CreditCard;
    if (tool.category === 'OSINT') return ScanSearch;
    if (tool.category === 'A') return Download;
    if (tool.category === 'B') return Film;
    if (tool.category === 'E') return CloudSun;
    return Sparkles;
  };

  const cctvToolDef = WEB_TOOLS_CATALOG.find((t) => t.id === 'cctv');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-tools-studio-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up flex max-h-[91dvh] w-full flex-col overflow-hidden rounded-t-[26px] sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grabber Handle */}
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {selectedTool ? (
          /* =================================================================
             STEP 2: FOCUSED TOOL RUNNER VIEW (Unclippable Mobile & Desktop)
             ================================================================= */
          <>
            {/* Focused Top Bar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-3.5">
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-3 text-xs font-semibold text-[#E2E8F0] transition-colors hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/12 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span>Katalog Tools ({WEB_TOOLS_CATALOG.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-2.5 py-1 font-mono-code text-[11px] font-semibold text-[#67E8F9] sm:inline-block">
                  {selectedTool.categoryLabel}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup Tools Studio"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Tool Configuration Body */}
            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              {/* Tool Identity Banner */}
              <div className="rounded-2xl border border-[#22D3EE]/25 bg-gradient-to-br from-[#071829]/95 via-[#091220]/95 to-[#1A1008]/85 p-4">
                <div className="flex items-start gap-3.5">
                  {(() => {
                    const ActiveIcon = getToolIcon(selectedTool);
                    const isOrange =
                      selectedTool.category === 'B' ||
                      selectedTool.category === 'E';
                    const isOsint = selectedTool.category === 'OSINT';
                    return (
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          isOsint
                            ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-300'
                            : isOrange
                              ? 'border-[#FB923C]/40 bg-[#FB923C]/14 text-[#FB923C]'
                              : 'border-[#22D3EE]/40 bg-[#22D3EE]/14 text-[#22D3EE]'
                        }`}
                      >
                        <ActiveIcon className="h-5 w-5" />
                      </span>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="nodatagpt-tools-studio-title"
                        className="font-display text-base font-bold text-white sm:text-lg"
                      >
                        {selectedTool.name}
                      </h2>
                      <code className="rounded-md border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2 py-0.5 font-mono-code text-[11px] font-semibold text-[#67E8F9]">
                        {selectedTool.slashCommand}
                      </code>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">
                      {selectedTool.description}
                    </p>

                    {selectedTool.id === 'cctv' && onOpenCctvCommandCenter && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCctvCommandCenter();
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/18 px-3.5 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-500/28 cursor-pointer"
                        >
                          <LayoutGrid className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Buka Ruang Pantau Multi-CCTV (Grid 2×2 &amp; Peta Wilayah)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Input Box Card */}
              <div className="rounded-2xl border border-white/12 bg-black/50 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="nodatagpt-tool-runner-input"
                    className="text-xs font-semibold text-white"
                  >
                    {selectedTool.requiresInput
                      ? 'Masukkan Tautan / Kata Kunci'
                      : 'Kata Kunci Wilayah / Tambahan (Opsional)'}
                  </label>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handlePasteClipboard()}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 text-[11px] font-medium text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/12 hover:text-white cursor-pointer"
                    >
                      {pastedFeedback ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300">Tertempel</span>
                        </>
                      ) : (
                        <>
                          <ClipboardPaste className="h-3 w-3 text-[#22D3EE]" />
                          <span>Tempel</span>
                        </>
                      )}
                    </button>

                    {selectedTool.exampleInput && (
                      <button
                        type="button"
                        onClick={() => setInputValue(selectedTool.exampleInput)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#FB923C]/30 bg-[#FB923C]/10 px-2.5 text-[11px] font-semibold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/20 cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3 text-[#FB923C]" />
                        <span>Isi Contoh</span>
                      </button>
                    )}

                    {inputValue.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputValue('');
                          setUploadedPreviewUrl('');
                          setUploadedPayloadLabel('');
                        }}
                        aria-label="Kosongkan input"
                        className="inline-flex h-7 items-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-[11px] text-[#94A3B8] hover:bg-white/10 hover:text-white cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <input
                  id="nodatagpt-tool-runner-input"
                  ref={toolInputRef}
                  type="text"
                  value={isBinaryPayloadLoaded ? uploadedPayloadLabel : inputValue}
                  onChange={(e) => {
                    setUploadedPayloadLabel('');
                    setInputValue(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteSelected();
                    }
                  }}
                  placeholder={selectedTool.placeholder}
                  className="h-12 w-full rounded-xl border border-white/16 bg-[#050811] px-3.5 text-base text-white placeholder-[#94A3B8] transition-colors focus:border-[#22D3EE] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)] focus:outline-none sm:h-11 sm:text-sm"
                />

                {/* Live Slash Command Preview */}
                <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                  <code className="min-w-0 flex-1 truncate font-mono-code text-[11px] text-[#A5F3FC]">
                    {liveCommandPreview}
                  </code>
                </div>
              </div>

              {/* Photo Upload Helper */}
              {selectedTool.acceptsImageUpload && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/12 bg-black/45 p-3.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      void handlePhotoUpload(e.target.files?.[0])
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#FB923C]/45 bg-[#FB923C]/15 px-3.5 text-xs font-semibold text-[#FED7AA] transition-colors hover:bg-[#FB923C]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#FB923C]" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-[#FB923C]" />
                    )}
                    <span>
                      {uploadingPhoto
                        ? selectedTool.id === 'qris'
                          ? 'Memindai Barcode QRIS...'
                          : selectedTool.id === 'exif'
                            ? 'Membaca EXIF & GPS Asli...'
                            : 'Mengunggah Foto...'
                        : selectedTool.id === 'qris'
                          ? 'Scan Foto / Screenshot QRIS'
                          : selectedTool.id === 'exif'
                            ? 'Scan Foto Asli EXIF & GPS (Tanpa Kompresi)'
                            : 'Upload Foto dari Perangkat'}
                    </span>
                  </button>

                  {uploadedPreviewUrl && (
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <img
                        src={uploadedPreviewUrl}
                        alt="Pratinjau foto"
                        className="h-9 w-9 rounded-lg border border-white/15 object-cover"
                      />
                      <span>
                        {selectedTool.id === 'qris'
                          ? 'QRIS berhasil terbaca dari foto — klik Jalankan Sekarang!'
                          : selectedTool.id === 'exif'
                            ? 'Biner foto asli siap dianalisis — klik Jalankan Sekarang!'
                            : 'Foto siap diproses — tekan Jalankan!'}
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <span className="text-xs text-rose-300">{uploadError}</span>
                  )}
                </div>
              )}

              {/* Local Text Export Upload Helper (WhatsApp .txt Chat Forensics) */}
              {selectedTool.acceptsTextFileUpload && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-emerald-400/25 bg-black/45 p-3.5">
                  <input
                    ref={textFileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={(e) =>
                      void handleTextFileUpload(e.target.files?.[0])
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => textFileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-emerald-300" />
                    <span>Upload File .txt Export Chat WA (100% Lokal)</span>
                  </button>

                  {inputValue.startsWith(WA_TXT_EXPORT_PREFIX) && (
                    <span className="text-xs text-emerald-300">
                      ✅ {uploadedPayloadLabel} siap diaudit — klik Jalankan Sekarang!
                    </span>
                  )}

                  {uploadError && (
                    <span className="text-xs text-rose-300">{uploadError}</span>
                  )}
                </div>
              )}

              {/* GPS Helper (Cuaca & Jadwal Sholat) */}
              {selectedTool.acceptsGeoLocation && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#22D3EE]/25 bg-black/45 p-3.5">
                  <button
                    type="button"
                    disabled={locatingGps}
                    onClick={handleUseBrowserGps}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#22D3EE]/45 bg-[#22D3EE]/15 px-3.5 text-xs font-semibold text-[#A5F3FC] transition-colors hover:bg-[#22D3EE]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {locatingGps ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#22D3EE]" />
                    ) : (
                      <LocateFixed className="h-4 w-4 text-[#22D3EE]" />
                    )}
                    <span>
                      {locatingGps
                        ? 'Mendeteksi Titik GPS...'
                        : 'Gunakan Lokasi GPS Saya'}
                    </span>
                  </button>
                  <span className="text-xs leading-relaxed text-[#CBD5E1]">
                    {gpsNotice ||
                      'Atau ketik nama desa, kelurahan, kecamatan, gunung, maupun kota kecil.'}
                  </span>
                </div>
              )}

              {/* Sub-Mode Options */}
              {selectedTool.secondarySelect && !selectedTool.commandCatalog && (
                <div className="rounded-2xl border border-white/12 bg-black/45 p-3.5">
                  <label className="mb-2 block text-xs font-semibold text-white">
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
                          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            activeOpt
                              ? 'border-[#FB923C] bg-[#FB923C]/22 text-white shadow-[0_0_12px_rgba(251,146,60,0.18)]'
                              : 'border-white/12 bg-black/55 text-[#CBD5E1] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Image Count Selector (,1 .. ,30 for /pinterest & /randomimage) */}
              {selectedTool.countSelector && (
                <div className="rounded-2xl border border-white/12 bg-black/45 p-3.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-white">
                      {selectedTool.countSelector.label}
                    </label>
                    <span className="font-mono-code text-[11px] text-[#FDBA74]">
                      Rentang: 1–{selectedTool.countSelector.maxCount} gambar
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedTool.countSelector.presets.map((preset) => {
                      const isPicked = countValue === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCountValue(preset)}
                          className={`rounded-xl border px-3 py-1.5 font-mono-code text-xs font-semibold transition-colors cursor-pointer ${
                            isPicked
                              ? 'border-[#22D3EE] bg-[#22D3EE]/22 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                              : 'border-white/12 bg-black/55 text-[#CBD5E1] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          ,{preset}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/65 px-2.5 py-1">
                      <span className="text-[11px] text-[#94A3B8]">Custom:</span>
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
                        className="w-12 bg-transparent text-center font-mono-code text-xs font-bold text-[#FDBA74] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Command Catalog (10 Random Image Modes) */}
              {selectedTool.commandCatalog &&
                selectedTool.commandCatalog.length > 0 && (
                  <div className="rounded-2xl border border-white/12 bg-black/50 p-3.5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#FDBA74]">
                        📋 Pilih Mode ({selectedTool.commandCatalog.length} Mode Tersedia):
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">
                        Mendukung <code className="text-[#67E8F9]">/randomimg</code> &amp;{' '}
                        <code className="text-[#67E8F9]">/randomimage</code>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {selectedTool.commandCatalog.map((item) => {
                        const isModeActive = subOption === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setSubOption(item.value)}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                              isModeActive
                                ? 'border-[#22D3EE] bg-[#22D3EE]/18 text-white shadow-[0_0_10px_rgba(34,211,238,0.18)]'
                                : 'border-white/10 bg-white/[0.03] text-[#E2E8F0] hover:border-white/25 hover:bg-white/[0.07]'
                            }`}
                          >
                            <span className="truncate text-xs font-semibold">
                              {item.label}
                            </span>
                            <code className="shrink-0 rounded border border-[#FB923C]/35 bg-black/65 px-1.5 py-0.5 font-mono-code text-[10px] text-[#FED7AA]">
                              {item.command}
                            </code>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Usage Guide Card */}
              {selectedTool.usageNotice && (
                <div className="rounded-2xl border border-[#22D3EE]/22 bg-black/45 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#67E8F9]">
                      📌 {selectedTool.usageNotice.title}
                    </span>
                    <code className="rounded border border-[#FB923C]/35 bg-[#FB923C]/12 px-2 py-0.5 font-mono-code text-[10.5px] text-[#FDBA74]">
                      {selectedTool.usageNotice.syntax}
                    </code>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">
                    {selectedTool.usageNotice.notes}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#94A3B8]">
                      Contoh siap klik:
                    </span>
                    {selectedTool.usageNotice.examples.map((exCmd) => (
                      <button
                        key={exCmd}
                        type="button"
                        onClick={() => {
                          onClose();
                          onInsertCommand(exCmd);
                        }}
                        className="rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono-code text-[10.5px] text-[#E2E8F0] transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/14 hover:text-white cursor-pointer"
                      >
                        {exCmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="pb-safe flex shrink-0 items-center gap-2.5 border-t border-white/10 bg-[#050812]/95 px-4 py-3 sm:px-6 sm:py-3.5">
              <button
                type="button"
                disabled={!canRunSelected}
                onClick={handleInsertSelected}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-4 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/20 disabled:opacity-40 cursor-pointer"
              >
                Ke Input Chat
              </button>

              <button
                type="button"
                disabled={!canRunSelected}
                onClick={handleExecuteSelected}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0891B2] px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.28)] transition-all hover:brightness-110 disabled:opacity-40 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Jalankan Sekarang</span>
              </button>
            </div>
          </>
        ) : (
          /* =================================================================
             STEP 1: REDESIGNED AIRY CATALOG BROWSE VIEW (De-Cluttered & Rich)
             ================================================================= */
          <>
            {/* Spacious Studio Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.18)]">
                  <ToolsIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="nodatagpt-tools-studio-title"
                      className="font-display text-base font-bold text-white sm:text-lg"
                    >
                      NodataGPT Tools Studio
                    </h2>
                    <span className="rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/12 px-2 py-0.5 font-mono-code text-[10.5px] font-bold text-[#67E8F9]">
                      {WEB_TOOLS_CATALOG.length} Fitur
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Pilih fitur siap pakai di bawah atau cari berdasarkan nama &amp; slash command
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Tools Studio"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Clean Search + Crisp Short Category Pills */}
            <div className="shrink-0 space-y-2.5 border-b border-white/10 bg-[#050914]/75 px-4 py-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari fitur: Live CCTV, QRIS, Nomor HP, TikTok, WA, Cuaca, Lirik..."
                  className="h-10 w-full rounded-xl border border-white/12 bg-black/55 pr-3 pl-10 text-sm text-white placeholder-[#94A3B8] transition-colors focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
                {CATEGORY_TABS.map((tab) => {
                  const active = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-[#0E7490] to-[#0891B2] text-white shadow-[0_0_14px_rgba(34,211,238,0.24)]'
                          : 'border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono-code text-[10px] ${
                          active
                            ? 'bg-black/30 text-[#CFFAFE]'
                            : 'bg-white/[0.06] text-[#94A3B8]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Airy Grouped Catalog Body */}
            <div className="pb-safe min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {/* Featured Spotlight: Live Public CCTV Command Center */}
              {!searchQuery.trim() &&
                (activeCategory === 'all' || activeCategory === 'OSINT') &&
                cctvToolDef && (
                  <div
                    data-testid="tools-cctv-spotlight"
                    className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-[#051B1B]/95 via-[#071525]/95 to-[#181008]/90 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex flex-col justify-between gap-3.5 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
                          <Radio className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/16 px-2 py-0.5 font-mono-code text-[10px] font-bold text-emerald-300">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              BARU · LIVE GEOINT
                            </span>
                            <h3 className="font-display text-sm font-bold text-white sm:text-base">
                              Ruang Pantau Live CCTV Indonesia &amp; Dunia
                            </h3>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#CBD5E1]">
                            Pantau jalan raya ATCS kota/kabupaten se-Indonesia, Jalan Tol/Nasional, Makkah, Singapura, NYC, Tokyo &amp; NASA ISS lengkap titik Google Maps.
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {onOpenCctvCommandCenter && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenCctvCommandCenter();
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-500 cursor-pointer"
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>Ruang Pantau 2×2</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleChooseTool(cctvToolDef)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-white transition-colors hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/15 cursor-pointer"
                        >
                          <Terminal className="h-3.5 w-3.5 text-[#22D3EE]" />
                          <span>/cctv di Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {filteredTools.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-12 text-center">
                  <p className="font-display text-sm font-semibold text-white">
                    Tidak ada tool yang cocok dengan &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Coba kata kunci lain atau tampilkan kembali seluruh katalog ({WEB_TOOLS_CATALOG.length} fitur).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="mt-3.5 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-4 py-2 text-xs font-semibold text-[#67E8F9] hover:bg-[#22D3EE]/20 cursor-pointer"
                  >
                    Tampilkan Semua Tools
                  </button>
                </div>
              ) : (
                groupedSections.map((section) => (
                  <section key={String(section.id)} className="space-y-3">
                    {/* Clean Section Divider Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              section.accent === 'emerald'
                                ? 'bg-emerald-400'
                                : section.accent === 'orange'
                                  ? 'bg-[#FB923C]'
                                  : 'bg-[#22D3EE]'
                            }`}
                          />
                          <h3 className="font-display text-xs font-bold tracking-wide text-white uppercase sm:text-[13px]">
                            {section.title}
                          </h3>
                          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono-code text-[10px] text-[#94A3B8]">
                            {section.tools.length}
                          </span>
                        </div>
                        {section.subtitle && (
                          <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">
                            {section.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="hidden h-px flex-1 bg-gradient-to-r from-white/12 to-transparent sm:block" />
                    </div>

                    {/* Airy 2-Column Tool Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {section.tools.map((tool) => {
                        const Icon = getToolIcon(tool);
                        const isOrange =
                          tool.category === 'B' || tool.category === 'E';
                        const isOsint = tool.category === 'OSINT';
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
                            className={`group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#080F1E]/75 p-4 text-left transition-all duration-150 hover:border-[#22D3EE]/40 hover:bg-[#0B162B]/90 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] active:scale-[0.99] cursor-pointer ${
                              hasCatalog && expandedRandomModes ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div>
                              {/* Clean Horizontal Card Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-150 group-hover:scale-105 ${
                                      isOsint
                                        ? 'border-emerald-400/35 bg-emerald-500/14 text-emerald-300'
                                        : isOrange
                                          ? 'border-[#FB923C]/35 bg-[#FB923C]/14 text-[#FB923C]'
                                          : 'border-[#22D3EE]/35 bg-[#22D3EE]/14 text-[#22D3EE]'
                                    }`}
                                  >
                                    <Icon className="h-4.5 w-4.5" />
                                  </span>

                                  <div className="min-w-0">
                                    <h4 className="line-clamp-1 font-display text-[13.5px] font-bold text-white group-hover:text-[#ECFEFF]">
                                      {tool.name}
                                    </h4>
                                    <span
                                      className={`mt-0.5 inline-block truncate text-[11px] font-medium ${
                                        isOsint
                                          ? 'text-emerald-300/90'
                                          : isOrange
                                            ? 'text-[#FDBA74]/90'
                                            : 'text-[#67E8F9]/90'
                                      }`}
                                    >
                                      {tool.badge}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  <code className="rounded-lg border border-white/10 bg-black/55 px-2 py-0.5 font-mono-code text-[10.5px] text-[#CBD5E1] group-hover:border-[#22D3EE]/35 group-hover:text-[#A5F3FC]">
                                    {tool.slashCommand}
                                  </code>
                                  <ChevronRight className="h-4 w-4 text-[#64748B] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#22D3EE]" />
                                </div>
                              </div>

                              {/* Clean 2-Line Description */}
                              <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[#94A3B8]">
                                {tool.description}
                              </p>
                            </div>

                            {/* Collapsible 10-Mode Quick Picker for Random Image (Zero Crowding!) */}
                            {hasCatalog && tool.commandCatalog && (
                              <div className="mt-3 border-t border-white/8 pt-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRandomModes((v) => !v);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-2.5 py-1 text-[11px] font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/20 cursor-pointer"
                                >
                                  <span>
                                    🎨 {expandedRandomModes ? 'Sembunyikan' : 'Lihat'}{' '}
                                    {tool.commandCatalog.length} Command Mode Cepat (,1–30)
                                  </span>
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      expandedRandomModes ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {expandedRandomModes && (
                                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                    {tool.commandCatalog.map((catItem) => (
                                      <button
                                        key={catItem.value}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChooseTool(tool, catItem.value);
                                        }}
                                        className="flex items-center justify-between gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-left transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/15 cursor-pointer"
                                      >
                                        <span className="truncate text-[11px] font-medium text-[#F1F5F9]">
                                          {catItem.label}
                                        </span>
                                        <code className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono-code text-[9.5px] text-[#67E8F9]">
                                          {catItem.command}
                                        </code>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
