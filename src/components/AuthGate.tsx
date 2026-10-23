"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AuthScreen } from "./AuthScreen";

export function AuthGate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      {pending ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 14,
          }}
        >
          Memuat VibeChat…
        </div>
      ) : null}
      <AuthScreen
        onAuthenticated={() => {
          startTransition(() => {
            router.refresh();
          });
        }}
      />
    </>
  );
}
