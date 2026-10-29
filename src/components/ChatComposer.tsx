import { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Paperclip,
  SendHorizontal,
  Square,
  X,
} from 'lucide-react';
import type { ChatAttachment, PromptMode } from '../types/chat';

interface ChatComposerProps {
  value: string;
  isGenerating: boolean;
  promptMode: PromptMode;
  contextMemory: boolean;
  attachment: ChatAttachment | null;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onChangeMode: (mode: PromptMode) => void;
  onToggleMemory: () => void;
  onAttachFile: (attachment: ChatAttachment | null) => void;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function ChatComposer({
  value,
  isGenerating,
  promptMode,
  contextMemory,
  attachment,
  onChange,
  onSend,
  onStop,
  onChangeMode,
  onToggleMemory,
  onAttachFile,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const speechSupported = Boolean(getSpeechConstructor());

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 150 * 1024) {
      setFileError('Ukuran file melebihi batas 150 KB untuk lampiran teks.');
      return;
    }

    try {
      const content = await file.text();
      onAttachFile({
        name: file.name,
        content,
        size: file.size,
      });
    } catch {
      setFileError('File tidak dapat dibaca sebagai teks.');
    }
  };

  const toggleVoiceInput = () => {
    const SpeechCtor = getSpeechConstructor();
    if (!SpeechCtor) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechCtor();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        onChange(value ? `${value.trim()} ${transcript.trim()}` : transcript.trim());
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) {
      onStop();
      return;
    }
    if (!value.trim() && !attachment) return;
    onSend();
  };

  const canSend = Boolean(value.trim() || attachment);

  return (
    <footer className="shrink-0 bg-[#09090B] px-3 pt-2 pb-3 pb-safe sm:px-6 sm:pb-4">
      <div className="mx-auto w-full max-w-3xl">
        {fileError && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between rounded-xl border border-[#7F1D1D] bg-[#190D0D] px-3.5 py-2 text-xs text-[#F87171]"
          >
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              aria-label="Tutup peringatan lampiran"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#F87171] hover:bg-[#281414]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-[#26262F] bg-[#121216] px-3.5 pt-2.5 pb-2 transition-all focus-within:border-[#F97316]/80 focus-within:shadow-[0_0_24px_-6px_rgba(249,115,22,0.28)] sm:px-4"
        >
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="wormgpt-prompt"
              className="text-xs font-medium text-[#B4B4BE]"
            >
              Tanya WormGPT
            </label>
            {attachment && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B1B15] bg-[#1B1210] pl-2.5 text-xs text-[#FB923C]">
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                <span className="max-w-[160px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => onAttachFile(null)}
                  aria-label={`Hapus lampiran ${attachment.name}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#B4B4BE] hover:bg-[#271815] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            id="wormgpt-prompt"
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating && canSend) {
                  onSend();
                }
              }
            }}
            placeholder="Ketik pertanyaan, potongan kode, atau instruksi..."
            className="composer-input max-h-[180px] min-h-[36px] w-full resize-none bg-transparent py-1 text-[15px] leading-relaxed text-[#FAFAFA] placeholder:text-[#9E9EA8]"
          />

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1E26] pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={fileInputRef}
                id="wormgpt-file-upload"
                type="file"
                accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.php,.html,.css,.sql,.csv,.yml,.yaml,.sh,.xml,.log"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label
                htmlFor="wormgpt-file-upload"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-[#B4B4BE] transition-colors hover:bg-[#1B1B22] hover:text-[#FAFAFA]"
              >
                <Paperclip className="h-4 w-4 text-[#FB923C]" aria-hidden="true" />
                <span className="hidden sm:inline">Lampirkan</span>
              </label>

              <div className="flex items-center gap-1.5 rounded-xl bg-[#18181F] px-2.5">
                <label
                  htmlFor="wormgpt-mode-select"
                  className="text-xs font-medium text-[#9E9EA8]"
                >
                  Mode:
                </label>
                <select
                  id="wormgpt-mode-select"
                  value={promptMode}
                  onChange={(e) => onChangeMode(e.target.value as PromptMode)}
                  className="min-h-11 bg-transparent py-1 text-xs font-medium text-[#FAFAFA] focus:outline-none"
                >
                  <option value="default" className="bg-[#141419] text-[#FAFAFA]">
                    Standar
                  </option>
                  <option value="code" className="bg-[#141419] text-[#FAFAFA]">
                    Fokus Kode
                  </option>
                  <option value="analysis" className="bg-[#141419] text-[#FAFAFA]">
                    Analisis
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={onToggleMemory}
                aria-pressed={contextMemory}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors ${
                  contextMemory
                    ? 'border border-[#4D2016] bg-[#211310] text-[#FB923C]'
                    : 'text-[#9E9EA8] hover:bg-[#1B1B22] hover:text-[#FAFAFA]'
                }`}
              >
                <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Memori</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-label={isListening ? 'Hentikan dikte suara' : 'Dikte pesan dengan suara'}
                  aria-pressed={isListening}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors ${
                    isListening
                      ? 'bg-[#B91C1C] text-white'
                      : 'text-[#B4B4BE] hover:bg-[#1B1B22] hover:text-[#FAFAFA]'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}

              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Hentikan respons WormGPT"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#B91C1C] text-white transition-colors hover:bg-[#991B1B]"
                >
                  <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Kirim pesan ke WormGPT"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#B91C1C] text-white transition-colors hover:bg-[#C2410C] disabled:bg-[#23232B] disabled:text-[#9E9EA8]"
                >
                  <SendHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="mt-2 text-center text-xs text-[#9E9EA8]">
          WormGPT dapat membuat kesalahan. Periksa kembali kode atau informasi penting.
        </p>
      </div>
    </footer>
  );
}
