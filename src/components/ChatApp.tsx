"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BellOff,
  Bot,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Info,
  Loader2,
  Lock,
  LogOut,
  MessageSquarePlus,
  Mic,
  Moon,
  MoreVertical,
  Pin,
  Radio,
  Search,
  Settings,
  Smile,
  Sparkles,
  Sun,
  Trash2,
  Users,
  UsersRound,
  X,
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
  formatLastSeen,
  formatListTime,
  isSameDay,
  type AISettingsDTO,
  type ChatDetailDTO,
  type ChatSummaryDTO,
  type MessageDTO,
  type PublicUser,
} from "@/lib/client";

type Filter = "all" | "unread" | "groups" | "archived";
type View = "chats" | "status" | "channels";
type Theme = "light" | "dark";

interface Props {
  initialUser: PublicUser;
}

const FILTERS: Array<[Filter, string]> = [
  ["all", "Semua"],
  ["unread", "Belum dibaca"],
  ["groups", "Grup"],
  ["archived", "Arsip"],
];

export function ChatApp({ initialUser }: Props) {
  const router = useRouter();

  const [me, setMe] = useState<PublicUser>(initialUser);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [chats, setChats] = useState<ChatSummaryDTO[]>([]);
  const [view, setView] = useState<View>("chats");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatDetailDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettingsDTO | null>(null);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [convMenuOpen, setConvMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const stickToBottom = useRef(true);
  const hitIndexRef = useRef(0);

  /* ------------------------------- theme -------------------------------- */
  useEffect(() => {
    const stored = window.localStorage.getItem("vibechat-theme") as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem("vibechat-theme", next);
      return next;
    });
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  /* -------------------------------- data -------------------------------- */
  const loadList = useCallback(async () => {
    try {
      const data = await api<{ chats: ChatSummaryDTO[]; users: PublicUser[]; me: PublicUser }>(
        "/api/chats",
      );
      setChats(data.chats);
      setUsers(data.users);
      setMe(data.me);
    } catch {
      /* polling akan mencoba lagi */
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadActive = useCallback(
    async (id: string, quiet = false) => {
      if (!quiet) setLoadingChat(true);
      try {
        const data = await api<{ chat: ChatDetailDTO; messages: MessageDTO[]; aiTyping: boolean }>(
          `/api/chats/${id}`,
        );
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
    },
    [loadList, notify],
  );

  const refreshActive = useCallback(async () => {
    if (activeIdRef.current) await loadActive(activeIdRef.current, true);
    await loadList();
  }, [loadActive, loadList]);

  useEffect(() => {
    void loadList();
    void api<{ settings: AISettingsDTO }>("/api/settings/ai")
      .then((data) => setAiSettings(data.settings))
      .catch(() => undefined);
  }, [loadList]);

  useEffect(() => {
    const interval = window.setInterval(() => void refreshActive(), activeId ? 3000 : 6000);
    return () => window.clearInterval(interval);
  }, [activeId, refreshActive]);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (!activeId) {
      setDetail(null);
      setMessages([]);
      setInfoOpen(false);
      setReplyTo(null);
      setSearchOpen(false);
      setThreadSearch("");
      return;
    }
    stickToBottom.current = true;
    setSearchOpen(false);
    setThreadSearch("");
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
    const node = threadRef.current;
    if (!node) return;
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      stickToBottom.current = distance < 140;
      setShowScrollBtn(distance > 480);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [activeId]);

  /* ------------------------------ derived ------------------------------- */
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

  const pinnedChats = filteredChats.filter((chat) => chat.pinned);
  const otherChats = filteredChats.filter((chat) => !chat.pinned);
  const archivedCount = chats.filter((chat) => chat.archived).length;
  const totalUnread = chats
    .filter((chat) => !chat.archived && !chat.muted)
    .reduce((sum, chat) => sum + chat.unreadCount, 0);

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

  const searchHits = useMemo(() => {
    const term = threadSearch.trim().toLowerCase();
    if (!term) return [] as string[];
    return messages.filter((message) => message.body.toLowerCase().includes(term)).map((m) => m.id);
  }, [messages, threadSearch]);

  const otherMember =
    detail?.type === "dm" ? detail.members.find((member) => member.id !== me.id) : undefined;

  const chatSubtitle = useMemo(() => {
    if (!detail) return "";
    if (detail.type === "group") {
      return detail.members.map((member) => member.name).join(", ");
    }
    if (otherMember?.isSystem) return "asisten AI VibeChat · membalas otomatis";
    const lastFromOther = [...messages].reverse().find((message) => message.senderId === otherMember?.id);
    if (!lastFromOther) return otherMember?.about || "ketuk untuk info kontak";
    const diff = Date.now() - new Date(lastFromOther.createdAt).getTime();
    if (diff < 5 * 60_000) return "online";
    return formatLastSeen(lastFromOther.createdAt);
  }, [detail, messages, otherMember]);

  /* ------------------------------ actions ------------------------------- */
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
    if (detail?.aiEnabled && aiSettings?.enabled && aiSettings.hasApiKey) setAiTyping(true);
    window.setTimeout(() => void refreshActive(), 1200);
    window.setTimeout(() => void refreshActive(), 3400);
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
      setChats((current) => current.map((chat) => (chat.id === data.chat.id ? { ...chat, ...data.chat } : chat)));
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

  function jumpTo(messageId: string) {
    const node = document.getElementById(`msg-${messageId}`);
    if (!node) return;
    stickToBottom.current = false;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("flash");
    window.setTimeout(() => node.classList.remove("flash"), 1400);
  }

  function runSearch(query: string) {
    setThreadSearch(query);
    hitIndexRef.current = 0;
  }

  function nextHit(direction: 1 | -1) {
    if (!searchHits.length) return;
    const next = (hitIndexRef.current + direction + searchHits.length) % searchHits.length;
    hitIndexRef.current = next;
    jumpTo(searchHits[next]);
  }

  /* ------------------------------- render ------------------------------- */
  return (
    <div className="wa-stage">
      <div className={`wa-app ${activeId ? "has-chat" : ""}`}>
        {/* ------------------------- navigation rail ------------------------- */}
        <nav className="wa-rail" aria-label="Navigasi utama">
          <div className="wa-rail-logo" title="VibeChat">
            V
          </div>

          <button
            className={`wa-rail-btn ${view === "chats" ? "active" : ""}`}
            onClick={() => setView("chats")}
            aria-label="Obrolan"
          >
            <MessageSquarePlus size={21} />
            {totalUnread > 0 ? <span className="rail-badge">{totalUnread > 99 ? "99+" : totalUnread}</span> : null}
            <span className="wa-rail-tip">Obrolan</span>
          </button>

          <button
            className={`wa-rail-btn ${view === "status" ? "active" : ""}`}
            onClick={() => setView("status")}
            aria-label="Status"
          >
            <Radio size={21} />
            <span className="wa-rail-tip">Status</span>
          </button>

          <button
            className={`wa-rail-btn ${view === "channels" ? "active" : ""}`}
            onClick={() => setView("channels")}
            aria-label="Saluran"
          >
            <UsersRound size={21} />
            <span className="wa-rail-tip">Saluran</span>
          </button>

          <button
            className={`wa-rail-btn ${aiSettings?.enabled ? "active" : ""}`}
            onClick={() => setSettingsOpen(true)}
            aria-label="Asisten AI"
          >
            <Sparkles size={21} />
            <span className="wa-rail-tip">
              Asisten AI {aiSettings?.enabled ? "(aktif)" : "(nonaktif)"}
            </span>
          </button>

          <button className="wa-rail-btn" onClick={() => setFilter("archived")} aria-label="Arsip">
            <Archive size={21} />
            <span className="wa-rail-tip">Arsip</span>
          </button>

          <div className="wa-rail-spacer" />

          <button className="wa-rail-btn" onClick={toggleTheme} aria-label="Ganti tema">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            <span className="wa-rail-tip">Mode {theme === "dark" ? "terang" : "gelap"}</span>
          </button>

          <button
            className="wa-rail-btn"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-label="Profil"
          >
            <Avatar name={me.name} color={me.avatarColor} size={28} />
            <span className="wa-rail-tip">{me.name}</span>
          </button>
          {profileMenuOpen ? (
            <>
              <div className="menu-backdrop" onClick={() => setProfileMenuOpen(false)} />
              <div className="wa-menu" style={{ right: "auto", left: 70, bottom: 12, top: "auto" }}>
                <div className="menu-head">
                  <Avatar name={me.name} color={me.avatarColor} size={38} />
                  <div>
                    <strong>{me.name}</strong>
                    <span>{me.phone}</span>
                  </div>
                </div>
                <hr />
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  <Settings size={16} /> Pengaturan AI
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    toggleTheme();
                  }}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Mode{" "}
                  {theme === "dark" ? "terang" : "gelap"}
                </button>
                <hr />
                <button className="danger" onClick={() => void logout()}>
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </>
          ) : null}
        </nav>

        {/* ---------------------------- sidebar ----------------------------- */}
        {view === "chats" ? (
          <aside className="wa-sidebar">
            <header className="wa-sidebar-header">
              <h1 className="wa-sidebar-title">
                Obrolan
                {aiSettings?.enabled ? (
                  <small>
                    <Bot size={11} /> AI aktif
                  </small>
                ) : null}
              </h1>

              <button
                className="wa-icon-btn"
                onClick={() => setSettingsOpen(true)}
                aria-label="Pengaturan asisten AI"
                title="Asisten AI"
              >
                <Bot size={20} />
              </button>

              <button
                className="wa-icon-btn"
                onClick={() => setFilter("archived")}
                aria-label="Chat diarsipkan"
                title="Diarsipkan"
              >
                <Archive size={20} />
              </button>

              <button
                className="wa-icon-btn"
                onClick={() => setNewChatOpen(true)}
                aria-label="Obrolan baru"
                title="Obrolan baru"
              >
                <MessageSquarePlus size={20} />
              </button>

              <div className="wa-menu-wrap">
                <button
                  className="wa-icon-btn"
                  onClick={() => setListMenuOpen((open) => !open)}
                  aria-label="Menu"
                >
                  <MoreVertical size={20} />
                </button>
                {listMenuOpen ? (
                  <>
                    <div className="menu-backdrop" onClick={() => setListMenuOpen(false)} />
                    <div className="wa-menu">
                      <button
                        onClick={() => {
                          setListMenuOpen(false);
                          setNewChatOpen(true);
                        }}
                      >
                        <Users size={16} /> Grup baru
                      </button>
                      <button
                        onClick={() => {
                          setListMenuOpen(false);
                          setFilter("archived");
                        }}
                      >
                        <Archive size={16} /> Chat diarsipkan
                      </button>
                      <button
                        onClick={() => {
                          setListMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                      >
                        <Bot size={16} /> Pengaturan AI
                      </button>
                      <button onClick={toggleTheme}>
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Mode{" "}
                        {theme === "dark" ? "terang" : "gelap"}
                      </button>
                      <hr />
                      <button className="danger" onClick={() => void logout()}>
                        <LogOut size={16} /> Keluar
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </header>

            <div className="wa-search">
              <label className="wa-search-field">
                <Search size={17} />
                <input
                  placeholder="Cari atau mulai chat baru"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Cari chat"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Bersihkan pencarian"
                    className="wa-icon-btn"
                    style={{ width: 26, height: 26 }}
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </label>
            </div>

            <div className="wa-filters">
              {FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  className={`wa-chip ${filter === value ? "active" : ""}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filter !== "archived" && archivedCount > 0 ? (
              <button className="wa-archive-row" onClick={() => setFilter("archived")}>
                <Archive size={19} />
                <span style={{ fontSize: 14.5 }}>Diarsipkan</span>
                <span className="count">{archivedCount}</span>
              </button>
            ) : null}

            <ul className="wa-list">
              {listLoading
                ? [0, 1, 2, 3, 4].map((item) => (
                    <li key={item} style={{ display: "flex", gap: 13, padding: "12px 12px", height: 72 }}>
                      <div className="skeleton" style={{ width: 49, height: 49, borderRadius: 999 }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
                        <div className="skeleton" style={{ height: 12, width: "55%" }} />
                        <div className="skeleton" style={{ height: 10, width: "85%" }} />
                      </div>
                    </li>
                  ))
                : null}

              {!listLoading && !filteredChats.length ? (
                <li className="wa-list-hint">
                  {filter === "archived"
                    ? "Belum ada chat diarsipkan."
                    : search
                      ? `Tidak ada hasil untuk “${search}”.`
                      : "Belum ada obrolan. Mulai percakapan baru dari tombol di atas."}
                </li>
              ) : null}

              {pinnedChats.length ? <li className="wa-section-label">Disematkan</li> : null}
              {pinnedChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  meId={me.id}
                  active={chat.id === activeId}
                  onClick={() => {
                    setView("chats");
                    setActiveId(chat.id);
                  }}
                />
              ))}

              {pinnedChats.length && otherChats.length ? (
                <li className="wa-section-label">Semua obrolan</li>
              ) : null}
              {otherChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  meId={me.id}
                  active={chat.id === activeId}
                  onClick={() => {
                    setView("chats");
                    setActiveId(chat.id);
                  }}
                />
              ))}
            </ul>
          </aside>
        ) : null}

        {/* --------------------------- main pane ---------------------------- */}
        {view !== "chats" ? (
          <section className="wa-placeholder">
            <div className="ic">{view === "status" ? <Radio size={30} /> : <UsersRound size={30} />}</div>
            <h2>{view === "status" ? "Status" : "Saluran"}</h2>
            <p>
              {view === "status"
                ? "Pembaruan status (24 jam) belum aktif di versi ini. Fokus VibeChat ada pada obrolan dan auto-responder AI."
                : "Saluran siaran belum aktif di versi ini. Kamu tetap bisa membuat grup tak terbatas dari daftar obrolan."}
            </p>
            <button className="btn primary" onClick={() => setView("chats")}>
              <ArrowLeft size={16} /> Kembali ke obrolan
            </button>
          </section>
        ) : activeId ? (
          <section className="wa-conv">
            <header className="wa-conv-header">
              <button
                className="wa-icon-btn mobile-only"
                onClick={() => setActiveId(null)}
                aria-label="Kembali"
              >
                <ArrowLeft size={22} />
              </button>

              <button
                className="wa-icon-btn"
                onClick={() => setInfoOpen(true)}
                aria-label="Info kontak"
                style={{ width: 44, height: 44 }}
              >
                <Avatar
                  name={detail?.name ?? "Chat"}
                  color={detail?.avatarColor ?? "sky"}
                  size={40}
                  members={detail?.type === "group" ? detail.memberAvatars : undefined}
                />
              </button>

              <div className="wa-conv-info">
                <div className="wa-conv-name">
                  <span>{detail?.name ?? "Memuat…"}</span>
                  {detail?.aiEnabled ? (
                    <span className="wa-tag-ai" title="Auto-responder aktif di chat ini">
                      <Bot size={9} /> AI
                    </span>
                  ) : null}
                  {detail?.pinned ? <Pin size={12} style={{ color: "var(--text-3)" }} /> : null}
                  {detail?.muted ? <BellOff size={12} style={{ color: "var(--text-3)" }} /> : null}
                </div>
                <div className={`wa-conv-sub ${aiTyping ? "typing" : ""}`}>
                  {aiTyping
                    ? `${detail?.type === "group" ? "Vibe AI" : otherMember?.name ?? "Kontak"} sedang mengetik…`
                    : chatSubtitle}
                </div>
              </div>

              <div className="wa-conv-actions">
                <button
                  className={`wa-icon-btn ${searchOpen ? "active" : ""}`}
                  onClick={() => {
                    setSearchOpen((open) => !open);
                    setThreadSearch("");
                  }}
                  aria-label="Cari pesan"
                  title="Cari pesan"
                >
                  <Search size={19} />
                </button>
                <button
                  className="wa-icon-btn desktop-only"
                  onClick={() => {
                    notify("Panggilan suara segera hadir");
                  }}
                  aria-label="Panggilan"
                  title="Panggilan"
                >
                  <Mic size={19} />
                </button>
                <button
                  className={`wa-icon-btn ${infoOpen ? "active" : ""}`}
                  onClick={() => setInfoOpen((open) => !open)}
                  aria-label="Info chat"
                  title="Info chat"
                >
                  <Info size={19} />
                </button>

                <div className="wa-menu-wrap">
                  <button
                    className="wa-icon-btn"
                    onClick={() => setConvMenuOpen((open) => !open)}
                    aria-label="Menu chat"
                  >
                    <MoreVertical size={19} />
                  </button>
                  {convMenuOpen ? (
                    <>
                      <div className="menu-backdrop" onClick={() => setConvMenuOpen(false)} />
                      <div className="wa-menu">
                        <button
                          onClick={() => {
                            void patchChat({ pinned: !detail?.pinned });
                            setConvMenuOpen(false);
                          }}
                        >
                          <Pin size={16} /> {detail?.pinned ? "Lepas sematan" : "Sematkan chat"}
                        </button>
                        <button
                          onClick={() => {
                            void patchChat({ muted: !detail?.muted });
                            setConvMenuOpen(false);
                          }}
                        >
                          <BellOff size={16} /> {detail?.muted ? "Aktifkan notifikasi" : "Bisukan notifikasi"}
                        </button>
                        <button
                          onClick={() => {
                            void patchChat({ archived: !detail?.archived, ...(detail?.archived ? {} : { pinned: false }) });
                            setConvMenuOpen(false);
                          }}
                        >
                          <Archive size={16} /> {detail?.archived ? "Keluarkan dari arsip" : "Arsipkan chat"}
                        </button>
                        <hr />
                        <button
                          onClick={() => {
                            void patchChat({ aiEnabled: !detail?.aiEnabled });
                            setConvMenuOpen(false);
                            notify(detail?.aiEnabled ? "Auto-reply AI dimatikan" : "Auto-reply AI diaktifkan");
                          }}
                        >
                          <Bot size={16} /> {detail?.aiEnabled ? "Matikan auto-reply AI" : "Aktifkan auto-reply AI"}
                        </button>
                        <button
                          onClick={() => {
                            setConvMenuOpen(false);
                            setSettingsOpen(true);
                          }}
                        >
                          <Settings size={16} /> Pengaturan asisten AI
                        </button>
                        <hr />
                        <button
                          className="danger"
                          onClick={() => {
                            setConvMenuOpen(false);
                            setInfoOpen(true);
                          }}
                        >
                          <Trash2 size={16} /> Hapus chat
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </header>

            {searchOpen ? (
              <div className="wa-thread-search">
                <Search size={17} />
                <input
                  autoFocus
                  placeholder="Cari di dalam chat"
                  value={threadSearch}
                  onChange={(event) => runSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") nextHit(event.shiftKey ? -1 : 1);
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                  aria-label="Cari pesan dalam chat"
                />
                <span className="hit-count">
                  {threadSearch ? `${searchHits.length} hasil` : "—"}
                </span>
                <button className="wa-icon-btn" onClick={() => nextHit(-1)} aria-label="Hasil sebelumnya">
                  <ChevronUp size={18} />
                </button>
                <button className="wa-icon-btn" onClick={() => nextHit(1)} aria-label="Hasil berikutnya">
                  <ChevronDown size={18} />
                </button>
                <button
                  className="wa-icon-btn"
                  onClick={() => {
                    setSearchOpen(false);
                    setThreadSearch("");
                  }}
                  aria-label="Tutup pencarian"
                >
                  <X size={18} />
                </button>
              </div>
            ) : null}

            <div className="wa-thread" ref={threadRef}>
              <div className="wa-chip-row">
                <div className="wa-system-chip">
                  <Lock size={12} /> Pesan tersimpan di server ini dan hanya bisa dibaca anggota chat.
                </div>
              </div>

              {loadingChat && !messages.length ? (
                <div style={{ display: "grid", placeItems: "center", padding: 30 }}>
                  <Loader2 size={22} className="spin" style={{ color: "var(--text-2)" }} />
                </div>
              ) : null}

              {!loadingChat && !messages.length ? (
                <div className="wa-chip-row" style={{ marginTop: 30 }}>
                  <div className="wa-date-chip">Belum ada pesan. Kirim sapaan pertamamu 👋</div>
                </div>
              ) : null}

              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const newDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
                const replyMessage = message.replyToId ? messageById.get(message.replyToId) : undefined;
                const isMine = message.senderId === me.id;
                const sender = userById.get(message.senderId);
                const isRead = message.readBy.some((id) => id !== me.id);
                const showSender = !previous || previous.senderId !== message.senderId || newDay;
                const hasTail = showSender;
                const isHit = searchHits.includes(message.id);

                return (
                  <div key={message.id} style={{ display: "contents" }}>
                    {newDay ? (
                      <div className="wa-chip-row">
                        <div className="wa-date-chip">{formatDateDivider(message.createdAt)}</div>
                      </div>
                    ) : null}
                    <MessageBubble
                      message={message}
                      sender={sender}
                      isMine={isMine}
                      showSender={showSender}
                      showTail={hasTail}
                      replyMessage={replyMessage}
                      replySender={replyMessage ? userById.get(replyMessage.senderId) : undefined}
                      isRead={isRead}
                      chatType={detail?.type ?? "dm"}
                      highlight={isHit}
                      onReply={(target) => {
                        setReplyTo(target);
                        stickToBottom.current = true;
                        scrollToBottom();
                      }}
                      onDelete={(target, scope) => void deleteMessage(target, scope)}
                      onOpenImage={(url) => setViewer(url)}
                      onJumpTo={jumpTo}
                    />
                  </div>
                );
              })}

              {aiTyping ? (
                <div className="typing-row">
                  <span className={`typing-caption ${detail?.type === "group" || otherMember?.isSystem ? "ai" : ""}`}>
                    <Sparkles size={11} />
                    {detail?.type === "group" ? "Vibe AI" : otherMember?.name ?? "Kontak"} mengetik
                  </span>
                  <span className="typing-bubble">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              ) : null}

              <div ref={bottomRef} style={{ height: 1 }} />
            </div>

            {showScrollBtn ? (
              <button
                className="scroll-bottom"
                onClick={() => {
                  stickToBottom.current = true;
                  scrollToBottom();
                }}
                aria-label="Ke pesan terbaru"
              >
                <ChevronDown size={21} />
              </button>
            ) : null}

            <Composer
              chatId={activeId}
              replyTo={replyTo}
              replyName={userById.get(replyTo?.senderId ?? "")?.name ?? "pesan"}
              onCancelReply={() => setReplyTo(null)}
              onNotify={notify}
              onSend={sendMessage}
            />
          </section>
        ) : (
          <section className="wa-empty">
            <div className="wa-empty-inner">
              <div className="wa-empty-logo">V</div>
              <h1>VibeChat untuk Web</h1>
              <p>
                Kirim dan terima pesan tanpa memasang aplikasi. Percakapan disimpan di berkas JSON di
                server ini, dan asisten AI bisa membalas otomatis untukmu.
              </p>

              <div className="wa-empty-cards">
                <div className="wa-empty-card">
                  <span className="ic">
                    <CircleDashed size={17} />
                  </span>
                  <strong>Tanpa database</strong>
                  <span>Satu berkas JSON, penulisan atomik, mudah dicadangkan.</span>
                </div>
                <div className="wa-empty-card">
                  <span className="ic ai">
                    <Sparkles size={17} />
                  </span>
                  <strong>Balasan otomatis</strong>
                  <span>Gemini atau endpoint AI pribadi, persona per chat.</span>
                </div>
                <div className="wa-empty-card">
                  <span className="ic">
                    <Smile size={17} />
                  </span>
                  <strong>Rasa yang familiar</strong>
                  <span>Centang dibaca, balas kutipan, sematkan, arsipkan.</span>
                </div>
              </div>

              <div className="wa-empty-actions">
                <button className="btn primary" onClick={() => setNewChatOpen(true)}>
                  <MessageSquarePlus size={17} /> Mulai obrolan
                </button>
                <button className="btn ghost" onClick={() => setSettingsOpen(true)}>
                  <Bot size={17} /> Atur asisten AI
                </button>
              </div>

              <div className="wa-empty-foot">
                <Lock size={12} /> Hanya anggota chat yang bisa membaca pesan · {chats.length} obrolan
                tersimpan
              </div>
            </div>
          </section>
        )}

        {/* --------------------------- info drawer -------------------------- */}
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
      </div>

      {/* ------------------------------ modals ------------------------------ */}
      {settingsOpen ? (
        <AISettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={(settings) => {
            setAiSettings(settings);
            notify(settings.enabled ? "Auto-responder AI diaktifkan" : "Pengaturan AI disimpan");
            void loadList();
          }}
        />
      ) : null}

      {newChatOpen ? (
        <NewChatModal
          users={users}
          onClose={() => setNewChatOpen(false)}
          onCreated={(chatId) => {
            setNewChatOpen(false);
            setView("chats");
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

/* -------------------------------------------------------------------------- */
/*                              Chat list row                                 */
/* -------------------------------------------------------------------------- */

function ChatRow({
  chat,
  meId,
  active,
  onClick,
}: {
  chat: ChatSummaryDTO;
  meId: string;
  active: boolean;
  onClick: () => void;
}) {
  const last = chat.lastMessage;
  const previewPrefix = last
    ? last.senderId === meId
      ? "Kamu: "
      : chat.type === "group"
        ? ""
        : ""
    : "";

  return (
    <li>
      <button className={`wa-item ${active ? "selected" : ""}`} onClick={onClick}>
        <Avatar
          name={chat.name}
          color={chat.avatarColor}
          size={49}
          members={chat.type === "group" ? chat.memberAvatars : undefined}
        />
        <div className="wa-item-body">
          <div className="wa-item-top">
            <span className="wa-item-name">{chat.name}</span>
            {chat.pinned ? (
              <span className="wa-small-icon">
                <Pin size={12} />
              </span>
            ) : null}
            {chat.muted ? (
              <span className="wa-small-icon">
                <BellOff size={12} />
              </span>
            ) : null}
            <span className={`wa-item-time ${chat.unreadCount > 0 ? "unread" : ""}`}>
              {last ? formatListTime(last.createdAt) : ""}
            </span>
          </div>
          <div className="wa-item-bottom">
            <span className="wa-item-preview">
              {last?.viaAI ? (
                <span className="ai-mark">
                  <Sparkles size={11} />
                </span>
              ) : null}
              {last && last.senderId === meId ? <span className="txt">{previewPrefix}</span> : null}
              <span className="txt">{last ? last.body : "Ketuk untuk mulai mengobrol"}</span>
            </span>
            {chat.aiEnabled ? (
              <span className="wa-tag-ai">
                <Bot size={9} /> AI
              </span>
            ) : null}
            {chat.unreadCount > 0 ? (
              <span className="wa-badge">{chat.unreadCount > 99 ? "99+" : chat.unreadCount}</span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
