"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, KeyRound, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Modal, SwitchRow } from "./Modal";
import { api, type AISettingsDTO } from "@/lib/client";

const PRESETS = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-flash",
    label: "Google Gemini",
    hint: "Buat API key gratis di aistudio.google.com/apikey. Endpoint default: generativelanguage.googleapis.com",
  },
  custom: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    label: "Endpoint AI kustom",
    hint: "Kompatibel dengan OpenAI Chat Completions: OpenAI, OpenRouter, Groq, Ollama, LM Studio, dsb.",
  },
} as const;

const DEFAULT_PERSONA =
  "Kamu adalah rekan chat yang ramah dan santai. Balas 1-3 kalimat, natural, boleh emoji secukupnya, dan jangan mengaku sebagai AI.";

interface Props {
  onClose: () => void;
  onSaved: (settings: AISettingsDTO) => void;
}

export function AISettingsModal({ onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AISettingsDTO | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<{ reply: string; latencyMs: number; model: string } | null>(
    null,
  );

  useEffect(() => {
    void api<{ settings: AISettingsDTO }>("/api/settings/ai")
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat pengaturan"));
  }, []);

  function patch(partial: Partial<AISettingsDTO>) {
    setSettings((current) => (current ? { ...current, ...partial } : current));
  }

  async function save(enabledOverride?: boolean) {
    if (!settings) return;
    setSaving(true);
    setError("");
    setTestResult(null);
    try {
      const body: Record<string, unknown> = {
        enabled: enabledOverride ?? settings.enabled,
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        replyDelayMs: settings.replyDelayMs,
        contextMessages: settings.contextMessages,
      };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      const data = await api<{ settings: AISettingsDTO }>("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setSettings(data.settings);
      setApiKey("");
      onSaved(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      if (apiKey.trim()) {
        await api("/api/settings/ai", {
          method: "PUT",
          body: JSON.stringify({
            enabled: false,
            apiKey: apiKey.trim(),
            provider: settings?.provider,
            baseUrl: settings?.baseUrl,
            model: settings?.model,
          }),
        });
        setApiKey("");
      }
      const data = await api<{ reply: string; latencyMs: number; model: string }>(
        "/api/settings/ai/test",
        { method: "POST", body: JSON.stringify({}) },
      );
      setTestResult(data);
      const refreshed = await api<{ settings: AISettingsDTO }>("/api/settings/ai");
      setSettings(refreshed.settings);
      onSaved(refreshed.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uji koneksi gagal");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Modal
      title="Auto Responder AI"
      onClose={onClose}
      maxWidth={620}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={saving}>
            Tutup
          </button>
          <button className="btn primary" onClick={() => void save()} disabled={saving || !settings}>
            {saving ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
            Simpan pengaturan
          </button>
        </>
      }
    >
      {!settings ? (
        <div className="modal-body">
          <div className="skeleton" style={{ height: 90 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
      ) : (
        <div className="modal-body">
          <SwitchRow
            checked={settings.enabled}
            onChange={(next) => {
              patch({ enabled: next });
              void save(next);
            }}
            label="Aktifkan auto-responder"
            description="Saat aktif, chat yang memiliki auto-reply akan dibalas AI secara otomatis."
          />

          {settings.keyFromEnv ? (
            <div className="alert info">
              Terdeteksi API key dari variabel environment. Kamu bisa mengosongkan kolom di bawah
              untuk memakai nilai tersebut.
            </div>
          ) : null}

          <div className="field">
            <label>Provider</label>
            <div className="segmented">
              {(["gemini", "custom"] as const).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className={settings.provider === provider ? "active" : ""}
                  onClick={() =>
                    patch({
                      provider,
                      baseUrl: PRESETS[provider].baseUrl,
                      model: PRESETS[provider].model,
                    })
                  }
                >
                  {PRESETS[provider].label}
                </button>
              ))}
            </div>
            <span className="hint">{PRESETS[settings.provider].hint}</span>
          </div>

          <div className="field">
            <label htmlFor="apikey">
              <KeyRound size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              API key
            </label>
            <input
              id="apikey"
              className="input"
              type="password"
              placeholder={settings.hasApiKey ? `Tersimpan: ${settings.apiKeyPreview}` : "Masukkan API key"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
            />
            <span className="hint">
              Key hanya disimpan di server (<code>data/db.json</code>) dan tidak pernah dikirim utuh
              ke browser.
            </span>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="baseurl">Base URL</label>
              <input
                id="baseurl"
                className="input"
                value={settings.baseUrl}
                onChange={(event) => patch({ baseUrl: event.target.value })}
                placeholder="https://generativelanguage.googleapis.com"
              />
            </div>
            <div className="field">
              <label htmlFor="model">Model</label>
              <input
                id="model"
                className="input"
                value={settings.model}
                onChange={(event) => patch({ model: event.target.value })}
                placeholder="gemini-2.5-flash"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="prompt">Persona global (system prompt)</label>
            <textarea
              id="prompt"
              className="textarea"
              value={settings.systemPrompt}
              onChange={(event) => patch({ systemPrompt: event.target.value })}
              placeholder={DEFAULT_PERSONA}
            />
            <span className="hint">
              Digunakan untuk semua chat. Di panel info chat kamu bisa menambahkan persona khusus
              per chat.
            </span>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="temp">Kreativitas (temperature): {settings.temperature.toFixed(2)}</label>
              <input
                id="temp"
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={settings.temperature}
                onChange={(event) => patch({ temperature: Number(event.target.value) })}
              />
            </div>
            <div className="field">
              <label htmlFor="maxTokens">Maks token balasan</label>
              <input
                id="maxTokens"
                className="input"
                type="number"
                min={64}
                max={8192}
                value={settings.maxTokens}
                onChange={(event) => patch({ maxTokens: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="delay">Jeda mengetik (ms)</label>
              <input
                id="delay"
                className="input"
                type="number"
                min={0}
                max={15000}
                step={100}
                value={settings.replyDelayMs}
                onChange={(event) => patch({ replyDelayMs: Number(event.target.value) })}
              />
              <span className="hint">Biar balasan terasa lebih manusiawi.</span>
            </div>
            <div className="field">
              <label htmlFor="context">Konteks pesan</label>
              <input
                id="context"
                className="input"
                type="number"
                min={2}
                max={100}
                value={settings.contextMessages}
                onChange={(event) => patch({ contextMessages: Number(event.target.value) })}
              />
              <span className="hint">Jumlah pesan terakhir yang dikirim ke model.</span>
            </div>
          </div>

          {error ? <div className="alert error">{error}</div> : null}
          {testResult ? (
            <div className="alert success">
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} /> Koneksi berhasil
              </strong>{" "}
              ({testResult.model}, {testResult.latencyMs} ms)
              <br />
              <span style={{ fontStyle: "italic" }}>&ldquo;{testResult.reply}&rdquo;</span>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn ghost" onClick={() => void test()} disabled={testing || saving}>
              {testing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              Uji koneksi
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => patch({ systemPrompt: DEFAULT_PERSONA })}
            >
              <Bot size={16} /> Pakai persona default
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
