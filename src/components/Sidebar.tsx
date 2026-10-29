import { useEffect, useState } from 'react';
import {
  Check,
  Download,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import type { ChatSession } from '../types/chat';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isDesktopExpanded: boolean;
  isMobileOpen: boolean;
  isStandalone: boolean;
  hasActiveMessages: boolean;
  onToggleDesktop: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onExportActiveChat: () => void;
  onOpenInstallModal: () => void;
  onOpenSettingsModal: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  isDesktopExpanded,
  isMobileOpen,
  isStandalone,
  hasActiveMessages,
  onToggleDesktop,
  onCloseMobile,
  onNewChat,
  onSelectSession,
  onTogglePin,
  onRenameSession,
  onDeleteSession,
  onExportActiveChat,
  onOpenInstallModal,
  onOpenSettingsModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSessions = sessions.filter((s) =>
    normalizedQuery ? s.title.toLowerCase().includes(normalizedQuery) : true
  );

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const recentSessions = filteredSessions.filter((s) => !s.pinned);

  const startRename = (session: ChatSession) => {
    setEditingId(session.id);
    setEditDraft(session.title);
    setOpenMenuId(null);
  };

  const commitRename = (id: string) => {
    const cleaned = editDraft.trim();
    if (cleaned) {
      onRenameSession(id, cleaned);
    }
    setEditingId(null);
    setEditDraft('');
  };

  const renderSessionRow = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isMenuOpen = openMenuId === session.id;
    const isEditing = editingId === session.id;

    if (isEditing) {
      return (
        <div
          key={session.id}
          className="rounded-[10px] border border-[#F97316]/60 bg-[#141419] p-2"
        >
          <label
            htmlFor={`rename-${session.id}`}
            className="mb-1 block text-[11px] font-medium text-[#B4B4BE]"
          >
            Judul percakapan
          </label>
          <div className="flex items-center gap-1">
            <input
              id={`rename-${session.id}`}
              type="text"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(session.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="min-h-10 min-w-0 flex-1 rounded-md bg-[#0C0C10] px-2 text-sm text-[#FAFAFA] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => commitRename(session.id)}
              aria-label="Simpan judul baru"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#FB923C] hover:bg-[#1E1E26]"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={session.id} className="relative">
        <div
          className={`flex items-center rounded-[10px] transition-colors ${
            isActive
              ? 'bg-[#1D1412] text-[#FAFAFA]'
              : 'text-[#B4B4BE] hover:bg-[#121217] hover:text-[#FAFAFA]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onSelectSession(session.id);
              onCloseMobile();
            }}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm"
          >
            {session.pinned ? (
              <Pin className="h-3.5 w-3.5 shrink-0 text-[#F97316]" aria-hidden="true" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[#9E9EA8]" aria-hidden="true" />
            )}
            <span className="truncate font-medium">{session.title}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenMenuId(isMenuOpen ? null : session.id)}
            aria-label={`Opsi untuk percakapan ${session.title}`}
            aria-expanded={isMenuOpen}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[10px] text-[#9E9EA8] transition-colors hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="mt-1 flex items-center justify-between gap-1 rounded-[10px] border border-[#26262F] bg-[#14141A] p-1">
            <button
              type="button"
              onClick={() => {
                onTogglePin(session.id);
                setOpenMenuId(null);
              }}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#B4B4BE] hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
            >
              <Pin className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{session.pinned ? 'Lepas' : 'Sematkan'}</span>
            </button>

            <button
              type="button"
              onClick={() => startRename(session)}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#B4B4BE] hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ubah</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteSession(session.id);
                setOpenMenuId(null);
              }}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#F87171] hover:bg-[#241313]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hapus</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const drawerInner = (
    <div className="flex h-full flex-col justify-between bg-[#050507] px-3 py-3 pt-safe pb-safe">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 pb-3">
          <button
            type="button"
            onClick={() => {
              if (isMobileOpen) {
                onCloseMobile();
              } else {
                onToggleDesktop();
              }
            }}
            aria-label={isMobileOpen ? 'Tutup menu navigasi' : 'Sembunyikan panel samping'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-center gap-2 pr-2">
            <img
              src="/logo-transparent.png"
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain"
            />
            <span className="font-display text-sm font-semibold tracking-tight text-[#FAFAFA]">
              Worm<span className="text-[#F97316]">GPT</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-[#3B1B15] bg-[#171110] px-4 py-2.5 text-sm font-medium text-[#FAFAFA] transition-colors hover:border-[#F97316]/60 hover:bg-[#211614]"
        >
          <Plus className="h-4 w-4 text-[#FB923C]" aria-hidden="true" />
          <span>Percakapan baru</span>
        </button>

        {sessions.length >= 2 && (
          <div className="mt-3">
            <label
              htmlFor="sidebar-chat-search"
              className="mb-1 block px-1 text-xs font-medium text-[#B4B4BE]"
            >
              Cari percakapan
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9E9EA8]"
                aria-hidden="true"
              />
              <input
                id="sidebar-chat-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik judul sesi..."
                className="min-h-11 w-full rounded-[10px] border border-[#22222A] bg-[#0F0F14] pr-3 pl-9 text-sm text-[#FAFAFA] placeholder:text-[#9E9EA8] focus:border-[#F97316]"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-0.5">
          {sessions.length === 0 ? (
            <div className="rounded-[12px] border border-[#1B1B22] bg-[#0B0B0F] px-3.5 py-4 text-xs leading-relaxed text-[#9E9EA8]">
              Belum ada riwayat tersimpan. Kirim pertanyaan pertama Anda untuk memulai sesi.
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[#9E9EA8]">
              Tidak ada percakapan yang cocok dengan pencarian.
            </div>
          ) : (
            <>
              {pinnedSessions.length > 0 && (
                <section aria-label="Percakapan yang disematkan">
                  <h2 className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-[#9E9EA8]">
                    Disematkan
                  </h2>
                  <div className="space-y-1">{pinnedSessions.map(renderSessionRow)}</div>
                </section>
              )}

              {recentSessions.length > 0 && (
                <section aria-label="Percakapan terbaru">
                  <h2 className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-[#9E9EA8]">
                    Terbaru
                  </h2>
                  <div className="space-y-1">{recentSessions.map(renderSessionRow)}</div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-[#1B1B22] pt-3">
        <button
          type="button"
          onClick={() => {
            onOpenInstallModal();
            onCloseMobile();
          }}
          className="flex min-h-11 w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm text-[#B4B4BE] transition-colors hover:bg-[#131319] hover:text-[#FAFAFA]"
        >
          <span className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-[#FB923C]" aria-hidden="true" />
            <span>{isStandalone ? 'Status Aplikasi PWA' : 'Pasang Aplikasi (APK)'}</span>
          </span>
          <span className="rounded-md bg-[#221410] px-2 py-0.5 font-mono text-[11px] font-medium text-[#FB923C]">
            {isStandalone ? 'Aktif' : 'PWA'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onExportActiveChat();
            onCloseMobile();
          }}
          disabled={!hasActiveMessages}
          className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm text-[#B4B4BE] transition-colors hover:bg-[#131319] hover:text-[#FAFAFA] disabled:opacity-45"
        >
          <Download className="h-4 w-4 text-[#9E9EA8]" aria-hidden="true" />
          <span>Ekspor Chat (.md)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSettingsModal();
            onCloseMobile();
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm text-[#B4B4BE] transition-colors hover:bg-[#131319] hover:text-[#FAFAFA]"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#9E9EA8]" aria-hidden="true" />
          <span>Pengaturan</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent Gemini navigation rail / drawer */}
      <nav
        aria-label="Navigasi utama dan riwayat percakapan"
        className={`hidden shrink-0 border-r border-[#191920] bg-[#050507] transition-[width] duration-200 ease-out lg:block ${
          isDesktopExpanded ? 'w-[280px]' : 'w-[72px]'
        }`}
      >
        {isDesktopExpanded ? (
          drawerInner
        ) : (
          <div className="flex h-full flex-col items-center justify-between py-3">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onToggleDesktop}
                aria-label="Perluas panel samping"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onNewChat}
                aria-label="Mulai percakapan baru"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[#3B1B15] bg-[#171110] text-[#FB923C] transition-colors hover:border-[#F97316]/60 hover:bg-[#211614]"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenInstallModal}
                aria-label="Pasang Aplikasi PWA"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#FB923C] transition-colors hover:bg-[#14141A]"
              >
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenSettingsModal}
                aria-label="Buka pengaturan"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#B4B4BE] transition-colors hover:bg-[#14141A] hover:text-[#FAFAFA]"
              >
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile & Tablet slide-over drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <nav
            aria-label="Riwayat percakapan seluler"
            className="relative z-10 h-full w-[min(86vw,300px)] border-r border-[#23232B] bg-[#050507]"
          >
            {drawerInner}
          </nav>
        </div>
      )}
    </>
  );
}
