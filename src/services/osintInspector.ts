import jsQR from 'jsqr';
import type { ToolActionLink } from '../types/chat';
import { lookupIndonesianMobileHlr } from './osintIndonesiaData';

export interface OsintExecutionOutput {
  content: string;
  imageUrl?: string;
  actionLinks?: ToolActionLink[];
}

export function getShieldedFetch(): typeof fetch {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return fetch;
}

export async function fetchProxyTextSafe(
  targetUrl: string,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    signal?: AbortSignal;
  }
): Promise<{ ok: boolean; status?: number; body: string; finalUrl?: string } | null> {
  const fx = getShieldedFetch();
  try {
    const res = await fx('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        targetUrl,
        method: 'GET',
        headers: options?.headers || {},
        timeoutMs: options?.timeoutMs ?? 9000,
      }),
      signal: options?.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      ok?: boolean;
      status?: number;
      body?: string;
      finalUrl?: string;
    };
    if (typeof json.body !== 'string') return null;
    return {
      ok: Boolean(json.ok),
      status: json.status,
      body: json.body,
      finalUrl: json.finalUrl,
    };
  } catch {
    return null;
  }
}

export function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

export interface PublicWebMention {
  title: string;
  url: string;
  snippet: string;
}

export async function searchPublicWebSnippets(
  query: string,
  maxItems = 5,
  signal?: AbortSignal
): Promise<PublicWebMention[]> {
  const results: PublicWebMention[] = [];
  const seenUrls = new Set<string>();

  const pushHit = (rawHref: string, rawTitle: string, rawSnippet: string) => {
    let href = decodeHtmlEntities(rawHref || '').trim();
    const uddgMatch = href.match(/[?&]uddg=([^&]+)/);
    if (uddgMatch) {
      try {
        href = decodeURIComponent(uddgMatch[1]);
      } catch {
        // keep href
      }
    }
    const cleanTitle = decodeHtmlEntities((rawTitle || '').replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    const cleanSnippet = decodeHtmlEntities((rawSnippet || '').replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    if (
      cleanTitle &&
      /^https?:\/\//i.test(href) &&
      !href.includes('duckduckgo.com') &&
      !seenUrls.has(href) &&
      results.length < maxItems
    ) {
      seenUrls.add(href);
      results.push({
        title: cleanTitle.slice(0, 110),
        url: href,
        snippet: cleanSnippet.slice(0, 180),
      });
    }
  };

  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetchProxyTextSafe(ddgUrl, {
    headers: {
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    },
    timeoutMs: 6500,
    signal,
  });

  if (res?.body && !/anomaly-modal|cc=botnet/i.test(res.body)) {
    const blockRegex =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,600}?(?:<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>)/gi;
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(res.body)) !== null && results.length < maxItems) {
      pushHit(m[1] || '', m[2] || '', (m[3] || m[4] || '') as string);
    }
  }

  if (results.length === 0) {
    const liteUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const liteRes = await fetchProxyTextSafe(liteUrl, {
      headers: {
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      },
      timeoutMs: 6000,
      signal,
    });
    if (liteRes?.body && !/anomaly-modal|cc=botnet/i.test(liteRes.body)) {
      const liteRegex =
        /<a[^>]*class=['"][^'"]*result-link[^'"]*['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>[\s\S]{0,700}?(?:<td[^>]*class=['"][^'"]*result-snippet[^'"]*['"][^>]*>([\s\S]*?)<\/td>)?/gi;
      let lm: RegExpExecArray | null;
      while ((lm = liteRegex.exec(liteRes.body)) !== null && results.length < maxItems) {
        pushHit(lm[1] || '', lm[2] || '', lm[3] || '');
      }
    }
  }

  return results;
}

export async function fetchJsonSafe(
  targetUrl: string,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    signal?: AbortSignal;
    proxyFirst?: boolean;
  }
): Promise<Record<string, unknown> | unknown[] | null> {
  const timeoutMs = options?.timeoutMs ?? 9000;
  const fx = getShieldedFetch();

  if (typeof window !== 'undefined' && !options?.proxyFirst) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), Math.min(timeoutMs, 6500));
    const onAbort = () => controller.abort();
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/dns-json, application/json',
          ...(options?.headers || {}),
        },
        signal: controller.signal,
      });
      if (res.ok) {
        const text = await res.text();
        try {
          return JSON.parse(text) as Record<string, unknown> | unknown[];
        } catch {
          // continue to proxy fallback
        }
      }
    } catch {
      // Fall back to /api/proxy
    } finally {
      window.clearTimeout(timer);
      options?.signal?.removeEventListener('abort', onAbort);
    }
  }

  try {
    const res = await fx('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        targetUrl,
        method: 'GET',
        headers: {
          Accept: 'application/dns-json, application/json',
          ...(options?.headers || {}),
        },
        timeoutMs,
      }),
      signal: options?.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; body?: string };
    if (!json.ok || !json.body) return null;
    return JSON.parse(json.body) as Record<string, unknown> | unknown[];
  } catch {
    return null;
  }
}

export function buildGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

