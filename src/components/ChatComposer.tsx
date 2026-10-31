import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BrainCircuit,
  ChevronDown,
  Command,
  FileText,
  ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Shuffle,
  Square,
  X,
} from 'lucide-react';
import { ToolsIcon } from './ToolsIcon';
import type { AIModelDefinition } from '../types/chat';
import {
  AI_MODELS,
  IMAGE_ENGINES,
  type ImageModelOption,
} from '../services/modelCatalog';
import {
  RANDOM_IMAGE_COMMAND_MODES,
  WEB_TOOLS_CATALOG,
} from '../services/webTools';

interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (attachmentText?: string, attachmentName?: string) => void;
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
  onOpenToolsStudio: () => void;
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
  onOpenToolsStudio,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);
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

  const canSend = Boolean(value.trim() || attachment);

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
          className={`nd-glass-composer rounded-[26px] px-3.5 pt-2.5 pb-2 cursor-text ${
            imageMode ? 'nd-glass-composer-orange' : ''
          }`}
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
            className="nd-composer-textarea block max-h-[160px] min-h-[26px] w-full resize-none border-0 bg-transparent px-1 py-0.5 text-[15px] leading-relaxed text-[#F8FAFC] caret-[#22D3EE] placeholder-[#94A3B8] focus:ring-0 focus:outline-none focus-visible:outline-none sm:text-base"
          />

          {/* Compact Single-Row Gemini + DeepSeek + Qwen Bottom Bar (Zero Wrapping on 320px+) */}
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
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
                onClick={onOpenToolsStudio}
                title="Buka Web Tools Studio (TikTok, YouTube, Cuaca, Sholat, Kurs, Emas, Crypto & Saham)"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-[#CBD5E1] transition-all hover:border-[#22D3EE]/50 hover:text-white cursor-pointer"
              >
                <ToolsIcon className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
                <span>Tools</span>
              </button>

              <button
                type="button"
                onClick={imageMode ? onOpenImageModelPicker : onOpenModelPicker}
                title={imageMode ? 'Pilih model gambar AI' : 'Pilih model chat AI'}
                className={`hidden h-9 min-w-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors sm:inline-flex cursor-pointer ${
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
          NodataGPT memadukan {AI_MODELS.length - 1} jalur chat & {IMAGE_ENGINES.length} model gambar AI dengan Auto-Fallback otomatis.
        </p>
      </div>
    </div>
  );
}
