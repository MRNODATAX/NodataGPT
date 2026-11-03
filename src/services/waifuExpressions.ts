import mikuManifestRaw from '../assets/waifu/miku/manifest.json';
import mikuCemberutUrl from '../assets/waifu/miku/miku-cemberut.jpg';
import mikuGugupUrl from '../assets/waifu/miku/miku-gugup.jpg';
import mikuMaluCloseupUrl from '../assets/waifu/miku/miku-malu-closeup.jpg';
import mikuPapSelfieUrl from '../assets/waifu/miku/miku-pap-selfie.png';
import mikuSelfieHangatUrl from '../assets/waifu/miku/miku-selfie-hangat.jpg';
import mikuSemangatUrl from '../assets/waifu/miku/miku-semangat.jpg';
import mikuTerkejutUrl from '../assets/waifu/miku/miku-terkejut.jpg';
import mikuTersipuUrl from '../assets/waifu/miku/miku-tersipu.jpg';
import mikuTertawaUrl from '../assets/waifu/miku/miku-tertawa.jpg';
import mikuUlurkanTanganUrl from '../assets/waifu/miku/miku-ulurkan-tangan.jpg';
import mikuWinkUrl from '../assets/waifu/miku/miku-wink.jpg';
import type { WaifuProfile } from '../types/waifu';

export type MikuExpressionCategoryId =
  | 'dukungan'
  | 'afeksi'
  | 'hangat'
  | 'ceria'
  | 'tsundere'
  | 'terkejut'
  | 'pap'
  | 'netral';

export interface MikuManifestAsset {
  fileName: string;
  mimeType: string;
  label: string;
  categories: MikuExpressionCategoryId[];
  objectPosition?: string;
}

export interface MikuManifestCategory {
  label: string;
  description: string;
  priorityAssets: string[];
  forbiddenAssets?: string[];
}

export interface MikuExpressionManifest {
  version: string;
  characterId: string;
  characterName: string;
  fallbackCategory: MikuExpressionCategoryId;
  categories: Record<MikuExpressionCategoryId, MikuManifestCategory>;
  assets: MikuManifestAsset[];
}

export interface SelectedWaifuExpression {
  fileName: string;
  url: string;
  mimeType: string;
  label: string;
  category: MikuExpressionCategoryId;
  categoryLabel: string;
  objectPosition: string;
}

export interface SelectWaifuExpressionInput {
  userPrompt: string;
  assistantReply: string;
  waifuProfile?: WaifuProfile;
  conversationId?: string;
  /**
   * Optional group context compatibility (Plan Steps 4, 6, 7):
   * - Group mode is opt-in separately via `.waifu grup on/off/status`
   * - Requires actual bot mention (`isBotMentioned === true`)
   * - Anti-repeat state is isolated strictly per `groupId + memberId`
   */
  isGroup?: boolean;
  groupId?: string;
  memberId?: string;
  isBotMentioned?: boolean;
  /**
   * Private VN compatibility (Plan Step 7):
   * Private VN turns do not auto-attach images unless an image/PAP was explicitly requested.
   */
  isVoiceNoteReply?: boolean;
}

export interface WaifuControlCommandResult {
  matched: boolean;
  scope: 'private' | 'group';
  action: 'on' | 'off' | 'status';
  enabled: boolean;
  replyText: string;
}

const BUNDLED_MIKU_ASSET_URLS: Record<string, string> = {
  'miku-cemberut.jpg': mikuCemberutUrl,
  'miku-gugup.jpg': mikuGugupUrl,
  'miku-malu-closeup.jpg': mikuMaluCloseupUrl,
  'miku-pap-selfie.png': mikuPapSelfieUrl,
  'miku-selfie-hangat.jpg': mikuSelfieHangatUrl,
  'miku-semangat.jpg': mikuSemangatUrl,
  'miku-terkejut.jpg': mikuTerkejutUrl,
  'miku-tersipu.jpg': mikuTersipuUrl,
  'miku-tertawa.jpg': mikuTertawaUrl,
  'miku-ulurkan-tangan.jpg': mikuUlurkanTanganUrl,
  'miku-wink.jpg': mikuWinkUrl,
};

