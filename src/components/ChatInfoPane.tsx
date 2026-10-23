"use client";

import { useEffect, useState } from "react";
import { Archive, Bell, Bot, Loader2, Pin, Sparkles, Trash2, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { SwitchRow } from "./Modal";
import type { ChatDetailDTO } from "@/lib/client";

interface Props {
  chat: ChatDetailDTO;
  meId: string;
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
  globalAIEnabled: boolean;
}

export function ChatInfoPane({ chat, meId, onClose, onPatch, onDelete, globalAIEnabled }: Props) {
  const [persona, setPersona] = useState(chat.aiPersona);
  const [savingPersona, setSavingPersona] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setPersona(chat.aiPersona);
    setConfirmDelete(false);
  }, [chat.aiPersona, chat.id]);

  async function savePersona() {
    setSavingPersona(true);
    try {
      await onPatch({ aiPersona: persona });
    } finally {
      setSavingPersona(false);
    }
  }

  return (
    <aside className="wa-info">
      <header className="wa-info-header">
        <button className="wa-icon-btn" onClick={onClose} aria-label="Tutup info chat">
          <X size={20} />
        </button>
        <h2>{chat.type === "group" ? "Info grup" : "Info kontak"}</h2>
      </header>

      <div className="wa-info-hero">
        <Avatar
          name={chat.name}
          color={chat.avatarColor}
          size={132}
          members={chat.type === "group" ? chat.memberAvatars : undefined}
        />
        <h3>{chat.name}</h3>
        <p>
          {chat.type === "group"
            ? `Grup · ${chat.members.length} anggota`
            : chat.members.find((member) => member.id !== meId)?.phone ?? "Chat pribadi"}
        </p>
        <p style={{ fontSize: 12.5 }}>
          {chat.members.find((member) => member.id !== meId)?.about ?? ""}
        </p>
      </div>

      <div className="wa-info-section">
        <div className="sec-title">Preferensi chat</div>
        <SwitchRow
          checked={chat.pinned}
          onChange={(next) => void onPatch({ pinned: next })}
          label="Sematkan chat"
          description="Selalu tampil di bagian paling atas daftar."
        />
        <SwitchRow
          checked={chat.muted}
          onChange={(next) => void onPatch({ muted: next })}
          label="Bisukan notifikasi"
          description="Chat tidak dihitung pada badge belum dibaca."
        />
        <SwitchRow
          checked={chat.archived}
          onChange={(next) => void onPatch({ archived: next })}
          label="Arsipkan chat"
          description="Pindahkan ke folder arsip."
        />
      </div>

      <div className="wa-info-section">
        <div className="sec-title">
          <Bot size={13} /> Auto-responder AI
        </div>
        <SwitchRow
          checked={chat.aiEnabled}
          onChange={(next) => void onPatch({ aiEnabled: next })}
          label="AI membalas chat ini"
          description={
            globalAIEnabled
              ? chat.type === "group"
                ? "Vibe AI membalas sebagai akun sistem setelah pesanmu."
                : "Balasan dikirim atas nama lawan bicara sesuai persona di bawah."
              : "Aktifkan auto-responder global dulu di ikon ✦ pada rail kiri."
          }
        />

        <div className="field">
          <label htmlFor="persona">Persona khusus chat ini</label>
          <textarea
            id="persona"
            className="textarea"
            style={{ minHeight: 96 }}
            value={persona}
            placeholder="Contoh: Aisyah, desainer muda yang ramah, suka kopi, balasannya singkat dan hangat."
            onChange={(event) => setPersona(event.target.value)}
          />
          <span className="hint">
            Persona ini menimpa persona global hanya untuk chat ini.
          </span>
          <button className="btn ghost" onClick={() => void savePersona()} disabled={savingPersona}>
            {savingPersona ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            Simpan persona
          </button>
        </div>
      </div>

      <div className="wa-info-section">
        <div className="sec-title">Anggota · {chat.members.length}</div>
        {chat.members.map((member) => (
          <div className="wa-member" key={member.id}>
            <Avatar name={member.name} color={member.avatarColor} size={40} />
            <div className="m-body">
              <strong>
                {member.name}
                {member.id === meId ? " (kamu)" : ""}
              </strong>
              <span>{member.isSystem ? "Asisten AI VibeChat" : member.about}</span>
            </div>
            {member.isSystem ? <span className="wa-tag-ai">AI</span> : null}
          </div>
        ))}
      </div>

      <div className="wa-info-section">
        <div className="sec-title">Tindakan</div>
        <button className="wa-icon-btn" hidden aria-hidden />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={() => void onPatch({ pinned: !chat.pinned })}>
            <Pin size={15} /> {chat.pinned ? "Lepas sematan" : "Sematkan"}
          </button>
          <button className="btn ghost" onClick={() => void onPatch({ muted: !chat.muted })}>
            <Bell size={15} /> {chat.muted ? "Aktifkan notifikasi" : "Bisukan"}
          </button>
          <button className="btn ghost" onClick={() => void onPatch({ archived: !chat.archived })}>
            <Archive size={15} /> {chat.archived ? "Keluarkan dari arsip" : "Arsipkan"}
          </button>
        </div>

        <button className="wa-danger-row" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={17} /> Hapus chat ini
        </button>
        {confirmDelete ? (
          <div className="alert error">
            Chat dan seluruh pesannya akan dihapus permanen dari <code>data/db.json</code>.
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
                Batal
              </button>
              <button className="btn danger" onClick={() => void onDelete()}>
                Ya, hapus
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
