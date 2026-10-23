"use client";

import { ImagePlus, Loader2, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessageDTO } from "@/lib/client";

const EMOJIS = ["😀", "😂", "🥰", "😎", "🤔", "😅", "🙏", "👍", "🔥", "✨", "❤️", "🎉", "☕", "🚀", "😴", "🤝"];

interface Props {
  chatId: string;
  replyTo: MessageDTO | null;
  replyName: string;
  onCancelReply: () => void;
  onSend: (payload: { body: string; type: "text" | "image"; mediaUrl?: string }) => Promise<void>;
}

export function Composer({ chatId, replyTo, replyName, onCancelReply, onSend }: Props) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText("");
    setAttachment(null);
    setError("");
  }, [chatId]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
  }, [text]);

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
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      setAttachment({ url: data.url, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="composer" style={{ position: "relative" }}>
      {replyTo ? (
        <div className="reply-preview">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 12.5 }}>
              Membalas {replyName}
            </div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {replyTo.body.slice(0, 120)}
            </div>
          </div>
          <button className="icon-btn" onClick={onCancelReply} aria-label="Batal balas">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {attachment ? (
        <div className="attach-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.url} alt="Pratinjau lampiran" />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {attachment.name}
          </span>
          <button className="icon-btn" onClick={() => setAttachment(null)} aria-label="Hapus lampiran">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="alert error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      ) : null}

      {emojiOpen ? (
        <div className="emoji-pop">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((current) => current + emoji);
                textareaRef.current?.focus();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <div className="composer-box">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setEmojiOpen((open) => !open)}
          aria-label="Pilih emoji"
        >
          <Smile size={21} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Kirim gambar"
        >
          {uploading ? <Loader2 size={20} className="spin" /> : <ImagePlus size={21} />}
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

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Tulis pesan…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />

        <button
          type="button"
          className="send-btn"
          onClick={() => void submit()}
          disabled={sending || (!text.trim() && !attachment)}
          aria-label="Kirim pesan"
        >
          {sending ? <Loader2 size={19} className="spin" /> : <Send size={19} />}
        </button>
      </div>
    </div>
  );
}
