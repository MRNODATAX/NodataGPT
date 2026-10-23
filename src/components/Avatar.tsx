"use client";

import { initials } from "@/lib/client";

interface Props {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, color = "emerald", size = 44, className = "" }: Props) {
  return (
    <div
      className={`avatar ${color} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.36)),
        borderRadius: color === "ai" ? "50%" : "50%",
      }}
      title={name}
      aria-hidden
    >
      {color === "ai" ? null : initials(name)}
    </div>
  );
}
