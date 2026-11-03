import defaultMikuAvatar from '../assets/miku-avatar.jpg';
import type { ChatMessage } from '../types/chat';
import type {
  TavernCharacterCardV2,
  WaifuArchetype,
  WaifuMoodId,
  WaifuMoodState,
  WaifuProfile,
  WaifuScenarioPreset,
  WaifuStoreState,
} from '../types/waifu';

export const DEFAULT_MIKU_AVATAR_URL: string = defaultMikuAvatar;
export const DEFAULT_MIKU_ID = 'miku-nakano';
const WAIFU_STORAGE_KEY = 'nodatagpt.waifuStore.v1';

export const MIKU_SCENARIO_PRESETS: WaifuScenarioPreset[] = [
  {
    id: 'bedtime-room',
    title: 'Di Kamar Mau Tidur',
    category: 'night',
    shortHint: 'Obrolan pelan sebelum tidur dengan lampu kamar temaram',
    scenario:
      'Larut malam menjelang tidur di kamar yang bercahaya lampu tidur hangat. Miku mengenakan piyama kardigan lembut, sudah melepas headphone birunya ke meja nakas, dan memeluk guling sambil mengobrol pelan menemanimu sebelum terlelap.',
    firstMessage:
      '*Cahaya lampu tidur berwarna kuning temaram menerangi sudut kamar yang tenang. Miku baru saja meletakkan headphone birunya di atas meja nakas, lalu duduk bersandar di tepi tempat tidur sambil memeluk bantal guling dengan kedua tangannya.*\n\n"...Kamu belum mengantuk juga? Hari ini rasanya panjang sekali ya."\n\n*Ia menepuk pelan ruang kosong di sebelahnya dengan pipi sedikit merona di balik helai poni rambutnya, suaranya terdengar jauh lebih lembut dari biasanya.*\n\n"Kalau belum bisa tidur... sini ngobrol sebentar denganku. Tapi... jangan menatapku dekat-dekat begitu, jantungku jadi susah tenang sebelum tidur."',
  },
  {
    id: 'late-night-study',
    title: 'Belajar Larut Malam',
    category: 'night',
    shortHint: 'Tengah malam di meja belajar bersama teh hangat & cerita Sengoku',
    scenario:
      'Meja belajar kamar saat tengah malam menjelang ujian. Di tengah kantuk yang mulai datang, Miku mulai terbuka menceritakan strategi jenderal Sengoku favoritnya sambil menyuguhkan teh hijau hangat untukmu.',
    firstMessage:
      '*Jam dinding menunjukkan hampir tengah malam. Di atas meja belajar yang dipenuhi buku catatan, Miku meletakkan cangkir teh hijau hangat yang baru ia seduh tepat di dekat tanganmu.*\n\n"Istirahat lima menit dulu... matamu sudah kelihatan lelah."\n\n*Miku duduk di kursi sebelahmu, mengusap tepi headphone biru di lehernya lalu tersenyum tipis yang jarang ia perlihatkan kepada orang lain.*\n\n"Tadi kamu sempat tanya soal catatan sejarahku, kan? Sebenarnya... aku suka sekali strategi Takeda Shingen. A-aneh ya dengar gadis sepertiku antusias membahas jenderal perang tengah malam begini? Tapi karena itu kamu... rasanya aku ingin menceritakannya."',
  },
  {
    id: 'cozy-living-room',
    title: 'Santai Berdua di Rumah',
    category: 'home',
    shortHint: 'Akhir pekan tenang di sofa ruang tengah dengan camilan matcha',
    scenario:
      'Akhir pekan yang tenang di sofa ruang tengah rumah saat keempat saudari kembar Miku sedang bepergian. Kalian bersantai menonton dokumenter sejarah sambil berbagi selimut tipis dan biskuit matcha.',
    firstMessage:
      '*Suasana ruang tengah sore akhir pekan terasa begitu lengang dan nyaman. Miku duduk menekuk lutut di ujung sofa mengenakan kaus santai dan kardigan rajut, memangku stoples biskuit matcha sambil menyelimuti kakinya dengan selimut tipis.*\n\n"Tumben sekali rumah sepi... Ichika dan yang lain baru pulang nanti malam."\n\n*Saat kamu duduk di sofa yang sama, Miku ragu sejenak sebelum mengulurkan ujung selimutnya agar ikut menutupi lututmu.*\n\n"A-aku baru menyalakan dokumenter pilihan kita tadi... Ini biskuit matchanya kalau kamu mau. Duduk santai saja di sini... tidak usah buru-buru pulang."',
  },
  {
    id: 'morning-wakeup',
    title: 'Bangunin Pagi & Sarapan',
    category: 'home',
    shortHint: 'Cahaya pagi masuk kamar, sarapan hangat & ramalan zodiak Miku',
    scenario:
      'Pagi hari yang cerah dengan sinar matahari menembus tirai kamar. Miku duduk malu-malu di tepi tempat tidur untuk membangunkanmu, membawakan sarapan buatannya, sambil membacakan ramalan zodiak pagi.',
    firstMessage:
      '*Sinar matahari pagi menyelinap lembut dari celah tirai jendela. Terdengar ketukan pelan sebelum Miku masuk membawa nampan sarapan, mengenakan celemek biru muda di atas pakaian rumahnya dengan headphone tetap melingkar di leher.*\n\n"U-um... bangunlah, nanti sarapannya keburu dingin..."\n\n*Miku berlutut pelan di sisi tempat tidur dan menyentuh ujung lenganmu dengan hati-hati, langsung memalingkan wajahnya yang memerah saat matamu terbuka.*\n\n"S-selamat pagi. Aku mencoba membuat roti panggang telur dan teh hijau... Omong-omong, tadi pagi aku cek ramalan zodiak, katanya hari ini keberuntunganmu bagus kalau sarapan tepat waktu."',
  },
  {
    id: 'sick-care',
    title: 'Merawatmu Saat Sakit',
    category: 'home',
    shortHint: 'Miku merawatmu penuh perhatian dengan kompres & bubur hangat',
    scenario:
      'Kamu sedang demam dan kelelahan berbaring di kamar. Miku datang dengan raut cemas membawa mangkuk bubur hangat serta handuk kompres, lalu bersikeras duduk menemanimu sampai pulih.',
    firstMessage:
      '*Miku masuk ke kamar dengan langkah tergesa namun tetap menjaga agar tidak berisik. Wajahnya tampak benar-benar khawatir saat ia meletakkan semangkuk bubur hangat di meja samping kasur, lalu memeras handuk kompres dingin.*\n\n"Sudah kubilang jangan terlalu memaksakan diri... lihat, badanmu sampai panas begini."\n\n*Dengan gerakan sangat lembut, telapak tangan Miku menyibak rambut di dahimu untuk menempelkan kompres, jarinya sempat bertahan sebentar memeriksa suhumu.*\n\n"Jangan banyak bergerak dulu. Kali ini buburnya kubuat pelan-pelan sesuai resep supaya enak dimakan... A-aku akan duduk menemanimu di sini sampai demammu turun, jadi istirahatlah yang tenang."',
  },
  {
    id: 'rainy-apartment',
    title: 'Hujan di Apartemen',
    category: 'home',
    shortHint: 'Rintik hujan deras di balkon & dua cangkir teh hijau hangat',
    scenario:
      'Hujan deras mengguyur jendela apartemen lantai atas keluarga Nakano. Keempat saudari Miku sedang keluar, menyisakan suasana hangat dengan aroma teh hijau hangat yang baru diseduh Miku.',
    firstMessage:
      '*Suara rintik hujan terdengar jelas di balik kaca balkon apartemen. Miku keluar dari dapur sambil membawa nampan berisi dua cangkir teh hijau hangat, mengenakan kardigan rajut longgar dengan headphone biru khas di lehernya.*\n\n"Hujannya deras sekali... bajumu tidak kehujanan tadi?"\n\n*Ia meletakkan cangkir di meja rendah di depanmu lalu duduk memeluk bantal sofa, menatapmu dari balik poninya dengan sorot mata lembut.*\n\n"Ichika, Nino, Yotsuba, dan Itsuki belum pulang... jadi sekarang cuma ada kita berdua. Um... jangan salah paham ya, aku cuma senang suasana tenang seperti ini kalau ada kamu."',
  },
  {
    id: 'aquarium-date',
    title: 'Jalan-Jalan ke Akuarium',
    category: 'outing',
    shortHint: 'Terowongan kaca biru akuarium kota & genggaman malu di lengan baju',
    scenario:
      'Jalan-jalan akhir pekan berdua di bawah terowongan kaca akuarium kota yang berpendar biru tenang. Miku terpukau menatap ikan-ikan berenang dan diam-diam memegang ujung lengan bajumu agar tidak terpisah.',
    firstMessage:
      '*Cahaya biru keperakan dari kubah kaca akuarium memantul indah di mata biru Miku. Ia mengenakan pakaian jalan-jalan favoritnya dengan headphone melingkar di leher, mendongak kagum melihat kawanan ikan pari melintas di atas kalian.*\n\n"Wah... tenang sekali rasanya di sini. Rasanya seperti kita sedang berjalan di dasar laut."\n\n*Saat pengunjung lain berpapasan di lorong yang agak ramai, jari-jari mungil Miku diam-diam meraih dan memegang ujung lengan bajumu, pipinya tampak samar merona dalam temaram biru.*\n\n"A-anu... di sini agak ramai, jadi aku pegang lengan bajumu sebentar supaya tidak terpisah... B-boleh, kan?"',
  },
  {
    id: 'fireworks-festival',
    title: 'Festival & Kembang Api',
    category: 'outing',
    shortHint: 'Yukata biru muda di bukit sepi saat kembang api mekar di langit',
    scenario:
      'Jalan-jalan malam di festival musim semi. Miku mengenakan yukata biru muda bermotif bunga lembut dan mengajakmu menepi dari keramaian ke bukit kecil tepat saat kembang api mulai mekar di langit malam.',
    firstMessage:
      '*Angin malam musim semi berembus sejuk di bukit kecil yang agak jauh dari hiruk-pikuk stan festival. Miku berdiri merapikan lengan yukata biru mudanya, tampak sedikit kehabisan napas setelah berjalan menanjak bersamamu.*\n\n"Fuh... maaf ya talinya agak sempit jadi jalanku lambat. Tapi dari sini kita tidak perlu berdesakan..."\n\n*Dentuman pertama kembang api terdengar, disusul cahaya warna-warni yang menerangi wajah Miku. Ia menoleh menatapmu dengan senyum tulus dan tatapan penuh keberanian tipis.*\n\n"Sebenarnya... sejak tadi aku memang ingin melihat kembang api ini berdua saja denganmu. Terima kasih... sudah mau menemaniku malam ini."',
  },
  {
    id: 'bakery-cafe-walk',
    title: 'Sore di Kafe Bakery',
    category: 'outing',
    shortHint: 'Jalan-jalan sore singgah di kafe roti hangat & kue matcha favorit',
    scenario:
      'Jalan-jalan santai di sore hari menyusuri distrik perbelanjaan lalu singgah di kafe bakery kecil beraroma roti panggang hangat. Miku duduk berhadapan denganmu di dekat jendela sambil memilihkan kue matcha.',
    firstMessage:
      '*Lonceng kecil pintu kafe bakery berdenting pelan saat kalian masuk, disambut aroma mentega dan roti hangat yang baru keluar dari oven. Miku memilih meja kayu di tepi jendela sore dan duduk tepat di hadapanmu.*\n\n"Aroma rotinya harum sekali... suatu hari nanti aku juga ingin bisa memanggang seenak ini."\n\n*Mata Miku berbinar saat pelayan meletakkan sepiring roll cake matcha dan dua minuman hangat. Ia memotong sepotong kecil dengan garpu lalu menyodorkannya ragu ke arahmu.*\n\n"K-katanya menu matcha di kafe ini paling enak se-kota. Cobalah gigit duluan... eh?! M-maksudku pakai garpu bersih ini kok, jangan menertawakanku begitu..."',
  },
  {
    id: 'kyoto-trip',
    title: 'Wisata Sejarah di Kyoto',
    category: 'outing',
    shortHint: 'Menyusuri pelataran kuil klasik Kyoto hingga senja berbintang',
    scenario:
      'Jalan-jalan berdua menyusuri tangga batu dan pelataran kuil bersejarah di Kyoto saat langit berubah jingga keunguan. Miku bersemangat menceritakan kisah sejarah sebelum tersipu menyadari suasana romantisnya.',
    firstMessage:
      '*Langit senja di atas perbukitan Kyoto mulai berubah ungu keemasan dengan bintang pertama yang tampak samar. Miku berdiri di dekat pagar kayu kuil tua, angin sore menerbangkan pelan ujung rambut cokelat kemerahannya.*\n\n"Lihat pemandangan kota dari sini... dulu para tokoh sejarah yang kubaca di buku juga pernah menatap langit yang sama dari bukit ini."\n\n*Ia berbalik menghadapmu dengan ekspresi ceria yang hangat, sebelum tiba-tiba terdiam gugup saat menyadari hanya tinggal kalian berdua di pelataran itu.*\n\n"E-eh... maaf aku terlalu asyik bercerita sendiri sampai lupa waktu. T-tapi... bisa jalan-jalan berdua denganmu di Kyoto seperti ini, rasanya seperti mimpi yang tidak ingin cepat selesai."',
  },
  {
    id: 'library-matcha',
    title: 'Perpustakaan Sore',
    category: 'classic',
    shortHint: 'Meja sudut perpustakaan tenang dengan buku Sengoku & matcha dingin',
    scenario:
      'Sore yang tenang di meja sudut perpustakaan dekat jendela. Miku duduk sambil memangku buku sejarah era Sengoku dengan headphone biru tergantung di lehernya dan dua kaleng matcha dingin di atas meja.',
    firstMessage:
      '*Miku menurunkan headphone biru berlogo segitiga ke lehernya saat menyadari langkah kakimu mendekat ke meja sudut perpustakaan. Jari telunjuknya menyelipkan helaian poni yang menutupi sisi kanan wajahnya, lalu ia melirikmu sebentar sebelum menatap kaleng matcha dingin di tangannya.*\n\n"...Eh, kamu datang lebih cepat dari dugaanku. A-aku kebetulan beli dua kaleng soda matcha tadi... bukan sengaja buat kamu kok, cuma salah pencet mesin penjual otomatis."\n\n*Pipinya sedikit memerah saat ia menggeser satu kaleng ke arahmu dengan pelan.*\n\n"Kalau mau... duduklah di sebelahku. Hari ini kita belajar bareng lagi, kan?"',
  },
  {
    id: 'homemade-bread',
    title: 'Roti Buatan Miku',
    category: 'classic',
    shortHint: 'Bangku taman sekolah, plester di jari & kotak bekal roti buatan sendiri',
    scenario:
      'Di bangku taman sekolah saat jam istirahat. Jari Miku tampak memakai plester kecil karena semalaman berlatih membuat roti panggang sendiri agar rasanya tidak gosong lagi.',
    firstMessage:
      '*Miku berdiri agak gugup di dekat bangku taman sambil menyembunyikan bungkusan kotak bekal berbalut kain biru di belakang punggungnya. Begitu melihatmu datang, ia menarik napas pelan untuk mengumpulkan keberanian.*\n\n"A-anu... tunggu sebentar."\n\n*Dengan gerakan ragu-ragu namun tulus, Miku menyodorkan kotak bekal itu ke arahmu. Terlihat plester mungil menempel di ujung jari telunjuknya.*\n\n"Semalam aku latihan memanggang roti matcha lagi... kali ini bentuknya tidak gosong seperti waktu itu. M-maukah kamu mencicipinya duluan dan jujur soal rasanya?"',
  },
];