export async function geocodePlaceIndonesia(
  query: string,
  signal?: AbortSignal
): Promise<{ displayName: string; lat: string; lon: string } | null> {
  const clean = query.trim();
  if (!clean) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q=${encodeURIComponent(
    clean
  )}`;
  const data = await fetchJsonSafe(url, {
    timeoutMs: 7500,
    signal,
    proxyFirst: true,
  });
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as Record<string, unknown>;
  const lat = String(first.lat || '').trim();
  const lon = String(first.lon || '').trim();
  const displayName = String(first.display_name || '').trim();
  if (!lat || !lon) return null;
  return { displayName, lat, lon };
}

// ============================================================================
// 1. CLIENT-SIDE QR BARCODE DECODER (PNG / JPG / WEBP / DATA-URL / HTTPS URL)
// ============================================================================

function decodeImageDataWithMultiPass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): string | null {
  if (width < 8 || height < 8) return null;

  // Pass 1: Standard full frame
  const fullData = ctx.getImageData(0, 0, width, height);
  const direct = jsQR(fullData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });
  if (direct?.data?.trim()) {
    return direct.data.trim();
  }

  // Pass 2: High-contrast adaptive threshold pass (handles glare / dim paper QRIS)
  const contrastPixels = new Uint8ClampedArray(fullData.data.length);
  let lumSum = 0;
  const pxCount = width * height;
  for (let i = 0; i < fullData.data.length; i += 4) {
    lumSum +=
      0.299 * fullData.data[i] +
      0.587 * fullData.data[i + 1] +
      0.114 * fullData.data[i + 2];
  }
  const avgLum = lumSum / Math.max(pxCount, 1);
  const threshold = Math.max(70, Math.min(185, avgLum * 0.92));

  for (let i = 0; i < fullData.data.length; i += 4) {
    const lum =
      0.299 * fullData.data[i] +
      0.587 * fullData.data[i + 1] +
      0.114 * fullData.data[i + 2];
    const bw = lum < threshold ? 0 : 255;
    contrastPixels[i] = bw;
    contrastPixels[i + 1] = bw;
    contrastPixels[i + 2] = bw;
    contrastPixels[i + 3] = 255;
  }

  const contrastHit = jsQR(contrastPixels, width, height, {
    inversionAttempts: 'attemptBoth',
  });
  if (contrastHit?.data?.trim()) {
    return contrastHit.data.trim();
  }

  // Pass 3: Center 72% crop (handles acrylic QRIS standee photographed on a table)
  if (width >= 240 && height >= 240) {
    const cropW = Math.round(width * 0.72);
    const cropH = Math.round(height * 0.72);
    const startX = Math.round((width - cropW) / 2);
    const startY = Math.round((height - cropH) / 2);
    const centerData = ctx.getImageData(startX, startY, cropW, cropH);
    const centerHit = jsQR(centerData.data, cropW, cropH, {
      inversionAttempts: 'attemptBoth',
    });
    if (centerHit?.data?.trim()) {
      return centerHit.data.trim();
    }
  }

  return null;
}

async function decodeQrFromLoadedElement(img: HTMLImageElement): Promise<string | null> {
  const natW = img.naturalWidth || img.width || 0;
  const natH = img.naturalHeight || img.height || 0;
  if (!natW || !natH) return null;

  const scales = [1400, 900, 2000];
  for (const targetMax of scales) {
    const maxSide = Math.max(natW, natH);
    const scale = maxSide > targetMax ? targetMax / maxSide : maxSide < 360 ? 720 / maxSide : 1;
    const w = Math.max(16, Math.round(natW * scale));
    const h = Math.max(16, Math.round(natH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = scale <= 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const decoded = decodeImageDataWithMultiPass(ctx, w, h);
    if (decoded) return decoded;
  }

  return null;
}

function loadImageElement(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar QR.'));
    img.src = src;
  });
}

export async function decodeQrFromFile(file: File): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
  if (!dataUrl.startsWith('data:image/')) return null;
  const img = await loadImageElement(dataUrl);
  return decodeQrFromLoadedElement(img);
}

export async function decodeQrFromImageSource(
  source: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const trimmed = source.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/')) {
    const img = await loadImageElement(trimmed);
    return decodeQrFromLoadedElement(img);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const corsImg = await loadImageElement(trimmed, 'anonymous');
      const directHit = await decodeQrFromLoadedElement(corsImg);
      if (directHit) return directHit;
    } catch {
      // CORS taint or load block — fall through to /api/proxy image fetch
    }

    try {
      const fx = getShieldedFetch();
      const res = await fx('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          targetUrl: trimmed,
          method: 'GET',
          timeoutMs: 15000,
        }),
        signal,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        kind?: string;
        imageUrl?: string;
      };
      if (res.ok && json.ok && json.imageUrl?.startsWith('data:image/')) {
        const proxyImg = await loadImageElement(json.imageUrl);
        return decodeQrFromLoadedElement(proxyImg);
      }
    } catch {
      return null;
    }
  }

  return null;
}

// ============================================================================
// 2. EMVCo QRIS MPM TLV PARSER + CRC-16/CCITT-FALSE + ANTI-TIMPA / WILAYAH
// ============================================================================

export interface EmvTagNode {
  tag: string;
  length: number;
  value: string;
  children?: EmvTagNode[];
}

export interface ParsedQrisResult {
  rawPayload: string;
  crcProvided: string;
  crcCalculated: string;
  crcValid: boolean;
  pointOfInitiation: string;
  qrisTypeLabel: string;
  merchantName: string;
  merchantCity: string;
  postalCode: string;
  countryCode: string;
  mcc: string;
  mccDescription: string;
  currencyCode: string;
  currencyLabel: string;
  transactionAmount?: number;
  tipIndicator?: string;
  convenienceFeeFixed?: string;
  convenienceFeePercent?: string;
  nmid?: string;
  acquirers: Array<{
    slotTag: string;
    domain: string;
    providerName: string;
    merchantPan?: string;
    merchantId?: string;
    criteria?: string;
    criteriaLabel?: string;
  }>;
  additionalData: {
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    loyaltyNumber?: string;
    referenceLabel?: string;
    customerLabel?: string;
    terminalLabel?: string;
    purposeOfTransaction?: string;
  };
  rootTags: EmvTagNode[];
  riskFlags: Array<{ severity: 'high' | 'medium' | 'info'; message: string }>;
}

const ACQUIRER_DOMAIN_MAP: Record<string, string> = {
  'ID.CO.QRIS.WWW': 'PTEN / Switching Nasional QRIS',
  'ID.CO.GOPAY.WWW': 'GoPay / Midtrans (GoTo Financial)',
  'ID.DANA.WWW': 'DANA Indonesia (Espay Debit)',
  'ID.CO.DANA.WWW': 'DANA Bisnis Indonesia',
  'ID.CO.OVO.WWW': 'OVO (Visionet Internasional)',
  'ID.CO.SHOPEE.WWW': 'ShopeePay (AirPay Internasional)',
  'ID.CO.TELKOM.WWW': 'LinkAja / Finnet Telkom',
  'ID.CO.LINKAJA.WWW': 'LinkAja (Fintek Karya Nusantara)',
  'ID.CO.BCA.WWW': 'Bank Central Asia (BCA)',
  'ID.CO.BRI.WWW': 'Bank Rakyat Indonesia (BRI)',
  'ID.CO.BANKMANDIRI.WWW': 'Bank Mandiri (Livin / Kopra)',
  'ID.CO.MANDIRI.WWW': 'Bank Mandiri',
  'ID.CO.BNI.WWW': 'Bank Negara Indonesia (BNI)',
  'ID.CO.BSI.WWW': 'Bank Syariah Indonesia (BSI)',
  'ID.CO.CIMBNIAGA.WWW': 'CIMB Niaga (OCTO)',
  'ID.CO.PERMATA.WWW': 'PermataBank',
  'ID.CO.BTN.WWW': 'Bank Tabungan Negara (BTN)',
  'ID.CO.DANAMON.WWW': 'Bank Danamon',
  'ID.CO.BTPN.WWW': 'Bank SMBC Indonesia / Jenius',
  'ID.CO.JENIUS.WWW': 'Jenius (SMBC Indonesia)',
  'ID.CO.SEABANK.WWW': 'SeaBank Indonesia',
  'ID.CO.JAGO.WWW': 'Bank Jago',
  'ID.CO.BANKJAGO.WWW': 'Bank Jago',
  'ID.CO.BNC.WWW': 'Bank Neo Commerce (BNC)',
  'ID.CO.NOBUBANK.WWW': 'Bank Nationalnobu (Nobu QRIS)',
  'ID.CO.SINARMAS.WWW': 'Bank Sinarmas',
  'ID.CO.MEGA.WWW': 'Bank Mega',
  'ID.CO.MAYBANK.WWW': 'Maybank Indonesia',
  'ID.CO.OCBCNISP.WWW': 'OCBC Indonesia',
  'ID.CO.PANIN.WWW': 'Panin Bank',
  'ID.CO.BJB.WWW': 'Bank BJB (Jawa Barat & Banten)',
  'ID.CO.BANKJATIM.WWW': 'Bank Jatim',
  'ID.CO.BANKJATENG.WWW': 'Bank Jateng',
  'ID.CO.BPDBALI.WWW': 'Bank BPD Bali',
  'ID.CO.ASTRAPAY.WWW': 'AstraPay',
  'ID.CO.ISAKU.WWW': 'i.saku (Indomaret)',
  'ID.CO.DOKU.WWW': 'DOKU Payment Gateway',
  'ID.CO.XENDIT.WWW': 'Xendit Payment Gateway',
  'ID.CO.FASPAY.WWW': 'Faspay Payment Gateway',
  'ID.CO.MIDTRANS.WWW': 'Midtrans Payment Gateway',
  'ID.CO.NETZME.WWW': 'Netzme Kreasi Indonesia',
  'ID.CO.KASPRO.WWW': 'KasPro ( Solusi Pasti )',
  'ID.CO.SPEEDCASH.WWW': 'SpeedCash / Bimasakti',
  'ID.CO.GV.WWW': 'GudangVoucher',
  'ID.CO.PAYTREN.WWW': 'PayTren',
  'ID.NET.ALTO.WWW': 'Jaringan Switching ALTO',
  'ID.CO.ARTAJASA.WWW': 'Jaringan ATM Bersama (Artajasa)',
  'ID.CO.RINTIS.WWW': 'Jaringan PRIMA (Rintis Sejahtera)',
  'ID.CO.JALIN.WWW': 'Jaringan LINK (Jalin Pembayaran)',
};

const MERCHANT_CRITERIA_MAP: Record<string, string> = {
  UMI: 'Usaha Mikro (UMI — perorangan/UMKM mikro)',
  UKE: 'Usaha Kecil (UKE — UMKM skala kecil)',
  UME: 'Usaha Menengah (UME — bisnis menengah)',
  URE: 'Usaha Reguler / Besar (URE — korporasi/retail besar)',
  PSO: 'Public Service / Sosial / Zakat / Rumah Ibadah / Pemerintah (PSO)',
};

const MCC_CATEGORY_MAP: Record<string, string> = {
  '0742': 'Klinik Hewan / Layanan Veteriner',
  '4111': 'Transportasi Komuter / Angkutan Umum',
  '4121': 'Taksi & Ride-Hailing',
  '4784': 'Gerbang Tol & Parkir Jalan',
  '4789': 'Layanan Transportasi Lainnya',
  '4812': 'Toko HP, Pulsa & Peralatan Telekomunikasi',
  '4814': 'Layanan Telekomunikasi / Paket Data / Internet',
  '4816': 'Jaringan Komputer / Hosting / Layanan Digital',
  '4829': 'Transfer Dana / Remitansi',
  '4900': 'Utilitas Publik (Listrik, Air, Gas)',
  '5199': 'Grosir Barang Dagangan Umum',
  '5200': 'Toko Bahan Bangunan & Home Center',
  '5251': 'Toko Perkakas / Hardware',
  '5310': 'Toko Diskon / Department Store',
  '5311': 'Department Store / Mall Retail',
  '5331': 'Toko Serba Ada (Variety Store)',
  '5399': 'Perdagangan Umum Lainnya (UMKM / Toko Kelontong)',
  '5411': 'Supermarket, Minimarket & Toko Sembako',
  '5422': 'Toko Daging, Ikan & Frozen Food',
  '5441': 'Toko Permen, Cokelat & Camilan',
  '5451': 'Toko Produk Susu & Olahan',
  '5462': 'Toko Roti, Kue & Bakery',
  '5499': 'Toko Makanan, Warung & Kebutuhan Harian Lainnya',
  '5511': 'Dealer Mobil & Bengkel Resmi',
  '5533': 'Toko Suku Cadang & Aksesoris Kendaraan',
  '5541': 'SPBU / Stasiun Pengisian BBM',
  '5571': 'Dealer & Bengkel Sepeda Motor',
  '5611': 'Toko Pakaian Pria',
  '5621': 'Toko Pakaian Wanita & Butik',
  '5651': 'Toko Pakaian Keluarga / Fashion Umum',
  '5661': 'Toko Sepatu & Alas Kaki',
  '5691': 'Toko Pakaian & Busana Muslim / Distro',
  '5699': 'Toko Aksesoris & Fashion Lainnya',
  '5712': 'Toko Furnitur & Perabot Rumah',
  '5732': 'Toko Elektronik & Gadget',
  '5734': 'Toko Software & Komputer',
  '5811': 'Jasa Katering',
  '5812': 'Restoran, Rumah Makan & Kafe',
  '5813': 'Kedai Kopi, Lounge & Minuman',
  '5814': 'Restoran Cepat Saji (Fast Food / Jajanan Kuliner)',
  '5912': 'Apotek & Toko Obat',
  '5941': 'Toko Alat Olahraga',
  '5942': 'Toko Buku & Alat Tulis',
  '5943': 'Toko ATK & Perlengkapan Kantor',
  '5945': 'Toko Mainan & Hobi',
  '5947': 'Toko Souvenir, Kado & Kerajinan',
  '5977': 'Toko Kosmetik, Skincare & Parfum',
  '5992': 'Toko Bunga (Florist)',
  '5995': 'Pet Shop & Kebutuhan Hewan',
  '5999': 'Toko Ritel Spesialis / UMKM Lainnya',
  '7011': 'Hotel, Penginapan & Resort',
  '7210': 'Jasa Laundry & Cuci Pakaian',
  '7230': 'Salon Kecantikan & Barbershop',
  '7298': 'Spa, Refleksi & Perawatan Kesehatan',
  '7399': 'Jasa Bisnis & Profesional Lainnya',
  '7523': 'Layanan Parkir Kendaraan',
  '7538': 'Bengkel Servis Otomotif',
  '7542': 'Jasa Cuci Mobil & Motor',
  '7991': 'Tempat Wisata & Pameran',
  '7994': 'Game Center, Top-Up Game & Arcade',
  '7997': 'Gym, Klub Olahraga & Rekreasi',
  '8011': 'Praktik Dokter & Klinik Medis',
  '8021': 'Klinik Dokter Gigi',
  '8062': 'Rumah Sakit',
  '8211': 'Sekolah Dasar & Menengah',
  '8220': 'Perguruan Tinggi & Universitas',
  '8299': 'Lembaga Kursus, Bimbel & Pendidikan',
  '8398': 'Organisasi Amal, Zakat, Infaq & Donasi Sosial',
  '8661': 'Masjid, Gereja, Pura, Vihara & Organisasi Keagamaan',
  '9311': 'Pembayaran Pajak Daerah / Negara',
  '9399': 'Layanan Pemerintahan / Retribusi Publik',
};

const INDONESIAN_POSTAL_PREFIX_PROVINCE: Record<string, string> = {
  '10': 'Jakarta Pusat, DKI Jakarta',
  '11': 'Jakarta Barat, DKI Jakarta',
  '12': 'Jakarta Selatan, DKI Jakarta',
  '13': 'Jakarta Timur, DKI Jakarta',
  '14': 'Jakarta Utara & Kepulauan Seribu, DKI Jakarta',
  '15': 'Tangerang / Tangerang Selatan, Banten',
  '16': 'Bogor / Depok, Jawa Barat',
  '17': 'Bekasi, Jawa Barat',
  '20': 'Medan / Deli Serdang, Sumatera Utara',
  '21': 'Asahan / Simalungun / Labuhanbatu, Sumatera Utara',
  '22': 'Tapanuli / Toba / Nias, Sumatera Utara',
  '23': 'Banda Aceh / Aceh Besar, Aceh',
  '24': 'Lhokseumawe / Aceh Utara / Aceh Tengah, Aceh',
  '25': 'Padang / Pariaman, Sumatera Barat',
  '26': 'Bukittinggi / Payakumbuh / Agam, Sumatera Barat',
  '27': 'Solok / Sawahlunto / Tanah Datar, Sumatera Barat',
  '28': 'Pekanbaru / Kampar / Dumai, Riau',
  '29': 'Batam / Tanjungpinang / Bintan, Kepulauan Riau',
  '30': 'Palembang / Banyuasin / Ogan Ilir, Sumatera Selatan',
  '31': 'Lahat / Lubuklinggau / Muara Enim, Sumatera Selatan',
  '32': 'OKU / OKI / Prabumulih, Sumatera Selatan',
  '33': 'Pangkalpinang / Bangka Belitung',
  '34': 'Metro / Lampung Tengah / Lampung Utara, Lampung',
  '35': 'Bandar Lampung / Lampung Selatan, Lampung',
  '36': 'Jambi / Muaro Jambi',
  '37': 'Bungo / Kerinci / Merangin, Jambi',
  '38': 'Bengkulu',
  '40': 'Bandung / Cimahi / Bandung Barat, Jawa Barat',
  '41': 'Karawang / Purwakarta / Subang, Jawa Barat',
  '42': 'Serang / Cilegon / Pandeglang / Lebak, Banten',
  '43': 'Sukabumi / Cianjur, Jawa Barat',
  '44': 'Garut / Tasikmalaya, Jawa Barat',
  '45': 'Cirebon / Indramayu / Majalengka / Kuningan, Jawa Barat',
  '46': 'Tasikmalaya / Ciamis / Banjar / Pangandaran, Jawa Barat',
  '50': 'Semarang / Salatiga, Jawa Tengah',
  '51': 'Pekalongan / Batang / Kendal / Brebes, Jawa Tengah',
  '52': 'Tegal / Pemalang / Brebes, Jawa Tengah',
  '53': 'Purwokerto / Banyumas / Cilacap / Kebumen, Jawa Tengah',
  '54': 'Purworejo / Kebumen, Jawa Tengah',
  '55': 'Yogyakarta / Sleman / Bantul, DI Yogyakarta',
  '56': 'Magelang / Temanggung / Wonosobo, Jawa Tengah',
  '57': 'Surakarta (Solo) / Sukoharjo / Klaten / Boyolali, Jawa Tengah',
  '58': 'Grobogan / Blora, Jawa Tengah',
  '59': 'Kudus / Pati / Jepara / Demak / Rembang, Jawa Tengah',
  '60': 'Surabaya, Jawa Timur',
  '61': 'Sidoarjo / Mojokerto / Gresik / Jombang, Jawa Timur',
  '62': 'Tuban / Bojonegoro / Lamongan, Jawa Timur',
  '63': 'Madiun / Ponorogo / Ngawi / Magetan, Jawa Timur',
  '64': 'Kediri / Blitar / Tulungagung / Nganjuk, Jawa Timur',
  '65': 'Malang / Batu, Jawa Timur',
  '66': 'Tulungagung / Trenggalek / Blitar, Jawa Timur',
  '67': 'Pasuruan / Probolinggo / Lumajang, Jawa Timur',
  '68': 'Jember / Banyuwangi / Bondowoso / Situbondo, Jawa Timur',
  '69': 'Madura (Bangkalan / Sampang / Pamekasan / Sumenep), Jawa Timur',
  '70': 'Banjarmasin / Banjarbaru, Kalimantan Selatan',
  '71': ' Hulu Sungai / Tabalong / Kotabaru, Kalimantan Selatan',
  '73': 'Palangka Raya / Barito, Kalimantan Tengah',
  '74': 'Kotawaringin / Sampit / Pangkalan Bun, Kalimantan Tengah',
  '75': 'Samarinda / Bontang / Kutai, Kalimantan Timur',
  '76': 'Balikpapan / Penajam Paser Utara (IKN), Kalimantan Timur',
  '77': 'Tarakan / Bulungan / Nunukan, Kalimantan Utara',
  '78': 'Pontianak / Singkawang / Kubu Raya, Kalimantan Barat',
  '79': 'Sintang / Ketapang / Sanggau, Kalimantan Barat',
  '80': 'Denpasar / Badung / Gianyar, Bali',
  '81': 'Buleleng / Jembrana / Karangasem, Bali',
  '82': 'Tabanan, Bali',
  '83': 'Mataram / Lombok, Nusa Tenggara Barat',
  '84': 'Sumbawa / Bima / Dompu, Nusa Tenggara Barat',
  '85': 'Kupang / Timor, Nusa Tenggara Timur',
  '86': 'Flores / Ende / Maumere / Labuan Bajo, Nusa Tenggara Timur',
  '87': 'Sumba, Nusa Tenggara Timur',
  '90': 'Makassar / Maros / Gowa, Sulawesi Selatan',
  '91': 'Parepare / Bone / Palopo / Toraja / Sulawesi Barat',
  '92': 'Bantaeng / Bulukumba / Takalar / Jeneponto, Sulawesi Selatan',
  '93': 'Kendari / Baubau, Sulawesi Tenggara',
  '94': 'Palu / Poso / Luwuk, Sulawesi Tengah',
  '95': 'Manado / Bitung / Tomohon / Minahasa, Sulawesi Utara',
  '96': 'Gorontalo',
  '97': 'Ambon / Ternate / Maluku & Maluku Utara',
  '98': 'Sorong / Manokwari / Biak / Nabire, Tanah Papua',
  '99': 'Jayapura / Merauke / Mimika (Timika), Tanah Papua',
};

export function computeCrc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= (input.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseTlvNodes(payload: string): EmvTagNode[] {
  const nodes: EmvTagNode[] = [];
  let idx = 0;
  while (idx + 4 <= payload.length) {
    const tag = payload.slice(idx, idx + 2);
    const lenStr = payload.slice(idx + 2, idx + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      break;
    }
    const len = Number(lenStr);
    const valueStart = idx + 4;
    const valueEnd = valueStart + len;
    if (valueEnd > payload.length) {
      break;
    }
    const value = payload.slice(valueStart, valueEnd);
    const tagNum = Number(tag);
    const isTemplate =
      (tagNum >= 26 && tagNum <= 51) || tag === '62' || tag === '64';
    const node: EmvTagNode = { tag, length: len, value };
    if (isTemplate && value.length >= 4) {
      const subNodes = parseTlvNodes(value);
      if (subNodes.length > 0) {
        node.children = subNodes;
      }
    }
    nodes.push(node);
    idx = valueEnd;
  }
  return nodes;
}

export function extractEmvQrisString(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (/^000201/.test(trimmed) && /6304[0-9A-Fa-f]{4}$/.test(trimmed)) {
    return trimmed;
  }
  // Extract embedded EMVCo QRIS string if pasted inside surrounding chat text
  const match = trimmed.match(/(000201[\x20-\x7E]{20,650}?6304[0-9A-Fa-f]{4})/);
  return match ? match[1] : null;
}

export function parseEmvQrisPayload(rawPayload: string): ParsedQrisResult {
  const clean = rawPayload.trim();
  const rootTags = parseTlvNodes(clean);
  const tagMap = new Map<string, EmvTagNode>();
  for (const node of rootTags) {
    tagMap.set(node.tag, node);
  }

  const crcMatch = clean.match(/^(.*6304)([0-9A-Fa-f]{4})$/);
  const crcProvided = (crcMatch?.[2] || tagMap.get('63')?.value || '').toUpperCase();
  const crcCalculated = crcMatch
    ? computeCrc16CcittFalse(crcMatch[1])
    : computeCrc16CcittFalse(clean.slice(0, Math.max(0, clean.length - 4)));
  const crcValid = Boolean(crcProvided && crcProvided === crcCalculated);

  const poi = tagMap.get('01')?.value || '11';
  const qrisTypeLabel =
    poi === '12'
      ? 'QRIS Dinamis (Sekali Pakai / Nominal Otomatis)'
      : poi === '11'
      ? 'QRIS Statis (Stiker / Akrilik Kasir Tetap)'
      : `Mode ${poi}`;

  const acquirers: ParsedQrisResult['acquirers'] = [];
  let detectedNmid: string | undefined;

  for (let slot = 26; slot <= 51; slot++) {
    const slotKey = String(slot).padStart(2, '0');
    const slotNode = tagMap.get(slotKey);
    if (!slotNode?.children) continue;
    const sub = new Map(slotNode.children.map((c) => [c.tag, c.value]));
    const domain = (sub.get('00') || '').toUpperCase();
    const pan = sub.get('01');
    const merchantId = sub.get('02');
    const criteria = (sub.get('03') || '').toUpperCase();

    if (slot === 51 && merchantId) {
      detectedNmid = merchantId;
    } else if (!detectedNmid && merchantId && /^ID\d{10,16}$/i.test(merchantId)) {
      detectedNmid = merchantId;
    }

    const providerName =
      ACQUIRER_DOMAIN_MAP[domain] ||
      (domain ? `PJSP / Prinsipal (${domain})` : `Slot Merchant ${slotKey}`);

    acquirers.push({
      slotTag: slotKey,
      domain,
      providerName,
      merchantPan: pan,
      merchantId,
      criteria: criteria || undefined,
      criteriaLabel: criteria ? MERCHANT_CRITERIA_MAP[criteria] || criteria : undefined,
    });
  }

  const mcc = tagMap.get('52')?.value || '-';
  const mccDescription =
    MCC_CATEGORY_MAP[mcc] || (mcc !== '-' ? `Kategori ISO 18245 (MCC ${mcc})` : 'Tidak dicantumkan');

  const currencyCode = tagMap.get('53')?.value || '';
  const currencyLabel =
    currencyCode === '360'
      ? 'IDR (Rupiah Indonesia — ISO 360)'
      : currencyCode === '840'
      ? 'USD (Dolar AS — ISO 840)'
      : currencyCode === '702'
      ? 'SGD (Dolar Singapura — ISO 702)'
      : currencyCode === '458'
      ? 'MYR (Ringgit Malaysia — ISO 458)'
      : currencyCode === '764'
      ? 'THB (Baht Thailand — ISO 764)'
      : currencyCode
      ? `Kode ISO ${currencyCode}`
      : 'Tidak diketahui';

  const rawAmt = tagMap.get('54')?.value;
  const transactionAmount =
    rawAmt && !Number.isNaN(Number(rawAmt)) ? Number(rawAmt) : undefined;

  const merchantName = tagMap.get('59')?.value?.trim() || 'Tanpa Nama Merchant';
  const merchantCity = tagMap.get('60')?.value?.trim() || 'Tidak Dicantumkan';
  const postalCode = tagMap.get('61')?.value?.trim() || '';
  const countryCode = tagMap.get('58')?.value?.trim() || 'ID';

  const addNode = tagMap.get('62');
  const addSub = new Map((addNode?.children || []).map((c) => [c.tag, c.value]));
  const additionalData: ParsedQrisResult['additionalData'] = {
    billNumber: addSub.get('01'),
    mobileNumber: addSub.get('02'),
    storeLabel: addSub.get('03'),
    loyaltyNumber: addSub.get('04'),
    referenceLabel: addSub.get('05'),
    customerLabel: addSub.get('06'),
    terminalLabel: addSub.get('07'),
    purposeOfTransaction: addSub.get('08'),
  };

  const riskFlags: ParsedQrisResult['riskFlags'] = [];

  if (!crcValid) {
    riskFlags.push({
      severity: 'high',
      message: `Checksum CRC-16 TIDAK COCOK (tertulis ${crcProvided || '-'}, seharusnya ${crcCalculated}). String QRIS rusak atau telah diedit secara tidak sah!`,
    });
  } else {
    riskFlags.push({
      severity: 'info',
      message: `Checksum CRC-16/CCITT-FALSE VALID (0x${crcCalculated}) — struktur payload EMVCo utuh & tidak korup.`,
    });
  }

  // Fake "Refund / Pengembalian Dana" scam detector
  if (
    /\b(refund|pengembalian|pembatalan|batal\s*paket|klaim|claim\s*dana|pencairan|kompensasi|kurir\s*paket)\b/i.test(
      merchantName
    )
  ) {
    riskFlags.push({
      severity: 'high',
      message: `WASPADA MODUS PENIPUAN REFUND QRIS! Nama merchant "${merchantName}" memakai kata pengembalian/klaim. QRIS MPM HANYA untuk MEMBAYAR KELUAR (saldo Anda terpotong), BUKAN untuk menerima dana masuk!`,
    });
  }

  const primaryCriteria = acquirers.find((a) => a.criteria)?.criteria;
  if (
    primaryCriteria === 'UMI' &&
    /\b(jne|j&t|jnt|sicepat|anteraja|shopee|tokopedia|lazada|tiktok\s*shop|pln|telkomsel|indosat|pajak|bea\s*cukai|polri|bank\s*indonesia)\b/i.test(
      merchantName
    )
  ) {
    riskFlags.push({
      severity: 'high',
      message: `INDIKASI IMPERSONASI KORPORASI: Nama merchant mencatut instansi/brand besar ("${merchantName}"), tetapi terdaftar dengan skala Usaha Mikro Perorangan (UMI).`,
    });
  }

  if (countryCode && countryCode !== 'ID') {
    riskFlags.push({
      severity: 'medium',
      message: `QR EMVCo lintas negara (Country Code: ${countryCode} — QRIS Cross-Border / Non-Domestik). Pastikan nilai kurs sesuai sebelum bayar.`,
    });
  }

  if (transactionAmount && transactionAmount >= 2_000_000) {
    riskFlags.push({
      severity: 'medium',
      message: `QRIS mengunci tagihan otomatis cukup besar (Rp ${transactionAmount.toLocaleString('id-ID')}). Periksa ulang nominal sebelum memasukkan PIN.`,
    });
  }

  return {
    rawPayload: clean,
    crcProvided,
    crcCalculated,
    crcValid,
    pointOfInitiation: poi,
    qrisTypeLabel,
    merchantName,
    merchantCity,
    postalCode,
    countryCode,
    mcc,
    mccDescription,
    currencyCode,
    currencyLabel,
    transactionAmount,
    tipIndicator: tagMap.get('55')?.value,
    convenienceFeeFixed: tagMap.get('56')?.value,
    convenienceFeePercent: tagMap.get('57')?.value,
    nmid: detectedNmid,
    acquirers,
    additionalData,
    rootTags,
    riskFlags,
  };
}

interface PostalAreaResolution {
  kelurahanList: string[];
  kecamatan?: string;
  city?: string;
  province?: string;
  fallbackRegion?: string;
  coords?: { lat: string; lon: string; displayName: string };
}

async function resolveIndonesianPostalAndCity(
  postalCode: string,
  merchantCity: string,
  signal?: AbortSignal
): Promise<PostalAreaResolution> {
  const cleanPostal = postalCode.replace(/\D/g, '');
  const result: PostalAreaResolution = { kelurahanList: [] };

  if (cleanPostal.length >= 2) {
    result.fallbackRegion = INDONESIAN_POSTAL_PREFIX_PROVINCE[cleanPostal.slice(0, 2)];
  }

  if (/^\d{5}$/.test(cleanPostal)) {
    const data = await fetchJsonSafe(
      `https://kodepos.vercel.app/search/?q=${encodeURIComponent(cleanPostal)}`,
      { timeoutMs: 7000, signal, proxyFirst: true }
    );
    const rows =
      data && !Array.isArray(data) && Array.isArray((data as Record<string, unknown>).data)
        ? ((data as Record<string, unknown>).data as Array<Record<string, unknown>>)
        : [];
    const exactRows = rows.filter(
      (r) => String(r.code || r.postal_code || '').trim() === cleanPostal
    );
    const chosenRows = exactRows.length > 0 ? exactRows : rows.slice(0, 5);
    if (chosenRows.length > 0) {
      const first = chosenRows[0];
      result.kecamatan = String(first.subdistrict || first.district || '').trim() || undefined;
      result.city = String(first.city || first.regency || '').trim() || undefined;
      result.province = String(first.province || '').trim() || undefined;
      const villages = Array.from(
        new Set(
          chosenRows
            .map((r) => String(r.urban || r.village || '').trim())
            .filter(Boolean)
        )
      ).slice(0, 6);
      result.kelurahanList = villages;
    }
  }

  const geoQuery =
    result.kecamatan && (result.city || merchantCity)
      ? `${result.kecamatan}, ${result.city || merchantCity}, ${result.province || 'Indonesia'}`
      : cleanPostal.length === 5 && merchantCity && merchantCity !== 'Tidak Dicantumkan'
      ? `${cleanPostal} ${merchantCity} Indonesia`
      : merchantCity && merchantCity !== 'Tidak Dicantumkan'
      ? `${merchantCity}, Indonesia`
      : '';

  if (geoQuery) {
    const geo = await geocodePlaceIndonesia(geoQuery, signal);
    if (geo) {
      result.coords = geo;
    }
  }

  return result;
}

