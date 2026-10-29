import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
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
  onSend: (attachmentText?: string, attachmentName?: string, imageMode?: boolean) => void;
  onStop: () => void;
  isLoading: boolean;
  enterToSend: boolean;
  activeModel: AIModelDefinition;
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
    onSend(attachment?.content, attachment?.name, imageMode);
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
    <div className="pb-safe w-full shrink-0 bg-[#080A0F] px-3 pt-1.5 sm:px-6 sm:pt-2">
      <div className="mx-auto w-full max-w-3xl">
        {fileError && (
          <div className="mb-1.5 flex items-center justify-between rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/10 px-3 py-1.5 text-xs text-[#FED7AA]">
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
          className={`rounded-[24px] border bg-[#10141D] px-3 pt-2.5 pb-2 transition-colors focus-within:bg-[#131824] ${
            imageMode
              ? 'border-[#FB923C]/60 focus-within:border-[#FB923C]'
              : 'border-[#1C2433] focus-within:border-[#22D3EE]/60'
          }`}
        >
          {/* Attachment Chip */}
          {attachment && (
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#223047] bg-[#0B0F17] px-2.5 py-1 text-xs text-[#FAFAFA]">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
              <span className="max-w-[200px] truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Hapus lampiran"
                className="ml-0.5 rounded p-0.5 text-[#9BA6B8] hover:text-white cursor-pointer"
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
                : 'Tanya NodataGPT apa saja...'
            }
            className="max-h-[160px] min-h-[26px] w-full resize-none border-0 bg-transparent px-1 py-0.5 text-[15px] leading-relaxed text-[#FAFAFA] placeholder-[#9BA6B8] focus:outline-none sm:text-base"
          />

          {/* Compact Single-Row Gemini Bottom Action Bar (Never wraps on 320px+) */}
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#B6C0D0] transition-colors hover:bg-[#192131] hover:text-white cursor-pointer"
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={onToggleImageMode}
                aria-pressed={imageMode}
                title="Mode Pembuat Gambar AI"
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  imageMode
                    ? 'border-[#FB923C]/60 bg-[#FB923C]/15 text-[#FB923C]'
                    : 'border-[#1C2433] bg-[#0C1018] text-[#B6C0D0] hover:border-[#293548] hover:text-white'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Gambar</span>
              </button>

              <button
                type="button"
                onClick={onOpenModelPicker}
                title="Pilih model AI"
                className="inline-flex h-9 min-w-0 items-center gap-1 rounded-full border border-[#1C2433] bg-[#0C1018] px-2.5 text-xs font-medium text-[#22D3EE] transition-colors hover:border-[#293548] cursor-pointer"
              >
                <span className="max-w-[92px] truncate sm:max-w-[150px]">
                  {imageMode ? '4 Engine Gambar' : activeModel.shortName}
                </span>
                {!imageMode && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9BA6B8]" />}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {speechConstructor && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-label={isListening ? 'Hentikan dikte suara' : 'Dikte suara'}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? 'bg-[#FB923C]/20 text-[#FB923C]'
                      : 'text-[#B6C0D0] hover:bg-[#192131] hover:text-white'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Mic className="h-[18px] w-[18px]" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={triggerSubmit}
                disabled={!isLoading && !canSend}
                aria-label={isLoading ? 'Hentikan respons' : 'Kirim pesan'}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isLoading
                    ? 'bg-[#EA580C] text-white hover:bg-[#F97316] cursor-pointer'
                    : canSend
                      ? imageMode
                        ? 'bg-[#EA580C] text-white hover:bg-[#F97316] cursor-pointer'
                        : 'bg-[#0E7490] text-white hover:bg-[#0891B2] cursor-pointer'
                      : 'bg-[#192131] text-[#64748B] cursor-not-allowed'
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

        <p className="mt-1.5 hidden text-center text-[11px] text-[#9BA6B8] sm:block">
          NodataGPT otomatis mengalihkan ke model sehat jika server utama sibuk.
        </p>
      </div>
    </div>
  );
}
