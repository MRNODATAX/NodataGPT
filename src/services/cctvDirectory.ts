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

function normalizePelindungStreamUrl(rawUrl: string): string {
  return String(rawUrl || '')
    .trim()
    .replace(/^https:\/([^/])/i, 'https://$1');
}

export const CURATED_CCTV_CAMERAS: CctvCameraItem[] = [
  // =========================================================================
  // INDONESIA — JABODETABEK (VERIFIED 2026 MULTI-ANGLE LIVE HLS + EMBED)
  // =========================================================================
  {
    id: 'jkt-bundaran-hi-plaza',
    name: 'Bundaran HI — Sisi Plaza Indonesia & MH Thamrin',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.19445,
    lon: 106.82255,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-01/embed.html',
    angles: [
      {
        label: 'Plaza Indonesia · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-01/embed.html',
      },
      {
        label: 'Plaza Indonesia · 2',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-02/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502491_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C07_CCTV-02/embed.html',
      },
      {
        label: 'Hotel Indonesia',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502493_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C09_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502493_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C09_CCTV-01/embed.html',
      },
      {
        label: 'Imam Bonjol',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/501844_JKP_DISHUB_JL.-MH.-THAMRIN-C01_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/501844_JKP_DISHUB_JL.-MH.-THAMRIN-C01_CCTV-01/embed.html',
      },
    ],
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · JakCCTV BaliTower',
    badge: '4 Sudut Live · Jakarta',
  },
  {
    id: 'jkt-thamrin-uob',
    name: 'Jl. MH Thamrin — Koridor UOB Plaza & Dukuh Atas',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.1992,
    lon: 106.82278,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-01/embed.html',
    angles: [
      {
        label: 'UOB · Sudut 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-01/embed.html',
      },
      {
        label: 'UOB · Sudut 2',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-02/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-02/embed.html',
      },
      {
        label: 'UOB · Sudut 3',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-03/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-03/embed.html',
      },
    ],
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · JakCCTV BaliTower',
    badge: '3 Sudut Live · Jakarta',
  },
  {
    id: 'jkt-gatsu-dpr',
    name: 'Jl. Gatot Subroto — JPO Seberang Gedung DPR/MPR RI',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.208,
    lon: 106.80425,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-01/embed.html',
    angles: [
      {
        label: 'Arah Semanggi',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-01/embed.html',
      },
      {
        label: 'Arah Slipi',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-02/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502045_JKP_POLDA_JPO-JL.-GATOT-SUBROTO-7_CCTV-02/embed.html',
      },
    ],
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · Polda Metro',
    badge: '2 Sudut Live · Jakarta',
  },
  {
    id: 'jkt-senayan-gbk-ladokgi',
    name: 'Senayan GBK — Gerbang Pemuda & Flyover Ladokgi',
    city: 'Jakarta Pusat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.21273,
    lon: 106.80716,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/502506_JKP_SATPOL-PP_JL.-GERBANG-PEMUDA-C04_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/502506_JKP_SATPOL-PP_JL.-GERBANG-PEMUDA-C04_CCTV-01/embed.html',
    angles: [
      {
        label: 'Gerbang Pemuda · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502506_JKP_SATPOL-PP_JL.-GERBANG-PEMUDA-C04_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502506_JKP_SATPOL-PP_JL.-GERBANG-PEMUDA-C04_CCTV-01/embed.html',
      },
      {
        label: 'Flyover Ladokgi',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/503536_JKP_DBM_FLYOVER-LADOKGI-C01_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/503536_JKP_DBM_FLYOVER-LADOKGI-C01_CCTV-01/embed.html',
      },
      {
        label: 'Gatot Subroto C11',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502507_JKP_SATPOL-PP_JL.-JEND.-GATOT-SUBROTO-C11_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502507_JKP_SATPOL-PP_JL.-JEND.-GATOT-SUBROTO-C11_CCTV-01/embed.html',
      },
    ],
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · JakCCTV BaliTower',
    badge: '3 Sudut Live · Jakarta',
  },
  {
    id: 'jkt-slipi-sparman',
    name: 'Simpang Slipi — Jl. Letjen S. Parman Jakarta Barat',
    city: 'Jakarta Barat',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.2015,
    lon: 106.7997,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/502535_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C07_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/502535_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C07_CCTV-01/embed.html',
    angles: [
      {
        label: 'Slipi C07 · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502535_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C07_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502535_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C07_CCTV-01/embed.html',
      },
      {
        label: 'Slipi C02 · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502540_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C02_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502540_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C02_CCTV-01/embed.html',
      },
      {
        label: 'Slipi C08 · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://dki-jkt.balitower.co.id:7028/502645_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C08_CCTV-01/index.fmp4.m3u8',
        fallbackEmbedUrl:
          'https://dki-jkt.balitower.co.id:7028/502645_JKB_SATPOL-PP_SIMPANG-JL.-LETJEN.-S.-PARMAN-C08_CCTV-01/embed.html',
      },
    ],
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · JakCCTV BaliTower',
    badge: '3 Sudut Live · Jakarta',
  },
  {
    id: 'jkt-blok-m-taman-literasi',
    name: 'Taman Literasi Martha Christina Tiahahu — MRT Blok M',
    city: 'Jakarta Selatan',
    provinceOrCountry: 'DKI Jakarta',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.2428,
    lon: 106.7987,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://dki-jkt.balitower.co.id:7028/501478_JKS_SATPOLPP_TAMAN-LITERASI-C01_CCTV-01/index.fmp4.m3u8',
    fallbackEmbedUrl:
      'https://dki-jkt.balitower.co.id:7028/501478_JKS_SATPOLPP_TAMAN-LITERASI-C01_CCTV-01/embed.html',
    portalUrl: 'https://jakcctv.jakarta.go.id/',
    operator: 'Pemprov DKI Jakarta · JakCCTV BaliTower',
    badge: 'HLS Live · Blok M',
  },
  {
    id: 'bgr-tugu-kujang',
    name: 'Tugu Kujang & Lawang Salapan — Kota Bogor',
    city: 'Kota Bogor',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.60145,
    lon: 106.80514,
    streamType: 'hls',
    streamUrl:
      'https://restreamer2.kotabogor.go.id/memfs/5a5cf878-9d9b-4400-a73a-27a5b24a6ec4.m3u8',
    angles: [
      {
        label: 'Tugu Kujang',
        streamType: 'hls',
        streamUrl:
          'https://restreamer2.kotabogor.go.id/memfs/5a5cf878-9d9b-4400-a73a-27a5b24a6ec4.m3u8',
      },
      {
        label: 'Arah Otista',
        streamType: 'hls',
        streamUrl:
          'https://restreamer6.kotabogor.go.id/memfs/c1f83df4-edda-4a5b-aff6-a3543236c1a6.m3u8',
      },
      {
        label: 'Alun-Alun / Stasiun',
        streamType: 'hls',
        streamUrl:
          'https://restreamer2.kotabogor.go.id/memfs/c07c1926-288c-46e4-a19c-9f51022edc5d.m3u8',
      },
    ],
    portalUrl: 'https://bsw.kotabogor.go.id/cctv',
    operator: 'Pemkot Bogor (BSW Restreamer)',
    badge: '3 Sudut HLS · Bogor',
  },
  {
    id: 'bks-terminal-bekasi',
    name: 'Jl. Cut Mutia — Terminal Kota Bekasi & Rawa Semut',
    city: 'Kota Bekasi',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.2509,
    lon: 107.01405,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://eofficev2.bekasikota.go.id/backupcctv/m3/Jl_Cut_Mutia_Terminal_Kota_Bekasi.m3u8',
    angles: [
      {
        label: 'Terminal Bekasi',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://eofficev2.bekasikota.go.id/backupcctv/m3/Jl_Cut_Mutia_Terminal_Kota_Bekasi.m3u8',
      },
      {
        label: 'Simpang Rawa Semut',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://eofficev2.bekasikota.go.id/backupcctv/m3/Jl_Cut_Mutia_Perempatan_Rawa_Semut.m3u8',
      },
      {
        label: 'RS Primaya Bekasi Timur',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://eofficev2.bekasikota.go.id/backupcctv/m3/Jl_HM_Joyo_Martono_RS_Primaya_Bekasi_Timur.m3u8',
      },
    ],
    portalUrl: 'https://bekasikota.go.id/cctv',
    operator: 'Pemkot Bekasi (Diskominfostandi)',
    badge: '3 Sudut HLS · Bekasi',
  },
  {
    id: 'tgr-sipantau-polor',
    name: 'SIPANTAU Kota Tangerang — Jembatan Polor & Kali Angke',
    city: 'Kota Tangerang',
    provinceOrCountry: 'Banten',
    scope: 'indonesia',
    regionGroup: 'Jabodetabek',
    lat: -6.18914,
    lon: 106.71678,
    streamType: 'iframe',
    streamUrl:
      'https://cctv.dpuprkotang.info/stream.html?src=Jembatan%20Polor&embed=true',
    angles: [
      {
        label: 'Jembatan Polor',
        streamType: 'iframe',
        streamUrl:
          'https://cctv.dpuprkotang.info/stream.html?src=Jembatan%20Polor&embed=true',
      },
      {
        label: 'Duren Villa',
        streamType: 'iframe',
        streamUrl:
          'https://cctv.dpuprkotang.info/stream.html?src=Duren%20Villa&embed=true',
      },
      {
        label: 'Mutiara Serpong',
        streamType: 'iframe',
        streamUrl:
          'https://cctv.dpuprkotang.info/stream.html?src=Angke-Mutiara-Serpong&embed=true',
      },
    ],
    portalUrl: 'https://sipantau.dpuprkotang.info/',
    operator: 'DPUPR Kota Tangerang (SIPANTAU)',
    badge: 'Live Stream · Tangerang',
  },

  // =========================================================================
  // INDONESIA — JAWA BARAT (BANDUNG PELINDUNG, PUNCAK 24/7, BBPJN JABAR)
  // =========================================================================
  {
    id: 'jabar-puncak-gunungmas',
    name: 'Jalur Puncak Cisarua — Agrowisata Gunung Mas & Simpang Gadog 24/7',
    city: 'Puncak Cisarua (Bogor)',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.70298,
    lon: 106.97156,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/ZIMY7se8oeM?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Gunung Mas · Arah Gadog',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/ZIMY7se8oeM?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Gunung Mas · Arah Puncak Pass',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/MCDLETMPBrA?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Simpang Gadog Ciawi',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/JJ3MWNYVCU4?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=ZIMY7se8oeM',
    operator: 'Pantauan Jalur Puncak 24 Jam',
    badge: '3 Sudut 24/7 · Puncak',
  },
  {
    id: 'bdg-pasteur-btc',
    name: 'Gerbang Pasteur — Jl. Dr. Djunjunan BTC Kota Bandung',
    city: 'Kota Bandung',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.892825,
    lon: 107.585245,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://pelindung.bandung.go.id:3443/video/HIKSVISION/DrDjunjunanBTC.m3u8',
    angles: [
      {
        label: 'Pasteur BTC · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://pelindung.bandung.go.id:3443/video/HIKSVISION/DrDjunjunanBTC.m3u8',
      },
      {
        label: 'Pasteur BTC · 2',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://pelindung.bandung.go.id:3443/video/HIKSVISION/DrDjunjunanBTCdua.m3u8',
      },
    ],
    portalUrl: 'https://pelindung.bandung.go.id/',
    operator: 'Diskominfo Kota Bandung (PELINDUNG)',
    badge: 'HLS Live · Bandung',
  },
  {
    id: 'bdg-braga-naripan',
    name: 'Kawasan Wisata Jl. Braga & Naripan — Kota Bandung',
    city: 'Kota Bandung',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.916058,
    lon: 107.60897,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl: 'https://pelindung.bandung.go.id:3443/video/HIKSVISION/braga.m3u8',
    angles: [
      {
        label: 'Jl. Braga · 1',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://pelindung.bandung.go.id:3443/video/HIKSVISION/braga.m3u8',
      },
      {
        label: 'Jl. Braga · 2',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://pelindung.bandung.go.id:3443/video/HIKSVISION/bragaa.m3u8',
      },
      {
        label: 'Braga – Naripan',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://pelindung.bandung.go.id:3443/video/HIKSVISION/Nar.m3u8',
      },
    ],
    portalUrl: 'https://pelindung.bandung.go.id/',
    operator: 'Diskominfo Kota Bandung (PELINDUNG)',
    badge: '3 Sudut HLS · Braga',
  },
  {
    id: 'jabar-cileunyi-nagreg',
    name: 'Jalur Nasional Bandung Timur — Cileunyi & Lingkar Nagreg',
    city: 'Bandung Timur / Nagreg',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.9395,
    lon: 107.7528,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/i9aQbdm6LEE?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Simpang Cileunyi',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/i9aQbdm6LEE?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Jalur Nagreg',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/lutKssQIWoM?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=i9aQbdm6LEE',
    operator: 'BBPJN DKI Jakarta – Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · BBPJN',
  },
  {
    id: 'jabar-karawang-cikampek',
    name: 'Jalur Pantura Karawang & Simpang Mutiara Cikampek',
    city: 'Karawang',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.3045,
    lon: 107.3021,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-08/index.m3u8',
    fallbackEmbedUrl:
      'https://www.youtube-nocookie.com/embed/Tf3TMJp9L5k?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Lingkar Karawang CT-08',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-08/index.m3u8',
        fallbackEmbedUrl:
          'https://www.youtube-nocookie.com/embed/Tf3TMJp9L5k?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Jl. A. Yani Cikampek CT-10',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-10/index.m3u8',
      },
    ],
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'Ditjen Bina Marga Kementerian PU',
    badge: 'HLS + Backup · Karawang',
  },
  {
    id: 'jabar-cirebon-pantura',
    name: 'Jalur Pantura Cirebon — Palimanan & Losari',
    city: 'Kota / Kab. Cirebon',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jawa Barat',
    lat: -6.7063,
    lon: 108.4312,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/c5cICQjUJ0c?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Palimanan Cirebon',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/c5cICQjUJ0c?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Perbatasan Losari',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/o7H6_ZtLiMA?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=c5cICQjUJ0c',
    operator: 'BBPJN DKI Jakarta – Jawa Barat (KemenPU)',
    badge: 'Live 24/7 · Cirebon',
  },

  // =========================================================================
  // INDONESIA — JAWA TENGAH & DI YOGYAKARTA (VERIFIED BBPJN JATENG-DIY LIVE)
  // =========================================================================
  {
    id: 'jateng-semarang-bawen',
    name: 'Koridor Semarang — Ungaran, Bawen & Jl. Walisongo',
    city: 'Semarang',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.1312,
    lon: 110.4055,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/I6dMOkfYCIs?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Simpang Bawen – Semarang',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/I6dMOkfYCIs?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Jl. Walisongo Semarang',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/FVV6G8fQyOY?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://pantausemar.semarangkota.go.id/',
    operator: 'BBPJN Jawa Tengah – DI Yogyakarta',
    badge: '2 Sudut Live · Semarang',
  },
  {
    id: 'diy-sleman-magelang',
    name: 'Gerbang Utara Yogyakarta — Perbatasan Sleman & Magelang',
    city: 'Sleman / Yogyakarta',
    provinceOrCountry: 'DI Yogyakarta',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.6481,
    lon: 110.3267,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/YyCjzb0kWfY?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://cctv.jogjaprov.go.id/',
    operator: 'BBPJN Jawa Tengah – DI Yogyakarta',
    badge: 'Live 24/7 · DIY',
  },
  {
    id: 'jateng-pekalongan-tegal',
    name: 'Jalur Pantura Barat — Kota Pekalongan & Bumiayu Tegal',
    city: 'Kota Pekalongan',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -6.8898,
    lon: 109.6746,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/8HUccaQ3488?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Dr. Sutomo Pekalongan',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/8HUccaQ3488?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Jalur Bumiayu – Tegal',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/ZeJdlXW3-gI?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=8HUccaQ3488',
    operator: 'BBPJN Jawa Tengah – DI Yogyakarta',
    badge: 'Live 24/7 · Pantura',
  },
  {
    id: 'jateng-solo-ccroom',
    name: 'ATCS Dishub Kota Surakarta (Solo) — Simpang Gladag & Slamet Riyadi',
    city: 'Kota Surakarta (Solo)',
    provinceOrCountry: 'Jawa Tengah',
    scope: 'indonesia',
    regionGroup: 'Jateng & DIY',
    lat: -7.5718,
    lon: 110.8281,
    streamType: 'portal',
    streamUrl: 'https://ccroom-dishub.surakarta.go.id/',
    portalUrl: 'https://ccroom-dishub.surakarta.go.id/',
    operator: 'Dishub Kota Surakarta (CCRoom)',
    badge: 'Portal Resmi · Solo',
  },

  // =========================================================================
  // INDONESIA — JAWA TIMUR (SURABAYA-GEMPOL, MALang, BANYUWANGI, KEDIRI)
  // =========================================================================
  {
    id: 'jatim-surabaya-gempol',
    name: 'Koridor Utama Surabaya–Malang (Simpang Gempol–Pandaan)',
    city: 'Surabaya / Pasuruan',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.5582,
    lon: 112.6974,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/1fyAqMDaR2A?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Gempol – Pandaan',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/1fyAqMDaR2A?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Pantura Lamongan – Widang',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/ie2mgahxFTk?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://sits.dishub.surabaya.go.id/',
    operator: 'BBPJN Jawa Timur – Bali (KemenPU)',
    badge: 'Live 24/7 · Jatim',
  },
  {
    id: 'jatim-malang-karanglo',
    name: 'Gerbang Malang Raya — Simpang Karanglo / Singosari',
    city: 'Malang',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.9041,
    lon: 112.6512,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/iGSmNPsgYdA?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://www.youtube.com/watch?v=iGSmNPsgYdA',
    operator: 'BBPJN Jawa Timur – Bali (KemenPU)',
    badge: 'Live 24/7 · Malang',
  },
  {
    id: 'jatim-banyuwangi-ketapang',
    name: 'Jalur Pantura Timur — Banyuwangi / Akses Pelabuhan Ketapang',
    city: 'Banyuwangi',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -8.1442,
    lon: 114.3981,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/eY-32lH9B98?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://www.youtube.com/watch?v=eY-32lH9B98',
    operator: 'BBPJN Jawa Timur – Bali (KemenPU)',
    badge: 'Live 24/7 · Banyuwangi',
  },
  {
    id: 'jatim-jombang-kediri',
    name: 'Jalur Tengah Jawa Timur — Jombang & Kediri',
    city: 'Jombang / Kediri',
    provinceOrCountry: 'Jawa Timur',
    scope: 'indonesia',
    regionGroup: 'Jawa Timur',
    lat: -7.5561,
    lon: 112.2335,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/aLtqLSLh5wo?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://www.youtube.com/watch?v=aLtqLSLh5wo',
    operator: 'BBPJN Jawa Timur – Bali (KemenPU)',
    badge: 'Live 24/7 · Jombang',
  },

  // =========================================================================
  // INDONESIA — BALI & NUSA TENGGARA (VERIFIED DENPASAR ATCS + PEMPROV BALI HLS)
  // =========================================================================
  {
    id: 'bali-dps-gunung-agung',
    name: 'Simpang Gunung Agung — Wahidin (ATCS Kota Denpasar)',
    city: 'Kota Denpasar',
    provinceOrCountry: 'Bali',
    scope: 'indonesia',
    regionGroup: 'Bali & Nusra',
    lat: -8.654504,
    lon: 115.208528,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl: 'https://atcs.denpasarkota.go.id/stream/A001GUNUNGAGUNGPTZ/index.m3u8',
    fallbackEmbedUrl: 'https://atcs.denpasarkota.go.id/stream/A001GUNUNGAGUNGPTZ/',
    angles: [
      {
        label: 'Simpang Gunung Agung',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://atcs.denpasarkota.go.id/stream/A001GUNUNGAGUNGPTZ/index.m3u8',
        fallbackEmbedUrl:
          'https://atcs.denpasarkota.go.id/stream/A001GUNUNGAGUNGPTZ/',
      },
      {
        label: 'Simpang Teuku Umar',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://atcs.denpasarkota.go.id/stream/A004TEUKUUMARPTZ1/index.m3u8',
        fallbackEmbedUrl:
          'https://atcs.denpasarkota.go.id/stream/A004TEUKUUMARPTZ1/',
      },
      {
        label: 'Simpang Gunung Salak',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://atcs.denpasarkota.go.id/stream/A003GUNUNGSALAKPTZ/index.m3u8',
        fallbackEmbedUrl:
          'https://atcs.denpasarkota.go.id/stream/A003GUNUNGSALAKPTZ/',
      },
    ],
    portalUrl: 'https://atcs.denpasarkota.go.id/',
    operator: 'Dishub Kota Denpasar (ATCS)',
    badge: '3 Sudut HLS · Denpasar',
  },
  {
    id: 'bali-sanur-padang-galak',
    name: 'By Pass Ngurah Rai — Simpang Padang Galak & Sanur Beach',
    city: 'Denpasar Timur (Sanur)',
    provinceOrCountry: 'Bali',
    scope: 'indonesia',
    regionGroup: 'Bali & Nusra',
    lat: -8.656986,
    lon: 115.260769,
    streamType: 'hls',
    streamUrl:
      'https://transcode.baliprov.go.id/cctv/simpang-padang-galak/index.m3u8',
    fallbackEmbedUrl:
      'https://transcode.baliprov.go.id/cctv-player.html?id=simpang-padang-galak',
    angles: [
      {
        label: 'Simpang Padang Galak',
        streamType: 'hls',
        streamUrl:
          'https://transcode.baliprov.go.id/cctv/simpang-padang-galak/index.m3u8',
        fallbackEmbedUrl:
          'https://transcode.baliprov.go.id/cctv-player.html?id=simpang-padang-galak',
      },
      {
        label: 'Simpang Bali Beach Sanur',
        streamType: 'hls',
        streamUrl:
          'https://transcode.baliprov.go.id/cctv/simpang-bali-beach/index.m3u8',
        fallbackEmbedUrl:
          'https://transcode.baliprov.go.id/cctv-player.html?id=simpang-bali-beach',
      },
    ],
    portalUrl: 'https://balisatudata.baliprov.go.id/peta-cctv',
    operator: 'Pemprov Bali (Bali Satu Data)',
    badge: 'HLS + Player · Bali',
  },

  // =========================================================================
  // INDONESIA — SUMATERA, KALIMANTAN, SULAWESI & JALAN TOL NASIONAL
  // =========================================================================
  {
    id: 'sum-lampung-lintas',
    name: 'Jalan Lintas Sumatera — Bandar Lampung & Gedongtataan',
    city: 'Kota Bandar Lampung',
    provinceOrCountry: 'Lampung',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: -5.3821,
    lon: 105.2412,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/2qeYBZA4UWo?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'Lintas Barat Lampung',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/2qeYBZA4UWo?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'Tegineneng – Tj. Karang',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/_5FbJzADUy4?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=2qeYBZA4UWo',
    operator: 'BPJN Lampung (KemenPU)',
    badge: '2 Sudut Live · Lampung',
  },
  {
    id: 'sum-medan-atcs',
    name: 'ATCS Dishub Kota Medan — Lapangan Merdeka & Pusat Kota',
    city: 'Kota Medan',
    provinceOrCountry: 'Sumatera Utara',
    scope: 'indonesia',
    regionGroup: 'Sumatera',
    lat: 3.5912,
    lon: 98.6775,
    streamType: 'portal',
    streamUrl: 'https://atcsdishub.pemkomedan.go.id/',
    portalUrl: 'https://atcsdishub.pemkomedan.go.id/',
    operator: 'Dishub Pemko Medan',
    badge: 'Portal Resmi · Medan',
  },
  {
    id: 'kalsul-balikpapan-makassar',
    name: 'ATCS Kota Balikpapan & Gerbang IKN Kalimantan Timur',
    city: 'Kota Balikpapan',
    provinceOrCountry: 'Kalimantan Timur',
    scope: 'indonesia',
    regionGroup: 'Kalimantan, Sulawesi & Papua',
    lat: -1.2654,
    lon: 116.8312,
    streamType: 'portal',
    streamUrl: 'http://dishub.balikpapan.go.id/',
    portalUrl: 'http://dishub.balikpapan.go.id/',
    operator: 'Dishub Kota Balikpapan',
    badge: 'Portal Resmi · Kaltim',
  },
  {
    id: 'tol-jagorawi-live',
    name: 'Jalan Tol Jagorawi — KM 04+500 s/d KM 05+500 (Jasa Marga Live)',
    city: 'Jakarta Timur – Bogor',
    provinceOrCountry: 'Jabodetabek',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -6.28565,
    lon: 106.87709,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl:
      'https://jmlive.jasamarga.com/hls/1/8a55d3af-0a5b-4252-a124-285bcbf8bc66/index.m3u8',
    angles: [
      {
        label: 'Jagorawi KM 04+500',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://jmlive.jasamarga.com/hls/1/8a55d3af-0a5b-4252-a124-285bcbf8bc66/index.m3u8',
      },
      {
        label: 'Jagorawi KM 05+000',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://jmlive.jasamarga.com/hls/1/f4d533b2-0880-46a9-b1ba-c1a865f63971/index.m3u8',
      },
      {
        label: 'Tol Dalam Kota Cawang',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl:
          'https://jmlive.jasamarga.com/hls/2/6fc58c16-f2bf-4125-aac1-2b893621e692/index.m3u8',
      },
    ],
    portalUrl: 'https://binamarga.pu.go.id/contents/cctv_tol/?id_ruas=jakarta-bogor-ciawi',
    operator: 'PT Jasa Marga (Persero) Tbk · BPJT',
    badge: '3 Ruas HLS · Jalan Tol',
  },
  {
    id: 'tol-binamarga-pantura',
    name: 'Jalan Nasional Bina Marga — Tambun CT-01 & Cikarang CT-03',
    city: 'Bekasi – Cikarang',
    provinceOrCountry: 'Jawa Barat',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -6.26267,
    lon: 107.06284,
    streamType: 'hls',
    proxyHlsFirst: true,
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-01/index.m3u8',
    angles: [
      {
        label: 'Tambun Selatan CT-01',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-01/index.m3u8',
      },
      {
        label: 'Cikarang Utara CT-03',
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-03/index.m3u8',
      },
    ],
    portalUrl: 'https://binamarga.pu.go.id/',
    operator: 'ITS Ditjen Bina Marga KemenPU',
    badge: 'HLS Live · Jalan Nasional',
  },
  {
    id: 'gunung-magma-esdm',
    name: 'MAGMA Indonesia — Pantauan Gunung Api Merapi, Semeru & Lewotobi',
    city: 'Seluruh Indonesia',
    provinceOrCountry: 'PVMBG Badan Geologi ESDM',
    scope: 'indonesia',
    regionGroup: 'Jalan Tol, Nasional & Gunung',
    lat: -7.5407,
    lon: 110.4457,
    streamType: 'portal',
    streamUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    portalUrl: 'https://magma.esdm.go.id/v1/gunung-api/cctv',
    operator: 'PVMBG Kementerian ESDM RI',
    badge: 'CCTV Vulkanologi · ESDM',
  },

  // =========================================================================
  // WORLD — TIMUR TENGAH (MAKKAH & MADINAH 24/7 VERIFIED HLS + YOUTUBE HD)
  // =========================================================================
  {
    id: 'wld-makkah-haram',
    name: 'Masjidil Haram & Ka’bah Live 24/7 (Saudi Quran TV HD)',
    city: 'Makkah Al-Mukarramah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 21.4225,
    lon: 39.8262,
    streamType: 'hls',
    streamUrl:
      'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
    fallbackEmbedUrl:
      'https://www.youtube-nocookie.com/embed/do7cUEcekS0?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'SBA Direct HLS HD',
        streamType: 'hls',
        streamUrl:
          'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
        fallbackEmbedUrl:
          'https://www.youtube-nocookie.com/embed/do7cUEcekS0?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'YouTube Live 24/7 HD',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/do7cUEcekS0?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=do7cUEcekS0',
    operator: 'Saudi Broadcasting Authority (SBA)',
    badge: '24/7 HD Live · Makkah',
  },
  {
    id: 'wld-madinah-nabawi',
    name: 'Masjid Nabawi Al-Munawwarah Live 24/7 (Saudi Sunnah TV HD)',
    city: 'Al-Madinah Al-Munawwarah',
    provinceOrCountry: 'Arab Saudi',
    scope: 'world',
    regionGroup: 'Timur Tengah (Makkah & Madinah)',
    lat: 24.4672,
    lon: 39.6111,
    streamType: 'hls',
    streamUrl:
      'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8',
    fallbackEmbedUrl:
      'https://www.youtube-nocookie.com/embed/yGvfRcxJtD4?autoplay=1&mute=1&playsinline=1&rel=0',
    angles: [
      {
        label: 'SBA Direct HLS HD',
        streamType: 'hls',
        streamUrl:
          'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8',
        fallbackEmbedUrl:
          'https://www.youtube-nocookie.com/embed/yGvfRcxJtD4?autoplay=1&mute=1&playsinline=1&rel=0',
      },
      {
        label: 'YouTube Live 24/7 HD',
        streamType: 'youtube',
        streamUrl:
          'https://www.youtube-nocookie.com/embed/yGvfRcxJtD4?autoplay=1&mute=1&playsinline=1&rel=0',
      },
    ],
    portalUrl: 'https://www.youtube.com/watch?v=yGvfRcxJtD4',
    operator: 'Saudi Broadcasting Authority (SBA)',
    badge: '24/7 HD Live · Madinah',
  },

  // =========================================================================
  // WORLD — ASIA TENGGARA & TIMUR (TOKYO SHIBUYA FNN + SINGAPURA LTA)
  // =========================================================================
  {
    id: 'wld-tokyo-shibuya',
    name: 'Shibuya Scramble Crossing Live Cam 24/7 (FNN Prime Online)',
    city: 'Shibuya, Tokyo',
    provinceOrCountry: 'Jepang',
    scope: 'world',
    regionGroup: 'Asia Tenggara & Timur',
    lat: 35.6595,
    lon: 139.7004,
    streamType: 'youtube',
    streamUrl:
      'https://www.youtube-nocookie.com/embed/dfVK7ld38Ys?autoplay=1&mute=1&playsinline=1&rel=0',
    portalUrl: 'https://www.youtube.com/watch?v=dfVK7ld38Ys',
    operator: 'Fuji News Network (FNN Japan)',
    badge: '24/7 Live HD · Tokyo',
  },

  // =========================================================================
  // WORLD — AMERIKA UTARA (NYC DOT MANHATTAN + LOS ANGELES CALTRANS)
  // =========================================================================
  {
    id: 'wld-nyc-5th-ave-34st',
    name: 'Midtown Manhattan — 5th Ave @ 34th St (Empire State View)',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7484,
    lon: -73.9846,
    streamType: 'snapshot',
    streamUrl:
      'https://webcams.nyctmc.org/api/cameras/03a8a2da-3ac2-45aa-a5ba-4ff7d25bd22d/image',
    portalUrl: 'https://webcams.nyctmc.org/map',
    operator: 'NYC Department of Transportation (TMC)',
    badge: 'Live Refresh 3s · NYC',
  },
  {
    id: 'wld-nyc-14st-irving',
    name: 'Downtown Manhattan — E 14th St @ Irving Pl (Union Square)',
    city: 'New York City',
    provinceOrCountry: 'Amerika Serikat',
    scope: 'world',
    regionGroup: 'Amerika Utara',
    lat: 40.7341,
    lon: -73.9882,
    streamType: 'snapshot',
    streamUrl:
      'https://webcams.nyctmc.org/api/cameras/f9cb9d4c-10ad-42e4-8997-dbc9e12bd55a/image',
    portalUrl: 'https://webcams.nyctmc.org/map',
    operator: 'NYC Department of Transportation (TMC)',
    badge: 'Live Refresh 3s · NYC',
  },

  // =========================================================================
  // WORLD — EROPA & ANTARIKSA (FINTRAFFIC HELSINKI + NASA PUBLIC BROADCAST)
  // =========================================================================
  {
    id: 'wld-eu-helsinki-ring1',
    name: 'Helsinki Kehä I Highway Cam (Fintraffic Open Data EU)',
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
    name: 'NASA TV Public Broadcast — Misi Antariksa & Orbit Bumi (NTV-1)',
    city: 'Orbit Rendah Bumi (408 km)',
    provinceOrCountry: 'Luar Angkasa Internasional',
    scope: 'world',
    regionGroup: 'Eropa & Antariksa',
    lat: 0.0,
    lon: 113.9213,
    streamType: 'hls',
    streamUrl:
      'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    portalUrl: 'https://plus.nasa.gov/scheduled-video/nasa-live/',
    operator: 'NASA Public Broadcast (Akamai HLS)',
    badge: 'HLS HD · Antariksa',
  },
];

