import type { CctvCameraItem, ToolActionLink } from '../types/chat';
import {
  buildGoogleMapsSearchUrl,
  fetchJsonSafe,
} from './osintInspector';

export const INDONESIA_REGION_GROUPS = [
  'Semua Indonesia',
  'Jabodetabek',
  'Jawa Barat',
  'Jateng & DIY',
  'Jawa Timur',
  'Bali & Nusra',
  'Sumatera',
  'Kalimantan, Sulawesi & Papua',
  'Jalan Tol, Nasional & Gunung',
] as const;

export const WORLD_REGION_GROUPS = [
  'Semua Dunia',
  'Timur Tengah (Makkah & Madinah)',
  'Asia Tenggara & Timur',
  'Amerika Utara',
  'Eropa & Antariksa',
] as const;

/**
 * Curated Verified Public Live CCTV Catalog (Indonesia + World) — 2026 Port-443 Verified Edition.
 * Zero retired BaliTower slugs, zero broken channel-only embeds, zero Vercel video proxying.
 */
export const CURATED_CCTV_CAMERAS: CctvCameraItem[] = [
  // =========================================================================
  // INDONESIA — JABODETABEK & BANTEN (PORT 443 INSTANT CONNECT)
  // =========================================================================
  {
    id: 'id-jabodetabek-depok-bogor',
    name: 'Jalur Utama Jakarta Selatan – Depok – Cibinong – Bogor',
    city: 'Depok / Jakarta Selatan',
    provinceOrCountry: 'Jabodetabek',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.3916,
    lon: 106.8296,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/sDmJQzwmDUY?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN DKI Jakarta–Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Jabodetabek',
  },
  {
    id: 'id-jabodetabek-cikampek',
    name: 'Simpang Jomin – Cikampek (Akses Tol & Pantura Timur)',
    city: 'Bekasi / Karawang',
    provinceOrCountry: 'Jabodetabek & Jabar',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.4055,
    lon: 107.4581,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/a1yiVSNhc-A?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN DKI Jakarta–Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Cikampek',
  },
  {
    id: 'id-banten-cilegon-merak',
    name: 'Jalur Nasional Serang – Cilegon – Pelabuhan Merak',
    city: 'Cilegon / Serang',
    provinceOrCountry: 'Banten',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.0025,
    lon: 106.0111,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/bpA2tj-LrGk?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Banten (KemenPU)',
    badge: 'Live 24/7 · Banten',
  },
  {
    id: 'id-dki-smartcity-portal',
    name: 'Peta Resmi 7.000+ CCTV DKI Jakarta (Monas, Sudirman, HI)',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1754,
    lon: 106.8272,
    streamType: 'portal',
    streamUrl: 'https://smartcity.jakarta.go.id/id/map/',
    portalUrl: 'https://smartcity.jakarta.go.id/id/map/',
    operator: 'Jakarta Smart City Pemprov DKI',
    badge: 'Portal Resmi · DKI',
  },

  // =========================================================================
  // INDONESIA — JAWA BARAT
  // =========================================================================
  {
    id: 'id-jabar-bandung-cileunyi',
    name: 'Simpang Raya Cileunyi – Gerbang Kota Bandung Timur',
    city: 'Bandung',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.9389,
    lon: 107.7524,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/i9aQbdm6LEE?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://atcs-dishub.bandung.go.id/',
    operator: 'BPJN Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Bandung',
  },
  {
    id: 'id-jabar-nagreg-garut',
    name: 'Jalur Nasional Lingkar Nagreg (Bandung – Garut – Tasik)',
    city: 'Bandung / Garut',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -7.0185,
    lon: 107.8878,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/lutKssQIWoM?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Nagreg',
  },
  {
    id: 'id-jabar-padalarang-cimahi',
    name: 'Simpang Padalarang – Cimahi (Bandung Barat)',
    city: 'Padalarang / Cimahi',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.8436,
    lon: 107.4784,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/9xRYkDzH1w0?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Padalarang',
  },
  {
    id: 'id-jabar-karawang-sadang',
    name: 'Jalur Arteri Karawang – Sadang Purwakarta',
    city: 'Karawang / Purwakarta',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.5061,
    lon: 107.4664,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/HKtDPw-tpCA?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN DKI–Jabar (KemenPU)',
    badge: 'Live 24/7 · Karawang',
  },
  {
    id: 'id-jabar-indramayu-cirebon',
    name: 'Jalur Pantura Losarang – Indramayu – Cirebon',
    city: 'Indramayu / Cirebon',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.4046,
    lon: 108.1636,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/6K6lDSavrO0?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN DKI–Jabar (KemenPU)',
    badge: 'Live 24/7 · Pantura',
  },
  {
    id: 'id-tasik-masjid-agung',
    name: 'ATCS Simpang Masjid Agung & HZ Mustofa',
    city: 'Tasikmalaya',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -7.3274,
    lon: 108.2207,
    streamType: 'hls',
    streamUrl: 'https://atcs.tasikmalayakota.go.id/camera/MasjidAgung.m3u8',
    portalUrl: 'https://atcs.tasikmalayakota.go.id/',
    operator: 'ATCS Dishub Kota Tasikmalaya',
    badge: 'HLS · Tasikmalaya',
  },

  // =========================================================================
  // INDONESIA — JAWA TENGAH & DI YOGYAKARTA
  // =========================================================================
  {
    id: 'id-diy-sleman-magelang',
    name: 'Jalur Utama Yogyakarta – Sleman – Tempel Magelang',
    city: 'Yogyakarta / Sleman',
    provinceOrCountry: 'DI Yogyakarta',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.6531,
    lon: 110.3268,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/YyCjzb0kWfY?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://cctv.jogjakota.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Yogyakarta',
  },
  {
    id: 'id-jogja-malioboro',
    name: 'Kawasan Malioboro & Kepatihan Kota Yogyakarta',
    city: 'Yogyakarta',
    provinceOrCountry: 'DI Yogyakarta',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.7926,
    lon: 110.3658,
    streamType: 'hls',
    streamUrl:
      'https://cctvjss.jogjakota.go.id/malioboro/Malioboro_10_Kepatihan.stream/playlist.m3u8',
    fallbackEmbedUrl:
      'https://www.youtube-nocookie.com/embed/YyCjzb0kWfY?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://cctv.jogjakota.go.id/',
    operator: 'Pemkot Yogyakarta (JSS)',
    badge: 'HLS · Malioboro',
  },
  {
    id: 'id-jateng-semarang-kaligawe',
    name: 'Simpang Kaligawe – Pantura Kota Semarang',
    city: 'Semarang',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -6.9563,
    lon: 110.4468,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/FVV6G8fQyOY?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://pantausemar.semarangkota.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Semarang',
  },
  {
    id: 'id-jateng-ungaran-bawen',
    name: 'Jalur Nasional Semarang – Ungaran – Bawen – Salatiga',
    city: 'Ungaran / Salatiga',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.2439,
    lon: 110.4321,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/I6dMOkfYCIs?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Ungaran',
  },
  {
    id: 'id-jateng-pantura-tegal',
    name: 'Jalur Pantura Kota Tegal – Brebes',
    city: 'Tegal',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -6.8694,
    lon: 109.1402,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/ZeJdlXW3-gI?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Tegal',
  },
  {
    id: 'id-jateng-pekalongan',
    name: 'Jalur Pantura Kota Batik Pekalongan',
    city: 'Pekalongan',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -6.8886,
    lon: 109.6753,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/8HUccaQ3488?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Pekalongan',
  },
  {
    id: 'id-jateng-purworejo',
    name: 'Jalur Selatan Purworejo – Kebumen – Kulon Progo',
    city: 'Purworejo',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.7138,
    lon: 110.0081,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/d51Iegz-CNE?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Purworejo',
  },
  {
    id: 'id-jateng-banjarnegara',
    name: 'Jalur Tengah Banjarnegara – Wonosobo – Banyumas',
    city: 'Banjarnegara',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.3989,
    lon: 109.6951,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/A0yh3pL6VMk?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jateng–DIY (KemenPU)',
    badge: 'Live 24/7 · Banjarnegara',
  },

  // =========================================================================
  // INDONESIA — JAWA TIMUR
  // =========================================================================
  {
    id: 'id-jatim-malang-kepanjen',
    name: 'Jalur Utama Kota Malang – Pakisaji – Kepanjen',
    city: 'Malang',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -8.0539,
    lon: 112.5964,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/iGSmNPsgYdA?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jawa Timur–Bali (KemenPU)',
    badge: 'Live 24/7 · Malang',
  },
  {
    id: 'id-jatim-lamongan-surabaya',
    name: 'Jalur Pantura Lamongan – Gresik – Gerbang Surabaya',
    city: 'Surabaya / Lamongan',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.1186,
    lon: 112.4167,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/ie2mgahxFTk?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://sits.surabaya.go.id/',
    operator: 'BPJN Jawa Timur–Bali (KemenPU)',
    badge: 'Live 24/7 · Surabaya-Gresik',
  },
  {
    id: 'id-jatim-kediri-jombang',
    name: 'Simpang Mengkreng (Kediri – Jombang – Nganjuk)',
    city: 'Kediri / Jombang',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.5992,
    lon: 112.1047,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/aLtqLSLh5wo?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jawa Timur–Bali (KemenPU)',
    badge: 'Live 24/7 · Kediri-Jombang',
  },
  {
    id: 'id-jatim-banyuwangi-ketapang',
    name: 'Akses Pelabuhan Ketapang Banyuwangi (Penyeberangan Bali)',
    city: 'Banyuwangi',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -8.1444,
    lon: 114.3982,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/eY-32lH9B98?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Jawa Timur–Bali (KemenPU)',
    badge: 'Live 24/7 · Banyuwangi',
  },

  // =========================================================================
  // INDONESIA — BALI, SUMATERA, KALIMANTAN, SULAWESI & GUNUNG API
  // =========================================================================
  {
    id: 'id-bali-dewa-ruci',
    name: 'Simpang Dewa Ruci Kuta – Sunset Road',
    city: 'Badung / Denpasar',
    provinceOrCountry: 'Bali',
    scope: 'indonesia',
    regionGroup: 'Bali & Nusra',
    lat: -8.7224,
    lon: 115.1823,
    streamType: 'hls',
    streamUrl: 'https://transcode.baliprov.go.id/cctv/dewaruci1/index.m3u8',
    portalUrl: 'https://balisatudata.baliprov.go.id/peta-cctv',
    operator: 'Bali Satu Data Pemprov Bali',
    badge: 'HLS · Bali',
  },
  {
    id: 'id-sumatera-lampung',
    name: 'Jalan Lintas Sumatera – Kota Bandar Lampung',
    city: 'Bandar Lampung',
    provinceOrCountry: 'Lampung (Sumatera)',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: -5.3821,
    lon: 105.2584,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/_5FbJzADUy4?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'BPJN Lampung (KemenPU)',
    badge: 'Live 24/7 · Sumatera',
  },
  {
    id: 'id-sumatera-medan-portal',
    name: 'Portal ATCS Dishub Kota Medan & Sumatera Utara',
    city: 'Medan',
    provinceOrCountry: 'Sumatera Utara',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: 3.5952,
    lon: 98.6722,
    streamType: 'portal',
    streamUrl: 'https://atcsdishub.pemkomedan.go.id/',
    portalUrl: 'https://atcsdishub.pemkomedan.go.id/',
    operator: 'ATCS Dishub Pemko Medan',
    badge: 'Portal · Medan',
  },
  {
    id: 'id-kalsulpap-makassar-portal',
    name: 'Portal CCTV Diskominfo Kota Makassar & Indonesia Timur',
    city: 'Makassar',
    provinceOrCountry: 'Sulawesi Selatan',
    scope: 'indonesia',
    regionGroup: 'Kalimantan, Sulawesi & Papua',
    lat: -5.1477,
    lon: 119.4327,
    streamType: 'portal',
    streamUrl: 'https://cctv.makassarkota.go.id/',
    portalUrl: 'https://cctv.makassarkota.go.id/',
    operator: 'Diskominfo Kota Makassar',
    badge: 'Portal · Makassar',
  },
  {
    id: 'id-tol-binamarga-ct01',
    name: 'ITS Bina Marga Jalur Nasional CT-01',
    city: 'Jalur Nasional',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -6.255,
    lon: 106.955,
    streamType: 'hls',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-01/index.m3u8',
    fallbackEmbedUrl:
      'https://www.youtube-nocookie.com/embed/a1yiVSNhc-A?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'ITS Bina Marga KemenPU',
    badge: 'HLS · Bina Marga',
  },
  {
    id: 'id-volcano-pvmbg',
    name: 'Pantauan CCTV Gunung Merapi, Semeru, Bromo & Lewotobi (MAGMA)',
    city: 'Sleman / Lumajang',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -7.5407,
    lon: 110.4457,
    streamType: 'portal',
    streamUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    portalUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    operator: 'PVMBG Badan Geologi ESDM',
    badge: 'Portal · Gunung Api',
  },

  // =========================================================================
  // GLOBAL / DUNIA — VERIFIED PORT-443 INSTANT LIVE STREAMS
  // =========================================================================
  {
    id: 'world-makkah-haram',
    name: 'Masjidil Haram — Ka’bah Live 24/7 (Saudi Quran TV)',
    city: 'Makkah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 21.4225,
    lon: 39.8262,
    streamType: 'hls',
    streamUrl:
      'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
    portalUrl: 'https://www.aloula.sa/en/live/quran',
    operator: 'Saudi Broadcasting Authority (Akamai Official)',
    badge: 'HLS 24/7 · Makkah',
  },
  {
    id: 'world-madinah-nabawi',
    name: 'Masjid Nabawi Live 24/7 (Saudi Sunnah TV)',
    city: 'Madinah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 24.4672,
    lon: 39.6111,
    streamType: 'hls',
    streamUrl:
      'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8',
    portalUrl: 'https://www.aloula.sa/en/live/sunnah',
    operator: 'Saudi Broadcasting Authority (Akamai Official)',
    badge: 'HLS 24/7 · Madinah',
  },
  {
    id: 'world-nyc-times-square',
    name: 'Times Square – Broadway & 46th Street (Live DOT)',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7589,
    lon: -73.9851,
    streamType: 'snapshot',
    streamUrl:
      'https://webcams.nyctmc.org/api/cameras/0935677f-d073-4f5f-a806-53219f749f6f/image',
    portalUrl: 'https://webcams.nyctmc.org/',
    operator: 'NYC Department of Transportation',
    badge: 'Live Frame 4s · NYC',
  },
  {
    id: 'world-nyc-brooklyn-bridge',
    name: 'Brooklyn Bridge & Lower Manhattan Skyline',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7061,
    lon: -73.9969,
    streamType: 'snapshot',
    streamUrl:
      'https://webcams.nyctmc.org/api/cameras/94524998-9415-404c-823a-1b7d26a404f5/image',
    portalUrl: 'https://webcams.nyctmc.org/',
    operator: 'NYC Department of Transportation',
    badge: 'Live Frame 4s · NYC',
  },
  {
    id: 'world-la-hollywood-101',
    name: 'Downtown Los Angeles – Harbor Freeway I-110',
    city: 'Los Angeles',
    provinceOrCountry: 'California, Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 34.0618,
    lon: -118.2469,
    streamType: 'hls',
    streamUrl:
      'https://wzmedia.dot.ca.gov/D7/110_N_of_3rd_St_C053.stream/playlist.m3u8',
    posterUrl:
      'https://cwwp2.dot.ca.gov/data/d7/cctv/image/c053110northof3rdst/c053110northof3rdst.jpg',
    portalUrl: 'https://quickmap.dot.ca.gov/',
    operator: 'Caltrans District 7 California',
    badge: 'HLS + Snapshot · LA',
  },
  {
    id: 'world-tokyo-shibuya',
    name: 'Shibuya Scramble Crossing Live Camera',
    city: 'Tokyo',
    provinceOrCountry: 'Jepang',
    scope: 'world',
    regionGroup: 'Asia Tenggara & Timur',
    lat: 35.6595,
    lon: 139.7005,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/df37K224RRg?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://www.youtube.com/results?search_query=shibuya+live+camera',
    operator: 'Tokyo Live Street Cam',
    badge: 'Live 24/7 · Tokyo',
  },
  {
    id: 'world-helsinki-ring1',
    name: 'Kehä I (Ring I) Espoo – Helsinki Metropolitan',
    city: 'Helsinki',
    provinceOrCountry: 'Finlandia (Eropa)',
    scope: 'world',
    regionGroup: 'Eropa & Antariksa',
    lat: 60.2148,
    lon: 24.8136,
    streamType: 'snapshot',
    streamUrl: 'https://weathercam.digitraffic.fi/C0150201.jpg',
    portalUrl: 'https://liikennetilanne.fintraffic.fi/',
    operator: 'Fintraffic Finland Open Data',
    badge: 'Live Frame · Eropa',
  },
  {
    id: 'world-nasa-iss-earth',
    name: 'NASA TV Public & International Space Station (ISS Earth)',
    city: 'Low Earth Orbit',
    provinceOrCountry: 'Antariksa Internasional',
    scope: 'world',
    regionGroup: 'Eropa & Antariksa',
    lat: 28.5729,
    lon: -80.649,
    streamType: 'hls',
    streamUrl:
      'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    portalUrl: 'https://plus.nasa.gov/',
    operator: 'NASA Official Akamai Stream',
    badge: 'HLS 24/7 · NASA',
  },
];

