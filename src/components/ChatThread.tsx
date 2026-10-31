import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FastForward,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Maximize2,
  Music,
  Pencil,
  Play,
  RefreshCw,
  Send,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import type { RouterStatusUpdate } from '../services/aiRouter';
import {
  formatBytesShort,
  getCachedMediaBlobUrl,
  triggerDirectDownload,
  type DownloadProgressInfo,
} from '../utils/directDownload';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  elapsedMs: number;
  routerStatus: RouterStatusUpdate | null;
  onRegenerate: (assistantMessageId: string) => void;
  onEditMessage: (messageId: string, updatedContent: string) => void;
  onEditAndResendUserMessage: (userMessageId: string, updatedContent: string) => void;
  onFlushStream: () => void;
  onOpenImageModelPicker: () => void;
  onSummarizeTranscript?: (transcript: string) => void;
}

function ThinkingAccordion({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-[#22D3EE]/25 bg-[#091220]/80">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-[#67E8F9] transition-colors hover:bg-white/[0.04] cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
          <span>Proses Penalaran (DeepThink)</span>
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/8 px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-[#CBD5E1]">
          {content}
        </div>
      )}
    </div>
  );
}

function DirectDownloadButton({
  url,
  label,
  kind,
  fallbackId,
  className,
  iconSizeClass = 'h-3.5 w-3.5',
  compact = false,
  onDownloaded,
}: {
  url: string;
  label: string;
  kind?: 'video' | 'audio' | 'image' | 'file';
  fallbackId?: string;
  className: string;
  iconSizeClass?: string;
  compact?: boolean;
  onDownloaded?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<DownloadProgressInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (busy) {
      abortRef.current?.abort();
      abortRef.current = null;
      setBusy(false);
      setProgress(null);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setDone(false);
    setProgress(null);

    try {
      await triggerDirectDownload({
        url,
        label,
        kind,
        fallbackId,
        signal: ctrl.signal,
        onProgress: (info) => setProgress(info),
      });
      if (!ctrl.signal.aborted) {
        setDone(true);
        onDownloaded?.();
        window.setTimeout(() => setDone(false), 2400);
      }
    } catch {
      // Aborted or handled inside triggerDirectDownload
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
      }
      setBusy(false);
      setProgress(null);
    }
  };

  let statusText = label;
  if (busy) {
    if (progress && progress.percent !== null) {
      statusText = compact ? `${progress.percent}%` : `Mengunduh ${progress.percent}%...`;
    } else if (progress && progress.loadedBytes > 0) {
      statusText = compact
        ? formatBytesShort(progress.loadedBytes)
        : `Mengunduh ${formatBytesShort(progress.loadedBytes)}...`;
    } else {
      statusText = compact ? '...' : 'Menyiapkan...';
    }
  } else if (done) {
    statusText = compact ? 'OK' : 'Terunduh';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={busy ? 'Klik untuk membatalkan unduhan' : `${label} (Unduh langsung tanpa tab baru)`}
      className={`${className} cursor-pointer`}
    >
      {busy ? (
        <Loader2 className={`${iconSizeClass} shrink-0 animate-spin`} />
      ) : done ? (
        <Check className={`${iconSizeClass} shrink-0 text-[#22D3EE]`} />
      ) : (
        <Download className={`${iconSizeClass} shrink-0`} />
      )}
      <span>{statusText}</span>
    </button>
  );
}

