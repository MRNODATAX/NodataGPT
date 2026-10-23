"use client";

import { useState } from "react";
import { Bot, Check, Loader2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/client";

interface Props {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
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
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses permintaan");
    } finally {
      setBusy(false);
    }
  }

  function useDemo() {
    setMode("login");
    setPhone("628111111111");
    setPassword("vibe123");
    setError("");
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand-mark" style={{ width: 52, height: 52, fontSize: 24, borderRadius: 16 }}>
          V
        </div>
        <h1>
          Ngobrol santai,
          <br />
          dibalas otomatis oleh AI.
        </h1>
        <p>
          VibeChat adalah klon aplikasi chat modern yang berjalan tanpa database —
          semua percakapan disimpan dalam satu berkas JSON. Tambahkan API key Gemini
          atau endpoint AI pribadimu untuk mengaktifkan auto-responder.
        </p>
        <div className="hero-list">
          <div>
            <MessageSquare size={17} />
            <span>Chat pribadi & grup, balas pesan, kirim gambar, arsip, dan pin chat.</span>
          </div>
          <div>
            <Bot size={17} />
            <span>Auto-responder AI per chat dengan persona yang bisa kamu atur sendiri.</span>
          </div>
          <div>
            <ShieldCheck size={17} />
            <span>API key disimpan di server dan tidak pernah dikirim utuh ke browser.</span>
          </div>
          <div>
            <Check size={17} />
            <span>Penyimpanan JSON atomik: tanpa install database, mudah di-backup.</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <h2>Masuk ke VibeChat</h2>
            <p className="sub">
              {mode === "login"
                ? "Gunakan nomor telepon dan password akunmu."
                : "Buat akun baru, langsung mulai ngobrol."}
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
              <label htmlFor="name">Nama</label>
              <input
                id="name"
                className="input"
                placeholder="Nama tampilan"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setPhone(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
            {mode === "login" ? "Masuk" : "Buat akun"}
          </button>

          <button type="button" className="btn ghost full" onClick={useDemo}>
            Gunakan akun demo
          </button>

          <p className="demo-note">
            Akun demo: <strong>628111111111</strong> / password <strong>vibe123</strong>.
            Data contoh diisi otomatis saat server pertama kali dijalankan
            (<code>data/db.json</code>).
          </p>
        </form>
      </section>
    </div>
  );
}