export async function analyzeQrisInput(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error(
      'Masukkan string payload QRIS (`000201...`), URL gambar QRIS, atau upload foto stiker/screenshot QRIS terlebih dahulu.'
    );
  }

  let decodedText = trimmed;
  let previewImageUrl: string | undefined;

  const embeddedDirect = extractEmvQrisString(trimmed);
  if (embeddedDirect) {
    decodedText = embeddedDirect;
  } else if (trimmed.startsWith('data:image/') || /^https?:\/\/\S+/i.test(trimmed)) {
    const firstUrlToken = trimmed.startsWith('data:image/')
      ? trimmed
      : trimmed.split(/\s+/)[0];
    if (/^https?:\/\//i.test(firstUrlToken)) {
      previewImageUrl = firstUrlToken;
    }
    const qrDecoded = await decodeQrFromImageSource(firstUrlToken, signal);
    if (!qrDecoded) {
      throw new Error(
        'Barcode QR tidak berhasil terbaca dari gambar tersebut. Pastikan kotak QRIS terlihat jelas, tidak terpotong, dan tidak terlalu buram, lalu coba lagi.'
      );
    }
    decodedText = qrDecoded;
  }

  const qrisPayload = extractEmvQrisString(decodedText);

  // Non-EMVCo QR Code -> Anti-Quishing Alert!
  if (!qrisPayload) {
    let urlHost = '';
    const isHttpLink = /^https?:\/\//i.test(decodedText);
    if (isHttpLink) {
      try {
        urlHost = new URL(decodedText).hostname;
      } catch {
        urlHost = '';
      }
    }

    const actionLinks: ToolActionLink[] = [
      {
        label: '🛡️ Cek Rekening / E-Wallet di CekRekening Komdigi',
        url: 'https://cekrekening.id/',
        kind: 'verify',
      },
    ];

    const lines = [
      '### 🚨 PERINGATAN QUISHING — QR INI BUKAN STANDAR QRIS!',
      '',
      'Hasil pemindaian menunjukkan kode QR tersebut **tidak berisi struktur pembayaran EMVCo QRIS (`000201...`)**.',
      '',
      `- **Isi Mentah QR**: \`${decodedText.slice(0, 320)}\``,
      isHttpLink
        ? `- **Jenis Payload**: Tautan Web Eksternal (\`${urlHost || 'URL'}\`) — **Waspada Phishing / APK Berbahaya!**`
        : '- **Jenis Payload**: Teks Non-EMVCo / Barcode Biasa',
      '',
      '> ⚠️ ** Rekomendasi Keamanan**: Jangan memasukkan PIN m-Banking, OTP, atau mengunduh file `.apk` dari QR yang mengarah ke situs web tidak dikenal.',
    ];

    return {
      content: lines.join('\n'),
      imageUrl: previewImageUrl,
      actionLinks,
    };
  }

  const parsed = parseEmvQrisPayload(qrisPayload);
  const area = await resolveIndonesianPostalAndCity(
    parsed.postalCode,
    parsed.merchantCity,
    signal
  );

  const primaryAcquirer =
    parsed.acquirers.find((a) => a.slotTag !== '51') || parsed.acquirers[0];

  const locationSummaryParts = [
    area.kecamatan ? `Kec. ${area.kecamatan}` : '',
    area.city || (parsed.merchantCity !== 'Tidak Dicantumkan' ? parsed.merchantCity : ''),
    area.province || area.fallbackRegion || '',
  ].filter(Boolean);

  const fullAreaLabel =
    locationSummaryParts.join(', ') ||
    (parsed.postalCode ? `Kode Pos ${parsed.postalCode}, Indonesia` : 'Indonesia');

  const merchantMapQuery = [
    parsed.merchantName,
    area.kecamatan || '',
    area.city || (parsed.merchantCity !== 'Tidak Dicantumkan' ? parsed.merchantCity : ''),
    parsed.postalCode || '',
    'Indonesia',
  ]
    .filter(Boolean)
    .join(' ');

  const areaMapQuery = area.coords
    ? `${area.coords.lat},${area.coords.lon}`
    : [
        parsed.postalCode,
        area.kecamatan || '',
        area.city || parsed.merchantCity,
        area.province || 'Indonesia',
      ]
        .filter(Boolean)
        .join(' ');

  const actionLinks: ToolActionLink[] = [
    {
      label: `📍 Cari "${parsed.merchantName.slice(0, 28)}" di Google Maps`,
      url: buildGoogleMapsSearchUrl(merchantMapQuery),
      kind: 'maps',
    },
    {
      label: `🗺️ Buka Area ${
        area.kecamatan || area.city || parsed.merchantCity || parsed.postalCode || 'Merchant'
      } di Google Maps`,
      url: buildGoogleMapsSearchUrl(areaMapQuery),
      kind: 'maps',
    },
  ];

  if (parsed.additionalData.mobileNumber) {
    const digits = parsed.additionalData.mobileNumber.replace(/\D/g, '');
    const waDigits = digits.startsWith('0')
      ? `62${digits.slice(1)}`
      : digits.startsWith('62')
      ? digits
      : '';
    if (waDigits.length >= 10) {
      actionLinks.push({
        label: '💬 Cek WhatsApp Nomor Kasir/Merchant',
        url: `https://wa.me/${waDigits}`,
        kind: 'whatsapp',
      });
    }
  }

  actionLinks.push({
    label: '🛡️ Cek Riwayat Penipuan (CekRekening Komdigi)',
    url: 'https://cekrekening.id/',
    kind: 'verify',
  });

  const acquirerLines =
    parsed.acquirers.length > 0
      ? parsed.acquirers
          .map((acq) => {
            const details = [
              acq.domain ? `Domain: \`${acq.domain}\`` : '',
              acq.merchantPan ? `MPAN: \`${acq.merchantPan}\`` : '',
              acq.merchantId ? `MID: \`${acq.merchantId}\`` : '',
              acq.criteriaLabel ? `Skala: **${acq.criteriaLabel}**` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return `- **Tag ${acq.slotTag} — ${acq.providerName}**: ${details || '-'}`;
          })
          .join('\n')
      : '- Tidak ada slot Acquirer spesifik yang terdeteksi';

  const addInfoItems = [
    parsed.additionalData.storeLabel
      ? `- **Nama Cabang / Store (62.03)**: \`${parsed.additionalData.storeLabel}\``
      : '',
    parsed.additionalData.terminalLabel
      ? `- **ID Terminal Kasir (62.07)**: \`${parsed.additionalData.terminalLabel}\``
      : '',
    parsed.additionalData.billNumber
      ? `- **Nomor Tagihan / Invoice (62.01)**: \`${parsed.additionalData.billNumber}\``
      : '',
    parsed.additionalData.referenceLabel
      ? `- **Reference ID (62.05)**: \`${parsed.additionalData.referenceLabel}\``
      : '',
    parsed.additionalData.mobileNumber
      ? `- **Nomor Kontak Merchant (62.02)**: \`${parsed.additionalData.mobileNumber}\``
      : '',
    parsed.additionalData.purposeOfTransaction
      ? `- **Tujuan Transaksi (62.08)**: \`${parsed.additionalData.purposeOfTransaction}\``
      : '',
  ].filter(Boolean);

  const riskSection = parsed.riskFlags
    .map((f) => {
      const icon = f.severity === 'high' ? '🚨' : f.severity === 'medium' ? '⚠️' : '✅';
      return `- ${icon} ${f.message}`;
    })
    .join('\n');

  const lines = [
    `### 🔍 Hasil Deep Audit QRIS & Pelacak Area Merchant`,
    '',
    `| Parameter | Detail Terdekode |`,
    `| :--- | :--- |`,
    `| **Nama Merchant (Tag 59)** | **${parsed.merchantName}** |`,
    `| **Penerbit / Acquirer Utama** | **${primaryAcquirer?.providerName || '-'}** |`,
    `| **NMID Nasional (Tag 51)** | \`${parsed.nmid || 'Tidak tercantum di Tag 51'}\` |`,
    `| **Skala Usaha Merchant** | ${primaryAcquirer?.criteriaLabel || 'Tidak dicantumkan'} |`,
    `| **Jenis QRIS (Tag 01)** | ${parsed.qrisTypeLabel} |`,
    `| **Kategori Bisnis (MCC ${parsed.mcc})** | ${parsed.mccDescription} |`,
    `| **Mata Uang & Negara** | ${parsed.currencyLabel} · \`${parsed.countryCode}\` |`,
    `| **Nominal Terkunci (Tag 54)** | ${
      parsed.transactionAmount !== undefined
        ? `**Rp ${parsed.transactionAmount.toLocaleString('id-ID')}**`
        : 'Bebas diisi pembayar (QRIS Statis)'
    } |`,
    `| **Validasi Checksum CRC-16** | ${
      parsed.crcValid
        ? `✅ **VALID** (\`0x${parsed.crcProvided}\`)`
        : `🚨 **INVALID** (Tertulis \`0x${parsed.crcProvided}\` ≠ Hitung \`0x${parsed.crcCalculated}\`)`
    } |`,
    '',
    `#### 📍 Analisis Lokasi & Wilayah Terdaftar`,
    `- **Kota / Kabupaten pada QRIS (Tag 60)**: **${parsed.merchantCity}**`,
    `- **Kode Pos Merchant (Tag 61)**: ${
      parsed.postalCode ? `\`${parsed.postalCode}\`` : '_Tidak dicantumkan_'
    }`,
    area.kecamatan || area.city || area.province
      ? `- **Resolusi Wilayah Kode Pos**: **${fullAreaLabel}**`
      : area.fallbackRegion
      ? `- **Estimasi Area Kode Pos**: **${area.fallbackRegion}**`
      : '',
    area.kelurahanList.length > 0
      ? `- **Cakupan Kelurahan / Desa**: ${area.kelurahanList.join(', ')}`
      : '',
    area.coords
      ? `- **Titik Koordinat Area (OSM)**: \`${area.coords.lat}, ${area.coords.lon}\``
      : '',
    '',
    `#### 🏦 Rincian Slot Acquirer / PJSP (Tag 26–51)`,
    acquirerLines,
    ...(addInfoItems.length > 0
      ? ['', '#### 🧾 Metadata Kasir & Transaksi Tambahan (Tag 62)', ...addInfoItems]
      : []),
    '',
    `#### 🛡️ Audit Keamanan Anti-Timpa & Anti-Penipuan`,
    riskSection,
    '',
    `> 💡 **Klik tombol Google Maps di bawah** untuk langsung membuka titik pencarian toko **${parsed.merchantName}** maupun area wilayah kode posnya. *(Sesuai standar EMVCo & UU PDP, QRIS hanya memuat kota/kode pos pendaftaran usaha — bukan alamat rumah pribadi atau GPS live pemilik).*`,
  ].filter((line) => line !== '');

  return {
    content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1').replace(/\n(> 💡)/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 3. DEEP EMAIL OSINT & DOMAIN SECURITY INSPECTOR (/cekemail)
// ============================================================================

// Pure TypeScript MD5 (RFC 1321) for Gravatar profile hash lookup
export function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const padLen = ((56 - ((bytes.length + 1) % 64)) + 64) % 64;
  const totalLen = bytes.length + 1 + padLen + 8;
  const buf = new Uint8Array(totalLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 8, bitLen >>> 0, true);
  view.setUint32(totalLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < totalLen; offset += 64) {
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F = 0;
      let g = 0;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      const word = view.getUint32(offset + g * 4, true);
      const sum = (A + F + K[i] + word) >>> 0;
      const rotated = ((sum << S[i]) | (sum >>> (32 - S[i]))) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotated) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);

  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '1secmail.com',
  '1secmail.net',
  '1secmail.org',
  '20minutemail.com',
  '33mail.com',
  'anonaddy.me',
  'burnermail.io',
  'cock.li',
  'crazymailing.com',
  'deadaddress.com',
  'discard.email',
  'discardmail.com',
  'dispostable.com',
  'dropmail.me',
  'emailondeck.com',
  'emkei.cz',
  'fakeinbox.com',
  'fakemail.net',
  'fakemailgenerator.com',
  'generator.email',
  'getairmail.com',
  'getnada.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'harakirimail.com',
  'inboxbear.com',
  'inboxkitten.com',
  'incognitomail.org',
  'internxt.com',
  'jetable.org',
  'kasmail.com',
  'linshi-email.com',
  'mail-temp.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailexpire.com',
  'mailforspam.com',
  'mailinator.com',
  'mailinator.net',
  'mailnesia.com',
  'mailnull.com',
  'mailpoof.com',
  'mailsac.com',
  'mailtemp.info',
  'mintemail.com',
  'mohmal.com',
  'moakt.com',
  'mytemp.email',
  'nada.email',
  'owlymail.com',
  'pokemail.net',
  'sharklasers.com',
  'spam4.me',
  'spambox.us',
  'spamgourmet.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.dev',
  'tempmail.net',
  'tempmail. ninja',
  'tempmail.plus',
  'tempmailaddress.com',
  'tempmailo.com',
  'tempr.email',
  'throwawaymail.com',
  'tmail.ws',
  'trashmail.com',
  'trashmail.de',
  'trashmail.net',
  'wegwerfmail.de',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

