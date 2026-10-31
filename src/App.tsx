import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  Menu,
  Settings,
  Shuffle,
} from 'lucide-react';
import { ToolsIcon } from './components/ToolsIcon';
import { StarfieldBackground } from './components/StarfieldBackground';
import { SplashScreen } from './components/SplashScreen';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatThread } from './components/ChatThread';
import { ChatComposer } from './components/ChatComposer';
import { ModelPickerModal } from './components/ModelPickerModal';
import { ToolsStudioModal } from './components/ToolsStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import {
  generateMultiEngineImage,
  getHealthyModelCount,
  parseImagePromptIntent,
  sendMultiModelChat,
  type RouterStatusUpdate,
} from './services/aiRouter';
import { detectWebToolCommand } from './services/webTools';
import { getImageModelById, getModelById } from './services/modelCatalog';
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
import type {
  AppSettings,
  ChatMessage,
  Conversation,
  MediaDownloadItem,
} from './types/chat';

interface PendingStreamState {
  chatId: string;
  assistantMsgId: string;
  fullContent: string;
  thinkingContent?: string;
  answeredById: string;
  answeredByName: string;
  usedFallback: boolean;
  downloadItems?: MediaDownloadItem[];
  summarizeTranscript?: string;
}

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
  const [modelPickerTab, setModelPickerTab] = useState<'chat' | 'image'>('chat');
  const [toolsStudioOpen, setToolsStudioOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const [draft, setDraft] = useState('');
  const [deepThink, setDeepThink] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [routerStatus, setRouterStatus] = useState<RouterStatusUpdate | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const pendingStreamRef = useRef<PendingStreamState | null>(null);
  const turnStartRef = useRef<number>(0);

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

  // Live seconds ticker (updates every 80ms throughout both waiting and AI typing phases)
  useEffect(() => {
    if (!isLoading) {
      setElapsedMs(0);
      return;
    }
    if (!turnStartRef.current) {
      turnStartRef.current = performance.now();
    }
    const timerId = window.setInterval(() => {
      setElapsedMs(Math.max(0, Math.round(performance.now() - turnStartRef.current)));
    }, 80);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateChatMessages = useCallback(
    (chatId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: updater(c.messages),
              }
            : c
        )
      );
    },
    []
  );

  // Instant reveal ("Tampilkan seluruh jawaban sekarang")
  const handleFlushStream = useCallback(() => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    const pending = pendingStreamRef.current;
    if (pending) {
      const finalDuration = Math.max(
        100,
        Math.round(performance.now() - (turnStartRef.current || performance.now()))
      );
      updateChatMessages(pending.chatId, (msgs) =>
        msgs.map((m) =>
          m.id === pending.assistantMsgId
            ? {
                ...m,
                content: pending.fullContent,
                thinkingContent: pending.thinkingContent,
                answeredById: pending.answeredById,
                answeredByName: pending.answeredByName,
                usedFallback: pending.usedFallback,
                downloadItems: pending.downloadItems,
                summarizeTranscript: pending.summarizeTranscript,
                status: 'done',
                durationMs: finalDuration,
              }
            : m
        )
      );
      pendingStreamRef.current = null;
    }
    turnStartRef.current = 0;
    setIsLoading(false);
    setRouterStatus(null);
  }, [updateChatMessages]);

  const handleStop = useCallback(() => {
    const stopDuration = Math.max(
      100,
      Math.round(performance.now() - (turnStartRef.current || performance.now()))
    );

    // Case 1: Stop while typewriter animation is actively writing characters
    if (streamTimerRef.current !== null || pendingStreamRef.current) {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      const pending = pendingStreamRef.current;
      pendingStreamRef.current = null;

      if (pending) {
        updateChatMessages(pending.chatId, (msgs) =>
          msgs.map((m) => {
            if (m.id !== pending.assistantMsgId) return m;
            if (m.content.trim().length > 0) {
              return {
                ...m,
                status: 'done',
                durationMs: stopDuration,
              };
            }
            return {
              ...m,
              content: 'Permintaan dihentikan oleh pengguna.',
              status: 'error',
              isError: true,
              durationMs: stopDuration,
            };
          })
        );
      }
      turnStartRef.current = 0;
      setIsLoading(false);
      setRouterStatus(null);
      return;
    }

    // Case 2: Stop while still waiting on network response
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (activeChatId) {
      updateChatMessages(activeChatId, (msgs) =>
        msgs.map((m) =>
          m.status === 'waiting'
            ? {
                ...m,
                content: 'Permintaan dihentikan oleh pengguna.',
                status: 'error',
                isError: true,
                durationMs: stopDuration,
              }
            : m
        )
      );
    }

    turnStartRef.current = 0;
    setIsLoading(false);
    setRouterStatus(null);
  }, [activeChatId, updateChatMessages]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId) ?? null,
    [conversations, activeChatId]
  );

  const activeModel = useMemo(
    () => getModelById(settings.selectedModelId, settings),
    [settings]
  );

  const activeImageModel = useMemo(
    () => getImageModelById(settings.selectedImageModelId),
    [settings.selectedImageModelId]
  );

  const openModelPicker = useCallback((tab: 'chat' | 'image' = 'chat') => {
    setModelPickerTab(tab);
    setModelPickerOpen(true);
  }, []);

  const healthyCount = useMemo(
    () => getHealthyModelCount(),
    [isLoading, modelPickerOpen]
  );

  const handleNewChat = useCallback(() => {
    if (pendingStreamRef.current) {
      handleFlushStream();
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      turnStartRef.current = 0;
      setIsLoading(false);
      setRouterStatus(null);
    }
    setActiveChatId(null);
    setDraft('');
    setImageMode(false);
  }, [handleFlushStream]);

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
      assistantMsgId,
      priorMessages,
      attachmentText,
      attachmentName,
      asImage,
      useDeepThink,
    }: {
      promptText: string;
      targetChatId: string;
      assistantMsgId: string;
      priorMessages: ChatMessage[];
      attachmentText?: string;
      attachmentName?: string;
      asImage?: boolean;
      useDeepThink?: boolean;
    }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      turnStartRef.current = performance.now();
      setElapsedMs(0);
      setIsLoading(true);
      setRouterStatus(null);

      const fullPrompt = attachmentText
        ? `${promptText.trim() || 'Analisis berkas berikut:'}\n\n[Berkas: ${attachmentName || 'lampiran'}]\n${attachmentText}`
        : promptText.trim();

      try {
        const result = asImage
          ? await generateMultiEngineImage({
              prompt: fullPrompt,
              selectedImageModelId: settings.selectedImageModelId,
              autoFallback: settings.imageAutoFallback,
              settings,
              signal: controller.signal,
              onStatus: (st) => setRouterStatus(st),
            })
          : await sendMultiModelChat({
              prompt: fullPrompt,
              history: priorMessages,
              settings,
              deepThink: useDeepThink,
              signal: controller.signal,
              onStatus: (st) => setRouterStatus(st),
            });

        abortControllerRef.current = null;
        setRouterStatus(null);

        const reducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const hasRichMedia = Boolean(
          result.imageUrl ||
            result.videoUrl ||
            result.audioUrl ||
            (result.galleryUrls && result.galleryUrls.length > 0)
        );

        const shouldStreamTypewriter =
          settings.streamEffect &&
          !reducedMotion &&
          !hasRichMedia &&
          result.content.length > 20;

        if (!shouldStreamTypewriter) {
          const doneDuration = Math.max(
            100,
            Math.round(performance.now() - turnStartRef.current)
          );
          updateChatMessages(targetChatId, (msgs) =>
            msgs.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: result.content,
                    thinkingContent: result.thinkingContent,
                    answeredById: result.answeredById,
                    answeredByName: result.answeredByName,
                    usedFallback: result.usedFallback,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                    videoPosterUrl: result.videoPosterUrl,
                    audioUrl: result.audioUrl,
                    audioTitle: result.audioTitle,
                    galleryUrls: result.galleryUrls,
                    galleryDownloadUrls: result.galleryDownloadUrls,
                    downloadItems: result.downloadItems,
                    summarizeTranscript: result.summarizeTranscript,
                    status: 'done',
                    isError: false,
                    durationMs: doneDuration,
                  }
                : m
            )
          );
          turnStartRef.current = 0;
          setIsLoading(false);
          return;
        }

        // Start WormGPT-style progressive typewriter animation while keeping live seconds ticking
        pendingStreamRef.current = {
          chatId: targetChatId,
          assistantMsgId,
          fullContent: result.content,
          thinkingContent: result.thinkingContent,
          answeredById: result.answeredById,
          answeredByName: result.answeredByName,
          usedFallback: result.usedFallback,
          downloadItems: result.downloadItems,
          summarizeTranscript: result.summarizeTranscript,
        };

        let cursor = 0;
        const stepSize = Math.max(4, Math.min(28, Math.ceil(result.content.length / 85)));

        streamTimerRef.current = window.setInterval(() => {
          cursor = Math.min(result.content.length, cursor + stepSize);
          const slice = result.content.slice(0, cursor);
          const finished = cursor >= result.content.length;
          const finishDuration = finished
            ? Math.max(100, Math.round(performance.now() - turnStartRef.current))
            : undefined;

          updateChatMessages(targetChatId, (msgs) =>
            msgs.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: slice,
                    thinkingContent: result.thinkingContent,
                    answeredById: result.answeredById,
                    answeredByName: result.answeredByName,
                    usedFallback: result.usedFallback,
                    downloadItems: finished ? result.downloadItems : undefined,
                    summarizeTranscript: finished
                      ? result.summarizeTranscript
                      : undefined,
                    status: finished ? 'done' : 'typing',
                    isError: false,
                    durationMs: finishDuration,
                  }
                : m
            )
          );

          if (finished) {
            if (streamTimerRef.current !== null) {
              window.clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
            pendingStreamRef.current = null;
            turnStartRef.current = 0;
            setIsLoading(false);
          }
        }, 26);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        abortControllerRef.current = null;
        const failDuration = Math.max(
          100,
          Math.round(performance.now() - turnStartRef.current)
        );
        const messageText =
          err instanceof Error
            ? err.message
            : 'Terjadi gangguan jaringan saat menghubungi model AI.';

        updateChatMessages(targetChatId, (msgs) =>
          msgs.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: messageText,
                  status: 'error',
                  isError: true,
                  durationMs: failDuration,
                }
              : m
          )
        );
        turnStartRef.current = 0;
        setIsLoading(false);
        setRouterStatus(null);
      }
    },
    [settings, updateChatMessages]
  );

  const handleSend = useCallback(
    async (attachmentText?: string, attachmentName?: string) => {
      const trimmed = draft.trim();
      if ((!trimmed && !attachmentText) || isLoading) return;

      const isWebTool = Boolean(!attachmentText && detectWebToolCommand(trimmed));
      const intent =
        attachmentText || isWebTool
          ? { isImageIntent: false, cleanPrompt: trimmed }
          : parseImagePromptIntent(trimmed);
      const useImage = !isWebTool && (imageMode || intent.isImageIntent);
      const effectivePrompt = useImage && intent.cleanPrompt ? intent.cleanPrompt : trimmed;
      const useThinking = deepThink && !useImage && !isWebTool;
      const displayContent =
        trimmed || `Lampirkan berkas ${attachmentName || ''}`.trim();

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: displayContent,
        createdAt: Date.now(),
        isImageRequest: useImage,
        attachmentName,
        attachmentText,
      };

      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'waiting',
        isImageRequest: useImage,
        createdAt: Date.now() + 1,
      };

      setDraft('');
      if (imageMode) setImageMode(false);

      let chatId = activeConversation?.id;
      let existingMessages: ChatMessage[] = [];

      if (!chatId) {
        const newChat: Conversation = {
          id: generateId(),
          title: deriveChatTitle(displayContent),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg, assistantPlaceholder],
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
                  messages: [...c.messages, userMsg, assistantPlaceholder],
                }
              : c
          )
        );
      }

      await executePrompt({
        promptText: effectivePrompt,
        targetChatId: chatId,
        assistantMsgId: assistantPlaceholder.id,
        priorMessages: existingMessages,
        attachmentText,
        attachmentName,
        asImage: useImage,
        useDeepThink: useThinking,
      });
    },
    [draft, isLoading, imageMode, deepThink, activeConversation, executePrompt]
  );

  const handleRunDirectCommand = useCallback(
    async (commandText: string) => {
      const clean = commandText.trim();
      if (!clean || isLoading) return;

      const isWebTool = Boolean(detectWebToolCommand(clean));
      const useImage = !isWebTool && parseImagePromptIntent(clean).isImageIntent;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: clean,
        createdAt: Date.now(),
        isImageRequest: useImage,
      };
      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'waiting',
        isImageRequest: useImage,
        createdAt: Date.now() + 1,
      };

      let chatId = activeConversation?.id;
      let existingMessages: ChatMessage[] = [];

      if (!chatId) {
        const newChat: Conversation = {
          id: generateId(),
          title: deriveChatTitle(clean),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg, assistantPlaceholder],
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
                  messages: [...c.messages, userMsg, assistantPlaceholder],
                }
              : c
          )
        );
      }

      await executePrompt({
        promptText: clean,
        targetChatId: chatId,
        assistantMsgId: assistantPlaceholder.id,
        priorMessages: existingMessages,
        asImage: useImage,
        useDeepThink: false,
      });
    },
    [isLoading, activeConversation, executePrompt]
  );

  const handleSelectStarter = useCallback(
    async (
      starterPrompt: string,
      options?: { imageMode?: boolean; deepThink?: boolean }
    ) => {
      if (isLoading) return;
      const isImg = Boolean(options?.imageMode);
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: starterPrompt,
        isImageRequest: isImg,
        createdAt: Date.now(),
      };
      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'waiting',
        isImageRequest: isImg,
        createdAt: Date.now() + 1,
      };
      const newChat: Conversation = {
        id: generateId(),
        title: deriveChatTitle(starterPrompt),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMsg, assistantPlaceholder],
      };
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);

      await executePrompt({
        promptText: starterPrompt,
        targetChatId: newChat.id,
        assistantMsgId: assistantPlaceholder.id,
        priorMessages: [],
        asImage: isImg,
        useDeepThink: Boolean(options?.deepThink),
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

      const targetAssistantMsg = activeConversation.messages[idx];
      const precedingUserMsg = [...activeConversation.messages.slice(0, idx)]
        .reverse()
        .find((m) => m.role === 'user');
      if (!precedingUserMsg) return;

      const intent = parseImagePromptIntent(precedingUserMsg.content);
      const regenerateAsImage = Boolean(
        targetAssistantMsg?.imageUrl ||
          targetAssistantMsg?.isImageRequest ||
          precedingUserMsg.isImageRequest ||
          intent.isImageIntent
      );

      const trimmedMessages = activeConversation.messages.slice(0, idx);
      const historyBeforeUser = trimmedMessages.slice(0, -1);

      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'waiting',
        isImageRequest: regenerateAsImage,
        createdAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...trimmedMessages, assistantPlaceholder],
              }
            : c
        )
      );

      await executePrompt({
        promptText:
          regenerateAsImage && intent.cleanPrompt
            ? intent.cleanPrompt
            : precedingUserMsg.content,
        targetChatId: activeConversation.id,
        assistantMsgId: assistantPlaceholder.id,
        priorMessages: historyBeforeUser,
        attachmentText: precedingUserMsg.attachmentText,
        attachmentName: precedingUserMsg.attachmentName,
        asImage: regenerateAsImage,
        useDeepThink: deepThink && !regenerateAsImage,
      });
    },
    [activeConversation, isLoading, deepThink, executePrompt]
  );

  const handleUpdateMessageContent = useCallback(
    (messageId: string, updatedContent: string) => {
      const trimmed = updatedContent.trim();
      if (!activeConversation || !trimmed) return;

      const idx = activeConversation.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;

      const targetMsg = activeConversation.messages[idx];
      const shouldUpdateTitle = idx === 0 && targetMsg.role === 'user';

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                title: shouldUpdateTitle ? deriveChatTitle(trimmed) : c.title,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        content: trimmed,
                        editedAt: Date.now(),
                      }
                    : m
                ),
              }
            : c
        )
      );
    },
    [activeConversation]
  );

  const handleEditAndResendUserMessage = useCallback(
    async (userMessageId: string, updatedContent: string) => {
      const trimmed = updatedContent.trim();
      if (!activeConversation || !trimmed) return;

      const idx = activeConversation.messages.findIndex((m) => m.id === userMessageId);
      if (idx < 0) return;

      const targetUserMsg = activeConversation.messages[idx];
      if (targetUserMsg.role !== 'user') return;

      // Cancel any running stream or network call before re-running from the edited turn
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      pendingStreamRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      const isWebTool = Boolean(
        !targetUserMsg.attachmentText && detectWebToolCommand(trimmed)
      );
      const intent =
        targetUserMsg.attachmentText || isWebTool
          ? { isImageIntent: false, cleanPrompt: trimmed }
          : parseImagePromptIntent(trimmed);
      const useImage =
        !targetUserMsg.attachmentText &&
        !isWebTool &&
        Boolean(targetUserMsg.isImageRequest || imageMode || intent.isImageIntent);
      const effectivePrompt =
        useImage && intent.cleanPrompt ? intent.cleanPrompt : trimmed;
      const useThinking = deepThink && !useImage && !isWebTool;

      const priorMessages = activeConversation.messages.slice(0, idx);
      const updatedUserMsg: ChatMessage = {
        ...targetUserMsg,
        content: trimmed,
        editedAt: Date.now(),
        isImageRequest: useImage,
      };
      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'waiting',
        isImageRequest: useImage,
        createdAt: Date.now() + 1,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                title: idx === 0 ? deriveChatTitle(trimmed) : c.title,
                updatedAt: Date.now(),
                messages: [...priorMessages, updatedUserMsg, assistantPlaceholder],
              }
            : c
        )
      );

      await executePrompt({
        promptText: effectivePrompt,
        targetChatId: activeConversation.id,
        assistantMsgId: assistantPlaceholder.id,
        priorMessages,
        attachmentText: targetUserMsg.attachmentText,
        attachmentName: targetUserMsg.attachmentName,
        asImage: useImage,
        useDeepThink: useThinking,
      });
    },
    [activeConversation, imageMode, deepThink, executePrompt]
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      if (pendingStreamRef.current?.chatId === id) {
        handleFlushStream();
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    },
    [activeChatId, handleFlushStream]
  );

  const handleTogglePinChat = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-transparent text-[#F8FAFC]">
      {/* Live Starry Night & Shooting Stars Canvas (nodatanime.vercel.app GPU Atlas) */}
      <StarfieldBackground
        enabled={settings.starfieldEnabled}
        splashDone={!showSplash}
      />

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
        onSelectChat={(id) => {
          if (pendingStreamRef.current && pendingStreamRef.current.chatId !== id) {
            handleFlushStream();
          }
          setActiveChatId(id);
        }}
        onDeleteChat={handleDeleteChat}
        onTogglePinChat={handleTogglePinChat}
        onExportActiveChat={() => {
          if (activeConversation) exportConversationMarkdown(activeConversation);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenToolsStudio={() => setToolsStudioOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
      />

      {/* Main Cosmic Stage (z-10 above Starfield) */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col bg-transparent">
        {/* Frosted Glass Top Bar */}
        <header className="nd-glass-topbar pt-safe flex min-h-[56px] shrink-0 items-center justify-between px-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => openModelPicker(imageMode ? 'image' : 'chat')}
              aria-label="Pilih model AI NodataGPT"
              className="inline-flex min-h-[42px] min-w-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
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
                <span
                  className={`max-w-[94px] truncate rounded-md border px-1.5 py-0.5 font-mono-code text-[11px] font-medium sm:max-w-[172px] ${
                    imageMode
                      ? 'border-[#FB923C]/45 bg-[#FB923C]/14 text-[#FED7AA]'
                      : 'border-white/10 bg-white/[0.06] text-[#F8FAFC]'
                  }`}
                >
                  {imageMode
                    ? activeImageModel.shortName
                    : deepThink
                      ? 'DeepThink'
                      : activeModel.shortName}
                </span>
                {(imageMode ? settings.imageAutoFallback : settings.autoFallback) && (
                  <Shuffle
                    aria-label="Auto-Fallback Aktif"
                    className="hidden h-3.5 w-3.5 shrink-0 text-[#FB923C] sm:inline"
                  />
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              </div>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setToolsStudioOpen(true)}
              aria-label="Buka Web Tools Studio"
              title="Web Tools Studio (Downloader, Video AI, Cuaca, Sholat, Kurs, Emas, Crypto & Saham)"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-2.5 text-xs font-semibold text-[#E2E8F0] transition-colors hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/10 hover:text-white sm:px-3 cursor-pointer"
            >
              <ToolsIcon className="h-[18px] w-[18px] shrink-0 text-[#22D3EE] sm:h-4 sm:w-4" />
              <span>Tools</span>
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => setInstallModalOpen(true)}
                aria-label="Pasang aplikasi NodataGPT"
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-[#0E7490] px-3.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.22)] transition-colors hover:bg-[#0891B2] sm:inline-flex cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Pasang APK</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Buka pengaturan"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white sm:flex cursor-pointer"
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
                deepThink={deepThink}
                imageMode={imageMode}
                onToggleDeepThink={() => {
                  setDeepThink((d) => !d);
                  if (imageMode) setImageMode(false);
                }}
                onToggleImageMode={() => {
                  setImageMode((i) => !i);
                  if (deepThink) setDeepThink(false);
                }}
                onSelectModelDirect={(modelId) => {
                  setSettings((prev) => ({ ...prev, selectedModelId: modelId }));
                  setDeepThink(false);
                  setImageMode(false);
                }}
                onSelectStarter={handleSelectStarter}
                onOpenModelPicker={() => openModelPicker(imageMode ? 'image' : 'chat')}
                onOpenToolsStudio={() => setToolsStudioOpen(true)}
              />
            </div>
          ) : (
            <ChatThread
              messages={activeConversation.messages}
              isLoading={isLoading}
              elapsedMs={elapsedMs}
              routerStatus={routerStatus}
              onRegenerate={handleRegenerate}
              onEditMessage={handleUpdateMessageContent}
              onEditAndResendUserMessage={handleEditAndResendUserMessage}
              onFlushStream={handleFlushStream}
              onOpenImageModelPicker={() => openModelPicker('image')}
              onSummarizeTranscript={(transcript) =>
                handleRunDirectCommand(
                  `Tolong buatkan ringkasan eksekutif dan poin-poin inti yang rapi dari transkrip video YouTube berikut:\n\n${transcript}`
                )
              }
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
            activeImageModel={activeImageModel}
            imageAutoFallback={settings.imageAutoFallback}
            deepThink={deepThink}
            onToggleDeepThink={() => {
              setDeepThink((d) => !d);
              if (imageMode) setImageMode(false);
            }}
            imageMode={imageMode}
            onToggleImageMode={() => {
              setImageMode((i) => !i);
              if (deepThink) setDeepThink(false);
            }}
            onOpenModelPicker={() => openModelPicker('chat')}
            onOpenImageModelPicker={() => openModelPicker('image')}
            onOpenToolsStudio={() => setToolsStudioOpen(true)}
          />
        </main>
      </div>

      <ToolsStudioModal
        isOpen={toolsStudioOpen}
        onClose={() => setToolsStudioOpen(false)}
        onRunCommand={handleRunDirectCommand}
        onInsertCommand={(cmd) => setDraft(cmd)}
      />

      <ModelPickerModal
        isOpen={modelPickerOpen}
        initialTab={modelPickerTab}
        onClose={() => setModelPickerOpen(false)}
        settings={settings}
        onSelectModel={(modelId) => {
          setSettings((prev) => ({ ...prev, selectedModelId: modelId }));
          setDeepThink(false);
        }}
        onToggleAutoFallback={(enabled) =>
          setSettings((prev) => ({ ...prev, autoFallback: enabled }))
        }
        onSelectImageModel={(imageModelId) => {
          setSettings((prev) => ({ ...prev, selectedImageModelId: imageModelId }));
          setImageMode(true);
          setDeepThink(false);
        }}
        onToggleImageAutoFallback={(enabled) =>
          setSettings((prev) => ({ ...prev, imageAutoFallback: enabled }))
        }
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        conversationCount={conversations.length}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={setSettings}
        onReplaySplash={() => setShowSplash(true)}
        onClearAllChats={() => {
          if (pendingStreamRef.current) {
            handleFlushStream();
          }
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
