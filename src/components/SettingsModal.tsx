import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { AppSettings, RouterPresetId } from '../types/chat';
import { AI_MODELS } from '../services/modelCatalog';
import {
  ROUTER_MODEL_PREFIX,
  ROUTER_PRESETS,
  ROUTER_PRIMARY_MODEL_ID,
  cleanRouterApiKey,
  detectRouterProviderFromKey,
  discoverRouterModels,
  normalizeRouterBaseUrl,
} from '../services/routerGateway';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  conversationCount: number;
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onReplaySplash: () => void;
  onClearAllChats: () => void;
}

export function SettingsModal({
  isOpen,
  settings,
  conversationCount,
  onClose,
  onUpdateSettings,
  onReplaySplash,
  onClearAllChats,
}: SettingsModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [showRouterKey, setShowRouterKey] = useState(false);
  const [routerTesting, setRouterTesting] = useState(false);
  const [routerModelSearch, setRouterModelSearch] = useState('');
  const [routerTestResult, setRouterTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const latestSettingsRef = useRef(settings);
  latestSettingsRef.current = settings;
  const lastAutoSyncedSigRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      setRouterTestResult(null);
      setRouterModelSearch('');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Automatic debounced model sync whenever user pastes/changes a router API key (`>= 12` chars)
  useEffect(() => {
    if (!isOpen) return;
    const cleanKey = cleanRouterApiKey(settings.routerApiKey);
    if (cleanKey.length < 12) return;

    const keyCheck = detectRouterProviderFromKey(cleanKey);
    if (keyCheck.warning) {
      setRouterTestResult({ ok: false, message: keyCheck.warning });
      return;
    }

    const sig = `${settings.routerPreset}|${settings.routerBaseUrl.trim()}|${cleanKey}`;
    if (
      lastAutoSyncedSigRef.current === sig &&
      settings.routerDiscoveredModels.length > 0
    ) {
      return;
    }

    const abortCtrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setRouterTesting(true);
      try {
        const cur = latestSettingsRef.current;
        const res = await discoverRouterModels({
          baseUrl: cur.routerBaseUrl,
          apiKey: cur.routerApiKey,
          preset: cur.routerPreset,
          signal: abortCtrl.signal,
        });
        if (abortCtrl.signal.aborted) return;
        lastAutoSyncedSigRef.current = `${res.detectedPreset || cur.routerPreset}|${res.normalizedBaseUrl}|${cleanRouterApiKey(cur.routerApiKey)}`;

        if (res.ok) {
          const latest = latestSettingsRef.current;
          const curModel = latest.routerModel.trim();
          const nextModel =
            res.models.length > 0
              ? curModel && res.models.includes(curModel)
                ? curModel
                : res.models[0]
              : curModel || ROUTER_PRESETS[latest.routerPreset].defaultModel;
          const nextImgModel =
            res.imageModels &&
            res.imageModels.length > 0 &&
            (!latest.routerImageModel.trim() ||
              !res.imageModels.includes(latest.routerImageModel.trim()))
              ? res.imageModels[0]
              : latest.routerImageModel;

          const staleRouterSel =
            latest.selectedModelId.startsWith(ROUTER_MODEL_PREFIX) &&
            res.models.length > 0 &&
            !res.models.includes(
              latest.selectedModelId.slice(ROUTER_MODEL_PREFIX.length)
            );

          onUpdateSettings({
            ...latest,
            routerEnabled: true,
            routerPreset: res.detectedPreset || latest.routerPreset,
            routerBaseUrl: res.normalizedBaseUrl,
            routerModel: nextModel,
            routerImageModel: nextImgModel,
            routerDiscoveredModels: res.models,
            selectedModelId:
              latest.selectedModelId === 'auto' || staleRouterSel
                ? ROUTER_PRIMARY_MODEL_ID
                : latest.selectedModelId,
          });
          setRouterTestResult({
            ok: true,
            message: [
              res.models.length > 0
                ? `Terhubung ke ${res.detectedProviderName || res.normalizedBaseUrl} (${res.latencyMs} ms · ${res.usedRelay ? 'Cloud Relay' : 'Langsung Browser'}). Tersinkron ${res.models.length} model sesuai kunci Anda (aktif: ${nextModel}).`
                : `Terhubung ke ${res.normalizedBaseUrl} (${res.latencyMs} ms).`,
              res.keyNote || '',
            ]
              .filter(Boolean)
              .join(' '),
          });
        } else {
          setRouterTestResult({
            ok: false,
            message: res.error || 'Gagal menyinkronkan model dari kunci API ini.',
          });
        }
      } catch {
        // Ignore aborted background sync
      } finally {
        if (!abortCtrl.signal.aborted) {
          setRouterTesting(false);
        }
      }
    }, 850);

    return () => {
      window.clearTimeout(timer);
      abortCtrl.abort();
    };
  }, [
    isOpen,
    settings.routerApiKey,
    settings.routerBaseUrl,
    settings.routerPreset,
    settings.routerDiscoveredModels.length,
    onUpdateSettings,
  ]);

  const activePreset = ROUTER_PRESETS[settings.routerPreset] || ROUTER_PRESETS['9router'];
  const discoveredCount = settings.routerDiscoveredModels.length;

  const combinedModelChips = useMemo(() => {
    const sourceList =
      discoveredCount > 0
        ? settings.routerDiscoveredModels
        : activePreset.suggestedModels;
    const q = routerModelSearch.trim().toLowerCase();
    const filtered = q
      ? sourceList.filter((m) => m.toLowerCase().includes(q))
      : sourceList;
    return filtered.slice(0, 80);
  }, [
    discoveredCount,
    settings.routerDiscoveredModels,
    activePreset.suggestedModels,
    routerModelSearch,
  ]);

  if (!isOpen) return null;

  const handleSelectRouterPreset = (presetId: RouterPresetId) => {
    const preset = ROUTER_PRESETS[presetId];
    setRouterTestResult(null);
    setRouterModelSearch('');
    onUpdateSettings({
      ...settings,
      routerPreset: presetId,
      routerBaseUrl: preset.defaultBaseUrl,
      routerModel: preset.defaultModel,
      routerDiscoveredModels: [],
    });
  };

  const handleTestRouterConnection = async () => {
    setRouterTesting(true);
    setRouterTestResult(null);
    try {
      const res = await discoverRouterModels({
        baseUrl: settings.routerBaseUrl,
        apiKey: settings.routerApiKey,
        preset: settings.routerPreset,
      });

      if (res.ok) {
        const curModel = settings.routerModel.trim();
        const nextModel =
          res.models.length > 0
            ? curModel && res.models.includes(curModel)
              ? curModel
              : res.models[0]
            : curModel || activePreset.defaultModel;
        const nextImgModel =
          res.imageModels &&
          res.imageModels.length > 0 &&
          (!settings.routerImageModel.trim() ||
            !res.imageModels.includes(settings.routerImageModel.trim()))
            ? res.imageModels[0]
            : settings.routerImageModel;

        const staleRouterSel =
          settings.selectedModelId.startsWith(ROUTER_MODEL_PREFIX) &&
          res.models.length > 0 &&
          !res.models.includes(
            settings.selectedModelId.slice(ROUTER_MODEL_PREFIX.length)
          );

        lastAutoSyncedSigRef.current = `${res.detectedPreset || settings.routerPreset}|${res.normalizedBaseUrl}|${cleanRouterApiKey(settings.routerApiKey)}`;

        onUpdateSettings({
          ...settings,
          routerEnabled: true,
          routerPreset: res.detectedPreset || settings.routerPreset,
          routerBaseUrl: res.normalizedBaseUrl,
          routerModel: nextModel,
          routerImageModel: nextImgModel,
          routerDiscoveredModels: res.models,
          selectedModelId:
            settings.selectedModelId === 'auto' || staleRouterSel
              ? ROUTER_PRIMARY_MODEL_ID
              : settings.selectedModelId,
        });
        setRouterTestResult({
          ok: true,
          message: [
            res.models.length > 0
              ? `Terhubung ke ${res.detectedProviderName || res.normalizedBaseUrl} (${res.latencyMs} ms · ${res.usedRelay ? 'Cloud Relay' : 'Langsung Browser'}). Ditemukan ${res.models.length} model sesuai kunci Anda!`
              : `Terhubung ke ${res.normalizedBaseUrl} (${res.latencyMs} ms). Gateway siap digunakan.`,
            res.keyNote || '',
          ]
            .filter(Boolean)
            .join(' '),
        });
      } else {
        setRouterTestResult({
          ok: false,
          message: res.error || 'Gagal terhubung ke AI Router.',
        });
      }
    } catch (err) {
      setRouterTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menguji koneksi AI Router.',
      });
    } finally {
      setRouterTesting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nodatagpt-settings-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="nd-glass-sheet animate-sheet-up flex max-h-[88dvh] w-full flex-col rounded-t-[26px] sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:py-4">
          <h2
            id="nodatagpt-settings-title"
            className="font-display text-base font-bold text-white sm:text-lg"
          >
            Pengaturan NodataGPT
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#CBD5E1] hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-safe flex-1 space-y-4 overflow-y-auto p-5">
          {/* Live Starfield & Shooting Stars */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                <span>Langit Malam & Bintang Jatuh Live</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Latar bintang berkelip dan meteor melintas hemat baterai di balik panel kaca.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.starfieldEnabled}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  starfieldEnabled: !settings.starfieldEnabled,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.starfieldEnabled ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.starfieldEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Typewriter Stream Effect + Live Seconds Timer */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Animasi Ketik AI & Timer Detik Live
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Tampilkan efek mengetik bertahap ala mesin ketik beserta hitungan detik real-time saat menulis.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.streamEffect}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  streamEffect: !settings.streamEffect,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.streamEffect ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.streamEffect ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Replay Opening Animation */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Animasi Pembuka NodataGPT
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Putar ulang animasi loading pembuka NodataGPT kapan saja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplaySplash();
              }}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-3 py-1.5 text-xs font-semibold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/22 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Putar Ulang</span>
            </button>
          </div>

          {/* Auto Fallback */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-Fallback Chat Multi-Server
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Otomatis beralih ke model chat sehat berikutnya bila server yang dipilih sibuk.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoFallback}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  autoFallback: !settings.autoFallback,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.autoFallback ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.autoFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Image Auto Fallback */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Auto-Fallback Model Gambar AI
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Otomatis beralih ke mesin pembuat gambar sehat lain jika model gambar pilihan gagal atau padat.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.imageAutoFallback}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  imageAutoFallback: !settings.imageAutoFallback,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.imageAutoFallback ? 'bg-[#EA580C]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.imageAutoFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Memory Context */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Ingatan Konteks Percakapan
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Sertakan ringkasan pesan sebelumnya agar diskusi tetap nyambung.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.memoryContextEnabled}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  memoryContextEnabled: !settings.memoryContextEnabled,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.memoryContextEnabled ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.memoryContextEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Enter to Send */}
          <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">
                Kirim dengan Tombol Enter (Desktop)
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#94A3B8]">
                Tekan Enter untuk mengirim dan Shift + Enter untuk baris baru.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enterToSend}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  enterToSend: !settings.enterToSend,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                settings.enterToSend ? 'bg-[#0E7490]' : 'bg-white/20'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.enterToSend ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Global NodataGPT Personalization */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="nodatagpt-persona-input"
                className="block text-sm font-medium text-white"
              >
                Personalisasi Global NodataGPT
              </label>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/12 px-2.5 py-0.5 font-mono-code text-[10px] font-semibold text-[#67E8F9]">
                Aktif di {AI_MODELS.length - 1} Model · Mr.NODATA
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Identitas resmi sebagai asisten AI NodataGPT buatan Mr.NODATA otomatis diterapkan ke seluruh model AI yang dipanggil. Anda juga dapat menambahkan preferensi gaya bicara di bawah ini:
            </p>
            <textarea
              id="nodatagpt-persona-input"
              rows={2}
              value={settings.customPersona}
              onChange={(e) =>
                onUpdateSettings({ ...settings, customPersona: e.target.value })
              }
              placeholder="Opsional: Tambahkan gaya khusus (misal: gunakan gaya santai, sertakan analogi praktis, atau fokus pada TypeScript)..."
              className="w-full rounded-xl border border-white/10 bg-black/45 p-2.5 text-xs leading-relaxed text-white placeholder-[#94A3B8] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          {/* AI Router Gateway (9Router, OmniRoute, OpenRouter, Custom OpenAI-Compatible) */}
          <div className="space-y-3 rounded-2xl border border-[#22D3EE]/30 bg-gradient-to-br from-[#081322]/90 via-[#070E1A]/90 to-[#180E08]/80 p-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Network className="h-4 w-4 shrink-0 text-[#22D3EE]" />
                  <span className="font-display text-sm font-bold text-white">
                    AI Router Gateway (9Router &amp; OmniRoute)
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono-code text-[10px] font-semibold ${
                      settings.routerEnabled
                        ? 'border-[#22D3EE]/45 bg-[#22D3EE]/15 text-[#67E8F9]'
                        : 'border-white/15 bg-white/[0.04] text-[#94A3B8]'
                    }`}
                  >
                    {settings.routerEnabled ? 'Aktif · Prioritas 0' : 'Nonaktif'}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#CBD5E1]">
                  Hubungkan API Key &amp; Base URL dari{' '}
                  <strong className="text-[#67E8F9]">9Router</strong>,{' '}
                  <strong className="text-[#FDBA74]">OmniRoute</strong>,{' '}
                  OpenRouter, atau gateway OpenAI-compatible kustom (lokal{' '}
                  <code className="font-mono-code text-[#F8FAFC]">:20128/v1</code>{' '}
                  maupun Cloud/VPS) lengkap dengan persona NodataGPT &amp; Auto-Fallback.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Aktifkan AI Router Gateway"
                aria-checked={settings.routerEnabled}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    routerEnabled: !settings.routerEnabled,
                    selectedModelId: !settings.routerEnabled
                      ? ROUTER_PRIMARY_MODEL_ID
                      : settings.selectedModelId === ROUTER_PRIMARY_MODEL_ID
                        ? 'auto'
                        : settings.selectedModelId,
                  })
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                  settings.routerEnabled ? 'bg-[#0E7490]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.routerEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Preset Tabs */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(['9router', 'omniroute', 'openrouter', 'custom'] as RouterPresetId[]).map(
                (presetId) => {
                  const p = ROUTER_PRESETS[presetId];
                  const isActive = settings.routerPreset === presetId;
                  return (
                    <button
                      key={presetId}
                      type="button"
                      onClick={() => handleSelectRouterPreset(presetId)}
                      className={`rounded-xl border px-2.5 py-2 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-white shadow-[0_0_14px_rgba(34,211,238,0.16)]'
                          : 'border-white/10 bg-black/45 text-[#CBD5E1] hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="mt-0.5 truncate font-mono-code text-[9.5px] text-[#94A3B8]">
                        {p.badge}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-[#94A3B8]">
              {activePreset.description}
            </p>

            {/* Quick Endpoint Chips */}
            <div className="flex flex-wrap gap-1.5">
              {activePreset.endpointChips.map((chip) => {
                const isSelectedUrl =
                  normalizeRouterBaseUrl(settings.routerBaseUrl, settings.routerPreset) ===
                  chip.url;
                return (
                  <button
                    key={chip.url}
                    type="button"
                    onClick={() => {
                      setRouterTestResult(null);
                      onUpdateSettings({
                        ...settings,
                        routerBaseUrl: chip.url,
                        routerDiscoveredModels: [],
                      });
                    }}
                    className={`rounded-lg border px-2 py-1 font-mono-code text-[10.5px] transition-colors cursor-pointer ${
                      isSelectedUrl
                        ? 'border-[#FB923C]/60 bg-[#FB923C]/18 text-[#FED7AA]'
                        : 'border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Base URL */}
            <div>
              <label
                htmlFor="router-base-url-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
              >
                Endpoint Base URL ({activePreset.name})
              </label>
              <input
                id="router-base-url-input"
                type="url"
                value={settings.routerBaseUrl}
                onChange={(e) => {
                  setRouterTestResult(null);
                  onUpdateSettings({
                    ...settings,
                    routerBaseUrl: e.target.value,
                    routerDiscoveredModels: [],
                  });
                }}
                onBlur={() =>
                  onUpdateSettings({
                    ...settings,
                    routerBaseUrl: normalizeRouterBaseUrl(
                      settings.routerBaseUrl,
                      settings.routerPreset
                    ),
                  })
                }
                placeholder={activePreset.defaultBaseUrl}
                className="h-9 w-full rounded-lg border border-white/12 bg-black/60 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>

            {/* Router API Key */}
            <div>
              <label
                htmlFor="router-api-key-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
              >
                API Key {activePreset.name} (Auto-Deteksi Penyedia &amp; Sinkron Model)
              </label>
              <div className="relative">
                <input
                  id="router-api-key-input"
                  type={showRouterKey ? 'text' : 'password'}
                  value={settings.routerApiKey}
                  onChange={(e) => {
                    const rawNextKey = e.target.value;
                    const detected = detectRouterProviderFromKey(rawNextKey);
                    setRouterTestResult(
                      detected.warning
                        ? { ok: false, message: detected.warning }
                        : null
                    );

                    // If user pasted a tokenized URL straight into the key box
                    if (detected.detected && detected.extractedKey === '' && detected.baseUrl) {
                      onUpdateSettings({
                        ...settings,
                        routerPreset: detected.preset || settings.routerPreset,
                        routerBaseUrl: detected.baseUrl,
                        routerApiKey: '',
                        routerEnabled: true,
                        routerDiscoveredModels: [],
                      });
                      return;
                    }

                    const nextPreset = detected.preset || settings.routerPreset;
                    const nextBaseUrl = detected.baseUrl || settings.routerBaseUrl;
                    const nextDefaultModel =
                      detected.defaultModel && settings.routerPreset !== nextPreset
                        ? detected.defaultModel
                        : settings.routerModel;

                    onUpdateSettings({
                      ...settings,
                      routerPreset: nextPreset,
                      routerBaseUrl: nextBaseUrl,
                      routerModel: nextDefaultModel,
                      routerApiKey: rawNextKey,
                      routerDiscoveredModels: [],
                      routerEnabled:
                        rawNextKey.trim().length > 0 ? true : settings.routerEnabled,
                    });
                  }}
                  onBlur={() => {
                    const cleaned = cleanRouterApiKey(settings.routerApiKey);
                    if (cleaned !== settings.routerApiKey) {
                      onUpdateSettings({
                        ...settings,
                        routerApiKey: cleaned,
                      });
                    }
                  }}
                  placeholder={activePreset.keyPlaceholder}
                  className="h-9 w-full rounded-lg border border-white/12 bg-black/60 pr-10 pl-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRouterKey((s) => !s)}
                  aria-label={showRouterKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                  className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  {showRouterKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Router Chat Model / Combo */}
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label
                  htmlFor="router-model-input"
                  className="block text-xs font-medium text-[#CBD5E1]"
                >
                  Model / Combo Aktif ({discoveredCount > 0 ? `${discoveredCount} dari API Key Anda` : 'Contoh Preset'})
                </label>
                {discoveredCount > 0 && (
                  <span className="font-mono-code text-[10px] text-[#67E8F9]">
                    100% Sesuai API Key
                  </span>
                )}
              </div>
              <input
                id="router-model-input"
                type="text"
                value={settings.routerModel}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    routerModel: e.target.value,
                  })
                }
                placeholder={activePreset.defaultModel}
                className="h-9 w-full rounded-lg border border-white/12 bg-black/60 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />

              {/* Instant Search Filter when API Key has > 8 models */}
              {discoveredCount > 8 && (
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="search"
                    value={routerModelSearch}
                    onChange={(e) => setRouterModelSearch(e.target.value)}
                    placeholder={`Cari dari ${discoveredCount} model yang tersedia di API Key Anda...`}
                    className="h-8 w-full rounded-lg border border-white/10 bg-black/50 pr-2.5 pl-8 font-mono-code text-[11px] text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                  />
                </div>
              )}

              {/* Strictly Key-Scoped Discovered Model Chips (or examples only before sync) */}
              {combinedModelChips.length > 0 && (
                <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                  {combinedModelChips.map((modelId) => {
                    const selected = settings.routerModel.trim() === modelId;
                    return (
                      <button
                        key={modelId}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            routerEnabled: true,
                            routerModel: modelId,
                            selectedModelId: ROUTER_PRIMARY_MODEL_ID,
                          })
                        }
                        className={`rounded-md border px-2 py-0.5 font-mono-code text-[10px] transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#22D3EE] bg-[#22D3EE]/20 text-white'
                            : 'border-white/10 bg-black/45 text-[#94A3B8] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {modelId}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Optional Router Image Model */}
            <div>
              <label
                htmlFor="router-image-model-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
              >
                Model Gambar Router Opsional (/v1/images/generations)
              </label>
              <input
                id="router-image-model-input"
                type="text"
                value={settings.routerImageModel}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    routerImageModel: e.target.value,
                  })
                }
                placeholder="Opsional, misal: openai/gpt-image-2 atau kosongkan"
                className="h-9 w-full rounded-lg border border-white/12 bg-black/60 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#FB923C] focus:outline-none"
              />
            </div>

            {/* Test Connection & Discover /v1/models Button */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={routerTesting}
                onClick={handleTestRouterConnection}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#0E7490] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.2)] transition-colors hover:bg-[#0891B2] disabled:opacity-60 cursor-pointer"
              >
                {routerTesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>
                  {routerTesting
                    ? 'Menguji /v1/models...'
                    : 'Tes Koneksi & Muat /v1/models'}
                </span>
              </button>

              {settings.routerDiscoveredModels.length > 0 && (
                <span className="font-mono-code text-[11px] text-[#67E8F9]">
                  {settings.routerDiscoveredModels.length} model termuat
                </span>
              )}
            </div>

            {routerTestResult && (
              <div
                className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs leading-relaxed ${
                  routerTestResult.ok
                    ? 'border-[#22D3EE]/40 bg-[#22D3EE]/12 text-[#CFFAFE]'
                    : 'border-[#FB923C]/45 bg-[#FB923C]/12 text-[#FED7AA]'
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    routerTestResult.ok ? 'text-[#22D3EE]' : 'text-[#FB923C]'
                  }`}
                />
                <span>{routerTestResult.message}</span>
              </div>
            )}
          </div>

          {/* Optional Personal API Keys */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
              <KeyRound className="h-4 w-4" />
              <span>Kunci API Pribadi (Opsional, Prioritas 0)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#94A3B8]">
              Disimpan lokal di perangkat Anda saja. Kosongkan bila ingin memakai{' '}
              {AI_MODELS.filter((m) => m.id !== 'auto' && !m.requiresKey).length} model tanpa kunci.
            </p>
            <div>
              <label
                htmlFor="gemini-key-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
              >
                Google AI Studio API Key (Gemini 2.5 Flash)
              </label>
              <input
                id="gemini-key-input"
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, geminiApiKey: e.target.value })
                }
                placeholder="AIzaSy..."
                className="h-9 w-full rounded-lg border border-white/10 bg-black/55 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="deepseek-key-input"
                className="mb-1 block text-xs font-medium text-[#CBD5E1]"
              >
                DeepSeek Official API Key
              </label>
              <input
                id="deepseek-key-input"
                type="password"
                value={settings.deepseekApiKey}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, deepseekApiKey: e.target.value })
                }
                placeholder="sk-..."
                className="h-9 w-full rounded-lg border border-white/10 bg-black/55 px-3 font-mono-code text-xs text-white placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
          </div>

          {/* Clear History */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-white">Data Percakapan Lokal</p>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Tersimpan {conversationCount} percakapan di peramban ini.
            </p>

            {!confirmClear ? (
              <button
                type="button"
                disabled={conversationCount === 0}
                onClick={() => setConfirmClear(true)}
                className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/12 px-3.5 py-2 text-xs font-semibold text-[#FB923C] transition-colors hover:bg-[#FB923C]/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Semua Riwayat</span>
              </button>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllChats();
                    setConfirmClear(false);
                  }}
                  className="inline-flex min-h-[42px] items-center rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#F97316] cursor-pointer"
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex min-h-[42px] items-center rounded-xl border border-white/20 px-3.5 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
