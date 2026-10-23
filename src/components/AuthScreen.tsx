"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, Check, Loader2, Lock, MessageSquare, Server, Sparkles } from "lucide-react";
import { api } from "@/lib/client";

interface Props {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { phone, password } : { name, phone, password };
      await api(path, { method: "POST", body: JSON.stringify(body) });
      router.refresh();
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses permintaan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand">
          <div className="mark">V</div>
          <strong>VibeChat</strong>
        </div>

        <h1>
          Obrolan yang terasa familiar,
          <br />
          dengan asisten AI di dalamnya.
        </h1>
        <p>
          Klon klien chat modern dengan penyimpanan JSON tanpa database. Pasang API key Gemini atau
          endpoint AI pribadimu, lalu biarkan asisten membalas otomatis sesuai persona yang kamu
          tulis.
        </p>

        <div className="auth-features">
          <div className="auth-feature">
            <MessageSquare size={17} />
            <div>
              <strong>Chat pribadi, grup, dan lampiran</strong>
              <span>Balas kutipan, centang dibaca, sematkan, bisukan, arsipkan, cari di dalam chat.</span>
            </div>
          </div>
          <div className="auth-feature">
            <Bot size={17} />
            <div>
              <strong>Auto-responder AI per chat</strong>
              <span>Gemini atau endpoint OpenAI-compatible, dengan persona global maupun khusus.</span>
            </div>
          </div>
          <div className="auth-feature">
            <Server size={17} />
            <div>
              <strong>Tanpa database</strong>
              <span>Satu berkas <code>data/db.json</code> dengan penulisan atomik — mudah dicadangkan.</span>
            </div>
          </div>
          <div className="auth-feature">
            <Lock size={17} />
            <div>
              <strong>API key tetap di server</strong>
              <span>Hanya status &amp; cuplikan key yang dikirim ke browser.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-side">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <h2>{mode === "login" ? "Masuk ke VibeChat" : "Buat akun baru"}</h2>
            <p className="sub">
              {mode === "login"
                ? "Nomor telepon dan password akunmu."
                : "Cukup nama, nomor, dan password. Langsung mulai."}
            </p>
          </div>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Masuk
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Daftar
            </button>
          </div>

          {mode === "register" ? (
            <div className="field">
              <label htmlFor="name">Nama tampilan</label>
              <input
                id="name"
                className="input"
                placeholder="Nama kamu"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="phone">Nomor telepon</label>
            <input
              id="phone"
              className="input"
              placeholder="6281xxxxxxxxx"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
            {mode === "login" ? "Masuk" : "Buat akun"}
          </button>

          <button
            type="button"
            className="btn ghost full"
            onClick={() => {
              setMode("login");
              setPhone("628111111111");
              setPassword("vibe123");
              setError("");
            }}
          >
            <Check size={16} /> Isi akun demo
          </button>

          <div className="demo-note">
            Akun demo: <strong>628111111111</strong> · password <strong>vibe123</strong>. Data contoh
            dibuat otomatis saat server pertama kali berjalan.
          </div>

          <p className="auth-foot">
            Reimplementasi independen untuk pembelajaran — bukan afiliasi WhatsApp/Meta.
            <br />
            Semua merek dan aset milik pemiliknya masing-masing.
          </p>
        </form>
      </section>
    </div>
  );
}