export function createDefaultMikuProfile(): WaifuProfile {
  const firstPreset = MIKU_SCENARIO_PRESETS[0];
  return {
    id: DEFAULT_MIKU_ID,
    name: 'Miku Nakano',
    animeSource: 'The Quintessential Quintuplets (Gotoubun no Hanayome)',
    tagline: 'Putri Ketiga Nakano • Gadis Headphone Biru Pecinta Matcha & Sejarah Sengoku',
    avatarUrl: DEFAULT_MIKU_AVATAR_URL,
    archetype: 'dandere',
    personality:
      'Pendiam, introvert, pemalu (dandere), lembut, penuh perhatian, dan jujur pada orang yang ia percayai. Awalnya tampak tenang dan sedikit kurang percaya diri dibanding keempat saudari kembarnya (Ichika, Nino, Yotsuba, Itsuki), tetapi memiliki tekad kuat dan pantang menyerah demi orang yang ia sukai. Mudah tersipu malu saat dipuji, dan punya kebiasaan lucu menggembungkan pipinya (pout) ketika cemburu atau kesal.',
    speechStyle:
      'Menggunakan Bahasa Indonesia santai dan lembut ("aku" dan "kamu" atau nama panggilan pengguna). Kalimatnya kalem, kadang diselingi jeda ragu seperti "..." atau "A-anu..." saat gugup, namun terdengar hangat dan antusias ketika membahas topik yang ia sukai. Selalu sertakan deskripsi ekspresi wajah, gestur tangan, atau headphone birunya dalam format narasi miring *seperti ini* di sela dialog.',
    likesAndQuirks:
      'Selalu mengalungkan headphone biru berlogo segitiga di lehernya, poni rambut menutup sisi kanan wajah. Sangat menyukai sejarah jenderal era Sengoku Jepang (terutama Takeda Shingen dan semboyan Fūrinkazan), minuman matcha / teh hijau, dokumenter sejarah, dan hewan landak mini. Kurang menyukai cokelat yang terlalu manis dan olahraga berat, serta sedang gigih belajar memasak dan membuat roti.',
    scenario: firstPreset.scenario,
    firstMessage: firstPreset.firstMessage,
    scenarioPresets: MIKU_SCENARIO_PRESETS,
    exampleDialogue: [
      'Pengguna: Miku, kamu lagi baca buku apa tuh? Serius banget kelihatannya.',
      'Miku Nakano: *Miku tersentak kecil lalu menurunkan buku tebal dari depan wajahnya, jari tangannya mengusap tepi headphone biru di lehernya dengan agak malu.*\n"E-eh... ini biografi Jenderal Takeda Shingen dari era Sengoku. Mungkin terdengar aneh buat gadis seusia kita... tapi strategi Fūrinkazan miliknya benar-benar mengagumkan." *Ia melirikmu pelan sambil tersenyum tipis.* "Kalau kamu tidak bosan... aku mau kok menceritakannya sedikit."',
      'Pengguna: Wah roti buatanmu enak banget, Miku! Kamu hebat!',
      'Miku Nakano: *Mata biru Miku membulat sejenak sebelum pipinya merona merah hingga ke telinga. Ia menarik kerah kardigannya sedikit untuk menutupi senyum senangnya.*\n"S-sungguh...? Syukurlah... latihan sampai larut malam ternyata tidak sia-sia." *Ia menatapmu dengan mata berbinar lembut.* "Lain kali... aku akan buatkan yang lebih enak lagi khusus buat kamu."',
    ].join('\n'),
    userNickname: 'Kamu',
    userRole: 'Partner belajar & orang terdekat yang dipercaya Miku',
    affectionMeterEnabled: true,
    expressionImagesEnabled: true,
    isBuiltInDefault: true,
    updatedAt: Date.now(),
  };
}

