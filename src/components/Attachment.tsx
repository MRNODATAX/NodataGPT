"use client";

import { Download, FileArchive, FileSpreadsheet, FileText, FileVideo, Music, Presentation } from "lucide-react";
import { formatBytes } from "@/lib/client";

interface Props {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
  isMine: boolean;
}

const ICONS = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  zip: FileArchive,
  video: FileVideo,
  audio: Music,
  other: FileText,
} as const;

function pickIcon(name = "", mime = "") {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return ICONS.pdf;
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext)) return ICONS.doc;
  if (["xls", "xlsx", "csv"].includes(ext)) return ICONS.sheet;
  if (["ppt", "pptx"].includes(ext)) return ICONS.slide;
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext)) return ICONS.zip;
  if (mime.startsWith("video/")) return ICONS.video;
  if (mime.startsWith("audio/")) return ICONS.audio;
  return ICONS.other;
}

/** Kartu lampiran dokumen dengan tombol unduh (gaya WhatsApp Web). */
export function FileCard({ url, name = "Dokumen", size, mime = "", isMine }: Props) {
  const Icon = pickIcon(name, mime);
  const accent = isMine ? "var(--green-deep)" : "var(--green)";

  return (
    <a className="file-card" href={url} download={name} target="_blank" rel="noreferrer">
      <span className="file-icon" style={{ color: accent }}>
        <Icon size={22} />
      </span>
      <span className="file-meta">
        <strong title={name}>{name}</strong>
        <span>
          {formatBytes(size)}
          {size ? " · " : ""}
          {name.split(".").pop()?.toUpperCase() ?? "FILE"}
        </span>
      </span>
      <span className="file-download" aria-hidden>
        <Download size={17} />
      </span>
    </a>
  );
}

/** Pemutar audio ringkas untuk pesan suara. */
export function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="audio-bubble">
      <span className="audio-icon">
        <Music size={16} />
      </span>
      <audio src={url} controls preload="metadata" />
    </div>
  );
}

/** Video dengan kontrol bawaan browser. */
export function VideoPlayer({ url }: { url: string }) {
  return <video className="bubble-video" src={url} controls preload="metadata" playsInline />;
}