const LAST_ASSET_STORAGE_KEY = 'nodatagpt.waifuLastExpr.v1';
const GROUP_OPTIN_STORAGE_KEY = 'nodatagpt.waifuGroupOptIn.v1';
const PRIVATE_OPTIN_STORAGE_KEY = 'nodatagpt.waifuPrivateOptIn.v1';

const inMemoryLastAssetByScope = new Map<string, string>();
const inMemoryGroupOptIn = new Map<string, boolean>();
let inMemoryPrivateOptIn = true;

export const MIKU_EXPRESSION_MANIFEST: MikuExpressionManifest =
  mikuManifestRaw as MikuExpressionManifest;

export interface ManifestValidationReport {
  valid: boolean;
  assetCount: number;
  errors: string[];
}

export function validateMikuExpressionManifest(
  manifest: MikuExpressionManifest = MIKU_EXPRESSION_MANIFEST,
  assetUrlMap: Record<string, string> = BUNDLED_MIKU_ASSET_URLS
): ManifestValidationReport {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, assetCount: 0, errors: ['Manifest kosong atau tidak valid.'] };
  }

  if (!Array.isArray(manifest.assets) || manifest.assets.length !== 11) {
    errors.push(
      `Jumlah aset manifest harus 11, ditemukan ${Array.isArray(manifest.assets) ? manifest.assets.length : 0}.`
    );
  }

  const assetByName = new Map<string, MikuManifestAsset>();
  for (const asset of manifest.assets || []) {
    if (!asset.fileName) {
      errors.push('Terdapat entri aset tanpa fileName.');
      continue;
    }
    if (assetByName.has(asset.fileName)) {
      errors.push(`Duplikasi fileName di manifest: ${asset.fileName}`);
    }
    assetByName.set(asset.fileName, asset);

    const expectedMime = asset.fileName.endsWith('.png')
      ? 'image/png'
      : asset.fileName.endsWith('.jpg') || asset.fileName.endsWith('.jpeg')
        ? 'image/jpeg'
        : '';
    if (!expectedMime || asset.mimeType !== expectedMime) {
      errors.push(
        `Tipe MIME tidak cocok untuk ${asset.fileName}: tertulis ${asset.mimeType}, seharusnya ${expectedMime}.`
      );
    }

    if (!assetUrlMap[asset.fileName]) {
      errors.push(`File lokal tidak ditemukan pada bundle untuk ${asset.fileName}.`);
    }
  }

  for (const [catId, catDef] of Object.entries(manifest.categories || {})) {
    if (!Array.isArray(catDef.priorityAssets) || catDef.priorityAssets.length === 0) {
      errors.push(`Kategori "${catId}" tidak memiliki priorityAssets.`);
      continue;
    }
    const forbidden = new Set(catDef.forbiddenAssets || []);
    for (const fileName of catDef.priorityAssets) {
      if (!assetByName.has(fileName)) {
        errors.push(`Kategori "${catId}" merujuk aset "${fileName}" yang tidak ada di manifest.`);
      }
      if (forbidden.has(fileName)) {
        errors.push(`Kategori "${catId}" memasukkan aset terlarang "${fileName}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    assetCount: assetByName.size,
    errors,
  };
}

export function isMikuCharacterProfile(profile?: WaifuProfile): boolean {
  if (!profile) return false;
  if (profile.id === 'miku-nakano-default' || profile.isBuiltInDefault) {
    return true;
  }
  return /\bmiku(?:\s+nakano)?\b/i.test(profile.name.trim());
}

function readScopeLastAsset(scopeKey: string): string {
  const mem = inMemoryLastAssetByScope.get(scopeKey);
  if (mem) return mem;
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(LAST_ASSET_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed?.[scopeKey] === 'string' ? parsed[scopeKey] : '';
  } catch {
    return '';
  }
}

function writeScopeLastAsset(scopeKey: string, fileName: string): void {
  inMemoryLastAssetByScope.set(scopeKey, fileName);
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LAST_ASSET_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const keys = Object.keys(parsed);
    if (keys.length > 120) {
      delete parsed[keys[0]];
    }
    parsed[scopeKey] = fileName;
    window.localStorage.setItem(LAST_ASSET_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetWaifuExpressionMemory(scopeKey?: string): void {
  if (scopeKey) {
    inMemoryLastAssetByScope.delete(scopeKey);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(LAST_ASSET_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, string>;
          delete parsed[scopeKey];
          window.localStorage.setItem(LAST_ASSET_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch {
        // Ignore
      }
    }
    return;
  }
  inMemoryLastAssetByScope.clear();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(LAST_ASSET_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export function getPrivateWaifuEnabled(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(PRIVATE_OPTIN_STORAGE_KEY);
      if (raw === 'false') return false;
      if (raw === 'true') return true;
    } catch {
      // Ignore
    }
  }
  return inMemoryPrivateOptIn;
}

export function setPrivateWaifuEnabled(enabled: boolean): void {
  inMemoryPrivateOptIn = enabled;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PRIVATE_OPTIN_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }
}

export function getGroupWaifuEnabled(groupId: string): boolean {
  if (!groupId) return false;
  if (inMemoryGroupOptIn.has(groupId)) {
    return Boolean(inMemoryGroupOptIn.get(groupId));
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(GROUP_OPTIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        return Boolean(parsed[groupId]);
      }
    } catch {
      // Ignore
    }
  }
  return false; // Groups are strictly opt-in (off by default)
}

export function setGroupWaifuEnabled(groupId: string, enabled: boolean): void {
  if (!groupId) return;
  inMemoryGroupOptIn.set(groupId, enabled);
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(GROUP_OPTIN_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      parsed[groupId] = enabled;
      window.localStorage.setItem(GROUP_OPTIN_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore
    }
  }
}

/**
 * Handles `.waifu on/off/status` (private) and `.waifu grup on/off/status` (group opt-in).
 * Explicit commands always supersede automatic Waifu chat triggers and never attach images.
 */
export function handleWaifuControlCommand(
  rawText: string,
  options?: { isGroup?: boolean; groupId?: string }
): WaifuControlCommandResult | null {
  const trimmed = String(rawText || '').trim();
  const groupMatch = /^\.waifu\s+(?:grup|group)\s+(on|off|status)\s*$/i.exec(trimmed);
  if (groupMatch) {
    const action = groupMatch[1].toLowerCase() as 'on' | 'off' | 'status';
    const gid = options?.groupId || 'default-group';
    if (action === 'on') {
      setGroupWaifuEnabled(gid, true);
      return {
        matched: true,
        scope: 'group',
        action: 'on',
        enabled: true,
        replyText:
          'Mode Waifu Grup berhasil **diaktifkan** (`ON`). Mention bot secara langsung untuk mengobrol dengan Miku di grup ini.',
      };
    }
    if (action === 'off') {
      setGroupWaifuEnabled(gid, false);
      return {
        matched: true,
        scope: 'group',
        action: 'off',
        enabled: false,
        replyText:
          'Mode Waifu Grup berhasil **dinonaktifkan** (`OFF`). Alur grup kembali ke AI normal.',
      };
    }
    const status = getGroupWaifuEnabled(gid);
    return {
      matched: true,
      scope: 'group',
      action: 'status',
      enabled: status,
      replyText: `Status Mode Waifu Grup saat ini: **${status ? 'ON (Aktif)' : 'OFF (Nonaktif)'}**.`,
    };
  }

  const privMatch = /^\.waifu(?:\s+foto)?\s+(on|off|status)\s*$/i.exec(trimmed);
  if (privMatch) {
    const action = privMatch[1].toLowerCase() as 'on' | 'off' | 'status';
    if (action === 'on') {
      setPrivateWaifuEnabled(true);
      return {
        matched: true,
        scope: 'private',
        action: 'on',
        enabled: true,
        replyText:
          'Foto ekspresi Miku Nakano **diaktifkan** (`ON`). Setiap balasan Miku akan menyertakan foto ekspresi yang selaras dengan suasana obrolan.',
      };
    }
    if (action === 'off') {
      setPrivateWaifuEnabled(false);
      return {
        matched: true,
        scope: 'private',
        action: 'off',
        enabled: false,
        replyText:
          'Foto ekspresi Miku Nakano **dinonaktifkan** (`OFF`). Miku akan membalas dengan teks saja.',
      };
    }
    const status = getPrivateWaifuEnabled();
    return {
      matched: true,
      scope: 'private',
      action: 'status',
      enabled: status,
      replyText: `Status foto ekspresi Waifu saat ini: **${status ? 'ON (Aktif)' : 'OFF (Nonaktif)'}**.`,
    };
  }

  return null;
}

export function isExplicitNonWaifuCommand(rawText: string): boolean {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return false;
  // Slash or dot bot commands (/cuaca, /tiktok, .menu, .ping, !help, etc.)
  if (/^[/!.]\w+/.test(trimmed)) {
    return true;
  }
  return false;
}

export function isExplicitPapRequest(userPromptRaw: string): boolean {
  const text = String(userPromptRaw || '').toLowerCase().trim();
  if (!text) return false;

  // Negation guard: "jangan kirim foto", "gak usah pap", "tidak perlu selfie"
  if (
    /\b(?:jangan|nggak\s+usah|gak\s+usah|ga\s+usah|tak\s+usah|tidak\s+usah|tidak\s+perlu|bukan(?:\s+mau)?)\s+(?:minta\s+|kirim(?:in|kan)?\s+|kasih\s+)?(?:pap|foto(?:mu|nya)?|selfie(?:mu|nya)?|gambar(?:mu)?)\b/i.test(
      text
    )
  ) {
    return false;
  }

  if (/\b(?:pap|papdong)\b/i.test(text)) {
    return true;
  }

  if (
    /\b(?:kirim(?:in|kan)?|minta|bagi|kasih|lihat(?:in)?|mau\s+lihat|boleh\s+lihat|coba\s+lihat|mana)\s+(?:dong\s+)?(?:pap|foto(?:\s+kamu|\s+miku|mu|nya|\s+selfie|\s+terbaru|\s+sekarang)?|selfie(?:\s+kamu|\s+miku|mu|nya)?|potret(?:mu)?|wajah(?:mu|\s+kamu))\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (
    /\b(?:selfie|foto\s+diri)\s+(?:dong|dulu|lagi|sekarang|miku|kamu|buat\s+aku)\b/i.test(
      text
    )
  ) {
    return true;
  }

  return false;
}

export function isDistressOrSupportContext(userPromptRaw: string): boolean {
  const text = String(userPromptRaw || '').toLowerCase().trim();
  if (!text) return false;

  // Guard against playful "capek ketawa" so genuine laughter isn't misread as distress
  if (/\bcapek\s+(?:ketawa|ngakak|tertawa)\b/i.test(text)) {
    return false;
  }

  return (
    /\b(?:sedih|nangis|menangis|stres|stress|depresi|burnout|putus\s+asa|hancur|kesepian|sendirian|curhat|gelisah|cemas|takut\s+banget|kecewa|gagal|terpuruk|patah\s+hati|sakit\s+hati|down\s+banget|lagi\s+down|mental(?:ku)?\s+(?:capek|lelah|down)|capek\s+banget|lelah\s+banget|cape\s+banget|letih\s+banget|pusing\s+banget|berat\s+banget|butuh\s+teman|butuh\s+dukungan|butuh\s+semangat|peluk\s+aku|tolong\s+temani|aku\s+capek|aku\s+lelah|rasanya\s+berat|pengen\s+nyerah|ingin\s+menyerah|habis\s+dimarahi|nilai\s+jelek|ditolak)\b/i.test(
      text
    )
  );
}

function extractRoleplayParts(replyRaw: string): {
  actions: string;
  dialogue: string;
} {
  const text = String(replyRaw || '');
  const actionMatches = text.match(/\*[^*\n]+\*/g) || [];
  const actions = actionMatches.join(' ').toLowerCase();
  const dialogue = text.replace(/\*[^*\n]+\*/g, ' ').toLowerCase();
  return { actions, dialogue };
}

export interface ClassificationResult {
  category: MikuExpressionCategoryId;
  preferNervousInTsundere?: boolean;
}

/**
 * Local-only context & tone classifier (zero external calls).
 * Strictly enforces:
 * 1. Explicit PAP override -> 'pap'
 * 2. Distress / curhat / support override -> 'dukungan' (hard-blocking laugh/wink/pout)
 * 3. Multi-signal contextual scoring on user prompt + Miku reply actions/dialogue
 * 4. Friendly fallback -> 'netral'
 */
export function classifyWaifuExpression(
  userPromptRaw: string,
  assistantReplyRaw: string
): ClassificationResult {
  const userText = String(userPromptRaw || '').toLowerCase().trim();
  const { actions, dialogue } = extractRoleplayParts(assistantReplyRaw);
  const replyAll = `${actions} ${dialogue}`;

  // Priority 1: Explicit PAP / Foto / Selfie request
  if (isExplicitPapRequest(userText)) {
    return { category: 'pap' };
  }

  // Priority 2: Distress / Sadness / Venting / Support (Safety Rule: always overrides jokes/flirt)
  if (isDistressOrSupportContext(userText)) {
    return { category: 'dukungan' };
  }

  const scores: Record<
    Exclude<MikuExpressionCategoryId, 'pap' | 'dukungan' | 'netral'>,
    number
  > = {
    afeksi: 0,
    hangat: 0,
    ceria: 0,
    tsundere: 0,
    terkejut: 0,
  };

  let poutSignals = 0;
  let nervousSignals = 0;

  // --- Afeksi / Pujian / Malu / Flirting Ringan ---
  if (
    /\b(?:cantik(?:\s+banget|nya)?|manis(?:\s+banget|nya)?|imut(?:\s+banget|nya)?|gemas|gemesin|menggemaskan|sayang(?:\s+kamu|\s+miku|\s+banget)?|aku\s+suka\s+(?:sama\s+)?kamu|cinta\s+(?:sama\s+)?kamu|jatuh\s+cinta|pacarku|calon\s+istri|gombal|bikin\s+baper|bikin\s+deg-degan|senyummu\s+manis|suaramu\s+lembut|matamu\s+indah)\b/i.test(
      userText
    )
  ) {
    scores.afeksi += 4;
  }
  if (
    /(?:tersipu|pipi[^.!?]{0,25}(?:memerah|merona|panas|hangat)|wajah[^.!?]{0,20}memerah|merona\s+malu|menunduk\s+malu|jantung[^.!?]{0,20}berdebar|menarik\s+headphone[^.!?]{0,25}menutupi)/i.test(
      actions
    )
  ) {
    scores.afeksi += 3;
  }
  if (/\b(?:m-makasih\s+pujiannya|jangan\s+menatapku\s+terus|bikin\s+malu\s+saja)\b/i.test(dialogue)) {
    scores.afeksi += 2;
  }

  // --- Hangat / Kangen / Sapaan Ramah ---
  if (
    /\b(?:kangen(?:\s+banget|\s+miku|\s+kamu)?|rindu(?:\s+banget|\s+miku|\s+kamu)?|selamat\s+(?:pagi|siang|sore|malam)|met\s+(?:pagi|siang|sore|malam)|lama\s+(?:nggak|gak|tidak)\s+(?:ketemu|ngobrol)|senang\s+(?:bisa\s+)?(?:ketemu|ngobrol)|apa\s+kabar\s+miku|halo\s+miku|hai\s+miku|pagi\s+miku|malam\s+miku)\b/i.test(
      userText
    )
  ) {
    scores.hangat += 4;
  }
  if (/(?:tersenyum\s+hangat|melambaikan\s+tangan\s+pelan|menyambutmu\s+dengan\s+lembut)/i.test(actions)) {
    scores.hangat += 2;
  }
  if (/\b(?:aku\s+juga\s+kangen|aku\s+juga\s+merindukanmu|senang\s+melihatmu\s+kembali)\b/i.test(dialogue)) {
    scores.hangat += 3;
  }

  // --- Ceria / Candaan / Kabar Menyenangkan ---
  if (
    /\b(?:wkwk+|haha+|hehe+|hihi+|lucu(?:\s+banget)?|kocak|ngakak|bercanda|canda|tebak-tebakan|lelucon|jokes|hore+|yeay+|asyik|asik\s+banget|aku\s+lulus|aku\s+menang|aku\s+berhasil|dapat\s+nilai\s+bagus|diterima\s+kerja|kabar\s+baik|kabar\s+gembira|senang\s+banget\s+hari\s+ini)\b/i.test(
      userText
    )
  ) {
    scores.ceria += 4;
  }
  if (
    /(?:tertawa(?:\s+kecil|\s+lepas|\s+pelan|\s+renyah)?|terkekeh|cekikikan|mengedipkan\s+sebelah\s+mata|\bwink\b|tersenyum\s+lebar\s+cerah)/i.test(
      actions
    )
  ) {
    scores.ceria += 3;
  }

  // --- Kesal Ringan / Tsundere / Cemburu / Gugup ---
  if (
    /\b(?:nino|ichika|yotsuba|itsuki|waifu\s+lain|gadis\s+lain|cewek\s+lain|lebih\s+cantik\s+dari\s+miku)\b/i.test(
      userText
    )
  ) {
    scores.tsundere += 4;
    poutSignals += 2;
  }
  if (
    /\b(?:ngambek|cemberut|cemburu(?:\s+ya)?|marah\s+ya|kesal\s+ya|jutek|cuek|iseng|goda(?:in)?|roti\s+gosong|masakanmu)\b/i.test(
      userText
    )
  ) {
    scores.tsundere += 3;
    poutSignals += 2;
  }
  if (
    /(?:cemberut|menggembungkan\s+pipi|merajuk|\bpout\b|cemburu|kesal|menyipitkan\s+mata|memalingkan\s+muka)/i.test(
      replyAll
    ) ||
    /\b(?:hmph|jangan\s+menggodaku|jangan\s+iseng|menyebalkan)\b/i.test(dialogue)
  ) {
    scores.tsundere += 4;
    poutSignals += 3;
  }
  if (
    /(?:gugup|salah\s+tingkah|panik|keringat\s+dingin|gelagapan|tergagap)/i.test(
      replyAll
    ) ||
    /\b(?:a-apa\s+maksudmu|e-eh\s+bukan\s+begitu|j-jangan\s+salah\s+paham)\b/i.test(
      dialogue
    )
  ) {
    scores.tsundere += 3;
    nervousSignals += 4;
  }

  // --- Terkejut / Kabar Tak Terduga (Contextual, not a single stray word!) ---
  let surpriseContextSignals = 0;
  if (
    /(?:tebak\s+apa|nggak\s+(?:bakal\s+)?nyangka|gak\s+nyangka|tidak\s+menyangka|kabar\s+mengejutkan|kejutan\s+besar|tiba-tiba\s+tadi|mendadak(?:\s+banget|!+)?|beneran\s*\?!|serius(?:an)?\s*\?!|masa\s+sih\s*\?!|\bhah\s*\?!|aku\s+baru\s+saja\s+melihat|ternyata\s+selama\s+ini)/i.test(
      userText
    )
  ) {
    scores.terkejut += 4;
    surpriseContextSignals += 2;
  }
  if (
    /(?:membelalak(?:kan\s+mata)?|terbelalak|mata[^.!?]{0,25}membulat(?:\s+lebar)?|tersentak(?:\s+kaget)?|terkesiap|terperanjat|terdiam\s+kaget|mulut[^.!?]{0,20}terbuka|bengong\s+sejenak|kaget\s+bukan\s+main|tidak\s+percaya)/i.test(
      actions
    )
  ) {
    scores.terkejut += 4;
    surpriseContextSignals += 2;
  }
  if (/(?:\be-?eh\s*\?!|\bhah\s*\?!|\bapa\s*\?!|\bs-?serius\s*\?!|\bbeneran\s*\?!|\bsungguh\s*\?!)/i.test(dialogue)) {
    scores.terkejut += 2;
    surpriseContextSignals += 1;
  }
  if (surpriseContextSignals < 2) {
    // Require genuine surprise context, not a lone casual word
    scores.terkejut = 0;
  }

  // Pick the highest-scoring category if it clears the confidence threshold (>= 3)
  const orderedCandidates: Array<
    Exclude<MikuExpressionCategoryId, 'pap' | 'dukungan' | 'netral'>
  > = ['terkejut', 'tsundere', 'afeksi', 'ceria', 'hangat'];

  let bestCategory: MikuExpressionCategoryId = 'netral';
  let bestScore = 2; // Minimum score of 3 required to beat 'netral'

  for (const cat of orderedCandidates) {
    const sc = scores[cat];
    if (sc > bestScore) {
      bestScore = sc;
      bestCategory = cat;
    }
  }

  return {
    category: bestCategory,
    preferNervousInTsundere:
      bestCategory === 'tsundere' && nervousSignals > poutSignals,
  };
}

function buildScopeKey(input: SelectWaifuExpressionInput): string {
  if (input.isGroup || input.groupId) {
    const gid = (input.groupId || 'group').trim();
    const mid = (input.memberId || 'anonymous').trim();
    return `group:${gid}:${mid}`;
  }
  const cid = (input.conversationId || 'private-default').trim();
  return `private:${cid}`;
}

/**
 * Selects at most ONE local Miku expression image for a Waifu reply turn,
 * validating strictly against `manifest.json` and preventing consecutive repeats per scope.
 * Returns `null` safely if disabled, non-Miku profile, non-triggered group turn, explicit command,
 * private VN without explicit PAP request, or missing manifest/file (guaranteeing graceful text fallback).
 */
export function selectWaifuExpressionForTurn(
  input: SelectWaifuExpressionInput,
  assetUrlMap: Record<string, string> = BUNDLED_MIKU_ASSET_URLS
): SelectedWaifuExpression | null {
  const { userPrompt, assistantReply, waifuProfile } = input;

  // 1. Must have a valid Miku profile & non-empty reply
  if (!isMikuCharacterProfile(waifuProfile)) return null;
  if (!String(assistantReply || '').trim()) return null;

  // 2. Explicit commands supersede automatic Waifu image triggers
  if (isExplicitNonWaifuCommand(userPrompt)) return null;

  // 3. Group vs Private opt-in & mention rules (Plan Steps 6 & 7)
  if (input.isGroup || input.groupId) {
    const gid = (input.groupId || '').trim();
    if (!gid || !getGroupWaifuEnabled(gid)) return null;
    if (!input.isBotMentioned) return null;
  } else {
    if (waifuProfile?.expressionImagesEnabled === false) return null;
    if (!getPrivateWaifuEnabled()) return null;
    // Private VN does not auto-attach image unless PAP/photo was explicitly requested
    if (input.isVoiceNoteReply && !isExplicitPapRequest(userPrompt)) {
      return null;
    }
  }

  // 4. Classify context locally
  const classification = classifyWaifuExpression(userPrompt, assistantReply);
  const manifest = MIKU_EXPRESSION_MANIFEST;
  if (!manifest?.categories || !Array.isArray(manifest.assets)) {
    return null;
  }

  const assetMetaMap = new Map<string, MikuManifestAsset>(
    manifest.assets.map((a) => [a.fileName, a])
  );

  const requestedCat =
    manifest.categories[classification.category] ??
    manifest.categories[manifest.fallbackCategory];
  if (!requestedCat) return null;

  const forbidden = new Set<string>(requestedCat.forbiddenAssets || []);
  let orderedFileNames = [...(requestedCat.priorityAssets || [])];

  // Subtle refinement inside 'tsundere': prefer miku-gugup.jpg when Miku is flustered/nervous rather than pouting
  if (
    classification.category === 'tsundere' &&
    classification.preferNervousInTsundere &&
    orderedFileNames.includes('miku-gugup.jpg')
  ) {
    orderedFileNames = [
      'miku-gugup.jpg',
      ...orderedFileNames.filter((f) => f !== 'miku-gugup.jpg'),
    ];
  }

  // Filter strictly to valid, bundled, non-forbidden local files
  let validCandidates = orderedFileNames.filter((fileName) => {
    if (forbidden.has(fileName)) return false;
    const meta = assetMetaMap.get(fileName);
    const url = assetUrlMap[fileName];
    return Boolean(meta && typeof url === 'string' && url.length > 0);
  });

  // Fallback to 'netral' if the target category had no valid local file
  let resolvedCategory: MikuExpressionCategoryId = classification.category;
  let resolvedCategoryLabel = requestedCat.label;

  if (validCandidates.length === 0 && classification.category !== 'dukungan') {
    const fallbackCat = manifest.categories[manifest.fallbackCategory];
    if (fallbackCat) {
      resolvedCategory = manifest.fallbackCategory;
      resolvedCategoryLabel = fallbackCat.label;
      const fbForbidden = new Set<string>(fallbackCat.forbiddenAssets || []);
      validCandidates = (fallbackCat.priorityAssets || []).filter((fileName) => {
        if (fbForbidden.has(fileName)) return false;
        return Boolean(assetMetaMap.get(fileName) && assetUrlMap[fileName]);
      });
    }
  }

  if (validCandidates.length === 0) {
    // Graceful text-only fallback when no valid local media is available
    return null;
  }

  // 5. Anti-repeat per isolated scope (private chat ID or groupId + memberId)
  const scopeKey = buildScopeKey(input);
  const lastFileName = readScopeLastAsset(scopeKey);
  const chosenFileName =
    validCandidates.length > 1
      ? validCandidates.find((name) => name !== lastFileName) || validCandidates[0]
      : validCandidates[0];

  const chosenMeta = assetMetaMap.get(chosenFileName);
  const chosenUrl = assetUrlMap[chosenFileName];
  if (!chosenMeta || !chosenUrl) return null;

  writeScopeLastAsset(scopeKey, chosenFileName);

  return {
    fileName: chosenMeta.fileName,
    url: chosenUrl,
    mimeType: chosenMeta.mimeType,
    label: chosenMeta.label,
    category: resolvedCategory,
    categoryLabel: resolvedCategoryLabel,
    objectPosition: chosenMeta.objectPosition || 'center 20%',
  };
}

/**
 * Resolves a stored Waifu expression URL by `fileName` from the current build's asset map
 * so persisted chat history survives future Vite asset hash updates cleanly.
 */
export function resolveMikuExpressionUrl(
  fileName?: string,
  fallbackUrl?: string
): string | undefined {
  if (fileName && BUNDLED_MIKU_ASSET_URLS[fileName]) {
    return BUNDLED_MIKU_ASSET_URLS[fileName];
  }
  return fallbackUrl;
}
