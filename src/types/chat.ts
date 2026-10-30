export type MessageRole = 'user' | 'assistant';

export type AssistantMessageStatus = 'waiting' | 'typing' | 'done' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  thinkingContent?: string;
  createdAt: number;
  editedAt?: number;
  status?: AssistantMessageStatus;
  durationMs?: number;
  isError?: boolean;
  answeredById?: string;
  answeredByName?: string;
  usedFallback?: boolean;
  imageUrl?: string;
  isImageRequest?: boolean;
  attachmentName?: string;
  attachmentText?: string;
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
  selectedImageModelId: string;
  imageAutoFallback: boolean;
  starfieldEnabled: boolean;
  streamEffect: boolean;
  memoryContextEnabled: boolean;
  enterToSend: boolean;
  customPersona: string;
  geminiApiKey: string;
  deepseekApiKey: string;
}

export type ImageModelCategory = 'auto' | 'cepat' | 'artistik' | 'desain' | 'direct';

export type ModelCategory =
  | 'auto'
  | 'scraper'
  | 'synox'
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