// Session cache so dynamic API catalogs load once and stay instant
let cachedDynamicIndonesia: CctvCameraItem[] | null = null;
let cachedDynamicWorld: CctvCameraItem[] | null = null;
let dynamicIndonesiaTimestamp = 0;
let dynamicWorldTimestamp = 0;
const DYNAMIC_CACHE_TTL_MS = 5 * 60 * 1000;

const SINGAPORE_CAMERA_LANDMARKS: Record<string, string> = {
  '2701': 'Woodlands Causeway (Perbatasan Singapura–Johor)',
  '2702': 'Woodlands Checkpoint',
  '4703': 'Tuas Second Link Checkpoint',
  '4713': 'Tuas Checkpoint Viaduct',
  '1701': 'Marina Coastal Expressway (MCE)',
  '1705': 'Central Expressway (CTE) — Moulmein',
  '1001': 'East Coast Parkway (ECP) — Benjamin Sheares Bridge',
  '1501': 'Ayer Rajah Expressway (AYE) — Keppel',
};

export async function fetchDynamicIndonesiaCctv(
  signal?: AbortSignal
): Promise<CctvCameraItem[]> {
  if (
    cachedDynamicIndonesia &&
    Date.now() - dynamicIndonesiaTimestamp < DYNAMIC_CACHE_TTL_MS
  ) {
    return cachedDynamicIndonesia;
  }

  const discovered: CctvCameraItem[] = [];

  const [bandungScraperJson, denpasarJson, baliProvJson] = await Promise.all([
    fetchJsonSafe(
      'https://raw.githubusercontent.com/hozin-king/cctv-id-scraper/main/cctv.json',
      { timeoutMs: 5500, signal }
    ),
    fetchJsonSafe(
      'https://raw.githubusercontent.com/hendraptaksu/cctv-denpasar/main/cctvs.json',
      { timeoutMs: 5500, signal }
    ),
    fetchJsonSafe(
      'https://raw.githubusercontent.com/hendraptaksu/cctv-denpasar/main/cctv-bali.json',
      { timeoutMs: 5500, signal }
    ),
  ]);

  // 1. Kota Bandung PELINDUNG Live Sync (Auto-updated every 6h)
  if (
    bandungScraperJson &&
    !Array.isArray(bandungScraperJson) &&
    Array.isArray(bandungScraperJson.wilayah)
  ) {
    for (const wil of bandungScraperJson.wilayah as Array<Record<string, unknown>>) {
      const cams = Array.isArray(wil.kamera)
        ? (wil.kamera as Array<Record<string, unknown>>)
        : [];
      for (const cam of cams.slice(0, 48)) {
        const rawTitle = String(cam.nama || '').replace(/\s+/g, ' ').trim();
        const fixedStream = normalizePelindungStreamUrl(String(cam.stream || ''));
        const lat = Number(cam.lat || -6.9175);
        const lon = Number(cam.lon || 107.6191);
        if (!rawTitle || !/^https:\/\/.+\.m3u8$/i.test(fixedStream)) continue;

        discovered.push({
          id: `bdg-live-${discovered.length}`,
          name: rawTitle.replace(/^CCTV\s+/i, 'Bandung — '),
          city: String(cam.lokasi || wil.nama || 'Kota Bandung'),
          provinceOrCountry: 'Jawa Barat',
          scope: 'indonesia',
          regionGroup: 'Jawa Barat',
          lat: Number.isFinite(lat) ? lat : -6.9175,
          lon: Number.isFinite(lon) ? lon : 107.6191,
          streamType: 'hls',
          proxyHlsFirst: true,
          streamUrl: fixedStream,
          portalUrl: 'https://pelindung.bandung.go.id/',
          operator: 'Diskominfo Kota Bandung (PELINDUNG)',
          badge: 'HLS Live · Bandung',
        });
      }
    }
  }

  // 2. ATCS Dishub Kota Denpasar Live HLS + Official Stream Page Fallback
  if (Array.isArray(denpasarJson)) {
    for (const row of (denpasarJson as Array<Record<string, unknown>>).slice(0, 32)) {
      const alias = String(row.nama_alias || row.nama || '').trim();
      const ket = String(row.ket_lokasi || '').trim();
      const hls = String(row.hls || '').trim();
      const streamPage = String(row.stream_page || '').trim();
      const lat = Number(row.lat || -8.6705);
      const lon = Number(row.lon || 115.2126);
      if (!alias || !/^https:\/\/.+\.m3u8$/i.test(hls)) continue;

      discovered.push({
        id: `dps-atcs-${row.id_lokasi || discovered.length}`,
        name: ket ? `${alias} (${ket})` : alias,
        city: 'Kota Denpasar',
        provinceOrCountry: 'Bali',
        scope: 'indonesia',
        regionGroup: 'Bali & Nusra',
        lat: Number.isFinite(lat) ? lat : -8.6705,
        lon: Number.isFinite(lon) ? lon : 115.2126,
        streamType: 'hls',
        proxyHlsFirst: true,
        streamUrl: hls,
        fallbackEmbedUrl: /^https:\/\//i.test(streamPage) ? streamPage : undefined,
        portalUrl: 'https://atcs.denpasarkota.go.id/',
        operator: 'Dishub Kota Denpasar (ATCS)',
        badge: 'HLS Live · Denpasar',
      });
    }
  }

  // 3. Pemprov Bali (Bali Satu Data) Live HLS + Transcode Player Fallback
  if (Array.isArray(baliProvJson)) {
    for (const row of (baliProvJson as Array<Record<string, unknown>>).slice(0, 32)) {
      const title = String(row.nama_lokasi || row.nama || '').trim();
      const hls = String(row.hls || '').trim();
      const streamPage = String(row.stream_page || '').trim();
      const lat = Number(row.lat || -8.65);
      const lon = Number(row.lon || 115.22);
      if (!title || !/^https:\/\/.+\.m3u8$/i.test(hls)) continue;

      discovered.push({
        id: `bali-prov-${row.id_lokasi || discovered.length}`,
        name: `Bali — ${title}`,
        city: 'Provinsi Bali',
        provinceOrCountry: 'Bali',
        scope: 'indonesia',
        regionGroup: 'Bali & Nusra',
        lat: Number.isFinite(lat) ? lat : -8.65,
        lon: Number.isFinite(lon) ? lon : 115.22,
        streamType: 'hls',
        streamUrl: hls,
        fallbackEmbedUrl: /^https:\/\//i.test(streamPage) ? streamPage : undefined,
        portalUrl: 'https://balisatudata.baliprov.go.id/peta-cctv',
        operator: 'Pemprov Bali (Bali Satu Data)',
        badge: 'HLS Live · Bali',
      });
    }
  }

  if (discovered.length > 0) {
    cachedDynamicIndonesia = discovered;
    dynamicIndonesiaTimestamp = Date.now();
  }
  return discovered;
}

