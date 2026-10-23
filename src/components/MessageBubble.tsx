"use client";

import { Check, CheckCheck, ChevronDown, CornerUpLeft, Sparkles, Trash2, Copy, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { formatClock, type MessageDTO, type PublicUser } from "@/lib/client";

interface Props {
  message: MessageDTO;
  sender: PublicUser | undefined;
  isMine: boolean;
  showSender: boolean;
  showTail: boolean;
  replyMessage?: MessageDTO;
  replySender?: PublicUser;
  isRead: boolean;
  chatType: "dm" | "group";
  onReply: (message: MessageDTO) => void;
  onDelete: (message: MessageDTO, scope: "me" | "all") => void;
  onOpenImage: (url: string) => void;
  onJumpTo: (messageId: string) => void;
  highlight?: boolean;
}

const PALETTE = ["#e8636f", "#a78bfa", "#31a3d6", "#1fa855", "#c99516", "#d97706", "#db6bb3", "#0ea5b7"];
const memory: Record<string, string> = {};

function senderColor(id: string): string {
  if (!memory[id]) {
    let hash = 0;
    for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    memory[id] = PALETTE[hash % PALETTE.length];
  }
  return memory[id];
}

export function MessageBubble({
  message,
  sender,
  isMine,
  showSender,
  showTail,
  replyMessage,
  replySender,
  isRead,
  chatType,
  onReply,
  onDelete,
  onOpenImage,
  onJumpTo,
  highlight,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const isImageOnly = message.type === "image" && message.body === "📷 Foto";
  const holdTimer = useRef<number | null>(null);

  // long-press (mobile) untuk membuka menu opsi pesan
  function startHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setMenuOpen(true), 420);
  }

  function cancelHold() {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  return (
    <div
      id={`msg-${message.id}`}
      ref={wrapRef}
      className={`msg-row ${isMine ? "out" : "in"} ${message.viaAI ? "ai" : ""} ${showTail ? "tail" : ""} ${highlight ? "hit" : ""}`}
    >
      {!isMine && chatType === "group" ? (
        <Avatar
          name={sender?.name ?? "?"}
          color={sender?.avatarColor ?? "sky"}
          size={28}
          className="msg-avatar"
        />
      ) : null}

      <div className="msg-stack">
        {showSender && !isMine && chatType === "group" ? (
          <div className="msg-sender" style={{ color: senderColor(message.senderId) }}>
            {sender?.name ?? "Anggota"}
          </div>
        ) : null}

        <div
          className="bubble"
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onTouchMove={cancelHold}
          onContextMenu={(event) => {
            event.preventDefault();
            setMenuOpen(true);
          }}
        >
          {replyMessage ? (
            <div
              className="bubble-quote"
              role="button"
              tabIndex={0}
              onClick={() => onJumpTo(replyMessage.id)}
              onKeyDown={(event) => event.key === "Enter" && onJumpTo(replyMessage.id)}
            >
              <b>{replySender?.name ?? "Pesan"}</b>
              <span>{replyMessage.body.slice(0, 120)}</span>
            </div>
          ) : null}

          {message.type === "image" && message.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="bubble-image"
              src={message.mediaUrl}
              alt="Lampiran gambar"
              loading="lazy"
              onClick={() => onOpenImage(message.mediaUrl!)}
            />
          ) : null}

          {isImageOnly ? null : <div className="bubble-text">{message.body}</div>}

          <div className="bubble-meta">
            {message.viaAI ? (
              <span className="ai-label">
                <Sparkles size={9} /> AI
              </span>
            ) : null}
            <span>{formatClock(message.createdAt)}</span>
            {isMine ? (
              <span className={`tick ${isRead ? "read" : ""}`} title={isRead ? "Dibaca" : "Terkirim"}>
                {isRead ? <CheckCheck size={15} /> : <Check size={15} />}
              </span>
            ) : null}
          </div>

          <div className="bubble-tools" onClick={(event) => event.stopPropagation()}>
            <div className="wa-menu-wrap">
              <button
                type="button"
                aria-label="Opsi pesan"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
              >
                <ChevronDown size={15} />
              </button>
              {menuOpen ? (
                <div className="wa-menu" style={{ minWidth: 200, top: "calc(100% + 6px)" }}>
                  <button
                    onClick={() => {
                      onReply(message);
                      setMenuOpen(false);
                    }}
                  >
                    <CornerUpLeft size={16} /> Balas
                  </button>
                  <button
                    onClick={() => {
                      void navigator.clipboard?.writeText(message.body);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1200);
                      setMenuOpen(false);
                    }}
                  >
                    <Copy size={16} /> {copied ? "Tersalin" : "Salin teks"}
                  </button>
                  <button
                    onClick={() => {
                      onJumpTo(message.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Info size={16} /> Lihat detail
                  </button>
                  <hr />
                  <button
                    className="danger"
                    onClick={() => {
                      onDelete(message, "me");
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 size={16} /> Hapus untuk saya
                  </button>
                  {isMine ? (
                    <button
                      className="danger"
                      onClick={() => {
                        onDelete(message, "all");
                        setMenuOpen(false);
                      }}
                    >
                      <Trash2 size={16} /> Hapus untuk semua
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
