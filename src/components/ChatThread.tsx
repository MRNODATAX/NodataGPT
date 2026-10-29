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
  RefreshCw,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import type { RouterStatusUpdate } from '../services/aiRouter';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  elapsedMs: number;
  routerStatus: RouterStatusUpdate | null;
  onRegenerate: (assistantMessageId: string) => void;
  onFlushStream: () => void;
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

export function ChatThread({
  messages,
  isLoading,
  elapsedMs,
  routerStatus,
  onRegenerate,
  onFlushStream,
}: ChatThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const lastMessage = messages[messages.length - 1];
  const lastContentLen = lastMessage?.content?.length ?? 0;

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
            return (
              <div key={msg.id} className="flex justify-end">
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
                </div>
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
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onRegenerate(msg.id)}
                      className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#FB923C]/50 bg-black/50 px-3 py-1.5 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#FB923C]/15 disabled:opacity-45 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Coba Lagi dengan Auto-Fallback</span>
                    </button>
                  </div>
                ) : (
                  /* Phase 2 (Typing Stream) & Phase 3 (Completed Message) */
                  <div className="nd-assistant-surface rounded-2xl px-3.5 py-3 sm:px-4.5 sm:py-3.5">
                    {msg.thinkingContent && (
                      <ThinkingAccordion content={msg.thinkingContent} />
                    )}

                    {msg.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/75">
                        <img
                          src={msg.imageUrl}
                          alt={msg.content}
                          width={768}
                          height={768}
                          loading="lazy"
                          className="max-h-[420px] w-full bg-black object-contain"
                        />
                        <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2">
                          <span className="truncate text-xs text-[#94A3B8]">
                            Hasil Gambar AI
                          </span>
                          <a
                            href={msg.imageUrl}
                            download={`nodatagpt-image-${msg.id.slice(0, 6)}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#0E7490] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0891B2]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Unduh</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <MarkdownRenderer
                      content={msg.content}
                      isStreaming={isTypingContent}
                    />

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
