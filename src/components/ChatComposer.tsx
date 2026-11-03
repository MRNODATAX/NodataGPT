import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BrainCircuit,
  ChevronDown,
  Command,
  FileText,
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Shuffle,
  Square,
  X,
} from 'lucide-react';
import type {
  AIModelDefinition,
  PreparedChatAttachment,
} from '../types/chat';
import {
  AI_MODELS,
  IMAGE_ENGINES,
  type ImageModelOption,
} from '../services/modelCatalog';
import {
  RANDOM_IMAGE_COMMAND_MODES,
  WEB_TOOLS_CATALOG,
} from '../services/webTools';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_TEXT_UPLOAD_BYTES,
  compressImageFileForChat,
  formatBytesCompact,
  isImageAttachmentCandidate,
  uploadCompressedImageToPublicUrl,
} from '../utils/imageAttachment';

interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (attachment?: PreparedChatAttachment) => void;
  onStop: () => void;
  isLoading: boolean;
  enterToSend: boolean;
  activeModel: AIModelDefinition;
  activeImageModel: ImageModelOption;
  imageAutoFallback: boolean;
  deepThink: boolean;
  onToggleDeepThink: () => void;
  imageMode: boolean;
  onToggleImageMode: () => void;
  onOpenModelPicker: () => void;
  onOpenImageModelPicker: () => void;
  waifuName?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  enterToSend,
  activeModel,
  activeImageModel,
  imageAutoFallback,
  deepThink,
  onToggleDeepThink,
  imageMode,
  onToggleImageMode,
  onOpenModelPicker,
  onOpenImageModelPicker,
  waifuName,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const [attachment, setAttachment] = useState<PreparedChatAttachment | null>(null);
  const [isCompressingFile, setIsCompressingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [dismissedSlashForValue, setDismissedSlashForValue] = useState('');

  // Slash-command autocomplete items (/gambar + all 34 Web Tools)
  const allSlashSuggestions = useMemo(
    () => [
      {
        cmd: '/gambar',
        title: 'Generator Gambar AI',
        badge: 'Multi-Engine',
        hint: '/gambar naga kristal neon cyberpunk 4k',
      },
      ...WEB_TOOLS_CATALOG.map((tool) => ({
        cmd: tool.slashCommand,
        title: tool.shortName || tool.name,
        badge: tool.categoryLabel,
        hint: tool.requiresInput
          ? `${tool.slashCommand} ${tool.exampleInput}`.slice(0, 56)
          : tool.slashCommand,
        requiresInput: tool.requiresInput,
      })),
    ],
    []
  );

  const slashMatch = value.match(/^\s*\/([a-z0-9_-]{0,18})$/i);
  const isCompletedSpecialWithoutSpace =
    /^\s*\/(?:randomimg|randomimage|pinterest)\s*$/i.test(value);

  const filteredSlashItems = useMemo(() => {
    if (!slashMatch || isCompletedSpecialWithoutSpace) return [];
    if (dismissedSlashForValue && dismissedSlashForValue === value) return [];
    const partial = (slashMatch[1] || '').toLowerCase();
    const matched = allSlashSuggestions.filter((item) => {
      if (!partial) return true;
      const bareCmd = item.cmd.slice(1).toLowerCase();
      return (
        bareCmd.startsWith(partial) ||
        bareCmd.includes(partial) ||
        item.title.toLowerCase().includes(partial)
      );
    });
    return matched.slice(0, 7);
  }, [
    slashMatch,
    isCompletedSpecialWithoutSpace,
    dismissedSlashForValue,
    value,
    allSlashSuggestions,
  ]);

  useEffect(() => {
    setSlashIndex(0);
  }, [value]);

  const applySlashSelection = (item: {
    cmd: string;
    requiresInput?: boolean;
  }) => {
    const suffix = item.requiresInput === false ? '' : ' ';
    onChange(`${item.cmd}${suffix}`);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${nextHeight}px`;
  }, [value]);

  const speechConstructor =
    typeof window !== 'undefined'
      ? (
          window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionInstance;
            webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
          }
        ).SpeechRecognition ||
        (
          window as unknown as {
            webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
          }
        ).webkitSpeechRecognition
      : undefined;

  const toggleVoiceInput = () => {
    if (!speechConstructor) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new speechConstructor();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        onChange(value ? `${value.trim()} ${transcript}` : transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort();
    };
  }, []);

  const clearCurrentAttachment = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setAttachment(null);
  };

  const processSelectedFile = async (file: File) => {
    setFileError(null);

    if (isImageAttachmentCandidate(file)) {
      if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        setFileError(
          `Ukuran foto terlalu besar (${formatBytesCompact(file.size)}). Maksimum 20 MB per foto.`
        );
        return;
      }

      uploadAbortRef.current?.abort();
      const uploadCtrl = new AbortController();
      uploadAbortRef.current = uploadCtrl;
      setIsCompressingFile(true);

      try {
        const compressed = await compressImageFileForChat(file);
        if (uploadCtrl.signal.aborted) return;

        const uploadPromise = uploadCompressedImageToPublicUrl(
          compressed.visionDataUrl,
          compressed.fileName,
          compressed.mimeType,
          uploadCtrl.signal
        ).then((pubUrl) => {
          if (pubUrl && !uploadCtrl.signal.aborted) {
            setAttachment((prev) =>
              prev && prev.kind === 'image' && prev.name === compressed.fileName
                ? { ...prev, imagePublicUrl: pubUrl }
                : prev
            );
          }
          return pubUrl;
        });

        setAttachment({
          kind: 'image',
          name: compressed.fileName,
          imageDataUrl: compressed.visionDataUrl,
          imageThumbDataUrl: compressed.thumbDataUrl,
          imageMimeType: compressed.mimeType,
          imageMeta: compressed.metaLabel,
          pendingPublicUrlPromise: uploadPromise,
        });

        if (imageMode) onToggleImageMode();
        textareaRef.current?.focus();
      } catch (err) {
        setFileError(
          err instanceof Error
            ? err.message
            : 'Gagal memproses atau mengompresi foto.'
        );
      } finally {
        setIsCompressingFile(false);
      }
      return;
    }

    if (file.size > MAX_TEXT_UPLOAD_BYTES) {
      setFileError(
        `Ukuran berkas teks/kode maksimum 1 MB (berkas ini ${formatBytesCompact(file.size)}). Untuk foto pribadi, gunakan JPG, PNG, atau WEBP hingga 20 MB.`
      );
      return;
    }

    try {
      uploadAbortRef.current?.abort();
      uploadAbortRef.current = null;
      const text = await file.text();
      setAttachment({
        kind: 'text',
        name: file.name,
        textContent: text.slice(0, 24000),
      });
      if (imageMode) onToggleImageMode();
      textareaRef.current?.focus();
    } catch {
      setFileError('Gagal membaca berkas teks.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processSelectedFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const pastedFile = item.getAsFile();
        if (pastedFile) {
          e.preventDefault();
          const ext = pastedFile.type.includes('png')
            ? 'png'
            : pastedFile.type.includes('webp')
              ? 'webp'
              : 'jpg';
          const namedFile =
            pastedFile.name && pastedFile.name !== 'image.png'
              ? pastedFile
              : new File([pastedFile], `tangkapan-layar-${Date.now()}.${ext}`, {
                  type: pastedFile.type || 'image/png',
                });
          void processSelectedFile(namedFile);
          return;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      void processSelectedFile(droppedFile);
    }
  };

  const triggerSubmit = () => {
    if (isLoading) {
      onStop();
      return;
    }
    if (isCompressingFile) return;
    if (!value.trim() && !attachment) return;
    // Detach abort ref so background public URL upload can finish for the sent message
    uploadAbortRef.current = null;
    onSend(attachment ?? undefined);
    setAttachment(null);
    setFileError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (filteredSlashItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredSlashItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(
          (prev) => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length
        );
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const picked = filteredSlashItems[slashIndex] || filteredSlashItems[0];
        if (picked) applySlashSelection(picked);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDismissedSlashForValue(value);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const picked = filteredSlashItems[slashIndex] || filteredSlashItems[0];
        // Complete command if user hasn't typed exact full zero-arg command yet
        if (picked && value.trim().toLowerCase() !== picked.cmd.toLowerCase()) {
          e.preventDefault();
          applySlashSelection(picked);
          return;
        }
      }
    }

    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 640;
    if (e.key === 'Enter' && !e.shiftKey && enterToSend && !isMobileViewport) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  const canSend = Boolean((value.trim() || attachment) && !isCompressingFile);

  const isRandomImageCmd =
    filteredSlashItems.length === 0 &&
    /^\s*\/(?:random|randomimg|randomimage|wallpaper|wall)\b/i.test(value);
  const isPinterestCmd =
    filteredSlashItems.length === 0 &&
    /^\s*\/(?:pinterest|pin)\b/i.test(value);

  const applyQuickCountToInput = (n: number) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const withoutTrailingCount = trimmed
      .replace(/\s*,\s*\d{1,3}\s*$/, '')
      .replace(/^\/random(?:\s+image|\s+img)?(?=\s|$)/i, '/randomimage')
      .trim();
    onChange(`${withoutTrailingCount} ,${n}`);
    textareaRef.current?.focus();
  };

  const applyRandomModeToInput = (cmdText: string) => {
    const trailingMatch = value.trim().match(/\s*,\s*(\d{1,3})\s*$/);
    const nextCmd = trailingMatch ? `${cmdText} ,${trailingMatch[1]}` : cmdText;
    onChange(nextCmd);
    textareaRef.current?.focus();
  };

  return (
    <div className="pb-safe w-full shrink-0 bg-gradient-to-t from-[#03050B]/95 via-[#03050B]/70 to-transparent px-3 pt-1.5 sm:px-6 sm:pt-2">
      <div className="mx-auto w-full max-w-3xl">
        {/* Instant Slash-Command Autocomplete Menu */}
        {filteredSlashItems.length > 0 && (
          <div
            role="listbox"
            aria-label="Saran perintah cepat slash command"
            className="mb-2 max-h-[34dvh] overflow-y-auto rounded-2xl border border-[#22D3EE]/35 bg-[#060D1A]/96 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.75)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-2.5 py-1 text-[10.5px] text-[#94A3B8]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#67E8F9]">
                <Command className="h-3 w-3" />
                <span>Pintasan Command Cepat</span>
              </span>
              <span className="hidden font-mono-code text-[10px] sm:inline">
                ↑↓ Pilih · Tab/Enter Isi
              </span>
            </div>
            <div className="space-y-0.5">
              {filteredSlashItems.map((item, idx) => {
                const active = idx === slashIndex;
                return (
                  <button
                    key={item.cmd}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => applySlashSelection(item)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border border-[#22D3EE]/40 bg-[#22D3EE]/15 text-white'
                        : 'border border-transparent text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <code className="shrink-0 rounded-md border border-[#22D3EE]/30 bg-black/60 px-1.5 py-0.5 font-mono-code text-xs font-semibold text-[#67E8F9]">
                        {item.cmd}
                      </code>
                      <span className="truncate text-xs font-medium text-[#F1F5F9]">
                        {item.title}
                      </span>
                    </div>
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono-code text-[10px] text-[#94A3B8]">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(isRandomImageCmd || isPinterestCmd) && (
          <div className="mb-2 max-h-[38dvh] overflow-y-auto rounded-2xl border border-[#22D3EE]/30 bg-[#07111E]/95 px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="font-semibold text-[#67E8F9]">
                📌 Pemberitahuan Command &amp; Cara Pakai{' '}
                <code className="font-mono-code text-white">
                  {isRandomImageCmd ? '/randomimage · /randomimg' : '/pinterest'}
                </code>
              </span>
              <code className="rounded border border-[#FB923C]/35 bg-[#FB923C]/12 px-1.5 py-0.5 font-mono-code text-[10px] text-[#FDBA74]">
                {isRandomImageCmd
                  ? '/randomimg [mode / tema] ,<jumlah 1–30>'
                  : '/pinterest <kata kunci> ,<jumlah 1–30>'}
              </code>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[#CBD5E1]">
              {isRandomImageCmd
                ? 'Klik salah satu dari 9 command mode di bawah (atau ketik tema bebas), lalu tambahkan ,jumlah (contoh: /randomimg anime ,10 atau /randomimage portrait ,6).'
                : 'Ketik kata kunci pencarian lalu akhiri dengan ,jumlah (1–30) untuk mengatur banyak pin (contoh: /pinterest alya kujou ,10).'}
            </p>

            {isRandomImageCmd && (
              <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-3">
                {RANDOM_IMAGE_COMMAND_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => applyRandomModeToInput(m.command)}
                    className="flex items-center justify-between gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-left transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/15 cursor-pointer"
                  >
                    <span className="truncate text-[10.5px] font-medium text-[#F1F5F9]">
                      {m.label}
                    </span>
                    <code className="shrink-0 rounded bg-black/70 px-1.5 py-0.5 font-mono-code text-[9.5px] text-[#67E8F9]">
                      {m.command}
                    </code>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#94A3B8]">
                Atur jumlah cepat:
              </span>
              {[4, 8, 10, 15, 20, 30].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => applyQuickCountToInput(cnt)}
                  className="rounded-md border border-[#22D3EE]/30 bg-[#22D3EE]/12 px-1.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#A5F3FC] transition-colors hover:bg-[#22D3EE]/25 hover:text-white cursor-pointer"
                >
                  ,{cnt}
                </button>
              ))}
              {!isRandomImageCmd && (
                <>
                  <span className="ml-1 text-[10px] font-semibold text-[#94A3B8]">
                    Contoh:
                  </span>
                  {['/pinterest alya kujou ,10', '/pinterest anime aesthetic ,15'].map(
                    (ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => {
                          onChange(ex);
                          textareaRef.current?.focus();
                        }}
                        className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono-code text-[10px] text-[#E2E8F0] transition-colors hover:border-[#FB923C]/45 hover:bg-[#FB923C]/15 hover:text-white cursor-pointer"
                      >
                        {ex}
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {fileError && (
          <div className="mb-1.5 flex items-center justify-between rounded-xl border border-[#FB923C]/40 bg-[#1B120E]/90 px-3 py-1.5 text-xs text-[#FED7AA] backdrop-blur-md">
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              aria-label="Tutup peringatan"
              className="p-1 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button, input')) return;
            textareaRef.current?.focus();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragOver) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsDragOver(false);
            }
          }}
          onDrop={handleDrop}
          className={`nd-glass-composer rounded-[26px] px-3.5 pt-2.5 pb-2 cursor-text transition-colors ${
            imageMode ? 'nd-glass-composer-orange' : ''
          } ${isDragOver ? 'ring-2 ring-[#22D3EE]/60' : ''}`}
        >
          {/* Image Engine Selector Bar (Mobile 320px+ & Desktop — Zero Horizontal Crowding) */}
          {imageMode && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[#FB923C]/30 bg-[#FB923C]/[0.08] px-2.5 py-1.5 text-xs">
              <div className="flex min-w-0 items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[#FB923C]" />
                <span className="truncate font-semibold text-[#FED7AA]">
                  {activeImageModel.name}
                </span>
                {imageAutoFallback && (
                  <span className="hidden shrink-0 items-center gap-1 rounded border border-[#22D3EE]/30 bg-[#22D3EE]/12 px-1.5 py-0.5 font-mono-code text-[10px] text-[#67E8F9] xs:inline-flex sm:inline-flex">
                    <Shuffle className="h-2.5 w-2.5" />
                    Auto-Fallback
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenImageModelPicker}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#FB923C]/40 bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-[#FDBA74] transition-colors hover:bg-[#FB923C]/20 hover:text-white cursor-pointer"
              >
                <span>Pilih Model</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Compressing Photo Indicator */}
          {isCompressingFile && (
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#22D3EE]/35 bg-[#081322]/90 px-3 py-1.5 text-xs text-[#A5F3FC]">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#22D3EE]" />
              <span>Mengompresi &amp; mengoptimalkan foto...</span>
            </div>
          )}

          {/* Attachment Chip (Personal Photo Thumbnail OR Text/Code File) */}
          {attachment && !isCompressingFile && (
            attachment.kind === 'image' ? (
              <div className="mb-2 inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-[#22D3EE]/35 bg-black/60 p-1.5 pr-2.5 text-xs text-[#F8FAFC] shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black">
                  <img
                    src={
                      attachment.imageThumbDataUrl ||
                      attachment.imageDataUrl ||
                      attachment.imagePublicUrl
                    }
                    alt={attachment.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[155px] truncate font-medium text-white sm:max-w-[240px]">
                      {attachment.name}
                    </span>
                    <span className="shrink-0 rounded border border-[#22D3EE]/35 bg-[#22D3EE]/14 px-1.5 py-0.5 font-mono-code text-[9.5px] font-semibold text-[#67E8F9]">
                      Vision AI
                    </span>
                  </div>
                  {attachment.imageMeta && (
                    <p className="m-0 mt-0.5 truncate font-mono-code text-[10px] text-[#94A3B8]">
                      {attachment.imageMeta}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearCurrentAttachment}
                  aria-label="Hapus lampiran"
                  className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/12 bg-black/50 px-2.5 py-1 text-xs text-[#F8FAFC]">
                <FileText className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                <span className="max-w-[200px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={clearCurrentAttachment}
                  aria-label="Hapus lampiran"
                  className="ml-0.5 rounded p-0.5 text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          )}

          {/* Auto-growing Prompt Input */}
          <label htmlFor="nodatagpt-prompt-input" className="sr-only">
            Tulis pesan untuk NodataGPT
          </label>
          <textarea
            id="nodatagpt-prompt-input"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachment?.kind === 'image'
                ? waifuName
                  ? `Tulis pesan tentang foto ini untuk ${waifuName} (atau langsung kirim)...`
                  : 'Tanyakan apa saja tentang foto ini (atau langsung kirim)...'
                : imageMode
                  ? 'Deskripsikan gambar AI yang ingin dibuat...'
                  : deepThink
                    ? 'Tanyakan masalah kompleks untuk dianalisis DeepThink...'
                    : waifuName
                      ? `Kirim pesan ke ${waifuName}...`
                      : 'Tanya NodataGPT apa saja...'
            }
            className="nd-composer-textarea block max-h-[160px] min-h-[26px] w-full resize-none border-0 bg-transparent px-1 py-0.5 text-[15px] leading-relaxed text-[#F8FAFC] caret-[#22D3EE] placeholder-[#94A3B8] focus:ring-0 focus:outline-none focus-visible:outline-none sm:text-base"
          />

          {/* Clean Single-Row Composer Action Bar (Balanced & Uncrowded on Mobile & Desktop) */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.csv,.sql,.sh,.yaml,.yml,.xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Lampirkan foto atau berkas"
                title="Upload foto pribadi (hingga 20 MB, otomatis dikompresi) atau berkas teks/kode"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                  attachment
                    ? 'border-[#22D3EE]/55 bg-[#22D3EE]/16 text-[#67E8F9]'
                    : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onToggleDeepThink}
                aria-pressed={deepThink}
                title="Mode Penalaran DeepThink"
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer ${
                  deepThink
                    ? 'border-[#22D3EE]/70 bg-[#22D3EE]/18 text-[#67E8F9] shadow-[0_0_14px_rgba(34,211,238,0.18)]'
                    : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:text-white'
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                <span>DeepThink</span>
              </button>

              <button
                type="button"
                onClick={onToggleImageMode}
                aria-pressed={imageMode}
                title="Mode Pembuat Gambar AI"
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer ${
                  imageMode
                    ? 'border-[#FB923C]/70 bg-[#FB923C]/18 text-[#FDBA74] shadow-[0_0_14px_rgba(251,146,60,0.18)]'
                    : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:text-white'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[#FB923C]" />
                <span>Gambar</span>
              </button>

              <button
                type="button"
                onClick={imageMode ? onOpenImageModelPicker : onOpenModelPicker}
                title={imageMode ? 'Pilih model gambar AI' : 'Pilih model chat AI'}
                className={`hidden h-9 min-w-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors sm:inline-flex cursor-pointer ${
                  imageMode
                    ? 'border-[#FB923C]/45 bg-[#FB923C]/12 text-[#FDBA74] hover:border-[#FB923C]/70'
                    : 'border-white/10 bg-white/[0.04] text-[#22D3EE] hover:border-white/20'
                }`}
              >
                <span className="max-w-[140px] truncate">
                  {imageMode
                    ? activeImageModel.shortName
                    : deepThink
                      ? 'Rantai DeepThink'
                      : activeModel.shortName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {speechConstructor && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-label={isListening ? 'Hentikan dikte suara' : 'Dikte suara'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                    isListening
                      ? 'border-[#FB923C]/50 bg-[#FB923C]/20 text-[#FB923C]'
                      : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={triggerSubmit}
                disabled={!isLoading && !canSend}
                aria-label={isLoading ? 'Hentikan respons' : 'Kirim pesan'}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all sm:h-10 sm:w-10 ${
                  isLoading
                    ? 'bg-[#EA580C] text-white shadow-[0_0_16px_rgba(234,88,12,0.45)] hover:bg-[#F97316] cursor-pointer'
                    : canSend
                      ? imageMode
                        ? 'bg-[#EA580C] text-white shadow-[0_0_16px_rgba(234,88,12,0.4)] hover:bg-[#F97316] cursor-pointer'
                        : 'bg-[#0E7490] text-white shadow-[0_0_18px_rgba(34,211,238,0.32)] hover:bg-[#0891B2] cursor-pointer'
                      : 'border border-white/8 bg-white/[0.05] text-[#64748B] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Square className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-1.5 hidden text-center text-[11px] text-[#94A3B8] sm:block">
          NodataGPT memadukan {AI_MODELS.length - 1} jalur chat & {IMAGE_ENGINES.length} model gambar AI dengan Auto-Fallback otomatis.
        </p>
      </div>
    </div>
  );
}
