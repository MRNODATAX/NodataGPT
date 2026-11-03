import type { WaifuProfile } from './waifu';

export type MessageRole = 'user' | 'assistant';

export type AssistantMessageStatus = 'waiting' | 'typing' | 'done' | 'error';

export type RouterPresetId =
  | '9router'
  | 'omniroute'
  | 'zelai'
  | 'openrouter'
  | 'custom';

export interface MediaDownloadItem {
  label: string;
  url: string;
  kind?: 'video' | 'audio' | 'image' | 'file';
}

export interface ToolActionLink {
  label: string;
  url: string;
  kind?: 'maps' | 'whatsapp' | 'verify' | 'external';
}

export interface PreparedChatAttachment {
  kind: 'text' | 'image';
  name: string;
  textContent?: string;
  imagePublicUrl?: string;
  imageDataUrl?: string;
  imageThumbDataUrl?: string;
  imageMimeType?: string;
  imageMeta?: string;
  pendingPublicUrlPromise?: Promise<string | undefined>;
}

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
  videoUrl?: string;
  videoPosterUrl?: string;
  audioUrl?: string;
  audioTitle?: string;
  galleryUrls?: string[];
  galleryDownloadUrls?: string[];
  galleryAspect?: 'square' | 'portrait' | 'landscape';
  downloadItems?: MediaDownloadItem[];
  actionLinks?: ToolActionLink[];
  summarizeTranscript?: string;
  isImageRequest?: boolean;
  waifuExpressionUrl?: string;
  waifuExpressionFileName?: string;
  waifuExpressionLabel?: string;
  waifuExpressionObjectPosition?: string;
  attachmentName?: string;
  attachmentText?: string;
  attachmentImageUrl?: string;
  attachmentImageThumb?: string;
  attachmentImageDataUrl?: string;
  attachmentImageMeta?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  mode?: 'assistant' | 'waifu';
  waifuId?: string;
  waifuProfileSnapshot?: WaifuProfile;
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
  routerEnabled: boolean;
  routerPreset: RouterPresetId;
  routerBaseUrl: string;
  routerApiKey: string;
  routerModel: string;
  routerImageModel: string;
  routerDiscoveredModels: string[];
}

export type ImageModelCategory =
  | 'auto'
  | 'router'
  | 'cepat'
  | 'artistik'
  | 'desain'
  | 'direct';

export type ModelCategory =
  | 'auto'
  | 'router'
  | 'scraper'
  | 'zelai'
  | 'snow'
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
  requiresKey?: 'gemini' | 'deepseek' | 'router';
  accent: 'cyan' | 'orange' | 'dual';
}
