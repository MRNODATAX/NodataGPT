import type { Chat, Message, PublicUserShape } from "./types";

/** Bentuk data yang dikirim ke client (tanpa password & secret). */

export interface ChatSummary {
  id: string;
  type: "dm" | "group";
  name: string;
  avatarColor: string;
  memberIds: string[];
  /** Nama + warna anggota (untuk kolase avatar grup) */
  memberAvatars: Array<{ name: string; color: string }>;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  aiEnabled: boolean;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
    type: Message["type"];
    viaAI?: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatDetail extends ChatSummary {
  aiPersona: string;
  members: PublicUserShape[];
  lastReadAt: string | null;
}

export function isMember(chat: Chat, userId: string): boolean {
  return chat.memberIds.includes(userId);
}

export function chatDisplayName(
  chat: Chat,
  users: PublicUserShape[],
  viewerId: string,
): string {
  if (chat.type === "group") return chat.name || "Grup";
  const other = users.find((u) => u.id !== viewerId && chat.memberIds.includes(u.id));
  return other?.name ?? "Tanpa nama";
}