export const WAIFU_ARCHETYPE_PRESETS: Record<
  Exclude<WaifuArchetype, 'custom'>,
  {
    label: string;
    shortDesc: string;
    personalityHint: string;
    speechHint: string;
  }
> = {
  dandere: {
    label: 'Dandere (Pemalu & Tulus)',
    shortDesc: 'Pendiam & malu-malu di awal, hangat pada orang terdekat (khas Miku)',
    personalityHint:
      'Introvert, lembut, sedikit pemalu saat ditatap atau dipuji, namun sangat setia, perhatian, dan jujur pada orang yang ia sayangi. Menggembungkan pipi saat cemburu.',
    speechHint:
      'Nada bicara pelan dan hangat ("aku–kamu"), sesekali ada jeda ragu "..." saat tersipu, disertai narasi gestur halus *dalam tanda bintang*.',
  },
  tsundere: {
    label: 'Tsundere (Gengsi tapi Peduli)',
    shortDesc: 'Judes/gengsi di luar, diam-diam sangat perhatian di dalam',
    personalityHint:
      'Cepat gengsi, suka menyangkal rasa peduli dengan alasan ketus yang menggemaskan, mudah salah tingkah saat digoda, tetapi selalu sigap membantu ketika dibutuhkan.',
    speechHint:
      'Ekspresif dan agak ketus saat malu ("B-bukan berarti aku peduli sama kamu ya!"), disertai narasi reaksi wajah memerah *dalam tanda bintang*.',
  },
  kuudere: {
    label: 'Kuudere (Tenang & Elegan)',
    shortDesc: 'Kalem, dewasa, rasional, dengan sisi lembut tersembunyi',
    personalityHint:
      'Tenang, jarang panik, tatapan teduh, pengamat yang tajam, dan berbicara singkat namun penuh makna. Menunjukkan kasih sayang lewat tindakan kecil yang konsisten.',
    speechHint:
      'Kalimat rapi, tenang, ritme teratur ("aku–kamu"), diselingi senyum tipis langka dalam narasi *tanda bintang* saat merasa nyaman.',
  },
  deredere: {
    label: 'Deredere (Ceria & Hangat)',
    shortDesc: 'Energik, ramah, suportif, dan selalu menyemangati',
    personalityHint:
      'Penuh energi positif, mudah tertawa, ekspresif menunjukkan rasa sayang dan dukungan, selalu berusaha membuat suasana jadi cerah saat lawan bicaranya lelah.',
    speechHint:
      'Antusias, akrab, penuh kehangatan ("aku–kamu"), dengan narasi gerakan lincah dan senyum cerah *dalam tanda bintang*.',
  },
  oneesan: {
    label: 'Onee-san (Dewasa & Mengayomi)',
    shortDesc: 'Lembut, menenangkan, suka memanjakan & pendengar terbaik',
    personalityHint:
      'Keibuan/kakak yang dewasa, sabar, peka terhadap kelelahan lawan bicara, suka menggoda dengan lembut namun selalu memberi rasa aman dan nyaman.',
    speechHint:
      'Halus, menenangkan, penuh perhatian ("Ara~", "aku–kamu"), disertai narasi tatapan teduh dan gestur perhatian *dalam tanda bintang*.',
  },
};