const PUBLIC_MAIL_PROVIDERS: Record<string, string> = {
  'gmail.com': 'Google Gmail (Personal Consumer)',
  'googlemail.com': 'Google Gmail (Alias Internasional)',
  'outlook.com': 'Microsoft Outlook Personal',
  'hotmail.com': 'Microsoft Hotmail / Outlook',
  'live.com': 'Microsoft Live Mail',
  'msn.com': 'Microsoft MSN Mail',
  'yahoo.com': 'Yahoo! Mail Global',
  'yahoo.co.id': 'Yahoo! Mail Indonesia',
  'ymail.com': 'Yahoo! YMail',
  'icloud.com': 'Apple iCloud Mail',
  'me.com': 'Apple iCloud (me.com)',
  'proton.me': 'Proton Mail (Encrypted Swiss Mail)',
  'protonmail.com': 'Proton Mail (Encrypted Swiss Mail)',
  'zohomail.com': 'Zoho Mail',
  'zoho.com': 'Zoho Mail',
  'gmx.com': 'GMX Mail',
  'aol.com': 'AOL Mail',
  'yandex.com': 'Yandex Mail',
  'mail.ru': 'Mail.ru',
  'telkom.net': 'Telkom Indonesia Mail',
};

interface DnsAnswerItem {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

export async function queryDnsOverHttps(
  name: string,
  type: 'MX' | 'TXT' | 'A' | 'NS',
  signal?: AbortSignal
): Promise<{ answers: DnsAnswerItem[]; reachable: boolean }> {
  const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
    name
  )}&type=${type}`;
  const cfJson = await fetchJsonSafe(cfUrl, {
    headers: { Accept: 'application/dns-json' },
    timeoutMs: 6500,
    signal,
  });
  if (cfJson && !Array.isArray(cfJson) && typeof cfJson.Status === 'number') {
    return {
      answers: Array.isArray(cfJson.Answer)
        ? (cfJson.Answer as DnsAnswerItem[])
        : [],
      reachable: true,
    };
  }

  const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const gJson = await fetchJsonSafe(gUrl, {
    headers: { Accept: 'application/json' },
    timeoutMs: 6500,
    signal,
  });
  if (gJson && !Array.isArray(gJson) && typeof gJson.Status === 'number') {
    return {
      answers: Array.isArray(gJson.Answer)
        ? (gJson.Answer as DnsAnswerItem[])
        : [],
      reachable: true,
    };
  }

  return { answers: [], reachable: false };
}

function classifyMxVendor(mxHosts: string[]): string {
  const joined = mxHosts.join(' ').toLowerCase();
  if (!joined) return 'Tidak ada Mail Server (MX Kosong)';
  if (joined.includes('google.com') || joined.includes('googlemail.com')) {
    return 'Google Workspace / Gmail Infrastructure';
  }
  if (joined.includes('outlook.com') || joined.includes('protection.outlook.com')) {
    return 'Microsoft 365 / Exchange Online';
  }
  if (joined.includes('route1.mx.cloudflare.net') || joined.includes('mx.cloudflare.net')) {
    return 'Cloudflare Email Routing';
  }
  if (joined.includes('zoho.com') || joined.includes('zoho.eu')) {
    return 'Zoho Mail Suite';
  }
  if (joined.includes('protonmail.ch') || joined.includes('proton.me')) {
    return 'Proton Mail Enterprise';
  }
  if (joined.includes('yahoodns.net')) {
    return 'Yahoo Mail Infrastructure';
  }
  if (joined.includes('icloud.com')) {
    return 'Apple iCloud Mail';
  }
  if (joined.includes('hostinger.com') || joined.includes('titan.email')) {
    return 'Hostinger / Titan Business Email';
  }
  if (joined.includes('niagahoster') || joined.includes('rumahweb') || joined.includes('idcloudhost')) {
    return 'Hosting Bisnis Indonesia (cPanel / Mail Server Lokal)';
  }
  if (
    joined.includes('mailinator') ||
    joined.includes('guerrillamail') ||
    joined.includes('temp-mail') ||
    joined.includes('1secmail') ||
    joined.includes('yopmail')
  ) {
    return '🚨 Infrastruktur Disposable / Burner Temp-Mail';
  }
  return `Custom / Self-Hosted Mail Server (${mxHosts[0]})`;
}

function classifyIndonesianDomainCategory(domain: string): string | null {
  const d = domain.toLowerCase();
  if (d.endsWith('.go.id')) return 'Instansi Pemerintah Republik Indonesia (.go.id)';
  if (d.endsWith('.desa.id')) return 'Pemerintah Desa Resmi Indonesia (.desa.id)';
  if (d.endsWith('.mil.id')) return 'Militer / TNI Republik Indonesia (.mil.id)';
  if (d.endsWith('.polri.go.id')) return 'Kepolisian Negara Republik Indonesia';
  if (d.endsWith('.ac.id')) return 'Perguruan Tinggi / Universitas Indonesia (.ac.id)';
  if (d.endsWith('.sch.id')) return 'Sekolah Resmi Indonesia (.sch.id)';
  if (d.endsWith('.co.id')) return 'Badan Usaha / Perusahaan Resmi Indonesia (.co.id)';
  if (d.endsWith('.or.id')) return 'Organisasi Resmi Indonesia (.or.id)';
  if (d.endsWith('.web.id') || d.endsWith('.my.id') || d.endsWith('.biz.id')) {
    return 'Domain Terdaftar PANDI Indonesia (.id)';
  }
  if (d.endsWith('.id')) return 'Domain Nasional Indonesia (.id)';
  return null;
}

export async function analyzeEmailInput(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const emailMatch = rawInput
    .trim()
    .match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24})/);
  const email = (emailMatch ? emailMatch[1] : rawInput.trim()).toLowerCase();

  if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email)) {
    throw new Error(
      'Format alamat email tidak valid. Contoh penggunaan: `/cekemail nama@perusahaan.co.id`'
    );
  }

  const [localPart, domain] = email.split('@');
  const plusIndex = localPart.indexOf('+');
  const baseLocal = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;
  const aliasTag = plusIndex >= 0 ? localPart.slice(plusIndex + 1) : '';
  const isGmailConsumer = domain === 'gmail.com' || domain === 'googlemail.com';
  const normalizedCanonical = isGmailConsumer
    ? `${baseLocal.replace(/\./g, '')}@gmail.com`
    : `${baseLocal}@${domain}`;

  const isRoleEmail =
    /^(admin|administrator|support|cs|help|info|contact|billing|finance|invoice|hr|hrd|career|sales|marketing|security|noreply|no-reply|office)$/i.test(
      baseLocal
    );

  const isKnownConsumer = Boolean(PUBLIC_MAIL_PROVIDERS[domain]);
  const indonesianDomainLabel = classifyIndonesianDomainCategory(domain);
  const emailHashMd5 = md5Hex(email.trim().toLowerCase());

  // Parallel live OSINT queries (DoH MX, SPF, DMARC, NS, A, Gravatar, GitHub)
  const [mxRes, txtRes, dmarcRes, nsRes, aRes, gravatarJson, githubSearch] =
    await Promise.all([
      queryDnsOverHttps(domain, 'MX', signal),
      queryDnsOverHttps(domain, 'TXT', signal),
      queryDnsOverHttps(`_dmarc.${domain}`, 'TXT', signal),
      queryDnsOverHttps(domain, 'NS', signal),
      queryDnsOverHttps(domain, 'A', signal),
      fetchJsonSafe(`https://en.gravatar.com/${emailHashMd5}.json`, {
        timeoutMs: 5500,
        signal,
        proxyFirst: true,
      }),
      fetchJsonSafe(
        `https://api.github.com/search/users?q=${encodeURIComponent(`${email} in:email`)}`,
        { timeoutMs: 6000, signal, proxyFirst: true }
      ),
    ]);

  const dnsReachable = mxRes.reachable || txtRes.reachable || aRes.reachable;
  const mxRecords = mxRes.answers;
  const txtRecords = txtRes.answers;
  const dmarcRecords = dmarcRes.answers;
  const nsRecords = nsRes.answers;
  const aRecords = aRes.answers;

  const mxHosts = mxRecords
    .map((r) =>
      String(r.data || '')
        .replace(/^\d+\s+/, '')
        .replace(/\.$/, '')
        .trim()
    )
    .filter(Boolean);

  const mxVendor = classifyMxVendor(mxHosts);
  const isDisposable =
    DISPOSABLE_EMAIL_DOMAINS.has(domain) || mxVendor.includes('Disposable');

  const spfRecord = txtRecords
    .map((r) => String(r.data || '').replace(/^"|"$/g, ''))
    .find((t) => /^v=spf1\b/i.test(t));

  const dmarcRecord = dmarcRecords
    .map((r) => String(r.data || '').replace(/^"|"$/g, ''))
    .find((t) => /^v=DMARC1\b/i.test(t));

  const dmarcPolicyMatch = dmarcRecord?.match(/\bp=([a-z]+)/i);
  const dmarcPolicy = dmarcPolicyMatch ? dmarcPolicyMatch[1].toLowerCase() : null;

  const nsList = nsRecords
    .map((r) => String(r.data || '').replace(/\.$/, '').trim())
    .filter(Boolean)
    .slice(0, 4);

  const primaryIp = aRecords
    .map((r) => String(r.data || '').trim())
    .find((ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip));

  // Resolve Server Geolocation for Custom / Corporate / Gov Domains
  let serverGeo: {
    city?: string;
    region?: string;
    country?: string;
    isp?: string;
    lat?: number;
    lon?: number;
  } | null = null;

  if (primaryIp && !isKnownConsumer) {
    const ipData = await fetchJsonSafe(`https://ipwho.is/${encodeURIComponent(primaryIp)}`, {
      timeoutMs: 5500,
      signal,
      proxyFirst: true,
    });
    if (ipData && !Array.isArray(ipData) && ipData.success !== false) {
      const conn = (ipData.connection as Record<string, unknown> | undefined) || {};
      serverGeo = {
        city: String(ipData.city || '').trim() || undefined,
        region: String(ipData.region || '').trim() || undefined,
        country: String(ipData.country || '').trim() || undefined,
        isp: String(conn.isp || conn.org || ipData.org || '').trim() || undefined,
        lat: typeof ipData.latitude === 'number' ? ipData.latitude : undefined,
        lon: typeof ipData.longitude === 'number' ? ipData.longitude : undefined,
      };
    }
  }

  // Parse Gravatar public profile if found
  let gravatarProfile: {
    displayName?: string;
    preferredUsername?: string;
    currentLocation?: string;
    aboutMe?: string;
    avatarUrl?: string;
    profileUrl?: string;
  } | null = null;

  if (
    gravatarJson &&
    !Array.isArray(gravatarJson) &&
    Array.isArray((gravatarJson as Record<string, unknown>).entry)
  ) {
    const entry = ((gravatarJson as Record<string, unknown>).entry as Array<
      Record<string, unknown>
    >)[0];
    if (entry) {
      gravatarProfile = {
        displayName: String(entry.displayName || '').trim() || undefined,
        preferredUsername: String(entry.preferredUsername || '').trim() || undefined,
        currentLocation: String(entry.currentLocation || '').trim() || undefined,
        aboutMe: String(entry.aboutMe || '').trim().slice(0, 180) || undefined,
        avatarUrl: `https://www.gravatar.com/avatar/${emailHashMd5}?s=256&d=404`,
        profileUrl: String(entry.profileUrl || '').trim() || undefined,
      };
    }
  }

  // Parse GitHub public match if found
  let githubUser: {
    login: string;
    htmlUrl: string;
    name?: string;
    location?: string;
    company?: string;
    bio?: string;
  } | null = null;

  if (
    githubSearch &&
    !Array.isArray(githubSearch) &&
    Array.isArray((githubSearch as Record<string, unknown>).items)
  ) {
    const items = (githubSearch as Record<string, unknown>).items as Array<
      Record<string, unknown>
    >;
    if (items.length > 0 && items[0].login) {
      const login = String(items[0].login);
      const userDetail = await fetchJsonSafe(
        `https://api.github.com/users/${encodeURIComponent(login)}`,
        { timeoutMs: 5000, signal, proxyFirst: true }
      );
      const detailObj =
        userDetail && !Array.isArray(userDetail) ? userDetail : items[0];
      githubUser = {
        login,
        htmlUrl: String(detailObj.html_url || `https://github.com/${login}`),
        name: String(detailObj.name || '').trim() || undefined,
        location: String(detailObj.location || '').trim() || undefined,
        company: String(detailObj.company || '').trim() || undefined,
        bio: String(detailObj.bio || '').trim().slice(0, 160) || undefined,
      };
    }
  }

  // Calculate Anti-Spoofing & Deliverability Verdict
  const deliverable = mxHosts.length > 0 || (!dnsReachable && isKnownConsumer);
  let securityGrade = '⚠️ Sedang (SPF ada, DMARC belum ketat)';
  if (isDisposable) {
    securityGrade = '🚨 Risiko Tinggi — Email Sementara / Burner (Disposable)';
  } else if (!dnsReachable) {
    securityGrade = 'ℹ️ Mode Offline / Jaringan DNS Terbatas (Validasi Sintaks & Provider)';
  } else if (!deliverable) {
    securityGrade = '🚨 Domain Tidak Aktif Menerima Email (MX Kosong)';
  } else if (
    spfRecord &&
    (dmarcPolicy === 'reject' || dmarcPolicy === 'quarantine')
  ) {
    securityGrade = `✅ Kuat (SPF Aktif + DMARC p=${dmarcPolicy})`;
  } else if (!spfRecord && !dmarcRecord) {
    securityGrade = '⚠️ Rentan Spoofing (Tidak ada SPF maupun DMARC)';
  }

  const actionLinks: ToolActionLink[] = [];

  const publicProfileLocation =
    githubUser?.location || gravatarProfile?.currentLocation;
  if (publicProfileLocation) {
    actionLinks.push({
      label: `📍 Buka Lokasi Profil (${publicProfileLocation.slice(0, 26)}) di Google Maps`,
      url: buildGoogleMapsSearchUrl(publicProfileLocation),
      kind: 'maps',
    });
  }

  if (serverGeo && (serverGeo.lat !== undefined || serverGeo.city)) {
    const serverQuery =
      serverGeo.lat !== undefined && serverGeo.lon !== undefined
        ? `${serverGeo.lat},${serverGeo.lon}`
        : `${serverGeo.city || ''} ${serverGeo.country || ''}`;
    actionLinks.push({
      label: `🗺️ Lokasi Server Domain (${
        serverGeo.city || serverGeo.country || domain
      }) di Google Maps`,
      url: buildGoogleMapsSearchUrl(serverQuery),
      kind: 'maps',
    });
  } else if (!isKnownConsumer && indonesianDomainLabel) {
    // Let user search the corporate/institution domain entity directly on Google Maps
    const orgKeyword = domain.split('.')[0].replace(/[-_]/g, ' ');
    actionLinks.push({
      label: `📍 Cari Instansi/Perusahaan "${orgKeyword}" di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${orgKeyword} Indonesia`),
      kind: 'maps',
    });
  }

  if (githubUser) {
    actionLinks.push({
      label: `🐙 Buka Profil GitHub (@${githubUser.login})`,
      url: githubUser.htmlUrl,
      kind: 'external',
    });
  }

  if (gravatarProfile?.profileUrl) {
    actionLinks.push({
      label: `👤 Buka Profil Gravatar Publik`,
      url: gravatarProfile.profileUrl,
      kind: 'external',
    });
  }

  actionLinks.push({
    label: '🛡️ Cek Riwayat Kebocoran Data (HaveIBeenPwned)',
    url: `https://haveibeenpwned.com/account/${encodeURIComponent(email)}`,
    kind: 'verify',
  });

  const footprintLines: string[] = [];
  if (gravatarProfile) {
    footprintLines.push(
      `- **Gravatar Publik**: ✅ **Ditemukan** — Nama: **${
        gravatarProfile.displayName || gravatarProfile.preferredUsername || '-'
      }**${
        gravatarProfile.currentLocation
          ? ` · Lokasi: **${gravatarProfile.currentLocation}**`
          : ''
      }${gravatarProfile.aboutMe ? ` · Bio: _"${gravatarProfile.aboutMe}"_` : ''}`
    );
  } else {
    footprintLines.push(
      `- **Gravatar Publik (MD5 \`${emailHashMd5.slice(0, 12)}…\`)**: Tidak ditemukan profil Gravatar publik`
    );
  }

  if (githubUser) {
    footprintLines.push(
      `- **GitHub Developer OSINT**: ✅ **@${githubUser.login}**${
        githubUser.name ? ` (${githubUser.name})` : ''
      }${githubUser.company ? ` · Instansi: ${githubUser.company}` : ''}${
        githubUser.location ? ` · Lokasi: **${githubUser.location}**` : ''
      }`
    );
  } else {
    footprintLines.push(`- **GitHub Public Email Match**: Tidak terekspos publik di GitHub`);
  }

  const lines = [
    `### 📧 Hasil Deep Email OSINT & Audit Keamanan Domain`,
    '',
    `| Parameter | Hasil Investigasi |`,
    `| :--- | :--- |`,
    `| **Alamat Email** | \`${email}\` |`,
    `| **Alamat Kanonik (Tanpa Alias)** | \`${normalizedCanonical}\`${
      aliasTag ? ` *(Tag alias: \`+${aliasTag}\`)*` : ''
    } |`,
    `| **Tipe Akun** | ${
      isDisposable
        ? '🚨 **Burner / Temp-Mail Sekali Pakai**'
        : isRoleEmail
        ? '🏢 Akun Fungsional / Divisi (`Role Account`)'
        : isKnownConsumer
        ? `👤 Email Personal (${PUBLIC_MAIL_PROVIDERS[domain]})`
        : '🏛️ Email Domain Kustom / Korporat / Instansi'
    } |`,
    `| **Klasifikasi Domain** | ${
      indonesianDomainLabel || PUBLIC_MAIL_PROVIDERS[domain] || `Domain Internasional (\`${domain}\`)`
    } |`,
    `| **Status Kotak Masuk (MX)** | ${
      deliverable
        ? `✅ **Aktif Menerima Email** (${mxHosts.length} record MX)`
        : '🚨 **Tidak Aktif / Domain Tidak Menerima Email**'
    } |`,
    `| **Infrastruktur Mail Server** | **${mxVendor}** |`,
    `| **Skor Anti-Spoofing** | ${securityGrade} |`,
    '',
    `#### 🌐 Forensik DNS & Keamanan Email (\`${domain}\`)`,
    `- **Mail Exchanger (MX)**: ${
      mxHosts.length > 0 ? mxHosts.slice(0, 4).map((h) => `\`${h}\``).join(', ') : '_Tidak ada_'
    }`,
    `- **Kebijakan SPF**: ${spfRecord ? `\`${spfRecord.slice(0, 120)}\`` : '_Tidak ditemukan_'}`,
    `- **Kebijakan DMARC**: ${
      dmarcRecord ? `\`${dmarcRecord.slice(0, 120)}\`` : '_Tidak ditemukan (`_dmarc` kosong)_'
    }`,
    nsList.length > 0
      ? `- **Nameserver (NS)**: ${nsList.map((n) => `\`${n}\``).join(', ')}`
      : '',
    primaryIp
      ? `- **IP Domain Utama (A Record)**: \`${primaryIp}\`${
          serverGeo
            ? ` — **${[serverGeo.city, serverGeo.region, serverGeo.country]
                .filter(Boolean)
                .join(', ')}** (${serverGeo.isp || 'Data Center'})`
            : ''
        }`
      : '',
    '',
    `#### 🕵️ Jejak Profil Publik (Open-Source Footprint)`,
    ...footprintLines,
  ].filter(Boolean);

  return {
    content: lines
      .join('\n')
      .replace(/\n(#### )/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 4. PHONE NUMBER, OPERATOR, PSTN & HLR AREA INSPECTOR (/ceknomor)
// ============================================================================

const INTERNATIONAL_COUNTRY_CODES: Array<{
  code: string;
  country: string;
  mapQuery: string;
}> = [
  { code: '62', country: 'Indonesia 🇮🇩', mapQuery: 'Indonesia' },
  { code: '60', country: 'Malaysia 🇲🇾', mapQuery: 'Kuala Lumpur, Malaysia' },
  { code: '65', country: 'Singapura 🇸🇬', mapQuery: 'Singapore' },
  { code: '66', country: 'Thailand 🇹🇭', mapQuery: 'Bangkok, Thailand' },
  { code: '63', country: 'Filipina 🇵🇭', mapQuery: 'Manila, Philippines' },
  { code: '84', country: 'Vietnam 🇻🇳', mapQuery: 'Hanoi, Vietnam' },
  { code: '673', country: 'Brunei Darussalam 🇧🇳', mapQuery: 'Bandar Seri Begawan, Brunei' },
  { code: '670', country: 'Timor Leste 🇹🇱', mapQuery: 'Dili, Timor-Leste' },
  { code: '81', country: 'Jepang 🇯🇵', mapQuery: 'Tokyo, Japan' },
  { code: '82', country: 'Korea Selatan 🇰🇷', mapQuery: 'Seoul, South Korea' },
  { code: '86', country: 'Tiongkok 🇨🇳', mapQuery: 'Beijing, China' },
  { code: '852', country: 'Hong Kong 🇭🇰', mapQuery: 'Hong Kong' },
  { code: '886', country: 'Taiwan 🇹🇼', mapQuery: 'Taipei, Taiwan' },
  { code: '91', country: 'India 🇮🇳', mapQuery: 'New Delhi, India' },
  { code: '92', country: 'Pakistan 🇵🇰', mapQuery: 'Islamabad, Pakistan' },
  { code: '880', country: 'Bangladesh 🇧🇩', mapQuery: 'Dhaka, Bangladesh' },
  { code: '966', country: 'Arab Saudi 🇸🇦', mapQuery: 'Riyadh, Saudi Arabia' },
  { code: '971', country: 'Uni Emirat Arab 🇦🇪', mapQuery: 'Dubai, United Arab Emirates' },
  { code: '974', country: 'Qatar 🇶🇦', mapQuery: 'Doha, Qatar' },
  { code: '90', country: 'Turki 🇹🇷', mapQuery: 'Istanbul, Turkey' },
  { code: '61', country: 'Australia 🇦🇺', mapQuery: 'Sydney, Australia' },
  { code: '64', country: 'Selandia Baru 🇳🇿', mapQuery: 'Auckland, New Zealand' },
  { code: '44', country: 'Inggris Raya (UK) 🇬🇧', mapQuery: 'London, United Kingdom' },
  { code: '49', country: 'Jerman 🇩🇪', mapQuery: 'Berlin, Germany' },
  { code: '33', country: 'Prancis 🇫🇷', mapQuery: 'Paris, France' },
  { code: '31', country: 'Belanda 🇳🇱', mapQuery: 'Amsterdam, Netherlands' },
  { code: '34', country: 'Spanyol 🇪🇸', mapQuery: 'Madrid, Spain' },
  { code: '39', country: 'Italia 🇮🇹', mapQuery: 'Rome, Italy' },
  { code: '41', country: 'Swiss 🇨🇭', mapQuery: 'Zurich, Switzerland' },
  { code: '7', country: 'Rusia / Kazakhstan 🇷🇺', mapQuery: 'Moscow, Russia' },
  { code: '55', country: 'Brasil 🇧🇷', mapQuery: 'Sao Paulo, Brazil' },
  { code: '52', country: 'Meksiko 🇲🇽', mapQuery: 'Mexico City, Mexico' },
  { code: '20', country: 'Mesir 🇪🇬', mapQuery: 'Cairo, Egypt' },
  { code: '234', country: 'Nigeria 🇳🇬', mapQuery: 'Lagos, Nigeria' },
  { code: '27', country: 'Afrika Selatan 🇿🇦', mapQuery: 'Johannesburg, South Africa' },
  { code: '1', country: 'Amerika Serikat / Kanada 🇺🇸🇨🇦', mapQuery: 'United States' },
];

const INDONESIAN_MOBILE_PREFIXES: Record<
  string,
  { operator: string; brand: string; network: string }
> = {
  '0811': { operator: 'Telkomsel', brand: 'Telkomsel Halo (Pascabayar)', network: '4G LTE / 5G' },
  '0812': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Simpati)', network: '4G LTE / 5G' },
  '0813': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Simpati)', network: '4G LTE / 5G' },
  '0821': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Simpati)', network: '4G LTE / 5G' },
  '0822': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Loop / Simpati)', network: '4G LTE / 5G' },
  '0823': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Kartu As)', network: '4G LTE / 5G' },
  '0851': { operator: 'Telkomsel', brand: 'by.U Digital / Telkomsel PraBayar', network: '4G LTE / 5G' },
  '0852': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Kartu As)', network: '4G LTE / 5G' },
  '0853': { operator: 'Telkomsel', brand: 'Telkomsel PraBayar (Kartu As)', network: '4G LTE / 5G' },
  '0814': { operator: 'Indosat Ooredoo Hutchison', brand: 'Indosat IM2 Broadband', network: '4G LTE / 5G' },
  '0815': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 / Matrix / Mentari', network: '4G LTE / 5G' },
  '0816': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 / Mentari', network: '4G LTE / 5G' },
  '0855': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 Postpaid (Matrix)', network: '4G LTE / 5G' },
  '0856': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 Prabayar', network: '4G LTE / 5G' },
  '0857': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 Prabayar', network: '4G LTE / 5G' },
  '0858': { operator: 'Indosat Ooredoo Hutchison', brand: 'IM3 / Mentari', network: '4G LTE / 5G' },
  '0894': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0895': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0896': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0897': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0898': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0899': { operator: 'Indosat Ooredoo Hutchison (Tri)', brand: 'Tri (3) Indonesia', network: '4G LTE / 5G' },
  '0817': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar / Prioritas', network: '4G LTE / 5G' },
  '0818': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar / Prioritas', network: '4G LTE / 5G' },
  '0819': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar / Prioritas', network: '4G LTE / 5G' },
  '0859': { operator: 'XLSMART (XL Axiata)', brand: 'XL / Live.On', network: '4G LTE / 5G' },
  '0877': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar', network: '4G LTE / 5G' },
  '0878': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar', network: '4G LTE / 5G' },
  '0879': { operator: 'XLSMART (XL Axiata)', brand: 'XL Prabayar', network: '4G LTE / 5G' },
  '0831': { operator: 'XLSMART (Axis)', brand: 'AXIS Prabayar', network: '4G LTE / 5G' },
  '0832': { operator: 'XLSMART (Axis)', brand: 'AXIS Prabayar', network: '4G LTE / 5G' },
  '0833': { operator: 'XLSMART (Axis)', brand: 'AXIS Prabayar', network: '4G LTE / 5G' },
  '0838': { operator: 'XLSMART (Axis)', brand: 'AXIS Prabayar', network: '4G LTE / 5G' },
  '0881': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0882': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0883': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0884': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0885': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0886': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0887': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0888': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0889': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G', network: '4G LTE / 5G' },
  '0890': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G (Blok Baru)', network: '4G LTE / 5G' },
  '0891': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G (Blok Baru)', network: '4G LTE / 5G' },
  '0892': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G (Blok Baru)', network: '4G LTE / 5G' },
  '0893': { operator: 'XLSMART (Smartfren)', brand: 'Smartfren 4G/5G (Blok Baru)', network: '4G LTE / 5G' },
  '0827': { operator: 'Net1 Indonesia (Eks-Ceria)', brand: 'Net1 / Ceria', network: '4G LTE Fixed-Mobile' },
  '0828': { operator: 'Net1 Indonesia (Eks-Ceria)', brand: 'Net1 / Ceria', network: '4G LTE Fixed-Mobile' },
};

