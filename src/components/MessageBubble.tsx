"use client";

import { CheckCheck, CornerUpLeft, MoreVertical, Sparkles, Trash2, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { formatTime, type MessageDTO, type PublicUser } from "@/lib/client";

interface Props {
  message: MessageDTO;
  sender: PublicUser | undefined;
  isMine: boolean;
  showSender: boolean;
  replyMessage?: MessageDTO;
  replySender?: PublicUser;
  isRead: boolean;
  chatType: "dm" | "group";
  onReply: (message: MessageDTO) => void;
  onDelete: (message: MessageDTO, scope: "me" | "all") => void;
  onOpenImage: (url: string) => void;
}

const COLOR_BY_ID: Record<string, string> = {};
const PALETTE = ["#f87171", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#fb923c", "#f472b6", "#22d3ee"];
function senderColor(id: string): string {
  if (!COLOR_BY_ID[id]) {
    let hash = 0;
    for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    COLOR_BY_ID[id] = PALETTE[hash % PALETTE.length];
  }
  return COLOR_BY_ID[id];
}

export function MessageBubble({
  message,
  sender,
  isMine,
  showSender,
  replyMessage,
  replySender,
  isRead,
  chatType,
  onReply,
  onDelete,
  onOpenImage,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className={`bubble-row ${isMine ? "out" : "in"}`} ref={ref}>
      {!isMine && chatType === "group" ? (
        <Avatar name={sender?.name ?? "?"} color={sender?.avatarColor ?? "sky"} size={30} />
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div className="bubble">
          {showSender && !isMine && chatType === "group" ? (
            <div className="bubble-sender" style={{ color: senderColor(message.senderId) }}>
              {sender?.name ?? "Anggota"}
            </div>
          ) : null}

          {replyMessage ? (
            <div className="bubble-quote">
              <strong>{replySender?.name ?? "Pesan"}: </strong>
              {replyMessage.body.slice(0, 90)}
            </div>
          ) : null}

          {message.type === "image" && message.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="bubble-image"
              src={message.mediaUrl}
              alt="Lampiran gambar"
              onClick={() => onOpenImage(message.mediaUrl!)}
            />
          ) : null}

          {message.type === "image" && message.body === "📷 Foto" ? null : (
            <div className="bubble-text">{message.body}</div>
          )}

          <div className="bubble-meta">
            {message.viaAI ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                <Sparkles size={11} /> AI
              </span>
            ) : null}
            <span>{formatTime(message.createdAt)}</span>
            {isMine ? (
              <span className={`tick ${isRead ? "read" : ""}`} title={isRead ? "Dibaca" : "Terkirim"}>
                <CheckCheck size={14} />
              </span>
            ) : null}
          </div>

          <div className="bubble-tools">
            <div className="popover-wrap">
              <button
                type="button"
                aria-label="Opsi pesan"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen ? (
                <div className="popover" style={{ minWidth: 180 }}>
                  <button
                    onClick={() => {
                      onReply(message);
                      setMenuOpen(false);
                    }}
                  >
                    <CornerUpLeft size={15} /> Balas
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      onDelete(message, "me");
                      setMenuOpen(false);
                    }}
                  >
                    <UserX size={15} /> Hapus untuk saya
                  </button>
                  {isMine ? (
                    <button
                      className="danger"
                      onClick={() => {
                        onDelete(message, "all");
                        setMenuOpen(false);
                      }}
                    >
                      <Trash2 size={15} /> Hapus untuk semua
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
