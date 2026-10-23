"use client";

export interface PublicUser {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarColor: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image";
  body: string;
  mediaUrl?: string;
  replyToId?: string;
  createdAt: string;
  readBy: string[];
  deletedFor: string[];
  viaAI?: boolean;
}

export interface ChatSummaryDTO {
  id: string;
  type: "dm" | "group";
  name: string;
  avatarColor: string;
  memberIds: string[];
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
    type: "text" | "image";
    viaAI?: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatDetailDTO extends ChatSummaryDTO {
  aiPersona: string;
  members: PublicUser[];
  lastReadAt: string | null;
}

export interface AISettingsDTO {
  enabled: boolean;
  provider: "gemini" | "custom";
  baseUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  replyDelayMs: number;
  contextMessages: number;
  hasApiKey: boolean;
  apiKeyPreview: string;
  keyFromEnv: boolean;
}

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error || `Terjadi kesalahan (${res.status})`);
  }
  return data as T;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" });
const shortDayFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso)).replace(".", ":");
}

export function formatClock(iso: string): string {
  return timeFmt.format(new Date(iso)).replace(".", ":");
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return formatTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Kemarin";
  if (now.getTime() - date.getTime() < 7 * 864e5) {
    return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);
  }
  return shortDayFmt.format(date);
}

export function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return "Hari ini";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Kemarin";
  if (now.getFullYear() === date.getFullYear()) return dayFmt.format(date);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatLastSeen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return `terakhir dilihat hari ini pukul ${formatClock(iso)}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `terakhir dilihat kemarin pukul ${formatClock(iso)}`;
  return `terakhir dilihat ${shortDayFmt.format(date)} pukul ${formatClock(iso)}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}
