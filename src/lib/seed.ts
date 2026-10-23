import type { Chat, DB, Message, User } from "./types";
import { hashPassword } from "./password";

/** id user sistem yang dipakai AI saat membalas di grup */
export const AI_USER_ID = "ai-vibe";

const iso = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

interface SeedUser {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarColor: string;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  {
    id: "u-owner",
    name: "Kamu",
    phone: "628111111111",
    about: "Membangun VibeChat 🚀",
    avatarColor: "emerald",
    password: "vibe123",
  },
  {
    id: "u-aisyah",
    name: "Aisyah Putri",
    phone: "6281200000002",
    about: "Designer & pecinta kopi ☕",
    avatarColor: "rose",
    password: "vibe123",
  },
  {
    id: "u-bima",
    name: "Bima Saputra",
    phone: "6281200000003",
    about: "Backend engineer. Tidur itu opsional.",
    avatarColor: "sky",
    password: "vibe123",
  },
  {
    id: "u-citra",
    name: "Citra Dewi",
    phone: "6281200000004",
    about: "Product manager. Meeting lover (bukan).",
    avatarColor: "amber",
    password: "vibe123",
  },
  {
    id: "u-dimas",
    name: "Dimas Pratama",
    phone: "6281200000005",
    about: "Hobi lari pagi, realistis: sore.",
    avatarColor: "violet",
    password: "vibe123",
  },
  {
    id: "u-rangga",
    name: "Rangga Wijaya",
    phone: "6281200000006",
    about: "Musik, kopi, dan deadline.",
    avatarColor: "orange",
    password: "vibe123",
  },
  {
    id: "u-nabila",
    name: "Nabila Rahma",
    phone: "6281200000007",
    about: "Menulis untuk hidup ✍️",
    avatarColor: "teal",
    password: "vibe123",
  },
];

const now = new Date();

