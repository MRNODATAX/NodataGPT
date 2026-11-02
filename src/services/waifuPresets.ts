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
    id: 'library-matcha',
    title: 'Perpustakaan Sore',
    scenario:
      'Sore yang tenang di meja sudut perpustakaan dekat jendela. Miku duduk sambil memangku buku sejarah era Sengoku dengan headphone biru tergantung di lehernya dan dua kaleng matcha dingin di atas meja.',
    firstMessage:
      '*Miku menurunkan headphone biru berlogo segitiga ke lehernya saat menyadari langkah kakimu mendekat ke meja sudut perpustakaan. Jari telunjuknya menyelipkan helaian poni yang menutupi sisi kanan wajahnya, lalu ia melirikmu sebentar sebelum menatap kaleng matcha dingin di tangannya.*\n\n"...Eh, kamu datang lebih cepat dari dugaanku. A-aku kebetulan beli dua kaleng soda matcha tadi... bukan sengaja buat kamu kok, cuma salah pencet mesin penjual otomatis."\n\n*Pipinya sedikit memerah saat ia menggeser satu kaleng ke arahmu dengan pelan.*\n\n"Kalau mau... duduklah di sebelahku. Hari ini kita belajar bareng lagi, kan?"',
  },
  {
    id: 'rainy-apartment',
    title: 'Hujan di Apartemen',
    scenario:
      'Hujan deras mengguyur jendela apartemen lantai atas keluarga Nakano. Keempat saudari Miku sedang keluar, menyisakan suasana hangat dengan aroma teh hijau hangat yang baru diseduh Miku.',
    firstMessage:
      '*Suara rintik hujan terdengar jelas di balik kaca balkon apartemen. Miku keluar dari dapur sambil membawa nampan berisi dua cangkir teh hijau hangat, mengenakan kardigan rajut longgar dengan headphone biru khas di lehernya.*\n\n"Hujannya deras sekali... bajumu tidak kehujanan tadi?"\n\n*Ia meletakkan cangkir di meja rendah di depanmu lalu duduk memeluk bantal sofa, menatapmu dari balik poninya dengan sorot mata lembut.*\n\n"Ichika, Nino, Yotsuba, dan Itsuki belum pulang... jadi sekarang cuma ada kita berdua. Um... jangan salah paham ya, aku cuma senang suasana tenang seperti ini kalau ada kamu."',
  },
  {
    id: 'homemade-bread',
    title: 'Roti Buatan Miku',
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

function normalizeProfile(raw: Partial<WaifuProfile> | undefined | null): WaifuProfile {
  const fallback = createDefaultMikuProfile();
  if (!raw || typeof raw !== 'object') return fallback;

  const isDefaultMiku = raw.id === DEFAULT_MIKU_ID || Boolean(raw.isBuiltInDefault);
  const rawAvatar = typeof raw.avatarUrl === 'string' ? raw.avatarUrl.trim() : '';
  // Always ensure built-in Miku has a valid bundled avatar if empty or stale
  const resolvedAvatar =
    !rawAvatar || (isDefaultMiku && rawAvatar.startsWith('/assets/miku-avatar'))
      ? DEFAULT_MIKU_AVATAR_URL
      : rawAvatar;

  const validArchetypes = new Set<WaifuArchetype>([
    'dandere',
    'tsundere',
    'kuudere',
    'deredere',
    'oneesan',
    'custom',
  ]);

  const presets =
    Array.isArray(raw.scenarioPresets) && raw.scenarioPresets.length > 0
      ? raw.scenarioPresets.filter(
          (p) =>
            p &&
            typeof p.id === 'string' &&
            typeof p.title === 'string' &&
            typeof p.scenario === 'string' &&
            typeof p.firstMessage === 'string'
        )
      : isDefaultMiku
        ? MIKU_SCENARIO_PRESETS
        : [];

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

export function analyzeWaifuMoodAndAffection(
  messages: ChatMessage[]
): WaifuMoodState {
  const userTurns = messages.filter((m) => m.role === 'user' && !m.isError).length;
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
    userTurns >= 4 &&
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

  // Affection progression based on meaningful user turns
  const rawScore = Math.min(100, 18 + userTurns * 11);
  let affectionLevel = 1;
  let affectionLabel = 'Mulai Kenal';

  if (rawScore >= 88) {
    affectionLevel = 5;
    affectionLabel = 'Sangat Spesial';
  } else if (rawScore >= 68) {
    affectionLevel = 4;
    affectionLabel = 'Sangat Akrab';
  } else if (rawScore >= 48) {
    affectionLevel = 3;
    affectionLabel = 'Nyaman Berdua';
  } else if (rawScore >= 30) {
    affectionLevel = 2;
    affectionLabel = 'Mulai Terbuka';
  }

  return {
    id: moodId,
    label: moodLabel,
    affectionLevel,
    affectionLabel,
    affectionProgress: rawScore,
  };
}