// Complete Official 242 Indonesian PSTN Area Codes (Google libphonenumber 62.txt + ITU-T / Komdigi)
// 4-digit checked before 3-digit — every landline code resolves to its exact city & province!
interface PstnAreaInfo {
  city: string;
  province: string;
  coverageNote?: string;
}

const INDONESIAN_PSTN_AREA_CODES: Record<string, PstnAreaInfo> = {
  // 3-Digit Metropolitan Exchanges
  '021': { city: 'DKI Jakarta', province: 'DKI Jakarta', coverageNote: 'Sentral telepon tetap Jabodetabek (DKI Jakarta, Bekasi, Depok, Tangerang & sebagian Bogor).' },
  '022': { city: 'Kota Bandung', province: 'Jawa Barat', coverageNote: 'Sentral telepon tetap Bandung Raya (Kota Bandung, Cimahi, Kab. Bandung & Bandung Barat).' },
  '024': { city: 'Kota Semarang', province: 'Jawa Tengah', coverageNote: 'Sentral telepon tetap Kota Semarang, Ungaran & Demak.' },
  '031': { city: 'Kota Surabaya', province: 'Jawa Timur', coverageNote: 'Sentral telepon tetap Kota Surabaya, Sidoarjo, Gresik & Bangkalan.' },
  '061': { city: 'Kota Medan', province: 'Sumatera Utara', coverageNote: 'Sentral telepon tetap Kota Medan, Binjai & Deli Serdang.' },

  // Banten & Jawa Barat (023x - 026x)
  '0231': { city: 'Kota Cirebon', province: 'Jawa Barat' },
  '0232': { city: 'Kuningan', province: 'Jawa Barat' },
  '0233': { city: 'Majalengka', province: 'Jawa Barat' },
  '0234': { city: 'Indramayu', province: 'Jawa Barat' },
  '0251': { city: 'Kota Bogor', province: 'Jawa Barat' },
  '0252': { city: 'Rangkasbitung (Lebak)', province: 'Banten' },
  '0253': { city: 'Pandeglang', province: 'Banten' },
  '0254': { city: 'Kota Serang & Cilegon', province: 'Banten' },
  '0257': { city: 'Cinangka (Serang Barat)', province: 'Banten' },
  '0260': { city: 'Subang', province: 'Jawa Barat' },
  '0261': { city: 'Sumedang', province: 'Jawa Barat' },
  '0262': { city: 'Garut', province: 'Jawa Barat' },
  '0263': { city: 'Cianjur', province: 'Jawa Barat' },
  '0264': { city: 'Purwakarta & Cikampek', province: 'Jawa Barat' },
  '0265': { city: 'Kota Tasikmalaya, Ciamis & Banjar', province: 'Jawa Barat' },
  '0266': { city: 'Kota Sukabumi & Palabuhanratu', province: 'Jawa Barat' },
  '0267': { city: 'Karawang', province: 'Jawa Barat' },

  // Jawa Tengah & DI Yogyakarta (027x - 029x)
  '0271': { city: 'Kota Surakarta (Solo)', province: 'Jawa Tengah' },
  '0272': { city: 'Klaten', province: 'Jawa Tengah' },
  '0273': { city: 'Wonogiri', province: 'Jawa Tengah' },
  '0274': { city: 'Kota Yogyakarta', province: 'DI Yogyakarta' },
  '0275': { city: 'Purworejo', province: 'Jawa Tengah' },
  '0276': { city: 'Boyolali', province: 'Jawa Tengah' },
  '0280': { city: 'Majenang / Cilacap Barat', province: 'Jawa Tengah' },
  '0281': { city: 'Purwokerto & Purbalingga', province: 'Jawa Tengah' },
  '0282': { city: 'Cilacap', province: 'Jawa Tengah' },
  '0283': { city: 'Kota Tegal & Brebes', province: 'Jawa Tengah' },
  '0284': { city: 'Pemalang', province: 'Jawa Tengah' },
  '0285': { city: 'Kota Pekalongan & Batang', province: 'Jawa Tengah' },
  '0286': { city: 'Wonosobo & Banjarnegara', province: 'Jawa Tengah' },
  '0287': { city: 'Kebumen & Gombong', province: 'Jawa Tengah' },
  '0289': { city: 'Bumiayu (Brebes Selatan)', province: 'Jawa Tengah' },
  '0291': { city: 'Kudus, Jepara & Demak', province: 'Jawa Tengah' },
  '0292': { city: 'Purwodadi (Grobogan)', province: 'Jawa Tengah' },
  '0293': { city: 'Kota Magelang & Temanggung', province: 'Jawa Tengah' },
  '0294': { city: 'Kendal & Kaliwungu', province: 'Jawa Tengah' },
  '0295': { city: 'Pati & Rembang', province: 'Jawa Tengah' },
  '0296': { city: 'Blora & Cepu', province: 'Jawa Tengah' },
  '0297': { city: 'Karimunjawa (Jepara)', province: 'Jawa Tengah' },
  '0298': { city: 'Kota Salatiga & Ambarawa', province: 'Jawa Tengah' },

  // Jawa Timur (032x - 035x)
  '0321': { city: 'Kota Mojokerto & Jombang', province: 'Jawa Timur' },
  '0322': { city: 'Lamongan & Babat', province: 'Jawa Timur' },
  '0323': { city: 'Sampang (Madura)', province: 'Jawa Timur' },
  '0324': { city: 'Pamekasan (Madura)', province: 'Jawa Timur' },
  '0325': { city: 'Sangkapura (Pulau Bawean)', province: 'Jawa Timur' },
  '0327': { city: 'Kepulauan Kangean & Masalembu', province: 'Jawa Timur' },
  '0328': { city: 'Sumenep (Madura)', province: 'Jawa Timur' },
  '0331': { city: 'Jember', province: 'Jawa Timur' },
  '0332': { city: 'Bondowoso', province: 'Jawa Timur' },
  '0333': { city: 'Banyuwangi & Genteng', province: 'Jawa Timur' },
  '0334': { city: 'Lumajang', province: 'Jawa Timur' },
  '0335': { city: 'Kota Probolinggo & Kraksaan', province: 'Jawa Timur' },
  '0336': { city: 'Ambulu / Jember Selatan', province: 'Jawa Timur' },
  '0338': { city: 'Situbondo', province: 'Jawa Timur' },
  '0341': { city: 'Kota Malang & Kota Batu', province: 'Jawa Timur' },
  '0342': { city: 'Kota Blitar & Wlingi', province: 'Jawa Timur' },
  '0343': { city: 'Kota Pasuruan & Pandaan', province: 'Jawa Timur' },
  '0351': { city: 'Kota Madiun, Magetan & Ngawi', province: 'Jawa Timur' },
  '0352': { city: 'Ponorogo', province: 'Jawa Timur' },
  '0353': { city: 'Bojonegoro', province: 'Jawa Timur' },
  '0354': { city: 'Kota Kediri & Pare', province: 'Jawa Timur' },
  '0355': { city: 'Tulungagung & Trenggalek', province: 'Jawa Timur' },
  '0356': { city: 'Tuban', province: 'Jawa Timur' },
  '0357': { city: 'Pacitan', province: 'Jawa Timur' },
  '0358': { city: 'Nganjuk & Kertosono', province: 'Jawa Timur' },

  // Bali, NTB & NTT (036x - 038x)
  '0361': { city: 'Kota Denpasar, Badung & Gianyar', province: 'Bali' },
  '0362': { city: 'Singaraja (Buleleng)', province: 'Bali' },
  '0363': { city: 'Amlapura (Karangasem)', province: 'Bali' },
  '0365': { city: 'Negara (Jembrana)', province: 'Bali' },
  '0366': { city: 'Klungkung & Bangli', province: 'Bali' },
  '0368': { city: 'Baturiti (Tabanan)', province: 'Bali' },
  '0370': { city: 'Kota Mataram & Praya', province: 'Nusa Tenggara Barat' },
  '0371': { city: 'Sumbawa Besar', province: 'Nusa Tenggara Barat' },
  '0372': { city: 'Alas & Taliwang (Sumbawa Barat)', province: 'Nusa Tenggara Barat' },
  '0373': { city: 'Dompu', province: 'Nusa Tenggara Barat' },
  '0374': { city: 'Kota Bima', province: 'Nusa Tenggara Barat' },
  '0376': { city: 'Selong (Lombok Timur)', province: 'Nusa Tenggara Barat' },
  '0380': { city: 'Kota Kupang', province: 'Nusa Tenggara Timur' },
  '0381': { city: 'Ende', province: 'Nusa Tenggara Timur' },
  '0382': { city: 'Maumere (Sikka)', province: 'Nusa Tenggara Timur' },
  '0383': { city: 'Larantuka (Flores Timur)', province: 'Nusa Tenggara Timur' },
  '0384': { city: 'Bajawa (Ngada)', province: 'Nusa Tenggara Timur' },
  '0385': { city: 'Labuan Bajo & Ruteng', province: 'Nusa Tenggara Timur' },
  '0386': { city: 'Kalabahi (Alor)', province: 'Nusa Tenggara Timur' },
  '0387': { city: 'Waingapu & Waikabubak (Sumba)', province: 'Nusa Tenggara Timur' },
  '0388': { city: 'Kefamenanu & Soe (Timor)', province: 'Nusa Tenggara Timur' },
  '0389': { city: 'Atambua (Belu)', province: 'Nusa Tenggara Timur' },

  // Sulawesi (040x - 048x)
  '0401': { city: 'Kota Kendari', province: 'Sulawesi Tenggara' },
  '0402': { city: 'Kota Baubau (Pulau Buton)', province: 'Sulawesi Tenggara' },
  '0403': { city: 'Raha (Muna)', province: 'Sulawesi Tenggara' },
  '0404': { city: 'Wanci (Wakatobi)', province: 'Sulawesi Tenggara' },
  '0405': { city: 'Kolaka', province: 'Sulawesi Tenggara' },
  '0408': { city: 'Unaaha (Konawe)', province: 'Sulawesi Tenggara' },
  '0410': { city: 'Pangkajene (Pangkep)', province: 'Sulawesi Selatan' },
  '0411': { city: 'Kota Makassar, Maros & Sungguminasa', province: 'Sulawesi Selatan' },
  '0413': { city: 'Bulukumba & Bantaeng', province: 'Sulawesi Selatan' },
  '0414': { city: 'Benteng (Kepulauan Selayar)', province: 'Sulawesi Selatan' },
  '0417': { city: 'Malino (Gowa)', province: 'Sulawesi Selatan' },
  '0418': { city: 'Takalar', province: 'Sulawesi Selatan' },
  '0419': { city: 'Jeneponto', province: 'Sulawesi Selatan' },
  '0420': { city: 'Enrekang', province: 'Sulawesi Selatan' },
  '0421': { city: 'Kota Parepare & Pinrang', province: 'Sulawesi Selatan' },
  '0422': { city: 'Majene', province: 'Sulawesi Barat' },
  '0423': { city: 'Makale & Rantepao (Toraja)', province: 'Sulawesi Selatan' },
  '0426': { city: 'Mamuju', province: 'Sulawesi Barat' },
  '0427': { city: 'Barru', province: 'Sulawesi Selatan' },
  '0428': { city: 'Polewali Mandar & Mamasa', province: 'Sulawesi Barat' },
  '0430': { city: 'Amurang (Minahasa Selatan)', province: 'Sulawesi Utara' },
  '0431': { city: 'Kota Manado, Tomohon & Tondano', province: 'Sulawesi Utara' },
  '0432': { city: 'Tahuna (Kepulauan Sangihe)', province: 'Sulawesi Utara' },
  '0434': { city: 'Kota Kotamobagu', province: 'Sulawesi Utara' },
  '0435': { city: 'Kota Gorontalo & Limboto', province: 'Gorontalo' },
  '0438': { city: 'Kota Bitung', province: 'Sulawesi Utara' },
  '0443': { city: 'Marisa (Pohuwato)', province: 'Gorontalo' },
  '0450': { city: 'Parigi Moutong', province: 'Sulawesi Tengah' },
  '0451': { city: 'Kota Palu', province: 'Sulawesi Tengah' },
  '0452': { city: 'Poso', province: 'Sulawesi Tengah' },
  '0453': { city: 'Tolitoli', province: 'Sulawesi Tengah' },
  '0454': { city: 'Tinombo', province: 'Sulawesi Tengah' },
  '0457': { city: 'Donggala', province: 'Sulawesi Tengah' },
  '0458': { city: 'Tentena (Poso)', province: 'Sulawesi Tengah' },
  '0461': { city: 'Luwuk (Banggai)', province: 'Sulawesi Tengah' },
  '0462': { city: 'Banggai Kepulauan', province: 'Sulawesi Tengah' },
  '0463': { city: 'Bunta (Banggai)', province: 'Sulawesi Tengah' },
  '0464': { city: 'Ampana (Tojo Una-Una)', province: 'Sulawesi Tengah' },
  '0465': { city: 'Kolonodale (Morowali Utara)', province: 'Sulawesi Tengah' },
  '0471': { city: 'Kota Palopo', province: 'Sulawesi Selatan' },
  '0472': { city: 'Pitumpanua (Wajo)', province: 'Sulawesi Selatan' },
  '0473': { city: 'Masamba (Luwu Utara)', province: 'Sulawesi Selatan' },
  '0474': { city: 'Malili (Luwu Timur)', province: 'Sulawesi Selatan' },
  '0475': { city: 'Sorowako (Luwu Timur)', province: 'Sulawesi Selatan' },
  '0481': { city: 'Watampone (Bone)', province: 'Sulawesi Selatan' },
  '0482': { city: 'Sinjai', province: 'Sulawesi Selatan' },
  '0484': { city: 'Watansoppeng (Soppeng)', province: 'Sulawesi Selatan' },
  '0485': { city: 'Sengkang (Wajo)', province: 'Sulawesi Selatan' },

  // Kalimantan (051x - 056x)
  '0511': { city: 'Kota Banjarmasin, Banjarbaru & Martapura', province: 'Kalimantan Selatan' },
  '0512': { city: 'Pelaihari (Tanah Laut)', province: 'Kalimantan Selatan' },
  '0513': { city: 'Kuala Kapuas & Pulang Pisau', province: 'Kalimantan Tengah' },
  '0517': { city: 'Kandangan, Barabai & Rantau', province: 'Kalimantan Selatan' },
  '0518': { city: 'Kotabaru & Batulicin', province: 'Kalimantan Selatan' },
  '0519': { city: 'Muara Teweh (Barito Utara)', province: 'Kalimantan Tengah' },
  '0522': { city: 'Ampah (Barito Timur)', province: 'Kalimantan Tengah' },
  '0525': { city: 'Buntok (Barito Selatan)', province: 'Kalimantan Tengah' },
  '0526': { city: 'Tamiang Layang & Tanjung (Tabalong)', province: 'Kalimantan Selatan' },
  '0527': { city: 'Amuntai (Hulu Sungai Utara)', province: 'Kalimantan Selatan' },
  '0528': { city: 'Puruk Cahu (Murung Raya)', province: 'Kalimantan Tengah' },
  '0531': { city: 'Sampit (Kotawaringin Timur)', province: 'Kalimantan Tengah' },
  '0532': { city: 'Pangkalan Bun (Kotawaringin Barat)', province: 'Kalimantan Tengah' },
  '0534': { city: 'Ketapang', province: 'Kalimantan Barat' },
  '0536': { city: 'Kota Palangka Raya & Kasongan', province: 'Kalimantan Tengah' },
  '0537': { city: 'Kuala Kurun (Gunung Mas)', province: 'Kalimantan Tengah' },
  '0538': { city: 'Kuala Pembuang (Seruyan)', province: 'Kalimantan Tengah' },
  '0539': { city: 'Kota Besi & Sampit Utara', province: 'Kalimantan Tengah' },
  '0541': { city: 'Kota Samarinda & Tenggarong', province: 'Kalimantan Timur' },
  '0542': { city: 'Kota Balikpapan', province: 'Kalimantan Timur' },
  '0543': { city: 'Tanah Grogot (Paser)', province: 'Kalimantan Timur' },
  '0545': { city: 'Melak (Kutai Barat)', province: 'Kalimantan Timur' },
  '0548': { city: 'Kota Bontang', province: 'Kalimantan Timur' },
  '0549': { city: 'Sangatta (Kutai Timur)', province: 'Kalimantan Timur' },
  '0551': { city: 'Kota Tarakan & Bunyu', province: 'Kalimantan Utara' },
  '0552': { city: 'Tanjung Selor & Malinau', province: 'Kalimantan Utara' },
  '0553': { city: 'Malinau', province: 'Kalimantan Utara' },
  '0554': { city: 'Tanjung Redeb (Berau)', province: 'Kalimantan Timur' },
  '0556': { city: 'Nunukan', province: 'Kalimantan Utara' },
  '0561': { city: 'Kota Pontianak & Mempawah', province: 'Kalimantan Barat' },
  '0562': { city: 'Kota Singkawang, Sambas & Bengkayang', province: 'Kalimantan Barat' },
  '0563': { city: 'Ngabang (Landak)', province: 'Kalimantan Barat' },
  '0564': { city: 'Sanggau', province: 'Kalimantan Barat' },
  '0565': { city: 'Sintang', province: 'Kalimantan Barat' },
  '0567': { city: 'Putussibau (Kapuas Hulu)', province: 'Kalimantan Barat' },
  '0568': { city: 'Nanga Pinoh (Melawi)', province: 'Kalimantan Barat' },

  // Sumatera Utara & Aceh (062x - 065x)
  '0620': { city: 'Pangkalan Brandan (Langkat)', province: 'Sumatera Utara' },
  '0621': { city: 'Kota Tebing Tinggi', province: 'Sumatera Utara' },
  '0622': { city: 'Kota Pematangsiantar & Perdagangan', province: 'Sumatera Utara' },
  '0623': { city: 'Kisaran & Kota Tanjungbalai', province: 'Sumatera Utara' },
  '0624': { city: 'Rantauprapat & Labuhanbatu', province: 'Sumatera Utara' },
  '0625': { city: 'Parapat & Ajibata (Danau Toba)', province: 'Sumatera Utara' },
  '0626': { city: 'Pangururan (Pulau Samosir)', province: 'Sumatera Utara' },
  '0627': { city: 'Sidikalang & Subulussalam', province: 'Sumatera Utara' },
  '0628': { city: 'Kabanjahe & Berastagi (Karo)', province: 'Sumatera Utara' },
  '0629': { city: 'Kutacane (Aceh Tenggara)', province: 'Aceh' },
  '0630': { city: 'Teluk Dalam (Nias Selatan)', province: 'Sumatera Utara' },
  '0631': { city: 'Kota Sibolga & Pandan', province: 'Sumatera Utara' },
  '0632': { city: 'Balige (Toba)', province: 'Sumatera Utara' },
  '0633': { city: 'Tarutung (Tapanuli Utara)', province: 'Sumatera Utara' },
  '0634': { city: 'Kota Padangsidimpuan', province: 'Sumatera Utara' },
  '0635': { city: 'Gunung Tua (Padang Lawas Utara)', province: 'Sumatera Utara' },
  '0636': { city: 'Panyabungan (Mandailing Natal)', province: 'Sumatera Utara' },
  '0638': { city: 'Barus (Tapanuli Tengah)', province: 'Sumatera Utara' },
  '0639': { city: 'Kota Gunungsitoli (Pulau Nias)', province: 'Sumatera Utara' },
  '0641': { city: 'Kota Langsa', province: 'Aceh' },
  '0642': { city: 'Blangkejeren (Gayo Lues)', province: 'Aceh' },
  '0643': { city: 'Takengon (Aceh Tengah)', province: 'Aceh' },
  '0644': { city: 'Bireuen', province: 'Aceh' },
  '0645': { city: 'Kota Lhokseumawe & Lhoksukon', province: 'Aceh' },
  '0646': { city: 'Idi Rayeuk (Aceh Timur)', province: 'Aceh' },
  '0650': { city: 'Sinabang (Pulau Simeulue)', province: 'Aceh' },
  '0651': { city: 'Kota Banda Aceh & Jantho', province: 'Aceh' },
  '0652': { city: 'Kota Sabang (Pulau Weh)', province: 'Aceh' },
  '0653': { city: 'Sigli (Pidie)', province: 'Aceh' },
  '0654': { city: 'Calang (Aceh Jaya)', province: 'Aceh' },
  '0655': { city: 'Meulaboh (Aceh Barat)', province: 'Aceh' },
  '0656': { city: 'Tapaktuan (Aceh Selatan)', province: 'Aceh' },
  '0657': { city: 'Bakongan (Aceh Selatan)', province: 'Aceh' },
  '0658': { city: 'Singkil (Aceh Singkil)', province: 'Aceh' },
  '0659': { city: 'Blangpidie (Aceh Barat Daya)', province: 'Aceh' },

  // Sumatera Selatan, Bangka Belitung, Lampung, Bengkulu, Jambi, Sumbar, Riau & Kepri (071x - 077x)
  '0702': { city: 'Tebing Tinggi (Empat Lawang)', province: 'Sumatera Selatan' },
  '0711': { city: 'Kota Palembang, Indralaya & Pangkalan Balai', province: 'Sumatera Selatan' },
  '0712': { city: 'Kayuagung (OKI)', province: 'Sumatera Selatan' },
  '0713': { city: 'Kota Prabumulih', province: 'Sumatera Selatan' },
  '0714': { city: 'Sekayu (Musi Banyuasin)', province: 'Sumatera Selatan' },
  '0715': { city: 'Belinyu (Bangka)', province: 'Kepulauan Bangka Belitung' },
  '0716': { city: 'Muntok (Bangka Barat)', province: 'Kepulauan Bangka Belitung' },
  '0717': { city: 'Kota Pangkalpinang & Sungailiat', province: 'Kepulauan Bangka Belitung' },
  '0718': { city: 'Koba & Toboali (Bangka Tengah/Selatan)', province: 'Kepulauan Bangka Belitung' },
  '0719': { city: 'Tanjungpandan & Manggar (Belitung)', province: 'Kepulauan Bangka Belitung' },
  '0721': { city: 'Kota Bandar Lampung', province: 'Lampung' },
  '0722': { city: 'Kota Agung (Tanggamus)', province: 'Lampung' },
  '0723': { city: 'Blambangan Umpu (Way Kanan)', province: 'Lampung' },
  '0724': { city: 'Kotabumi (Lampung Utara)', province: 'Lampung' },
  '0725': { city: 'Kota Metro & Sukadana', province: 'Lampung' },
  '0726': { city: 'Menggala (Tulang Bawang)', province: 'Lampung' },
  '0727': { city: 'Kalianda (Lampung Selatan)', province: 'Lampung' },
  '0728': { city: 'Liwa (Lampung Barat)', province: 'Lampung' },
  '0729': { city: 'Pringsewu', province: 'Lampung' },
  '0730': { city: 'Kota Pagar Alam', province: 'Sumatera Selatan' },
  '0731': { city: 'Lahat', province: 'Sumatera Selatan' },
  '0732': { city: 'Curup (Rejang Lebong)', province: 'Bengkulu' },
  '0733': { city: 'Kota Lubuklinggau', province: 'Sumatera Selatan' },
  '0734': { city: 'Muara Enim & Tanjung Enim', province: 'Sumatera Selatan' },
  '0735': { city: 'Baturaja & Martapura (OKU)', province: 'Sumatera Selatan' },
  '0736': { city: 'Kota Bengkulu', province: 'Bengkulu' },
  '0737': { city: 'Arga Makmur & Mukomuko', province: 'Bengkulu' },
  '0738': { city: 'Muara Aman (Lebong)', province: 'Bengkulu' },
  '0739': { city: 'Bintuhan & Manna (Bengkulu Selatan)', province: 'Bengkulu' },
  '0740': { city: 'Muara Sabak (Tanjung Jabung Timur)', province: 'Jambi' },
  '0741': { city: 'Kota Jambi', province: 'Jambi' },
  '0742': { city: 'Kuala Tungkal (Tanjung Jabung Barat)', province: 'Jambi' },
  '0743': { city: 'Muara Bulian (Batanghari)', province: 'Jambi' },
  '0744': { city: 'Muara Tebo', province: 'Jambi' },
  '0745': { city: 'Sarolangun', province: 'Jambi' },
  '0746': { city: 'Bangko (Merangin)', province: 'Jambi' },
  '0747': { city: 'Muara Bungo', province: 'Jambi' },
  '0748': { city: 'Kota Sungai Penuh & Kerinci', province: 'Jambi' },
  '0751': { city: 'Kota Padang & Kota Pariaman', province: 'Sumatera Barat' },
  '0752': { city: 'Kota Bukittinggi, Padang Panjang, Payakumbuh & Batusangkar', province: 'Sumatera Barat' },
  '0753': { city: 'Lubuk Sikaping (Pasaman)', province: 'Sumatera Barat' },
  '0754': { city: 'Kota Sawahlunto & Sijunjung', province: 'Sumatera Barat' },
  '0755': { city: 'Kota Solok & Alahan Panjang', province: 'Sumatera Barat' },
  '0756': { city: 'Painan (Pesisir Selatan)', province: 'Sumatera Barat' },
  '0757': { city: 'Balai Selasa (Pesisir Selatan)', province: 'Sumatera Barat' },
  '0759': { city: 'Tuapejat (Kepulauan Mentawai)', province: 'Sumatera Barat' },
  '0760': { city: 'Teluk Kuantan (Kuantan Singingi)', province: 'Riau' },
  '0761': { city: 'Kota Pekanbaru, Pangkalan Kerinci & Siak', province: 'Riau' },
  '0762': { city: 'Bangkinang & Pasir Pengaraian', province: 'Riau' },
  '0763': { city: 'Selatpanjang (Kepulauan Meranti)', province: 'Riau' },
  '0764': { city: 'Siak Sri Indrapura', province: 'Riau' },
  '0765': { city: 'Kota Dumai, Duri & Bagan Batu', province: 'Riau' },
  '0766': { city: 'Bengkalis', province: 'Riau' },
  '0767': { city: 'Bagansiapiapi (Rokan Hilir)', province: 'Riau' },
  '0768': { city: 'Tembilahan (Indragiri Hilir)', province: 'Riau' },
  '0769': { city: 'Rengat & Air Molek (Indragiri Hulu)', province: 'Riau' },
  '0770': { city: 'Batam Industrial (Mukakuning)', province: 'Kepulauan Riau' },
  '0771': { city: 'Kota Tanjungpinang & Bintan', province: 'Kepulauan Riau' },
  '0772': { city: 'Tarempa (Kepulauan Anambas)', province: 'Kepulauan Riau' },
  '0773': { city: 'Ranai (Kepulauan Natuna)', province: 'Kepulauan Riau' },
  '0776': { city: 'Dabo Singkep (Lingga)', province: 'Kepulauan Riau' },
  '0777': { city: 'Tanjung Balai Karimun', province: 'Kepulauan Riau' },
  '0778': { city: 'Kota Batam', province: 'Kepulauan Riau' },
  '0779': { city: 'Tanjungbatu (Kundur)', province: 'Kepulauan Riau' },

  // Maluku & Tanah Papua (090x - 098x)
  '0901': { city: 'Timika & Tembagapura (Mimika)', province: 'Papua Tengah' },
  '0902': { city: 'Agats (Asmat)', province: 'Papua Selatan' },
  '0910': { city: 'Bandanaira (Kepulauan Banda)', province: 'Maluku' },
  '0911': { city: 'Kota Ambon', province: 'Maluku' },
  '0913': { city: 'Namlea (Pulau Buru)', province: 'Maluku' },
  '0914': { city: 'Masohi (Seram)', province: 'Maluku' },
  '0915': { city: 'Bula (Seram Bagian Timur)', province: 'Maluku' },
  '0916': { city: 'Kota Tual & Langgur (Kepulauan Kei)', province: 'Maluku' },
  '0917': { city: 'Dobo (Kepulauan Aru)', province: 'Maluku' },
  '0918': { city: 'Saumlaki (Kepulauan Tanimbar)', province: 'Maluku' },
  '0921': { city: 'Kota Ternate & Tidore', province: 'Maluku Utara' },
  '0922': { city: 'Jailolo (Halmahera Barat)', province: 'Maluku Utara' },
  '0923': { city: 'Morotai', province: 'Maluku Utara' },
  '0924': { city: 'Tobelo (Halmahera Utara)', province: 'Maluku Utara' },
  '0927': { city: 'Labuha (Bacan / Halmahera Selatan)', province: 'Maluku Utara' },
  '0929': { city: 'Sanana (Kepulauan Sula)', province: 'Maluku Utara' },
  '0931': { city: 'Saparua', province: 'Maluku' },
  '0951': { city: 'Kota Sorong', province: 'Papua Barat Daya' },
  '0952': { city: 'Teminabuan (Sorong Selatan)', province: 'Papua Barat Daya' },
  '0955': { city: 'Bintuni (Teluk Bintuni)', province: 'Papua Barat' },
  '0956': { city: 'Fakfak', province: 'Papua Barat' },
  '0957': { city: 'Kaimana', province: 'Papua Barat' },
  '0966': { city: 'Sarmi', province: 'Papua' },
  '0967': { city: 'Kota Jayapura & Sentani', province: 'Papua' },
  '0969': { city: 'Wamena (Jayawijaya)', province: 'Papua Pegunungan' },
  '0971': { city: 'Merauke', province: 'Papua Selatan' },
  '0975': { city: 'Tanah Merah (Boven Digoel)', province: 'Papua Selatan' },
  '0980': { city: 'Ransiki (Manokwari Selatan)', province: 'Papua Barat' },
  '0981': { city: 'Biak', province: 'Papua' },
  '0983': { city: 'Serui (Kepulauan Yapen)', province: 'Papua' },
  '0984': { city: 'Nabire', province: 'Papua Tengah' },
  '0985': { city: 'Nabire Barat / Dogiyai', province: 'Papua Tengah' },
  '0986': { city: 'Manokwari', province: 'Papua Barat' },
};

