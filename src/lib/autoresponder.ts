import { readDB, updateDB } from "./db";
import { callAI, buildSystemPrompt, buildTurns } from "./ai";
import { AI_USER_ID } from "./seed";
import { isAITyping, setAITyping, visibleMessages } from "./chats";
import type { Chat, Message } from "./types";

const pending = new Set<string>();

/**
 * Tentukan siapa yang "berbicara" saat AI membalas.
 * - DM  : lawan bicara (meniru persona teman chat)
 * - Grup: akun sistem Vibe AI
 */
export function aiSpeakerId(chat: Chat, ownerId: string): string {
  if (chat.type === "group") return AI_USER_ID;
  return chat.memberIds.find((id) => id !== ownerId) ?? AI_USER_ID;
}

export interface ReplyTrigger {
  chatId: string;
  ownerId: string;
  messageId: string;
}

/**
 * Jadwalkan auto-reply setelah pesan pengguna tersimpan. Berjalan di latar
 * belakang: UI langsung menampilkan pesan pengguna dan indikator "AI mengetik",
 * lalu pesan balasan muncul pada polling berikutnya.
 */
export function scheduleAutoReply(trigger: ReplyTrigger): void {
  const key = `${trigger.chatId}:${trigger.messageId}`;
  if (pending.has(key)) return;
  pending.add(key);
  void generateReply(trigger).finally(() => pending.delete(key));
}

export async function generateReply({ chatId, ownerId, messageId }: ReplyTrigger): Promise<void> {
  const db = await readDB();
  const chat = db.chats.find((c) => c.id === chatId);
  if (!chat || !chat.memberIds.includes(ownerId)) return;
  if (!db.ai.enabled || !chat.ai.enabled || !db.ai.apiKey) return;

  const history = visibleMessages(
    db.messages.filter((m) => m.chatId === chatId),
    ownerId,
  );
  const last = history[history.length - 1];
  // balas hanya jika pesan terakhir berasal dari pemilik akun
  if (!last || last.id !== messageId || last.senderId !== ownerId) return;

  const speaker = db.users.find((u) => u.id === aiSpeakerId(chat, ownerId));
  if (!speaker) return;

  const delay = Math.max(300, Math.min(db.ai.replyDelayMs ?? 1200, 15_000));
  setAITyping(chatId, true);
  try {
    await sleep(delay);
    const systemPrompt = buildSystemPrompt(db.ai, chat, db, speaker.name);
    const turns = buildTurns(history, speaker.id, db.ai.contextMessages ?? 20);
    const result = await callAI(db.ai, systemPrompt, turns);

    await updateDB((draft) => {
      const target = draft.chats.find((c) => c.id === chatId);
      if (!target || !target.ai.enabled || !draft.ai.enabled) return;
      // hindari balasan ganda untuk pesan yang sama
      const duplicate = draft.messages.some(
        (m) => m.chatId === chatId && m.viaAI && m.replyToId === messageId,
      );
      if (duplicate) return;
      const message: Message = {
        id: crypto.randomUUID(),
        chatId,
        senderId: speaker.id,
        type: "text",
        body: result.text,
        replyToId: messageId,
        createdAt: new Date().toISOString(),
        readBy: [speaker.id],
        deletedFor: [],
        viaAI: true,
      };
      draft.messages.push(message);
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Kesalahan tidak diketahui";
    await updateDB((draft) => {
      if (!draft.chats.some((c) => c.id === chatId)) return;
      draft.messages.push({
        id: crypto.randomUUID(),
        chatId,
        senderId: AI_USER_ID,
        type: "text",
        body: `⚠️ Auto-responder gagal membalas: ${detail}`,
        createdAt: new Date().toISOString(),
        readBy: [AI_USER_ID],
        deletedFor: [],
        viaAI: true,
      });
    });
  } finally {
    setAITyping(chatId, false);
  }
}

export function aiTyping(chatId: string): boolean {
  return isAITyping(chatId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
