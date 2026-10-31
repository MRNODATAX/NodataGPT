import type { AppSettings } from '../types/chat';

export const FREE_TRIAL_LIMIT = 5;
export const WHATSAPP_DISPLAY_NUMBER = '0881-0805-93445';
export const WHATSAPP_RAW_INTL = '62881080593445';
export const CLIENT_TAG_VALUE = 'web-v3';

const GATE_LOCAL_CACHE_KEY = 'nodatagpt_gate_state_v1';
const LATENCY_CACHE_KEY = 'nodatagpt_model_latency_v1';
const SEND_COOLDOWN_MS = 1800;

export interface AccessGateState {
  ready: boolean;
  tier: 'guest' | 'vip';
  unlocked: boolean;
  locked: boolean;
  used: number;
  limit: number;
  remaining: number;
  expiresAt: number | null;
}

type GateListener = (state: AccessGateState) => void;

let proofToken = '';
let activeTurnId = '';
let lastSendTimestamp = 0;
let shieldInstalled = false;
let nativeFetchRef: typeof window.fetch | null = null;
let bootPromise: Promise<AccessGateState> | null = null;
const listeners = new Set<GateListener>();

function loadInitialCachedState(): AccessGateState {
  if (typeof window === 'undefined') {
    return {
      ready: false,
      tier: 'guest',
      unlocked: false,
      locked: false,
      used: 0,
      limit: FREE_TRIAL_LIMIT,
      remaining: FREE_TRIAL_LIMIT,
      expiresAt: null,
    };
  }
  try {
    const raw = window.localStorage.getItem(GATE_LOCAL_CACHE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as Partial<AccessGateState> & { proofToken?: string };
    if (typeof parsed.proofToken === 'string' && parsed.proofToken) {
      proofToken = parsed.proofToken;
    }
    const isVip = parsed.tier === 'vip' && Boolean(parsed.unlocked);
    const used = isVip
      ? 0
      : Math.max(0, Math.min(FREE_TRIAL_LIMIT, Number(parsed.used) || 0));
    return {
      ready: false,
      tier: isVip ? 'vip' : 'guest',
      unlocked: isVip,
      locked: !isVip && used >= FREE_TRIAL_LIMIT,
      used,
      limit: FREE_TRIAL_LIMIT,
      remaining: isVip ? 999999 : Math.max(0, FREE_TRIAL_LIMIT - used),
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
    };
  } catch {
    return {
      ready: false,
      tier: 'guest',
      unlocked: false,
      locked: false,
      used: 0,
      limit: FREE_TRIAL_LIMIT,
      remaining: FREE_TRIAL_LIMIT,
      expiresAt: null,
    };
  }
}

let currentState: AccessGateState = loadInitialCachedState();

function persistAndEmit(next: AccessGateState, nextProof?: string) {
  if (typeof nextProof === 'string' && nextProof) {
    proofToken = nextProof;
  }
  currentState = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        GATE_LOCAL_CACHE_KEY,
        JSON.stringify({
          ...next,
          proofToken,
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }
  for (const listener of listeners) {
    try {
      listener(currentState);
    } catch {
      // Ignore subscriber error
    }
  }
}

export function getAccessGateState(): AccessGateState {
  return currentState;
}

export function subscribeAccessGate(listener: GateListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function hasPersonalByokActive(settings: AppSettings): boolean {
  if (settings.geminiApiKey.trim().length >= 20) return true;
  if (settings.deepseekApiKey.trim().length >= 20) return true;
  if (settings.routerEnabled && settings.routerApiKey.trim().length >= 16) return true;
  return false;
}

export function isGateLockedForSettings(
  state: AccessGateState,
  settings: AppSettings
): boolean {
  if (state.unlocked || state.tier === 'vip') return false;
  if (hasPersonalByokActive(settings)) return false;
  return state.locked || state.used >= FREE_TRIAL_LIMIT;
}

export function buildWhatsAppRequestKeyUrl(): string {
  const text =
    'Halo Admin Mr.NODATA, saya sudah mencoba NodataGPT dan ingin meminta Sandi / Kunci Akses VIP untuk membuka akses penuh NodataGPT. Terima kasih!';
  return `https://wa.me/${WHATSAPP_RAW_INTL}?text=${encodeURIComponent(text)}`;
}

function getRawFetch(): typeof window.fetch {
  if (nativeFetchRef) return nativeFetchRef;
  return window.fetch.bind(window);
}

function applyServerPayloadToState(data: Record<string, unknown>): AccessGateState {
  const isVip = data.tier === 'vip' || Boolean(data.unlocked);
  const localUsed =
    !isVip && currentState.tier === 'guest' ? currentState.used : 0;
  const serverUsed = isVip
    ? 0
    : Math.max(0, Math.min(FREE_TRIAL_LIMIT, Number(data.used) || 0));
  const mergedUsed = isVip ? 0 : Math.max(serverUsed, localUsed);

  const nextState: AccessGateState = {
    ready: true,
    tier: isVip ? 'vip' : 'guest',
    unlocked: isVip,
    locked: !isVip && mergedUsed >= FREE_TRIAL_LIMIT,
    used: mergedUsed,
    limit: FREE_TRIAL_LIMIT,
    remaining: isVip ? 999999 : Math.max(0, FREE_TRIAL_LIMIT - mergedUsed),
    expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
  };

  persistAndEmit(
    nextState,
    typeof data.proofToken === 'string' ? data.proofToken : undefined
  );
  return nextState;
}

export async function initAccessGateSession(force = false): Promise<AccessGateState> {
  if (typeof window === 'undefined') return currentState;
  if (!force && bootPromise) return bootPromise;

  const runBoot = async (): Promise<AccessGateState> => {
    try {
      const rawFetch = getRawFetch();
      const res = await rawFetch('/api/auth', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Nodata-Client': CLIENT_TAG_VALUE,
        },
      });
      if (!res.ok) {
        persistAndEmit({ ...currentState, ready: true });
        return currentState;
      }
      const data = (await res.json()) as Record<string, unknown>;
      return applyServerPayloadToState(data);
    } catch {
      persistAndEmit({ ...currentState, ready: true });
      return currentState;
    }
  };

  bootPromise = runBoot();
  return bootPromise;
}

export function beginProtectedTurn(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const id = `ndturn_${Date.now()}_${rand}`;
  activeTurnId = id;
  return id;
}

export function clearProtectedTurn(turnId?: string): void {
  if (!turnId || activeTurnId === turnId) {
    activeTurnId = '';
  }
}

export async function consumeProtectedTurnOnServer(
  turnId: string,
  hasByok: boolean
): Promise<AccessGateState> {
  if (hasByok || currentState.unlocked || currentState.tier === 'vip') {
    return currentState;
  }

  // Optimistic local increment so UI reflects exact try count immediately
  const optimisticUsed = Math.min(FREE_TRIAL_LIMIT, currentState.used + 1);
  persistAndEmit({
    ...currentState,
    ready: true,
    used: optimisticUsed,
    remaining: Math.max(0, FREE_TRIAL_LIMIT - optimisticUsed),
    locked: optimisticUsed >= FREE_TRIAL_LIMIT,
  });

  if (typeof window === 'undefined') return currentState;

  try {
    if (!proofToken) {
      await initAccessGateSession(true);
    }
    const rawFetch = getRawFetch();
    const res = await rawFetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Nodata-Client': CLIENT_TAG_VALUE,
        ...(proofToken ? { 'X-Nodata-Proof': proofToken } : {}),
      },
      body: JSON.stringify({
        action: 'consume',
        turnId,
        byok: hasByok,
      }),
    });

    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (data && typeof data === 'object') {
      return applyServerPayloadToState(data);
    }
  } catch {
    // Keep optimistic count if offline
  }

  return currentState;
}

