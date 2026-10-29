export type MessageRole = 'user' | 'assistant';

export interface ChatAttachment {
  name: string;
  content: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status?: 'streaming' | 'done' | 'error';
  errorDetail?: string;
  feedback?: 'up' | 'down' | null;
  attachmentName?: string;
  durationMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface WormGptSettings {
  apiUrl: string;
  userName: string;
  contextMemory: boolean;
  streamEffect: boolean;
}
