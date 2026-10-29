import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Menu, Plus, Settings, Shuffle } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatThread } from './components/ChatThread';
import { ChatComposer } from './components/ChatComposer';
import { ModelPickerModal } from './components/ModelPickerModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import {
  generateMultiEngineImage,
  getHealthyModelCount,
  sendMultiModelChat,
  type RouterStatusUpdate,
} from './services/aiRouter';
import { getModelById } from './services/modelCatalog';
import { usePwaInstall } from './hooks/usePwaInstall';
import {
  deriveChatTitle,
  exportConversationMarkdown,
  generateId,
  loadActiveChatId,
  loadConversations,
  loadSettings,
  loadSidebarCollapsed,
  saveActiveChatId,
  saveConversations,
  saveSettings,
  saveSidebarCollapsed,
} from './utils/storage';
import type { AppSettings, ChatMessage, Conversation } from './types/chat';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations()
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') return null;
    }
    return loadActiveChatId();
  });
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    loadSidebarCollapsed()
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const [draft, setDraft] = useState('');
  const [imageMode, setImageMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routerStatus, setRouterStatus] = useState<RouterStatusUpdate | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    canPromptNativeInstall,
    isInstalled,
    isIos,
    isAndroid,
    triggerInstall,
  } = usePwaInstall();

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId) ?? null,
    [conversations, activeChatId]
  );

  const activeModel = useMemo(
    () => getModelById(settings.selectedModelId),
    [settings.selectedModelId]
  );

  const healthyCount = useMemo(() => getHealthyModelCount(), [isLoading, modelPickerOpen]);

  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setRouterStatus(null);
    }
    setActiveChatId(null);
    setDraft('');
    setImageMode(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNewChat]);

  const executePrompt = useCallback(
    async ({
      promptText,
      targetChatId,
      priorMessages,
      attachmentText,
      attachmentName,
      asImage,
    }: {
      promptText: string;
      targetChatId: string;
      priorMessages: ChatMessage[];
      attachmentText?: string;
      attachmentName?: string;
      asImage?: boolean;
    }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);
      setRouterStatus(null);

      const fullPrompt = attachmentText
        ? `${promptText.trim() || 'Analisis berkas berikut:'}\n\n[Berkas: ${attachmentName || 'lampiran'}]\n${attachmentText}`
        : promptText.trim();

      try {
        const result = asImage
          ? await generateMultiEngineImage({
              prompt: fullPrompt,
              signal: controller.signal,
              onStatus: (st) => setRouterStatus(st),
            })
          : await sendMultiModelChat({
              prompt: fullPrompt,
              history: priorMessages,
              settings,
              signal: controller.signal,
              onStatus: (st) => setRouterStatus(st),
            });

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: result.content,
          createdAt: Date.now(),
          answeredById: result.answeredById,
          answeredByName: result.answeredByName,
          usedFallback: result.usedFallback,
          imageUrl: result.imageUrl,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, assistantMsg],
                }
              : c
          )
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const messageText =
          err instanceof Error
            ? err.message
            : 'Terjadi gangguan jaringan saat menghubungi model AI.';

        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: messageText,
          createdAt: Date.now(),
          isError: true,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, errorMsg],
                }
              : c
          )
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
          setRouterStatus(null);
        }
      }
    },
    [settings]
  );

  const handleSend = useCallback(
    async (
      attachmentText?: string,
      attachmentName?: string,
      forceImageMode?: boolean
    ) => {
      const trimmed = draft.trim();
      if ((!trimmed && !attachmentText) || isLoading) return;

      const useImage = forceImageMode ?? imageMode;
      const displayContent = trimmed || `Lampirkan berkas ${attachmentName || ''}`.trim();
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: displayContent,
        createdAt: Date.now(),
        attachmentName,
      };

      setDraft('');
      if (useImage) setImageMode(false);

      let chatId = activeConversation?.id;
      let existingMessages: ChatMessage[] = [];

      if (!chatId) {
        const newChat: Conversation = {
          id: generateId(),
          title: deriveChatTitle(displayContent),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg],
        };
        chatId = newChat.id;
        setConversations((prev) => [newChat, ...prev]);
        setActiveChatId(chatId);
      } else {
        existingMessages = activeConversation?.messages ?? [];
        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMsg],
                }
              : c
          )
        );
      }

      await executePrompt({
        promptText: trimmed,
        targetChatId: chatId,
        priorMessages: existingMessages,
        attachmentText,
        attachmentName,
        asImage: useImage,
      });
    },
    [draft, isLoading, imageMode, activeConversation, executePrompt]
  );

  const handleSelectStarter = useCallback(
    async (starterPrompt: string, starterImageMode?: boolean) => {
      if (isLoading) return;
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: starterPrompt,
        createdAt: Date.now(),
      };
      const newChat: Conversation = {
        id: generateId(),
        title: deriveChatTitle(starterPrompt),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMsg],
      };
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);

      await executePrompt({
        promptText: starterPrompt,
        targetChatId: newChat.id,
        priorMessages: [],
        asImage: Boolean(starterImageMode),
      });
    },
    [isLoading, executePrompt]
  );

  const handleRegenerate = useCallback(
    async (assistantMessageId: string) => {
      if (!activeConversation || isLoading) return;
      const idx = activeConversation.messages.findIndex(
        (m) => m.id === assistantMessageId
      );
      if (idx <= 0) return;

      const precedingUserMsg = [...activeConversation.messages.slice(0, idx)]
        .reverse()
        .find((m) => m.role === 'user');
      if (!precedingUserMsg) return;

      const trimmedMessages = activeConversation.messages.slice(0, idx);
      const historyBeforeUser = trimmedMessages.slice(0, -1);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, updatedAt: Date.now(), messages: trimmedMessages }
            : c
        )
      );

      await executePrompt({
        promptText: precedingUserMsg.content,
        targetChatId: activeConversation.id,
        priorMessages: historyBeforeUser,
      });
    },
    [activeConversation, isLoading, executePrompt]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setRouterStatus(null);
    }
  }, []);

  const handleDeleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    },
    [activeChatId]
  );

  const handleTogglePinChat = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#080A0F] text-[#FAFAFA]">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        isPwaInstalled={isInstalled}
        hasActiveMessages={Boolean(activeConversation?.messages.length)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={(id) => setActiveChatId(id)}
        onDeleteChat={handleDeleteChat}
        onTogglePinChat={handleTogglePinChat}
        onExportActiveChat={() => {
          if (activeConversation) exportConversationMarkdown(activeConversation);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
      />

      {/* Main Gemini Stage */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean Uncluttered Responsive Header (Zero overflow on 320px+ phones) */}
        <header className="pt-safe flex min-h-[56px] shrink-0 items-center justify-between border-b border-[#141B27] bg-[#080A0F]/95 px-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#B6C0D0] transition-colors hover:bg-[#10141D] hover:text-white lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setModelPickerOpen(true)}
              aria-label="Pilih model AI NodataGPT"
              className="inline-flex min-h-[42px] min-w-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-[#10141D] cursor-pointer"
            >
              <img
                src="/logo-transparent.png"
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] shrink-0 object-contain"
              />
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="font-display text-[15px] font-bold tracking-tight sm:text-base">
                  <span className="text-[#22D3EE]">Nodata</span>
                  <span className="text-[#FB923C]">GPT</span>
                </span>
                <span className="max-w-[96px] truncate rounded-md border border-[#1C2433] bg-[#10141D] px-1.5 py-0.5 font-mono-code text-[11px] font-medium text-[#FAFAFA] sm:max-w-[160px]">
                  {activeModel.shortName}
                </span>
                {settings.autoFallback && (
                  <Shuffle
                    aria-label="Auto-Fallback Aktif"
                    className="hidden h-3.5 w-3.5 shrink-0 text-[#FB923C] sm:inline"
                  />
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-[#9BA6B8]" />
              </div>
            </button>
          </div>

          {/* Right Header Controls: Minimal on Mobile, Full on Desktop */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleNewChat}
              aria-label="Mulai percakapan baru"
              title="Percakapan Baru (Ctrl+K)"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#B6C0D0] transition-colors hover:bg-[#10141D] hover:text-white sm:w-auto sm:gap-1.5 sm:border sm:border-[#1C2433] sm:bg-[#10141D] sm:px-3 sm:text-xs sm:font-medium cursor-pointer"
            >
              <Plus className="h-5 w-5 text-[#22D3EE] sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chat Baru</span>
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => setInstallModalOpen(true)}
                aria-label="Pasang aplikasi NodataGPT"
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-[#0E7490] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0891B2] sm:inline-flex cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Pasang APK</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Buka pengaturan"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#B6C0D0] transition-colors hover:bg-[#10141D] hover:text-white sm:flex cursor-pointer"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        {/* Main Conversation Area */}
        <main className="flex min-h-0 flex-1 flex-col">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <WelcomeScreen
                activeModel={activeModel}
                autoFallback={settings.autoFallback}
                healthyCount={healthyCount}
                onSelectStarter={handleSelectStarter}
                onOpenModelPicker={() => setModelPickerOpen(true)}
              />
            </div>
          ) : (
            <ChatThread
              messages={activeConversation.messages}
              isLoading={isLoading}
              routerStatus={routerStatus}
              onRegenerate={handleRegenerate}
            />
          )}

          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            onStop={handleStop}
            isLoading={isLoading}
            enterToSend={settings.enterToSend}
            activeModel={activeModel}
            imageMode={imageMode}
            onToggleImageMode={() => setImageMode((prev) => !prev)}
            onOpenModelPicker={() => setModelPickerOpen(true)}
          />
        </main>
      </div>

      <ModelPickerModal
        isOpen={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        settings={settings}
        onSelectModel={(modelId) =>
          setSettings((prev) => ({ ...prev, selectedModelId: modelId }))
        }
        onToggleAutoFallback={(enabled) =>
          setSettings((prev) => ({ ...prev, autoFallback: enabled }))
        }
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        conversationCount={conversations.length}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={setSettings}
        onClearAllChats={() => {
          setConversations([]);
          setActiveChatId(null);
        }}
      />

      <InstallPwaModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        canPromptNativeInstall={canPromptNativeInstall}
        isIos={isIos}
        isAndroid={isAndroid}
        onTriggerNativeInstall={triggerInstall}
      />
    </div>
  );
}

export default App;
