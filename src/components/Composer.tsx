"use client";

import {
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Smile,
  Sticker,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessageDTO } from "@/lib/client";

const EMOJI_CATEGORIES: Array<{ key: string; icon: string; items: string[] }> = [
  {
    key: "smileys",
    icon: "😀",
    items: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
      "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁",
      "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "🤬", "🤯", "😳",
      "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫡", "🤭", "🫢",
    ],
  },
  {
    key: "gestures",
    icon: "👍",
    items: [
      "👍", "👎", "👌", "🤌", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "👇", "☝️", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "🫸",
      "✍️", "💅", "🤳", "👀", "🧠", "🫀", "👋", "🤚", "✋", "🖖", "🫱", "🙋",
    ],
  },
  {
    key: "objects",
    icon: "✨",
    items: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "💯",
      "✨", "🔥", "🎉", "🎊", "🎁", "☕", "🍕", "🍔", "🍜", "🍰", "🚀", "⚡",
      "💡", "📌", "📎", "📷", "🎧", "🎵", "☀️", "🌙", "⭐", "🌈", "🌻", "🌸",
      "💻", "📱", "🕹️", "🏆", "✅", "❌", "⚠️", "💬", "🤖", "🧠", "💸", "📍",
    ],
  },
];

interface Props {
  chatId: string;
  replyTo: MessageDTO | null;
  replyName: string;
  onCancelReply: () => void;
  onNotify: (message: string) => void;
  onSend: (payload: { body: string; type: "text" | "image"; mediaUrl?: string }) => Promise<void>;
}

export function Composer({ chatId, replyTo, replyName, onCancelReply, onNotify, onSend }: Props) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiCat, setEmojiCat] = useState(EMOJI_CATEGORIES[0].key);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText("");
    setAttachment(null);
    setError("");
    setEmojiOpen(false);
    setAttachOpen(false);
  }, [chatId]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 130)}px`;
  }, [text, chatId]);

  useEffect(() => {
    if (!emojiOpen && !attachOpen) return;
    const close = () => {
      setEmojiOpen(false);
      setAttachOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [emojiOpen, attachOpen]);

  async function submit() {
    const body = text.trim();
    if (!body && !attachment) return;
    setSending(true);
    setError("");
    try {
      await onSend({
        body: body || "📷 Foto",
        type: attachment ? "image" : "text",
        mediaUrl: attachment?.url,
      });
      setText("");
      setAttachment(null);
      setEmojiOpen(false);
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesan gagal dikirim");
    } finally {
      setSending(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unggah gambar gagal");
      setAttachment({ url: data.url, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unggah gambar gagal");
    } finally {
      setUploading(false);
    }
  }

  const canSend = Boolean(text.trim() || attachment);

  return (
    <div className="wa-composer">
      {replyTo ? (
        <div className="composer-reply">
          <div className="body">
            <b>Membalas {replyName}</b>
            <span>{replyTo.body.slice(0, 120)}</span>
          </div>
          <button className="wa-icon-btn" onClick={onCancelReply} aria-label="Batal membalas">
            <X size={17} />
          </button>
        </div>
      ) : null}

      {attachment ? (
        <div className="composer-attachment">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.url} alt="Pratinjau lampiran" />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {attachment.name}
          </span>
          <button className="wa-icon-btn" onClick={() => setAttachment(null)} aria-label="Hapus lampiran">
            <X size={17} />
          </button>
        </div>
      ) : null}

      {error ? <div className="composer-error">{error}</div> : null}

      <div className="wa-composer-row">
        <div className="wa-composer-field" style={{ position: "relative" }}>
          <button
            className="composer-icon"
            aria-label="Emoji"
            onClick={(event) => {
              event.stopPropagation();
              setEmojiOpen((open) => !open);
              setAttachOpen(false);
            }}
          >
            <Smile size={23} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ketik pesan"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            aria-label="Tulis pesan"
          />

          {canSend ? (
            <button
              className="composer-send"
              aria-label="Kirim pesan"
              disabled={sending}
              onClick={(event) => {
                event.stopPropagation();
                void submit();
              }}
            >
              {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          ) : (
            <button
              className="composer-icon"
              aria-label="Lampiran"
              onClick={(event) => {
                event.stopPropagation();
                setAttachOpen((open) => !open);
                setEmojiOpen(false);
              }}
            >
              {uploading ? <Loader2 size={23} className="spin" /> : <Paperclip size={23} />}
            </button>
          )}

          {attachOpen ? (
            <div className="wa-pop" style={{ left: 0 }} onClick={(event) => event.stopPropagation()}>
              <button className="opt" onClick={() => fileRef.current?.click()}>
                <span className="opt-icon" style={{ background: "rgba(46,166,255,.14)", color: "#2ea6ff" }}>
                  <ImageIcon size={18} />
                </span>
                Foto
              </button>
              <button className="opt" onClick={() => fileRef.current?.click()}>
                <span className="opt-icon" style={{ background: "rgba(232,99,111,.14)", color: "#e8636f" }}>
                  <Camera size={18} />
                </span>
                Kamera
              </button>
              <button className="opt" onClick={() => onNotify("Lampiran dokumen belum didukung")}>
                <span className="opt-icon" style={{ background: "rgba(108,92,231,.14)", color: "#6c5ce7" }}>
                  <FileText size={18} />
                </span>
                Dokumen
              </button>
              <button className="opt" onClick={() => onNotify("Stiker belum tersedia")}>
                <span className="opt-icon" style={{ background: "rgba(37,211,102,.14)", color: "#00a884" }}>
                  <Sticker size={18} />
                </span>
                Stiker
              </button>
            </div>
          ) : null}

          {emojiOpen ? (
            <div className="wa-pop emoji-panel" onClick={(event) => event.stopPropagation()}>
              <div className="emoji-cats">
                {EMOJI_CATEGORIES.map((category) => (
                  <button
                    key={category.key}
                    className={emojiCat === category.key ? "active" : ""}
                    onClick={() => setEmojiCat(category.key)}
                    aria-label={`Emoji ${category.key}`}
                  >
                    {category.icon}
                  </button>
                ))}
              </div>
              <div className="emoji-grid">
                {EMOJI_CATEGORIES.find((category) => category.key === emojiCat)!.items.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText((current) => current + emoji);
                      textareaRef.current?.focus();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <button
          className="send-fab"
          onClick={() => (canSend ? void submit() : onNotify("Pesan suara belum tersedia di versi ini"))}
          disabled={sending}
          aria-label={canSend ? "Kirim pesan" : "Pesan suara"}
          style={canSend ? { background: "var(--green)" } : { background: "var(--green)" }}
        >
          {canSend ? <Send size={20} /> : <Mic size={20} />}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
