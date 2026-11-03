import { HLR_CITY_TABLE, HLR_PREFIX_INDEX } from './hlrCityDatabase';

export interface HlrLookupMatch {
  city: string;
  province: string;
  region: string;
  mapQuery: string;
  coordinates?: { lat: number; lon: number };
  matchedPrefix: string;
  accuracyTier: 'high' | 'national';
  precisionLevel: 'city_6_8_digit' | 'city_5_digit' | 'national_pool';
  precisionLabel: string;
  basisNote: string;
}

interface CityGeoInfo {
  city: string;
  province: string;
  lat: number;
  lon: number;
}

const CITY_GEO_REGISTRY = {
  // DKI Jakarta, Banten & Bodetabek
  jakarta: { city: 'DKI Jakarta', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456 },
  bogor: { city: 'Kota Bogor', province: 'Jawa Barat', lat: -6.5971, lon: 106.806 },
  depok: { city: 'Kota Depok', province: 'Jawa Barat', lat: -6.4025, lon: 106.7942 },
  tangerang: { city: 'Kota Tangerang', province: 'Banten', lat: -6.1783, lon: 106.6319 },
  bekasi: { city: 'Kota Bekasi', province: 'Jawa Barat', lat: -6.2383, lon: 106.9756 },
  serang: { city: 'Kota Serang', province: 'Banten', lat: -6.1104, lon: 106.164 },
  cilegon: { city: 'Kota Cilegon', province: 'Banten', lat: -6.0025, lon: 106.0111 },
  rangkasbitung: { city: 'Rangkasbitung', province: 'Banten', lat: -6.3596, lon: 106.2498 },
  pandeglang: { city: 'Pandeglang', province: 'Banten', lat: -6.3086, lon: 106.1067 },

  // Jawa Barat
  bandung: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191 },
  cirebon: { city: 'Kota Cirebon', province: 'Jawa Barat', lat: -6.732, lon: 108.5523 },
  tasikmalaya: { city: 'Kota Tasikmalaya', province: 'Jawa Barat', lat: -7.3274, lon: 108.2207 },
  sukabumi: { city: 'Kota Sukabumi', province: 'Jawa Barat', lat: -6.9277, lon: 106.93 },
  cianjur: { city: 'Cianjur', province: 'Jawa Barat', lat: -6.8168, lon: 107.1425 },
  karawang: { city: 'Karawang', province: 'Jawa Barat', lat: -6.3227, lon: 107.3376 },
  purwakarta: { city: 'Purwakarta', province: 'Jawa Barat', lat: -6.5569, lon: 107.4433 },
  subang: { city: 'Subang', province: 'Jawa Barat', lat: -6.5715, lon: 107.7587 },
  sumedang: { city: 'Sumedang', province: 'Jawa Barat', lat: -6.8586, lon: 107.9204 },
  garut: { city: 'Garut', province: 'Jawa Barat', lat: -7.2279, lon: 107.9087 },
  ciamis: { city: 'Ciamis', province: 'Jawa Barat', lat: -7.3257, lon: 108.3534 },
  banjar: { city: 'Kota Banjar', province: 'Jawa Barat', lat: -7.3706, lon: 108.5342 },
  pangandaran: { city: 'Pangandaran', province: 'Jawa Barat', lat: -7.6841, lon: 108.6503 },
  kuningan: { city: 'Kuningan', province: 'Jawa Barat', lat: -6.9758, lon: 108.4831 },
  indramayu: { city: 'Indramayu', province: 'Jawa Barat', lat: -6.3276, lon: 108.3249 },

  // Jawa Tengah & DI Yogyakarta
  semarang: { city: 'Kota Semarang', province: 'Jawa Tengah', lat: -6.9667, lon: 110.4167 },
  solo: { city: 'Kota Surakarta (Solo)', province: 'Jawa Tengah', lat: -7.5755, lon: 110.8243 },
  yogyakarta: { city: 'Kota Yogyakarta', province: 'DI Yogyakarta', lat: -7.7956, lon: 110.3695 },
  purwokerto: { city: 'Purwokerto', province: 'Jawa Tengah', lat: -7.4244, lon: 109.2302 },
  cilacap: { city: 'Cilacap', province: 'Jawa Tengah', lat: -7.7279, lon: 109.0079 },
  pekalongan: { city: 'Kota Pekalongan', province: 'Jawa Tengah', lat: -6.8887, lon: 109.6753 },
  tegal: { city: 'Kota Tegal', province: 'Jawa Tengah', lat: -6.8694, lon: 109.1402 },
  magelang: { city: 'Kota Magelang', province: 'Jawa Tengah', lat: -7.4797, lon: 110.2177 },
  salatiga: { city: 'Kota Salatiga', province: 'Jawa Tengah', lat: -7.3305, lon: 110.5084 },
  klaten: { city: 'Klaten', province: 'Jawa Tengah', lat: -7.7058, lon: 110.6064 },
  boyolali: { city: 'Boyolali', province: 'Jawa Tengah', lat: -7.5323, lon: 110.5955 },
  kudus: { city: 'Kudus', province: 'Jawa Tengah', lat: -6.8048, lon: 110.8405 },
  pati: { city: 'Pati', province: 'Jawa Tengah', lat: -6.7559, lon: 111.038 },
  blora: { city: 'Blora', province: 'Jawa Tengah', lat: -6.9698, lon: 111.4186 },
  purwodadi: { city: 'Purwodadi', province: 'Jawa Tengah', lat: -7.0868, lon: 110.916 },
  kendal: { city: 'Kendal', province: 'Jawa Tengah', lat: -6.924, lon: 110.2038 },
  wonosobo: { city: 'Wonosobo', province: 'Jawa Tengah', lat: -7.3632, lon: 109.9001 },
  kebumen: { city: 'Kebumen', province: 'Jawa Tengah', lat: -7.6685, lon: 109.6512 },

  // Jawa Timur
  surabaya: { city: 'Kota Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521 },
  malang: { city: 'Kota Malang', province: 'Jawa Timur', lat: -7.9666, lon: 112.6326 },
  madiun: { city: 'Kota Madiun', province: 'Jawa Timur', lat: -7.6298, lon: 111.5239 },
  jember: { city: 'Jember', province: 'Jawa Timur', lat: -8.1724, lon: 113.7007 },
  kediri: { city: 'Kota Kediri', province: 'Jawa Timur', lat: -7.848, lon: 112.0178 },
  mojokerto: { city: 'Kota Mojokerto', province: 'Jawa Timur', lat: -7.4705, lon: 112.4401 },
  jombang: { city: 'Jombang', province: 'Jawa Timur', lat: -7.546, lon: 112.2331 },
  lamongan: { city: 'Lamongan', province: 'Jawa Timur', lat: -7.1193, lon: 112.4165 },
  tuban: { city: 'Tuban', province: 'Jawa Timur', lat: -6.8976, lon: 112.0649 },
  bojonegoro: { city: 'Bojonegoro', province: 'Jawa Timur', lat: -7.1502, lon: 111.8817 },
  ponorogo: { city: 'Ponorogo', province: 'Jawa Timur', lat: -7.8667, lon: 111.4667 },
  nganjuk: { city: 'Nganjuk', province: 'Jawa Timur', lat: -7.6042, lon: 111.9035 },
  pacitan: { city: 'Pacitan', province: 'Jawa Timur', lat: -8.1945, lon: 111.1052 },
  tulungagung: { city: 'Tulungagung', province: 'Jawa Timur', lat: -8.0657, lon: 111.9026 },
  blitar: { city: 'Kota Blitar', province: 'Jawa Timur', lat: -8.0955, lon: 112.1609 },
  pasuruan: { city: 'Kota Pasuruan', province: 'Jawa Timur', lat: -7.6469, lon: 112.9075 },
  probolinggo: { city: 'Kota Probolinggo', province: 'Jawa Timur', lat: -7.7543, lon: 113.2159 },
  lumajang: { city: 'Lumajang', province: 'Jawa Timur', lat: -8.1335, lon: 113.2248 },
  bondowoso: { city: 'Bondowoso', province: 'Jawa Timur', lat: -7.9135, lon: 113.8214 },
  banyuwangi: { city: 'Banyuwangi', province: 'Jawa Timur', lat: -8.2192, lon: 114.3691 },

  // Bali, NTB & NTT
  denpasar: { city: 'Kota Denpasar', province: 'Bali', lat: -8.6705, lon: 115.2126 },
  singaraja: { city: 'Singaraja', province: 'Bali', lat: -8.112, lon: 115.0882 },
  mataram: { city: 'Kota Mataram', province: 'Nusa Tenggara Barat', lat: -8.5833, lon: 116.1167 },
  sumbawa: { city: 'Sumbawa Besar', province: 'Nusa Tenggara Barat', lat: -8.4932, lon: 117.4202 },
  kupang: { city: 'Kota Kupang', province: 'Nusa Tenggara Timur', lat: -10.1772, lon: 123.607 },

  // Sumatera
  bandaaceh: { city: 'Kota Banda Aceh', province: 'Aceh', lat: 5.5483, lon: 95.3238 },
  lhokseumawe: { city: 'Kota Lhokseumawe', province: 'Aceh', lat: 5.1801, lon: 97.1507 },
  medan: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722 },
  pematangsiantar: { city: 'Kota Pematangsiantar', province: 'Sumatera Utara', lat: 2.9595, lon: 99.0682 },
  tebingtinggi: { city: 'Kota Tebing Tinggi', province: 'Sumatera Utara', lat: 3.3285, lon: 99.1625 },
  tanjungbalai: { city: 'Kota Tanjungbalai', province: 'Sumatera Utara', lat: 2.9668, lon: 99.7989 },
  rantauprapat: { city: 'Rantauprapat', province: 'Sumatera Utara', lat: 2.1011, lon: 99.8266 },
  padangsidempuan: { city: 'Kota Padangsidimpuan', province: 'Sumatera Utara', lat: 1.3788, lon: 99.2717 },
  sibolga: { city: 'Kota Sibolga', province: 'Sumatera Utara', lat: 1.7427, lon: 98.7792 },
  berastagi: { city: 'Berastagi', province: 'Sumatera Utara', lat: 3.1853, lon: 98.5049 },
  pangkalanbrandan: { city: 'Pangkalan Brandan', province: 'Sumatera Utara', lat: 4.0197, lon: 98.2827 },
  kisaran: { city: 'Kisaran', province: 'Sumatera Utara', lat: 2.9845, lon: 99.6158 },
  padang: { city: 'Kota Padang', province: 'Sumatera Barat', lat: -0.9471, lon: 100.4172 },
  bukittinggi: { city: 'Kota Bukittinggi', province: 'Sumatera Barat', lat: -0.3056, lon: 100.3692 },
  pekanbaru: { city: 'Kota Pekanbaru', province: 'Riau', lat: 0.5071, lon: 101.4478 },
  dumai: { city: 'Kota Dumai', province: 'Riau', lat: 1.6675, lon: 101.4475 },
  tembilahan: { city: 'Tembilahan', province: 'Riau', lat: -0.3198, lon: 103.1537 },
  batam: { city: 'Kota Batam', province: 'Kepulauan Riau', lat: 1.0456, lon: 104.0305 },
  tanjungpinang: { city: 'Kota Tanjungpinang', province: 'Kepulauan Riau', lat: 0.9186, lon: 104.4467 },
  karimun: { city: 'Tanjung Balai Karimun', province: 'Kepulauan Riau', lat: 0.9927, lon: 103.4351 },
  jambi: { city: 'Kota Jambi', province: 'Jambi', lat: -1.6101, lon: 103.6131 },
  palembang: { city: 'Kota Palembang', province: 'Sumatera Selatan', lat: -2.9761, lon: 104.7754 },
  prabumulih: { city: 'Kota Prabumulih', province: 'Sumatera Selatan', lat: -3.4328, lon: 104.2356 },
  lubuklinggau: { city: 'Kota Lubuklinggau', province: 'Sumatera Selatan', lat: -3.2967, lon: 102.8614 },
  baturaja: { city: 'Baturaja', province: 'Sumatera Selatan', lat: -4.1292, lon: 104.1686 },
  muaraenim: { city: 'Muara Enim', province: 'Sumatera Selatan', lat: -3.6531, lon: 103.7745 },
  lahat: { city: 'Lahat', province: 'Sumatera Selatan', lat: -3.7979, lon: 103.5416 },
  martapura: { city: 'Martapura (OKU Timur)', province: 'Sumatera Selatan', lat: -4.3193, lon: 104.3519 },
  pangkalpinang: { city: 'Kota Pangkalpinang', province: 'Kepulauan Bangka Belitung', lat: -2.1316, lon: 106.1169 },
  belitung: { city: 'Tanjungpandan (Belitung)', province: 'Kepulauan Bangka Belitung', lat: -2.7418, lon: 107.6347 },
  bengkulu: { city: 'Kota Bengkulu', province: 'Bengkulu', lat: -3.7928, lon: 102.2608 },
  bandarlampung: { city: 'Kota Bandar Lampung', province: 'Lampung', lat: -5.4292, lon: 105.261 },
  metro: { city: 'Kota Metro', province: 'Lampung', lat: -5.1131, lon: 105.3067 },
  kotabumi: { city: 'Kotabumi', province: 'Lampung', lat: -4.8225, lon: 104.8819 },

  // Kalimantan
  pontianak: { city: 'Kota Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lon: 109.3425 },
  singkawang: { city: 'Kota Singkawang', province: 'Kalimantan Barat', lat: 0.9063, lon: 108.9872 },
  ketapang: { city: 'Ketapang', province: 'Kalimantan Barat', lat: -1.855, lon: 109.9719 },
  sambas: { city: 'Sambas', province: 'Kalimantan Barat', lat: 1.3625, lon: 109.2994 },
  palangkaraya: { city: 'Kota Palangka Raya', province: 'Kalimantan Tengah', lat: -2.2136, lon: 113.9108 },
  sampit: { city: 'Sampit', province: 'Kalimantan Tengah', lat: -2.5315, lon: 112.9596 },
  pangkalanbun: { city: 'Pangkalan Bun', province: 'Kalimantan Tengah', lat: -2.6819, lon: 111.6258 },
  muarateweh: { city: 'Muara Teweh', province: 'Kalimantan Tengah', lat: -0.9536, lon: 114.8975 },
  kualakapuas: { city: 'Kuala Kapuas', province: 'Kalimantan Tengah', lat: -3.0091, lon: 114.3879 },
  banjarmasin: { city: 'Kota Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3194, lon: 114.5908 },
  kotabaru: { city: 'Kotabaru', province: 'Kalimantan Selatan', lat: -3.2379, lon: 116.2266 },
  tabalong: { city: 'Tanjung (Tabalong)', province: 'Kalimantan Selatan', lat: -2.1695, lon: 115.3831 },
  kandangan: { city: 'Kandangan', province: 'Kalimantan Selatan', lat: -2.7725, lon: 115.2661 },
  amuntai: { city: 'Amuntai', province: 'Kalimantan Selatan', lat: -2.4177, lon: 115.2494 },
  pelaihari: { city: 'Pelaihari', province: 'Kalimantan Selatan', lat: -3.7995, lon: 114.7644 },
  balikpapan: { city: 'Kota Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lon: 116.8529 },
  samarinda: { city: 'Kota Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lon: 117.1536 },
  bontang: { city: 'Kota Bontang', province: 'Kalimantan Timur', lat: 0.1333, lon: 117.5 },
  tarakan: { city: 'Kota Tarakan', province: 'Kalimantan Utara', lat: 3.3, lon: 117.6333 },

  // Sulawesi
  makassar: { city: 'Kota Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lon: 119.4327 },
  parepare: { city: 'Kota Parepare', province: 'Sulawesi Selatan', lat: -4.0135, lon: 119.6255 },
  rantepao: { city: 'Rantepao (Toraja)', province: 'Sulawesi Selatan', lat: -2.9701, lon: 119.8978 },
  sorowako: { city: 'Sorowako', province: 'Sulawesi Selatan', lat: -2.5276, lon: 121.3578 },
  manado: { city: 'Kota Manado', province: 'Sulawesi Utara', lat: 1.4748, lon: 124.8421 },
  bitung: { city: 'Kota Bitung', province: 'Sulawesi Utara', lat: 1.4404, lon: 125.1217 },
  gorontalo: { city: 'Kota Gorontalo', province: 'Gorontalo', lat: 0.5435, lon: 123.0568 },
  palu: { city: 'Kota Palu', province: 'Sulawesi Tengah', lat: -0.8917, lon: 119.8707 },
  donggala: { city: 'Donggala', province: 'Sulawesi Tengah', lat: -0.6738, lon: 119.7408 },
  kendari: { city: 'Kota Kendari', province: 'Sulawesi Tenggara', lat: -3.9985, lon: 122.513 },
  kolaka: { city: 'Kolaka', province: 'Sulawesi Tenggara', lat: -4.05, lon: 121.6 },

  // Maluku & Tanah Papua
  ambon: { city: 'Kota Ambon', province: 'Maluku', lat: -3.6954, lon: 128.1814 },
  ternate: { city: 'Kota Ternate', province: 'Maluku Utara', lat: 0.7893, lon: 127.3774 },
  jayapura: { city: 'Kota Jayapura', province: 'Papua', lat: -2.5337, lon: 140.7181 },
  biak: { city: 'Biak', province: 'Papua', lat: -1.1767, lon: 136.082 },
  sorong: { city: 'Kota Sorong', province: 'Papua Barat Daya', lat: -0.8762, lon: 131.2558 },
  manokwari: { city: 'Manokwari', province: 'Papua Barat', lat: -0.8615, lon: 134.062 },
  timika: { city: 'Timika', province: 'Papua Tengah', lat: -4.5467, lon: 136.8872 },
  merauke: { city: 'Merauke', province: 'Papua Selatan', lat: -8.4932, lon: 140.4018 },
} as const satisfies Record<string, CityGeoInfo>;

type CityId = keyof typeof CITY_GEO_REGISTRY;

interface SingleCityHlrRule {
  cityId: CityId;
  prefixes: string[];
}

function expandRange(base: string, start: number, end: number, pad = 2): string[] {
  const out: string[] = [];
  for (let i = start; i <= end; i++) {
    out.push(`${base}${String(i).padStart(pad, '0')}`);
  }
  return out;
}

// ============================================================================
// VERIFIED 6–8 DIGIT SINGLE-CITY INDONESIAN HLR PREFIX RULES
// Longest-prefix-first matching (8 -> 7 -> 6 -> 5 digits) ensures sub-blocks
// like 0812245 (Bandung) override 081224 (Cirebon), and 0812255 (Cilacap)
// or 0812258 (Solo) override 081225 (Semarang). Every rule maps to 1 CITY ONLY.
// ============================================================================
const SINGLE_CITY_HLR_RULES: SingleCityHlrRule[] = [
  // --- DKI JAKARTA & BODETABEK / BANTEN ---
  {
    cityId: 'jakarta',
    prefixes: [
      '08110', '081110', ...expandRange('0811', 13, 19), '08118', '08119',
      '08120', '081210', '081213', '081218', '081219', '08128', '08129',
      '08130', '081310', '081311', ...expandRange('0813', 14, 19), '081358', '08138', '081398', '081399',
      '08210', ...expandRange('0821', 10, 14), ...expandRange('0821', 22, 25),
      ...expandRange('0822', 10, 13), '082260', '082261', '082297', '082299',
      ...expandRange('0823', 10, 12),
      '08520', '085210', ...expandRange('0852', 14, 19), '08528',
      '085310', ...expandRange('0853', 14, 19),
      // Indosat Jakarta
      '08140', '081410', '081411',
      '08150', '08151', '0815482', '081574', '08158', '08159',
      '08160', '08161', ...expandRange('081648', 0, 5, 1), '08167', '08168', '08169',
      '08551', '08557', '08558', '08559',
      '085601', '08561', '08567', '08568', '08569',
      '08571', '085770', '085771', ...expandRange('0857', 73, 79), '08578', '08579',
      ...expandRange('0858', 10, 14), '0858463', '08588', '08589',
      // XL, Axis & Historic Smartfren/Tri Jakarta
      '081700', '081701', '08171', '081749', '081760', '08177', '08178', '081791', '081798', '081799',
      '081800', '081801', '081806', '081807', '081808', '08181', '081840', '081841', '081847', '081848', '081849', '081860', '081865', '081866', '08187', '08188', '08189',
      '08190', '08191', '081932',
      '085920', '085921', ...expandRange('0859', 45, 47), '085959', '085966',
      '087777', '08778', '087808', '087809', '087877', ...expandRange('0878', 83, 89),
      '08380', '08387', '08389',
      '08811', ...expandRange('0882', 10, 14), '08881', '08888', '08889',
      '08960', '08963', '08965',
    ],
  },
  {
    cityId: 'bogor',
    prefixes: [
      '081111', '081211', '0813117', '0813118', '0813119', '0821100', '082117', '0821250', '082250', '082251', '085211', '085311',
      '0815460', '0815461', '081563', '081663', '0816640', '0816641', '085691', '085711', '085716',
      '081710', '081790', '0818029', '081810', '0877700', '087870', '083811', '083819',
    ],
  },
  {
    cityId: 'depok',
    prefixes: ['0812800', '0812801', '0813800', '085692', '085717', '087872'],
  },
  {
    cityId: 'tangerang',
    prefixes: ['0812810', '0821840', '085693', '085718', '0878080', '087871', '083812', '083813'],
  },
  {
    cityId: 'bekasi',
    prefixes: ['0812820', '0821240', '085694', '085719', '087875', '087879'],
  },
  {
    cityId: 'serang',
    prefixes: [
      '081112', '081212', '081312', '085212', '085312',
      '081546', '081549', '081646', '081649',
      '081906', '0877710', '087774', '0878090', '0878710', '0838120',
    ],
  },
  {
    cityId: 'cilegon',
    prefixes: ['082254', '0822674', '0822675', '0822676', '0877720'],
  },
  {
    cityId: 'rangkasbitung',
    prefixes: ['082252'],
  },
  {
    cityId: 'pandeglang',
    prefixes: ['082253'],
  },

  // --- JAWA BARAT ---
  {
    cityId: 'karawang',
    prefixes: [
      ...expandRange('081112', 6, 9, 1), ...expandRange('081212', 6, 9, 1), '081313', '082267', '085213', '085313',
      '0815462', '0815492', '0816462',
    ],
  },
  {
    cityId: 'purwakarta',
    prefixes: [
      '082264', '0822677', '0822678', '0822679',
      '0815465', '0815493', '0816465', '0816493', '0856599', '0858464', '0858465',
    ],
  },
  {
    cityId: 'subang',
    prefixes: ['0822642'],
  },
  {
    cityId: 'sukabumi',
    prefixes: [
      '0821470', '0821570', '082266',
      '081463', '0815463', '0815495', ...expandRange('081563', 0, 7, 1), '0816463', '0816495', '0816630',
      '0856594', '0856595', ...expandRange('085723', 0, 3, 1), '0858630',
    ],
  },
  {
    cityId: 'cianjur',
    prefixes: [
      '0811207', '0812227', '082263',
      '0815494', '0816464', '0816494', '0855209',
    ],
  },
  {
    cityId: 'bandung',
    prefixes: [
      '081120', '081121', '081122', '081123', ...expandRange('081124', 5, 9, 1),
      '081214', '081220', '081221', ...expandRange('081222', 2, 6, 1), '081223', ...expandRange('081224', 5, 9, 1),
      '081320', '081321', '081322', '081392', '0813950', '0813951', '0813952', '081395',
      '082115', '082116', '082118', '082119', '082120', '082121', '082126', '082128', '082129', '082130',
      '08220', ...expandRange('0822', 14, 19), '082240',
      ...expandRange('0823', 15, 20),
      '085220', '085221', '085223', '085294',
      '085320', '085321', '085323',
      // Indosat Bandung
      '081460', '0815022', '081560', '081561', '081562', ...expandRange('0815', 70, 73),
      '0816022', '081642', '0816486', '0816487', '081660', '081661', '081662',
      ...expandRange('085520', 0, 8, 1), '085521', '085522', '085523', '085524',
      '085620', '085621', '085622', '085623', '085624', '085659', ...expandRange('0856599', 6, 9, 1),
      '085720', '085721', '085722', '085759', ...expandRange('0857', 93, 95),
      '085860', '085861', '085862',
      // XL & Axis Bandung
      '081702', ...expandRange('0817', 20, 23), '081742', '081743', ...expandRange('0817', 61, 64), '081792',
      '081802', '081809', ...expandRange('0818', 20, 22), '081842', '081843', ...expandRange('0818', 61, 64),
      '081910', '081911', '081912', '081920', '081921', '081931', '081943',
      '085956', '085974',
      '087720', '087721', '087722', '087723', '087770', '087771', '087772',
      ...expandRange('0878', 20, 25), '0878888',
      '083820', '083821', '083822', '083829',
      '088120', '088121', '088122', '088218', '088222', '088223', '088820', '088821',
    ],
  },
  {
    cityId: 'sumedang',
    prefixes: ['0816467'],
  },
  {
    cityId: 'garut',
    prefixes: [
      '082262',
      ...expandRange('0855234', 5, 9, 1), '0855235', '0855236', '0855237', ...expandRange('0855238', 0, 4, 1),
      ...expandRange('0856234', 5, 9, 1), '0856235', '0856236', '0856237', '0856238', '08562392', '08562393',
    ],
  },
  {
    cityId: 'tasikmalaya',
    prefixes: [
      '0811211', '0811212', '0812228', '0812229', '081323', '08226', '085222', '085322',
      '0815466', '0815468', '0815469', '0815496', '0815638', '0815639', '0816466', '0816496', '0856596', '085723',
      '087725', '087826', '083826', '083827',
    ],
  },
  {
    cityId: 'ciamis',
    prefixes: ['0822652'],
  },
  {
    cityId: 'banjar',
    prefixes: ['082265'],
  },
  {
    cityId: 'pangandaran',
    prefixes: ['0822654'],
  },
  {
    cityId: 'cirebon',
    prefixes: [
      '0811201', '0811202', '081124', '081222', '081224', '081324', '082127', '08223', '0823210', '085224', '085324',
      '081464', '0815464', '0815467', '081564', '08164876', '08164877', '08164878', '08164879', '081664',
      '0855239', '0856239', '0856597', '0856598', '085724', ...expandRange('085864', 0, 3, 1),
      '0817046', '0817068', '0817069', ...expandRange('081790', 6, 9, 1), '0817927', '0817928', '0817929',
      '0818023', '081823', '087724', '087728', '087729', '087779', '087828', '087829', '083823', '083824',
    ],
  },
  {
    cityId: 'kuningan',
    prefixes: ['082232'],
  },
  {
    cityId: 'indramayu',
    prefixes: ['082234'],
  },

  // --- JAWA TENGAH & DI YOGYAKARTA ---
  {
    cityId: 'semarang',
    prefixes: [
      '081127', '081128', '081129', '081225', '081228', '081229',
      '081325', '081326', '081350', '0813939',
      '082133', '082134', '082135',
      ...expandRange('0822', 20, 25), '08224',
      ...expandRange('0823', 23, 25),
      '085225', '085274', '085290', '085292', '085293',
      '085325',
      // Indosat Semarang
      '081465', '0815024', '0815489', '081565', '081566', '081575', '081576', '081577',
      '0816024', '0816424', '0816425', '0816488', '0816489', '081665', '081666',
      '085526', '085527', '0855280',
      '085602', '085626', '085627', '0856280', '085640', '085641', '085728', '085865', '085866', '0858698',
      // XL & Axis Semarang
      '0817024', '081705', '081724', '081729', ...expandRange('081741', 5, 8, 1), '081745', '081795',
      '081824', '0818278', '081829', '081845', '081901', '081904', '081914', '081924',
      '085950', '087730', '087731', '087732', '087733', '087734', '087830', '087831', '087832',
      '083838', '083842', '088137', '088215',
    ],
  },
  {
    cityId: 'salatiga',
    prefixes: ['082298', '0816664'],
  },
  {
    cityId: 'kendal',
    prefixes: ['082294'],
  },
  {
    cityId: 'purwodadi',
    prefixes: ['082292', '0855278', '0855279', '0856278', '0856279'],
  },
  {
    cityId: 'kudus',
    prefixes: ['082291', '0815424', '0815425'],
  },
  {
    cityId: 'pati',
    prefixes: ['082295'],
  },
  {
    cityId: 'blora',
    prefixes: ['082296'],
  },
  {
    cityId: 'magelang',
    prefixes: ['082293', '087834'],
  },
  {
    cityId: 'wonosobo',
    prefixes: ['082286'],
  },
  {
    cityId: 'kebumen',
    prefixes: ['082287'],
  },
  {
    cityId: 'pekalongan',
    prefixes: [
      '0813268', '0813269', '0813516', '0813517', '0821332', '082285', '085226', '085326',
      '081469', '0815423', '0815480', '0815481', '081569', '0856425', '0856426', '0858690', '0858691', '0858692',
    ],
  },
  {
    cityId: 'tegal',
    prefixes: [
      '0821334', '082283',
      '0815420', '0815421',
      '0817028', '0817064', '0817958', '0817959', '0818286', '0818287', '0877300',
    ],
  },
  {
    cityId: 'purwokerto',
    prefixes: [
      '0811260', '0811261', '0811262', '0811281', '0811287', '0811291',
      '0812266', '0812267', '0812299', '081327', '0813518', '0813519',
      '0821331', '082281', '082326', '085227', '085327',
      // Indosat Purwokerto
      '0814697', '0814698', ...expandRange('081542', 6, 9, 1), '0815488', '0815697', '0815698', '0815699',
      '0816428', '08164899', ...expandRange('081668', 5, 9, 1), '081669',
      ...expandRange('085526', 0, 4, 1), ...expandRange('085626', 0, 4, 1), '0856476', '0856477', '0856478',
      '0858693', '0858694', '0858697', '0858699',
      // XL Purwokerto
      '0817060', '0817061', '0817281', '0817282', '081748', '0818028', '081828', '087737', '087837',
    ],
  },
  {
    cityId: 'cilacap',
    prefixes: ['0812255', '082282'],
  },
  {
    cityId: 'solo',
    prefixes: [
      '0811263', '0811264', '0811265', '0811284', '0811285', '0811294', '0811295',
      '081215', '0812258', '0812259', '081226', '0812268', '0812297', '0812298',
      '081329', '081351', '082137', '082271', '082327', '085229', '085329',
      // Indosat Solo
      '081467', '081548', '0815485', '0815486', '0815487', '08154897', '08154898', '081567',
      '0816423', '0816427', '08164897', '08164898', '081667',
      '085525', ...expandRange('085528', 1, 4, 1), '0855298', '0855299',
      '085625', ...expandRange('085628', 1, 4, 1), '0856298', '0856299', '085642', '085647',
      '0857250', '0857251', '0857252', '0857253', ...expandRange('085867', 0, 3, 1),
      // XL Solo
      '0817025', '081725', '081744', ...expandRange('081794', 5, 9, 1),
      '081804', '081825', '0819250', '087735', '087736', '087758', '087835', '087836',
    ],
  },
  {
    cityId: 'klaten',
    prefixes: ['082272', '0815783', '0815784'],
  },
  {
    cityId: 'boyolali',
    prefixes: ['082276'],
  },
  {
    cityId: 'yogyakarta',
    prefixes: [
      '081125', '081126', '0811282', '0811283', '0811286', '0811292', '0811293',
      ...expandRange('081215', 5, 9, 1), '0812269', '081227', '0812294', '0812295', '0812296',
      '081328', '0813910', '0813920',
      '082136', '082138',
      '082226', '082227', '082242', '082243', '08227',
      '082328', '082329',
      '085228', '085291', '085328',
      // Indosat Yogyakarta
      '081468', '0815422', '08154895', '08154896', '081568', '081578', '081579',
      '0816422', '0816426', '08164895', '08164896', '081668',
      ...expandRange('085525', 4, 9, 1), '085528', '085529',
      ...expandRange('085625', 4, 9, 1), '085628', '085629', '085643',
      '085725', '085726', '0857270', '0857272', '085729', '085741', '085742', '085743', '085747',
      ...expandRange('085868', 0, 6, 1), '085878', '085879',
      // XL & Axis Yogyakarta
      '0817040', '0817041', '0817042', '081726', '081727', '081728', '081741', '081746', '081794',
      '081826', '081827', '081846', '081903', '0819040', '081915', '085942', '085943',
      '087738', '087739', '087838', '087839', '083840', '083867', '088216',
    ],
  },

  // --- JAWA TIMUR ---
  {
    cityId: 'surabaya',
    prefixes: [
      '081130', '081131', '081132', '081133', '081134', '081137',
      '081216', '081217', '081230', '081231', '081232', '081235',
      '081330', '081331', '081332', '081353', '081393',
      '082131', '082132', '082139', '082142', '082143',
      ...expandRange('0822', 28, 31), '082233', '082244', '082245',
      '08231', '082330',
      '085230', '085231', '085232', '085233',
      '085330', '085331', '085332', '085333',
      // Indosat Surabaya
      '081450', '081503', ...expandRange('0815', 50, 54),
      '081603', '081615', ...expandRange('0816', 50, 54),
      ...expandRange('0855', 30, 33),
      '085603', ...expandRange('0856', 30, 33), '085645', '085646', '085648', '0856494',
      ...expandRange('0857', 30, 33), '085735', '085748', '085767',
      '085815', '085816', '08585', '085850', '085851', '085852', '0858531',
      // XL & Axis Surabaya
      '081703', ...expandRange('0817', 30, 33), '081737', '081739', '081750', '081751', '081752', '081758', '081759', '081793',
      '081803', ...expandRange('0818', 30, 33), '081837', '081850', '081851', '081852', '081857', '081858', '081859',
      '081913', '081933', '081938', '081939', '08195', '085931', '085954',
      ...expandRange('0877', 50, 56), '087850', '087851', '087852', '087853', '087854', '087855', '087863', '087864', '087865',
      '083830', '083831', '08385', '088131', '088132', '088135', '088217', '08883',
    ],
  },
  {
    cityId: 'malang',
    prefixes: [
      '0811303', '0811313', '081136', '081233', '081333', '081334', '081354', '082140', '082341',
      '085234', '085257', '085334',
      '081455', '081555', '0816156', '0816157', '0816158', '0816429', '081655',
      '085535', '0855360', '0855361',
      '085635', '085636', ...expandRange('085646', 3, 7, 1), '085649',
      '0857352', '0857353', '085736', '085745', '085755', '085790', '085791', '085855',
      '0817047', '0817048', '0817049', ...expandRange('081705', 0, 3, 1), '081738', '081796',
      '0818034', '0818038', '081838', '081853', '087759', '087859', '083834', '083848',
    ],
  },
  {
    cityId: 'madiun',
    prefixes: [
      '0811302', '0811331', '081234', '081335', '081355', '082141', '082351', '085235', '085258', '085335',
      '081456', '081556', '081656', '0855350', '0855351',
      '0856350', '0856351', '0856457', '0856458', '0856490', '0856491',
      '0857350', '0857351', '0857365', '085746', '085749', ...expandRange('085856', 0, 7, 1),
      '0817413', '0817414', '08180340', '08180341', '0877580',
    ],
  },
  {
    cityId: 'jember',
    prefixes: [
      '0811301', '081135', ...expandRange('081234', 5, 9, 1), '081336', ...expandRange('081354', 5, 9, 1),
      '082331', '085236', '085259', '085336',
      '081459', '081559', '081659', '085536',
      ...expandRange('0856468', 5, 9, 1), '0856492', '0856493',
      '0857356', '0857460', '0857461', '0858545', '0858546', '0858547', '0858590', '0858591',
      '0817967', '0817968', '0817969', '087757', '087857',
    ],
  },
  { cityId: 'mojokerto', prefixes: ['08165460', '08165461', '0816548', '0816549', '0856462'] },
  { cityId: 'jombang', prefixes: ['082321', '08564621', '0858530'] },
  { cityId: 'lamongan', prefixes: ['082322'] },
  {
    cityId: 'tuban',
    prefixes: [
      '082356', '0815547', '0816546', '0816547',
      '085634', '0856459', '08564625', '08564626', '08564627',
      '0858540', '0858541', '0858542', '0858543',
    ],
  },
  { cityId: 'bojonegoro', prefixes: ['082353'] },
  { cityId: 'ponorogo', prefixes: ['082352'] },
  { cityId: 'nganjuk', prefixes: ['082358'] },
  { cityId: 'pacitan', prefixes: ['082357'] },
  { cityId: 'kediri', prefixes: ['082354', '085792'] },
  { cityId: 'tulungagung', prefixes: ['082355'] },
  { cityId: 'blitar', prefixes: ['082342'] },
  { cityId: 'pasuruan', prefixes: ['082343'] },
  { cityId: 'probolinggo', prefixes: ['082335'] },
  { cityId: 'lumajang', prefixes: ['082334'] },
  { cityId: 'bondowoso', prefixes: ['082332'] },
  { cityId: 'banyuwangi', prefixes: ['082333'] },

  // --- BALI, NUSA TENGGARA BARAT & NUSA TENGGARA TIMUR ---
  {
    cityId: 'denpasar',
    prefixes: [
      '081138', '081139', '081236', '081238', '081239', '081337', '081338', ...expandRange('081353', 0, 3, 1), '081390',
      '082144', '082146', '082236', '082237', '082247', '082339', '082340', '08236',
      '085237', '085238', '085253', '085337', '085338',
      // Indosat Denpasar
      '081457', '081547', '081557', '081558', ...expandRange('081629', 5, 9, 1), '081647', '081657', '081658',
      '085537', '085538', '085539', '085637', '085638', '085639', '0856469',
      '085737', '085738', '085739', '085857', '085858',
      // XL Denpasar
      '0817055', '0817066', '0817067', ...expandRange('081734', 6, 9, 1), '081735', '0817419', '081747', '081755', '081756', '081797',
      '081805', '0818348', '0818349', '081835', '081839', '081855', '081856',
      '081916', '081935', '081936', '081999', '085935',
      '087727', ...expandRange('0877', 60, 62), '087860', '087861', '087862', '0878887',
    ],
  },
  { cityId: 'singaraja', prefixes: ['0815584', '0816584'] },
  {
    cityId: 'mataram',
    prefixes: [
      '0811390', '0811391', '081237', ...expandRange('081339', 5, 9, 1), '0813908', '0813909',
      '082145', '0823410', '085239', '085339',
      '081458', '0815470', '0815471', '0815472', '0815474', ...expandRange('081658', 5, 9, 1),
      ...expandRange('085639', 5, 9, 1), '08564699', '0857392', '0857393', '08584700', '08584701', '0858582',
      '081736', '081757', '0818036', '081836', '081854', '081917', '087765', '0878650',
    ],
  },
  { cityId: 'sumbawa', prefixes: ['08123820', '08123821'] },
  {
    cityId: 'kupang',
    prefixes: [
      '0811381', '0811382', '0811383', '0811384', '0812379', '081339', '0813906', '0813907',
      '082147', '0823420',
      '081529', '0815473', '081629', ...expandRange('0856469', 5, 8, 1), '0857394', '0857395',
    ],
  },

  // --- SUMATERA ---
  {
    cityId: 'bandaaceh',
    prefixes: [
      '081168', '081268', '081269', '081360', '081377', '082162', '082360', '082361', '085260', '085360',
      '081434', '0815340', '081634', '0855600', '0855601', '0855602', '0855603',
      '0856600', '0856602', '0856603', '0856641', ...expandRange('0858340', 0, 4, 1), '0858341', '0858342',
    ],
  },
  {
    cityId: 'lhokseumawe',
    prefixes: ['081167', '0815342', ...expandRange('081634', 5, 9, 1), '0855604', '0856604', '08566415', '08566416'],
  },
  {
    cityId: 'medan',
    prefixes: [
      '081160', '081161', '081163', '081164', '081165',
      '081260', '081261', '081263', '081264', '081265',
      '081361', '081362', '081370', '081375', '081376', '081396', '081397',
      '082160', '082161', '082163', '082164', '082165', '082166', '082167', '082168',
      '082273', '082274', '082275', '082277',
      ...expandRange('0823', 62, 70),
      '085261', '085262', '085296', '085297',
      '085358', '085359', '085361', '085362', ...expandRange('0853', 70, 73),
      // Indosat Medan
      '081430', '081506', '081530', '081531', '081533', '081534', '081606', '081630', '081631', '081633',
      '085561', '085562', '085563',
      '085658', '0856605', '0856606', '085661', '085662', '085663', '085664',
      '085830', '085831', '0858338',
      // XL Medan
      '0819200', '0819201', '0819210', ...expandRange('0819', 60, 74),
      ...expandRange('0877', 66, 69), '087867', '087868', '087869',
    ],
  },
  {
    cityId: 'pematangsiantar',
    prefixes: [
      '0811601', '0811620', '0811621', '0812620', '0812621', '0813628', '0813629',
      '0815334', '0855609', '0856581', '0856609', ...expandRange('0858336', 0, 7, 1),
      '0819251',
    ],
  },
  { cityId: 'tebingtinggi', prefixes: ['08116011', '08116012', '0815336', '0815344', '0816336'] },
  {
    cityId: 'tanjungbalai',
    prefixes: [
      '0811628', '0811629', '0812628', '0812629', '0813626', '0813627',
      '0815330', '0815339', '0815345', '0816339', '08565818', '08566860', '08566861', '0858339',
    ],
  },
  { cityId: 'rantauprapat', prefixes: ['0811622', '0811623', '0812622', '0812623', '0855608', '0856608'] },
  { cityId: 'padangsidempuan', prefixes: ['0811625', '0812624', '0812625', '08556080', '08556081', '08566080', '08566081'] },
  {
    cityId: 'sibolga',
    prefixes: [
      '0811626', '0812626', '0813625', '08153347', '08153348', '08153349', '0815337',
      '0816337', '0855607', '08565815', '0856607', ...expandRange('0858337', 0, 4, 1),
    ],
  },
  { cityId: 'berastagi', prefixes: ['0811624', '0815343', '0816335', '08565819', '08566419'] },
  {
    cityId: 'pangkalanbrandan',
    prefixes: [
      '0811627', '0812627', '0815338', '0816338',
      ...expandRange('0855606', 5, 9, 1), '08565816', '08565817', ...expandRange('0856606', 5, 9, 1),
    ],
  },
  { cityId: 'kisaran', prefixes: ['0855605'] },
  {
    cityId: 'padang',
    prefixes: [
      '0811602', '0811603', '081166', '081266', '081267', '081363', '081374',
      '082169', '082170', ...expandRange('0823', 85, 87),
      '085263', '085363', '085374', '085375',
      '081435', '081535', '0816325', '081635', '0856589', '0856623', '0856689', '0856690', '0856691',
      '085766', '0858350', '0858351', '0858353', '0858354',
      '081947', '081975', '081993', '087792',
    ],
  },
  {
    cityId: 'bukittinggi',
    prefixes: [
      '08116020', '08116029', '0812669',
      '0815354', '0815358', '0815359', '0816358', '0816359',
      '08556650', '08556651', '0856584', '08566650', '08566651', '0858358',
    ],
  },
  {
    cityId: 'pekanbaru',
    prefixes: [
      '0811690', '0811707', '0811708', '0811709', '081175', '081176',
      '081275', '081276',
      ...expandRange('081357', 5, 9, 1), '081365', '081371', '081378',
      '082172', '082284', '082288', ...expandRange('0823', 81, 84),
      '085265', '085270', '085271', '085272', '085365', '085376',
      '081437', '081537', '081637', ...expandRange('085566', 6, 9, 1), ...expandRange('085567', 0, 3, 1),
      '0856582', ...expandRange('085666', 6, 9, 1), ...expandRange('085667', 6, 9, 1), '0856687', '0856688',
      ...expandRange('085837', 0, 4, 1),
      '081927', '081929', '081992', '087893',
    ],
  },
  {
    cityId: 'dumai',
    prefixes: [
      '0811706', '0811750', '0812750', '0812759', '0813650', '0813651',
      '0815341', '0815378', '0815379', '0816378', '0816379', '0855665', '0856645', '0856665', '0858378',
    ],
  },
  { cityId: 'tembilahan', prefixes: ['0815376', '0815377', '0856644'] },
  {
    cityId: 'batam',
    prefixes: [
      '081169', '081170', '081177', '0812617', '0812618', '0812619', '081270', '081277',
      '081364', '081372', '081391',
      '082171', ...expandRange('0823', 88, 92),
      '085264', '085364',
      '081436', '081536', '081636', '085565', '085566', '085606', '085665', '085666', '085668',
      '081922', '081923', '081990', '081991', '087791',
    ],
  },
  {
    cityId: 'tanjungpinang',
    prefixes: [
      ...expandRange('081364', 3, 6, 1),
      '08153630', '08153631', '08153633', '08153638', '08153639', '0815366', '0815367', '0815368',
      '0816362', '0816363', '0816364', '08566850', '08566851', '08566852',
      '085740', '085760', '085761', '085762', '085765',
    ],
  },
  { cityId: 'karimun', prefixes: ['0815369', '0816369'] },
  {
    cityId: 'jambi',
    prefixes: [
      '081174', '081274', '081366', '082178', '082280', '0822810', '082374', '085266', '0852672', '085366',
      '0814395', '0815322', ...expandRange('081539', 4, 9, 1), '0816320', ...expandRange('081639', 5, 9, 1),
      ...expandRange('085568', 6, 9, 1), '0855690',
      '0856642', '0856643', '0856686', '0856698', '0857277', '085758', '085764', '085789',
      '0819252', '0819254', '081994', '0878912', '0878924', '087896',
    ],
  },
  {
    cityId: 'palembang',
    prefixes: [
      '081171', '081178', '081271', '081273', '081278',
      '081357', '081359', '081367', '0813682', '0813683', '0813684', '081373',
      '082175', '082176', '082179', ...expandRange('0821', 80, 83),
      '082278', '082279', '0822820', ...expandRange('0823', 71, 73), '082378',
      '085267', '085268', '085273', ...expandRange('0852', 75, 78), '08529711',
      '085367', '085368', ...expandRange('0853', 77, 81),
      // Indosat Palembang
      '081438', '081507', '081532', '0815355', '0815356', '0815357', '081538',
      '081607', '081632', '0816355', '0816356', '0816357', '081638',
      '085567', '085667', ...expandRange('085669', 2, 5, 1), '085727', '085768', '085788', '0858380', '085838',
      // XL Palembang
      '081928', '081930', '081948', '081958', '081977', '081978', '081995', '081996',
      '087795', '087796', '087897',
    ],
  },
  { cityId: 'prabumulih', prefixes: ['0815320', '0815387', '0816387', '08565870'] },
  {
    cityId: 'lubuklinggau',
    prefixes: ['0811718', '0812718', '0815321', '0815389', '0816389', '0855680', '0856646', '0858389'],
  },
  {
    cityId: 'baturaja',
    prefixes: [
      '0811716', '0812716', '0815419', '0816419',
      ...expandRange('0855679', 5, 9, 1), ...expandRange('0856679', 5, 9, 1), '0858324',
    ],
  },
  {
    cityId: 'muaraenim',
    prefixes: [
      '0811719', ...expandRange('0811780', 0, 3, 1), '0812719',
      '08153248', '08153249', '0815416', '0816416', '08565874', '0858325',
    ],
  },
  {
    cityId: 'lahat',
    prefixes: [
      '08117806', '08117807', '0815324', '0815388', '0816388', '0816415',
      ...expandRange('0855681', 0, 4, 1), '08565872', ...expandRange('0856681', 0, 4, 1),
    ],
  },
  { cityId: 'martapura', prefixes: ['08153245', '08153246', '08153247', '0856648'] },
  {
    cityId: 'pangkalpinang',
    prefixes: [
      '0811717', '0812717', '0812734', '0812739', '0813677', '0813680', '0813681', '0813688', '085295',
      '0815326', ...expandRange('0855680', 5, 9, 1), ...expandRange('0856680', 5, 9, 1), '0858326', '0858327',
      '0819189', '0819290', '087797',
    ],
  },
  { cityId: 'belitung', prefixes: ['0816326', '0856647'] },
  {
    cityId: 'bengkulu',
    prefixes: [
      '081173', '081368', '082173', '082375', '085382',
      '081439', '081539', '081639', ...expandRange('085568', 1, 5, 1), ...expandRange('0855686', 0, 4, 1),
      '0856649', '08566862', '08566863', '08566864', '085772', '085839',
      '0819192', '087794',
    ],
  },
  {
    cityId: 'bandarlampung',
    prefixes: [
      '081172', '081179', '081272', '081279', ...expandRange('081359', 0, 3, 1), '081369', '081379',
      '082177', '082185', '082186', '0822815', '082376', '082377', '082379',
      '085269', '085279', '085369', '085383', '085384',
      '081440', '081540', '081541', '081640', '081641', '085569',
      '0856588', '085669', '085769', '085840', '085841',
      '081979', '081997', '087798', '087799', '087898', '087899',
    ],
  },
  { cityId: 'metro', prefixes: ['0815415', '0815417', '0816417'] },
  { cityId: 'kotabumi', prefixes: ['0811727', '0812729', '0815410', '0815418', '0816418', '0855699'] },

  // --- KALIMANTAN ---
  {
    cityId: 'pontianak',
    prefixes: [
      '081156', '081157', '081253', '081256', '081257', '081259', '081345', '0813958', '0813959',
      '082152', '082159', '082255',
      '085245', '085252', '085345', '085386',
      '081422', '081522', '081544', '0815498', '0815499', '081622', '081644', '0816492', '0816498', '0816499',
      '085550', '085650', '0856523', '0856544', '0856545', '0856546', '085750', '085822',
      '081952', '081956', '087718', '087818',
    ],
  },
  {
    cityId: 'singkawang',
    prefixes: ['0815227', '0816226', '0816227', '0856505', '08565095', ...expandRange('0858226', 0, 6, 1)],
  },
  { cityId: 'ketapang', prefixes: ['0815228', '0816228', '0856507', '08565090', ...expandRange('0858228', 0, 6, 1)] },
  { cityId: 'sambas', prefixes: ['0815229', '0816229'] },
  {
    cityId: 'palangkaraya',
    prefixes: [
      '081152', '0812507', '0812508', '0812509', '0812514', '0812515', '0812516', '081252',
      '0813490', '0813491', '0813492', '082149', '082156', '0822520',
      '085250', '085350',
      '081428', '081528', '081628', '0816450', '085551', '0856513', '085752', '0858280',
    ],
  },
  { cityId: 'sampit', prefixes: ['08152887', '08152888', '08152889', '0816284', '0816285', '0816286', '08565240'] },
  { cityId: 'pangkalanbun', prefixes: ['0816287'] },
  { cityId: 'muarateweh', prefixes: ['0815288', '0816288', '0856534'] },
  { cityId: 'kualakapuas', prefixes: ['0816289'] },
  {
    cityId: 'banjarmasin',
    prefixes: [
      '081150', '081151', '081250', '081251', '081348', '081349', '081356',
      '082148', '082155', '082350',
      '085248', '085249', '085348', '085349', '085387', '085388',
      '081421', '081521', '08152885', '08152886', '081621', ...expandRange('081645', 3, 6, 1),
      ...expandRange('085551', 5, 9, 1), '085552', '085651', '085652', '0856535', '0856536', '0856538', '0856539',
      '085751', '085821', '0858281', '0858289',
      '081951', '081953', '081954', '087714', '087715', '087716', '087814', '087815', '087816',
    ],
  },
  { cityId: 'kotabaru', prefixes: ['0815219', '0816219', '0856537', '0858219'] },
  { cityId: 'tabalong', prefixes: ['0815217', '08152193', '08152194', '0816215', '0858215'] },
  { cityId: 'pelaihari', prefixes: ['0816216'] },
  { cityId: 'kandangan', prefixes: ['0816217'] },
  { cityId: 'amuntai', prefixes: ['0816218'] },
  {
    cityId: 'balikpapan',
    prefixes: [
      '081153', '081154', '081159', '081254', '081258', '081346', '081347',
      '082150', '082153', '082154', '082157', '0822500', '0822530', '0822540',
      '085246', '085251', '085346', '085389', '085390',
      '081420', '081520', ...expandRange('081545', 5, 8, 1), '081620', '0816458', '0816459',
      '0856520', '085653', '0856540', '0856541', '085753', '085754', '085820', '085845',
      '081955', '081957', '081959', '087717', '087817', '087819',
    ],
  },
  {
    cityId: 'samarinda',
    prefixes: [
      '081155', '081158', '081255', '0813467', '0813468', '0813469', '0813955', '0813956', '0813957',
      '082151', '082158', '082256', '085247', '085347', '085391', '085393',
      '0814205', '0815205', '0815206', '0815207', '0815209', '0815451', '0815459',
      '0816205', '0816206', '0816207', '0816209', '0816451', '0816457',
      ...expandRange('085552', 5, 9, 1), '085553',
      '0856521', '0856522', ...expandRange('085652', 5, 9, 1), '0856542',
      '0858205', '0858206', '0858208', '0858209', '0858450',
      '081950',
    ],
  },
  { cityId: 'bontang', prefixes: ['0815208', '0815450', '0815454', '0816208', '0816452'] },
  { cityId: 'tarakan', prefixes: ['0812540', '0815452', '0815453', '08565430'] },

  // --- SULAWESI ---
  {
    cityId: 'makassar',
    prefixes: [
      '081141', '081144', '081146', '081241', '081242', '081246', '081342', '081343', '0813550', '081394',
      '082187', '082188', '082193', '082194', '082195', '082196',
      '0822910', '0822920', '0822930', '082344', '082346', '082347', '082348', '082349', '082393', '082394',
      '085242', '085254', '085255', '085299', '085342', '085394', '085395', '085396', '085397', '085398', '085399',
      // Indosat Makassar
      '081425', '081524', '081525', '081543', '081625', ...expandRange('081627', 5, 9, 1), '081643',
      '085555', '085556', '085655', '085656', '0856960', '0856961', '0856962', '085756', '085825',
      // XL Makassar
      '081941', '081942', '081944', '087840', '087841',
    ],
  },
  {
    cityId: 'parepare',
    prefixes: ['081142', '0813433', '0813434', '08152467', '08152468', '0815257', '0816257', '0856564'],
  },
  {
    cityId: 'rantepao',
    prefixes: ['0811422', '08152590', '08152591', '08152592', '0816259', '0855570', '0855571', '08565645', '08565646'],
  },
  { cityId: 'sorowako', prefixes: ['0811423', '08152464', '08152465', '0816258', '08565643', '08565644'] },
  {
    cityId: 'manado',
    prefixes: [
      '081143', '081243', '081244', '081340', '081352', '0813560',
      '082189', '082190', '082290', '0822960', '082395', '082396',
      '085240', '085256', '085298', '085340',
      '081423', '081523', '08152680', '081623', '085557', '085657', '085757', '085823',
      '081940',
    ],
  },
  { cityId: 'bitung', prefixes: ['08152681', '0816238', '08565745'] },
  { cityId: 'gorontalo', prefixes: ['0815239', '0816239', '08565743', '08565744', '0858239'] },
  {
    cityId: 'palu',
    prefixes: [
      '081145', '081245', '081341', '0813540', '082192', '0822950', '082345',
      '081424', '0815245', ...expandRange('0815257', 5, 9, 1), '0815258', '0815259', '0815430', '081624', '0816430',
      ...expandRange('085557', 2, 5, 1), '08565647', '08565648', '08565649', ...expandRange('0856969', 0, 4, 1), '085824',
      '0819430',
    ],
  },
  { cityId: 'donggala', prefixes: ['08152594', '08152595', '0816244', '08565650', '08565651'] },
  {
    cityId: 'kendari',
    prefixes: [
      '081140', '081240', ...expandRange('081245', 5, 9, 1), ...expandRange('081341', 5, 9, 1),
      '082191', '0822940', '085241', '085341',
      '0814245', '0815246', '0815247', '0815248', '0815431', ...expandRange('081624', 5, 8, 1), '0816431',
      ...expandRange('085555', 0, 3, 1), ...expandRange('085655', 0, 3, 1), '0856565', '08569698', '0858245',
    ],
  },
  { cityId: 'kolaka', prefixes: ['08152460', '08152461', '0816249', '08565656', '08565657'] },

  // --- MALUKU & TANAH PAPUA ---
  {
    cityId: 'ambon',
    prefixes: [
      '081147', '0813430', '0813431', '0813432', '0813567', '0813568', '0813569',
      '082197', '082238', '082397', '085243', '085343',
      '081426', '081526', '0815272', '081626', '085558', '08569680', '08569681', '085826',
    ],
  },
  {
    cityId: 'ternate',
    prefixes: ['081247', '0813408', '0813409', '082239', '0815278', '08565658', '08565659', '0858236'],
  },
  {
    cityId: 'jayapura',
    prefixes: [
      '081148', '081248', '081344', '0813564', '0813565', '0813566',
      '082199', '082248', '082399', '085244', '085344', '085354',
      '081427', '0815270', '0815271', '0815432', '081627', '0816432', '0816433', '0816434',
      '085559', ...expandRange('0856963', 0, 4, 1), '085827',
    ],
  },
  { cityId: 'biak', prefixes: ['0811487', ...expandRange('0812482', 5, 9, 1), '0855594'] },
  {
    cityId: 'sorong',
    prefixes: ['0811485', '0811486', ...expandRange('0812483', 5, 9, 1), '082398', '08152730', '0855593'],
  },
  { cityId: 'manokwari', prefixes: ['0812483'] },
  {
    cityId: 'timika',
    prefixes: [
      '081149', '081249', '0815274', '0815275', '0815276', '0815277', '0815279',
      ...expandRange('085559', 5, 9, 1), '0858276',
    ],
  },
  { cityId: 'merauke', prefixes: ['0812482', '082198', '08152750'] },
];

// Build deduplicated O(1) prefix map + normalized city coordinate lookup
const CURATED_PREFIX_MAP = new Map<string, CityGeoInfo>();
const CITY_NAME_TO_GEO = new Map<string, CityGeoInfo>();

function normCityKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(kota|kabupaten|kab\.?)\b/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]/g, '');
}

for (const info of Object.values(CITY_GEO_REGISTRY)) {
  const k = normCityKey(info.city);
  if (k && !CITY_NAME_TO_GEO.has(k)) {
    CITY_NAME_TO_GEO.set(k, info);
  }
}

for (const rule of SINGLE_CITY_HLR_RULES) {
  const cityInfo = CITY_GEO_REGISTRY[rule.cityId];
  for (const rawPrefix of rule.prefixes) {
    const p = rawPrefix.trim();
    if (!p || CURATED_PREFIX_MAP.has(p)) continue;
    CURATED_PREFIX_MAP.set(p, cityInfo);
  }
}

const MACRO_UMBRELLA_RE =
  /\b(jabodetabek|sumatera bagian|sumatra bagian|indonesia timur|priangan|bandung raya|eks-flexi)\b/i;

function resolveSingleCityFromDbIndex(
  dbIdx: number
): { city: string; province: string; coordinates?: { lat: number; lon: number } } | null {
  const tuple = HLR_CITY_TABLE[dbIdx];
  if (!tuple) return null;
  const [rawLabel, rawMapQuery] = tuple;
  if (MACRO_UMBRELLA_RE.test(rawLabel)) return null;

  // Reject multi-city comma lists like "Bandung, Cirebon, Cianjur, Tasikmalaya"
  const commaParts = rawLabel.split(',').map((s) => s.trim()).filter(Boolean);
  if (commaParts.length >= 3) return null;

  // Extract primary city name (normalizing "Kota & Kab. X" -> "Kota X" first!)
  const rawCityPart = (commaParts[0] || '')
    .replace(/^kota\s*[&/]\s*kab\.?\s+/i, 'Kota ')
    .split('/')[0]
    .split('&')[0]
    .replace(/\([^)]*\)/g, '')
    .trim();
  if (!rawCityPart || /^(kota|kab\.?|kabupaten)$/i.test(rawCityPart)) return null;

  // Reject bare province/island names masquerading as a city
  if (
    /^(jawa barat|jawa tengah|jawa timur|bali|sumatera|sumatra|kalimantan|sulawesi|maluku|papua)$/i.test(
      rawCityPart
    )
  ) {
    return null;
  }

  const matchedGeo = CITY_NAME_TO_GEO.get(normCityKey(rawCityPart));
  if (matchedGeo) {
    return {
      city: matchedGeo.city,
      province: matchedGeo.province,
      coordinates: { lat: matchedGeo.lat, lon: matchedGeo.lon },
    };
  }

  // Fallback province extraction from label or mapQuery
  const mapParts = rawMapQuery
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^indonesia$/i.test(s));
  const rawProvince = (
    commaParts[1] ||
    (mapParts.length >= 2 ? mapParts[mapParts.length - 1] : '') ||
    'Indonesia'
  )
    .split('/')[0]
    .replace(/^d\.i\.\s*yogyakarta$/i, 'DI Yogyakarta')
    .trim();

  return {
    city: rawCityPart,
    province: rawProvince || 'Indonesia',
  };
}

