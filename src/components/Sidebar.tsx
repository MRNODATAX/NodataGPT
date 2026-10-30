import { useMemo, useState } from 'react';
import {
  Blocks,
  Download,
  FileDown,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeChatId: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  isPwaInstalled: boolean;
  hasActiveMessages: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onTogglePinChat: (id: string) => void;
  onExportActiveChat: () => void;
  onOpenSettings: () => void;
  onOpenToolsStudio: () => void;
  onOpenInstallModal: () => void;
}

export function Sidebar({
  conversations,
  activeChatId,
  collapsed,
  mobileOpen,
  isPwaInstalled,
  hasActiveMessages,
  onToggleCollapse,
  onCloseMobile,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onTogglePinChat,
  onExportActiveChat,
  onOpenSettings,
  onOpenToolsStudio,
  onOpenInstallModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const showExpanded = mobileOpen || !collapsed;

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      <aside
        aria-label="Riwayat percakapan dan navigasi"
        className={`nd-glass-sidebar pt-safe fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-200 ease-out lg:static lg:z-20 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${showExpanded ? 'w-[284px] max-w-[85vw]' : 'lg:w-[72px]'}`}
      >
        {/* Top Brand Row */}
        <div className="flex h-14 items-center justify-between px-3">
          {showExpanded ? (
            <div className="flex items-center gap-2.5 pl-1">
              <img
                src="/logo-transparent.png"
                alt="NodataGPT"
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain"
              />
              <span className="font-display text-base font-bold tracking-tight">
                <span className="text-[#22D3EE]">Nodata</span>
                <span className="text-[#FB923C]">GPT</span>
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Perluas bilah sisi' : 'Ciutkan bilah sisi'}
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white lg:flex cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu samping"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* New Chat Primary Action */}
        <div className="px-3 py-1.5">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            aria-label="Percakapan baru"
            title="Percakapan baru"
            className={`nd-glass-card flex min-h-[44px] w-full items-center gap-2.5 rounded-xl font-medium text-white cursor-pointer ${
              showExpanded ? 'px-3.5 py-2.5 text-sm' : 'justify-center p-2.5'
            }`}
          >
            <Plus className="h-5 w-5 shrink-0 text-[#22D3EE]" />
            {showExpanded && <span>Percakapan Baru</span>}
          </button>
        </div>

        {/* Search Input */}
        {showExpanded && (
          <div className="px-3 pt-1 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari riwayat chat..."
                aria-label="Cari riwayat percakapan"
                className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pr-3 pl-9 text-xs text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {showExpanded ? (
            <>
              <div className="mb-1.5 px-2 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Riwayat Percakapan
              </div>

              {filteredConversations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-5 text-center text-xs text-[#94A3B8]">
                  {searchQuery
                    ? 'Tidak ada percakapan yang cocok.'
                    : 'Belum ada riwayat percakapan.'}
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredConversations.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    return (
                      <li key={chat.id}>
                        <div
                          className={`group flex min-h-[42px] items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? 'border border-[#22D3EE]/30 bg-[#22D3EE]/12 text-white'
                              : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectChat(chat.id);
                              onCloseMobile();
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
                          >
                            <MessageSquare
                              className={`h-4 w-4 shrink-0 ${
                                isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8]'
                              }`}
                            />
                            <span className="truncate">{chat.title}</span>
                          </button>

                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => onTogglePinChat(chat.id)}
                              aria-label={
                                chat.pinned ? 'Lepas sematan' : 'Sematkan chat'
                              }
                              className={`flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer ${
                                chat.pinned ? 'text-[#FB923C]' : 'text-[#94A3B8]'
                              }`}
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteChat(chat.id)}
                              aria-label={`Hapus ${chat.title}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-[#FB923C] cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="pb-safe space-y-1 border-t border-white/8 p-2.5">
          {!isPwaInstalled && (
            <button
              type="button"
              onClick={() => {
                onOpenInstallModal();
                onCloseMobile();
              }}
              aria-label="Pasang aplikasi NodataGPT"
              title="Pasang Aplikasi (APK)"
              className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 text-sm font-medium text-[#FB923C] transition-colors hover:bg-[#FB923C]/20 cursor-pointer ${
                showExpanded ? 'px-3 py-2' : 'justify-center p-2'
              }`}
            >
              <Download className="h-4 w-4 shrink-0" />
              {showExpanded && <span>Pasang Aplikasi (APK)</span>}
            </button>
          )}

          {hasActiveMessages && showExpanded && (
            <button
              type="button"
              onClick={() => {
                onExportActiveChat();
                onCloseMobile();
              }}
              className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
            >
              <FileDown className="h-4 w-4 shrink-0 text-[#22D3EE]" />
              <span>Ekspor Percakapan (.md)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenToolsStudio();
              onCloseMobile();
            }}
            aria-label="Web Tools Studio"
            title="Web Tools Studio"
            className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl text-sm text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white cursor-pointer ${
              showExpanded ? 'px-3 py-2' : 'justify-center p-2'
            }`}
          >
            <Blocks className="h-4 w-4 shrink-0 text-[#22D3EE]" />
            {showExpanded && <span>Web Tools Studio</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            aria-label="Pengaturan dan Kunci API"
            title="Pengaturan"
            className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl text-sm text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white cursor-pointer ${
              showExpanded ? 'px-3 py-2' : 'justify-center p-2'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {showExpanded && <span>Pengaturan & Kunci API</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
