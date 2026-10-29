import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BrainCircuit,
  ChevronDown,
  FileText,
  ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
import type { AIModelDefinition } from '../types/chat';

interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (attachmentText?: string, attachmentName?: string) => void;
  onStop: () => void;
  isLoading: boolean;
  enterToSend: boolean;
  activeModel: AIModelDefinition;
  deepThink: boolean;
  onToggleDeepThink: () => void;
  imageMode: boolean;
  onToggleImageMode: () => void;
  onOpenModelPicker: () => void;
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
  deepThink,
  onToggleDeepThink,
  imageMode,
  onToggleImageMode,
  onOpenModelPicker,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024) {
      setFileError('Ukuran berkas teks maksimum 150 KB.');
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      setAttachment({ name: file.name, content: text.slice(0, 12000) });
      if (imageMode) onToggleImageMode();
    } catch {
      setFileError('Gagal membaca berkas teks.');
    }
    e.target.value = '';
  };

  const triggerSubmit = () => {
    if (isLoading) {
      onStop();
      return;
    }
    if (!value.trim() && !attachment) return;
    onSend(attachment?.content, attachment?.name);
    setAttachment(null);
    setFileError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 640;
    if (e.key === 'Enter' && !e.shiftKey && enterToSend && !isMobileViewport) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  const canSend = Boolean(value.trim() || attachment);

  return (
    <div className="pb-safe w-full shrink-0 bg-gradient-to-t from-[#03050B]/95 via-[#03050B]/70 to-transparent px-3 pt-1.5 sm:px-6 sm:pt-2">
      <div className="mx-auto w-full max-w-3xl">
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
          className={`nd-glass-composer rounded-[26px] px-3 pt-2.5 pb-2 ${
            imageMode ? 'nd-glass-composer-orange' : ''
          }`}
        >
          {/* Attachment Chip */}
          {attachment && (
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/12 bg-black/50 px-2.5 py-1 text-xs text-[#F8FAFC]">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
              <span className="max-w-[200px] truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Hapus lampiran"
                className="ml-0.5 rounded p-0.5 text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
            placeholder={
              imageMode
                ? 'Deskripsikan gambar AI yang ingin dibuat...'
                : deepThink
                  ? 'Tanyakan masalah kompleks untuk dianalisis DeepThink...'
                  : 'Tanya NodataGPT apa saja...'
            }
            className="max-h-[160px] min-h-[26px] w-full resize-none border-0 bg-transparent px-1.5 py-0.5 text-[15px] leading-relaxed text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none sm:text-base"
          />

          {/* Compact Single-Row Gemini + DeepSeek + Qwen Bottom Bar (Zero Wrapping on 320px+) */}
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.csv,.sql,.sh,.yaml,.yml,.xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Lampirkan berkas teks atau kode"
                title="Lampirkan berkas teks atau kode"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#CBD5E1] transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white cursor-pointer sm:h-9 sm:w-9"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onToggleDeepThink}
                aria-pressed={deepThink}
                title="Mode Penalaran DeepThink"
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all cursor-pointer ${
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
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all cursor-pointer ${
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
                onClick={onOpenModelPicker}
                title="Pilih model AI"
                className="hidden h-9 min-w-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-[#22D3EE] transition-colors hover:border-white/20 sm:inline-flex cursor-pointer"
              >
                <span className="max-w-[140px] truncate">
                  {imageMode
                    ? '4 Engine Gambar'
                    : deepThink
                      ? 'Rantai DeepThink'
                      : activeModel.shortName}
                </span>
                {!imageMode && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {speechConstructor && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-label={isListening ? 'Hentikan dikte suara' : 'Dikte suara'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer sm:h-10 sm:w-10 ${
                    isListening
                      ? 'bg-[#FB923C]/20 text-[#FB923C]'
                      : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
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
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isLoading
                    ? 'bg-[#EA580C] text-white shadow-[0_0_16px_rgba(234,88,12,0.45)] hover:bg-[#F97316] cursor-pointer'
                    : canSend
                      ? imageMode
                        ? 'bg-[#EA580C] text-white shadow-[0_0_16px_rgba(234,88,12,0.4)] hover:bg-[#F97316] cursor-pointer'
                        : 'bg-[#0E7490] text-white shadow-[0_0_18px_rgba(34,211,238,0.32)] hover:bg-[#0891B2] cursor-pointer'
                      : 'bg-white/[0.06] text-[#64748B] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-1.5 hidden text-center text-[11px] text-[#94A3B8] sm:block">
          NodataGPT memadukan 25 jalur model dengan Auto-Fallback otomatis di bawah langit kosmik live.
        </p>
      </div>
    </div>
  );
}