function DataSaverVideoCard({
  videoUrl,
  posterUrl,
  answeredByName,
  msgId,
}: {
  videoUrl: string;
  posterUrl?: string;
  answeredByName?: string;
  msgId: string;
}) {
  const [playerActive, setPlayerActive] = useState(false);
  const [, setCacheTick] = useState(0);

  const cachedBlob = getCachedMediaBlobUrl(videoUrl);
  const effectiveSrc = cachedBlob || videoUrl;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/85">
      {playerActive ? (
        <video
          src={effectiveSrc}
          poster={posterUrl}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="max-h-[420px] w-full bg-black object-contain"
        />
      ) : (
        <div className="relative flex min-h-[210px] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#060F1D] via-[#050811] to-[#170D07] px-4 py-7 text-center sm:min-h-[250px]">
          {posterUrl && (
            <img
              src={posterUrl}
              alt="Sampul video"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 blur-[1px]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60" />

          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlayerActive(true)}
              className="group inline-flex min-h-[46px] items-center gap-2.5 rounded-2xl border border-[#22D3EE]/55 bg-black/75 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(34,211,238,0.24)] backdrop-blur-md transition-all hover:scale-[1.02] hover:border-[#22D3EE] hover:bg-[#0E7490]/85 cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22D3EE] text-black transition-transform group-hover:scale-105">
                <Play className="h-3.5 w-3.5 fill-current translate-x-[0.5px]" />
              </span>
              <span>Putar Pratinjau Video</span>
            </button>

            <span className="rounded-full border border-white/12 bg-black/65 px-3 py-0.5 font-mono-code text-[10.5px] text-[#CBD5E1] backdrop-blur-xs">
              {cachedBlob
                ? 'Tersimpan di memori sesi · Putar 0 KB kuota'
                : 'Mode Hemat Kuota · 0 MB diambil sebelum diputar'}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3.5 py-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-[#94A3B8]">
          <Film className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
          <span className="truncate">
            Video Siap Unduh{answeredByName ? ` · ${answeredByName}` : ''}
          </span>
        </span>
        <DirectDownloadButton
          url={videoUrl}
          label="Unduh Video"
          kind="video"
          fallbackId={msgId}
          onDownloaded={() => setCacheTick((t) => t + 1)}
          className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg bg-[#0E7490] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0891B2]"
        />
      </div>
    </div>
  );
}

function DataSaverAudioCard({
  audioUrl,
  audioTitle,
  answeredByName,
  msgId,
}: {
  audioUrl: string;
  audioTitle?: string;
  answeredByName?: string;
  msgId: string;
}) {
  const [, setCacheTick] = useState(0);
  const effectiveSrc = getCachedMediaBlobUrl(audioUrl) || audioUrl;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-[#22D3EE]/25 bg-[#07111F]/90 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-[#67E8F9]">
          <Music className="h-3.5 w-3.5 shrink-0 text-[#FB923C]" />
          <span className="truncate">
            {audioTitle || answeredByName || 'Pemutar Audio'}
          </span>
        </span>
        <DirectDownloadButton
          url={audioUrl}
          label="Unduh Audio"
          kind="audio"
          fallbackId={msgId}
          iconSizeClass="h-3 w-3"
          onDownloaded={() => setCacheTick((t) => t + 1)}
          className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2.5 py-1 text-[11px] font-semibold text-[#CFFAFE] transition-colors hover:bg-[#22D3EE]/22"
        />
      </div>
      <audio
        src={effectiveSrc}
        controls
        preload="none"
        className="h-10 w-full"
      />
    </div>
  );
}

function DataSaverGalleryGrid({
  urls,
  downloadUrls,
  aspect = 'square',
  msgId,
}: {
  urls: string[];
  downloadUrls?: string[];
  aspect?: 'square' | 'portrait' | 'landscape';
  msgId: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    previewUrl: string;
    downloadUrl: string;
    index: number;
  } | null>(null);

  const visibleUrls = showAll ? urls : urls.slice(0, 30);
  const hiddenCount = urls.length - visibleUrls.length;

  const aspectClass =
    aspect === 'portrait'
      ? 'aspect-[9/16]'
      : aspect === 'landscape'
        ? 'aspect-video'
        : 'aspect-square';

  const gridColsClass =
    aspect === 'portrait'
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="mb-3 space-y-2">
      <div className={`grid ${gridColsClass} gap-2`}>
        {visibleUrls.map((gUrl, gIdx) => {
          const fullDlUrl = downloadUrls?.[gIdx] || gUrl;
          return (
            <div
              key={`${msgId}-gal-${gIdx}`}
              className={`group relative ${aspectClass} overflow-hidden rounded-xl border border-white/10 bg-black/75`}
            >
              <button
                type="button"
                onClick={() =>
                  setLightboxState({
                    previewUrl: gUrl,
                    downloadUrl: fullDlUrl,
                    index: gIdx + 1,
                  })
                }
                aria-label={`Pratinjau gambar ${gIdx + 1}`}
                className="h-full w-full cursor-pointer"
              >
                <img
                  src={gUrl}
                  alt={`Galeri ${gIdx + 1}`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const imgEl = e.currentTarget;
                    if (
                      imgEl.dataset.proxyRetried !== '1' &&
                      /^https?:\/\//i.test(gUrl)
                    ) {
                      imgEl.dataset.proxyRetried = '1';
                      imgEl.src = `/api/download?inline=1&url=${encodeURIComponent(gUrl)}`;
                    }
                  }}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLightboxState({
                    previewUrl: gUrl,
                    downloadUrl: fullDlUrl,
                    index: gIdx + 1,
                  })
                }
                aria-label="Perbesar gambar"
                className="absolute top-1.5 left-1.5 inline-flex h-7 items-center gap-1 rounded-lg bg-black/75 px-1.5 text-[10.5px] font-semibold text-[#E2E8F0] opacity-90 backdrop-blur-xs transition-colors hover:bg-black/95 hover:text-white cursor-pointer"
              >
                <Maximize2 className="h-3 w-3 text-[#22D3EE]" />
                <span>#{gIdx + 1}</span>
              </button>

              <DirectDownloadButton
                url={fullDlUrl}
                label="Unduh"
                kind="image"
                fallbackId={`${msgId}-${gIdx + 1}`}
                compact
                iconSizeClass="h-3 w-3"
                className="absolute right-1.5 bottom-1.5 inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-[#22D3EE]/45 bg-black/80 px-2 py-1 text-[10.5px] font-semibold text-[#CFFAFE] shadow-md backdrop-blur-xs transition-colors hover:bg-[#0E7490] hover:text-white"
              />
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/40 hover:text-white cursor-pointer"
        >
          <span>Tampilkan {hiddenCount} gambar HD lainnya (Hemat Kuota)</span>
        </button>
      )}

      {lightboxState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxState(null)}
        >
          <div
            className="relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#060B14] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="font-display text-xs font-semibold text-[#CBD5E1]">
                Pratinjau Gambar HD #{lightboxState.index}
              </span>
              <div className="flex items-center gap-2">
                <DirectDownloadButton
                  url={lightboxState.downloadUrl}
                  label="Unduh Gambar HD"
                  kind="image"
                  fallbackId={`${msgId}-${lightboxState.index}`}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl bg-[#0E7490] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0891B2]"
                />
                <button
                  type="button"
                  onClick={() => setLightboxState(null)}
                  aria-label="Tutup pratinjau"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#CBD5E1] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-black p-2">
              <img
                src={lightboxState.previewUrl}
                alt="Pratinjau penuh"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const imgEl = e.currentTarget;
                  if (
                    imgEl.dataset.proxyRetried !== '1' &&
                    /^https?:\/\//i.test(lightboxState.previewUrl)
                  ) {
                    imgEl.dataset.proxyRetried = '1';
                    imgEl.src = `/api/download?inline=1&url=${encodeURIComponent(
                      lightboxState.previewUrl
                    )}`;
                  }
                }}
                className="max-h-[76dvh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatThread({
  messages,
  isLoading,
  elapsedMs,
  routerStatus,
  onRegenerate,
  onEditMessage,
  onEditAndResendUserMessage,
  onFlushStream,
  onOpenImageModelPicker,
  onSummarizeTranscript,
}: ChatThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const lastMessage = messages[messages.length - 1];
  const lastContentLen = lastMessage?.content?.length ?? 0;

  useEffect(() => {
    if (editingId && !messages.some((m) => m.id === editingId)) {
      setEditingId(null);
      setEditDraft('');
    }
  }, [messages, editingId]);

  useEffect(() => {
    if (!editingId) return;
    const el = editTextareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    const el = editTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 64), 240);
    el.style.height = `${nextHeight}px`;
  }, [editingId, editDraft]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (!isLoading || showScrollBottom) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lastContentLen, isLoading, showScrollBottom]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 220);
  };

  const scrollToBottom = () => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleCopyMessage = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      const area = document.createElement('textarea');
      area.value = msg.content;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const plainText = msg.content
      .replace(/```[\s\S]*?```/g, ' blok kode. ')
      .replace(/[#*`_~[\]()>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'id-ID';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const startEditingMessage = (msg: ChatMessage) => {
    if (speakingId === msg.id && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
    setEditingId(msg.id);
    setEditDraft(msg.content);
  };

  const cancelEditingMessage = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const handleSaveEditedMessage = (msg: ChatMessage) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    if (trimmed !== msg.content) {
      onEditMessage(msg.id, trimmed);
    }
    setEditingId(null);
    setEditDraft('');
  };

  const handleSaveAndResendUserMessage = (msg: ChatMessage) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    setEditingId(null);
    setEditDraft('');
    onEditAndResendUserMessage(msg.id, trimmed);
  };

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const formattedLiveSeconds = `${(elapsedMs / 1000).toFixed(1)} dtk`;

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto px-3.5 pt-4 pb-5 sm:px-6 sm:pt-6"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            const isEditingUserMsg = editingId === msg.id;

            return (
              <div key={msg.id} className="group flex flex-col items-end">
                {isEditingUserMsg ? (
                  <div className="nd-user-bubble w-full max-w-[96%] rounded-2xl rounded-tr-sm border-[#22D3EE]/55 p-3 text-[#F8FAFC] shadow-[0_0_24px_rgba(34,211,238,0.14)] sm:max-w-[84%] sm:p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-[#67E8F9]">
                        <Pencil className="h-3.5 w-3.5 text-[#22D3EE]" />
                        <span>Edit Pesan</span>
                      </span>
                      {msg.attachmentName && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/30 bg-black/45 px-2 py-0.5 text-[11px] text-[#67E8F9]">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="max-w-[160px] truncate">{msg.attachmentName}</span>
                        </span>
                      )}
                    </div>

                    <label htmlFor={`edit-user-msg-${msg.id}`} className="sr-only">
                      Edit pesan pengguna
                    </label>
                    <textarea
                      id={`edit-user-msg-${msg.id}`}
                      ref={editTextareaRef}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditingMessage();
                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveAndResendUserMessage(msg);
                        }
                      }}
                      rows={2}
                      placeholder="Ubah isi pesan..."
                      className="nd-composer-textarea block w-full resize-none rounded-xl border-0 bg-black/35 px-3 py-2 text-base leading-relaxed text-[#F8FAFC] caret-[#22D3EE] placeholder-[#94A3B8] focus:ring-0 focus:outline-none focus-visible:outline-none"
                    />

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                      <span className="hidden text-[11px] text-[#94A3B8] sm:inline">
                        Ctrl+Enter kirim ulang · Esc batal
                      </span>
                      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={cancelEditingMessage}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-white/12 bg-black/45 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Batal</span>
                        </button>
                        <button
                          type="button"
                          disabled={!editDraft.trim()}
                          onClick={() => handleSaveEditedMessage(msg)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-3 py-1.5 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/22 disabled:opacity-40 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          disabled={!editDraft.trim()}
                          onClick={() => handleSaveAndResendUserMessage(msg)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#0E7490] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-colors hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Kirim Ulang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="nd-user-bubble max-w-[90%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[#F8FAFC] sm:max-w-[78%] sm:px-4.5 sm:py-3">
                      {msg.attachmentName && (
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/30 bg-black/45 px-2.5 py-1 text-xs text-[#67E8F9]">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[200px] truncate">{msg.attachmentName}</span>
                        </div>
                      )}
                      <p className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed sm:text-base">
                        {msg.content}
                      </p>
                      {msg.editedAt && (
                        <div className="mt-1 flex justify-end">
                          <span className="font-mono-code text-[10px] text-[#67E8F9]/75">
                            Diedit
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Message Action Bar (Mobile & Desktop Accessible: Salin + Edit) */}
                    <div className="mt-1 flex flex-wrap items-center justify-end gap-1 text-[#94A3B8] transition-opacity sm:opacity-80 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg)}
                        aria-label="Salin pesan pengguna"
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#22D3EE]" />
                            <span className="text-[#22D3EE]">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditingMessage(msg)}
                        aria-label="Edit pesan pengguna"
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }

          const isLastAssistant = idx === messages.length - 1;
          const isWaitingContent = msg.status === 'waiting';
          const isTypingContent = msg.status === 'typing';
          const isActiveTurn = isWaitingContent || isTypingContent;
          const isErrorState = Boolean(msg.isError || msg.status === 'error');

          return (
            <article
              key={msg.id}
              aria-label="Respons NodataGPT"
              className="flex items-start gap-2.5 sm:gap-3.5"
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-black/85 p-1 shadow-md transition-colors sm:h-8 sm:w-8 ${
                  isActiveTurn
                    ? 'border-[#22D3EE]/65 shadow-[0_0_14px_rgba(34,211,238,0.28)]'
                    : 'border-white/12'
                }`}
              >
                <img
                  src="/logo-transparent.png"
                  alt="NodataGPT"
                  width={24}
                  height={24}
                  className={`h-full w-full object-contain ${
                    isActiveTurn ? 'animate-orbit-fast' : ''
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                {/* Sender + Model Pill + Live Writing Seconds Badge */}
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-xs font-bold tracking-tight">
                    <span className="text-[#22D3EE]">Nodata</span>
                    <span className="text-[#FB923C]">GPT</span>
                  </span>

                  {msg.answeredByName && (
                    <span className="inline-flex items-center rounded-md border border-white/10 bg-black/45 px-2 py-0.5 font-mono-code text-[10px] text-[#CBD5E1] backdrop-blur-sm">
                      {msg.answeredByName}
                    </span>
                  )}

                  {msg.usedFallback && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#FB923C]/40 bg-[#FB923C]/12 px-2 py-0.5 font-mono-code text-[10px] font-medium text-[#FB923C]">
                      <Shuffle className="h-2.5 w-2.5" />
                      Auto-fallback
                    </span>
                  )}

                  {msg.editedAt && !isTypingContent && (
                    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono-code text-[10px] text-[#94A3B8]">
                      Diedit
                    </span>
                  )}

                  {isTypingContent && (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#22D3EE]/40 bg-[#22D3EE]/14 px-2 py-0.5 font-mono-code text-[10px] font-semibold tabular-nums text-[#67E8F9]">
                      <span className="nd-typing-dot h-1.5 w-1.5 rounded-full bg-[#FB923C]" />
                      <span>Menulis · {formattedLiveSeconds}</span>
                    </span>
                  )}
                </div>

                {/* Phase 1: Waiting for AI Response (WormGPT Shimmer + Live Seconds Timer) */}
                {isWaitingContent ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="nd-assistant-surface space-y-2.5 rounded-2xl px-4 py-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-[#CBD5E1]">
                        {routerStatus?.isFallback ? (
                          <span className="text-[#FB923C]">
                            {routerStatus.previousFailedModel
                              ? `${routerStatus.previousFailedModel} padat, beralih ke ${routerStatus.modelName}...`
                              : `Beralih otomatis ke ${routerStatus.modelName}...`}
                          </span>
                        ) : routerStatus?.deepThink ? (
                          <>
                            Penalaran DeepThink pada{' '}
                            <strong className="text-[#22D3EE]">
                              {routerStatus.modelName || 'NodataGPT'}
                            </strong>
                            ...
                          </>
                        ) : routerStatus?.imageMode || msg.isImageRequest ? (
                          <>
                            NodataGPT sedang melukis gambar
                            {routerStatus?.modelName
                              ? ` (${routerStatus.modelName})`
                              : ''}
                            ...
                          </>
                        ) : (
                          <>
                            NodataGPT sedang menyusun jawaban
                            {routerStatus?.modelName
                              ? ` (${routerStatus.modelName})`
                              : ''}
                            ...
                          </>
                        )}
                      </span>

                      <span className="shrink-0 rounded-md border border-[#FB923C]/35 bg-[#FB923C]/12 px-2 py-0.5 font-mono-code text-[11px] font-semibold tabular-nums text-[#FB923C]">
                        {formattedLiveSeconds}
                      </span>
                    </div>

                    <div className="nd-shimmer-bar h-3.5 w-full rounded-md" />
                    <div className="nd-shimmer-bar h-3.5 w-5/6 rounded-md" />
                    <div className="nd-shimmer-bar h-3.5 w-3/5 rounded-md" />
                  </div>
                ) : isErrorState ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[#FB923C]/40 bg-[#1A110E]/88 p-3.5 text-sm text-[#FED7AA] backdrop-blur-md"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold text-[#FB923C]">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Permintaan belum berhasil</span>
                      </span>
                      {typeof msg.durationMs === 'number' && msg.durationMs > 0 && (
                        <span className="font-mono-code text-[11px] tabular-nums text-[#94A3B8]">
                          {(msg.durationMs / 1000).toFixed(1)} dtk
                        </span>
                      )}
                    </div>
                    <p className="m-0 leading-relaxed text-[#F8FAFC]">{msg.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => onRegenerate(msg.id)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#FB923C]/50 bg-black/50 px-3 py-1.5 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#FB923C]/15 disabled:opacity-45 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Coba Lagi dengan Auto-Fallback</span>
                      </button>

                      {msg.isImageRequest && (
                        <button
                          type="button"
                          onClick={onOpenImageModelPicker}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-3 py-1.5 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/20 cursor-pointer"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Pilih Model Gambar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg)}
                        aria-label="Salin pesan"
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/12 bg-black/45 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#22D3EE]" />
                            <span className="text-[#22D3EE]">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : editingId === msg.id ? (
                  <div className="nd-assistant-surface rounded-2xl border border-[#FB923C]/45 px-3.5 py-3 shadow-[0_0_24px_rgba(251,146,60,0.1)] sm:px-4.5 sm:py-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-[#FDBA74]">
                        <Pencil className="h-3.5 w-3.5 text-[#FB923C]" />
                        <span>Edit Pesan Balasan</span>
                      </span>
                    </div>

                    <label htmlFor={`edit-assistant-msg-${msg.id}`} className="sr-only">
                      Edit pesan balasan NodataGPT
                    </label>
                    <textarea
                      id={`edit-assistant-msg-${msg.id}`}
                      ref={editTextareaRef}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditingMessage();
                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditedMessage(msg);
                        }
                      }}
                      rows={3}
                      placeholder="Ubah isi pesan balasan..."
                      className="nd-composer-textarea block w-full resize-none rounded-xl border-0 bg-black/40 px-3 py-2.5 text-base leading-relaxed text-[#F8FAFC] caret-[#FB923C] placeholder-[#94A3B8] focus:ring-0 focus:outline-none focus-visible:outline-none"
                    />

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                      <span className="hidden text-[11px] text-[#94A3B8] sm:inline">
                        Ctrl+Enter simpan · Esc batal
                      </span>
                      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={cancelEditingMessage}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-white/12 bg-black/45 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Batal</span>
                        </button>
                        <button
                          type="button"
                          disabled={!editDraft.trim()}
                          onClick={() => handleSaveEditedMessage(msg)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#EA580C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(251,146,60,0.22)] transition-colors hover:bg-[#F97316] disabled:opacity-40 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Simpan Perubahan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Phase 2 (Typing Stream) & Phase 3 (Completed Message) */
                  <div className="nd-assistant-surface rounded-2xl px-3.5 py-3 sm:px-4.5 sm:py-3.5">
                    {msg.thinkingContent && (
                      <ThinkingAccordion content={msg.thinkingContent} />
                    )}

                    {msg.videoUrl && (
                      <DataSaverVideoCard
                        videoUrl={msg.videoUrl}
                        posterUrl={msg.videoPosterUrl}
                        answeredByName={msg.answeredByName}
                        msgId={msg.id}
                      />
                    )}

                    {msg.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/75">
                        <img
                          src={msg.imageUrl}
                          alt={msg.content}
                          width={768}
                          height={768}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[420px] w-full bg-black object-contain"
                        />
                        <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2">
                          <span className="truncate text-xs text-[#94A3B8]">
                            Media Visual{msg.answeredByName ? ` · ${msg.answeredByName}` : ''}
                          </span>
                          <DirectDownloadButton
                            url={msg.imageUrl}
                            label="Unduh"
                            kind="image"
                            fallbackId={msg.id}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#0E7490] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0891B2]"
                          />
                        </div>
                      </div>
                    )}

                    {msg.audioUrl && (
                      <DataSaverAudioCard
                        audioUrl={msg.audioUrl}
                        audioTitle={msg.audioTitle}
                        answeredByName={msg.answeredByName}
                        msgId={msg.id}
                      />
                    )}

                    {msg.galleryUrls && msg.galleryUrls.length > 0 && (
                      <DataSaverGalleryGrid
                        urls={msg.galleryUrls}
                        downloadUrls={msg.galleryDownloadUrls}
                        aspect={msg.galleryAspect}
                        msgId={msg.id}
                      />
                    )}

                    <MarkdownRenderer
                      content={msg.content}
                      isStreaming={isTypingContent}
                    />

                    {/* Extra Download Pills & 1-Click Transcript AI Summary */}
                    {((msg.downloadItems && msg.downloadItems.length > 0) ||
                      (msg.summarizeTranscript && onSummarizeTranscript)) && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
                        {msg.downloadItems?.map((dl, dlIdx) => (
                          <DirectDownloadButton
                            key={`${msg.id}-dl-${dlIdx}`}
                            url={dl.url}
                            label={dl.label}
                            kind={dl.kind}
                            fallbackId={`${msg.id}-${dlIdx + 1}`}
                            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              dl.kind === 'audio'
                                ? 'border-[#FB923C]/40 bg-[#FB923C]/14 text-[#FED7AA] hover:bg-[#FB923C]/24'
                                : 'border-[#22D3EE]/40 bg-[#22D3EE]/14 text-[#CFFAFE] hover:bg-[#22D3EE]/24'
                            }`}
                          />
                        ))}

                        {msg.summarizeTranscript &&
                          onSummarizeTranscript &&
                          !isLoading && (
                            <button
                              type="button"
                              onClick={() =>
                                onSummarizeTranscript(msg.summarizeTranscript!)
                              }
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl bg-[#EA580C] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(251,146,60,0.25)] transition-colors hover:bg-[#F97316] cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Ringkas Transkrip dengan AI</span>
                            </button>
                          )}
                      </div>
                    )}

                    {/* Live Typing Footer (Seconds Ticking + Instant Reveal Button from WormGPT) */}
                    {isTypingContent && isLastAssistant ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-2.5">
                        <span className="inline-flex items-center gap-1.5 font-mono-code text-xs font-medium tabular-nums text-[#FB923C]">
                          <Clock className="h-3.5 w-3.5 text-[#22D3EE]" />
                          <span>Waktu menulis: {formattedLiveSeconds}</span>
                        </span>

                        <button
                          type="button"
                          onClick={onFlushStream}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#FB923C]/35 bg-[#FB923C]/12 px-2.5 py-1 text-xs font-medium text-[#FDBA74] transition-colors hover:bg-[#FB923C]/22 hover:text-white cursor-pointer"
                        >
                          <FastForward className="h-3.5 w-3.5" />
                          <span>Tampilkan seluruh jawaban sekarang</span>
                        </button>
                      </div>
                    ) : (
                      /* Completed Message Action Bar + Recorded Duration Badge */
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[#94A3B8]">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg)}
                            aria-label="Salin jawaban"
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-[#22D3EE]" />
                                <span className="text-[#22D3EE]">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditingMessage(msg)}
                            aria-label="Edit jawaban"
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          {canSpeak && !msg.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg)}
                              aria-label={
                                speakingId === msg.id
                                  ? 'Hentikan suara'
                                  : 'Bacakan jawaban'
                              }
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <VolumeX className="h-3.5 w-3.5 text-[#FB923C]" />
                                  <span className="text-[#FB923C]">Berhenti</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5" />
                                  <span>Suara</span>
                                </>
                              )}
                            </button>
                          )}

                          {isLastAssistant && !isLoading && (
                            <button
                              type="button"
                              onClick={() => onRegenerate(msg.id)}
                              aria-label="Muat ulang jawaban"
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Ulangi</span>
                            </button>
                          )}

                          {msg.imageUrl && msg.isImageRequest && (
                            <button
                              type="button"
                              onClick={onOpenImageModelPicker}
                              aria-label="Ganti model pembuat gambar"
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#FDBA74] transition-colors hover:bg-[#FB923C]/15 hover:text-white cursor-pointer"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>Ganti Model</span>
                            </button>
                          )}
                        </div>

                        {typeof msg.durationMs === 'number' && msg.durationMs > 0 && (
                          <span
                            title="Total durasi respons dan penulisan"
                            className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.03] px-2 py-0.5 font-mono-code text-[11px] tabular-nums text-[#CBD5E1]"
                          >
                            <Clock className="h-3 w-3 text-[#FB923C]" />
                            <span>{(msg.durationMs / 1000).toFixed(1)} dtk</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        <div ref={bottomAnchorRef} className="h-2" />
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Gulir ke pesan terbaru"
          className="nd-glass-card fixed right-4 bottom-28 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-xl cursor-pointer sm:right-8 sm:bottom-32"
        >
          <ArrowDown className="h-4 w-4 text-[#22D3EE]" />
        </button>
      )}
    </div>
  );
}
