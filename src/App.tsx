import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Menu,
  Plus,
  Radio,
  SlidersHorizontal,
  Smartphone,
} from 'lucide-react';
import { ChatComposer } from './components/ChatComposer';
import { ChatThread } from './components/ChatThread';
import { InstallPwaModal } from './components/InstallPwaModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { usePwaInstall } from './hooks/usePwaInstall';
import {
  composePromptQuery,
  DEFAULT_WORMGPT_API,
  fetchWormGptResponse,
} from './services/wormgptApi';
import type {
  ChatAttachment,
  ChatMessage,
  ChatSession,
  WormGptSettings,
} from './types/chat';

const SESSIONS_STORAGE_KEY = 'wormgpt_sessions_v1';
const SETTINGS_STORAGE_KEY = 'wormgpt_settings_v2';

const DEFAULT_SETTINGS: WormGptSettings = {
  apiUrl: DEFAULT_WORMGPT_API,
  userName: 'Sobat',
  contextMemory: false,
  streamEffect: true,
};

function loadInitialSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInitialSettings(): WormGptSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      userName: typeof parsed?.userName === 'string' ? parsed.userName : DEFAULT_SETTINGS.userName,
      contextMemory: Boolean(parsed?.contextMemory),
      streamEffect: parsed?.streamEffect !== false,
      apiUrl:
        typeof parsed?.apiUrl === 'string' && parsed.apiUrl.trim()
          ? parsed.apiUrl.trim()
          : DEFAULT_WORMGPT_API,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function summarizeTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (!oneLine) return 'Percakapan Baru';
  return oneLine.length > 44 ? `${oneLine.slice(0, 44)}...` : oneLine;
}

