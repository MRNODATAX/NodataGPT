import {
  CLIENT_HEADER_VALUE,
  applyNodeSecurityHeaders,
  buildSetCookieHeader,
  checkPasswordBruteForce,
  checkSlidingRateLimit,
  clearPasswordFailures,
  consumeGuestTrialTurn,
  createGateSessionPayload,
  extractTrustedClientIp,
  getConfiguredAccessPassword,
  hashIp,
  hashUserAgentFamily,
  isScraperOrBotUserAgent,
  mintSignedInviteCode,
  recordPasswordFailure,
  safeEqualStrings,
  serializePublicGateState,
  syncSessionWithIpLedger,
  verifyOriginAndFetchSite,
  verifyProofToken,
  verifySessionCookie,
  verifySignedInviteCode,
} from '../lib/securityGate.js';

export default async function handler(req, res) {
  const originCheck = verifyOriginAndFetchSite(req, {
    allowTopLevelNavigation: false,
  });

  applyNodeSecurityHeaders(req, res, {
    matchedOrigin: originCheck.matchedOrigin,
    cacheControl: 'private, no-store, no-cache, must-revalidate',
  });

  if (req.method === 'OPTIONS') {
    return res.status(originCheck.ok ? 204 : 403).end();
  }

  if (!originCheck.ok) {
    return res.status(403).json({
      ok: false,
      code: 'ANTI_SCRAPER_ORIGIN',
      error: originCheck.reason,
    });
  }

  const ua = String(req.headers?.['user-agent'] || '').trim();
  if (isScraperOrBotUserAgent(ua)) {
    return res.status(403).json({
      ok: false,
      code: 'ANTI_SCRAPER_UA',
      error: 'Akses otomatis tidak diizinkan.',
    });
  }

  const clientTag = String(req.headers?.['x-nodata-client'] || '').trim();
  if (clientTag !== CLIENT_HEADER_VALUE) {
    return res.status(403).json({
      ok: false,
      code: 'CLIENT_TAG_INVALID',
      error: 'Permintaan wajib berasal dari antarmuka resmi NodataGPT.',
    });
  }

  const clientIp = extractTrustedClientIp(req);
  const ipHash = hashIp(clientIp);
  const uaHash = hashUserAgentFamily(ua);

  // ==========================================================================
  // GET /api/auth — Session Bootstrap & Trial Sync
  // ==========================================================================
  if (req.method === 'GET') {
    const rl = checkSlidingRateLimit(`auth-boot:${ipHash}`, 28, 5 * 60_000);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Terlalu banyak permintaan sesi. Tunggu beberapa saat.',
      });
    }

    let session = verifySessionCookie(req);
    if (!session) {
      const fresh = createGateSessionPayload({
        tier: 'guest',
        used: 0,
        turns: [],
        ipHash,
        uaHash,
      });
      session = syncSessionWithIpLedger(fresh, ipHash);
    } else if (session.tier === 'guest') {
      session = syncSessionWithIpLedger(
        {
          ...session,
          ipHash,
          uaHash,
        },
        ipHash
      );
    } else {
      session = {
        ...session,
        uaHash,
      };
    }

    res.setHeader('Set-Cookie', buildSetCookieHeader(req, session));
    return res.status(200).json(serializePublicGateState(session));
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metode tidak diizinkan.' });
  }

  // Parse bounded JSON body
  let body = {};
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > 8192) {
      return res.status(413).json({ ok: false, error: 'Payload terlalu besar.' });
    }
    try {
      body = JSON.parse(req.body || '{}');
    } catch {
      return res.status(400).json({ ok: false, error: 'Format JSON tidak valid.' });
    }
  } else if (req.body && typeof req.body === 'object') {
    body = req.body;
  }

  const action = String(body.action || '').trim().toLowerCase();

  // ==========================================================================
  // POST action="unlock" — Verify Master Password or Signed Invite Code
  // ==========================================================================
  if (action === 'unlock') {
    const brute = checkPasswordBruteForce(ipHash);
    if (brute.locked) {
      res.setHeader('Retry-After', String(brute.retryAfterSec));
      return res.status(429).json({
        ok: false,
        code: 'BRUTE_FORCE_LOCKED',
        retryAfterSec: brute.retryAfterSec,
        error: `Terlalu banyak percobaan sandi salah. Silakan tunggu ${Math.ceil(
          brute.retryAfterSec / 60
        )} menit atau minta kunci akses via WhatsApp.`,
      });
    }

    const submitted = String(body.password || body.code || '').trim();
    if (!submitted || submitted.length > 220) {
      return res.status(400).json({
        ok: false,
        code: 'EMPTY_KEY',
        error: 'Masukkan sandi atau kode akses terlebih dahulu.',
      });
    }

    const masterPassword = getConfiguredAccessPassword();
    if (!masterPassword && !submitted.startsWith('NDG1.')) {
      return res.status(503).json({
        ok: false,
        code: 'GATE_UNCONFIGURED',
        error: 'Konfigurasi sandi server belum aktif. Hubungi Admin NodataGPT.',
      });
    }

    let unlocked = false;
    let vipExp = 0;
    let inviteLabel = 'Master VIP';

    if (masterPassword && safeEqualStrings(submitted, masterPassword)) {
      unlocked = true;
    } else if (submitted.startsWith('NDG1.')) {
      const inviteCheck = verifySignedInviteCode(submitted);
      if (inviteCheck?.expired) {
        return res.status(401).json({
          ok: false,
          code: 'INVITE_EXPIRED',
          error: 'Kode akses undangan ini sudah kedaluwarsa. Silakan minta kunci baru via WhatsApp.',
        });
      }
      if (inviteCheck?.valid) {
        unlocked = true;
        vipExp = inviteCheck.expiresAt;
        inviteLabel = inviteCheck.label || 'VIP Invite';
      }
    }

    if (!unlocked) {
      const attemptsRemaining = recordPasswordFailure(ipHash);
      return res.status(401).json({
        ok: false,
        code: 'INVALID_PASSWORD',
        attemptsRemaining,
        error:
          attemptsRemaining > 0
            ? `Sandi akses tidak sesuai. Sisa kesempatan coba: ${attemptsRemaining}x.`
            : 'Sandi akses salah 5x berturut-turut. Akses dikunci sementara 10 menit.',
      });
    }

    clearPasswordFailures(ipHash);
    const existing = verifySessionCookie(req);
    const vipSession = createGateSessionPayload({
      sid: existing?.sid,
      tier: 'vip',
      used: 0,
      turns: [],
      ipHash,
      uaHash,
      vipExp,
      inviteLabel,
    });

    res.setHeader('Set-Cookie', buildSetCookieHeader(req, vipSession));
    return res.status(200).json({
      ...serializePublicGateState(vipSession),
      message: 'Akses penuh NodataGPT berhasil dibuka!',
    });
  }

  // Remaining actions require an active valid session + proof
  const session = verifySessionCookie(req);
  const proof = String(req.headers?.['x-nodata-proof'] || '').trim();
  if (!session || !verifyProofToken(proof, session, uaHash)) {
    return res.status(403).json({
      ok: false,
      code: 'PROOF_INVALID',
      error: 'Sesi keamanan kedaluwarsa. Muat ulang halaman.',
    });
  }

  // ==========================================================================
  // POST action="consume" — Record 1 Guest Turn (deduplicated per turnId)
  // ==========================================================================
  if (action === 'consume') {
    const isByok = Boolean(body.byok);
    if (session.tier === 'vip' || isByok) {
      return res.status(200).json({
        ...serializePublicGateState(session),
        allowed: true,
      });
    }

    const turnId = String(body.turnId || '').trim();
    const outcome = consumeGuestTrialTurn(session, ipHash, turnId);
    res.setHeader('Set-Cookie', buildSetCookieHeader(req, outcome.updatedSession));

    if (!outcome.allowed) {
      return res.status(402).json({
        ...serializePublicGateState(outcome.updatedSession),
        allowed: false,
        code: 'TRIAL_EXHAUSTED',
        error:
          'Masa uji coba gratis 5x telah habis. Masukkan sandi akses untuk melanjutkan.',
      });
    }

    return res.status(200).json({
      ...serializePublicGateState(outcome.updatedSession),
      allowed: true,
    });
  }

  // ==========================================================================
  // POST action="mint_invite" — Generate Signed Time-Bound Invite Code (VIP Only)
  // ==========================================================================
  if (action === 'mint_invite') {
    if (session.tier !== 'vip') {
      return res.status(403).json({
        ok: false,
        code: 'VIP_REQUIRED',
        error: 'Hanya pengguna VIP terverifikasi yang dapat membuat kode undangan.',
      });
    }
    const durationHours = Number(body.durationHours) || 168;
    const label = String(body.label || 'VIP Guest').trim();
    const minted = mintSignedInviteCode({ durationHours, label });
    return res.status(200).json({
      ok: true,
      code: minted.code,
      expiresAt: minted.expiresAt,
      label: minted.label,
    });
  }

  // ==========================================================================
  // POST action="lock_device" — Voluntarily Re-Lock Device (for testing / shared PC)
  // ==========================================================================
  if (action === 'lock_device') {
    const guestSession = syncSessionWithIpLedger(
      createGateSessionPayload({
        tier: 'guest',
        used: 5,
        turns: ['ndturn_locked_manual_1', 'ndturn_locked_manual_2', 'ndturn_locked_manual_3', 'ndturn_locked_manual_4', 'ndturn_locked_manual_5'],
        ipHash,
        uaHash,
      }),
      ipHash
    );
    res.setHeader('Set-Cookie', buildSetCookieHeader(req, guestSession));
    return res.status(200).json(serializePublicGateState(guestSession));
  }

  return res.status(400).json({
    ok: false,
    error: 'Aksi autentikasi tidak dikenal.',
  });
}
