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
  FileVideo,
  Music,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, type MessageDTO, type MessageKind } from "@/lib/client";

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

interface Attachment {
  url: string;
  name: string;
  size: number;
  mime: string;
  kind: MessageKind;
}

interface Props {
  chatId: string;
  replyTo: MessageDTO | null;
  replyName: string;
  onCancelReply: () => void;
  onNotify: (message: string) => void;
  onSend: (payload: {
    body: string;
    type: MessageKind;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => Promise<void>;
}

export function Composer({ chatId, replyTo, replyName, onCancelReply, onSend }: Props) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [emojiCat, setEmojiCat] = useState(EMOJI_CATEGORIES[0].key);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

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
        body: body.trim(),
        type: attachment?.kind ?? "text",
        mediaUrl: attachment?.url,
        fileName: attachment?.name,
        fileSize: attachment?.size,
        mimeType: attachment?.mime,
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

  async function uploadFile(file: File): Promise<Attachment | null> {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah berkas");
      return {
        url: data.url,
        name: data.name || file.name,
        size: data.size ?? file.size,
        mime: data.type || file.type,
        kind: (data.kind as MessageKind) ?? "file",
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah berkas");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function upload(file: File) {
    const result = await uploadFile(file);
    if (result) setAttachment(result);
  }

  async function startRecording() {
    setError("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Peramban ini belum mendukung pesan suara");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => stream.getTracks().forEach((track) => track.stop());
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setError("Izin mikrofon ditolak — pesan suara butuh akses mikrofon");
    }
  }

  function stopRecording(send: boolean) {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;

    if (!send) {
      recorder.stop();
      return;
    }

    const chunks = chunksRef.current;
    const stream = recorder.stream;
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
      void (async () => {
        const result = await uploadFile(new File([blob], `pesan-suara-${stamp}.webm`, { type: "audio/webm" }));
        if (!result) return;
        try {
          await onSend({
            body: "🎵 Pesan suara",
            type: "audio",
            mediaUrl: result.url,
            fileName: result.name,
            fileSize: result.size,
            mimeType: result.mime,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Pesan suara gagal dikirim");
        }
      })();
    };
    recorder.stop();
  }

  const canSend = Boolean(text.trim() || attachment);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

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
          {attachment.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.url} alt="Pratinjau lampiran" />
          ) : (
            <span className="attach-kind">{attachment.kind.toUpperCase()}</span>
          )}
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {attachment.name}
            <small style={{ display: "block", color: "var(--text-2)", fontSize: 11.5 }}>
              {formatBytes(attachment.size)}
            </small>
          </span>
          <button className="wa-icon-btn" onClick={() => setAttachment(null)} aria-label="Hapus lampiran">
            <X size={17} />
          </button>
        </div>
      ) : null}

      {recording ? (
        <div className="composer-recording">
          <span className="rec-dot" />
          <strong>Merekam {clock}</strong>
          <span>Ketuk ✓ untuk mengirim, atau buang rekaman.</span>
          <button className="btn ghost" onClick={() => stopRecording(false)}>
            Buang
          </button>
          <button className="btn primary" onClick={() => stopRecording(true)}>
            Kirim
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
              <button className="opt" onClick={() => { setAttachOpen(false); imageRef.current?.click(); }}>
                <span className="opt-icon" style={{ background: "rgba(46,166,255,.14)", color: "#2ea6ff" }}>
                  <ImageIcon size={18} />
                </span>
                Foto
              </button>
              <button className="opt" onClick={() => { setAttachOpen(false); imageRef.current?.click(); }}>
                <span className="opt-icon" style={{ background: "rgba(232,99,111,.14)", color: "#e8636f" }}>
                  <Camera size={18} />
                </span>
                Kamera
              </button>
              <button className="opt" onClick={() => { setAttachOpen(false); fileRef.current?.click(); }}>
                <span className="opt-icon" style={{ background: "rgba(108,92,231,.14)", color: "#6c5ce7" }}>
                  <FileText size={18} />
                </span>
                Dokumen
              </button>
              <button className="opt" onClick={() => { setAttachOpen(false); mediaRef.current?.click(); }}>
                <span className="opt-icon" style={{ background: "rgba(232,99,111,.14)", color: "#e8636f" }}>
                  <FileVideo size={18} />
                </span>
                Video
              </button>
              <button className="opt" onClick={() => { setAttachOpen(false); mediaRef.current?.click(); }}>
                <span className="opt-icon" style={{ background: "rgba(37,211,102,.14)", color: "#00a884" }}>
                  <Music size={18} />
                </span>
                Audio
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
          onClick={() => {
            if (canSend) void submit();
            else if (!recording) void startRecording();
            else stopRecording(true);
          }}
          disabled={sending || uploading}
          aria-label={canSend ? "Kirim pesan" : recording ? "Kirim pesan suara" : "Rekam pesan suara"}
          style={canSend ? { background: "var(--green)" } : { background: "var(--green)" }}
        >
          {canSend || recording ? <Send size={20} /> : <Mic size={20} />}
        </button>

        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <input
          ref={imageRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <input
          ref={mediaRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/ogg,audio/wav"
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
