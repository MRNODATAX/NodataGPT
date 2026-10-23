import type { ChatSummary, ChatDetail } from "./serialize";
import { chatDisplayName, isMember } from "./serialize";
import type { Chat as ChatModel, Message, PublicUserShape } from "./types";

/** Indikator "AI sedang mengetik" (in-memory, cukup untuk satu proses Node). */
const typing = new Map<string, number>();

export function setAITyping(chatId: string, active: boolean): void {
  if (active) typing.set(chatId, Date.now());
  else typing.delete(chatId);
}

export function isAITyping(chatId: string): boolean {
  const at = typing.get(chatId);
  if (!at) return false;
  if (Date.now() - at > 60_000) {
    typing.delete(chatId);
    return false;
  }
  return true;
}

export function visibleMessages(messages: Message[], userId: string): Message[] {
  return messages
    .filter((m) => !m.deletedFor.includes(userId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function toSummary(
  chat: ChatModel,
  messages: Message[],
  users: PublicUserShape[],
  viewerId: string,
): ChatSummary {
  const list = visibleMessages(
    messages.filter((m) => m.chatId === chat.id),
    viewerId,
  );
  const last = list[list.length - 1] ?? null;
  const lastReadAt = chat.lastRead[viewerId];
  const unreadCount = lastReadAt
    ? list.filter((m) => m.senderId !== viewerId && m.createdAt > lastReadAt).length
    : list.filter((m) => m.senderId !== viewerId).length;

  return {
    id: chat.id,
    type: chat.type,
    name: chatDisplayName(chat, users, viewerId),
    avatarColor: chat.type === "dm"
      ? users.find((u) => u.id !== viewerId && chat.memberIds.includes(u.id))?.avatarColor ?? chat.avatarColor
      : chat.avatarColor,
    memberIds: chat.memberIds,
    pinned: chat.pinned,
    muted: chat.muted,
    archived: chat.archived,
    aiEnabled: chat.ai.enabled,
    lastMessage: last
      ? {
          id: last.id,
          body: last.type === "image" ? "📷 Foto" : last.body,
          senderId: last.senderId,
          createdAt: last.createdAt,
          type: last.type,
          viaAI: last.viaAI,
        }
      : null,
    unreadCount,
    updatedAt: last?.createdAt ?? chat.createdAt,
  };
}

export function toDetail(
  chat: ChatModel,
  messages: Message[],
  users: PublicUserShape[],
  viewerId: string,
): ChatDetail {
  const summary = toSummary(chat, messages, users, viewerId);
  return {
    ...summary,
    aiPersona: chat.ai.persona ?? "",
    members: chat.memberIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is PublicUserShape => Boolean(u)),
    lastReadAt: chat.lastRead[viewerId] ?? null,
  };
}

export type { ChatSummary, ChatDetail };
export { isMember };