// =========================================================================
// DYNAMIC OFFICIAL OPEN-DATA FETCHERS (5-Minute Client Memory Cache)
// =========================================================================
const DYNAMIC_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedDynamicIndonesia: CctvCameraItem[] | null = null;
let cachedDynamicWorld: CctvCameraItem[] | null = null;
let dynamicCacheTimestamp = 0;

export async function fetchDynamicIndonesiaCctv(
  signal?: AbortSignal
): Promise<CctvCameraItem[]> {
  if (
    cachedDynamicIndonesia &&
    Date.now() - dynamicCacheTimestamp < DYNAMIC_CACHE_TTL_MS
  ) {
    return cachedDynamicIndonesia;
  }

  const discovered: CctvCameraItem[] = [];

  const [baliJson, jogjaJson] = await Promise.all([
    fetchJsonSafe('https://balisatudata.baliprov.go.id/api/v1/report-cctv', {
      timeoutMs: 5500,
      signal,
    }),
    fetchJsonSafe('https://cctv.jogjakota.go.id/home/getdata', {
      timeoutMs: 5500,
      signal,
      proxyFirst: true,
    }),
  ]);

  // 1. Bali Satu Data (~90+ Live Port-443 HLS Cameras)
  const baliRows =
    baliJson && !Array.isArray(baliJson) && Array.isArray(baliJson.data)
      ? (baliJson.data as Array<Record<string, unknown>>)
      : Array.isArray(baliJson)
        ? (baliJson as Array<Record<string, unknown>>)
        : [];

  for (const row of baliRows.slice(0, 36)) {
    const chId = String(row.ch_id || row.channel_id || '').trim();
    const title = String(row.nama_cctv || row.lokasi || row.name || '').trim();
    const kab = String(row.kabupaten || row.kota || 'Bali').trim();
    const lat = Number(row.lat || row.latitude || -8.65);
    const lon = Number(row.lng || row.lon || row.longitude || 115.2167);
    if (!chId || !title) continue;

    discovered.push({
      id: `bali-live-${chId}`,
      name: title,
      city: kab,
      provinceOrCountry: 'Bali',
      scope: 'indonesia',
      regionGroup: 'Bali & Nusra',
      lat: Number.isFinite(lat) ? lat : -8.65,
      lon: Number.isFinite(lon) ? lon : 115.2167,
      streamType: 'hls',
      streamUrl: `https://transcode.baliprov.go.id/cctv/${encodeURIComponent(chId)}/index.m3u8`,
      portalUrl: 'https://balisatudata.baliprov.go.id/peta-cctv',
      operator: 'Pemprov Bali (Bali Satu Data)',
      badge: 'HLS Live · Bali',
    });
  }

  // 2. CCTV Kota Yogyakarta (Wowza Port-443 HLS Cameras)
  const jogjaRows = Array.isArray(jogjaJson)
    ? (jogjaJson as Array<Record<string, unknown>>)
    : jogjaJson && !Array.isArray(jogjaJson) && Array.isArray(jogjaJson.data)
      ? (jogjaJson.data as Array<Record<string, unknown>>)
      : [];

  for (const row of jogjaRows.slice(0, 28)) {
    const name = String(row.cctv_title || row.nama || row.title || '').trim();
    const rawStream = String(row.cctv_link || row.stream_url || row.url || '').trim();
    const lat = Number(row.cctv_latitude || row.lat || -7.797);
    const lon = Number(row.cctv_longitude || row.lng || 110.37);
    if (!name || !/^https:\/\/.+\.m3u8/i.test(rawStream)) continue;

    discovered.push({
      id: `jogja-live-${discovered.length}`,
      name,
      city: 'Kota Yogyakarta',
      provinceOrCountry: 'DI Yogyakarta',
      scope: 'indonesia',
      regionGroup: 'Jateng & DIY',
      lat: Number.isFinite(lat) ? lat : -7.797,
      lon: Number.isFinite(lon) ? lon : 110.37,
      streamType: 'hls',
      streamUrl: rawStream,
      fallbackEmbedUrl:
        'https://www.youtube-nocookie.com/embed/YyCjzb0kWfY?autoplay=1&mute=1&playsinline=1&rel=0',
      portalUrl: 'https://cctv.jogjakota.go.id/',
      operator: 'Pemkot Yogyakarta (JSS)',
      badge: 'HLS Live · Jogja',
    });
  }

  if (discovered.length > 0) {
    cachedDynamicIndonesia = discovered;
    dynamicCacheTimestamp = Date.now();
  }
  return discovered;
}

