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

export const CURATED_CCTV_CAMERAS: CctvCameraItem[] = [
  // =========================================================================
  // INDONESIA — JABODETABEK
  // =========================================================================
  {
    id: 'jkt-monas-barat',
    name: 'Kawasan Monas Barat & Medan Merdeka',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1754,
    lon: 106.8245,
    streamType: 'hls',
    streamUrl: 'https://cctv.balitower.co.id/Monas-Barat-010-506633_3/index.fmp4.m3u8',
    fallbackEmbedUrl: 'https://cctv.balitower.co.id/Monas-Barat-010-506633_3/embed.html?proto=hls',
    portalUrl: 'https://jakcctv.jakarta.go.id/publik',
    operator: 'Pemprov DKI Jakarta · Bali Tower',
    badge: 'HLS Live · Jakarta',
  },
  {
    id: 'jkt-patung-kuda',
    name: 'Simpang Patung Kuda / Merdeka Barat',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1802,
    lon: 106.8229,
    streamType: 'hls',
    streamUrl: 'https://cctv.balitower.co.id/Pospol-Merdeka-Barat-506817_1/index.fmp4.m3u8',
    fallbackEmbedUrl: 'https://cctv.balitower.co.id/Pospol-Merdeka-Barat-506817_1/embed.html?proto=hls',
    portalUrl: 'https://jakcctv.jakarta.go.id/publik',
    operator: 'Pemprov DKI Jakarta · Bali Tower',
    badge: 'HLS Live · Jakarta',
  },
  {
    id: 'jkt-gambir',
    name: 'Kawasan Stasiun Gambir & Merdeka Timur',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1767,
    lon: 106.8305,
    streamType: 'hls',
    streamUrl: 'https://cctv.balitower.co.id/Gambir-018-700457_5/index.fmp4.m3u8',
    fallbackEmbedUrl: 'https://cctv.balitower.co.id/Gambir-018-700457_5/embed.html?proto=hls',
    portalUrl: 'https://jakcctv.jakarta.go.id/publik',
    operator: 'Pemprov DKI Jakarta · Bali Tower',
    badge: 'HLS Live · Jakarta',
  },
  {
    id: 'jkt-benhil-sudirman',
    name: 'Koridor Bendungan Hilir — Sudirman',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.2116,
    lon: 106.8147,
    streamType: 'hls',
    streamUrl: 'https://cctv.balitower.co.id/Bendungan-Hilir-003-700014_4/index.fmp4.m3u8',
    fallbackEmbedUrl: 'https://cctv.balitower.co.id/Bendungan-Hilir-003-700014_4/embed.html?proto=hls',
    portalUrl: 'https://lewatmana.com/cam/',
    operator: 'Pemprov DKI Jakarta · Bali Tower',
    badge: 'HLS Live · Sudirman',
  },
  {
    id: 'bgr-atcs-pemda',
    name: 'Simpang Pemda Cibinong (ATCS Bogor)',
    city: 'Kab. Bogor',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.4797,
    lon: 106.8295,
    streamType: 'hls',
    streamUrl: 'https://itscctv-dishub.bogorkab.go.id/stream/PEMDA/index.m3u8',
    portalUrl: 'https://itscctv-dishub.bogorkab.go.id/',
    operator: 'ATCS Dishub Kab. Bogor',
    badge: 'HLS Live · Bogor',
  },
  {
    id: 'tng-atcs-dishub',
    name: 'ATCS Simpang Utama Tangerang Raya',
    city: 'Tangerang',
    provinceOrCountry: 'Banten',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1783,
    lon: 106.6319,
    streamType: 'portal',
    streamUrl: 'https://cctv-dishub.tangerangkab.go.id/cctv',
    portalUrl: 'https://cctv-dishub.tangerangkab.go.id/cctv',
    operator: 'Dishub Tangerang',
    badge: 'Portal Resmi ATCS',
  },
  {
    id: 'bks-ahmad-yani',
    name: 'Simpang Jl. Ahmad Yani Bekasi',
    city: 'Kota Bekasi',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.2383,
    lon: 106.9756,
    streamType: 'portal',
    streamUrl: 'https://dishub.bekasikota.go.id',
    portalUrl: 'https://dishub.bekasikota.go.id',
    operator: 'Dishub Kota Bekasi',
    badge: 'Portal Resmi ATCS',
  },

  // =========================================================================
  // INDONESIA — JAWA BARAT
  // =========================================================================
  {
    id: 'tsm-taman-kota',
    name: 'Taman Kota & Jl. HZ Mustofa',
    city: 'Kota Tasikmalaya',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -7.3274,
    lon: 108.2207,
    streamType: 'hls',
    streamUrl: 'https://atcs.tasikmalayakota.go.id/camera/tamankota.m3u8',
    portalUrl: 'https://atcs.tasikmalayakota.go.id/',
    operator: 'ATCS Dishub Tasikmalaya',
    badge: 'HLS Live · Jabar',
  },
  {
    id: 'tsm-masjid-agung',
    name: 'Simpang Masjid Agung Tasikmalaya',
    city: 'Kota Tasikmalaya',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -7.3266,
    lon: 108.2198,
    streamType: 'hls',
    streamUrl: 'https://atcs.tasikmalayakota.go.id/camera/masjidagungarahgedungdakwah.m3u8',
    portalUrl: 'https://atcs.tasikmalayakota.go.id/',
    operator: 'ATCS Dishub Tasikmalaya',
    badge: 'HLS Live · Jabar',
  },
  {
    id: 'tsm-batas-bandung',
    name: 'Jalur Nasional Batas Kota Arah Bandung',
    city: 'Kota Tasikmalaya',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -7.3095,
    lon: 108.1982,
    streamType: 'hls',
    streamUrl: 'https://atcs.tasikmalayakota.go.id/camera/bataskotaarahbandung.m3u8',
    portalUrl: 'https://atcs.tasikmalayakota.go.id/',
    operator: 'ATCS Dishub Tasikmalaya',
    badge: 'HLS Live · Jalur Selatan',
  },
  {
    id: 'bdg-pelindung-dago',
    name: 'PELINDUNG ATCS Simpang Dago & Asia Afrika',
    city: 'Kota Bandung',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.9215,
    lon: 107.6071,
    streamType: 'portal',
    streamUrl: 'https://pelindung.bandung.go.id/',
    portalUrl: 'https://pelindung.bandung.go.id/',
    operator: 'Dishub Kota Bandung (PELINDUNG)',
    badge: '300+ Kamera Bandung',
  },
  {
    id: 'bgr-bsw-istana',
    name: 'Kawasan Kebun Raya & Istana Bogor',
    city: 'Kota Bogor',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.5971,
    lon: 106.7997,
    streamType: 'portal',
    streamUrl: 'https://bsw.kotabogor.go.id/cctv',
    portalUrl: 'https://bsw.kotabogor.go.id/cctv',
    operator: 'BSW Pemkot Bogor',
    badge: 'Portal CCTV Kota Bogor',
  },
  {
    id: 'crb-atcs-pantura',
    name: 'ATCS Jalur Pantura & Pusat Kota Cirebon',
    city: 'Kota Cirebon',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.732,
    lon: 108.5523,
    streamType: 'portal',
    streamUrl: 'https://dishub.cirebonkota.go.id/atcs/',
    portalUrl: 'https://dishub.cirebonkota.go.id/atcs/',
    operator: 'ATCS Dishub Cirebon',
    badge: 'Pantura Jabar',
  },

  // =========================================================================
  // INDONESIA — JAWA TENGAH & DI YOGYAKARTA
  // =========================================================================
  {
    id: 'jog-nolkm-malioboro',
    name: 'Titik Nol Kilometer & Ujung Selatan Malioboro',
    city: 'Kota Yogyakarta',
    provinceOrCountry: 'DI Yogyakarta',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.8014,
    lon: 110.3648,
    streamType: 'hls',
    streamUrl: 'https://cctvjss.jogjakota.go.id/malioboro/NolKm_Utara.stream/playlist.m3u8',
    portalUrl: 'https://cctv.jogjakota.go.id/',
    operator: 'Pemkot Yogyakarta (JSS)',
    badge: 'HLS Live · Malioboro',
  },
  {
    id: 'jog-mam-tugu',
    name: 'Kawasan Tugu Pal Putih & Simpang DIY',
    city: 'Kota Yogyakarta',
    provinceOrCountry: 'DI Yogyakarta',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.7829,
    lon: 110.367,
    streamType: 'portal',
    streamUrl: 'https://mam.jogjaprov.go.id/cctvs',
    portalUrl: 'https://cctv.jogjakota.go.id/',
    operator: 'Pemda DIY · Diskominfo',
    badge: '140+ Kamera DIY',
  },
  {
    id: 'smg-pantausemar',
    name: 'PantauSemar — Simpang Lima & Tugu Muda',
    city: 'Kota Semarang',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -6.9904,
    lon: 110.4229,
    streamType: 'portal',
    streamUrl: 'https://pantausemar.semarangkota.go.id/',
    portalUrl: 'https://pantausemar.semarangkota.go.id/',
    operator: 'Pemkot Semarang',
    badge: 'Portal PantauSemar',
  },
  {
    id: 'slo-ccroom-surakarta',
    name: 'CCRoom ATCS Slamet Riyadi & Gladag',
    city: 'Kota Surakarta (Solo)',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.5695,
    lon: 110.825,
    streamType: 'portal',
    streamUrl: 'https://ccroom-dishub.surakarta.go.id/',
    portalUrl: 'https://ccroom-dishub.surakarta.go.id/',
    operator: 'Dishub Kota Surakarta',
    badge: 'ATCS Kota Solo',
  },

  // =========================================================================
  // INDONESIA — JAWA TIMUR
  // =========================================================================
  {
    id: 'sby-sits-tunjungan',
    name: 'SITS Surabaya — Jl. Tunjungan & Taman Bungkul',
    city: 'Kota Surabaya',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.2658,
    lon: 112.7383,
    streamType: 'portal',
    streamUrl: 'https://its.surabaya.go.id/',
    portalUrl: 'https://its.surabaya.go.id/',
    operator: 'SITS Dishub Surabaya',
    badge: 'ATCS Kota Surabaya',
  },
  {
    id: 'kdr-atcs-alun',
    name: 'ATCS Alun-Alun & Bandar Ngalim Kediri',
    city: 'Kota Kediri',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.8266,
    lon: 112.0114,
    streamType: 'iframe',
    streamUrl: 'https://cctv-atcs.vercel.app/',
    portalUrl: 'https://cctv-atcs.vercel.app/',
    operator: 'ATCS Dishub Kota Kediri',
    badge: 'Live Embed · Jatim',
  },
  {
    id: 'mlg-atcs-kota',
    name: 'Kawasan Kayutangan & Alun-Alun Malang Raya',
    city: 'Kota Malang',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.9826,
    lon: 112.6308,
    streamType: 'portal',
    streamUrl: 'https://cctv.malangkota.go.id/',
    portalUrl: 'https://cctv.malangkota.go.id/',
    operator: 'Pemkot Malang',
    badge: 'Portal CCTV Malang',
  },

  // =========================================================================
  // INDONESIA — BALI & NUSA TENGGARA
  // =========================================================================
  {
    id: 'bali-dewa-ruci',
    name: 'Simpang Dewa Ruci & Sunset Road Kuta',
    city: 'Denpasar / Badung',
    provinceOrCountry: 'Bali',
    scope: 'indonesia',
    regionGroup: 'Bali & Nusra',
    lat: -8.7219,
    lon: 115.1825,
    streamType: 'portal',
    streamUrl: 'https://atcs.denpasarkota.go.id/streaming',
    portalUrl: 'https://balisatudata.baliprov.go.id/peta-cctv',
    operator: 'Bali Satu Data & ATCS Denpasar',
    badge: '250+ Kamera Bali',
  },

  // =========================================================================
  // INDONESIA — SUMATERA, KALIMANTAN, SULAWESI & TIMUR
  // =========================================================================
  {
    id: 'mdn-atcs-merdeka',
    name: 'ATCS Lapangan Merdeka & Kesawan Medan',
    city: 'Kota Medan',
    provinceOrCountry: 'Sumatera Utara',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: 3.5912,
    lon: 98.6775,
    streamType: 'portal',
    streamUrl: 'https://atcsdishub.medan.go.id/',
    portalUrl: 'https://atcsdishub.medan.go.id/',
    operator: 'ATCS Dishub Kota Medan',
    badge: '187 Kamera Medan',
  },
  {
    id: 'pdg-atcs-kota',
    name: 'ATCS Simpang Utama Kota Padang',
    city: 'Kota Padang',
    provinceOrCountry: 'Sumatera Barat',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: -0.9471,
    lon: 100.4172,
    streamType: 'portal',
    streamUrl: 'https://atcs.dishub.padang.go.id/',
    portalUrl: 'https://atcs.dishub.padang.go.id/',
    operator: 'Dishub Kota Padang',
    badge: 'ATCS Sumatera Barat',
  },
  {
    id: 'bdl-polresta-lampung',
    name: 'Pantau Lalu Lintas Kota Bandar Lampung',
    city: 'Bandar Lampung',
    provinceOrCountry: 'Lampung',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: -5.4292,
    lon: 105.261,
    streamType: 'portal',
    streamUrl: 'https://restabandarlampung.lampung.polri.go.id/cctv',
    portalUrl: 'https://restabandarlampung.lampung.polri.go.id/cctv',
    operator: 'Polresta Bandar Lampung',
    badge: 'Gerbang Sumatera',
  },
  {
    id: 'bpn-kaltim-ikn',
    name: 'ATCS Simpang Plaza Balikpapan & Koridor Kaltim',
    city: 'Kota Balikpapan',
    provinceOrCountry: 'Kalimantan Timur',
    scope: 'indonesia',
    regionGroup: 'Kalimantan, Sulawesi & Papua',
    lat: -1.2775,
    lon: 116.8359,
    streamType: 'portal',
    streamUrl: 'https://dishub.balikpapan.go.id/',
    portalUrl: 'https://dishub.balikpapan.go.id/',
    operator: 'Dishub Kota Balikpapan',
    badge: 'Kalimantan Timur',
  },
  {
    id: 'mks-losari-diskominfo',
    name: 'Anjungan Pantai Losari & Simpang Makassar',
    city: 'Kota Makassar',
    provinceOrCountry: 'Sulawesi Selatan',
    scope: 'indonesia',
    regionGroup: 'Kalimantan, Sulawesi & Papua',
    lat: -5.1436,
    lon: 119.4079,
    streamType: 'portal',
    streamUrl: 'https://diskominfo.makassarkota.go.id/',
    portalUrl: 'https://diskominfo.makassarkota.go.id/',
    operator: 'Pemkot Makassar',
    badge: 'Sulawesi Selatan',
  },

  // =========================================================================
  // INDONESIA — JALAN TOL, JALAN NASIONAL & GUNUNG API
  // =========================================================================
  {
    id: 'id-binamarga-its01',
    name: 'ITS Bina Marga — Jalur Jalan Nasional CT-01',
    city: 'Jalur Nasional PUPR',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -6.4025,
    lon: 107.4421,
    streamType: 'hls',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-01/index.m3u8',
    portalUrl: 'https://binamarga.pu.go.id/cctv-non-tol',
    operator: 'Ditjen Bina Marga Kementerian PU',
    badge: 'HLS Live · Jalan Nasional',
  },
  {
    id: 'id-bpjt-tol-nasional',
    name: 'BPJT Jalan Tol Seluruh Indonesia (Trans-Jawa & Sumatera)',
    city: 'Jaringan Jalan Tol RI',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -6.9935,
    lon: 110.3412,
    streamType: 'portal',
    streamUrl: 'https://bpjt.pu.go.id/cctv/cctv_inframe',
    portalUrl: 'https://bpjt.pu.go.id/cctv/cctv_inframe',
    operator: 'BPJT Kementerian PU & Jasa Marga',
    badge: 'Seluruh Ruas Tol RI',
  },
  {
    id: 'id-rttmc-kemenhub',
    name: 'RTTMC Kemenhub — Titik Rawan Macet & Jalur Mudik',
    city: 'Jalur Arteri Nasional',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -7.0221,
    lon: 107.8869,
    streamType: 'portal',
    streamUrl: 'https://rttmc.dephub.go.id/rttmc/livecctv',
    portalUrl: 'https://rttmc.dephub.go.id/rttmc/livecctv',
    operator: 'Ditjen Hubdat Kemenhub RI',
    badge: '30+ Pos Pantau Nasional',
  },
  {
    id: 'id-magma-gunung-api',
    name: 'MAGMA PVMBG — CCTV Gunung Merapi, Semeru, Bromo & Agung',
    city: 'Pos Pengamatan Gunung Api',
    provinceOrCountry: 'Indonesia',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -7.5407,
    lon: 110.4457,
    streamType: 'portal',
    streamUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    portalUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    operator: 'PVMBG Kementerian ESDM',
    badge: 'CCTV Vulkanologi RI',
  },

  // =========================================================================
  // WORLD — MAKKAH & MADINAH (TIMUR TENGAH)
  // =========================================================================
  {
    id: 'wld-makkah-haram',
    name: 'Masjidil Haram — Ka\'bah Live 24/7 (Saudi Quran TV)',
    city: 'Makkah Al-Mukarramah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 21.4225,
    lon: 39.8262,
    streamType: 'hls',
    streamUrl: 'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
    fallbackEmbedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA&autoplay=1&mute=1',
    portalUrl: 'https://www.youtube.com/@SaudiQuranTv/streams',
    operator: 'Saudi Broadcasting Authority (SBA)',
    badge: '24/7 HD Live · Makkah',
  },
  {
    id: 'wld-madinah-nabawi',
    name: 'Masjid Nabawi — Madinah Live 24/7 (Saudi Sunnah TV)',
    city: 'Al-Madinah Al-Munawwarah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 24.4672,
    lon: 39.6111,
    streamType: 'hls',
    streamUrl: 'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8',
    fallbackEmbedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCaff_7bc432V42_w0X4uBWA&autoplay=1&mute=1',
    portalUrl: 'https://www.youtube.com/@SaudiSunnahTv/streams',
    operator: 'Saudi Broadcasting Authority (SBA)',
    badge: '24/7 HD Live · Madinah',
  },

  // =========================================================================
  // WORLD — ASIA TENGGARA & ASIA TIMUR
  // =========================================================================
  {
    id: 'wld-tokyo-shibuya',
    name: 'Shibuya Scramble Crossing Live Cam (ANN/Tokyo)',
    city: 'Tokyo',
    provinceOrCountry: 'Jepang',
    scope: 'world',
    regionGroup: 'Asia Tenggara & Timur',
    lat: 35.6595,
    lon: 139.7004,
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCGCZAYq5Xxojl_tSXcVJhiQ&autoplay=1&mute=1',
    portalUrl: 'https://www.youtube.com/results?search_query=Shibuya+Scramble+Crossing+Live+Camera&sp=EgJAAQ%253D%253D',
    operator: 'Tokyo Live Street Broadcast',
    badge: 'Live · Tokyo',
  },
  {
    id: 'wld-sg-woodlands',
    name: 'Woodlands Causeway Border Checkpoint (SG–Johor)',
    city: 'Woodlands',
    provinceOrCountry: 'Singapura',
    scope: 'world',
    regionGroup: 'Asia Tenggara & Timur',
    lat: 1.4453,
    lon: 103.7689,
    streamType: 'portal',
    streamUrl: 'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic-cameras/woodlands.html',
    portalUrl: 'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic-cameras/woodlands.html',
    operator: 'Land Transport Authority (LTA) Singapore',
    badge: '87+ Kamera LTA Live',
  },

  // =========================================================================
  // WORLD — AMERIKA UTARA (NYC DOT & CALTRANS LIVE)
  // =========================================================================
  {
    id: 'wld-nyc-5th-34st',
    name: 'Midtown Manhattan — 5th Ave @ 34 St (Empire State)',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7484,
    lon: -73.9857,
    streamType: 'snapshot',
    streamUrl: 'https://webcams.nyctmc.org/api/cameras/3a3d7bc0-7f35-46ba-9cca-75fe83aac34d/image',
    portalUrl: 'https://webcams.nyctmc.org/map',
    operator: 'NYC Department of Transportation (TMC)',
    badge: 'Live Refresh 3s · NYC',
  },
  {
    id: 'wld-nyc-2ave-74st',
    name: 'Upper East Side — 2nd Ave @ 74 St Manhattan',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7701,
    lon: -73.9565,
    streamType: 'snapshot',
    streamUrl: 'https://webcams.nyctmc.org/api/cameras/6316453d-6161-4b98-a8e7-0e36c69d267c/image',
    portalUrl: 'https://webcams.nyctmc.org/map',
    operator: 'NYC Department of Transportation (TMC)',
    badge: 'Live Refresh 3s · NYC',
  },
  {
    id: 'wld-nyc-union-14st',
    name: 'Downtown Manhattan — E 14th St @ Irving Pl',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7341,
    lon: -73.9882,
    streamType: 'snapshot',
    streamUrl: 'https://webcams.nyctmc.org/api/cameras/f9cb9d4c-10ad-42e4-8997-dbc9e12bd55a/image',
    portalUrl: 'https://webcams.nyctmc.org/map',
    operator: 'NYC Department of Transportation (TMC)',
    badge: 'Live Refresh 3s · NYC',
  },

  // =========================================================================
  // WORLD — EROPA & ANTARIKSA (NASA ISS & FINTRAFFIC)
  // =========================================================================
  {
    id: 'wld-eu-helsinki-ring1',
    name: 'Helsinki Kehä I Highway Cam (Fintraffic Open Data)',
    city: 'Helsinki',
    provinceOrCountry: 'Finlandia (Eropa)',
    scope: 'world',
    regionGroup: 'Eropa & Antariksa',
    lat: 60.2241,
    lon: 24.8782,
    streamType: 'snapshot',
    streamUrl: 'https://weathercam.digitraffic.fi/C0150201.jpg',
    portalUrl: 'https://liikennetilanne.fintraffic.fi/',
    operator: 'Fintraffic Digitraffic EU',
    badge: 'HD Snapshot · Eropa',
  },
  {
    id: 'wld-nasa-iss-earth',
    name: 'NASA Live — Pemandangan Bumi dari Stasiun Luar Angkasa (ISS)',
    city: 'Orbit Rendah Bumi (408 km)',
    provinceOrCountry: 'Luar Angkasa Internasional',
    scope: 'world',
    regionGroup: 'Eropa & Antariksa',
    lat: 0.0,
    lon: 113.9213,
    streamType: 'hls',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    fallbackEmbedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=1&mute=1',
    portalUrl: 'https://plus.nasa.gov/scheduled-video/nasa-live/',
    operator: 'NASA Public Broadcast',
    badge: 'HLS HD · Orbit Bumi',
  },
];

