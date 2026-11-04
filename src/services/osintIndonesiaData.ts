import { HLR_CITY_TABLE, HLR_PREFIX_INDEX } from './hlrCityDatabase';

export interface HlrLookupMatch {
  city: string;
  province: string;
  region: string;
  clusterCoverage?: string;
  mapQuery: string;
  coordinates?: { lat: number; lon: number };
  matchedPrefix: string;
  accuracyTier: 'high' | 'cluster' | 'national';
  precisionLevel:
    | 'city_6_8_digit'
    | 'city_5_digit'
    | 'regional_cluster'
    | 'national_pool';
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
  jakartapusat: { city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.1805, lon: 106.8284 },
  bogor: { city: 'Kota Bogor', province: 'Jawa Barat', lat: -6.5971, lon: 106.806 },
  depok: { city: 'Kota Depok', province: 'Jawa Barat', lat: -6.4025, lon: 106.7942 },
  tangerang: { city: 'Kota Tangerang', province: 'Banten', lat: -6.1783, lon: 106.6319 },
  tangsel: { city: 'Kota Tangerang Selatan', province: 'Banten', lat: -6.2886, lon: 106.7179 },
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
  langsa: { city: 'Kota Langsa', province: 'Aceh', lat: 4.4683, lon: 97.9683 },
  medan: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722 },
  deliserdang: { city: 'Kab. Deli Serdang', province: 'Sumatera Utara', lat: 3.4214, lon: 98.8658 },
  binjai: { city: 'Kota Binjai', province: 'Sumatera Utara', lat: 3.6001, lon: 98.4854 },
  kabanjahe: { city: 'Kabanjahe', province: 'Sumatera Utara', lat: 3.1003, lon: 98.4908 },
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

  // Additional HLR Regency / Exchange Cities (Jateng, Jatim, Kalsel, Sulsel, Sulbar, NTB/NTT)
  pemalang: { city: 'Pemalang', province: 'Jawa Tengah', lat: -6.8906, lon: 109.3808 },
  brebes: { city: 'Brebes', province: 'Jawa Tengah', lat: -6.8706, lon: 109.0426 },
  rembang: { city: 'Rembang', province: 'Jawa Tengah', lat: -6.7086, lon: 111.3416 },
  jepara: { city: 'Jepara', province: 'Jawa Tengah', lat: -6.5889, lon: 110.6684 },
  sragen: { city: 'Sragen', province: 'Jawa Tengah', lat: -7.4265, lon: 111.0221 },
  karanganyar: { city: 'Karanganyar', province: 'Jawa Tengah', lat: -7.596, lon: 110.9508 },
  sukoharjo: { city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.683, lon: 110.8406 },
  wonogiri: { city: 'Wonogiri', province: 'Jawa Tengah', lat: -7.8147, lon: 110.9234 },
  purworejo: { city: 'Purworejo', province: 'Jawa Tengah', lat: -7.7133, lon: 110.0082 },
  temanggung: { city: 'Temanggung', province: 'Jawa Tengah', lat: -7.3161, lon: 110.175 },
  banjarnegara: { city: 'Banjarnegara', province: 'Jawa Tengah', lat: -7.3991, lon: 109.6967 },
  purbalingga: { city: 'Purbalingga', province: 'Jawa Tengah', lat: -7.3881, lon: 109.3639 },
  sidoarjo: { city: 'Sidoarjo', province: 'Jawa Timur', lat: -7.4478, lon: 112.7183 },
  gresik: { city: 'Gresik', province: 'Jawa Timur', lat: -7.1567, lon: 112.6555 },
  pamekasan: { city: 'Pamekasan', province: 'Jawa Timur', lat: -7.1568, lon: 113.4746 },
  situbondo: { city: 'Situbondo', province: 'Jawa Timur', lat: -7.7062, lon: 114.0098 },
  banjarbaru: { city: 'Kota Banjarbaru', province: 'Kalimantan Selatan', lat: -3.4404, lon: 114.8308 },
  palopo: { city: 'Kota Palopo', province: 'Sulawesi Selatan', lat: -2.9926, lon: 120.1969 },
  watampone: { city: 'Watampone (Bone)', province: 'Sulawesi Selatan', lat: -4.5386, lon: 120.3279 },
  bulukumba: { city: 'Bulukumba', province: 'Sulawesi Selatan', lat: -5.5539, lon: 120.1928 },
  baubau: { city: 'Kota Baubau', province: 'Sulawesi Tenggara', lat: -5.4667, lon: 122.6333 },
  mamuju: { city: 'Mamuju', province: 'Sulawesi Barat', lat: -2.6778, lon: 118.887 },
  bima: { city: 'Kota Bima', province: 'Nusa Tenggara Barat', lat: -8.4606, lon: 118.7267 },
  ende: { city: 'Ende', province: 'Nusa Tenggara Timur', lat: -8.8432, lon: 121.6623 },
  maumere: { city: 'Maumere', province: 'Nusa Tenggara Timur', lat: -8.6189, lon: 122.2122 },
  labuanbajo: { city: 'Labuan Bajo', province: 'Nusa Tenggara Timur', lat: -8.4964, lon: 119.8877 },
  waingapu: { city: 'Waingapu', province: 'Nusa Tenggara Timur', lat: -9.6567, lon: 120.2641 },
  majalengka: { city: 'Kab. Majalengka', province: 'Jawa Barat', lat: -6.8364, lon: 108.2279 },
  sampang: { city: 'Kab. Sampang', province: 'Jawa Timur', lat: -7.1872, lon: 113.2394 },
  sumenep: { city: 'Kab. Sumenep', province: 'Jawa Timur', lat: -7.0056, lon: 113.8628 },
  negara: { city: 'Negara (Jembrana)', province: 'Bali', lat: -8.3569, lon: 114.6261 },
  selong: { city: 'Selong (Lombok Timur)', province: 'Nusa Tenggara Barat', lat: -8.6508, lon: 116.5361 },
  sabang: { city: 'Kota Sabang', province: 'Aceh', lat: 5.8916, lon: 95.3222 },
  sigli: { city: 'Sigli (Pidie)', province: 'Aceh', lat: 5.3848, lon: 95.9609 },
  meulaboh: { city: 'Meulaboh (Aceh Barat)', province: 'Aceh', lat: 4.1363, lon: 96.1269 },
  ranai: { city: 'Ranai (Natuna)', province: 'Kepulauan Riau', lat: 3.9403, lon: 108.3881 },
  dabosingkep: { city: 'Dabo Singkep (Lingga)', province: 'Kepulauan Riau', lat: -0.4958, lon: 104.5625 },
  kualatungkal: { city: 'Kuala Tungkal', province: 'Jambi', lat: -0.8165, lon: 103.4614 },
  muarabungo: { city: 'Muara Bungo', province: 'Jambi', lat: -1.5022, lon: 102.1153 },
  curup: { city: 'Curup (Rejang Lebong)', province: 'Bengkulu', lat: -3.4704, lon: 102.5208 },
  sekayu: { city: 'Sekayu (Musi Banyuasin)', province: 'Sumatera Selatan', lat: -2.8906, lon: 103.8314 },
  kayuagung: { city: 'Kayuagung (OKI)', province: 'Sumatera Selatan', lat: -3.3936, lon: 104.8306 },
  mentok: { city: 'Mentok (Bangka Barat)', province: 'Kepulauan Bangka Belitung', lat: -2.0653, lon: 105.1636 },
  menggala: { city: 'Menggala (Tulang Bawang)', province: 'Lampung', lat: -4.4697, lon: 105.2422 },
  pringsewu: { city: 'Kab. Pringsewu', province: 'Lampung', lat: -5.3582, lon: 104.9744 },
  mempawah: { city: 'Kab. Mempawah', province: 'Kalimantan Barat', lat: 0.3694, lon: 108.9597 },
  sanggau: { city: 'Kab. Sanggau', province: 'Kalimantan Barat', lat: 0.1231, lon: 110.5892 },
  sintang: { city: 'Kab. Sintang', province: 'Kalimantan Barat', lat: 0.0725, lon: 111.4903 },
  kotamobagu: { city: 'Kota Kotamobagu', province: 'Sulawesi Utara', lat: 0.7267, lon: 124.3111 },
  tual: { city: 'Kota Tual', province: 'Maluku', lat: -5.6317, lon: 132.7508 },
  nabire: { city: 'Nabire', province: 'Papua Tengah', lat: -3.3622, lon: 135.5019 },
  wamena: { city: 'Wamena', province: 'Papua Pegunungan', lat: -4.0956, lon: 138.9531 },
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
      ...expandRange('0822', 10, 13), '082260', '082261', '082297', '082298', '082299',
      ...expandRange('0823', 10, 12),
      '08520', '085210', ...expandRange('0852', 14, 19), '08528',
      '085310', '085319',
      // Indosat Jakarta
      '08140', '081410', '081411',
      '08150', '08151', '0815482', '081574', '08158', '08159',
      '08160', '08161', ...expandRange('081648', 0, 5, 1), '08167', '08168', '08169',
      '08551', '08557', '08558', '08559',
      '085601', '08561', '08567', '08568', '08569',
      '08571', '085770', '085771', ...expandRange('0857', 73, 82),
      ...expandRange('0858', 10, 14), '0858463', '08588', '08589',
      // XL, Axis & Historic Smartfren/Tri Jakarta
      '081700', '081701', '08171', '081749', '081760', '08177', '08178', '081791', '081798', '081799',
      '081800', '081801', '081806', '081807', '081808', '08181', '081840', '081841', '081847', '081848', '081849', '081860', '081865', '081866', '08187', '08188', '08189',
      '081905', '081908', '081932',
      '085920', '085921', ...expandRange('0859', 45, 47), '085959', '085966',
      '087777', '08778', '087808', '087809', '087877', ...expandRange('0878', 83, 89),
      '08380', '08387', '08389',
      '08811', ...expandRange('0882', 10, 14), '08881', '08888', '08889',
      '08960', '08963',
    ],
  },
  {
    cityId: 'bogor',
    prefixes: [
      '081111', '081211', '0813117', '0813118', '0813119', '0821100', '082117', '0821250', '085211', '085311',
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
    prefixes: ['0812810', '0812840', '085693', '085718', '0878080', '087871', '083812', '083813'],
  },
  {
    cityId: 'bekasi',
    prefixes: ['0812820', '0821240', '085694', '085719', '087875', '087879'],
  },
  {
    cityId: 'serang',
    prefixes: [
      '081112', '081212', '085212', '085312',
      '081546', '081549', '081646', '081649',
      '081906', '0877710', '087774', '0878090', '0878710', '0838120',
    ],
  },
  {
    cityId: 'cilegon',
    prefixes: ['0877720'],
  },

  // --- JAWA BARAT ---
  {
    cityId: 'karawang',
    prefixes: [
      ...expandRange('081112', 6, 9, 1), ...expandRange('081212', 6, 9, 1), '081312', '081313', '085213', '085313',
      '0815462', '0815492', '0816462',
    ],
  },
  {
    cityId: 'purwakarta',
    prefixes: [
      '0815465', '0815493', '0816465', '0816493', '0856599', '0858464', '0858465',
    ],
  },
  {
    cityId: 'sukabumi',
    prefixes: [
      '0821470', '0821570',
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
      '081320', '081321', '081322', '081394', '0813950', '0813951', '0813952', '081395',
      '082115', '082116', '082118', '082119', '082120', '082121', '082126', '082128', '082129', '082130',
      ...expandRange('0822', 14, 19), '082240',
      ...expandRange('0823', 15, 21),
      '085220', '085221', '085223', '085294',
      '085314', '085315', '085316', '085317', '085318', '085320', '085321', '085323',
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
      '081910', '081911', '081912', '081931', '081943',
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
      '0811211', '0811212', '0812228', '0812229', '081323', '085222', '085322',
      '0815466', '0815468', '0815469', '0815496', '0815638', '0815639', '0816466', '0816496', '0856596', '085723',
      '087725', '087826', '083826', '083827',
    ],
  },
  {
    cityId: 'cirebon',
    prefixes: [
      '0811201', '0811202', '081124', '081222', '081224', '081324', '082127', '085224', '085324',
      '081464', '0815464', '0815467', '081564', '08164876', '08164877', '08164878', '08164879', '081664',
      '0855239', '0856239', '0856597', '0856598', '085724', ...expandRange('085864', 0, 3, 1),
      '0817046', '0817068', '0817069', ...expandRange('081790', 6, 9, 1), '0817927', '0817928', '0817929',
      '0818023', '081823', '087724', '087728', '087729', '087779', '087828', '087829', '083823', '083824',
    ],
  },

  // --- JAWA TENGAH & DI YOGYAKARTA ---
  {
    cityId: 'semarang',
    prefixes: [
      '081127', '081128', '081129', '081225', '081228', '081229',
      '081325', '081326', '081390', '081392', '081393',
      '082133', '082134', '082135',
      ...expandRange('0822', 20, 25), '082241',
      ...expandRange('0823', 22, 25),
      '085225', '085290', '085292', '085293',
      '085325',
      // Indosat Semarang
      '081465', '0815024', '0815489', '081565', '081566', '081575', '081576', '081577',
      '0816024', '0816424', '0816425', '0816488', '0816489', '081665', '081666',
      '085526', '085527', '0855280',
      '085602', '085626', '085627', '0856280', '085640', '085641', '085728', '085865', '085866', '0858698',
      // XL & Axis Semarang
      '0817024', '081705', '081724', '081729', ...expandRange('081741', 5, 8, 1), '081745', '081795',
      '081824', '0818278', '081829', '081845', '081901', '081904', '081914',
      '085950', '087730', '087731', '087732', '087733', '087734', '087830', '087831', '087832',
      '083838', '083842', '088137', '088215',
    ],
  },
  {
    cityId: 'salatiga',
    prefixes: ['0816664'],
  },
  {
    cityId: 'purwodadi',
    prefixes: ['0855278', '0855279', '0856278', '0856279'],
  },
  {
    cityId: 'kudus',
    prefixes: ['0815424', '0815425'],
  },
  {
    cityId: 'magelang',
    prefixes: ['087834'],
  },
  {
    cityId: 'pekalongan',
    prefixes: [
      '0813268', '0813269', '0821332', '085226', '085326',
      '081469', '0815423', '0815480', '0815481', '081569', '0856425', '0856426', '0858690', '0858691', '0858692',
    ],
  },
  {
    cityId: 'tegal',
    prefixes: [
      '0821334',
      '0815420', '0815421',
      '0817028', '0817064', '0817958', '0817959', '0818286', '0818287', '0877300',
    ],
  },
  {
    cityId: 'purwokerto',
    prefixes: [
      '0811260', '0811261', '0811262', '0811281', '0811287', '0811291',
      '0812266', '0812267', '0812299', '081327',
      '0821331', '082326', '085227', '085327',
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
    prefixes: ['0812255'],
  },
  {
    cityId: 'solo',
    prefixes: [
      '0811263', '0811264', '0811265', '0811284', '0811285', '0811294', '0811295',
      '0812150', '0812151', '0812152', '0812153', '0812154', '0812258', '0812259', '081226', '0812268', '0812297', '0812298',
      '081329', '082137', '082327', '085229', '085329',
      // Indosat Solo
      '0815483', '0815484', '0815485', '0815486', '0815487', '08154897', '08154898', '081567',
      '0816423', '0816427', '08164897', '08164898', '081667',
      '0855250', '0855251', '0855252', '0855253', ...expandRange('085528', 1, 4, 1), '0855298', '0855299',
      '0856250', '0856251', '0856252', '0856253', ...expandRange('085628', 1, 4, 1), '0856298', '0856299', '085642', '085647',
      '0857250', '0857251', '0857252', '0857253', ...expandRange('085867', 0, 3, 1),
      // XL Solo
      '0817025', '081725', '081744', ...expandRange('081794', 5, 9, 1),
      '081804', '081825', '087735', '087736', '087835', '087836',
    ],
  },
  {
    cityId: 'klaten',
    prefixes: ['0815783', '0815784'],
  },
  {
    cityId: 'yogyakarta',
    prefixes: [
      '081125', '081126', '0811282', '0811283', '0811286', '0811292', '0811293',
      ...expandRange('081215', 5, 9, 1), '0812269', '081227', '0812294', '0812295', '0812296',
      '081328', '0813910', '0813920',
      '082136', '082138',
      '082226', '082227', '082242', '082243',
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
      '081330', '081331', '081332',
      '082131', '082132', '082139', '082142', '082143',
      ...expandRange('0822', 28, 34), '082244', '082245',
      ...expandRange('0823', 30, 33),
      '085230', '085231', '085232', '085233',
      '085330', '085331', '085332', '085333',
      // Indosat Surabaya
      '081450', '081503', ...expandRange('0815', 50, 54),
      '081603', '081615', ...expandRange('0816', 50, 54),
      ...expandRange('0855', 30, 33),
      '085603', ...expandRange('0856', 30, 33), '085645', '085646', '085648', '0856494',
      ...expandRange('0857', 30, 33), '085735', '085748',
      '085815', '085816', '08585', '085850', '085851', '085852', '0858531',
      // XL & Axis Surabaya
      '081703', ...expandRange('0817', 30, 33), '081737', '081739', '081750', '081751', '081752', '081758', '081759', '081793',
      '081803', ...expandRange('0818', 30, 33), '081837', '081850', '081851', '081852', '081857', '081858', '081859',
      '081913', '081933', '081938', '081939', '085931', '085954',
      ...expandRange('0877', 50, 56), '087850', '087851', '087852', '087853', '087854', '087855', '087863', '087864', '087865',
      '083830', '083831', '08385', '088131', '088132', '088135', '088217', '08883',
    ],
  },
  {
    cityId: 'malang',
    prefixes: [
      '0811303', '0811313', '081136', '081233', '081333', '081334', '0813545', '082140', '082334',
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
      '0811302', '0811331', '081234', '081335', '082141', '082335', '085235', '085258', '085335',
      '081456', '081556', '081656', '0855350', '0855351',
      '0856350', '0856351', '0856457', '0856458', '0856490', '0856491',
      '0857350', '0857351', '0857365', '085746', '085749', ...expandRange('085856', 0, 7, 1),
      '0817413', '0817414', '08180340', '08180341', '0877580',
    ],
  },
  {
    cityId: 'jember',
    prefixes: [
      '0811301', '081135', ...expandRange('081234', 5, 9, 1), '081336',
      '082336', '085236', '085259', '085336',
      '081459', '081559', '081659', '085536',
      ...expandRange('0856468', 5, 9, 1), '0856492', '0856493',
      '0857356', '0857460', '0857461', '0858545', '0858546', '0858547', '0858590', '0858591',
      '0817967', '0817968', '0817969', '087757', '087857',
    ],
  },
  { cityId: 'mojokerto', prefixes: ['08165460', '08165461', '0816548', '0816549', '0856462'] },
  { cityId: 'jombang', prefixes: ['08564621', '0858530'] },
  {
    cityId: 'tuban',
    prefixes: [
      '0815547', '0816546', '0816547',
      '085634', '0856459', '08564625', '08564626', '08564627',
      '0858540', '0858541', '0858542', '0858543',
    ],
  },
  { cityId: 'kediri', prefixes: ['085792'] },

  // --- BALI, NUSA TENGGARA BARAT & NUSA TENGGARA TIMUR ---
  {
    cityId: 'denpasar',
    prefixes: [
      '081138', '081139', '081236', '081238', '081239', '081337', '081338', ...expandRange('081353', 0, 3, 1),
      '082144', '082146', '082236', '082237', '082247', '082339', '082340',
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
      '0811390', '0811391', '081237', ...expandRange('081339', 5, 9, 1),
      '082145', '082341', '085239', '085339',
      '081458', '0815470', '0815471', '0815472', '0815474', ...expandRange('081658', 5, 9, 1),
      ...expandRange('085639', 5, 9, 1), '08564699', '0857392', '0857393', '08584700', '08584701', '0858582',
      '081736', '081757', '0818036', '081836', '081854', '081917', '087765', '0878650',
    ],
  },
  { cityId: 'sumbawa', prefixes: ['08123820', '08123821'] },
  {
    cityId: 'kupang',
    prefixes: [
      '0811381', '0811382', '0811383', '0811384', '0812379', '081339',
      '082147', '082342',
      '081529', '0815473', '081629', ...expandRange('0856469', 5, 8, 1), '0857394', '0857395',
    ],
  },

  // --- SUMATERA ---
  {
    cityId: 'bandaaceh',
    prefixes: [
      '081168', '081268', '081269', '081360', '081377', '082162', '082267', '082360', '082361', '085260', '085360',
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
      '082270', '082271', '082272', '082273', '082274', '082275', '082277',
      ...expandRange('0823', 62, 70),
      '085261', '085262', '085296', '085297',
      '085358', '085359', '085361', '085362', ...expandRange('0853', 70, 73),
      // Indosat Medan
      '081430', '081431', '081432', '081433',
      '081506', '081530', '081531', '081533', '081534', '081606', '081630', '081631', '081633',
      '085561', '085562', '085563',
      '085658', '0856605', '0856606', '085661', '085662', '085663', '085664',
      '085830', '085831', '0858338',
      // XL Medan
      ...expandRange('0819', 60, 74),
      ...expandRange('0877', 66, 69), '087867', '087868', '087869',
    ],
  },
  {
    cityId: 'pematangsiantar',
    prefixes: [
      '0811601', '0811620', '0811621', '0812620', '0812621', '0813628', '0813629',
      '0815334', '0855609', '0856581', '0856609', ...expandRange('0858336', 0, 7, 1),
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
      '082169', '082170', '082268', '082283', '082286', ...expandRange('0823', 85, 87),
      '085263', '085274', '085363', '085374', '085375',
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
      '081365', '081371', '081378',
      '082172', '082284', '082287', '082288', ...expandRange('0823', 81, 84),
      '085265', '085271', '085272', '085278', '085365', '085376',
      '081437', '081537', '081637', ...expandRange('085566', 6, 9, 1), ...expandRange('085567', 0, 3, 1),
      '0856582', ...expandRange('085666', 6, 9, 1), ...expandRange('085667', 6, 9, 1), '0856687', '0856688',
      '085767', ...expandRange('085837', 0, 4, 1),
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
      '081364', '081372',
      '082171', '082285', ...expandRange('0823', 88, 92),
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
      '085760', '085761', '085762', '085765',
    ],
  },
  { cityId: 'karimun', prefixes: ['0815369', '0816369'] },
  {
    cityId: 'jambi',
    prefixes: [
      '081174', '081274', '081366', '082178', '082280', '0822810', '082374', '085266', '0852672', '085366',
      '0814395', '0815322', ...expandRange('081539', 4, 9, 1), '0816320', ...expandRange('081639', 5, 9, 1),
      ...expandRange('085568', 6, 9, 1), '0855690',
      '0856642', '0856643', '0856686', '0856698', '085758', '085764', '085789',
      '0819252', '0819254', '081994', '0878912', '0878924', '087896',
    ],
  },
  {
    cityId: 'palembang',
    prefixes: [
      '081171', '081178', '081271', '081273', '081278',
      '081367', '0813682', '0813683', '0813684', '081373',
      '082175', '082176', '082179', ...expandRange('0821', 80, 84),
      '082269', '082278', '082279', '082281', '082289', ...expandRange('0823', 71, 73), '082378', '082380',
      '085267', '085268', '085273', '08529711',
      '085367', '085368', ...expandRange('0853', 77, 81),
      // Indosat Palembang
      '081438', '081441', '081507', '081532', '0815355', '0815356', '0815357', '081538',
      '081607', '081632', '0816355', '0816356', '0816357', '081638',
      '085567', '085667', ...expandRange('085669', 2, 5, 1), '085709', '085768', '085788', '0858380', '085838',
      // XL Palembang
      '081919', '081924', '081925', '081926', '081928', '081930', '081948', '081958', '081977', '081978', '081995', '081996',
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
      '082177', '082185', '082186', '0822815', '082282', '082376', '082377', '082379',
      '085269', '085279', '085369', '085383', '085384', '085385',
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
      '081150', '081151', '081250', '081251', '081348', '081349', '081350', '081351',
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

  // --- INTERNET-VERIFIED TRI (0895-0899), AXIS (0831-0838), SMARTFREN (0881-0889) & EKS-FLEXI (08510x) ---
  {
    cityId: 'jakarta',
    prefixes: [
      '085100', '085108', '085109',
      '08950', '08951', '08960', '08963', '08964', ...expandRange('0896', 50, 54),
      '08972', '08979', '08980', '089867', '08988', '08989',
      '089900', '089916', '08998', '08999', '089997',
      '08380', '08387', '08388', '08389', '083891',
      '08811', '088188', '088199', '088210', '088211', '08829', '08880', '08881', '08888', '08889',
    ],
  },
  {
    cityId: 'bekasi',
    prefixes: ['0895224', '08952243', '088213', '0882134'],
  },
  {
    cityId: 'tangsel',
    prefixes: ['0896478'],
  },
  {
    cityId: 'tangerang',
    prefixes: ['083813', '088214'],
  },
  {
    cityId: 'bogor',
    prefixes: ['0899955', '083810', '083811', '083819', '088212'],
  },
  {
    cityId: 'serang',
    prefixes: ['083812'],
  },
  {
    cityId: 'karawang',
    prefixes: ['083814'],
  },
  {
    cityId: 'purwakarta',
    prefixes: ['083816'],
  },
  {
    cityId: 'cianjur',
    prefixes: ['083817'],
  },
  {
    cityId: 'sukabumi',
    prefixes: ['083818'],
  },
  {
    cityId: 'bandung',
    prefixes: [
      '085101',
      '089520', '089521', '089655', '089656', '089657', '089660', '089662',
      '089757', '089777', '08986', '089869', '08987', '089878', '089888', '089977', '089979',
      '083820', '083821', '083822', '083827', '083828', '083829',
      '088120', '088121', '088122', '088123', '088218', '088222', '088223', '088820', '088821',
    ],
  },
  {
    cityId: 'cirebon',
    prefixes: ['089873', '083823', '083824'],
  },
  {
    cityId: 'sumedang',
    prefixes: ['083825'],
  },
  {
    cityId: 'tasikmalaya',
    prefixes: ['083826'],
  },
  {
    cityId: 'semarang',
    prefixes: [
      '085102',
      '089541', '089759', '089768', '08985', '089860', '089866', '08995', '089953',
      '083838', '083842', '083862',
      '088124', '088137', '088138', '088215', '088216', '088226', '088227', '088232', '088233',
    ],
  },
  {
    cityId: 'kudus',
    prefixes: ['089955'],
  },
  {
    cityId: 'pekalongan',
    prefixes: ['0838618', '0838619'],
  },
  {
    cityId: 'purwokerto',
    prefixes: ['0899961', '0838370', '083863'],
  },
  {
    cityId: 'solo',
    prefixes: ['089855', '083864', '083865', '083866', '088126'],
  },
  {
    cityId: 'yogyakarta',
    prefixes: [
      '089883', '089950', '089951', '089954', ...expandRange('0899', 70, 76), '089985', '089995',
      '083840', '083867', '083868', '083869',
      '088127', '088128', '088225',
    ],
  },
  {
    cityId: 'surabaya',
    prefixes: [
      '085103',
      '089530', '089531', '089532', '089533', '089667', '089675', '089676', '089677', '089678',
      '089705', '089706', '089707', '08973', '089734', '08978',
      '08983', '089833', '089834', '089835', '089837', '089838', '089839', '08993',
      '08310', '08313', ...expandRange('0831', 50, 55), '083157', '083158', '083159',
      '083830', '083831', '083832', '083833', '083839', '083849', '08385',
      '083854', '083856', '083857', '083858', '083859', '083860',
      '088130', '088131', '088132', '088133', '088134', '088135', '08819',
      '088217', '088228', '088231', '088234', '088235', '08883', '08884', '08885',
    ],
  },
  {
    cityId: 'pasuruan',
    prefixes: ['0831551', '083837'],
  },
  {
    cityId: 'malang',
    prefixes: [
      '089703', '089836', '089903', '089935',
      '083156', '083834', '083835', '083848',
      '088136', '088155', '088230',
    ],
  },
  {
    cityId: 'jember',
    prefixes: ['089670', '089700', '089701', '089702'],
  },
  {
    cityId: 'denpasar',
    prefixes: [
      '089722', '089898', '0899018', '089911', '089912',
      '08311', '083117', '083118', '083119', '083881', '083883',
      '08818', '088236', '088733', '088734', '088736',
    ],
  },
  {
    cityId: 'mataram',
    prefixes: ['083129', '088735'],
  },
  {
    cityId: 'pontianak',
    prefixes: ['089852'],
  },
  {
    cityId: 'palangkaraya',
    prefixes: ['089850'],
  },
  {
    cityId: 'balikpapan',
    prefixes: ['085105', '089708', '089859', '0899875'],
  },
  {
    cityId: 'makassar',
    prefixes: ['085104', '089818', '0898725', '089915', '089925'],
  },
  {
    cityId: 'medan',
    prefixes: [
      '085106',
      '089535', '0895351', '0895353', '089560', '089561', '089613', '089828', '089829', '089845', '089848',
      '08319', '083198',
      '08816', '08826', '08886',
    ],
  },
  {
    cityId: 'deliserdang',
    prefixes: ['0895613'],
  },
  {
    cityId: 'kabanjahe',
    prefixes: ['083191'],
  },
  {
    cityId: 'rantauprapat',
    prefixes: ['083193'],
  },
  {
    cityId: 'pematangsiantar',
    prefixes: ['083196'],
  },
  {
    cityId: 'bandaaceh',
    prefixes: ['089841', '083189'],
  },
  {
    cityId: 'lhokseumawe',
    prefixes: ['083188'],
  },
  {
    cityId: 'padang',
    prefixes: ['083181'],
  },
  {
    cityId: 'bukittinggi',
    prefixes: ['083180'],
  },
  {
    cityId: 'pekanbaru',
    prefixes: ['083186', '083378', '08827'],
  },
  {
    cityId: 'dumai',
    prefixes: ['083185'],
  },
  {
    cityId: 'batam',
    prefixes: ['089766', '089840', '083183'],
  },
  {
    cityId: 'tanjungpinang',
    prefixes: ['0899200', '083372'],
  },
  {
    cityId: 'jambi',
    prefixes: ['0899880', '083171'],
  },
  {
    cityId: 'palembang',
    prefixes: [
      '085107',
      '089627', '089822', '089823', '089844', '089923',
      '083177',
      '08817', '08828', '08887',
    ],
  },
  {
    cityId: 'muaraenim',
    prefixes: ['083176'],
  },
  {
    cityId: 'bandarlampung',
    prefixes: ['089842', '089922', '083170'],
  },
  {
    cityId: 'kotabumi',
    prefixes: ['083169'],
  },
];

// ============================================================================
// REGIONAL CLUSTER HLR RULES (RESTORED VERSI PERTAMA + MULTI-DIGIT SAFETY NET)
// Used when an operator prefix covers a multi-city MSC cluster (e.g. Jabodetabek,
// Priangan/Jabar, Jateng-DIY, Jatim, Sumbagut, Sumbagsel, Kalimantan, Sulawesi).
// Every cluster maps to a REAL primary HLR hub city + GPS + explicit coverage!
// ============================================================================
interface ClusterHlrRule {
  hubCityId: CityId;
  clusterTitle?: string;
  coverage: string;
  provinceLabel?: string;
  prefixes: string[];
}

const CLUSTER_HLR_RULES: ClusterHlrRule[] = [
  {
    hubCityId: 'jakarta',
    clusterTitle: 'DKI Jakarta (Cluster Jabodetabek)',
    coverage: 'DKI Jakarta, Bekasi, Tangerang, Bogor & Depok',
    provinceLabel: 'DKI Jakarta / Jawa Barat / Banten',
    prefixes: [
      '08810', '088108',
      ...expandRange('0812', 80, 99),
      ...expandRange('0813', 10, 19),
      ...expandRange('0813', 80, 89),
      ...expandRange('0821', 10, 14),
      ...expandRange('0821', 22, 25),
      ...expandRange('0822', 10, 13),
      ...expandRange('0822', 98, 99),
      ...expandRange('0823', 10, 12),
      ...expandRange('0852', 10, 19),
      ...expandRange('0852', 80, 89),
      ...expandRange('0853', 10, 13),
      ...expandRange('0814', 10, 13),
      ...expandRange('0815', 10, 19),
      ...expandRange('0815', 80, 86),
      ...expandRange('0815', 90, 99),
      ...expandRange('0816', 10, 19),
      ...expandRange('0855', 10, 19),
      ...expandRange('0855', 70, 99),
      ...expandRange('0856', 10, 19),
      ...expandRange('0856', 70, 99),
      ...expandRange('0857', 10, 19),
      ...expandRange('0857', 70, 82),
      ...expandRange('0858', 10, 19),
      ...expandRange('0858', 80, 94),
      ...expandRange('0817', 0, 19),
      ...expandRange('0817', 60, 79),
      ...expandRange('0818', 0, 19),
      ...expandRange('0818', 60, 89),
      ...expandRange('0819', 0, 9),
      ...expandRange('0819', 30, 32),
      ...expandRange('0859', 20, 29),
      ...expandRange('0859', 45, 47),
      ...expandRange('0859', 59, 60),
      ...expandRange('0877', 70, 89),
      ...expandRange('0878', 0, 9),
      ...expandRange('0878', 70, 89),
      ...expandRange('0838', 0, 19),
      ...expandRange('0838', 70, 79),
      ...expandRange('0838', 90, 99),
      ...expandRange('0895', 0, 19),
      ...expandRange('0895', 32, 34),
      ...expandRange('0896', 0, 6),
      ...expandRange('0896', 30, 39),
      ...expandRange('0896', 50, 54),
      ...expandRange('0882', 10, 14),
      ...expandRange('0882', 89, 99),
    ],
  },
  {
    hubCityId: 'bandung',
    clusterTitle: 'Kota Bandung (Cluster Jawa Barat)',
    coverage: 'Kota Bandung, Cimahi, Cirebon, Sukabumi, Tasikmalaya & Karawang',
    prefixes: [
      '08812', '08882',
      ...expandRange('0812', 14, 14),
      ...expandRange('0812', 20, 24),
      ...expandRange('0813', 20, 24),
      ...expandRange('0813', 94, 95),
      ...expandRange('0821', 15, 21),
      ...expandRange('0821', 26, 30),
      ...expandRange('0822', 14, 19),
      ...expandRange('0822', 40, 40),
      ...expandRange('0823', 15, 21),
      ...expandRange('0852', 20, 24),
      ...expandRange('0852', 94, 95),
      ...expandRange('0853', 14, 24),
      ...expandRange('0814', 60, 62),
      ...expandRange('0815', 60, 64),
      ...expandRange('0815', 70, 73),
      ...expandRange('0855', 20, 24),
      ...expandRange('0856', 20, 24),
      ...expandRange('0856', 59, 59),
      ...expandRange('0857', 20, 24),
      ...expandRange('0857', 93, 98),
      ...expandRange('0858', 60, 64),
      ...expandRange('0858', 71, 72),
      ...expandRange('0817', 20, 23),
      ...expandRange('0817', 42, 43),
      ...expandRange('0818', 20, 23),
      ...expandRange('0819', 10, 12),
      ...expandRange('0859', 56, 56),
      ...expandRange('0859', 74, 75),
      ...expandRange('0877', 20, 29),
      ...expandRange('0878', 20, 29),
      ...expandRange('0831', 0, 9),
      ...expandRange('0838', 20, 29),
      ...expandRange('0896', 55, 58),
      ...expandRange('0882', 18, 23),
    ],
  },
  {
    hubCityId: 'semarang',
    clusterTitle: 'Kota Semarang (Cluster Jateng & DIY)',
    coverage: 'Kota Semarang, Surakarta (Solo), Yogyakarta, Purwokerto, Tegal & Pekalongan',
    provinceLabel: 'Jawa Tengah / DI Yogyakarta',
    prefixes: [
      '08814', '08815',
      ...expandRange('0812', 15, 15),
      ...expandRange('0812', 25, 29),
      ...expandRange('0813', 25, 29),
      ...expandRange('0813', 90, 93),
      ...expandRange('0821', 33, 38),
      ...expandRange('0822', 20, 27),
      ...expandRange('0822', 41, 43),
      ...expandRange('0823', 22, 29),
      ...expandRange('0852', 25, 29),
      ...expandRange('0852', 90, 93),
      ...expandRange('0853', 25, 29),
      ...expandRange('0815', 42, 42),
      ...expandRange('0815', 65, 69),
      ...expandRange('0815', 75, 79),
      ...expandRange('0855', 26, 29),
      ...expandRange('0856', 40, 43),
      ...expandRange('0856', 47, 47),
      ...expandRange('0857', 25, 29),
      ...expandRange('0857', 40, 43),
      ...expandRange('0857', 47, 47),
      ...expandRange('0858', 65, 70),
      ...expandRange('0858', 75, 79),
      ...expandRange('0817', 24, 29),
      ...expandRange('0817', 40, 41),
      ...expandRange('0817', 44, 46),
      ...expandRange('0818', 24, 29),
      ...expandRange('0819', 14, 15),
      ...expandRange('0859', 50, 52),
      ...expandRange('0877', 30, 39),
      ...expandRange('0878', 30, 39),
      ...expandRange('0831', 20, 29),
      ...expandRange('0838', 38, 44),
      ...expandRange('0838', 60, 69),
      ...expandRange('0895', 36, 42),
      ...expandRange('0896', 65, 74),
      ...expandRange('0882', 15, 16),
      ...expandRange('0882', 24, 27),
      ...expandRange('0882', 32, 33),
    ],
  },
  {
    hubCityId: 'surabaya',
    clusterTitle: 'Kota Surabaya (Cluster Jawa Timur)',
    coverage: 'Kota Surabaya, Sidoarjo, Gresik, Malang, Kediri, Madiun & Jember',
    prefixes: [
      '08813',
      ...expandRange('0812', 16, 17),
      ...expandRange('0812', 30, 35),
      ...expandRange('0812', 49, 49),
      ...expandRange('0812', 52, 52),
      ...expandRange('0812', 59, 59),
      ...expandRange('0813', 30, 36),
      ...expandRange('0821', 31, 32),
      ...expandRange('0821', 39, 43),
      ...expandRange('0822', 28, 34),
      ...expandRange('0822', 44, 45),
      ...expandRange('0822', 57, 57),
      ...expandRange('0823', 30, 38),
      ...expandRange('0852', 30, 36),
      ...expandRange('0852', 57, 59),
      ...expandRange('0853', 30, 36),
      ...expandRange('0815', 15, 15),
      ...expandRange('0815', 50, 56),
      ...expandRange('0855', 30, 36),
      ...expandRange('0855', 46, 49),
      ...expandRange('0856', 30, 36),
      ...expandRange('0856', 45, 46),
      ...expandRange('0856', 48, 50),
      ...expandRange('0856', 55, 55),
      ...expandRange('0857', 30, 36),
      ...expandRange('0857', 45, 46),
      ...expandRange('0857', 48, 50),
      ...expandRange('0857', 84, 85),
      ...expandRange('0857', 90, 92),
      ...expandRange('0858', 50, 56),
      ...expandRange('0858', 95, 95),
      ...expandRange('0817', 30, 39),
      ...expandRange('0817', 50, 52),
      ...expandRange('0818', 30, 39),
      ...expandRange('0818', 50, 59),
      ...expandRange('0819', 13, 13),
      ...expandRange('0819', 36, 39),
      ...expandRange('0859', 31, 36),
      ...expandRange('0859', 54, 54),
      ...expandRange('0877', 50, 59),
      ...expandRange('0878', 50, 59),
      ...expandRange('0831', 10, 19),
      ...expandRange('0838', 30, 37),
      ...expandRange('0838', 45, 59),
      ...expandRange('0896', 75, 84),
      ...expandRange('0882', 17, 17),
      ...expandRange('0882', 28, 31),
      ...expandRange('0882', 34, 35),
    ],
  },
  {
    hubCityId: 'denpasar',
    clusterTitle: 'Kota Denpasar (Cluster Bali & Nusra)',
    coverage: 'Kota Denpasar, Badung, Singaraja, Mataram (NTB) & Kupang (NTT)',
    provinceLabel: 'Bali / NTB / NTT',
    prefixes: [
      ...expandRange('0812', 36, 39),
      ...expandRange('0812', 46, 46),
      ...expandRange('0813', 37, 39),
      ...expandRange('0813', 53, 53),
      ...expandRange('0821', 44, 47),
      ...expandRange('0822', 35, 37),
      ...expandRange('0822', 47, 47),
      ...expandRange('0823', 39, 42),
      ...expandRange('0852', 37, 39),
      ...expandRange('0852', 53, 53),
      ...expandRange('0853', 37, 39),
      ...expandRange('0815', 57, 58),
      ...expandRange('0856', 37, 39),
      ...expandRange('0857', 37, 39),
      ...expandRange('0857', 92, 92),
      ...expandRange('0858', 57, 58),
      ...expandRange('0817', 47, 47),
      ...expandRange('0817', 55, 57),
      ...expandRange('0818', 55, 56),
      ...expandRange('0819', 16, 17),
      ...expandRange('0819', 99, 99),
      ...expandRange('0859', 35, 35),
      ...expandRange('0877', 60, 65),
      ...expandRange('0878', 60, 66),
      ...expandRange('0831', 14, 19),
      ...expandRange('0896', 85, 86),
    ],
  },
  {
    hubCityId: 'medan',
    clusterTitle: 'Kota Medan (Cluster Sumatera Utara & Aceh)',
    coverage: 'Kota Medan, Deli Serdang, Binjai, Pematangsiantar, Banda Aceh & Lhokseumawe',
    provinceLabel: 'Sumatera Utara / Aceh',
    prefixes: [
      ...expandRange('0811', 60, 65),
      ...expandRange('0812', 60, 65),
      ...expandRange('0813', 60, 62),
      ...expandRange('0813', 70, 70),
      ...expandRange('0813', 75, 77),
      ...expandRange('0813', 96, 97),
      ...expandRange('0821', 60, 68),
      ...expandRange('0822', 67, 67),
      ...expandRange('0822', 70, 77),
      ...expandRange('0823', 60, 70),
      ...expandRange('0852', 60, 62),
      ...expandRange('0852', 70, 70),
      ...expandRange('0852', 75, 77),
      ...expandRange('0852', 96, 97),
      ...expandRange('0853', 58, 62),
      ...expandRange('0853', 70, 73),
      ...expandRange('0814', 30, 34),
      ...expandRange('0815', 30, 34),
      ...expandRange('0816', 30, 34),
      ...expandRange('0856', 60, 64),
      ...expandRange('0857', 60, 63),
      ...expandRange('0858', 30, 34),
      ...expandRange('0817', 48, 49),
      ...expandRange('0819', 60, 74),
      ...expandRange('0877', 66, 69),
      ...expandRange('0878', 67, 69),
      ...expandRange('0831', 90, 99),
      '089535',
    ],
  },
  {
    hubCityId: 'pekanbaru',
    clusterTitle: 'Kota Pekanbaru (Cluster Sumatera Bagian Tengah)',
    coverage: 'Kota Pekanbaru, Dumai, Padang, Bukittinggi, Batam & Tanjungpinang',
    provinceLabel: 'Riau / Sumatera Barat / Kepulauan Riau',
    prefixes: [
      ...expandRange('0811', 66, 70),
      ...expandRange('0811', 75, 77),
      ...expandRange('0812', 66, 68),
      ...expandRange('0812', 70, 70),
      ...expandRange('0812', 75, 77),
      ...expandRange('0813', 63, 65),
      ...expandRange('0813', 71, 72),
      ...expandRange('0813', 74, 74),
      ...expandRange('0813', 78, 78),
      ...expandRange('0821', 69, 74),
      ...expandRange('0822', 68, 68),
      ...expandRange('0822', 83, 88),
      ...expandRange('0823', 81, 92),
      ...expandRange('0852', 63, 65),
      ...expandRange('0852', 71, 72),
      ...expandRange('0852', 74, 74),
      ...expandRange('0852', 78, 78),
      ...expandRange('0853', 63, 65),
      ...expandRange('0853', 74, 76),
      ...expandRange('0814', 35, 37),
      ...expandRange('0815', 35, 37),
      ...expandRange('0816', 35, 37),
      ...expandRange('0856', 65, 68),
      ...expandRange('0857', 65, 67),
      ...expandRange('0858', 35, 37),
      ...expandRange('0819', 27, 30),
      ...expandRange('0819', 48, 49),
      ...expandRange('0819', 90, 93),
      ...expandRange('0877', 91, 93),
      ...expandRange('0878', 93, 95),
      ...expandRange('0831', 80, 89),
    ],
  },
  {
    hubCityId: 'palembang',
    clusterTitle: 'Kota Palembang (Cluster Sumatera Bagian Selatan)',
    coverage: 'Kota Palembang, Bandar Lampung, Jambi, Bengkulu & Pangkalpinang',
    provinceLabel: 'Sumatera Selatan / Lampung / Jambi / Bengkulu / Babel',
    prefixes: [
      ...expandRange('0811', 71, 74),
      ...expandRange('0811', 78, 79),
      ...expandRange('0812', 71, 74),
      ...expandRange('0812', 78, 79),
      ...expandRange('0813', 57, 59),
      ...expandRange('0813', 66, 69),
      ...expandRange('0813', 73, 73),
      ...expandRange('0813', 79, 79),
      ...expandRange('0821', 75, 86),
      ...expandRange('0822', 69, 69),
      ...expandRange('0822', 78, 82),
      ...expandRange('0822', 89, 89),
      ...expandRange('0823', 71, 80),
      ...expandRange('0852', 66, 69),
      ...expandRange('0852', 73, 73),
      ...expandRange('0852', 79, 79),
      ...expandRange('0853', 66, 69),
      ...expandRange('0853', 77, 85),
      ...expandRange('0814', 38, 41),
      ...expandRange('0815', 38, 41),
      ...expandRange('0816', 38, 41),
      ...expandRange('0856', 58, 58),
      ...expandRange('0856', 69, 69),
      '085709',
      ...expandRange('0857', 58, 58),
      ...expandRange('0857', 64, 64),
      ...expandRange('0857', 68, 69),
      ...expandRange('0857', 83, 83),
      ...expandRange('0857', 88, 89),
      ...expandRange('0858', 38, 41),
      ...expandRange('0819', 19, 26),
      ...expandRange('0819', 58, 58),
      ...expandRange('0819', 75, 79),
      ...expandRange('0819', 94, 98),
      ...expandRange('0877', 94, 99),
      ...expandRange('0878', 96, 99),
      ...expandRange('0831', 60, 79),
      ...expandRange('0896', 25, 29),
    ],
  },
  {
    hubCityId: 'balikpapan',
    clusterTitle: 'Kota Balikpapan (Cluster Kalimantan)',
    coverage: 'Kota Balikpapan, Samarinda, Banjarmasin, Pontianak, Palangka Raya & Tarakan',
    provinceLabel: 'Kalimantan Timur / Kalsel / Kalbar / Kalteng / Kaltara',
    prefixes: [
      ...expandRange('0812', 50, 51),
      ...expandRange('0812', 53, 58),
      ...expandRange('0813', 45, 52),
      ...expandRange('0821', 48, 59),
      ...expandRange('0822', 50, 56),
      ...expandRange('0822', 58, 59),
      ...expandRange('0823', 50, 59),
      ...expandRange('0852', 45, 52),
      ...expandRange('0853', 45, 52),
      ...expandRange('0853', 86, 93),
      ...expandRange('0815', 20, 22),
      ...expandRange('0815', 28, 28),
      ...expandRange('0815', 45, 45),
      ...expandRange('0815', 49, 49),
      ...expandRange('0856', 50, 54),
      ...expandRange('0857', 50, 54),
      ...expandRange('0857', 87, 87),
      ...expandRange('0858', 20, 22),
      ...expandRange('0858', 28, 28),
      ...expandRange('0858', 45, 45),
      ...expandRange('0858', 49, 49),
      ...expandRange('0819', 52, 55),
      ...expandRange('0877', 14, 19),
      ...expandRange('0878', 14, 19),
      ...expandRange('0831', 40, 53),
      ...expandRange('0896', 90, 94),
    ],
  },
  {
    hubCityId: 'makassar',
    clusterTitle: 'Kota Makassar (Cluster Sulawesi)',
    coverage: 'Kota Makassar, Parepare, Manado, Palu, Kendari & Gorontalo',
    provinceLabel: 'Sulawesi Selatan / Sulut / Sulteng / Sultra / Gorontalo',
    prefixes: [
      ...expandRange('0812', 40, 45),
      ...expandRange('0813', 40, 43),
      ...expandRange('0813', 54, 56),
      ...expandRange('0821', 87, 96),
      ...expandRange('0822', 59, 62),
      ...expandRange('0822', 90, 96),
      ...expandRange('0823', 43, 49),
      ...expandRange('0823', 93, 96),
      ...expandRange('0852', 40, 43),
      ...expandRange('0852', 54, 56),
      ...expandRange('0852', 98, 99),
      ...expandRange('0853', 40, 43),
      ...expandRange('0853', 94, 99),
      ...expandRange('0815', 23, 27),
      ...expandRange('0815', 43, 43),
      ...expandRange('0856', 56, 57),
      ...expandRange('0856', 96, 96),
      ...expandRange('0857', 56, 57),
      ...expandRange('0857', 96, 96),
      ...expandRange('0858', 23, 27),
      ...expandRange('0819', 40, 44),
      ...expandRange('0877', 40, 43),
      ...expandRange('0878', 40, 46),
      ...expandRange('0831', 30, 39),
      ...expandRange('0896', 95, 97),
    ],
  },
  {
    hubCityId: 'jayapura',
    clusterTitle: 'Kota Jayapura (Cluster Maluku & Tanah Papua)',
    coverage: 'Kota Jayapura, Sorong, Manokwari, Merauke, Timika, Ambon & Ternate',
    provinceLabel: 'Papua / Papua Barat / Maluku / Maluku Utara',
    prefixes: [
      ...expandRange('0812', 47, 48),
      ...expandRange('0813', 44, 44),
      ...expandRange('0821', 97, 99),
      ...expandRange('0822', 38, 39),
      ...expandRange('0822', 48, 48),
      ...expandRange('0823', 97, 99),
      ...expandRange('0852', 44, 44),
      ...expandRange('0853', 44, 44),
      ...expandRange('0853', 54, 54),
      ...expandRange('0815', 29, 29),
    ],
  },
];

// Build deduplicated O(1) prefix maps + normalized city coordinate lookup
const CURATED_PREFIX_MAP = new Map<string, CityGeoInfo>();
const CLUSTER_PREFIX_MAP = new Map<
  string,
  {
    hub: CityGeoInfo;
    clusterTitle: string;
    coverage: string;
    provinceLabel: string;
  }
>();
const CITY_NAME_TO_GEO = new Map<string, CityGeoInfo>();

function normCityKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(kota|kabupaten|kab\.?)\b/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\d+$/g, '')
    .replace(/[^a-z0-9]/g, '');
}

for (const info of Object.values(CITY_GEO_REGISTRY)) {
  const k = normCityKey(info.city);
  if (k && !CITY_NAME_TO_GEO.has(k)) {
    CITY_NAME_TO_GEO.set(k, info);
  }
}

// Common Indonesian short aliases in HLR tables -> canonical CITY_GEO_REGISTRY entries
const CITY_ALIAS_TO_ID: Record<string, CityId> = {
  jakarta: 'jakarta',
  surakarta: 'solo',
  solo: 'solo',
  jogja: 'yogyakarta',
  yogya: 'yogyakarta',
  diyogyakarta: 'yogyakarta',
  dki: 'jakarta',
  dkijakarta: 'jakarta',
  jakartatimur: 'jakarta',
  jakartabarat: 'jakarta',
  jakartaselatan: 'jakarta',
  jakartautara: 'jakarta',
  tangerangselatan: 'tangsel',
  ujungpandang: 'makassar',
  padangsidimpuan: 'padangsidempuan',
  padangsidempuan: 'padangsidempuan',
  tanjungpandan: 'belitung',
  belitung: 'belitung',
  tanjungtabalong: 'tabalong',
  tabalong: 'tabalong',
  tanjungbalaikarimun: 'karimun',
  karimun: 'karimun',
  kotawaringintimur: 'sampit',
  kotawaringinbarat: 'pangkalanbun',
  baritoutara: 'muarateweh',
  kutaitimur: 'bontang',
  tanatoraja: 'rantepao',
  toraja: 'rantepao',
  bone: 'watampone',
  okutimur: 'martapura',
  lampungutara: 'kotabumi',
  sumbawa: 'sumbawa',
  sumbawabesar: 'sumbawa',
  muntok: 'mentok',
};

for (const [alias, id] of Object.entries(CITY_ALIAS_TO_ID)) {
  if (!CITY_NAME_TO_GEO.has(alias)) {
    CITY_NAME_TO_GEO.set(alias, CITY_GEO_REGISTRY[id]);
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

for (const rule of CLUSTER_HLR_RULES) {
  const hub = CITY_GEO_REGISTRY[rule.hubCityId];
  const entry = {
    hub,
    clusterTitle: rule.clusterTitle || `${hub.city} (Cluster Regional HLR)`,
    coverage: rule.coverage,
    provinceLabel: rule.provinceLabel || hub.province,
  };
  for (const rawPrefix of rule.prefixes) {
    const p = rawPrefix.trim();
    if (!p || CLUSTER_PREFIX_MAP.has(p)) continue;
    CLUSTER_PREFIX_MAP.set(p, entry);
  }
}

interface DbResolvedEntry {
  city: string;
  province: string;
  clusterCoverage?: string;
  coordinates?: { lat: number; lon: number };
  isCluster: boolean;
}

function resolveZeroDropFromDbIndex(dbIdx: number): DbResolvedEntry | null {
  const tuple = HLR_CITY_TABLE[dbIdx];
  if (!tuple) return null;
  const [rawLabel, rawMapQuery] = tuple;
  const cleanLabel = rawLabel.replace(/\b([A-Za-z]+)\d+\b/g, '$1').trim();

  // 1. Jabodetabek & Greater Jakarta satellite/umbrella clusters
  if (/\bjabodetabek\b/i.test(cleanLabel)) {
    if (/^bekasi\b/i.test(cleanLabel)) {
      const geo = CITY_GEO_REGISTRY.bekasi;
      return {
        city: geo.city,
        province: geo.province,
        clusterCoverage: 'Kota Bekasi & Jakarta Timur (Jabodetabek)',
        coordinates: { lat: geo.lat, lon: geo.lon },
        isCluster: true,
      };
    }
    if (/^bogor\b/i.test(cleanLabel)) {
      const geo = CITY_GEO_REGISTRY.bogor;
      return {
        city: geo.city,
        province: geo.province,
        clusterCoverage: 'Bogor, Depok & Tangerang (Jabodetabek)',
        coordinates: { lat: geo.lat, lon: geo.lon },
        isCluster: true,
      };
    }
    if (/^dki jakarta\s*&\s*tangerang/i.test(cleanLabel)) {
      const geo = CITY_GEO_REGISTRY.jakarta;
      return {
        city: geo.city,
        province: 'DKI Jakarta / Banten',
        clusterCoverage: 'DKI Jakarta & Tangerang (Jabodetabek)',
        coordinates: { lat: geo.lat, lon: geo.lon },
        isCluster: true,
      };
    }
    // General Jabodetabek HLR Pool (incl. 08810 / 088108 Smartfren, 0811/0812/0815/0817/0896 Jabodetabek)
    const geo = CITY_GEO_REGISTRY.jakarta;
    return {
      city: 'DKI Jakarta (Cluster Jabodetabek)',
      province: 'DKI Jakarta / Jawa Barat / Banten',
      clusterCoverage: 'DKI Jakarta, Bekasi, Tangerang, Bogor & Depok',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }

  // 2. Macro regional/island rows in HLR_CITY_TABLE -> map to official MSC hub city (ZERO drop!)
  if (/^jawa barat\b/i.test(cleanLabel) || /\b(priangan|bandung raya)\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.bandung;
    return {
      city: `${geo.city} (Cluster Jawa Barat)`,
      province: geo.province,
      clusterCoverage: cleanLabel.replace(/,\s*Jawa Barat$/i, ''),
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^jawa tengah\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.semarang;
    return {
      city: `${geo.city} (Cluster Jateng & DIY)`,
      province: 'Jawa Tengah / DI Yogyakarta',
      clusterCoverage: 'Kota Semarang, Surakarta (Solo), Purwokerto & DI Yogyakarta',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^jawa timur\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.surabaya;
    return {
      city: `${geo.city} (Cluster Jawa Timur)`,
      province: geo.province,
      clusterCoverage: 'Kota Surabaya, Sidoarjo, Malang, Kediri & Jember',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^bali\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.denpasar;
    return {
      city: `${geo.city} (Cluster Bali & Nusra)`,
      province: 'Bali / NTB / NTT',
      clusterCoverage: 'Kota Denpasar, Singaraja, Mataram & Kupang',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^kalimantan\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.balikpapan;
    return {
      city: `${geo.city} (Cluster Kalimantan)`,
      province: 'Kalimantan Timur / Kalsel / Kalbar / Kalteng',
      clusterCoverage: 'Kota Balikpapan, Samarinda, Banjarmasin & Pontianak',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^sumat(e)?ra\s+bagian\s+tengah/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.pekanbaru;
    return {
      city: `${geo.city} (Cluster Sumatera Bagian Tengah)`,
      province: 'Riau / Sumatera Barat / Kepulauan Riau',
      clusterCoverage: 'Kota Pekanbaru, Padang & Batam',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }
  if (/^sumat(e)?ra\b/i.test(cleanLabel)) {
    const geo = CITY_GEO_REGISTRY.medan;
    return {
      city: `${geo.city} (Cluster Sumatera Utara)`,
      province: 'Sumatera Utara / Aceh',
      clusterCoverage: 'Kota Medan, Deli Serdang, Pematangsiantar & Banda Aceh',
      coordinates: { lat: geo.lat, lon: geo.lon },
      isCluster: true,
    };
  }

  // 3. Standard single-city OR multi-city regional HLR entries (e.g. "Bandung, Cirebon...", "Kota Surabaya & Sidoarjo", "Kota Medan (Sumatera Bagian Utara)", "Eks-Flexi HLR")
  const labelWithoutFlexi = cleanLabel.replace(/\(\s*eks-flexi[^)]*\)/gi, '').trim();
  const normalizedKotaKab = labelWithoutFlexi.replace(/^kota\s*[&/]\s*kab\.?\s+/i, 'Kota ');
  const commaParts = normalizedKotaKab
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const firstSegment = commaParts[0] || '';
  const isParentheticalAliasPair =
    /^([^/]+?)\s*\/\s*([^,/]+)$/i.test(firstSegment) &&
    Boolean(CITY_NAME_TO_GEO.get(normCityKey(firstSegment.split('/')[0].trim()))) &&
    CITY_NAME_TO_GEO.get(normCityKey(firstSegment.split('/')[0].trim()))?.city
      .toLowerCase()
      .includes(firstSegment.split('/')[1].trim().toLowerCase());

  const hasMultiCityConnector =
    !isParentheticalAliasPair &&
    (/\s+(?:&|\/|dan)\s+/i.test(firstSegment) ||
      commaParts.length >= 3 ||
      /\b(sumatera bagian|indonesia timur|jateng-diy)\b/i.test(labelWithoutFlexi));

  const primaryRawCity = firstSegment
    .split(/\s*(?:\/|&)\s*/)[0]
    .replace(/\([^)]*\)/g, '')
    .trim();

  // Also check rawMapQuery's primary city when primaryRawCity isn't in CITY_NAME_TO_GEO
  const mapCityCandidate = (rawMapQuery.split(',')[0] || '')
    .replace(/\([^)]*\)/g, '')
    .trim();

  const matchedGeo =
    CITY_NAME_TO_GEO.get(normCityKey(primaryRawCity)) ||
    CITY_NAME_TO_GEO.get(normCityKey(mapCityCandidate));

  const mapParts = rawMapQuery
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^indonesia$/i.test(s));
  const fallbackProvince = (
    (!hasMultiCityConnector ? commaParts[1] : '') ||
    (mapParts.length >= 2 ? mapParts[mapParts.length - 1] : '') ||
    matchedGeo?.province ||
    'Indonesia'
  )
    .replace(/^d\.i\.\s*yogyakarta$/i, 'DI Yogyakarta')
    .trim();

  const resolvedCity = matchedGeo ? matchedGeo.city : primaryRawCity || mapCityCandidate;
  const resolvedProvince = matchedGeo ? matchedGeo.province : fallbackProvince;
  const resolvedCoords = matchedGeo
    ? { lat: matchedGeo.lat, lon: matchedGeo.lon }
    : undefined;

  if (hasMultiCityConnector) {
    return {
      city: resolvedCity,
      province: resolvedProvince,
      clusterCoverage: normalizedKotaKab,
      ...(resolvedCoords ? { coordinates: resolvedCoords } : {}),
      isCluster: true,
    };
  }

  return {
    city: resolvedCity,
    province: resolvedProvince,
    ...(resolvedCoords ? { coordinates: resolvedCoords } : {}),
    isCluster: false,
  };
}

// Corrupted / obsolete legacy entries in HLR_PREFIX_INDEX (e.g. Flexi Papua ghosts on
// Kartu As Jabodetabek 08528x, Fren 2008 CDMA ghosts on 08886x/70-71, and over-broad
// 5-digit catch-alls that hijacked sub-blocks across islands).
const IGNORED_CORRUPT_DB_PREFIXES = new Set<string>([
  '085284', '085286', '085287', '085288',
  '0819250',
  '08560', '08570', '08579', '08197', '08199', '08815',
  '08952', '08953', '08992', '08996', '08997',
  '088860', '088861', '088862', '088863', '088864', '088865', '088866', '088867', '088868', '088869',
  '088870', '088871',
]);

export function lookupIndonesianMobileHlr(local08: string): HlrLookupMatch {
  const clean = local08.replace(/\D/g, '');
  const maxLen = Math.min(clean.length, 10);

  // TIER 1 & TIER 2: Longest-prefix-first (10 -> 5 digits) across Curated 1-City Rules + 42,000+ HLR_PREFIX_INDEX
  for (let len = maxLen; len >= 5; len--) {
    const sub = clean.slice(0, len);

    const triLongNeedsShiftedPrefix = clean.startsWith('0895') && clean.length >= 13 && len < 7;
    const curated = triLongNeedsShiftedPrefix ? undefined : CURATED_PREFIX_MAP.get(sub);
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
          ? `Presisi Tinggi — Kota/Kabupaten HLR (${len} Digit)`
          : `Presisi Kota Induk HLR (${len} Digit)`,
        basisNote: `Kode HLR Operator \`${sub}\` (${city}, ${province})`,
      };
    }

    // Older Tri tables often encode short prefixes without the shifted HLR digits used by 13-digit ranges.
    const dbIdx = !triLongNeedsShiftedPrefix && !IGNORED_CORRUPT_DB_PREFIXES.has(sub)
      ? HLR_PREFIX_INDEX[sub]
      : undefined;
    if (dbIdx !== undefined) {
      const resolved = resolveZeroDropFromDbIndex(dbIdx);
      if (resolved) {
        const { city, province, clusterCoverage, coordinates, isCluster } = resolved;
        if (!isCluster) {
          const isDeep = len >= 6;
          return {
            city,
            province,
            region: `${city}, ${province}`,
            mapQuery: `${city}, ${province}, Indonesia`,
            ...(coordinates ? { coordinates } : {}),
            matchedPrefix: sub,
            accuracyTier: 'high',
            precisionLevel: isDeep ? 'city_6_8_digit' : 'city_5_digit',
            precisionLabel: isDeep
              ? `Presisi Tinggi — Kota/Kabupaten HLR (${len} Digit)`
              : `Presisi Kota Induk HLR (${len} Digit)`,
            basisNote: `Kode HLR Operator \`${sub}\` (${city}, ${province})`,
          };
        }

        const cleanMapCity = city.replace(/\s*\([^)]*\)\s*/g, '').trim();
        return {
          city,
          province,
          region: clusterCoverage ? `${city} (${clusterCoverage})` : `${city}, ${province}`,
          clusterCoverage,
          mapQuery: `${cleanMapCity}, Indonesia`,
          ...(coordinates ? { coordinates } : {}),
          matchedPrefix: sub,
          accuracyTier: 'cluster',
          precisionLevel: 'regional_cluster',
          precisionLabel: `Presisi Cluster Regional HLR (${len} Digit)`,
          basisNote: `Blok HLR Regional \`${sub}\` (${cleanMapCity} — ${clusterCoverage || province})`,
        };
      }
    }

    // TIER 3: Restored Versi Pertama Multi-Digit Regional Cluster HLR Rules (6 -> 5 digits)
    const clusterRule = CLUSTER_PREFIX_MAP.get(sub);
    if (clusterRule) {
      const { hub, clusterTitle, coverage, provinceLabel } = clusterRule;
      return {
        city: clusterTitle,
        province: provinceLabel,
        region: `${clusterTitle} — ${coverage}`,
        clusterCoverage: coverage,
        mapQuery: `${hub.city}, ${hub.province}, Indonesia`,
        coordinates: { lat: hub.lat, lon: hub.lon },
        matchedPrefix: sub,
        accuracyTier: 'cluster',
        precisionLevel: 'regional_cluster',
        precisionLabel: `Presisi Cluster Regional HLR (${len} Digit)`,
        basisNote: `Blok HLR Regional \`${sub}\` (${hub.city})`,
      };
    }
  }

  // Unknown/mobile allocations are national or unverified; do not infer a city from one digit.
  return {
    city: 'Alokasi Seluler Nasional',
    province: 'Indonesia (non-geografis)',
    region: 'Alokasi Seluler Nasional (kota tidak dapat dipastikan dari prefix)',
    clusterCoverage: 'Prefix tidak memiliki pemetaan HLR regional yang cukup terverifikasi',
    mapQuery: 'Indonesia',
    matchedPrefix: clean.slice(0, Math.min(4, clean.length)),
    accuracyTier: 'national',
    precisionLevel: 'national_pool',
    precisionLabel: 'Alokasi Nasional — lokasi kota tidak terverifikasi',
    basisNote: 'NDC seluler bersifat non-geografis; tidak menebak kota dari digit yang tidak tervalidasi',
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