export async function analyzePhoneInput(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const cleanedRaw = rawInput
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00A0]/g, '')
    .trim();
  const hasPlus = cleanedRaw.startsWith('+');
  const digitsOnly = cleanedRaw.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 16) {
    throw new Error(
      'Nomor telepon tidak valid (panjang harus 7–16 digit). Contoh: `/ceknomor 0881080593445` atau `/ceknomor 0215551234`.'
    );
  }

  let e164Digits = digitsOnly;
  let localIdNumber = '';
  let countryInfo = INTERNATIONAL_COUNTRY_CODES[0];

  if (!hasPlus && digitsOnly.startsWith('0')) {
    // Domestic Indonesian format (08xx or 021xx)
    e164Digits = `62${digitsOnly.slice(1)}`;
    localIdNumber = digitsOnly;
    countryInfo = INTERNATIONAL_COUNTRY_CODES[0];
  } else if (digitsOnly.startsWith('62')) {
    e164Digits = digitsOnly;
    localIdNumber = `0${digitsOnly.slice(2)}`;
    countryInfo = INTERNATIONAL_COUNTRY_CODES[0];
  } else {
    // Match longest international country calling code
    const sortedCodes = [...INTERNATIONAL_COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length
    );
    const matched = sortedCodes.find((c) => digitsOnly.startsWith(c.code));
    if (matched) {
      countryInfo = matched;
    } else {
      countryInfo = {
        code: digitsOnly.slice(0, 2),
        country: `Internasional (+${digitsOnly.slice(0, 2)})`,
        mapQuery: 'World',
      };
    }
  }

  const isIndonesian = countryInfo.code === '62' && Boolean(localIdNumber);
  let lineType = 'Nomor Telepon Internasional';
  let operatorLabel = 'Operator Luar Negeri / Internasional';
  let brandLabel = '-';
  let networkLabel = '-';
  let primaryCityLabel = countryInfo.country;
  let provinceLabel = '';
  let clusterCoverageLabel = '';
  let precisionBadgeLabel = '';
  let matchedHlrPrefix = '';
  let staticCoordinates: { lat: number; lon: number } | undefined;
  let mapSearchQuery = countryInfo.mapQuery;
  let hlrNote = '';
  let isNationalNonCityBlock = false;

  if (isIndonesian) {
    if (localIdNumber.startsWith('0800')) {
      lineType = 'Bebas Pulsa (Toll-Free 0800)';
      operatorLabel = 'Layanan Korporat / Call Center Bebas Pulsa';
      primaryCityLabel = 'Layanan Bebas Pulsa Nasional';
      provinceLabel = 'Seluruh Indonesia (Non-Geografis)';
      precisionBadgeLabel = 'Saluran Korporasi Nasional';
      mapSearchQuery = 'Indonesia';
      isNationalNonCityBlock = true;
    } else if (localIdNumber.startsWith('1500') || localIdNumber.startsWith('01500')) {
      lineType = 'Contact Center Nasional (1500xxx)';
      operatorLabel = 'Layanan Pelanggan Korporasi';
      primaryCityLabel = 'Contact Center Nasional';
      provinceLabel = 'Seluruh Indonesia (Non-Geografis)';
      precisionBadgeLabel = 'Saluran Korporasi Nasional';
      mapSearchQuery = 'Indonesia';
      isNationalNonCityBlock = true;
    } else if (localIdNumber.startsWith('08')) {
      lineType = 'Seluler / Mobile (GSM/LTE/5G)';
      const p4 = localIdNumber.slice(0, 4);
      const mobileInfo = INDONESIAN_MOBILE_PREFIXES[p4];
      if (mobileInfo) {
        operatorLabel = mobileInfo.operator;
        brandLabel = mobileInfo.brand;
        networkLabel = mobileInfo.network;
      } else {
        operatorLabel = `Operator Seluler Indonesia (Prefix ${p4})`;
      }
      const hlr = lookupIndonesianMobileHlr(localIdNumber);
      primaryCityLabel = hlr.city;
      provinceLabel = hlr.province;
      clusterCoverageLabel = hlr.clusterCoverage || '';
      precisionBadgeLabel = hlr.precisionLabel;
      matchedHlrPrefix = hlr.matchedPrefix;
      staticCoordinates = hlr.coordinates;
      mapSearchQuery = hlr.mapQuery;
      hlrNote = hlr.basisNote;
      isNationalNonCityBlock = hlr.accuracyTier === 'national';
    } else {
      // PSTN Fixed Line (021, 022, 0274, etc. — 242 Official Indonesian Area Codes)
      lineType = 'Telepon Rumah / Kantor Tetap (PSTN Fixed-Line)';
      operatorLabel = 'Telkom Indonesia / PSTN Fixed-Line';
      const p4 = localIdNumber.slice(0, 4);
      const p3 = localIdNumber.slice(0, 3);
      const areaMatch =
        INDONESIAN_PSTN_AREA_CODES[p4] || INDONESIAN_PSTN_AREA_CODES[p3];
      const matchedCode = INDONESIAN_PSTN_AREA_CODES[p4] ? p4 : p3;
      if (areaMatch) {
        brandLabel = `Kode Wilayah PSTN ${matchedCode}`;
        primaryCityLabel = areaMatch.city;
        provinceLabel = areaMatch.province;
        precisionBadgeLabel = `Presisi Sentral PSTN (${matchedCode})`;
        matchedHlrPrefix = matchedCode;
        const primaryPstnMapCity = areaMatch.city.split(/\s*(?:&|\/|,)\s*/)[0].trim();
        mapSearchQuery = `${primaryPstnMapCity}, ${areaMatch.province}, Indonesia`;
        hlrNote =
          areaMatch.coverageNote ||
          `Kode Area Geografis Tetap (\`${matchedCode}\`) — terikat langsung pada sentral kabel telepon tetap **${areaMatch.city}**, **${areaMatch.province}**.`;
      } else {
        primaryCityLabel = `Sentral Telepon (${p4})`;
        provinceLabel = 'Indonesia';
        mapSearchQuery = 'Indonesia';
        isNationalNonCityBlock = true;
      }
    }
  }

  // Parallel: Geocode PSTN/HLR if static coordinates not pre-pinned + Hunt Free Public Caller-ID Mentions
  const callerIdDorkQuery = isIndonesian
    ? `"${localIdNumber}" OR "${e164Digits}" OR "+${e164Digits}"`
    : `"+${e164Digits}" OR "${e164Digits}"`;

  const [geo, rawPublicMentions] = await Promise.all([
    isIndonesian && !isNationalNonCityBlock && !staticCoordinates
      ? geocodePlaceIndonesia(mapSearchQuery, signal)
      : Promise.resolve(null),
    searchPublicWebSnippets(callerIdDorkQuery, 6, signal),
  ]);

  const coreSubscriberDigits = isIndonesian ? localIdNumber.slice(1) : e164Digits;
  const publicMentions = rawPublicMentions
    .filter((item) => {
      const hayDigits = `${item.title} ${item.snippet} ${item.url}`.replace(/\D/g, '');
      return coreSubscriberDigits.length >= 6 && hayDigits.includes(coreSubscriberDigits);
    })
    .slice(0, 5);

  const resolvedCoords =
    staticCoordinates ||
    (geo ? { lat: Number(geo.lat), lon: Number(geo.lon) } : undefined);

  const formattedInternational = isIndonesian
    ? `+62 ${localIdNumber.slice(1, 4)}-${localIdNumber.slice(4, 8)}-${localIdNumber.slice(8)}`
    : `+${e164Digits}`;

  const locationSummaryForTable = clusterCoverageLabel
    ? `${primaryCityLabel} — ${clusterCoverageLabel}`
    : provinceLabel && !primaryCityLabel.includes(provinceLabel)
    ? `${primaryCityLabel}, ${provinceLabel}`
    : primaryCityLabel;

  const mapButtonCityLabel = primaryCityLabel
    .replace(/\s*\((?:Cluster|Sentral)[^)]*\)/gi, '')
    .trim();

  const effectiveLengthCheck = isIndonesian ? localIdNumber.length : digitsOnly.length;
  const isLengthValid = isIndonesian
    ? effectiveLengthCheck >= 9 && effectiveLengthCheck <= 13
    : digitsOnly.length >= 8 && digitsOnly.length <= 15;

  const actionLinks: ToolActionLink[] = [
    {
      label: isNationalNonCityBlock
        ? '📍 Buka Peta Indonesia di Google Maps'
        : `📍 Buka ${mapButtonCityLabel.slice(0, 34)} di Google Maps`,
      url: buildGoogleMapsSearchUrl(
        resolvedCoords
          ? `${resolvedCoords.lat},${resolvedCoords.lon}`
          : mapSearchQuery
      ),
      kind: 'maps',
    },
    {
      label: '💬 Cek Profil & Nama Bisnis WA (wa.me)',
      url: `https://wa.me/${e164Digits}`,
      kind: 'whatsapp',
    },
    {
      label: '🔍 Cek Nama Caller-ID (Truecaller Web)',
      url: `https://www.truecaller.com/search/${
        isIndonesian ? 'id' : 'global'
      }/${encodeURIComponent(isIndonesian ? localIdNumber : `+${e164Digits}`)}`,
      kind: 'external',
    },
    {
      label: '📞 Cek Laporan Spam Telepon (Tellows)',
      url: `https://id.tellows.com/num/${encodeURIComponent(
        isIndonesian ? localIdNumber : `+${e164Digits}`
      )}`,
      kind: 'verify',
    },
    {
      label: '🛡️ CekRekening / E-Wallet Penipu (Komdigi)',
      url: 'https://cekrekening.id/',
      kind: 'verify',
    },
  ];

  const mentionLines =
    publicMentions.length > 0
      ? publicMentions.map(
          (item, i) =>
            `${i + 1}. **[${item.title}](${item.url})**\n   _${item.snippet || 'Tercantum di halaman publik.'}_`
        )
      : [
          `- Tidak ditemukan eksposur publik terbuka di mesin pencari untuk nomor \`${
            localIdNumber || `+${e164Digits}`
          }\` (pertanda pemilik menjaga privasi nomor di web publik). Gunakan tombol **Cek Profil WA** atau **Truecaller Web** di bawah untuk pengecekan nama kontak langsung.`,
        ];

  const lines = [
    `### 📱 Hasil Deep OSINT Nomor Telepon, Kota HLR Multi-Digit & Free Caller-ID`,
    '',
    `| Parameter | Detail Teridentifikasi |`,
    `| :--- | :--- |`,
    `| **Format Internasional (E.164)** | \`+${e164Digits}\` (${formattedInternational}) |`,
    isIndonesian ? `| **Format Lokal Nasional** | \`${localIdNumber}\` |` : '',
    `| **Negara Asal** | **${countryInfo.country}** (\`+${countryInfo.code}\`) |`,
    `| **Jenis Saluran (Line Type)** | ${lineType} |`,
    `| **Operator Telekomunikasi** | **${operatorLabel}** |`,
    brandLabel !== '-' ? `| **Produk / Kartu / Kode Area** | ${brandLabel} |` : '',
    isIndonesian
      ? `| **Lokasi Kota / Wilayah HLR** | **${locationSummaryForTable}** |`
      : '',
    resolvedCoords
      ? `| **Koordinat Pusat Kota (GPS)** | \`${resolvedCoords.lat}, ${resolvedCoords.lon}\` |`
      : '',
    networkLabel !== '-' ? `| **Teknologi Jaringan** | ${networkLabel} |` : '',
    `| **Validitas Panjang Digit** | ${effectiveLengthCheck} digit${
      isIndonesian ? ' lokal' : ''
    } (${
      isLengthValid
        ? '✅ Standar valid seluler/PSTN'
        : '⚠️ Panjang tidak lazim — periksa kembali digit'
    }) |`,
    '',
    `#### 📍 Analisis Kota & Wilayah HLR (5–10 Digit Operator) / Sentral Area`,
    `- **Kota / Sentral Registrasi Awal (HLR)**: **${primaryCityLabel}**`,
    clusterCoverageLabel
      ? `- **Cakupan Wilayah Cluster HLR**: **${clusterCoverageLabel}**`
      : '',
    provinceLabel ? `- **Provinsi**: **${provinceLabel}**` : '',
    precisionBadgeLabel
      ? `- **Tingkat Presisi**: \`${precisionBadgeLabel}\`${
          matchedHlrPrefix ? ` (Prefix cocok: \`${matchedHlrPrefix}\`)` : ''
        }`
      : '',
    hlrNote ? `- **Basis Tabel HLR**: ${hlrNote}` : '',
    resolvedCoords
      ? `- **Koordinat Pusat Kota / Sentral**: \`${resolvedCoords.lat}, ${resolvedCoords.lon}\``
      : '',
    '',
    `#### 🕵️ Free Caller-ID & Jejak Nama Publik di Internet (Marketplace / Medsos / Dokumen)`,
    ...mentionLines,
    '',
    `> ℹ️ **Penting (HLR vs Lokasi Device Real-Time)**: Kode HLR memetakan **kota atau sentral wilayah tempat kartu perdana diterbitkan pertama kali**, bukan GPS perangkat saat ini (bila kartu dibeli online lintas kota atau pemilik merantau, kode HLR tetap mengikuti kota asal penerbitan kartu). Posisi *device* real-time via menara BTS/SS7 dikunci oleh operator seluler sesuai **UU PDP No. 27/2022**.`,
  ].filter(Boolean);

  return {
    content: lines
      .join('\n')
      .replace(/\n(#### )/g, '\n\n$1')
      .replace(/\n(> ℹ️)/g, '\n\n$1'),
    actionLinks,
  };
}