export function lookupIndonesianMobileHlr(local08: string): HlrLookupMatch {
  const clean = local08.replace(/\D/g, '');
  const p4 = clean.slice(0, 4);

  if (p4 === '0851' && /^0851[5-9]/.test(clean)) {
    return {
      city: 'Pool Nasional Digital (by.U)',
      province: 'Seluruh Indonesia (Non-Geografis)',
      region: 'Alokasi Nasional Digital (by.U / Telkomsel Online — Non-Geografis)',
      mapQuery: 'Indonesia',
      matchedPrefix: clean.slice(0, 5),
      accuracyTier: 'national',
      precisionLevel: 'national_pool',
      precisionLabel: 'Pool Nasional Digital (Non-Geografis)',
      basisNote:
        'Blok kartu digital by.U/Telkomsel yang diterbitkan secara online nasional (tidak terikat satu kota HLR tertentu).',
    };
  }

  const maxLen = Math.min(clean.length, 10);
  for (let len = maxLen; len >= 4; len--) {
    const sub = clean.slice(0, len);

    const curated = CURATED_PREFIX_MAP.get(sub);
    if (curated) {
      const { city, province, lat, lon } = curated;
      const isDeepCityPrefix = len >= 6;
      return {
        city,
        province,
        region: `${city}, ${province}`,
        mapQuery: `${city}, ${province}, Indonesia`,
        coordinates: { lat, lon },
        matchedPrefix: sub,
        accuracyTier: 'high',
        precisionLevel: isDeepCityPrefix ? 'city_6_8_digit' : 'city_5_digit',
        precisionLabel: isDeepCityPrefix
          ? `Presisi Tinggi — 1 Kota HLR (${len} Digit)`
          : `Presisi Kota Induk HLR (${len} Digit)`,
        basisNote: `Tabel Kode HLR Spesifik Operator (Prefix \`${sub}\` → kota registrasi awal kartu **${city}**, **${province}**).`,
      };
    }

    if (len >= 6) {
      const dbIdx = HLR_PREFIX_INDEX[sub];
      if (dbIdx !== undefined) {
        const resolved = resolveSingleCityFromDbIndex(dbIdx);
        if (resolved) {
          const { city, province, coordinates } = resolved;
          return {
            city,
            province,
            region: `${city}, ${province}`,
            mapQuery: `${city}, ${province}, Indonesia`,
            ...(coordinates ? { coordinates } : {}),
            matchedPrefix: sub,
            accuracyTier: 'high',
            precisionLevel: 'city_6_8_digit',
            precisionLabel: `Presisi Tinggi — 1 Kota HLR (${len} Digit)`,
            basisNote: `Tabel Kode HLR Spesifik Operator (Prefix \`${sub}\` → kota registrasi awal kartu **${city}**, **${province}**).`,
          };
        }
      }
    }
  }

  if (p4.startsWith('089')) {
    return {
      city: 'Pool Nasional Digital (Tri / 3)',
      province: 'Seluruh Indonesia (Non-Geografis)',
      region: 'Alokasi Nasional Digital (Tri 3 IOH — Non-Geografis)',
      mapQuery: 'Indonesia',
      matchedPrefix: p4,
      accuracyTier: 'national',
      precisionLevel: 'national_pool',
      precisionLabel: 'Pool Nasional Digital (Non-Geografis)',
      basisNote:
        'Blok nomor Tri (3) dialokasikan dari pool nasional/e-commerce tanpa penguncian satu kota HLR spesifik.',
    };
  }

  if (p4.startsWith('088')) {
    return {
      city: 'Pool Nasional Digital (Smartfren / eSIM)',
      province: 'Seluruh Indonesia (Non-Geografis)',
      region: 'Alokasi Nasional Digital (Smartfren / eSIM — Non-Geografis)',
      mapQuery: 'Indonesia',
      matchedPrefix: p4,
      accuracyTier: 'national',
      precisionLevel: 'national_pool',
      precisionLabel: 'Pool Nasional Digital (Non-Geografis)',
      basisNote:
        'Blok nomor Smartfren baru/eSIM dialokasikan secara nasional lintas wilayah (non-geografis).',
    };
  }

  return {
    city: 'Pool Seluler Nasional',
    province: 'Seluruh Indonesia (Non-Geografis)',
    region: 'Alokasi Seluler Nasional Indonesia (Blok Modern / E-Commerce / MNP)',
    mapQuery: 'Indonesia',
    matchedPrefix: clean.slice(0, Math.min(6, clean.length)),
    accuracyTier: 'national',
    precisionLevel: 'national_pool',
    precisionLabel: 'Pool Nasional Digital (Non-Geografis)',
    basisNote:
      'Blok prefix ini berstatus distribusi nasional/modern (tidak dipatok ke satu kota HLR agar tidak salah menunjuk kota pemilik).',
  };
}