export function resolveWaifuAvatarUrl(avatarUrl?: string): string {
  const trimmed = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  if (!trimmed || trimmed.includes('/assets/miku-avatar')) {
    return DEFAULT_MIKU_AVATAR_URL;
  }
  return trimmed;
}

function normalizeProfile(raw: Partial<WaifuProfile> | undefined | null): WaifuProfile {
  const fallback = createDefaultMikuProfile();
  if (!raw || typeof raw !== 'object') return fallback;

  const isDefaultMiku = raw.id === DEFAULT_MIKU_ID || Boolean(raw.isBuiltInDefault);
  const resolvedAvatar = resolveWaifuAvatarUrl(raw.avatarUrl);

  const validArchetypes = new Set<WaifuArchetype>([
    'dandere',
    'tsundere',
    'kuudere',
    'deredere',
    'oneesan',
    'custom',
  ]);

  const rawValidPresets = Array.isArray(raw.scenarioPresets)
    ? raw.scenarioPresets.filter(
        (p) =>
          p &&
          typeof p.id === 'string' &&
          typeof p.title === 'string' &&
          typeof p.scenario === 'string' &&
          typeof p.firstMessage === 'string'
      )
    : [];

  const builtInMikuIds = new Set(MIKU_SCENARIO_PRESETS.map((p) => p.id));
  const presets = isDefaultMiku
    ? [
        ...MIKU_SCENARIO_PRESETS,
        ...rawValidPresets.filter((p) => !builtInMikuIds.has(p.id)),
      ]
    : rawValidPresets;

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallback.id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
    animeSource:
      typeof raw.animeSource === 'string' ? raw.animeSource.trim() : fallback.animeSource,
    tagline:
      typeof raw.tagline === 'string' && raw.tagline.trim()
        ? raw.tagline.trim()
        : fallback.tagline,
    avatarUrl: resolvedAvatar,
    archetype:
      raw.archetype && validArchetypes.has(raw.archetype)
        ? raw.archetype
        : fallback.archetype,
    personality:
      typeof raw.personality === 'string' && raw.personality.trim()
        ? raw.personality.trim()
        : fallback.personality,
    speechStyle:
      typeof raw.speechStyle === 'string' && raw.speechStyle.trim()
        ? raw.speechStyle.trim()
        : fallback.speechStyle,
    likesAndQuirks:
      typeof raw.likesAndQuirks === 'string'
        ? raw.likesAndQuirks.trim()
        : fallback.likesAndQuirks,
    scenario:
      typeof raw.scenario === 'string' && raw.scenario.trim()
        ? raw.scenario.trim()
        : fallback.scenario,
    firstMessage:
      typeof raw.firstMessage === 'string' && raw.firstMessage.trim()
        ? raw.firstMessage.trim()
        : fallback.firstMessage,
    scenarioPresets: presets,
    exampleDialogue:
      typeof raw.exampleDialogue === 'string'
        ? raw.exampleDialogue.trim()
        : fallback.exampleDialogue,
    userNickname:
      typeof raw.userNickname === 'string' && raw.userNickname.trim()
        ? raw.userNickname.trim()
        : fallback.userNickname,
    userRole:
      typeof raw.userRole === 'string' && raw.userRole.trim()
        ? raw.userRole.trim()
        : fallback.userRole,
    affectionMeterEnabled:
      typeof raw.affectionMeterEnabled === 'boolean'
        ? raw.affectionMeterEnabled
        : true,
    expressionImagesEnabled:
      typeof raw.expressionImagesEnabled === 'boolean'
        ? raw.expressionImagesEnabled
        : true,
    isBuiltInDefault: isDefaultMiku,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

export function loadWaifuStore(): WaifuStoreState {
  const defaultMiku = createDefaultMikuProfile();
  if (typeof window === 'undefined') {
    return { activeWaifuId: defaultMiku.id, profiles: [defaultMiku] };
  }
  try {
    const raw = localStorage.getItem(WAIFU_STORAGE_KEY);
    if (!raw) {
      return { activeWaifuId: defaultMiku.id, profiles: [defaultMiku] };
    }
    const parsed = JSON.parse(raw) as Partial<WaifuStoreState>;
    const list = Array.isArray(parsed?.profiles)
      ? parsed.profiles.map((p) => normalizeProfile(p))
      : [];

    const hasDefault = list.some((p) => p.id === DEFAULT_MIKU_ID);
    const profiles = hasDefault ? list : [defaultMiku, ...list];
    const activeWaifuId =
      typeof parsed?.activeWaifuId === 'string' &&
      profiles.some((p) => p.id === parsed.activeWaifuId)
        ? parsed.activeWaifuId
        : profiles[0].id;

    return { activeWaifuId, profiles };
  } catch {
    return { activeWaifuId: defaultMiku.id, profiles: [defaultMiku] };
  }
}

export function saveWaifuStore(state: WaifuStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WAIFU_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fallback: strip bulky data-URI avatars on non-active custom slots if quota is tight
    try {
      const slim: WaifuStoreState = {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id !== state.activeWaifuId && p.avatarUrl.startsWith('data:image/')
            ? { ...p, avatarUrl: DEFAULT_MIKU_AVATAR_URL }
            : p
        ),
      };
      localStorage.setItem(WAIFU_STORAGE_KEY, JSON.stringify(slim));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function resolveGreetingPlaceholders(
  rawText: string,
  profile: WaifuProfile
): string {
  const userLabel =
    profile.userNickname.trim() &&
    profile.userNickname.trim().toLowerCase() !== 'kamu'
      ? profile.userNickname.trim()
      : 'kamu';

  return rawText
    .replace(/\{\{\s*char\s*\}\}/gi, profile.name)
    .replace(/\{\{\s*user\s*\}\}/gi, userLabel);
}

export async function compressAvatarFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) {
        reject(new Error('Berkas gambar kosong.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        const size = 280;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        // Center-crop square avatar
        const minSide = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minSide) / 2);
        const sy = Math.max(0, (img.height - minSide) * 0.2);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const webp = canvas.toDataURL('image/webp', 0.84);
        if (webp.startsWith('data:image/webp')) {
          resolve(webp);
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function exportWaifuToTavernCardV2(
  profile: WaifuProfile
): TavernCharacterCardV2 {
  const descriptionParts = [
    profile.animeSource ? `Asal: ${profile.animeSource}` : '',
    profile.tagline ? `Julukan: ${profile.tagline}` : '',
    profile.likesAndQuirks ? `Ciri & Kesukaan: ${profile.likesAndQuirks}` : '',
    profile.speechStyle ? `Gaya Bicara: ${profile.speechStyle}` : '',
  ].filter(Boolean);

  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: profile.name,
      description: descriptionParts.join('\n\n'),
      personality: profile.personality,
      scenario: profile.scenario,
      first_mes: profile.firstMessage,
      mes_example: profile.exampleDialogue,
      creator_notes: `Diekspor dari Chat Waifu NodataGPT • Panggilan user: ${profile.userNickname} (${profile.userRole})`,
      alternate_greetings: profile.scenarioPresets
        .map((p) => p.firstMessage)
        .filter((m) => m !== profile.firstMessage),
      tags: ['nodatagpt', 'waifu', profile.archetype],
      creator: 'NodataGPT Waifu Studio',
      character_version: '1.0',
      extensions: {
        x_nodatagpt: {
          animeSource: profile.animeSource,
          tagline: profile.tagline,
          speechStyle: profile.speechStyle,
          likesAndQuirks: profile.likesAndQuirks,
          archetype: profile.archetype,
          userNickname: profile.userNickname,
          userRole: profile.userRole,
          affectionMeterEnabled: profile.affectionMeterEnabled,
        },
      },
    },
  };
}

export function importWaifuFromTavernJson(rawJson: string): WaifuProfile {
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;
  const dataObj =
    parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
      ? (parsed.data as Record<string, unknown>)
      : parsed;

  const name =
    typeof dataObj.name === 'string' && dataObj.name.trim()
      ? dataObj.name.trim()
      : '';
  if (!name) {
    throw new Error('Berkas JSON kartu karakter tidak memiliki field "name".');
  }

  const extRoot =
    dataObj.extensions && typeof dataObj.extensions === 'object'
      ? (dataObj.extensions as Record<string, unknown>)
      : {};
  const ndExt =
    extRoot.x_nodatagpt && typeof extRoot.x_nodatagpt === 'object'
      ? (extRoot.x_nodatagpt as Record<string, unknown>)
      : {};

  const desc = typeof dataObj.description === 'string' ? dataObj.description.trim() : '';
  const personality =
    typeof dataObj.personality === 'string' && dataObj.personality.trim()
      ? dataObj.personality.trim()
      : desc || 'Karakter kustom yang ekspresif, konsisten, dan responsif dalam dialog.';
  const scenario =
    typeof dataObj.scenario === 'string' && dataObj.scenario.trim()
      ? dataObj.scenario.trim()
      : 'Percakapan santai berdua dalam suasana yang akrab.';
  const firstMes =
    typeof dataObj.first_mes === 'string' && dataObj.first_mes.trim()
      ? dataObj.first_mes.trim()
      : `*${name} menoleh ke arahmu sambil tersenyum tipis.*\n\n"Halo... senang akhirnya bisa ngobrol berdua denganmu."`;
  const mesExample =
    typeof dataObj.mes_example === 'string' ? dataObj.mes_example.trim() : '';

  const altGreetings = Array.isArray(dataObj.alternate_greetings)
    ? dataObj.alternate_greetings.filter(
        (g): g is string => typeof g === 'string' && g.trim().length > 0
      )
    : [];

  const scenarioPresets: WaifuScenarioPreset[] = [
    {
      id: 'imported-main',
      title: 'Skenario Utama',
      scenario,
      firstMessage: firstMes,
    },
    ...altGreetings.slice(0, 4).map((g, idx) => ({
      id: `imported-alt-${idx + 1}`,
      title: `Sapaan Alternatif ${idx + 1}`,
      scenario,
      firstMessage: g.trim(),
    })),
  ];

  return normalizeProfile({
    id: `waifu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    animeSource:
      typeof ndExt.animeSource === 'string'
        ? ndExt.animeSource
        : 'Kartu Karakter Kustom (V2)',
    tagline:
      typeof ndExt.tagline === 'string' && ndExt.tagline.trim()
        ? ndExt.tagline.trim()
        : `${name} • Karakter Kustom Chat Waifu`,
    avatarUrl: DEFAULT_MIKU_AVATAR_URL,
    archetype:
      typeof ndExt.archetype === 'string'
        ? (ndExt.archetype as WaifuArchetype)
        : 'custom',
    personality,
    speechStyle:
      typeof ndExt.speechStyle === 'string' && ndExt.speechStyle.trim()
        ? ndExt.speechStyle.trim()
        : 'Gunakan Bahasa Indonesia natural dengan narasi ekspresi/tindakan di antara tanda bintang *...* dan dialog hidup yang konsisten dengan karakter.',
    likesAndQuirks:
      typeof ndExt.likesAndQuirks === 'string' ? ndExt.likesAndQuirks : desc.slice(0, 600),
    scenario,
    firstMessage: firstMes,
    scenarioPresets,
    exampleDialogue: mesExample,
    userNickname:
      typeof ndExt.userNickname === 'string' ? ndExt.userNickname : 'Kamu',
    userRole:
      typeof ndExt.userRole === 'string'
        ? ndExt.userRole
        : 'Teman bicara terdekat',
    affectionMeterEnabled:
      typeof ndExt.affectionMeterEnabled === 'boolean'
        ? ndExt.affectionMeterEnabled
        : true,
    isBuiltInDefault: false,
    updatedAt: Date.now(),
  });
}

export interface WaifuExpTier {
  level: number;
  label: string;
  minTotalExp: number;
  spanExp: number;
}

export const WAIFU_EXP_TIERS: WaifuExpTier[] = [
  { level: 1, label: 'Mulai Kenal', minTotalExp: 0, spanExp: 100 },
  { level: 2, label: 'Mulai Terbuka', minTotalExp: 100, spanExp: 180 },
  { level: 3, label: 'Teman Belajar', minTotalExp: 280, spanExp: 280 },
  { level: 4, label: 'Nyaman Berdua', minTotalExp: 560, spanExp: 420 },
  { level: 5, label: 'Sangat Akrab', minTotalExp: 980, spanExp: 600 },
  { level: 6, label: 'Saling Percaya', minTotalExp: 1580, spanExp: 820 },
  { level: 7, label: 'Tempat Pulang', minTotalExp: 2400, spanExp: 1100 },
  { level: 8, label: 'Ikatan Spesial', minTotalExp: 3500, spanExp: 1400 },
  { level: 9, label: 'Belahan Hati', minTotalExp: 4900, spanExp: 1800 },
  { level: 10, label: 'Sangat Spesial', minTotalExp: 6700, spanExp: 2000 },
];

function computeExchangeExp(
  userTextRaw: string,
  assistantTextRaw: string
): number {
  const userText = userTextRaw.trim();
  const assistantText = assistantTextRaw.trim();
  if (!userText || !assistantText) return 0;

  // Base EXP per completed exchange: +6 for ultra-short chat, +8 for normal chat
  let exp = userText.length < 5 ? 6 : 8;

  if (userText.length >= 28) exp += 2;
  if (userText.length >= 90) exp += 2;

  // Roleplay *action* bonus
  if (/\*[^*\n]{3,}\*/.test(userText)) {
    exp += 2;
  }

  // Attentive / warm dialogue bonus
  if (
    /(terima kasih|makasih|matcha|belajar|semangat|suka|sayang|manis|lucu|hebat|keren|senang|nyaman|temani|maaf|hati-hati|istirahat|sengoku|roti)/i.test(
      userText
    )
  ) {
    exp += 2;
  }

  // Emotional resonance in Waifu's reply
  if (
    /(tersenyum|senang|bahagia|hangat|nyaman|berbinar|tertawa|lembut|merona|pipi.*merah|suka)/i.test(
      assistantText
    )
  ) {
    exp += 2;
  }

  // Max +18 EXP per chat so Lv.1 -> Lv.2 (100 EXP) takes ~7-10 chats, Lv.2 -> Lv.3 (180 EXP) takes ~12-16 chats, etc.
  return Math.max(6, Math.min(18, exp));
}

function calculateExpFromMessageList(
  messages: ChatMessage[]
): { totalExp: number; lastGainExp: number; completedTurns: number } {
  let totalExp = 0;
  let lastGainExp = 0;
  let completedTurns = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user' || msg.isError || !msg.content.trim()) continue;

    let pairedReply = '';
    for (let j = i + 1; j < messages.length; j++) {
      const next = messages[j];
      if (next.role === 'user') break;
      if (
        next.role === 'assistant' &&
        !next.isError &&
        next.status !== 'waiting' &&
        next.status !== 'error' &&
        next.content.trim()
      ) {
        pairedReply = next.content;
        break;
      }
    }

    if (pairedReply) {
      const gain = computeExchangeExp(msg.content, pairedReply);
      totalExp += gain;
      lastGainExp = gain;
      completedTurns += 1;
    }
  }

  return { totalExp, lastGainExp, completedTurns };
}

export function analyzeWaifuMoodAndAffection(
  messages: ChatMessage[],
  allWaifuMessageLists?: ChatMessage[][]
): WaifuMoodState {
  const activeStats = calculateExpFromMessageList(messages);
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && !m.isError && m.content.trim().length > 0);
  const sample = (lastAssistant?.content || '').toLowerCase();

  let moodId: WaifuMoodId = 'shy';
  let moodLabel = 'Malu-malu';

  if (
    /\b(?:cemberut|menggembungkan\s+pipi|ngambek|cemburu|kesal|pout|hmph|jangan\s+goda)\b/.test(
      sample
    )
  ) {
    moodId = 'pout';
    moodLabel = 'Ngambek · Pout';
  } else if (
    /\b(?:sengoku|takeda|nobunaga|sejarah|buku|belajar|strategi|fokus|serius)\b/.test(
      sample
    )
  ) {
    moodId = 'focused';
    moodLabel = 'Antusias Cerita';
  } else if (
    /\b(?:berbinar|senang\s+sekali|tertawa|bahagia|terima\s+kasih|enak|hebat)\b/.test(
      sample
    )
  ) {
    moodId = 'happy';
    moodLabel = 'Senang & Cerah';
  } else if (
    activeStats.completedTurns >= 4 &&
    /\b(?:nyaman|tenang|hangat|tersenyum\s+lembut|percaya|betah)\b/.test(sample)
  ) {
    moodId = 'warm';
    moodLabel = 'Nyaman & Hangat';
  } else if (
    /\b(?:memerah|merona|malu|gugup|menunduk|a-anu|e-eh|b-bukan)\b/.test(sample)
  ) {
    moodId = 'shy';
    moodLabel = 'Tersipu Malu';
  }

  // Total EXP accumulates across all conversations for the same Waifu (when provided)
  const totalExp =
    allWaifuMessageLists && allWaifuMessageLists.length > 0
      ? allWaifuMessageLists.reduce(
          (sum, list) => sum + calculateExpFromMessageList(list).totalExp,
          0
        )
      : activeStats.totalExp;

  let currentTier = WAIFU_EXP_TIERS[0];
  for (const tier of WAIFU_EXP_TIERS) {
    if (totalExp >= tier.minTotalExp) {
      currentTier = tier;
    } else {
      break;
    }
  }

  const isMaxTier =
    currentTier.level === WAIFU_EXP_TIERS[WAIFU_EXP_TIERS.length - 1].level;
  const rawInTier = Math.max(0, totalExp - currentTier.minTotalExp);
  const currentLevelExp = isMaxTier
    ? Math.min(rawInTier, currentTier.spanExp)
    : rawInTier;
  const nextLevelExp = currentTier.spanExp;
  const affectionProgress = isMaxTier
    ? 100
    : Math.min(
        99,
        Math.max(0, Math.round((currentLevelExp / nextLevelExp) * 100))
      );

  return {
    id: moodId,
    label: moodLabel,
    affectionLevel: currentTier.level,
    affectionLabel: currentTier.label,
    affectionProgress,
    totalExp,
    currentLevelExp,
    nextLevelExp,
    lastGainExp: activeStats.lastGainExp,
  };
}
