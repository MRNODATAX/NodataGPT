"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BellOff,
  Bot,
  Check,
  ChevronDown,
  Info,
  Loader2,
  LogOut,
  MessageSquarePlus,
  MoreVertical,
  Pin,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import { NewChatModal } from "./NewChatModal";
import { AISettingsModal } from "./AISettingsModal";
import { ChatInfoPane } from "./ChatInfoPane";
import {
  api,
  formatDateDivider,
  formatListTime,
  isSameDay,
  type AISettingsDTO,
  type ChatDetailDTO,
  type ChatSummaryDTO,
  type MessageDTO,
  type PublicUser,
} from "@/lib/client";

type Filter = "all" | "unread" | "groups" | "archived";

interface Props {
  initialUser: PublicUser;
}

export function ChatApp({ initialUser }: Props) {
  const router = useRouter();
  const [me, setMe] = useState<PublicUser>(initialUser);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [chats, setChats] = useState<ChatSummaryDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatDetailDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettingsDTO | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const stickToBottom = useRef(true);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const loadList = useCallback(async () => {
    try {
      const data = await api<{ chats: ChatSummaryDTO[]; users: PublicUser[]; me: PublicUser }>("/api/chats");
      setChats(data.chats);
      setUsers(data.users);
      setMe(data.me);
    } catch {
      /* diamkan, polling akan mencoba lagi */
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadActive = useCallback(async (id: string, quiet = false) => {
    if (!quiet) setLoadingChat(true);
    try {
      const data = await api<{
        chat: ChatDetailDTO;
        messages: MessageDTO[];
        aiTyping: boolean;
      }>(`/api/chats/${id}`);
      if (activeIdRef.current !== id) return;
      setDetail(data.chat);
      setMessages(data.messages);
      setAiTyping(data.aiTyping);
      if (data.chat.unreadCount > 0) {
        await api(`/api/chats/${id}/read`, { method: "POST" });
        void loadList();
      }
    } catch (error) {
      if (!quiet) notify(error instanceof Error ? error.message : "Gagal memuat chat");
    } finally {
      if (!quiet) setLoadingChat(false);
    }
  }, [loadList, notify]);

  const refreshActive = useCallback(async () => {
    if (activeIdRef.current) await loadActive(activeIdRef.current, true);
    await loadList();
  }, [loadActive, loadList]);

  // muat awal
  useEffect(() => {
    void loadList();
    void api<{ settings: AISettingsDTO }>("/api/settings/ai")
      .then((data) => setAiSettings(data.settings))
      .catch(() => undefined);
  }, [loadList]);

  // polling: chat aktif + daftar chat
  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshActive();
    }, activeId ? 3000 : 6000);
    return () => window.clearInterval(interval);
  }, [activeId, refreshActive]);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (!activeId) {
      setDetail(null);
      setMessages([]);
      setInfoOpen(false);
      setReplyTo(null);
      return;
    }
    stickToBottom.current = true;
    void loadActive(activeId);
    void api(`/api/chats/${activeId}/read`, { method: "POST" })
      .then(() => loadList())
      .catch(() => undefined);
  }, [activeId, loadActive, loadList]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  useEffect(() => {
    if (stickToBottom.current) scrollToBottom(messages.length > 1);
  }, [messages, aiTyping, scrollToBottom]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      stickToBottom.current = distance < 120;
      setShowScrollBtn(distance > 400);
    };
    node.addEventListener("scroll", onScroll);
    return () => node.removeEventListener("scroll", onScroll);
  }, [activeId]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    return chats.filter((chat) => {
      if (filter === "archived" && !chat.archived) return false;
      if (filter !== "archived" && chat.archived) return false;
      if (filter === "unread" && chat.unreadCount === 0) return false;
      if (filter === "groups" && chat.type !== "group") return false;
      if (!term) return true;
      const memberNames = chat.memberIds
        .map((id) => users.find((user) => user.id === id)?.name ?? "")
        .join(" ");
      return (
        chat.name.toLowerCase().includes(term) ||
        memberNames.toLowerCase().includes(term) ||
        (chat.lastMessage?.body ?? "").toLowerCase().includes(term)
      );
    });
  }, [chats, filter, search, users]);

  const userById = useMemo(() => {
    const map = new Map<string, PublicUser>();
    for (const user of users) map.set(user.id, user);
    map.set(me.id, me);
    for (const member of detail?.members ?? []) map.set(member.id, member);
    return map;
  }, [users, me, detail]);

  const messageById = useMemo(() => {
    const map = new Map<string, MessageDTO>();
    for (const message of messages) map.set(message.id, message);
    return map;
  }, [messages]);

  async function sendMessage(payload: { body: string; type: "text" | "image"; mediaUrl?: string }) {
    if (!activeId) return;
    const data = await api<{ message: MessageDTO }>(`/api/chats/${activeId}/messages`, {
      method: "POST",
      body: JSON.stringify({ ...payload, replyToId: replyTo?.id }),
    });
    stickToBottom.current = true;
    setMessages((current) => [...current, data.message]);
    setReplyTo(null);
    setChats((current) =>
      current.map((chat) =>
        chat.id === activeId
          ? {
              ...chat,
              lastMessage: {
                id: data.message.id,
                body: payload.type === "image" ? "📷 Foto" : payload.body,
                senderId: me.id,
                createdAt: data.message.createdAt,
                type: payload.type,
              },
              updatedAt: data.message.createdAt,
            }
          : chat,
      ),
    );
    if (detail?.aiEnabled && aiSettings?.enabled && aiSettings.hasApiKey) {
      setAiTyping(true);
    }
    window.setTimeout(() => void refreshActive(), 1200);
    window.setTimeout(() => void refreshActive(), 3200);
  }

  async function deleteMessage(message: MessageDTO, scope: "me" | "all") {
    try {
      await api(`/api/messages/${message.id}?scope=${scope}`, { method: "DELETE" });
      setMessages((current) => current.filter((item) => item.id !== message.id));
      if (replyTo?.id === message.id) setReplyTo(null);
      notify(scope === "all" ? "Pesan dihapus untuk semua" : "Pesan dihapus untuk kamu");
      void loadList();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus pesan");
    }
  }

  async function patchChat(patch: Record<string, unknown>) {
    if (!activeId) return;
    try {
      const data = await api<{ chat: ChatDetailDTO }>(`/api/chats/${activeId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setDetail(data.chat);
      setChats((current) =>
        current.map((chat) => (chat.id === data.chat.id ? { ...chat, ...data.chat } : chat)),
      );
      void loadList();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal memperbarui chat");
    }
  }

  async function deleteChat() {
    if (!activeId) return;
    try {
      await api(`/api/chats/${activeId}`, { method: "DELETE" });
      setActiveId(null);
      setInfoOpen(false);
      notify("Chat dihapus");
      void loadList();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus chat");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  const grouped = useMemo(() => {
    const pinned = filteredChats.filter((chat) => chat.pinned);
    const others = filteredChats.filter((chat) => !chat.pinned);
    return { pinned, others };
  }, [filteredChats]);

  const activeTypingName =
    detail?.type === "group"
      ? "Vibe AI"
      : detail?.members.find((member) => member.id !== me.id)?.name ?? "AI";

  return (
    <div className={`app-shell ${activeId ? "chat-open" : ""}`}>
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">V</div>
            <div className="brand-text">
              <strong>VibeChat</strong>
              <span>
                {aiSettings?.enabled ? (
                  <span style={{ color: "var(--primary)" }}>● Auto-responder aktif</span>
                ) : (
                  "Auto-responder nonaktif"
                )}
              </span>
            </div>
          </div>

          <button
            className={`icon-btn ${aiSettings?.enabled ? "active" : ""}`}
            onClick={() => setSettingsOpen(true)}
            title="Pengaturan AI"
            aria-label="Pengaturan AI"
          >
            <Bot size={19} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setNewChatOpen(true)}
            title="Chat baru"
            aria-label="Chat baru"
          >
            <MessageSquarePlus size={19} />
          </button>

          <div className="popover-wrap">
            <button
              className="icon-btn"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Profil saya"
              title="Profil saya"
            >
              <Avatar name={me.name} color={me.avatarColor} size={30} />
            </button>
            {profileOpen ? (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 29 }}
                  onClick={() => setProfileOpen(false)}
                />
                <div className="popover" style={{ minWidth: 240, zIndex: 30 }}>
                  <div style={{ padding: "10px 10px 12px" }}>
                    <div style={{ fontWeight: 700 }}>{me.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{me.phone}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{me.about}</div>
                  </div>
                  <hr />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings size={15} /> Pengaturan AI
                  </button>
                  <button className="danger" onClick={() => void logout()}>
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <div className="search-wrap">
          <div className="search-field">
            <Search size={16} />
            <input
              placeholder="Cari chat atau pesan…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="filter-tabs">
          {(
            [
              ["all", "Semua"],
              ["unread", "Belum dibaca"],
              ["groups", "Grup"],
              ["archived", "Arsip"],
            ] as Array<[Filter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              className={`chip ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="chat-list">
          {listLoading ? (
            [0, 1, 2, 3].map((item) => (
              <li key={item} style={{ display: "flex", gap: 12, padding: 10 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 999 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ height: 12, width: "55%" }} />
                  <div className="skeleton" style={{ height: 10, width: "80%" }} />
                </div>
              </li>
            ))
          ) : null}

          {!listLoading && !filteredChats.length ? (
            <li style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              {filter === "archived"
                ? "Belum ada chat diarsipkan."
                : "Tidak ada chat yang cocok. Mulai percakapan baru!"}
            </li>
          ) : null}

          {grouped.pinned.length ? (
            <li className="section-title" style={{ padding: "8px 12px 4px" }}>
              Disematkan
            </li>
          ) : null}
          {grouped.pinned.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeId}
              meId={me.id}
              onClick={() => setActiveId(chat.id)}
            />
          ))}
          {grouped.pinned.length ? (
            <li className="section-title" style={{ padding: "10px 12px 4px" }}>
              Semua chat
            </li>
          ) : null}
          {grouped.others.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeId}
              meId={me.id}
              onClick={() => setActiveId(chat.id)}
            />
          ))}
        </ul>
      </aside>

      <main className="chat-area">
        {!activeId ? (
          <div className="empty-state">
            <div className="empty-card">
              <div className="brand-mark">V</div>
              <h1>Selamat datang di VibeChat</h1>
              <p>
                Pilih chat di samping untuk mulai ngobrol, atau buat percakapan baru dengan teman
                dan grup.
              </p>
              <div className="empty-features">
                <div>
                  <Sparkles size={16} />
                  <span>
                    <strong>Auto-responder AI:</strong> balasan otomatis memakai API key Gemini
                    atau endpoint AI pribadimu.
                  </span>
                </div>
                <div>
                  <Archive size={16} />
                  <span>
                    <strong>Tanpa database:</strong> semua data tersimpan di{" "}
                    <code>data/db.json</code>, mudah dibackup.
                  </span>
                </div>
                <div>
                  <Check size={16} />
                  <span>
                    <strong>Lengkap:</strong> balas pesan, kirim gambar, pin, arsip, dan status
                    dibaca.
                  </span>
                </div>
              </div>
              <button className="btn primary full" onClick={() => setNewChatOpen(true)}>
                <MessageSquarePlus size={17} /> Mulai chat baru
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <button
                className="icon-btn mobile-back"
                onClick={() => setActiveId(null)}
                aria-label="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar name={detail?.name ?? "Chat"} color={detail?.avatarColor ?? "sky"} size={42} />
              <div className="chat-header-info">
                <strong>{detail?.name ?? "Memuat…"}</strong>
                <span>
                  {aiTyping
                    ? `${activeTypingName} sedang mengetik…`
                    : detail?.type === "group"
                      ? detail.members.map((member) => member.name).join(", ")
                      : detail?.members.find((member) => member.id !== me.id)?.about || "online"}
                </span>
              </div>

              {detail?.aiEnabled ? (
                <span className="tag-ai" title="Auto-reply AI aktif di chat ini">
                  <Bot size={11} /> AI
                </span>
              ) : null}

              <button
                className={`icon-btn ${infoOpen ? "active" : ""}`}
                onClick={() => setInfoOpen((open) => !open)}
                aria-label="Info chat"
                title="Info chat"
              >
                <Info size={19} />
              </button>

              <div className="popover-wrap">
                <button
                  className="icon-btn"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Menu chat"
                >
                  <MoreVertical size={19} />
                </button>
                {menuOpen ? (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 29 }}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="popover" style={{ zIndex: 30 }}>
                      <button
                        onClick={() => {
                          void patchChat({ pinned: !detail?.pinned });
                          setMenuOpen(false);
                        }}
                      >
                        <Pin size={15} /> {detail?.pinned ? "Lepas sematan" : "Sematkan chat"}
                      </button>
                      <button
                        onClick={() => {
                          void patchChat({ muted: !detail?.muted });
                          setMenuOpen(false);
                        }}
                      >
                        <BellOff size={15} /> {detail?.muted ? "Aktifkan notifikasi" : "Bisukan"}
                      </button>
                      <button
                        onClick={() => {
                          void patchChat({
                            archived: !detail?.archived,
                            ...(detail?.archived ? {} : { pinned: false }),
                          });
                          setMenuOpen(false);
                        }}
                      >
                        <Archive size={15} /> {detail?.archived ? "Keluarkan dari arsip" : "Arsipkan"}
                      </button>
                      <hr />
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                      >
                        <Settings size={15} /> Pengaturan AI
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          setMenuOpen(false);
                          setInfoOpen(true);
                        }}
                      >
                        <Trash2 size={15} /> Hapus chat…
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </header>

            <div className="messages" ref={messagesRef}>
              {loadingChat && !messages.length ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <Loader2 size={22} className="spin" style={{ color: "var(--muted)" }} />
                </div>
              ) : null}

              {!loadingChat && !messages.length ? (
                <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, margin: "auto" }}>
                  Belum ada pesan. Kirim sapaan pertamamu 👋
                </div>
              ) : null}

              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const newDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
                const replyMessage = message.replyToId ? messageById.get(message.replyToId) : undefined;
                const isMine = message.senderId === me.id;
                const sender = userById.get(message.senderId);
                const isRead = message.readBy.some((id) => id !== me.id);
                return (
                  <div key={message.id} style={{ display: "contents" }}>
                    {newDay ? (
                      <div className="date-divider">{formatDateDivider(message.createdAt)}</div>
                    ) : null}
                    <MessageBubble
                      message={message}
                      sender={sender}
                      isMine={isMine}
                      showSender={!previous || previous.senderId !== message.senderId || newDay}
                      replyMessage={replyMessage}
                      replySender={replyMessage ? userById.get(replyMessage.senderId) : undefined}
                      isRead={isRead}
                      chatType={detail?.type ?? "dm"}
                      onReply={(target) => {
                        setReplyTo(target);
                        stickToBottom.current = true;
                        scrollToBottom();
                      }}
                      onDelete={(target, scope) => void deleteMessage(target, scope)}
                      onOpenImage={(url) => setViewer(url)}
                    />
                  </div>
                );
              })}

              {aiTyping ? (
                <div className="ai-typing-row">
                  <span className="typing-label">
                    <Sparkles size={12} /> {activeTypingName} sedang mengetik
                  </span>
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            {showScrollBtn ? (
              <button
                className="scroll-btn"
                onClick={() => {
                  stickToBottom.current = true;
                  scrollToBottom();
                }}
                aria-label="Ke pesan terbaru"
              >
                <ChevronDown size={20} />
              </button>
            ) : null}

            <Composer
              chatId={activeId}
              replyTo={replyTo}
              replyName={userById.get(replyTo?.senderId ?? "")?.name ?? "pesan"}
              onCancelReply={() => setReplyTo(null)}
              onSend={sendMessage}
            />
          </>
        )}
      </main>

      {infoOpen && detail ? (
        <ChatInfoPane
          chat={detail}
          meId={me.id}
          globalAIEnabled={Boolean(aiSettings?.enabled)}
          onClose={() => setInfoOpen(false)}
          onPatch={patchChat}
          onDelete={deleteChat}
        />
      ) : null}

      {settingsOpen ? (
        <AISettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={(settings) => {
            setAiSettings(settings);
            notify(settings.enabled ? "Auto-responder diaktifkan" : "Pengaturan AI disimpan");
          }}
        />
      ) : null}

      {newChatOpen ? (
        <NewChatModal
          users={users}
          onClose={() => setNewChatOpen(false)}
          onCreated={(chatId) => {
            setNewChatOpen(false);
            setActiveId(chatId);
            void loadList();
          }}
        />
      ) : null}

      {viewer ? (
        <div className="image-viewer" onClick={() => setViewer(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer} alt="Gambar" />
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function ChatListItem({
  chat,
  active,
  meId,
  onClick,
}: {
  chat: ChatSummaryDTO;
  active: boolean;
  meId: string;
  onClick: () => void;
}) {
  const preview = chat.lastMessage
    ? `${chat.lastMessage.viaAI ? "✦ " : ""}${
        chat.lastMessage.senderId === meId ? "Kamu: " : chat.type === "group" ? "" : ""
      }${chat.lastMessage.body}`
    : "Belum ada pesan";

  return (
    <li>
      <button className={`chat-item ${active ? "selected" : ""}`} onClick={onClick}>
        <Avatar name={chat.name} color={chat.avatarColor} size={46} />
        <div className="chat-item-body">
          <div className="chat-item-top">
            <span className="chat-item-name">{chat.name}</span>
            {chat.pinned ? (
              <span className="pin-icon">
                <Pin size={12} />
              </span>
            ) : null}
            {chat.muted ? (
              <span className="mute-icon">
                <BellOff size={12} />
              </span>
            ) : null}
            <span className="chat-item-time">
              {chat.lastMessage ? formatListTime(chat.lastMessage.createdAt) : ""}
            </span>
          </div>
          <div className="chat-item-preview">
            {chat.type === "group" ? <Users size={13} /> : null}
            <span className="text">{preview}</span>
            {chat.aiEnabled ? (
              <span className="tag-ai">
                <Bot size={10} /> AI
              </span>
            ) : null}
            {chat.unreadCount > 0 ? <span className="badge">{chat.unreadCount}</span> : null}
          </div>
        </div>
      </button>
    </li>
  );
}