// ============================================================================
// OFFICIAL 38 INDONESIAN PROVINCES + KABUPATEN/KOTA KEMENDAGRI CODES (/ceknik)
// ============================================================================

export const KEMENDAGRI_PROVINCES: Record<string, string> = {
  '11': 'Aceh',
  '12': 'Sumatera Utara',
  '13': 'Sumatera Barat',
  '14': 'Riau',
  '15': 'Jambi',
  '16': 'Sumatera Selatan',
  '17': 'Bengkulu',
  '18': 'Lampung',
  '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau',
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur',
  '61': 'Kalimantan Barat',
  '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan',
  '64': 'Kalimantan Timur',
  '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara',
  '72': 'Sulawesi Tengah',
  '73': 'Sulawesi Selatan',
  '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo',
  '76': 'Sulawesi Barat',
  '81': 'Maluku',
  '82': 'Maluku Utara',
  '91': 'Papua',
  '92': 'Papua Barat',
  '93': 'Papua Selatan',
  '94': 'Papua Tengah',
  '95': 'Papua Pegunungan',
  '96': 'Papua Barat Daya',
};

export const KEMENDAGRI_KABKOTA: Record<string, string> = {
  // DKI Jakarta (31)
  '3101': 'Kab. Administrasi Kepulauan Seribu',
  '3171': 'Kota Administrasi Jakarta Pusat',
  '3172': 'Kota Administrasi Jakarta Utara',
  '3173': 'Kota Administrasi Jakarta Barat',
  '3174': 'Kota Administrasi Jakarta Selatan',
  '3175': 'Kota Administrasi Jakarta Timur',
  // Jawa Barat (32)
  '3201': 'Kab. Bogor',
  '3202': 'Kab. Sukabumi',
  '3203': 'Kab. Cianjur',
  '3204': 'Kab. Bandung',
  '3205': 'Kab. Garut',
  '3206': 'Kab. Tasikmalaya',
  '3207': 'Kab. Ciamis',
  '3208': 'Kab. Kuningan',
  '3209': 'Kab. Cirebon',
  '3210': 'Kab. Majalengka',
  '3211': 'Kab. Sumedang',
  '3212': 'Kab. Indramayu',
  '3213': 'Kab. Subang',
  '3214': 'Kab. Purwakarta',
  '3215': 'Kab. Karawang',
  '3216': 'Kab. Bekasi',
  '3217': 'Kab. Bandung Barat',
  '3218': 'Kab. Pangandaran',
  '3271': 'Kota Bogor',
  '3272': 'Kota Sukabumi',
  '3273': 'Kota Bandung',
  '3274': 'Kota Cirebon',
  '3275': 'Kota Bekasi',
  '3276': 'Kota Depok',
  '3277': 'Kota Cimahi',
  '3278': 'Kota Tasikmalaya',
  '3279': 'Kota Banjar',
  // Banten (36)
  '3601': 'Kab. Pandeglang',
  '3602': 'Kab. Lebak',
  '3603': 'Kab. Tangerang',
  '3604': 'Kab. Serang',
  '3671': 'Kota Tangerang',
  '3672': 'Kota Cilegon',
  '3673': 'Kota Serang',
  '3674': 'Kota Tangerang Selatan',
  // Jawa Tengah (33)
  '3301': 'Kab. Cilacap',
  '3302': 'Kab. Banyumas',
  '3303': 'Kab. Purbalingga',
  '3304': 'Kab. Banjarnegara',
  '3305': 'Kab. Kebumen',
  '3306': 'Kab. Purworejo',
  '3307': 'Kab. Wonosobo',
  '3308': 'Kab. Magelang',
  '3309': 'Kab. Boyolali',
  '3310': 'Kab. Klaten',
  '3311': 'Kab. Sukoharjo',
  '3312': 'Kab. Wonogiri',
  '3313': 'Kab. Karanganyar',
  '3314': 'Kab. Sragen',
  '3315': 'Kab. Grobogan',
  '3316': 'Kab. Blora',
  '3317': 'Kab. Rembang',
  '3318': 'Kab. Pati',
  '3319': 'Kab. Kudus',
  '3320': 'Kab. Jepara',
  '3321': 'Kab. Demak',
  '3322': 'Kab. Semarang',
  '3323': 'Kab. Temanggung',
  '3324': 'Kab. Kendal',
  '3325': 'Kab. Batang',
  '3326': 'Kab. Pekalongan',
  '3327': 'Kab. Pemalang',
  '3328': 'Kab. Tegal',
  '3329': 'Kab. Brebes',
  '3371': 'Kota Magelang',
  '3372': 'Kota Surakarta (Solo)',
  '3373': 'Kota Salatiga',
  '3374': 'Kota Semarang',
  '3375': 'Kota Pekalongan',
  '3376': 'Kota Tegal',
  // DI Yogyakarta (34)
  '3401': 'Kab. Kulon Progo',
  '3402': 'Kab. Bantul',
  '3403': 'Kab. Gunungkidul',
  '3404': 'Kab. Sleman',
  '3471': 'Kota Yogyakarta',
  // Jawa Timur (35)
  '3501': 'Kab. Pacitan',
  '3502': 'Kab. Ponorogo',
  '3503': 'Kab. Trenggalek',
  '3504': 'Kab. Tulungagung',
  '3505': 'Kab. Blitar',
  '3506': 'Kab. Kediri',
  '3507': 'Kab. Malang',
  '3508': 'Kab. Lumajang',
  '3509': 'Kab. Jember',
  '3510': 'Kab. Banyuwangi',
  '3511': 'Kab. Bondowoso',
  '3512': 'Kab. Situbondo',
  '3513': 'Kab. Probolinggo',
  '3514': 'Kab. Pasuruan',
  '3515': 'Kab. Sidoarjo',
  '3516': 'Kab. Mojokerto',
  '3517': 'Kab. Jombang',
  '3518': 'Kab. Nganjuk',
  '3519': 'Kab. Madiun',
  '3520': 'Kab. Magetan',
  '3521': 'Kab. Ngawi',
  '3522': 'Kab. Bojonegoro',
  '3523': 'Kab. Tuban',
  '3524': 'Kab. Lamongan',
  '3525': 'Kab. Gresik',
  '3526': 'Kab. Bangkalan',
  '3527': 'Kab. Sampang',
  '3528': 'Kab. Pamekasan',
  '3529': 'Kab. Sumenep',
  '3571': 'Kota Kediri',
  '3572': 'Kota Blitar',
  '3573': 'Kota Malang',
  '3574': 'Kota Probolinggo',
  '3575': 'Kota Pasuruan',
  '3576': 'Kota Mojokerto',
  '3577': 'Kota Madiun',
  '3578': 'Kota Surabaya',
  '3579': 'Kota Batu',
  // Bali (51), NTB (52), NTT (53)
  '5101': 'Kab. Jembrana',
  '5102': 'Kab. Tabanan',
  '5103': 'Kab. Badung',
  '5104': 'Kab. Gianyar',
  '5105': 'Kab. Klungkung',
  '5106': 'Kab. Bangli',
  '5107': 'Kab. Karangasem',
  '5108': 'Kab. Buleleng',
  '5171': 'Kota Denpasar',
  '5201': 'Kab. Lombok Barat',
  '5202': 'Kab. Lombok Tengah',
  '5203': 'Kab. Lombok Timur',
  '5271': 'Kota Mataram',
  '5272': 'Kota Bima',
  '5371': 'Kota Kupang',
  // Sumatera Major Cities & Regencies
  '1171': 'Kota Banda Aceh',
  '1173': 'Kota Lhokseumawe',
  '1174': 'Kota Langsa',
  '1207': 'Kab. Deli Serdang',
  '1271': 'Kota Medan',
  '1272': 'Kota Pematangsiantar',
  '1275': 'Kota Binjai',
  '1277': 'Kota Padangsidimpuan',
  '1371': 'Kota Padang',
  '1375': 'Kota Bukittinggi',
  '1376': 'Kota Payakumbuh',
  '1471': 'Kota Pekanbaru',
  '1472': 'Kota Dumai',
  '1571': 'Kota Jambi',
  '1607': 'Kab. Banyuasin',
  '1671': 'Kota Palembang',
  '1673': 'Kota Lubuklinggau',
  '1674': 'Kota Prabumulih',
  '1771': 'Kota Bengkulu',
  '1871': 'Kota Bandar Lampung',
  '1872': 'Kota Metro',
  '1971': 'Kota Pangkalpinang',
  '2171': 'Kota Batam',
  '2172': 'Kota Tanjungpinang',
  // Kalimantan, Sulawesi, Maluku & Papua Major Cities
  '6171': 'Kota Pontianak',
  '6172': 'Kota Singkawang',
  '6271': 'Kota Palangka Raya',
  '6371': 'Kota Banjarmasin',
  '6372': 'Kota Banjarbaru',
  '6471': 'Kota Balikpapan',
  '6472': 'Kota Samarinda',
  '6474': 'Kota Bontang',
  '6571': 'Kota Tarakan',
  '7171': 'Kota Manado',
  '7172': 'Kota Bitung',
  '7173': 'Kota Tomohon',
  '7271': 'Kota Palu',
  '7306': 'Kab. Gowa',
  '7309': 'Kab. Maros',
  '7371': 'Kota Makassar',
  '7372': 'Kota Parepare',
  '7373': 'Kota Palopo',
  '7471': 'Kota Kendari',
  '7472': 'Kota Baubau',
  '7571': 'Kota Gorontalo',
  '7604': 'Kab. Polewali Mandar',
  '8171': 'Kota Ambon',
  '8271': 'Kota Ternate',
  '9171': 'Kota Jayapura',
  '9271': 'Kota Sorong',
  '9671': 'Kota Sorong',
};