export async function fetchDynamicWorldCctv(
  signal?: AbortSignal
): Promise<CctvCameraItem[]> {
  if (
    cachedDynamicWorld &&
    Date.now() - dynamicWorldTimestamp < DYNAMIC_CACHE_TTL_MS
  ) {
    return cachedDynamicWorld;
  }

  const discovered: CctvCameraItem[] = [];

  const [sgJson, calJson, nycJson] = await Promise.all([
    fetchJsonSafe('https://api.data.gov.sg/v1/transport/traffic-images', {
      timeoutMs: 6000,
      signal,
    }),
    fetchJsonSafe('https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json', {
      timeoutMs: 6500,
      signal,
      proxyFirst: true,
    }),
    fetchJsonSafe('https://webcams.nyctmc.org/api/cameras/', {
      timeoutMs: 6500,
      signal,
      proxyFirst: true,
    }),
  ]);

  // 1. Singapore LTA Real-Time Traffic Cameras (90 Live HD Snapshots)
  if (sgJson && !Array.isArray(sgJson) && Array.isArray(sgJson.items)) {
    const firstItem = (sgJson.items as Array<Record<string, unknown>>)[0];
    const cams = Array.isArray(firstItem?.cameras)
      ? (firstItem.cameras as Array<Record<string, unknown>>)
      : [];
    // Prioritize famous checkpoints (Woodlands Causeway, Tuas, MCE) first
    const sortedSg = [...cams].sort((a, b) => {
      const aFamous = SINGAPORE_CAMERA_LANDMARKS[String(a.camera_id || '')] ? 0 : 1;
      const bFamous = SINGAPORE_CAMERA_LANDMARKS[String(b.camera_id || '')] ? 0 : 1;
      return aFamous - bFamous;
    });
    for (const cam of sortedSg.slice(0, 28)) {
      const camId = String(cam.camera_id || '');
      const imgUrl = String(cam.image || '');
      const loc = (cam.location as Record<string, unknown> | undefined) || {};
      const lat = Number(loc.latitude || 1.3521);
      const lon = Number(loc.longitude || 103.8198);
      if (!camId || !/^https:\/\//i.test(imgUrl)) continue;
      const landmark = SINGAPORE_CAMERA_LANDMARKS[camId];

      discovered.push({
        id: `sg-lta-${camId}`,
        name: landmark
          ? `Singapura — ${landmark} (#${camId})`
          : `Singapura Expressway Live Cam #${camId}`,
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
        badge: 'Real-Time HD · SG',
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
    dynamicWorldTimestamp = Date.now();
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
  const seenStreams = new Set<string>();
  const merged: CctvCameraItem[] = [];
  for (const cam of [...CURATED_CCTV_CAMERAS, ...dynId, ...dynWorld]) {
    if (seenIds.has(cam.id) || seenStreams.has(cam.streamUrl)) continue;
    seenIds.add(cam.id);
    seenStreams.add(cam.streamUrl);
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
  const q = rawQuery.trim().toLowerCase();
  const allCams = await getAllAvailableCctvCameras(signal);

  let matched: CctvCameraItem[] = [];

  if (!q || q === 'all' || q === 'semua') {
    matched = [
      ...allCams
        .filter((c) => c.scope === 'indonesia' && c.streamType !== 'portal')
        .slice(0, 4),
      ...allCams
        .filter((c) => c.scope === 'world' && c.streamType !== 'portal')
        .slice(0, 4),
    ];
  } else if (q === 'indonesia' || q === 'id' || q === 'indo' || q === 'nasional') {
    matched = allCams
      .filter((c) => c.scope === 'indonesia' && c.streamType !== 'portal')
      .slice(0, 8);
  } else if (q === 'dunia' || q === 'world' || q === 'global' || q === 'internasional') {
    matched = allCams
      .filter((c) => c.scope === 'world' && c.streamType !== 'portal')
      .slice(0, 8);
  } else {
    const aliases: Record<string, string[]> = {
      jogja: ['yogyakarta', 'sleman', 'magelang', 'diy'],
      yogyakarta: ['sleman', 'magelang', 'diy'],
      jakarta: ['bundaran hi', 'thamrin', 'gatot subroto', 'senayan', 'slipi', 'blok m', 'dki'],
      dki: ['jakarta', 'bundaran hi', 'thamrin', 'gatot subroto', 'blok m'],
      bandung: ['pasteur', 'braga', 'cileunyi', 'nagreg', 'pelindung'],
      puncak: ['cisarua', 'gadog', 'gunung mas', 'bogor'],
      bali: ['denpasar', 'sanur', 'padang galak', 'gunung agung'],
      sg: ['singapura', 'singapore', 'woodlands', 'tuas'],
      singapore: ['singapura', 'woodlands', 'tuas'],
      usa: ['amerika', 'new york', 'manhattan', 'los angeles', 'california'],
      nyc: ['new york', 'manhattan'],
      la: ['los angeles', 'california'],
      mekah: ['makkah', 'haram', 'ka’bah', 'arab'],
      mekkah: ['makkah', 'haram', 'ka’bah', 'arab'],
      madinah: ['nabawi', 'sunnah', 'arab'],
      jepang: ['tokyo', 'shibuya'],
      tol: ['jagorawi', 'jasa marga', 'bina marga', 'jalan tol'],
      gunung: ['merapi', 'semeru', 'magma', 'pvmbg'],
    };

    const expandedTerms = [q, ...(aliases[q] || [])];
    matched = allCams.filter((cam) => {
      const hay =
        `${cam.name} ${cam.city} ${cam.provinceOrCountry} ${cam.regionGroup} ${cam.operator}`.toLowerCase();
      return expandedTerms.some((term) => hay.includes(term));
    });
  }

  // Prioritize direct real-time video/snapshot streams over external portal links
  const rankStream = (t: CctvCameraItem['streamType']) =>
    t === 'hls' ? 0 : t === 'youtube' || t === 'iframe' ? 1 : t === 'snapshot' ? 2 : 3;

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
    `### 📡 Pantauan Real-Time Live CCTV Publik ${
      q ? `— "${rawQuery.trim()}"` : '(Indonesia & Dunia)'
    }`,
    matched.length > 0
      ? `Menampilkan **${selected.length} kamera publik resmi real-time** dari total **${allCams.length} titik pantau terindeks** (dilengkapi mesin **Anti-Muter Fail-Fast** & pilihan sudut kamera langsung di pemutar bawah, atau klik **Buka Ruang Pantau Multi-CCTV** untuk mode monitor 2×2):`
      : `Kata kunci spesifik **"${rawQuery.trim()}"** belum memiliki stream langsung terindeks — menampilkan **${selected.length} kamera live unggulan Indonesia & Dunia** beserta akses ke Ruang Pantau Penuh:`,
    '',
    `| # | Titik Kamera | Wilayah / Negara | Format & Instansi Sumber |`,
    `| :-: | :--- | :--- | :--- |`,
    ...summaryRows,
    '',
    `> 💡 **Tips GEOINT**: Seluruh kamera bersumber dari portal resmi pemerintah/ATCS/DOT publik (legal & aman). Jika jaringan lokal memblokir koneksi HLS langsung, pemutar otomatis beralih dalam **< 4 detik** ke jalur relay atau embed cadangan tanpa *spinning* tanpa henti.`,
  ].join('\n');

  return {
    content,
    cctvCameras: selected,
    actionLinks,
  };
}
