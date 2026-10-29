import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  Check,
  Copy,
  Download,
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
  routerStatus: RouterStatusUpdate | null;
  onRegenerate: (assistantMessageId: string) => void;
}

export function ChatThread({
  messages,
  isLoading,
  routerStatus,
  onRegenerate,
}: ChatThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading, routerStatus?.attempt]);

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
      // Ignore clipboard failures
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
    const plainText = msg.content.replace(/[#*`_~[\]()>-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'id-ID';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto px-3.5 pt-4 pb-5 sm:px-6 sm:pt-6"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-7">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-tr-sm border border-[#1E3144] bg-[#121C26] px-4 py-2.5 text-[#FAFAFA] sm:max-w-[78%] sm:px-4.5 sm:py-3">
                  {msg.attachmentName && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-[#243B52] bg-[#0B121A] px-2.5 py-1 text-xs text-[#22D3EE]">
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

          return (
            <article
              key={msg.id}
              aria-label="Respons NodataGPT"
              className="flex items-start gap-2.5 sm:gap-3.5"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1C2433] bg-black p-1 sm:h-8 sm:w-8">
                <img
                  src="/logo-transparent.png"
                  alt="NodataGPT"
                  width={24}
                  height={24}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                {/* Sender + Model Pill */}
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-xs font-bold tracking-tight">
                    <span className="text-[#22D3EE]">Nodata</span>
                    <span className="text-[#FB923C]">GPT</span>
                  </span>

                  {msg.answeredByName && (
                    <span className="inline-flex items-center rounded-md border border-[#1C2433] bg-[#10141D] px-2 py-0.5 font-mono-code text-[10px] text-[#B6C0D0]">
                      {msg.answeredByName}
                    </span>
                  )}

                  {msg.usedFallback && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#FB923C]/35 bg-[#FB923C]/10 px-2 py-0.5 font-mono-code text-[10px] font-medium text-[#FB923C]">
                      <Shuffle className="h-2.5 w-2.5" />
                      Auto-fallback
                    </span>
                  )}
                </div>

                {msg.isError ? (
                  <div className="rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/10 p-3.5 text-sm text-[#FED7AA]">
                    <div className="mb-1.5 flex items-center gap-2 font-semibold text-[#FB923C]">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Permintaan belum berhasil</span>
                    </div>
                    <p className="m-0 leading-relaxed text-[#FAFAFA]">{msg.content}</p>
                    <button
                      type="button"
                      onClick={() => onRegenerate(msg.id)}
                      className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#FB923C]/50 bg-[#161210] px-3 py-1.5 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#221914] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Coba Lagi dengan Auto-Fallback</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {msg.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-2xl border border-[#1C2433] bg-[#0B0F17]">
                        <img
                          src={msg.imageUrl}
                          alt={msg.content}
                          width={768}
                          height={768}
                          loading="lazy"
                          className="max-h-[420px] w-full object-contain bg-black"
                        />
                        <div className="flex items-center justify-between border-t border-[#1C2433] px-3.5 py-2">
                          <span className="truncate text-xs text-[#9BA6B8]">
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

                    <MarkdownRenderer content={msg.content} />

                    {/* Message Action Bar */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[#9BA6B8]">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg)}
                        aria-label="Salin jawaban"
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#10141D] hover:text-white cursor-pointer"
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
                            speakingId === msg.id ? 'Hentikan suara' : 'Bacakan jawaban'
                          }
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#10141D] hover:text-white cursor-pointer"
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
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#10141D] hover:text-white cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Ulangi</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}

        {/* Live Multi-Model Loading & Fallback Indicator */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 sm:gap-3.5"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#22D3EE]/50 bg-black p-1 sm:h-8 sm:w-8">
              <img
                src="/logo-transparent.png"
                alt="Memproses"
                width={24}
                height={24}
                className="h-full w-full animate-pulse object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                {routerStatus?.isFallback ? (
                  <span className="text-[#FB923C]">
                    {routerStatus.previousFailedModel
                      ? `${routerStatus.previousFailedModel} sibuk, beralih ke ${routerStatus.modelName}...`
                      : `Beralih otomatis ke ${routerStatus.modelName}...`}
                  </span>
                ) : (
                  <span className="text-[#B6C0D0]">
                    Menghubungi{' '}
                    <strong className="text-[#22D3EE]">
                      {routerStatus?.modelName || 'NodataGPT'}
                    </strong>
                    ...
                  </span>
                )}
              </div>
              <div className="h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-[#121824]">
                <div className="animate-shimmer h-full w-24 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#FB923C]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomAnchorRef} className="h-2" />
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Gulir ke pesan terbaru"
          className="fixed right-4 bottom-28 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#293548] bg-[#10141D] text-white shadow-lg transition-colors hover:border-[#22D3EE] cursor-pointer sm:right-8 sm:bottom-32"
        >
          <ArrowDown className="h-4 w-4 text-[#22D3EE]" />
        </button>
      )}
    </div>
  );
}
