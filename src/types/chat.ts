export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isError?: boolean;
  answeredById?: string;
  answeredByName?: string;
  usedFallback?: boolean;
  imageUrl?: string;
  attachmentName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: ChatMessage[];
}

export interface AppSettings {
  selectedModelId: string;
  autoFallback: boolean;
  memoryContextEnabled: boolean;
  enterToSend: boolean;
  customPersona: string;
  geminiApiKey: string;
  deepseekApiKey: string;
}

export type ModelCategory =
  | 'auto'
  | 'utama'
  | 'reasoning'
  | 'bintang'
  | 'khusus'
  | 'resmi';

export interface AIModelDefinition {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  priority: number;
  category: ModelCategory;
  description: string;
  maxPromptChars: number;
  timeoutMs: number;
  requiresKey?: 'gemini' | 'deepseek';
  accent: 'cyan' | 'orange' | 'dual';
}
