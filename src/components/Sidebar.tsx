import { useMemo, useState } from 'react';
import {
  Download,
  FileDown,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ToolsIcon } from './ToolsIcon';
import {
  DEFAULT_MIKU_AVATAR_URL,
  resolveWaifuAvatarUrl,
} from '../services/waifuPresets';
import type { Conversation } from '../types/chat';
import type { WaifuProfile } from '../types/waifu';

export type SidebarChatMode = 'ai' | 'waifu';

interface SidebarProps {
  conversations: Conversation[];
  activeChatId: string | null;
  activeWaifu: WaifuProfile;
  sidebarMode: SidebarChatMode;
  collapsed: boolean;
  mobileOpen: boolean;
  isPwaInstalled: boolean;
  hasActiveMessages: boolean;
  onChangeSidebarMode: (mode: SidebarChatMode) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onStartWaifuChat: () => void;
  onOpenWaifuStudio: () => void;
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
  activeWaifu,
  sidebarMode,
  collapsed,
  mobileOpen,
  isPwaInstalled,
  hasActiveMessages,
  onChangeSidebarMode,
  onToggleCollapse,
  onCloseMobile,
  onNewChat,
  onStartWaifuChat,
  onOpenWaifuStudio,
  onSelectChat,
  onDeleteChat,
  onTogglePinChat,
  onExportActiveChat,
  onOpenSettings,
  onOpenToolsStudio,
  onOpenInstallModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { aiCount, waifuCount } = useMemo(() => {
    let ai = 0;
    let waifu = 0;
    for (const c of conversations) {
      if (c.mode === 'waifu') waifu += 1;
      else ai += 1;
    }
    return { aiCount: ai, waifuCount: waifu };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byMode = conversations.filter((c) =>
      sidebarMode === 'waifu' ? c.mode === 'waifu' : c.mode !== 'waifu'
    );
    const sorted = [...byMode].sort((a, b) => {
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
  }, [conversations, sidebarMode, searchQuery]);

  const pinnedConversations = useMemo(
    () => filteredConversations.filter((c) => Boolean(c.pinned)),
    [filteredConversations]
  );

  const recentConversations = useMemo(
    () => filteredConversations.filter((c) => !c.pinned),
    [filteredConversations]
  );

  const showExpanded = mobileOpen || !collapsed;
  const activeWaifuAvatarSrc = resolveWaifuAvatarUrl(activeWaifu.avatarUrl);

  const renderChatRow = (chat: Conversation) => {
    const isActive = chat.id === activeChatId;
    return (
      <li key={chat.id}>
        <div
          className={`group flex min-h-[42px] items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 text-sm transition-colors ${
            isActive
              ? chat.mode === 'waifu'
                ? 'border border-[#FB923C]/35 bg-gradient-to-r from-[#22D3EE]/12 to-[#FB923C]/14 text-white'
                : 'border border-[#22D3EE]/30 bg-[#22D3EE]/12 text-white'
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
            {chat.pinned ? (
              <Pin className="h-3.5 w-3.5 shrink-0 text-[#FB923C]" />
            ) : chat.mode === 'waifu' ? (
              <img
                src={resolveWaifuAvatarUrl(
                  chat.waifuProfileSnapshot?.avatarUrl || activeWaifu.avatarUrl
                )}
                alt=""
                width={18}
                height={18}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                }}
                className="h-[18px] w-[18px] shrink-0 rounded-full border border-[#22D3EE]/45 object-cover"
              />
            ) : (
              <MessageSquare
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8]'
                }`}
              />
            )}
            <span className="truncate">{chat.title}</span>
          </button>

          <div className="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onTogglePinChat(chat.id)}
              aria-label={chat.pinned ? 'Lepas sematan' : 'Sematkan chat'}
              title={chat.pinned ? 'Lepas sematan' : 'Sematkan di atas'}
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
  };

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

        {/* Mode Pill Switcher (AI Biasa | Waifu) + Mode-Aware Add New Chat */}
        <div className="space-y-2 px-3 py-1.5">
          {showExpanded ? (
            <>
              {/* Segmented Mode Pill */}
              <div
                role="tablist"
                aria-label="Pilih mode percakapan"
                className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/50 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sidebarMode === 'ai'}
                  onClick={() => onChangeSidebarMode('ai')}
                  className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-all cursor-pointer ${
                    sidebarMode === 'ai'
                      ? 'border border-[#22D3EE]/45 bg-[#22D3EE]/16 text-white shadow-[0_0_14px_rgba(34,211,238,0.16)]'
                      : 'border border-transparent text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      sidebarMode === 'ai' ? 'text-[#22D3EE]' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span className="truncate">AI Biasa</span>
                  {aiCount > 0 && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.2 font-mono-code text-[9.5px] text-[#CBD5E1]">
                      {aiCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={sidebarMode === 'waifu'}
                  onClick={() => onChangeSidebarMode('waifu')}
                  className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-all cursor-pointer ${
                    sidebarMode === 'waifu'
                      ? 'border border-[#FB923C]/50 bg-gradient-to-r from-[#22D3EE]/16 via-[#0F1A30] to-[#FB923C]/22 text-white shadow-[0_0_14px_rgba(251,146,60,0.16)]'
                      : 'border border-transparent text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <img
                    src={activeWaifuAvatarSrc}
                    alt=""
                    width={16}
                    height={16}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                    }}
                    className="h-4 w-4 shrink-0 rounded-full border border-[#22D3EE]/55 object-cover"
                  />
                  <span className="truncate">Waifu</span>
                  {waifuCount > 0 && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.2 font-mono-code text-[9.5px] text-[#FED7AA]">
                      {waifuCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Context-Adaptive Primary "New Chat" Action */}
              {sidebarMode === 'ai' ? (
                <button
                  type="button"
                  onClick={() => {
                    onNewChat();
                    onCloseMobile();
                  }}
                  aria-label="Percakapan AI baru"
                  title="Buat percakapan AI biasa baru"
                  className="nd-glass-card flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5 shrink-0 text-[#22D3EE]" />
                  <span className="truncate">Chat AI Baru</span>
                </button>
              ) : (
                <div className="flex min-h-[46px] w-full items-center justify-between gap-1.5 rounded-xl border border-[#FB923C]/35 bg-gradient-to-r from-[#22D3EE]/[0.1] via-[#0B1324]/92 to-[#FB923C]/[0.14] p-1.5 transition-colors hover:border-[#22D3EE]/55">
                  <button
                    type="button"
                    onClick={() => {
                      onStartWaifuChat();
                      onCloseMobile();
                    }}
                    aria-label={`Tambah Chat Waifu baru bersama ${activeWaifu.name}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1 text-left cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={activeWaifuAvatarSrc}
                        alt={activeWaifu.name}
                        width={26}
                        height={26}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                        }}
                        className="h-6.5 w-6.5 rounded-full border border-[#22D3EE]/60 object-cover"
                      />
                      <span className="absolute -right-1 -bottom-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22D3EE] text-[#041019] shadow">
                        <Plus className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-white">
                          Chat Waifu Baru
                        </span>
                      </div>
                      <div className="truncate text-[10.5px] text-[#94A3B8]">
                        {activeWaifu.name} · Chat Ayang / Skenario
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenWaifuStudio();
                      onCloseMobile();
                    }}
                    aria-label="Edit karakter Waifu"
                    title="Edit karakter & personalisasi Waifu"
                    className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/45 text-[#CBD5E1] transition-colors hover:border-[#FB923C]/55 hover:text-white cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#FB923C]" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Collapsed Desktop Rail (72px): Mode Pills + Mode-Aware Add Button */
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/45 p-1">
                <button
                  type="button"
                  onClick={() => onChangeSidebarMode('ai')}
                  aria-label="Mode Chat AI Biasa"
                  title={`Mode AI Biasa (${aiCount})`}
                  className={`flex h-9 w-full items-center justify-center rounded-xl transition-all cursor-pointer ${
                    sidebarMode === 'ai'
                      ? 'border border-[#22D3EE]/50 bg-[#22D3EE]/16 text-[#22D3EE]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onChangeSidebarMode('waifu')}
                  aria-label="Mode Chat Waifu"
                  title={`Mode Chat Waifu · ${activeWaifu.name} (${waifuCount})`}
                  className={`flex h-9 w-full items-center justify-center rounded-xl transition-all cursor-pointer ${
                    sidebarMode === 'waifu'
                      ? 'border border-[#FB923C]/55 bg-[#FB923C]/16'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={activeWaifuAvatarSrc}
                    alt={activeWaifu.name}
                    width={22}
                    height={22}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_MIKU_AVATAR_URL;
                    }}
                    className="h-5.5 w-5.5 rounded-full border border-[#22D3EE]/55 object-cover"
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (sidebarMode === 'waifu') {
                    onStartWaifuChat();
                  } else {
                    onNewChat();
                  }
                }}
                aria-label={
                  sidebarMode === 'waifu'
                    ? `Tambah Chat Waifu baru (${activeWaifu.name})`
                    : 'Tambah Chat AI baru'
                }
                title={
                  sidebarMode === 'waifu'
                    ? `Chat Waifu Baru · ${activeWaifu.name}`
                    : 'Chat AI Baru'
                }
                className="nd-glass-card flex min-h-[44px] w-full items-center justify-center rounded-xl p-2.5 text-white cursor-pointer"
              >
                <Plus
                  className={`h-5 w-5 ${
                    sidebarMode === 'waifu' ? 'text-[#FB923C]' : 'text-[#22D3EE]'
                  }`}
                />
              </button>
            </div>
          )}
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
                placeholder={
                  sidebarMode === 'waifu'
                    ? 'Cari riwayat Waifu...'
                    : 'Cari riwayat AI...'
                }
                aria-label="Cari riwayat percakapan"
                className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pr-3 pl-9 text-xs text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Separated History List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {showExpanded ? (
            <>
              {filteredConversations.length === 0 ? (
                <>
                  <div className="mb-1.5 px-2 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {sidebarMode === 'waifu'
                      ? 'Riwayat Chat Waifu'
                      : 'Riwayat AI Biasa'}
                  </div>
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-5 text-center text-xs text-[#94A3B8]">
                    {searchQuery ? (
                      'Tidak ada percakapan yang cocok.'
                    ) : sidebarMode === 'waifu' ? (
                      <div className="space-y-2.5">
                        <p>Belum ada riwayat Chat Waifu.</p>
                        <button
                          type="button"
                          onClick={() => {
                            onStartWaifuChat();
                            onCloseMobile();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#FB923C]/40 bg-[#FB923C]/14 px-3 py-1.5 text-[11px] font-semibold text-[#FED7AA] transition-colors hover:border-[#FB923C]/65 hover:text-white cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Pilih Skenario & Mulai</span>
                        </button>
                      </div>
                    ) : (
                      'Belum ada riwayat chat AI biasa.'
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {pinnedConversations.length > 0 && (
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 px-2 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#FDBA74]">
                        <Pin className="h-3 w-3 text-[#FB923C]" />
                        <span>Disematkan ({pinnedConversations.length})</span>
                      </div>
                      <ul className="space-y-1">
                        {pinnedConversations.map(renderChatRow)}
                      </ul>
                    </div>
                  )}

                  {recentConversations.length > 0 && (
                    <div>
                      <div className="mb-1 px-2 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        {pinnedConversations.length > 0
                          ? sidebarMode === 'waifu'
                            ? 'Waifu Terbaru'
                            : 'AI Terbaru'
                          : sidebarMode === 'waifu'
                            ? 'Riwayat Chat Waifu'
                            : 'Riwayat AI Biasa'}
                      </div>
                      <ul className="space-y-1">
                        {recentConversations.map(renderChatRow)}
                      </ul>
                    </div>
                  )}
                </div>
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
            <ToolsIcon className="h-4 w-4 shrink-0 text-[#22D3EE]" />
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
