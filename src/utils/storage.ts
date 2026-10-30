import type {
  AppSettings,
  ChatMessage,
  Conversation,
  RouterPresetId,
} from '../types/chat';

const CONVERSATIONS_KEY = 'nodatagpt.conversations.v3';
const ACTIVE_CHAT_KEY = 'nodatagpt.activeChatId.v3';
const SETTINGS_KEY = 'nodatagpt.settings.v3';
const SIDEBAR_COLLAPSED_KEY = 'nodatagpt.sidebarCollapsed.v3';

const LEGACY_PERSONA_DEFAULT =
  'Kamu adalah asisten AI NodataGPT yang cerdas, lugas, dan membantu.';

const VALID_ROUTER_PRESETS = new Set<RouterPresetId>([
  '9router',
  'omniroute',
  'openrouter',
  'custom',
]);

export const DEFAULT_SETTINGS: AppSettings = {
  selectedModelId: 'auto',
  autoFallback: true,
  selectedImageModelId: 'auto',
  imageAutoFallback: true,
  starfieldEnabled: true,
  streamEffect: true,
  memoryContextEnabled: true,
  enterToSend: true,
  customPersona: '',
  geminiApiKey: '',
  deepseekApiKey: '',
  routerEnabled: false,
  routerPreset: '9router',
  routerBaseUrl: 'https://9router.com/v1',
  routerApiKey: '',
  routerModel: 'auto',
  routerImageModel: '',
  routerDiscoveredModels: [],
};

function sanitizeStoredMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  const cleaned: ChatMessage[] = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== 'object') continue;
    const msg = raw as ChatMessage;
    const hasRichMedia = Boolean(
      msg.imageUrl ||
        msg.videoUrl ||
        msg.audioUrl ||
        (Array.isArray(msg.galleryUrls) && msg.galleryUrls.length > 0)
    );
    if (msg.role === 'assistant' && (msg.status === 'waiting' || msg.status === 'typing')) {
      if ((msg.content || '').trim().length === 0 && !hasRichMedia) {
        continue;
      }
      cleaned.push({ ...msg, status: 'done' });
      continue;
    }
    cleaned.push(msg);
  }

  return cleaned;
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((conv: Conversation) => ({
      ...conv,
      messages: sanitizeStoredMessages(conv?.messages),
    }));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    try {
      let keptInlineImages = 0;
      const compacted: Conversation[] = conversations.map((conv) => ({
        ...conv,
        messages: conv.messages.map((msg) => {
          let nextMsg = msg;
          if (nextMsg.attachmentText && nextMsg.attachmentText.length > 2000) {
            nextMsg = {
              ...nextMsg,
              attachmentText: nextMsg.attachmentText.slice(0, 2000),
            };
          }
          if (nextMsg.imageUrl && nextMsg.imageUrl.startsWith('data:image/')) {
            keptInlineImages += 1;
            if (keptInlineImages > 2) {
              const { imageUrl: _dropped, ...rest } = nextMsg;
              nextMsg = rest;
            }
          }
          if (nextMsg.audioUrl && nextMsg.audioUrl.startsWith('data:audio/')) {
            const { audioUrl: _droppedAudio, ...restAudio } = nextMsg;
            nextMsg = restAudio;
          }
          return nextMsg;
        }),
      }));
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(compacted));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY);
  } catch {
    return null;
  }
}