export async function buildSeedDB(): Promise<DB> {
  const users: User[] = [];
  for (const item of SEED_USERS) {
    users.push({
      id: item.id,
      name: item.name,
      phone: item.phone,
      about: item.about,
      avatarColor: item.avatarColor,
      passwordHash: await hashPassword(item.password),
      createdAt: iso(60 * 24 * 90),
    });
  }
  users.push({
    id: AI_USER_ID,
    name: "Vibe AI",
    phone: "6280000000000",
    about: "Asisten AI otomatis di VibeChat",
    avatarColor: "ai",
    passwordHash: "",
    isSystem: true,
    createdAt: iso(60 * 24 * 30),
  });

  const chats: Chat[] = [
    {
      id: "c-aisyah",
      type: "dm",
      avatarColor: "rose",
      memberIds: ["u-owner", "u-aisyah"],
      pinned: true,
      muted: false,
      archived: false,
      ai: { enabled: true, persona: "Aisyah, desainer muda yang ramah, suka kopi, dan suka memberi rekomendasi desain." },
      lastRead: { "u-owner": iso(4) },
      createdAt: iso(60 * 24 * 20),
    },
    {
      id: "c-tim-produk",
      type: "group",
      name: "Tim Produk ✨",
      avatarColor: "sky",
      memberIds: ["u-owner", "u-aisyah", "u-bima", "u-citra"],
      pinned: true,
      muted: false,
      archived: false,
      ai: { enabled: false },
      lastRead: { "u-owner": iso(48) },
      createdAt: iso(60 * 24 * 14),
    },
    {
      id: "c-bima",
      type: "dm",
      avatarColor: "sky",
      memberIds: ["u-owner", "u-bima"],
      pinned: false,
      muted: false,
      archived: false,
      ai: { enabled: false, persona: "Bima, backend engineer yang to the point tapi suka bercanda kering." },
      lastRead: { "u-owner": iso(120) },
      createdAt: iso(60 * 24 * 12),
    },
    {
      id: "c-keluarga",
      type: "group",
      name: "Keluarga Cemara",
      avatarColor: "amber",
      memberIds: ["u-owner", "u-citra", "u-dimas", "u-nabila"],
      pinned: false,
      muted: true,
      archived: false,
      ai: { enabled: false },
      lastRead: { "u-owner": iso(60 * 26) },
      createdAt: iso(60 * 24 * 30),
    },
    {
      id: "c-dimas",
      type: "dm",
      avatarColor: "violet",
      memberIds: ["u-owner", "u-dimas"],
      pinned: false,
      muted: false,
      archived: false,
      ai: { enabled: false },
      lastRead: { "u-owner": iso(60 * 50) },
      createdAt: iso(60 * 24 * 9),
    },
    {
      id: "c-nabila",
      type: "dm",
      avatarColor: "teal",
      memberIds: ["u-owner", "u-nabila"],
      pinned: false,
      muted: false,
      archived: false,
      ai: { enabled: false },
      lastRead: { "u-owner": iso(60 * 70) },
      createdAt: iso(60 * 24 * 7),
    },
    {
      id: "c-vibe",
      type: "dm",
      avatarColor: "ai",
      memberIds: ["u-owner", AI_USER_ID],
      pinned: false,
      muted: false,
      archived: false,
      ai: {
        enabled: true,
        persona:
          "Asisten Vibe yang ramah dan membantu. Menjelaskan fitur VibeChat dengan singkat, kadang memberi tips produktivitas.",
      },
      lastRead: { "u-owner": iso(45) },
      createdAt: iso(60 * 24 * 3),
    },
    {
      id: "c-rangga",
      type: "dm",
      avatarColor: "orange",
      memberIds: ["u-owner", "u-rangga"],
      pinned: false,
      muted: false,
      archived: true,
      ai: { enabled: false },
      lastRead: { "u-owner": iso(60 * 100) },
      createdAt: iso(60 * 24 * 5),
    },
  ];

  const raw: Array<[string, string, string, string, number, boolean?]> = [
    ["c-aisyah", "u-aisyah", "Pagi! Mockup halaman chat udah aku upload ya", "text", 240, false],
    ["c-aisyah", "u-owner", "Wih cepat banget. Aku cek dulu 👀", "text", 236, true],
    ["c-aisyah", "u-aisyah", "Yang versi gelap aku bikin accent-nya lebih lembut, biar mata nggak capek", "text", 231, false],
    ["c-aisyah", "u-owner", "Setuju. Btw besok kita demo jam 10 kan?", "text", 228, true],
    ["c-aisyah", "u-aisyah", "Iya jam 10. Aku siapin slide-nya malam ini", "text", 226, false],
    ["c-aisyah", "u-aisyah", "Eh kamu udah nyoba fitur auto-reply AI-nya? Keren nggak?", "text", 12, false],
    ["c-aisyah", "u-owner", "Baru mau nyoba. Katanya bisa pakai API key Gemini sendiri ya?", "text", 6, true],
    ["c-aisyah", "u-aisyah", "Iya! Nanti aku kirim contoh prompt-nya deh", "text", 4, false],

    ["c-tim-produk", "u-citra", "Reminder: sprint review besok pagi ya semua 🙏", "text", 90, false],
    ["c-tim-produk", "u-bima", "Siap. Endpoint chat udah live di staging", "text", 84, false],
    ["c-tim-produk", "u-aisyah", "Aku update komponen bubble pesan, cek ya", "text", 78, false],
    ["c-tim-produk", "u-owner", "Mantap. Aku lanjut integrasi auto-responder AI-nya", "text", 72, false],
    ["c-tim-produk", "u-citra", "Kalau bisa jangan lupa rate limit ya, biar token nggak bocor", "text", 55, false],
    ["c-tim-produk", "u-bima", "Udah aku tambahin catatan di dokumen arsitektur", "text", 48, false],

    ["c-bima", "u-owner", "Bro, JSON store-nya aman buat concurrent write?", "text", 190, true],
    ["c-bima", "u-bima", "Aman kalau tulisnya di-queue terus atomic rename. Jangan write langsung", "text", 186, false],
    ["c-bima", "u-owner", "Oke, aku pakai write queue + rename", "text", 180, true],
    ["c-bima", "u-bima", "Nanti kalau udah rame baru pindah ke SQLite. Jangan over-engineer dulu 😄", "text", 175, false],

    ["c-keluarga", "u-nabila", "Minggu depan pada pulang nggak nih?", "text", 60 * 26, false],
    ["c-keluarga", "u-dimas", "Aku pulang Sabtu pagi", "text", 60 * 26 - 6, false],
    ["c-keluarga", "u-citra", "Aku nyusul siang, titip beliin oleh-oleh ya", "text", 60 * 25.5, false],

    ["c-dimas", "u-dimas", "Lari pagi besok? Jam 6 di lapangan", "text", 60 * 50, false],
    ["c-dimas", "u-owner", "Jam 6 masih ngumpulin nyawa wkwk, jam 7 aja", "text", 60 * 49, true],
    ["c-dimas", "u-dimas", "Oke jam 7, jangan telat 😤", "text", 60 * 48, false],

    ["c-vibe", "ai-vibe", "Hai! Aku Vibe AI 👋 Aktifkan auto-responder di Pengaturan (ikon robot) lalu kirim pesan ke sini untuk mencoba balasan otomatis.", "text", 46, false],
    ["c-vibe", "u-owner", "Oke, nanti aku isi API key Gemini dulu", "text", 45, true],
  ] as unknown as Array<[string, string, string, string, number, boolean?]>;

  const messages: Message[] = raw.map(([chatId, senderId, body, type, minutesAgo, read], index) => ({
    id: `m-${index + 1}`,
    chatId,
    senderId,
    type: type as Message["type"],
    body,
    createdAt: iso(minutesAgo),
    readBy:
      senderId === "u-owner"
        ? read
          ? ["u-owner", "u-aisyah", "u-bima", "u-citra"]
          : ["u-owner"]
        : ["u-owner"],
    deletedFor: [],
  }));

  // perbaikan entri terakhir yang ditulis manual di atas
  messages[messages.length - 1].createdAt = iso(60 * 48);

  return {
    meta: {
      version: 1,
      authSecret: crypto.randomUUID() + crypto.randomUUID(),
      createdAt: now.toISOString(),
    },
    users,
    chats,
    messages,
    ai: {
      enabled: false,
      provider: "gemini",
      apiKey: "",
      baseUrl: "https://generativelanguage.googleapis.com",
      model: "gemini-2.5-flash",
      systemPrompt:
        "Kamu adalah rekan chat yang ramah, santai, dan suka membantu. Balas seperti manusia Indonesia: singkat (1-3 kalimat), natural, boleh pakai emoji secukupnya. Jangan pernah menyebut bahwa kamu adalah AI atau model bahasa.",
      temperature: 0.8,
      maxTokens: 400,
      replyDelayMs: 1600,
      contextMessages: 20,
    },
  };
}