export async function fetchDynamicWorldCctv(
  signal?: AbortSignal
): Promise<CctvCameraItem[]> {
  if (
    cachedDynamicWorld &&
    Date.now() - dynamicCacheTimestamp < DYNAMIC_CACHE_TTL_MS
  ) {
    return cachedDynamicWorld;
  }

  const discovered: CctvCameraItem[] = [];

  const [sgJson, calJson, nycJson] = await Promise.all([
    fetchJsonSafe('https://api.data.gov.sg/v1/transport/traffic-images', {
      timeoutMs: 5500,
      signal,
    }),
    fetchJsonSafe('https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json', {
      timeoutMs: 6000,
      signal,
      proxyFirst: true,
    }),
    fetchJsonSafe('https://webcams.nyctmc.org/api/cameras/', {
      timeoutMs: 6000,
      signal,
      proxyFirst: true,
    }),
  ]);

  // 1. Singapore LTA Real-Time Traffic Cameras
  if (sgJson && !Array.isArray(sgJson) && Array.isArray(sgJson.items)) {
    const firstItem = (sgJson.items as Array<Record<string, unknown>>)[0];
    const cams = Array.isArray(firstItem?.cameras)
      ? (firstItem.cameras as Array<Record<string, unknown>>)
      : [];
    const landmarkNames: Record<string, string> = {
      '2701': 'Woodlands Causeway (Perbatasan Singapura – Johor)',
      '4703': 'Tuas Second Link Checkpoint',
      '1701': 'CTE Moulmein / Orchard Road Corridor',
      '1001': 'ECP Marina Coastal / Benjamin Sheares Bridge',
    };
    for (const cam of cams.slice(0, 24)) {
      const camId = String(cam.camera_id || '');
      const imgUrl = String(cam.image || '');
      const loc = (cam.location as Record<string, unknown> | undefined) || {};
      const lat = Number(loc.latitude || 1.3521);
      const lon = Number(loc.longitude || 103.8198);
      if (!camId || !/^https:\/\//i.test(imgUrl)) continue;

      discovered.push({
        id: `sg-lta-${camId}`,
        name: landmarkNames[camId] || `Singapore Expressway Cam #${camId}`,
        city: 'Singapura',
        provinceOrCountry: 'Singapura',
        scope: 'world',
        regionGroup: 'Asia Tenggara & Timur',
        lat,
        lon,
        streamType: 'snapshot',
        streamUrl: imgUrl,
        portalUrl:
          'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic-cameras.html',
        operator: 'LTA Singapore (data.gov.sg)',
        badge: 'HD Snapshot · SG',
      });
    }
  }

  // 2. Los Angeles Caltrans District 7 HLS Highway Cameras (+ live JPEG fallback!)
  if (calJson && !Array.isArray(calJson) && Array.isArray(calJson.data)) {
    for (const entry of (calJson.data as Array<Record<string, unknown>>).slice(0, 24)) {
      const cctv = (entry.cctv as Record<string, unknown> | undefined) || {};
      if (String(cctv.inService || '').toLowerCase() !== 'true') continue;
      const loc = (cctv.location as Record<string, unknown> | undefined) || {};
      const imgData = (cctv.imageData as Record<string, unknown> | undefined) || {};
      const st = (imgData.static as Record<string, unknown> | undefined) || {};
      const hlsUrl = String(imgData.streamingVideoURL || '').trim();
      const snapUrl = String(st.currentImageURL || '').trim();
      const locName = String(loc.locationName || '').trim();
      const nearbyPlace = String(loc.nearbyPlace || 'Los Angeles').trim();
      const lat = Number(loc.latitude || 34.0522);
      const lon = Number(loc.longitude || -118.2437);

      if (!locName || (!hlsUrl && !snapUrl)) continue;
      const useHls = /^https:\/\/.+\.m3u8$/i.test(hlsUrl);

      discovered.push({
        id: `caltrans-d7-${discovered.length}`,
        name: locName,
        city: nearbyPlace,
        provinceOrCountry: 'California, Amerika Serikat',
        scope: 'world',
        regionGroup: 'Amerika Utara',
        lat,
        lon,
        streamType: useHls ? 'hls' : 'snapshot',
        streamUrl: useHls ? hlsUrl : snapUrl,
        posterUrl: snapUrl || undefined,
        portalUrl: 'https://quickmap.dot.ca.gov/',
        operator: 'Caltrans DOT California',
        badge: useHls ? 'HLS Live · LA' : 'Live Snapshot · LA',
      });
    }
  }

  // 3. New York City DOT TMC Live Street Cameras
  if (Array.isArray(nycJson)) {
    const onlineNyc = (nycJson as Array<Record<string, unknown>>)
      .filter((c) => String(c.isOnline) === 'true' && c.id && c.name)
      .slice(0, 24);
    for (const c of onlineNyc) {
      const id = String(c.id);
      const area = String(c.area || 'Manhattan');
      discovered.push({
        id: `nyc-dot-${id}`,
        name: String(c.name),
        city: `${area}, New York`,
        provinceOrCountry: 'Amerika Serikat',
        scope: 'world',
        regionGroup: 'Amerika Utara',
        lat: Number(c.latitude || 40.758),
        lon: Number(c.longitude || -73.9855),
        streamType: 'snapshot',
        streamUrl: `https://webcams.nyctmc.org/api/cameras/${encodeURIComponent(id)}/image`,
        portalUrl: 'https://webcams.nyctmc.org/map',
        operator: 'NYC DOT Traffic Management',
        badge: 'Live Refresh 4s · NYC',
      });
    }
  }

  if (discovered.length > 0) {
    cachedDynamicWorld = discovered;
    dynamicCacheTimestamp = Date.now();
  }
  return discovered;
}

export async function getAllAvailableCctvCameras(
  signal?: AbortSignal
): Promise<CctvCameraItem[]> {
  const [dynId, dynWorld] = await Promise.all([
    fetchDynamicIndonesiaCctv(signal).catch(() => []),
    fetchDynamicWorldCctv(signal).catch(() => []),
  ]);

  const seen = new Set<string>();
  const merged: CctvCameraItem[] = [];
  for (const cam of [...CURATED_CCTV_CAMERAS, ...dynId, ...dynWorld]) {
    if (seen.has(cam.id)) continue;
    seen.add(cam.id);
    merged.push(cam);
  }
  return merged;
}

export async function executeCctvSearchTool(
  rawQuery: string,
  signal?: AbortSignal
): Promise<{
  content: string;
  cctvCameras: CctvCameraItem[];
  actionLinks: ToolActionLink[];
}> {
  const allCams = await getAllAvailableCctvCameras(signal);
  const q = rawQuery
    .trim()
    .toLowerCase()
    .replace(/^(cctv|kamera|live)\s+/i, '')
    .trim();

  let matched: CctvCameraItem[] = [];

  if (!q || q === 'all' || q === 'semua') {
    // Showcase 3 Instant Port-443 Indonesia streams + 3 Instant Port-443 World streams
    matched = [
      ...allCams
        .filter((c) => c.scope === 'indonesia' && c.streamType !== 'portal')
        .slice(0, 3),
      ...allCams
        .filter((c) => c.scope === 'world' && c.streamType !== 'portal')
        .slice(0, 3),
    ];
  } else if (
    q === 'indonesia' ||
    q === 'id' ||
    q === 'indo' ||
    q === 'nasional'
  ) {
    matched = allCams
      .filter((c) => c.scope === 'indonesia' && c.streamType !== 'portal')
      .slice(0, 6);
  } else if (
    q === 'dunia' ||
    q === 'world' ||
    q === 'global' ||
    q === 'internasional'
  ) {
    matched = allCams
      .filter((c) => c.scope === 'world' && c.streamType !== 'portal')
      .slice(0, 6);
  } else {
    const aliases: Record<string, string[]> = {
      jogja: ['yogyakarta', 'malioboro', 'sleman', 'diy'],
      jakarta: ['jabodetabek', 'depok', 'cikampek', 'jakarta'],
      tangerang: ['banten', 'serang', 'cilegon', 'jabodetabek'],
      surabaya: ['surabaya', 'lamongan', 'gresik', 'jawa timur'],
      solo: ['ungaran', 'salatiga', 'semarang'],
      sg: ['singapura', 'singapore', 'woodlands'],
      singapore: ['singapura', 'woodlands', 'tuas'],
      usa: ['amerika', 'new york', 'los angeles', 'california'],
      nyc: ['new york', 'times square', 'brooklyn'],
      la: ['los angeles', 'california'],
      mekah: ['makkah', 'haram', 'arab'],
      mekkah: ['makkah', 'haram', 'arab'],
      arab: ['makkah', 'madinah', 'arab'],
      jepang: ['tokyo', 'shibuya'],
      tol: ['cikampek', 'bina marga', 'cileunyi', 'nagreg'],
      gunung: ['merapi', 'semeru', 'bromo', 'magma', 'pvmbg'],
    };

    const tokens = q.split(/[\s,/-]+/).filter((t) => t.length >= 2);
    const expandedTerms = new Set<string>([q, ...tokens]);
    for (const tok of [q, ...tokens]) {
      for (const extra of aliases[tok] || []) {
        expandedTerms.add(extra);
      }
    }

    matched = allCams.filter((cam) => {
      const hay =
        `${cam.name} ${cam.city} ${cam.provinceOrCountry} ${cam.regionGroup} ${cam.operator}`.toLowerCase();
      for (const term of expandedTerms) {
        if (hay.includes(term)) return true;
      }
      return false;
    });

    // Rank direct playable streams ahead of portal-only entries
    const rankStream = (t: CctvCameraItem['streamType']) =>
      t === 'portal' ? 1 : 0;
    matched.sort((a, b) => rankStream(a.streamType) - rankStream(b.streamType));
  }

  const fallbackDefault = [
    ...allCams
      .filter((c) => c.scope === 'indonesia' && c.streamType !== 'portal')
      .slice(0, 3),
    ...allCams
      .filter((c) => c.scope === 'world' && c.streamType !== 'portal')
      .slice(0, 3),
  ];

  const selected = (matched.length > 0 ? matched : fallbackDefault).slice(0, 6);

  const actionLinks: ToolActionLink[] = selected.slice(0, 3).map((cam) => ({
    label: `📍 Maps: ${cam.city} (${cam.name.slice(0, 20)})`,
    url: buildGoogleMapsSearchUrl(`${cam.lat},${cam.lon}`),
    kind: 'maps',
  }));

  const summaryRows = selected.map(
    (cam, idx) =>
      `| ${idx + 1} | **${cam.name}** | ${cam.city}, ${cam.provinceOrCountry} | \`${cam.streamType.toUpperCase()}\` · ${cam.operator} |`
  );

  const content = [
    `### 📡 Pantauan Live CCTV Publik ${
      q ? `— "${rawQuery.trim()}"` : '(Indonesia & Dunia)'
    }`,
    matched.length > 0
      ? `Menampilkan **${selected.length} kamera publik resmi** dari total **${allCams.length} titik pantau aktif** (pilih kamera pada panel pemutar di bawah atau klik **Buka Ruang Pantau Multi-CCTV** untuk mode dinding monitor 2×2):`
      : `Kata kunci spesifik **"${rawQuery.trim()}"** belum memiliki stream langsung terindeks — menampilkan **${selected.length} kamera unggulan Indonesia & Dunia** beserta akses ke Ruang Pantau Penuh:`,
    '',
    `| # | Titik Kamera | Wilayah / Negara | Format & Instansi Sumber |`,
    `| :-: | :--- | :--- | :--- |`,
    ...summaryRows,
    '',
    `> 💡 **Tips GEOINT**: Seluruh kamera bersumber dari portal resmi pemerintah/ATCS/DOT publik (Port 443 legal & aman). Klik tombol **📍 Maps** untuk membuka koordinat persis titik kamera di Google Maps.`,
  ].join('\n');

  return {
    content,
    cctvCameras: selected,
    actionLinks,
  };
}