export async function submitAccessKeyUnlock(password: string): Promise<{
  ok: boolean;
  error?: string;
  state: AccessGateState;
}> {
  const clean = password.trim();
  if (!clean) {
    return {
      ok: false,
      error: 'Masukkan sandi akses terlebih dahulu.',
      state: currentState,
    };
  }

  try {
    const rawFetch = getRawFetch();
    const res = await rawFetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Nodata-Client': CLIENT_TAG_VALUE,
      },
      body: JSON.stringify({
        action: 'unlock',
        password: clean,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string' && data.error
            ? data.error
            : 'Sandi akses tidak sesuai. Silakan periksa kembali atau hubungi WhatsApp Admin.',
        state: currentState,
      };
    }

    // Clear guest local usage before applying VIP state
    currentState = {
      ready: true,
      tier: 'vip',
      unlocked: true,
      locked: false,
      used: 0,
      limit: FREE_TRIAL_LIMIT,
      remaining: 999999,
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
    };
    const nextState = applyServerPayloadToState(data);
    return { ok: true, state: nextState };
  } catch {
    return {
      ok: false,
      error: 'Gagal terhubung ke server verifikasi. Periksa koneksi internet Anda.',
      state: currentState,
    };
  }
}

export async function mintVipInviteCode(
  durationHours: number,
  label: string
): Promise<{
  ok: boolean;
  code?: string;
  expiresAt?: number;
  error?: string;
}> {
  try {
    if (!proofToken) {
      await initAccessGateSession(true);
    }
    const rawFetch = getRawFetch();
    const res = await rawFetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Nodata-Client': CLIENT_TAG_VALUE,
        'X-Nodata-Proof': proofToken,
      },
      body: JSON.stringify({
        action: 'mint_invite',
        durationHours,
        label,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !data.ok || typeof data.code !== 'string') {
      return {
        ok: false,
        error:
          typeof data.error === 'string'
            ? data.error
            : 'Gagal membuat kode undangan VIP.',
      };
    }
    return {
      ok: true,
      code: data.code,
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : undefined,
    };
  } catch {
    return {
      ok: false,
      error: 'Gagal menghubungi server saat membuat kode undangan.',
    };
  }
}

