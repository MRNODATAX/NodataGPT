export type ChatType = "dm" | "group";

/** Jenis konten pesan. `file` mencakup dokumen/arsip, `audio` voice note/lagu. */
export type MessageType = "text" | "image" | "video" | "audio" | "file";

export interface User {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarColor: string;
  passwordHash: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface ChatAI {
  enabled: boolean;
  /** Instruksi persona khusus untuk chat ini (opsional, menimpa persona global). */
  persona?: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  avatarColor: string;
  memberIds: string[];
  createdAt: string;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  ai: ChatAI;
  /** userId -> ISO timestamp kapan terakhir membaca chat */
  lastRead: Record<string, string>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  body: string;
  mediaUrl?: string;
  /** Metadata lampiran (nama asli, ukuran byte, mime) */
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  replyToId?: string;
  createdAt: string;
  readBy: string[];
  deletedFor: string[];
  /** Penanda pesan dihasilkan oleh auto-responder AI */
  viaAI?: boolean;
}

export type AIProvider = "gemini" | "custom";

export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Persona / system prompt default untuk semua chat */
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  /** Jeda "mengetik" sebelum balasan dikirim (ms) */
  replyDelayMs: number;
  /** Batas riwayat pesan yang dikirim sebagai konteks */
  contextMessages: number;
}

export interface DB {
  meta: {
    version: number;
    authSecret: string;
    createdAt: string;
  };
  users: User[];
  chats: Chat[];
  messages: Message[];
  ai: AISettings;
}

export type PublicUserShape = Omit<User, "passwordHash">;
