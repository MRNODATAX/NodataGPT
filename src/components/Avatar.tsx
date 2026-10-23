"use client";

import { initials } from "@/lib/client";

interface Member {
  name: string;
  color: string;
}

interface Props {
  name: string;
  color?: string;
  size?: number;
  members?: Member[];
  className?: string;
}

/** Avatar tunggal, atau kolase 2x2 untuk grup (gaya WhatsApp). */
export function Avatar({ name, color = "emerald", size = 44, members, className = "" }: Props) {
  const collage = members && members.length > 1;
  if (collage) {
    const tiles = members!.slice(0, 4);
    const placeholders = Math.max(0, 4 - tiles.length);
    return (
      <div
        className={`avatar-group ${className}`}
        style={{ width: size, height: size }}
        title={name}
        aria-hidden
      >
        {tiles.map((member, index) => (
          <div
            key={`${member.name}-${index}`}
            className={`avatar ${member.color}`}
            style={{ width: "100%", height: "100%", fontSize: Math.max(8, Math.round(size * 0.2)) }}
          >
            {initials(member.name)}
          </div>
        ))}
        {Array.from({ length: placeholders }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="avatar"
            style={{ width: "100%", height: "100%", background: "var(--active)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`avatar ${color} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
      title={name}
      aria-hidden
    >
      {color === "ai" ? null : initials(name)}
    </div>
  );
}
