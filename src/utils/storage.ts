import type { AppSettings, Conversation } from '../types/chat';

const CONVERSATIONS_KEY = 'nodatagpt.conversations.v3';
const ACTIVE_CHAT_KEY = 'nodatagpt.activeChatId.v3';
const SETTINGS_KEY = 'nodatagpt.settings.v3';
const SIDEBAR_COLLAPSED_KEY = 'nodatagpt.sidebarCollapsed.v3';

const LEGACY_PERSONA_DEFAULT =
  'Kamu adalah asisten AI NodataGPT yang cerdas, lugas, dan membantu.';

export const DEFAULT_SETTINGS: AppSettings = {
  selectedModelId: 'auto',
  autoFallback: true,
  starfieldEnabled: true,
  memoryContextEnabled: true,
  enterToSend: true,
  customPersona: '',
  geminiApiKey: '',
  deepseekApiKey: '',
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    // Ignore storage quota errors
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
    return {
      selectedModelId:
        typeof parsed?.selectedModelId === 'string'
          ? parsed.selectedModelId
          : DEFAULT_SETTINGS.selectedModelId,
      autoFallback:
        typeof parsed?.autoFallback === 'boolean'
          ? parsed.autoFallback
          : DEFAULT_SETTINGS.autoFallback,
      starfieldEnabled:
        typeof parsed?.starfieldEnabled === 'boolean'
          ? parsed.starfieldEnabled
          : DEFAULT_SETTINGS.starfieldEnabled,
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
    const label =
      msg.role === 'user'
        ? 'Anda'
        : `NodataGPT${msg.answeredByName ? ` (${msg.answeredByName})` : ''}`;
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