export function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadInitialSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<WormGptSettings>(() => loadInitialSettings());

  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEndpointInfoOpen, setIsEndpointInfoOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const fullPendingReplyRef = useRef<{
    sessionId: string;
    messageId: string;
    content: string;
    durationMs: number;
  } | null>(null);
  const endpointMenuRef = useRef<HTMLDivElement | null>(null);

  const { canPromptNatively, isStandalone, platform, triggerNativeInstall } = usePwaInstall();

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Ignore quota errors in private browsing
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore quota errors in private browsing
    }
  }, [settings]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setActiveSessionId(null);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isEndpointInfoOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (endpointMenuRef.current && !endpointMenuRef.current.contains(e.target as Node)) {
        setIsEndpointInfoOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEndpointInfoOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isEndpointInfoOpen]);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedMs(0);
      return;
    }
    const started = performance.now();
    const timer = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - started));
    }, 100);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const activeMessages = activeSession ? activeSession.messages : [];

  const updateSessionMessages = useCallback(
    (sessionId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                updatedAt: Date.now(),
                messages: updater(session.messages),
              }
            : session
        )
      );
    },
    []
  );

  const flushStream = useCallback(() => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    const pending = fullPendingReplyRef.current;
    if (pending) {
      updateSessionMessages(pending.sessionId, (msgs) =>
        msgs.map((m) =>
          m.id === pending.messageId
            ? {
                ...m,
                content: pending.content,
                status: 'done',
                durationMs: pending.durationMs,
              }
            : m
        )
      );
      fullPendingReplyRef.current = null;
    }
    setIsGenerating(false);
  }, [updateSessionMessages]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    fullPendingReplyRef.current = null;

    if (activeSessionId) {
      updateSessionMessages(activeSessionId, (msgs) =>
        msgs.map((m) => {
          if (m.status !== 'streaming') return m;
          if (m.content.trim().length > 0) {
            return { ...m, status: 'done' as const };
          }
          return {
            ...m,
            status: 'error' as const,
            errorDetail: 'Permintaan dihentikan oleh pengguna.',
          };
        })
      );
    }
    setIsGenerating(false);
  }, [activeSessionId, updateSessionMessages]);

  const executeAssistantTurn = useCallback(
    async (params: {
      sessionId: string;
      assistantMsgId: string;
      userPrompt: string;
      priorHistory: ChatMessage[];
      attachedFile: ChatAttachment | null;
    }) => {
      const { sessionId, assistantMsgId, userPrompt, priorHistory, attachedFile } = params;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGenerating(true);
      const startedAt = performance.now();

      const fullQuery = composePromptQuery({
        userInput: userPrompt,
        contextMemory: settings.contextMemory,
        history: priorHistory,
        attachment: attachedFile,
      });

      try {
        const replyText = await fetchWormGptResponse({
          prompt: fullQuery,
          apiUrl: settings.apiUrl,
          signal: controller.signal,
        });

        const totalDuration = Math.round(performance.now() - startedAt);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!settings.streamEffect || reducedMotion || replyText.length <= 32) {
          updateSessionMessages(sessionId, (msgs) =>
            msgs.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: replyText,
                    status: 'done',
                    durationMs: totalDuration,
                  }
                : m
            )
          );
          setIsGenerating(false);
          return;
        }

        fullPendingReplyRef.current = {
          sessionId,
          messageId: assistantMsgId,
          content: replyText,
          durationMs: totalDuration,
        };

        let cursor = 0;
        const stepSize = Math.max(14, Math.ceil(replyText.length / 55));

        streamTimerRef.current = window.setInterval(() => {
          cursor = Math.min(replyText.length, cursor + stepSize);
          const slice = replyText.slice(0, cursor);
          const finished = cursor >= replyText.length;

          updateSessionMessages(sessionId, (msgs) =>
            msgs.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: slice,
                    status: finished ? 'done' : 'streaming',
                    durationMs: finished ? totalDuration : undefined,
                  }
                : m
            )
          );

          if (finished) {
            if (streamTimerRef.current !== null) {
              window.clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
            fullPendingReplyRef.current = null;
            setIsGenerating(false);
          }
        }, 24);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memproses jawaban WormGPT.';

        updateSessionMessages(sessionId, (msgs) =>
          msgs.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  status: 'error',
                  errorDetail: message,
                }
              : m
          )
        );
        setIsGenerating(false);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [settings.apiUrl, settings.contextMemory, settings.streamEffect, updateSessionMessages]
  );

  const handleSendMessage = useCallback(
    (overrideText?: string) => {
      if (isGenerating) return;

      const rawPrompt = (overrideText ?? inputText).trim();
      const currentAttachment = overrideText ? null : attachment;
      if (!rawPrompt && !currentAttachment) return;

      const effectivePrompt = rawPrompt || currentAttachment?.name || '';

      const now = Date.now();
      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: effectivePrompt,
        createdAt: now,
        status: 'done',
        attachmentName: currentAttachment?.name,
      };

      const assistantPlaceholder: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        createdAt: now + 1,
        status: 'streaming',
      };

      let targetSessionId = activeSessionId;
      let priorHistory: ChatMessage[] = [];

      if (!targetSessionId) {
        const newSession: ChatSession = {
          id: createId(),
          title: summarizeTitle(effectivePrompt),
          pinned: false,
          createdAt: now,
          updatedAt: now,
          messages: [userMessage, assistantPlaceholder],
        };
        targetSessionId = newSession.id;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      } else {
        const found = sessions.find((s) => s.id === targetSessionId);
        priorHistory = found ? found.messages : [];
        updateSessionMessages(targetSessionId, (msgs) => [
          ...msgs,
          userMessage,
          assistantPlaceholder,
        ]);
      }

      if (!overrideText) {
        setInputText('');
        setAttachment(null);
      }

      void executeAssistantTurn({
        sessionId: targetSessionId,
        assistantMsgId: assistantPlaceholder.id,
        userPrompt: effectivePrompt,
        priorHistory,
        attachedFile: currentAttachment,
      });
    },
    [
      activeSessionId,
      attachment,
      executeAssistantTurn,
      inputText,
      isGenerating,
      sessions,
      updateSessionMessages,
    ]
  );

  const handleRetryMessage = useCallback(
    (assistantMessageId: string) => {
      if (!activeSession || isGenerating) return;
      const idx = activeSession.messages.findIndex((m) => m.id === assistantMessageId);
      if (idx <= 0) return;

      const userTurn = activeSession.messages[idx - 1];
      if (!userTurn || userTurn.role !== 'user') return;

      const priorHistory = activeSession.messages.slice(0, idx - 1);

      updateSessionMessages(activeSession.id, (msgs) =>
        msgs.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: '',
                status: 'streaming',
                errorDetail: undefined,
                durationMs: undefined,
              }
            : m
        )
      );

      void executeAssistantTurn({
        sessionId: activeSession.id,
        assistantMsgId: assistantMessageId,
        userPrompt: userTurn.content,
        priorHistory,
        attachedFile: null,
      });
    },
    [activeSession, executeAssistantTurn, isGenerating, updateSessionMessages]
  );

  const handleEditUserMessage = useCallback(
    (userMessageId: string, updatedText: string) => {
      if (!activeSession || isGenerating) return;
      const idx = activeSession.messages.findIndex((m) => m.id === userMessageId);
      if (idx === -1) return;

      const priorHistory = activeSession.messages.slice(0, idx);
      const now = Date.now();
      const updatedUserMsg: ChatMessage = {
        ...activeSession.messages[idx],
        content: updatedText,
        createdAt: now,
      };
      const freshAssistant: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        createdAt: now + 1,
        status: 'streaming',
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                title: idx === 0 ? summarizeTitle(updatedText) : s.title,
                updatedAt: now,
                messages: [...priorHistory, updatedUserMsg, freshAssistant],
              }
            : s
        )
      );

      void executeAssistantTurn({
        sessionId: activeSession.id,
        assistantMsgId: freshAssistant.id,
        userPrompt: updatedText,
        priorHistory,
        attachedFile: null,
      });
    },
    [activeSession, executeAssistantTurn, isGenerating]
  );

  const handleFeedback = useCallback(
    (messageId: string, value: 'up' | 'down' | null) => {
      if (!activeSessionId) return;
      updateSessionMessages(activeSessionId, (msgs) =>
        msgs.map((m) => (m.id === messageId ? { ...m, feedback: value } : m))
      );
    },
    [activeSessionId, updateSessionMessages]
  );

  const handleNewChat = () => {
    if (isGenerating) {
      stopGeneration();
    }
    setActiveSessionId(null);
    setInputText('');
    setAttachment(null);
  };

  const handleTogglePin = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      if (isGenerating) stopGeneration();
      setActiveSessionId(null);
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleExportActiveChat = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    const lines = [
      `# ${activeSession.title}`,
      '',
      `Diekspor dari WormGPT pada ${new Date().toLocaleString('id-ID')}`,
      '',
      ...activeSession.messages.flatMap((m) => [
        `## ${m.role === 'user' ? 'Pengguna' : 'WormGPT'}`,
        '',
        m.content,
        '',
      ]),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wormgpt-${activeSession.id.slice(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickInstallButton = async () => {
    if (canPromptNatively) {
      const outcome = await triggerNativeInstall();
      if (outcome !== 'accepted') {
        setIsInstallModalOpen(true);
      }
      return;
    }
    setIsInstallModalOpen(true);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isDesktopExpanded={isDesktopExpanded}
        isMobileOpen={isMobileSidebarOpen}
        isStandalone={isStandalone}
        hasActiveMessages={activeMessages.length > 0}
        onToggleDesktop={() => setIsDesktopExpanded((prev) => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectSession={(id) => setActiveSessionId(id)}
        onTogglePin={handleTogglePin}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onExportActiveChat={handleExportActiveChat}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-[#09090B]">
        <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 pt-safe sm:px-5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div ref={endpointMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsEndpointInfoOpen((prev) => !prev)}
                aria-expanded={isEndpointInfoOpen}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-1.5 text-left transition-colors hover:bg-[#14141A]"
              >
                <img
                  src="/logo-transparent.png"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-base font-semibold tracking-tight text-[#FAFAFA] sm:text-lg">
                    Worm<span className="text-[#F97316]">GPT</span>
                  </span>
                  <span className="font-mono text-xs font-medium text-[#FB923C]">
                    Direct API
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-[#9E9EA8]" aria-hidden="true" />
              </button>

              {isEndpointInfoOpen && (
                <div className="absolute top-full left-0 z-30 mt-1.5 w-72 rounded-[14px] border border-[#282832] bg-[#131318] p-3.5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
                    <Radio className="h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />
                    <span>Koneksi WormGPT Murni</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#B4B4BE]">
                    Setiap pesan dikirim 1:1 langsung ke endpoint tanpa tambahan prompt sistem, menjaga karakter asli AI dari API.
                  </p>
                  <div className="mt-2.5 truncate rounded-lg bg-[#0B0B0F] px-2.5 py-1.5 font-mono text-[11px] text-[#FB923C]">
                    {settings.apiUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEndpointInfoOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#3B1B15] bg-[#1A1210] text-xs font-medium text-[#FAFAFA] hover:bg-[#241714]"
                  >
                    Ubah Pengaturan API
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeMessages.length > 0 && (
              <button
                type="button"
                onClick={handleNewChat}
                aria-label="Mulai percakapan baru"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#26262F] bg-[#121216] px-3 text-xs font-medium text-[#FAFAFA] transition-colors hover:border-[#F97316]/50 hover:bg-[#19191F]"
              >
                <Plus className="h-4 w-4 text-[#FB923C]" aria-hidden="true" />
                <span className="hidden sm:inline">Chat Baru</span>
              </button>
            )}

            {!isStandalone && (
              <button
                type="button"
                onClick={handleQuickInstallButton}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#B91C1C] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#C2410C]"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                <span>Pasang APK</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Buka pengaturan aplikasi"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {activeMessages.length === 0 ? (
            <WelcomeScreen
              userName={settings.userName}
              onSelectStarter={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <>
              <h1 className="sr-only">
                {activeSession?.title || 'Percakapan WormGPT'}
              </h1>
              <ChatThread
                messages={activeMessages}
                isGenerating={isGenerating}
                elapsedMs={elapsedMs}
                onRetryMessage={handleRetryMessage}
                onEditUserMessage={handleEditUserMessage}
                onFeedback={handleFeedback}
                onFlushStream={flushStream}
              />
            </>
          )}
        </main>

        <ChatComposer
          value={inputText}
          isGenerating={isGenerating}
          contextMemory={settings.contextMemory}
          attachment={attachment}
          onChange={setInputText}
          onSend={() => handleSendMessage()}
          onStop={stopGeneration}
          onToggleMemory={() =>
            setSettings((prev) => ({ ...prev, contextMemory: !prev.contextMemory }))
          }
          onAttachFile={setAttachment}
        />
      </div>

      <InstallPwaModal
        isOpen={isInstallModalOpen}
        isStandalone={isStandalone}
        canPromptNatively={canPromptNatively}
        platform={platform}
        onClose={() => setIsInstallModalOpen(false)}
        onTriggerNativeInstall={triggerNativeInstall}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        totalSessions={sessions.length}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={setSettings}
        onReplaySplash={() => setShowSplash(true)}
        onClearAllHistory={() => {
          if (isGenerating) stopGeneration();
          setSessions([]);
          setActiveSessionId(null);
        }}
      />
    </div>
  );
}
export default App;
