"use client";

import { useState } from "react";
import { Check, Loader2, Search, UserPlus, Users } from "lucide-react";
import { Modal } from "./Modal";
import { api, type PublicUser } from "@/lib/client";
import { Avatar } from "./Avatar";

interface Props {
  users: PublicUser[];
  onClose: () => void;
  onCreated: (chatId: string) => void;
}

export function NewChatModal({ users, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = users.filter(
    (user) =>
      !query ||
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.phone.includes(query),
  );

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : mode === "dm" ? [id] : [...current, id],
    );
  }

  async function create() {
    setError("");
    if (!selected.length) {
      setError("Pilih minimal satu kontak");
      return;
    }
    if (mode === "group" && !groupName.trim()) {
      setError("Nama grup wajib diisi");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ chat: { id: string } }>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ type: mode, memberIds: selected, name: groupName }),
      });
      onCreated(data.chat.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat chat");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Chat baru"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button className="btn primary" onClick={() => void create()} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : mode === "dm" ? <UserPlus size={16} /> : <Users size={16} />}
            {mode === "dm" ? "Mulai chat" : "Buat grup"}
          </button>
        </>
      }
    >
      <div className="modal-body">
        <div className="segmented">
          <button className={mode === "dm" ? "active" : ""} onClick={() => { setMode("dm"); setSelected([]); }}>
            Chat pribadi
          </button>
          <button className={mode === "group" ? "active" : ""} onClick={() => setMode("group")}>
            Grup baru
          </button>
        </div>

        {mode === "group" ? (
          <div className="field">
            <label htmlFor="group-name">Nama grup</label>
            <input
              id="group-name"
              className="input"
              placeholder="Contoh: Tim Produk ✨"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              maxLength={80}
            />
          </div>
        ) : null}

        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Cari kontak…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="contact-list">
          {filtered.map((user) => {
            const isSelected = selected.includes(user.id);
            return (
              <button
                key={user.id}
                className={`contact ${isSelected ? "selected" : ""}`}
                onClick={() => toggle(user.id)}
                type="button"
              >
                <Avatar name={user.name} color={user.avatarColor} size={38} />
                <div className="info">
                  <strong>{user.name}</strong>
                  <span>{user.about}</span>
                </div>
                <div className="check">{isSelected ? <Check size={13} /> : null}</div>
              </button>
            );
          })}
          {!filtered.length ? (
            <p style={{ color: "var(--muted)", fontSize: 13, padding: 8 }}>Kontak tidak ditemukan.</p>
          ) : null}
        </div>

        {error ? <div className="alert error">{error}</div> : null}
      </div>
    </Modal>
  );
}
