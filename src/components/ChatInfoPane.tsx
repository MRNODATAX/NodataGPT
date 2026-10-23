"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, Sparkles, Trash2, X } from "lucide-react";
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

  useEffect(() => setPersona(chat.aiPersona), [chat.aiPersona, chat.id]);

  async function savePersona() {
    setSavingPersona(true);
    try {
      await onPatch({ aiPersona: persona });
    } finally {
      setSavingPersona(false);
    }
  }

  return (
    <aside className="info-drawer">
      <div className="info-drawer-header">
        <h3>Info chat</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Tutup info chat">
          <X size={18} />
        </button>
      </div>

      <div className="info-section" style={{ alignItems: "center", textAlign: "center" }}>
        <Avatar name={chat.name} color={chat.avatarColor} size={86} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{chat.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 2 }}>
            {chat.type === "group" ? `Grup · ${chat.members.length} anggota` : "Chat pribadi"}
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="section-title">Preferensi</div>
        <SwitchRow
          checked={chat.pinned}
          onChange={(next) => void onPatch({ pinned: next })}
          label="Sematkan chat"
          description="Tampil di paling atas daftar chat."
        />
        <SwitchRow
          checked={chat.muted}
          onChange={(next) => void onPatch({ muted: next })}
          label="Bisukan notifikasi"
          description="Tidak menghitung badge belum dibaca."
        />
        <SwitchRow
          checked={chat.archived}
          onChange={(next) => void onPatch({ archived: next })}
          label="Arsipkan chat"
          description="Sembunyikan dari daftar utama."
        />
      </div>

      <div className="info-section">
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bot size={13} /> Auto responder
        </div>
        <SwitchRow
          checked={chat.aiEnabled}
          onChange={(next) => void onPatch({ aiEnabled: next })}
          label="AI membalas chat ini"
          description={
            globalAIEnabled
              ? chat.type === "group"
                ? "Vibe AI akan membalas di grup setelah pesanmu."
                : "Balasan dikirim atas nama lawan bicara, mengikuti persona di bawah."
              : "Aktifkan dulu auto-responder global di Pengaturan → AI."
          }
        />
        <div className="field">
          <label htmlFor="persona">Persona khusus chat ini</label>
          <textarea
            id="persona"
            className="textarea"
            style={{ minHeight: 90 }}
            value={persona}
            placeholder="Ceritakan siapa yang membalas: gaya bahasa, kebiasaan, dan konteksnya."
            onChange={(event) => setPersona(event.target.value)}
          />
          <button className="btn ghost" onClick={() => void savePersona()} disabled={savingPersona}>
            {savingPersona ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            Simpan persona
          </button>
        </div>
      </div>

      <div className="info-section">
        <div className="section-title">Anggota</div>
        {chat.members.map((member) => (
          <div className="member-row" key={member.id}>
            <Avatar name={member.name} color={member.avatarColor} size={34} />
            <span>
              {member.name}
              {member.id === meId ? <small> · kamu</small> : null}
            </span>
            {member.isSystem ? <small>AI</small> : null}
          </div>
        ))}
      </div>

      <div className="info-section">
        <button className="btn danger full" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} /> Hapus chat
        </button>
        {confirmDelete ? (
          <div className="alert error">
            Chat dan seluruh pesannya akan dihapus permanen dari JSON.
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