// Session cache so dynamic API catalogs load once and stay instant
let cachedDynamicIndonesia: CctvCameraItem[] | null = null;
let cachedDynamicWorld: CctvCameraItem[] | null = null;
let dynamicCacheTimestamp = 0;
const DYNAMIC_CACHE_TTL_MS = 5 * 60 * 1000;

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
      timeoutMs: 6500,
      signal,
    }),
    fetchJsonSafe('https://cctv.jogjakota.go.id/home/getdata', {
      timeoutMs: 6500,
      signal,
      proxyFirst: true,
    }),
  ]);

  // 1. Bali Satu Data (~90+ Live HLS Cameras)
  const baliRows =
    baliJson && !Array.isArray(baliJson) && Array.isArray(baliJson.data)
      ? (baliJson.data as Array<Record<string, unknown>>)
      : Array.isArray(baliJson)
      ? (baliJson as Array<Record<string, unknown>>)
      : [];

  for (const row of baliRows.slice(0, 36)) {
    const chId = String(row.ch_id || '').trim();
    const title = String(row.nama_cctv || row.lokasi || row.name || '').trim();
    const kab = String(row.kabupaten || 'Bali').trim();
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

  // 2. CCTV Kota Yogyakarta (Wowza HLS Cameras)
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
      timeoutMs: 6500,
      signal,
    }),
    fetchJsonSafe('https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json', {
      timeoutMs: 7000,
      signal,
      proxyFirst: true,
    }),
    fetchJsonSafe('https://webcams.nyctmc.org/api/cameras/', {
      timeoutMs: 7000,
      signal,
      proxyFirst: true,
    }),
  ]);

  // 1. Singapore LTA Real-Time Traffic Cameras (87+ Live HD Snapshots)
  if (sgJson && !Array.isArray(sgJson) && Array.isArray(sgJson.items)) {
    const firstItem = (sgJson.items as Array<Record<string, unknown>>)[0];
    const cams = Array.isArray(firstItem?.cameras)
      ? (firstItem.cameras as Array<Record<string, unknown>>)
      : [];
    for (const cam of cams.slice(0, 24)) {
      const camId = String(cam.camera_id || '');
      const imgUrl = String(cam.image || '');
      const loc = (cam.location as Record<string, unknown> | undefined) || {};
      const lat = Number(loc.latitude || 1.3521);
      const lon = Number(loc.longitude || 103.8198);
      if (!camId || !/^https:\/\//i.test(imgUrl)) continue;

      discovered.push({
        id: `sg-lta-${camId}`,
        name: `Singapore Expressway Cam #${camId}`,
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

  // 2. Los Angeles Caltrans District 7 HLS Highway Cameras
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
        badge: 'Live Refresh 3s · NYC',
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

  const seenIds = new Set<string>();
  const merged: CctvCameraItem[] = [];
  for (const cam of [...CURATED_CCTV_CAMERAS, ...dynId, ...dynWorld]) {
    if (!seenIds.has(cam.id)) {
      seenIds.add(cam.id);
      merged.push(cam);
    }
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
  const q = rawQuery.trim().toLowerCase();
  const allCams = await getAllAvailableCctvCameras(signal);

  let matched: CctvCameraItem[] = [];

  if (!q || q === 'all' || q === 'semua') {
    // Showcase a rich mix of live Indonesia + World cameras
    matched = [
      ...allCams.filter((c) => c.scope === 'indonesia' && c.streamType === 'hls').slice(0, 4),
      ...allCams.filter((c) => c.scope === 'world').slice(0, 4),
    ];
  } else if (q === 'indonesia' || q === 'id' || q === 'indo' || q === 'nasional') {
    matched = allCams.filter((c) => c.scope === 'indonesia').slice(0, 8);
  } else if (q === 'dunia' || q === 'world' || q === 'global' || q === 'internasional') {
    matched = allCams.filter((c) => c.scope === 'world').slice(0, 8);
  } else {
    // Alias normalization for Indonesian & global search keywords
    const aliases: Record<string, string[]> = {
      jogja: ['yogyakarta', 'malioboro', 'diy'],
      jakarta: ['monas', 'merdeka', 'gambir', 'sudirman', 'dki'],
      sg: ['singapura', 'singapore', 'woodlands'],
      usa: ['amerika', 'new york', 'manhattan', 'los angeles', 'california'],
      nyc: ['new york', 'manhattan'],
      la: ['los angeles', 'california'],
      mekah: ['makkah', 'haram', 'arab'],
      mekkah: ['makkah', 'haram', 'arab'],
      jepang: ['tokyo', 'shibuya'],
      tol: ['bpjt', 'jalan tol', 'bina marga', 'rttmc'],
      gunung: ['merapi', 'semeru', 'bromo', 'magma', 'pvmbg'],
    };

    const expandedTerms = [q, ...(aliases[q] || [])];
    matched = allCams.filter((cam) => {
      const hay =
        `${cam.name} ${cam.city} ${cam.provinceOrCountry} ${cam.regionGroup} ${cam.operator}`.toLowerCase();
      return expandedTerms.some((term) => hay.includes(term));
    });
  }

  // Prioritize direct playable streams (hls / snapshot / youtube / iframe) first
  const rankStream = (t: CctvCameraItem['streamType']) =>
    t === 'hls' ? 0 : t === 'snapshot' ? 1 : t === 'youtube' || t === 'iframe' ? 2 : 3;

  matched.sort((a, b) => rankStream(a.streamType) - rankStream(b.streamType));
  const selected = (matched.length > 0 ? matched : allCams.slice(0, 6)).slice(0, 8);

  const actionLinks: ToolActionLink[] = selected.slice(0, 3).map((cam) => ({
    label: `📍 Maps: ${cam.name.slice(0, 26)}`,
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
    `> 💡 **Tips GEOINT**: Seluruh kamera bersumber dari portal resmi pemerintah/ATCS/DOT publik (legal & aman). Klik tombol **📍 Maps** untuk membuka koordinat persis titik tiang kamera di Google Maps.`,
  ].join('\n');

  return {
    content,
    cctvCameras: selected,
    actionLinks,
  };
}
