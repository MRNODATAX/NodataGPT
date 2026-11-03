import jsQR from 'jsqr';
import type { ToolActionLink } from '../types/chat';

export interface OsintExecutionOutput {
  content: string;
  imageUrl?: string;
  actionLinks?: ToolActionLink[];
}

function getShieldedFetch(): typeof fetch {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return fetch;
}

async function fetchJsonSafe(
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

async function geocodePlaceIndonesia(
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

async function queryDnsOverHttps(
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
};

// Indonesian PSTN Area Codes (4-digit checked before 3-digit)
const INDONESIAN_PSTN_AREA_CODES: Record<string, string> = {
  '021': 'DKI Jakarta, Tangerang, Bekasi & Depok (Jabodetabek)',
  '022': 'Kota Bandung, Cimahi & Bandung Raya, Jawa Barat',
  '024': 'Kota Semarang & Demak, Jawa Tengah',
  '031': 'Kota Surabaya, Gresik & Sidoarjo, Jawa Timur',
  '061': 'Kota Medan, Binjai & Deli Serdang, Sumatera Utara',
  '0231': 'Cirebon, Jawa Barat',
  '0232': 'Kuningan, Jawa Barat',
  '0233': 'Majalengka, Jawa Barat',
  '0234': 'Indramayu, Jawa Barat',
  '0251': 'Kota & Kab. Bogor, Jawa Barat',
  '0252': 'Lebak (Rangkasbitung), Banten',
  '0253': 'Pandeglang, Banten',
  '0254': 'Kota Serang & Cilegon, Banten',
  '0260': 'Subang, Jawa Barat',
  '0261': 'Sumedang, Jawa Barat',
  '0262': 'Garut, Jawa Barat',
  '0263': 'Cianjur, Jawa Barat',
  '0264': 'Purwakarta & Cikampek, Jawa Barat',
  '0265': 'Tasikmalaya, Ciamis & Banjar, Jawa Barat',
  '0266': 'Sukabumi, Jawa Barat',
  '0267': 'Karawang, Jawa Barat',
  '0271': 'Surakarta (Solo), Sukoharjo, Karanganyar & Sragen, Jawa Tengah',
  '0272': 'Klaten, Jawa Tengah',
  '0273': 'Wonogiri, Jawa Tengah',
  '0274': 'DI Yogyakarta (Kota Jogja, Sleman, Bantul, Gunungkidul, Kulon Progo)',
  '0275': 'Purworejo, Jawa Tengah',
  '0276': 'Boyolali, Jawa Tengah',
  '0281': 'Purwokerto, Banyumas & Purbalingga, Jawa Tengah',
  '0282': 'Cilacap, Jawa Tengah',
  '0283': 'Tegal & Brebes, Jawa Tengah',
  '0284': 'Pemalang, Jawa Tengah',
  '0285': 'Pekalongan & Batang, Jawa Tengah',
  '0286': 'Banjarnegara & Wonosobo, Jawa Tengah',
  '0287': 'Kebumen, Jawa Tengah',
  '0291': 'Kudus, Jepara & Demak, Jawa Tengah',
  '0293': 'Magelang & Temanggung, Jawa Tengah',
  '0298': 'Salatiga & Ambarawa, Jawa Tengah',
  '0321': 'Mojokerto & Jombang, Jawa Timur',
  '0322': 'Lamongan, Jawa Timur',
  '0331': 'Jember, Jawa Timur',
  '0333': 'Banyuwangi, Jawa Timur',
  '0335': 'Probolinggo, Jawa Timur',
  '0341': 'Kota Malang, Batu & Kab. Malang, Jawa Timur',
  '0342': 'Blitar, Jawa Timur',
  '0343': 'Pasuruan, Jawa Timur',
  '0351': 'Madiun, Magetan & Ngawi, Jawa Timur',
  '0352': 'Ponorogo, Jawa Timur',
  '0354': 'Kediri, Jawa Timur',
  '0355': 'Tulungagung & Trenggalek, Jawa Timur',
  '0356': 'Tuban, Jawa Timur',
  '0361': 'Denpasar, Badung, Gianyar & Tabanan, Bali',
  '0362': 'Singaraja (Buleleng), Bali',
  '0370': 'Mataram & Lombok, Nusa Tenggara Barat',
  '0380': 'Kupang, Nusa Tenggara Timur',
  '0401': 'Kendari, Sulawesi Tenggara',
  '0411': 'Kota Makassar, Maros & Gowa, Sulawesi Selatan',
  '0421': 'Parepare & Pinrang, Sulawesi Selatan',
  '0431': 'Manado, Tomohon & Minahasa, Sulawesi Utara',
  '0435': 'Gorontalo',
  '0451': 'Palu, Sulawesi Tengah',
  '0511': 'Banjarmasin & Banjarbaru, Kalimantan Selatan',
  '0536': 'Palangka Raya, Kalimantan Tengah',
  '0541': 'Samarinda & Tenggarong, Kalimantan Timur',
  '0542': 'Balikpapan & IKN Nusantara, Kalimantan Timur',
  '0548': 'Bontang, Kalimantan Timur',
  '0551': 'Tarakan, Kalimantan Utara',
  '0561': 'Pontianak & Kubu Raya, Kalimantan Barat',
  '0562': 'Singkawang & Sambas, Kalimantan Barat',
  '0641': 'Langsa, Aceh',
  '0645': 'Lhokseumawe, Aceh',
  '0651': 'Banda Aceh & Aceh Besar, Aceh',
  '0711': 'Palembang & Banyuasin, Sumatera Selatan',
  '0717': 'Pangkalpinang, Kepulauan Bangka Belitung',
  '0721': 'Bandar Lampung, Lampung',
  '0736': 'Kota Bengkulu',
  '0741': 'Kota Jambi',
  '0751': 'Kota Padang, Sumatera Barat',
  '0752': 'Bukittinggi & Payakumbuh, Sumatera Barat',
  '0761': 'Pekanbaru, Riau',
  '0765': 'Dumai, Riau',
  '0771': 'Tanjungpinang & Bintan, Kepulauan Riau',
  '0778': 'Kota Batam, Kepulauan Riau',
  '0911': 'Kota Ambon, Maluku',
  '0921': 'Ternate, Maluku Utara',
  '0951': 'Sorong, Papua Barat Daya',
  '0967': 'Kota Jayapura, Papua',
  '0971': 'Merauke, Papua Selatan',
  '0986': 'Manokwari, Papua Barat',
};

function estimateIndonesianMobileHlrRegion(local08: string): {
  region: string;
  mapCity: string;
  confidence: string;
} {
  const p4 = local08.slice(0, 4);
  const fifth = local08[4] || '';

  // Telkomsel / Indosat / XL classic regional HLR digit band allocation (5th/6th digit)
  if (p4 === '0851') {
    return {
      region: 'Alokasi Nasional Digital (by.U / Telkomsel Nasional)',
      mapCity: 'Jakarta, Indonesia',
      confidence: 'Nasional (Registrasi Online / Digital)',
    };
  }

  switch (fifth) {
    case '1':
    case '0':
      return {
        region: 'Jabodetabek (DKI Jakarta, Bogor, Depok, Tangerang, Bekasi) & Banten',
        mapCity: 'Jakarta, Indonesia',
        confidence: 'Estimasi Blok HLR Regional Barat-Pusat',
      };
    case '2':
      return {
        region: 'Jawa Barat (Bandung, Priangan, Cirebon & Sekitarnya)',
        mapCity: 'Bandung, Jawa Barat',
        confidence: 'Estimasi Blok HLR Regional Jawa Barat',
      };
    case '3':
    case '4':
      return {
        region: 'Jawa Tengah & DI Yogyakarta (Semarang, Solo, Jogja & Sekitarnya)',
        mapCity: 'Semarang, Jawa Tengah',
        confidence: 'Estimasi Blok HLR Regional Jateng-DIY',
      };
    case '5':
      return {
        region: 'Jawa Timur (Surabaya, Malang, Kediri & Sekitarnya)',
        mapCity: 'Surabaya, Jawa Timur',
        confidence: 'Estimasi Blok HLR Regional Jawa Timur',
      };
    case '6':
      return {
        region: 'Sumatera Bagian Utara & Tengah (Medan, Pekanbaru, Batam, Padang)',
        mapCity: 'Medan, Sumatera Utara',
        confidence: 'Estimasi Blok HLR Regional Sumatera Utara-Tengah',
      };
    case '7':
      return {
        region: 'Sumatera Bagian Selatan (Palembang, Lampung, Jambi, Bengkulu)',
        mapCity: 'Palembang, Sumatera Selatan',
        confidence: 'Estimasi Blok HLR Regional Sumbagsel',
      };
    case '8':
      return {
        region: 'Bali, Nusa Tenggara & Kalimantan',
        mapCity: 'Denpasar, Bali',
        confidence: 'Estimasi Blok HLR Regional Bali-Nusra / Kalimantan',
      };
    case '9':
      return {
        region: 'Sulawesi, Maluku & Tanah Papua (Indonesia Timur)',
        mapCity: 'Makassar, Sulawesi Selatan',
        confidence: 'Estimasi Blok HLR Regional Kawasan Timur Indonesia',
      };
    default:
      return {
        region: 'Indonesia (Alokasi Seluler Nasional)',
        mapCity: 'Indonesia',
        confidence: 'Alokasi Nasional',
      };
  }
}

export async function analyzePhoneInput(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const cleanedRaw = rawInput.trim();
  const hasPlus = cleanedRaw.startsWith('+');
  const digitsOnly = cleanedRaw.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 16) {
    throw new Error(
      'Nomor telepon tidak valid (panjang harus 7–16 digit). Contoh: `/ceknomor 081234567890` atau `/ceknomor 0215551234`.'
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
  let regionLabel = countryInfo.country;
  let mapSearchQuery = countryInfo.mapQuery;
  let hlrNote = '';

  if (isIndonesian) {
    if (localIdNumber.startsWith('0800')) {
      lineType = 'Bebas Pulsa (Toll-Free 0800)';
      operatorLabel = 'Layanan Korporat / Call Center Bebas Pulsa';
      regionLabel = 'Nasional (Indonesia)';
      mapSearchQuery = 'Jakarta, Indonesia';
    } else if (localIdNumber.startsWith('1500') || localIdNumber.startsWith('01500')) {
      lineType = 'Contact Center Nasional (1500xxx)';
      operatorLabel = 'Layanan Pelanggan Korporasi';
      regionLabel = 'Nasional (Indonesia)';
      mapSearchQuery = 'Jakarta, Indonesia';
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
      const hlr = estimateIndonesianMobileHlrRegion(localIdNumber);
      regionLabel = hlr.region;
      mapSearchQuery = hlr.mapCity;
      hlrNote = hlr.confidence;
    } else {
      // PSTN Fixed Line (021, 022, 0274, etc.)
      lineType = 'Telepon Rumah / Kantor Tetap (PSTN Fixed-Line)';
      operatorLabel = 'Telkom Indonesia / PSTN Fixed-Line';
      const p4 = localIdNumber.slice(0, 4);
      const p3 = localIdNumber.slice(0, 3);
      const areaMatch =
        INDONESIAN_PSTN_AREA_CODES[p4] || INDONESIAN_PSTN_AREA_CODES[p3];
      const matchedCode = INDONESIAN_PSTN_AREA_CODES[p4] ? p4 : p3;
      if (areaMatch) {
        brandLabel = `Kode Wilayah PSTN ${matchedCode}`;
        regionLabel = areaMatch;
        mapSearchQuery = `${areaMatch}, Indonesia`;
        hlrNote = `Kode Area Geografis Tetap (${matchedCode})`;
      } else {
        regionLabel = `Wilayah Telepon Indonesia (${p4})`;
        mapSearchQuery = 'Indonesia';
      }
    }
  }

  const geo = isIndonesian
    ? await geocodePlaceIndonesia(mapSearchQuery, signal)
    : null;

  const formattedInternational = isIndonesian
    ? `+62 ${localIdNumber.slice(1, 4)}-${localIdNumber.slice(4, 8)}-${localIdNumber.slice(8)}`
    : `+${e164Digits}`;

  const actionLinks: ToolActionLink[] = [
    {
      label: `📍 Buka Wilayah (${
        mapSearchQuery.replace(', Indonesia', '').slice(0, 26)
      }) di Google Maps`,
      url: buildGoogleMapsSearchUrl(
        geo ? `${geo.lat},${geo.lon}` : mapSearchQuery
      ),
      kind: 'maps',
    },
    {
      label: '💬 Cek Akun WhatsApp (wa.me)',
      url: `https://wa.me/${e164Digits}`,
      kind: 'whatsapp',
    },
    {
      label: '🛡️ Cek Riwayat Penipuan E-Wallet/Rekening (Komdigi)',
      url: 'https://cekrekening.id/',
      kind: 'verify',
    },
  ];

  const lines = [
    `### 📱 Hasil OSINT Nomor Telepon, Operator & Area HLR`,
    '',
    `| Parameter | Detail Teridentifikasi |`,
    `| :--- | :--- |`,
    `| **Format Internasional (E.164)** | \`+${e164Digits}\` (${formattedInternational}) |`,
    isIndonesian ? `| **Format Lokal Nasional** | \`${localIdNumber}\` |` : '',
    `| **Negara Asal** | **${countryInfo.country}** (\`+${countryInfo.code}\`) |`,
    `| **Jenis Saluran (Line Type)** | ${lineType} |`,
    `| **Operator Telekomunikasi** | **${operatorLabel}** |`,
    brandLabel !== '-' ? `| **Produk / Kartu / Kode Area** | ${brandLabel} |` : '',
    networkLabel !== '-' ? `| **Teknologi Jaringan** | ${networkLabel} |` : '',
    `| ** Panjang Digit** | ${digitsOnly.length} digit (${
      digitsOnly.length >= 10 && digitsOnly.length <= 14
        ? '✅ Panjang wajar standar seluler/PSTN'
        : '⚠️ Panjang tidak lazim — periksa ulang digit'
    }) |`,
    '',
    `#### 📍 Analisis Wilayah Registrasi / Kode Area`,
    `- **Wilayah Teridentifikasi**: **${regionLabel}**`,
    hlrNote ? `- **Basis Identifikasi**: ${hlrNote}` : '',
    geo ? `- **Koordinat Pusat Wilayah (OSM)**: \`${geo.lat}, ${geo.lon}\`` : '',
    '',
    `#### 🛡️ Panduan Verifikasi & Anti-Penipuan`,
    `- **Cek Profil WhatsApp**: Klik tombol **Cek Akun WhatsApp** di bawah untuk melihat apakah nomor aktif di WA beserta foto profil/nama bisnis publiknya.`,
    `- **Verifikasi E-Wallet (DANA / OVO / GoPay / ShopeePay)**: Sebelum transfer, pastikan nama inisial akun e-wallet tujuan cocok dan periksa di portal resmi **CekRekening Komdigi**.`,
    '',
    `> ℹ️ **Catatan Akurasi & Privasi (UU PDP No. 27/2022)**: Untuk nomor seluler \`08xx\`, blok HLR menunjukkan **wilayah distribusi/registrasi kartu perdana awal**, bukan pelacakan menara BTS/GPS real-time pemilik saat ini (karena kartu SIM dapat dibawa bepergian ke seluruh Indonesia).`,
  ].filter(Boolean);

  return {
    content: lines
      .join('\n')
      .replace(/\n(#### )/g, '\n\n$1')
      .replace(/\n(> ℹ️)/g, '\n\n$1'),
    actionLinks,
  };
}
