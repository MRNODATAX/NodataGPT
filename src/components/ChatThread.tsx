import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Paperclip,
  Pencil,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatThreadProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  elapsedMs: number;
  onRetryMessage: (assistantMessageId: string) => void;
  onEditUserMessage: (userMessageId: string, updatedText: string) => void;
  onFeedback: (messageId: string, value: 'up' | 'down' | null) => void;
  onFlushStream: () => void;
}

export function ChatThread({
  messages,
  isGenerating,
  elapsedMs,
  onRetryMessage,
  onEditUserMessage,
  onFeedback,
  onFlushStream,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isGenerating]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const plain = text
      .replace(/```[\s\S]*?```/g, ' blok kode. ')
      .replace(/[#*_`>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = 'id-ID';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-7 px-4 pt-4 pb-8 sm:px-6">
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1;

        if (msg.role === 'user') {
          const isEditing = editingUserId === msg.id;

          if (isEditing) {
            return (
              <div key={msg.id} className="ml-auto w-full max-w-2xl">
                <div className="rounded-[18px] border border-[#F97316]/70 bg-[#141419] p-3.5">
                  <label htmlFor={`edit-msg-${msg.id}`} className="mb-1.5 block text-xs font-medium text-[#B4B4BE]">
                    Ubah pesan dan kirim ulang
                  </label>
                  <textarea
                    id={`edit-msg-${msg.id}`}
                    rows={3}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="w-full resize-y rounded-lg bg-[#0C0C10] p-2.5 text-sm text-[#FAFAFA] focus:outline-none"
                  />
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="min-h-11 rounded-xl px-4 text-xs font-medium text-[#B4B4BE] hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!editDraft.trim() || isGenerating}
                      onClick={() => {
                        const trimmed = editDraft.trim();
                        if (!trimmed) return;
                        setEditingUserId(null);
                        onEditUserMessage(msg.id, trimmed);
                      }}
                      className="min-h-11 rounded-xl bg-[#B91C1C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-50"
                    >
                      Kirim Ulang
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <article key={msg.id} className="flex flex-col items-end">
              {msg.attachmentName && (
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[#2C1A16] bg-[#161110] px-2.5 py-1 text-xs text-[#FB923C]">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{msg.attachmentName}</span>
                </div>
              )}

              <div className="max-w-[88%] rounded-[18px] rounded-tr-sm border border-[#3B1B15] bg-[#1D1412] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-[#FAFAFA] sm:max-w-[78%]">
                {msg.content}
              </div>

              <div className="mt-1 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => copyText(msg.id, msg.content)}
                  aria-label="Salin pesan Anda"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
                >
                  {copiedId === msg.id ? (
                    <Check className="h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    setEditingUserId(msg.id);
                    setEditDraft(msg.content);
                  }}
                  aria-label="Ubah dan kirim ulang pesan ini"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA] disabled:opacity-40"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        }

        // Assistant message
        const isWaitingContent = msg.status === 'streaming' && msg.content.length === 0;
        const isStreamingText = msg.status === 'streaming' && msg.content.length > 0;

        return (
          <article key={msg.id} className="flex items-start gap-3 sm:gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2C1814] bg-[#0E0B0B]">
              <img
                src="/logo-transparent.png"
                alt="WormGPT"
                width={22}
                height={22}
                className={`h-[22px] w-[22px] object-contain ${
                  msg.status === 'streaming' ? 'animate-orbital' : ''
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              {isWaitingContent ? (
                <div className="space-y-2.5 pt-1" role="status" aria-live="polite">
                  <div className="flex items-center justify-between text-xs text-[#B4B4BE]">
                    <span>WormGPT sedang menyusun jawaban...</span>
                    <span className="font-mono tabular-nums text-[#FB923C]">
                      {(elapsedMs / 1000).toFixed(1)} dtk
                    </span>
                  </div>
                  <div className="shimmer-bar h-3.5 w-full rounded-md" />
                  <div className="shimmer-bar h-3.5 w-5/6 rounded-md" />
                  <div className="shimmer-bar h-3.5 w-3/5 rounded-md" />
                </div>
              ) : msg.status === 'error' ? (
                <div
                  role="alert"
                  className="rounded-[14px] border border-[#7F1D1D] bg-[#190D0D] p-4"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#F87171]">
                        Respons gagal dimuat
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#FAFAFA]">
                        {msg.errorDetail || 'Terjadi kendala saat menghubungi endpoint API.'}
                      </p>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => onRetryMessage(msg.id)}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#991B1B] disabled:opacity-50"
                      >
                        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Coba Lagi</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <MarkdownRenderer content={msg.content} />

                  {isStreamingText && isLast && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={onFlushStream}
                        className="min-h-11 rounded-lg px-3 text-xs font-medium text-[#FB923C] hover:bg-[#191412]"
                      >
                        Tampilkan seluruh jawaban sekarang
                      </button>
                    </div>
                  )}

                  {msg.status === 'done' && (
                    <div className="mt-2 flex flex-wrap items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => copyText(msg.id, msg.content)}
                        aria-label={copiedId === msg.id ? 'Jawaban tersalin' : 'Salin jawaban'}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-4 w-4 text-[#FB923C]" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => onRetryMessage(msg.id)}
                        aria-label="Buat ulang respons"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA] disabled:opacity-40"
                      >
                        <RotateCw className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {canSpeak && (
                        <button
                          type="button"
                          onClick={() => toggleSpeech(msg.id, msg.content)}
                          aria-label={
                            speakingId === msg.id ? 'Hentikan pembacaan suara' : 'Bacakan jawaban'
                          }
                          aria-pressed={speakingId === msg.id}
                          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#14141A] ${
                            speakingId === msg.id
                              ? 'text-[#FB923C]'
                              : 'text-[#9E9EA8] hover:text-[#FAFAFA]'
                          }`}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Volume2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onFeedback(msg.id, msg.feedback === 'up' ? null : 'up')
                        }
                        aria-label="Tandai jawaban membantu"
                        aria-pressed={msg.feedback === 'up'}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#14141A] ${
                          msg.feedback === 'up'
                            ? 'text-[#FB923C]'
                            : 'text-[#9E9EA8] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onFeedback(msg.id, msg.feedback === 'down' ? null : 'down')
                        }
                        aria-label="Tandai jawaban kurang tepat"
                        aria-pressed={msg.feedback === 'down'}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#14141A] ${
                          msg.feedback === 'down'
                            ? 'text-[#F87171]'
                            : 'text-[#9E9EA8] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {typeof msg.durationMs === 'number' && msg.durationMs > 0 && (
                        <span className="ml-2 font-mono text-xs text-[#9E9EA8]">
                          {(msg.durationMs / 1000).toFixed(1)} dtk
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