export async function relockCurrentDevice(): Promise<AccessGateState> {
  try {
    const rawFetch = getRawFetch();
    const res = await rawFetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Nodata-Client': CLIENT_TAG_VALUE,
        'X-Nodata-Proof': proofToken,
      },
      body: JSON.stringify({ action: 'lock_device' }),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    currentState = {
      ready: true,
      tier: 'guest',
      unlocked: false,
      locked: true,
      used: FREE_TRIAL_LIMIT,
      limit: FREE_TRIAL_LIMIT,
      remaining: 0,
      expiresAt: null,
    };
    if (data && typeof data === 'object') {
      return applyServerPayloadToState(data);
    }
    persistAndEmit(currentState);
    return currentState;
  } catch {
    return currentState;
  }
}

// ============================================================================
// Anti-Spam Cooldown Helper (prevents accidental double-taps eating free tries)
// ============================================================================
export function checkSendCooldownRemainingMs(): number {
  const elapsed = Date.now() - lastSendTimestamp;
  if (elapsed >= SEND_COOLDOWN_MS) return 0;
  return SEND_COOLDOWN_MS - elapsed;
}

export function markUserSendDispatched(): void {
  lastSendTimestamp = Date.now();
}

// ============================================================================
// Same-Origin API Anti-Scraping Shield (attaches HMAC Proof + Turn ID to /api/*)
// ============================================================================
function isSameOriginProtectedApiUrl(input: RequestInfo | URL): {
  match: boolean;
  isAuthEndpoint: boolean;
} {
  if (typeof window === 'undefined') return { match: false, isAuthEndpoint: false };
  try {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const resolved = new URL(rawUrl, window.location.origin);
    if (resolved.origin !== window.location.origin) {
      return { match: false, isAuthEndpoint: false };
    }
    if (!resolved.pathname.startsWith('/api/')) {
      return { match: false, isAuthEndpoint: false };
    }
    return {
      match: true,
      isAuthEndpoint: resolved.pathname === '/api/auth',
    };
  } catch {
    return { match: false, isAuthEndpoint: false };
  }
}

export function installSameOriginApiShield(): void {
  if (typeof window === 'undefined' || shieldInstalled) return;
  shieldInstalled = true;
  nativeFetchRef = window.fetch.bind(window);

  // Kick off non-blocking session bootstrap immediately
  void initAccessGateSession();

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const rawFetch = nativeFetchRef!;
    const targetInfo = isSameOriginProtectedApiUrl(input);

    if (!targetInfo.match || targetInfo.isAuthEndpoint) {
      return rawFetch(input, init);
    }

    if (!proofToken) {
      await initAccessGateSession();
    }

    const executeWithProof = async (): Promise<Response> => {
      const mergedHeaders = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined)
      );
      mergedHeaders.set('X-Nodata-Client', CLIENT_TAG_VALUE);
      if (proofToken) {
        mergedHeaders.set('X-Nodata-Proof', proofToken);
      }
      if (activeTurnId && !mergedHeaders.has('X-Nodata-Turn')) {
        mergedHeaders.set('X-Nodata-Turn', activeTurnId);
      }

      return rawFetch(input, {
        ...init,
        credentials: init?.credentials ?? 'same-origin',
        headers: mergedHeaders,
      });
    };

    let response = await executeWithProof();

    // Auto-heal once if session cookie/proof rotated or expired after long idle
    if (response.status === 403) {
      const cloned = await response
        .clone()
        .json()
        .catch(() => null);
      if (
        cloned?.code === 'PROOF_INVALID' ||
        cloned?.code === 'SESSION_REQUIRED'
      ) {
        await initAccessGateSession(true);
        response = await executeWithProof();
      }
    }

    // Immediately lock UI if server reports 402 TRIAL_EXHAUSTED
    if (response.status === 402) {
      persistAndEmit({
        ...currentState,
        ready: true,
        tier: 'guest',
        unlocked: false,
        locked: true,
        used: FREE_TRIAL_LIMIT,
        remaining: 0,
      });
    }

    return response;
  };
}

// ============================================================================
// Live Model Latency Telemetry (for ⚡ Speed Badges in ModelPickerModal)
// ============================================================================
let latencyMapCache: Record<string, number> | null = null;

function readLatencyMap(): Record<string, number> {
  if (latencyMapCache) return latencyMapCache;
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LATENCY_CACHE_KEY);
    latencyMapCache = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    latencyMapCache = {};
  }
  return latencyMapCache;
}

export function recordModelLatency(modelId: string, durationMs: number): void {
  if (!modelId || durationMs < 80 || durationMs > 90000) return;
  const map = readLatencyMap();
  const prev = map[modelId];
  // Exponential moving average so recent speed dominates
  map[modelId] = prev ? Math.round(prev * 0.4 + durationMs * 0.6) : Math.round(durationMs);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LATENCY_CACHE_KEY, JSON.stringify(map));
    } catch {
      // Ignore quota
    }
  }
}

export function getModelLatencyMs(modelId: string): number | null {
  const map = readLatencyMap();
  const val = map[modelId];
  return typeof val === 'number' && val > 0 ? val : null;
}