export function saveActiveChatId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  } catch {
    // Ignore
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const storedRouterKey =
      typeof parsed?.routerApiKey === 'string' ? parsed.routerApiKey : '';
    const trimmedKey = storedRouterKey.trim().replace(/^Bearer\s+/i, '');
    const looksLikeOmniKey =
      /^sk-[a-f0-9]{10,24}-[a-f0-9]{4,10}-[a-f0-9]{6,12}$/i.test(trimmedKey) ||
      /^sk-[a-z0-9]{8}$/i.test(trimmedKey) ||
      /^(?:sk_omni|omniroute_|omni_)/i.test(trimmedKey);

    let resolvedPreset: RouterPresetId = VALID_ROUTER_PRESETS.has(parsed?.routerPreset)
      ? parsed.routerPreset
      : DEFAULT_SETTINGS.routerPreset;
    if (looksLikeOmniKey) {
      resolvedPreset = 'omniroute';
    }

    const rawStoredBase =
      typeof parsed?.routerBaseUrl === 'string' ? parsed.routerBaseUrl.trim() : '';
    let resolvedBaseUrl = rawStoredBase || DEFAULT_SETTINGS.routerBaseUrl;

    if (
      resolvedBaseUrl === 'https://omniroute.dev/v1' ||
      resolvedBaseUrl === 'https://omnirouter.li/v1'
    ) {
      resolvedBaseUrl = 'http://localhost:20128/v1';
    } else if (
      looksLikeOmniKey &&
      resolvedBaseUrl === 'https://9router.com/v1'
    ) {
      resolvedBaseUrl = 'http://localhost:20128/v1';
    } else if (
      !parsed?.routerEnabled &&
      !trimmedKey &&
      resolvedPreset !== 'omniroute' &&
      rawStoredBase === 'http://localhost:20128/v1'
    ) {
      resolvedBaseUrl = DEFAULT_SETTINGS.routerBaseUrl;
    }

    return {
      selectedModelId:
        typeof parsed?.selectedModelId === 'string'
          ? parsed.selectedModelId
          : DEFAULT_SETTINGS.selectedModelId,
      autoFallback:
        typeof parsed?.autoFallback === 'boolean'
          ? parsed.autoFallback
          : DEFAULT_SETTINGS.autoFallback,
      selectedImageModelId:
        typeof parsed?.selectedImageModelId === 'string'
          ? parsed.selectedImageModelId
          : DEFAULT_SETTINGS.selectedImageModelId,
      imageAutoFallback:
        typeof parsed?.imageAutoFallback === 'boolean'
          ? parsed.imageAutoFallback
          : DEFAULT_SETTINGS.imageAutoFallback,
      starfieldEnabled:
        typeof parsed?.starfieldEnabled === 'boolean'
          ? parsed.starfieldEnabled
          : DEFAULT_SETTINGS.starfieldEnabled,
      streamEffect:
        typeof parsed?.streamEffect === 'boolean'
          ? parsed.streamEffect
          : DEFAULT_SETTINGS.streamEffect,
      memoryContextEnabled:
        typeof parsed?.memoryContextEnabled === 'boolean'
          ? parsed.memoryContextEnabled
          : DEFAULT_SETTINGS.memoryContextEnabled,
      enterToSend:
        typeof parsed?.enterToSend === 'boolean'
          ? parsed.enterToSend
          : DEFAULT_SETTINGS.enterToSend,
      customPersona:
        typeof parsed?.customPersona === 'string' &&
        parsed.customPersona !== LEGACY_PERSONA_DEFAULT
          ? parsed.customPersona
          : DEFAULT_SETTINGS.customPersona,
      geminiApiKey: typeof parsed?.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      deepseekApiKey: typeof parsed?.deepseekApiKey === 'string' ? parsed.deepseekApiKey : '',
      routerEnabled:
        typeof parsed?.routerEnabled === 'boolean'
          ? parsed.routerEnabled
          : DEFAULT_SETTINGS.routerEnabled,
      routerPreset: resolvedPreset,
      routerBaseUrl: resolvedBaseUrl,
      routerApiKey: storedRouterKey,
      routerModel:
        typeof parsed?.routerModel === 'string' && parsed.routerModel.trim()
          ? parsed.routerModel.trim()
          : DEFAULT_SETTINGS.routerModel,
      routerImageModel:
        typeof parsed?.routerImageModel === 'string'
          ? parsed.routerImageModel.trim()
          : '',
      routerDiscoveredModels: Array.isArray(parsed?.routerDiscoveredModels)
        ? parsed.routerDiscoveredModels
            .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 500)
        : [],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Ignore
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function deriveChatTitle(firstPrompt: string): string {
  const cleaned = firstPrompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Percakapan Baru';
  return cleaned.length > 44 ? `${cleaned.slice(0, 44)}...` : cleaned;
}

export function exportConversationMarkdown(conversation: Conversation): void {
  const lines: string[] = [
    `# ${conversation.title}`,
    '',
    `Diekspor dari NodataGPT pada ${new Date().toLocaleString('id-ID')}`,
    '',
    '---',
    '',
  ];

  for (const msg of conversation.messages) {
    const durationNote =
      typeof msg.durationMs === 'number' && msg.durationMs > 0
        ? ` · ${(msg.durationMs / 1000).toFixed(1)} dtk`
        : '';
    const label =
      msg.role === 'user'
        ? 'Anda'
        : `NodataGPT${msg.answeredByName ? ` (${msg.answeredByName}${durationNote})` : durationNote}`;
    lines.push(`### ${label}`);
    lines.push('');
    lines.push(msg.content);
    if (msg.imageUrl && msg.imageUrl.startsWith('http')) {
      lines.push('');
      lines.push(`![Gambar AI](${msg.imageUrl})`);
    }
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = conversation.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  link.href = url;
  link.download = `nodatagpt-${safeName || 'chat'}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
