import type { ToolActionLink } from '../types/chat';
import {
  KEMENDAGRI_KABKOTA,
  KEMENDAGRI_PROVINCES,
  lookupIndonesianMobileHlr,
} from './osintIndonesiaData';
import {
  type OsintExecutionOutput,
  buildGoogleMapsSearchUrl,
  decodeHtmlEntities,
  fetchJsonSafe,
  fetchProxyTextSafe,
  geocodePlaceIndonesia,
  getShieldedFetch,
  queryDnsOverHttps,
  searchPublicWebSnippets,
} from './osintInspector';

function formatUnixToWib(unixSec?: number | string): string | null {
  const n = Number(unixSec);
  if (!Number.isFinite(n) || n <= 946684800) return null; // after 2000-01-01
  const dt = new Date(n * 1000);
  return (
    dt.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB'
  );
}

function extractMetaContent(html: string, propName: string): string {
  const escaped = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const m1 = html.match(re1);
  if (m1?.[1]) return decodeHtmlEntities(m1[1]).trim();

  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`,
    'i'
  );
  const m2 = html.match(re2);
  if (m2?.[1]) return decodeHtmlEntities(m2[1]).trim();
  return '';
}

function extractBioContactsAndCity(bioText: string): {
  emails: string[];
  phones: string[];
  links: string[];
  detectedCity?: string;
} {
  const emails = Array.from(
    new Set(
      (bioText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,18}/g) || []).map((e) =>
        e.toLowerCase()
      )
    )
  );
  const phones = Array.from(
    new Set(
      (bioText.match(/(?:\+62|62|0)8[1-9][0-9\s-]{6,13}/g) || []).map((p) =>
        p.replace(/\D/g, '')
      )
    )
  );
  const links = Array.from(
    new Set(
      bioText.match(
        /(?:https?:\/\/)?(?:linktr\.ee|lynk\.id|beacons\.ai|s\.id|desty\.page|wa\.me|bit\.ly)\/[A-Za-z0-9_.-]+/gi
      ) || []
    )
  );

  const cityMatch = bioText.match(
    /\b(Jakarta(?:\s+(?:Selatan|Pusat|Barat|Timur|Utara))?|Bandung|Surabaya|Yogyakarta|Jogja|Semarang|Solo|Surakarta|Malang|Medan|Denpasar|Bali|Makassar|Palembang|Bekasi|Depok|Tangerang(?:\s+Selatan)?|Bogor|Batam|Pekanbaru|Balikpapan|Samarinda|Banjarmasin|Pontianak|Padang|Bandar\s+Lampung)\b/i
  );

  return {
    emails,
    phones,
    links,
    detectedCity: cityMatch ? cityMatch[1] : undefined,
  };
}

// ============================================================================
// 1. WHATSAPP COMPLETE OSINT SUITE (/waosint)
//    - Group/Community Invite Inspector (chat.whatsapp.com/...)
//    - WA Channel Inspector (whatsapp.com/channel/...)
//    - Exported WA Chat (.txt) Local Forensics
//    - WA Number / wa.me Link / Public WA Group Dorker
// ============================================================================

export const WA_TXT_EXPORT_PREFIX = '__WA_TXT_EXPORT__:';

function looksLikeWhatsAppChatLog(text: string): boolean {
  const sample = text.slice(0, 2500);
  const lineHits = sample.match(
    /(?:^|\n)(?:\[\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[AP]M)?\]|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}[:.]\d{2}\s+-\s+)/gim
  );
  return Boolean(lineHits && lineHits.length >= 2);
}

function analyzeWhatsAppExportedChatText(rawLog: string): OsintExecutionOutput {
  const lines = rawLog.split(/\r?\n/);
  const senderCounts = new Map<string, number>();
  const hourCounts = new Array<number>(24).fill(0);
  let totalMessages = 0;
  let mediaCount = 0;
  let deletedCount = 0;
  let firstDate = '';
  let lastDate = '';
  const urlsFound = new Set<string>();
  const emailsFound = new Set<string>();
  const phonesFound = new Set<string>();

  const msgHeaderRe =
    /^(?:\[?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?(?:\s?([AP]M))?\]?(?:\s+-\s+|\s+))([^:]{1,45}):\s*([\s\S]*)$/i;

  for (const line of lines) {
    const m = line.match(msgHeaderRe);
    if (m) {
      totalMessages++;
      const dateStr = m[1];
      if (!firstDate) firstDate = dateStr;
      lastDate = dateStr;

      let hour = Number(m[2]);
      const ampm = (m[4] || '').toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      if (hour >= 0 && hour < 24) hourCounts[hour]++;

      const sender = m[5].trim();
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1);

      const body = m[6] || '';
      if (/<Media tidak disertakan>|<Media omitted>|image omitted|video omitted/i.test(body)) {
        mediaCount++;
      }
      if (/Pesan ini dihapus|This message was deleted|Anda menghapus pesan ini/i.test(body)) {
        deletedCount++;
      }
    }

    const urlMatches = line.match(/https?:\/\/[^\s)>"]+/gi);
    if (urlMatches) {
      for (const u of urlMatches) {
        if (urlsFound.size < 12) urlsFound.add(u);
      }
    }
    const emailMatches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,18}/g);
    if (emailMatches) {
      for (const em of emailMatches) {
        if (emailsFound.size < 10) emailsFound.add(em.toLowerCase());
      }
    }
    const phoneMatches = line.match(/(?:\+62|62|08)[0-9-]{8,14}/g);
    if (phoneMatches) {
      for (const ph of phoneMatches) {
        if (phonesFound.size < 10) phonesFound.add(ph);
      }
    }
  }

  const topSenders = Array.from(senderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  let peakHour = 0;
  for (let h = 1; h < 24; h++) {
    if (hourCounts[h] > hourCounts[peakHour]) peakHour = h;
  }

  const senderLines =
    topSenders.length > 0
      ? topSenders.map(([name, cnt], idx) => {
          const pct = ((cnt / Math.max(totalMessages, 1)) * 100).toFixed(1);
          return `${idx + 1}. **${name}** — \`${cnt.toLocaleString('id-ID')}\` pesan (${pct}%)`;
        })
      : ['- Format pengirim tidak terdeteksi'];

  const outLines = [
    `### 💬 Hasil Forensik Export Chat WhatsApp (\`.txt\`)`,
    '',
    `| Metrik Forensik | Hasil Analisis Lokal |`,
    `| :--- | :--- |`,
    `| **Total Pesan Terbaca** | **${totalMessages.toLocaleString('id-ID')} pesan** |`,
    `| **Jumlah Partisipan Aktif** | **${senderCounts.size} akun/kontak** |`,
    `| **Rentang Tanggal Log** | \`${firstDate || '-'}\` s/d \`${lastDate || '-'}\` |`,
    `| **Jam Paling Aktif (Peak Hour)** | **Pukul ${String(peakHour).padStart(2, '0')}:00 – ${String(
      peakHour
    ).padStart(2, '0')}:59** (\`${hourCounts[peakHour]}\` pesan) |`,
    `| **Lampiran Media & Pesan Dihapus** | \`${mediaCount}\` media · \`${deletedCount}\` pesan dihapus |`,
    '',
    `#### 👥 Peringkat Partisipan Paling Aktif`,
    ...senderLines,
    '',
    `#### 🔗 Ekstraksi Entitas di Dalam Percakapan`,
    `- **Tautan URL (${urlsFound.size})**: ${
      urlsFound.size > 0
        ? Array.from(urlsFound)
            .slice(0, 6)
            .map((u) => `\`${u.slice(0, 70)}\``)
            .join(', ')
        : '_Tidak ada_'
    }`,
    `- **Nomor Telepon (${phonesFound.size})**: ${
      phonesFound.size > 0
        ? Array.from(phonesFound)
            .map((p) => `\`${p}\``)
            .join(', ')
        : '_Tidak ada_'
    }`,
    `- **Alamat Email (${emailsFound.size})**: ${
      emailsFound.size > 0
        ? Array.from(emailsFound)
            .map((e) => `\`${e}\``)
            .join(', ')
        : '_Tidak ada_'
    }`,
    '',
    `> 🔒 **100% Privasi Lokal**: Seluruh analisis file ekspor chat WhatsApp diproses langsung di memori aplikasi tanpa disimpan ke database publik.`,
  ];

  return {
    content: outLines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
  };
}

export async function analyzeWhatsAppOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error(
      'Masukkan nomor WA (`0812...`), link grup (`https://chat.whatsapp.com/...`), link saluran (`whatsapp.com/channel/...`), kata kunci grup publik, atau upload file `.txt` export chat WA.'
    );
  }

  // Mode 1: Exported WhatsApp .txt Chat Log
  if (trimmed.startsWith(WA_TXT_EXPORT_PREFIX)) {
    return analyzeWhatsAppExportedChatText(trimmed.slice(WA_TXT_EXPORT_PREFIX.length));
  }
  if (looksLikeWhatsAppChatLog(trimmed)) {
    return analyzeWhatsAppExportedChatText(trimmed);
  }

  // Mode 2: WhatsApp Group / Community Invite Link (chat.whatsapp.com/...)
  const inviteMatch =
    trimmed.match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{18,26})/) ||
    (/^[A-Za-z0-9]{22}$/.test(trimmed) ? [trimmed, trimmed] : null);

  if (inviteMatch) {
    const code = inviteMatch[1];
    const targetUrl = `https://chat.whatsapp.com/${code}`;
    const page = await fetchProxyTextSafe(targetUrl, {
      headers: {
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      },
      timeoutMs: 9000,
      signal,
    });

    const html = page?.body || '';
    const ogTitle = extractMetaContent(html, 'og:title');
    const ogImage = extractMetaContent(html, 'og:image');
    const ogDesc = extractMetaContent(html, 'og:description');

    const genericTitles = new Set([
      '',
      'whatsapp group invite',
      'undangan grup whatsapp',
      'join group chat on whatsapp',
    ]);
    const isActive =
      Boolean(ogTitle) && !genericTitles.has(ogTitle.toLowerCase());
    const hasCustomAvatar = /pps\.whatsapp\.net/i.test(ogImage);
    const isCommunity = /community|komunitas/i.test(`${ogTitle} ${ogDesc}`);

    const actionLinks: ToolActionLink[] = [
      {
        label: '💬 Buka Undangan di WhatsApp',
        url: targetUrl,
        kind: 'whatsapp',
      },
    ];
    if (hasCustomAvatar && ogImage) {
      actionLinks.push({
        label: '🖼️ Buka Foto Profil Grup HD',
        url: ogImage,
        kind: 'external',
      });
    }

    const contacts = extractBioContactsAndCity(`${ogTitle} ${ogDesc}`);
    if (contacts.detectedCity) {
      actionLinks.push({
        label: `📍 Buka Wilayah "${contacts.detectedCity}" di Google Maps`,
        url: buildGoogleMapsSearchUrl(`${contacts.detectedCity}, Indonesia`),
        kind: 'maps',
      });
    }

    const lines = [
      `### 💬 Hasil WhatsApp Group & Community Invite OSINT`,
      '',
      `| Parameter | Metadata Edge Meta |`,
      `| :--- | :--- |`,
      `| **Kode Undangan** | \`${code}\` |`,
      `| **Status Tautan** | ${
        isActive
          ? '✅ **AKTIF (Tautan Valid & Grup Terbuka)**'
          : '🚨 **TIDAK AKTIF / DICABUT / KEDALUWARSA (Revoked)**'
      } |`,
      `| **Nama Grup / Komunitas** | **${ogTitle || 'Tidak tersedia (Link sudah dicabut)'}** |`,
      `| **Tipe Ruang** | ${isCommunity ? '🏛️ Komunitas / Sub-Grup WhatsApp' : '👥 Grup WhatsApp Standar'} |`,
      `| **Foto Profil Kustom** | ${
        hasCustomAvatar ? '✅ Tersedia di CDN `pps.whatsapp.net`' : 'Tidak ada / Ikon Default'
      } |`,
      ogDesc ? `| **Deskripsi / Label** | ${ogDesc.slice(0, 180)} |` : '',
      '',
      `> 💡 Pemeriksaan dilakukan langsung terhadap *edge metadata* publik Meta tanpa memasukkan akun Anda ke dalam grup.`,
    ].filter(Boolean);

    return {
      content: lines.join('\n'),
      actionLinks,
    };
  }

  // Mode 3: WhatsApp Channel Link (whatsapp.com/channel/...)
  const channelMatch = trimmed.match(
    /(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]{16,36})/i
  );
  if (channelMatch) {
    const channelCode = channelMatch[1];
    const channelUrl = `https://www.whatsapp.com/channel/${channelCode}`;
    const page = await fetchProxyTextSafe(channelUrl, {
      headers: { 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8' },
      timeoutMs: 9000,
      signal,
    });
    const html = page?.body || '';
    const ogTitle = extractMetaContent(html, 'og:title');
    const ogDesc = extractMetaContent(html, 'og:description');
    const ogImage = extractMetaContent(html, 'og:image');

    const actionLinks: ToolActionLink[] = [
      {
        label: '📢 Buka Saluran WhatsApp',
        url: channelUrl,
        kind: 'whatsapp',
      },
    ];
    if (ogImage && /^https?:\/\//i.test(ogImage)) {
      actionLinks.push({
        label: '🖼️ Lihat Foto Saluran HD',
        url: ogImage,
        kind: 'external',
      });
    }

    const lines = [
      `### 📢 Hasil OSINT Saluran (Channel) WhatsApp`,
      '',
      `| Parameter | Detail Saluran Publik |`,
      `| :--- | :--- |`,
      `| **ID Saluran** | \`${channelCode}\` |`,
      `| **Nama Saluran** | **${ogTitle || 'Saluran WhatsApp'}** |`,
      `| **Ringkasan & Pengikut** | ${ogDesc || 'Tidak ada deskripsi publik'} |`,
      `| **URL Resmi** | \`${channelUrl}\` |`,
    ];

    return {
      content: lines.join('\n'),
      actionLinks,
    };
  }

  // Mode 4: wa.me / api.whatsapp.com link OR Phone Number
  const waLinkPhoneMatch = trimmed.match(
    /(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?[^#\s]*phone=)\+?(\d{7,16})/i
  );
  let prefilledText = '';
  if (/wa\.me\/|api\.whatsapp\.com/i.test(trimmed)) {
    try {
      const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      prefilledText = u.searchParams.get('text') || '';
    } catch {
      prefilledText = '';
    }
  }

  const digitsCandidate = waLinkPhoneMatch
    ? waLinkPhoneMatch[1]
    : trimmed.replace(/[\s().+-]/g, '');

  if (/^\d{8,16}$/.test(digitsCandidate)) {
    const e164 = digitsCandidate.startsWith('0')
      ? `62${digitsCandidate.slice(1)}`
      : digitsCandidate;
    const local08 = e164.startsWith('62') ? `0${e164.slice(2)}` : digitsCandidate;
    const isIdMobile = e164.startsWith('628');
    const hlr = isIdMobile ? lookupIndonesianMobileHlr(local08) : null;

    const waFootprintQuery = `"wa.me/${e164}" OR "phone=${e164}" OR ("${local08}" "whatsapp")`;
    const mentions = await searchPublicWebSnippets(waFootprintQuery, 5, signal);

    const actionLinks: ToolActionLink[] = [
      {
        label: '💬 Buka Profil / Cek Foto & Bio WA',
        url: `https://wa.me/${e164}`,
        kind: 'whatsapp',
      },
      {
        label: '🔍 Cek Nama Caller-ID (Truecaller)',
        url: `https://www.truecaller.com/search/${
          e164.startsWith('62') ? 'id' : 'global'
        }/${encodeURIComponent(local08)}`,
        kind: 'external',
      },
      {
        label: '🛡️ CekRekening / E-Wallet Komdigi',
        url: 'https://cekrekening.id/',
        kind: 'verify',
      },
    ];

    if (hlr && hlr.accuracyTier === 'high') {
      actionLinks.unshift({
        label: `📍 Buka Wilayah HLR (${hlr.mapQuery.replace(', Indonesia', '')}) di Google Maps`,
        url: buildGoogleMapsSearchUrl(hlr.mapQuery),
        kind: 'maps',
      });
    }

    const mentionLines =
      mentions.length > 0
        ? mentions.map(
            (m, idx) =>
              `${idx + 1}. **[${m.title}](${m.url})**\n   _${m.snippet || 'Tautan WA ditemukan di halaman publik.'}_`
          )
        : [
            `- Tidak ditemukan tautan \`wa.me/${e164}\` yang dipublikasikan terbuka di web/toko online.`,
          ];

    const lines = [
      `### 💬 Hasil WhatsApp Number & Link OSINT`,
      '',
      `| Parameter | Hasil Investigasi |`,
      `| :--- | :--- |`,
      `| **Nomor Target (E.164)** | \`+${e164}\` (${local08}) |`,
      `| **Tautan Direct WA** | \`https://wa.me/${e164}\` |`,
      hlr ? `| **Wilayah HLR Kartu** | **${hlr.region}** |` : '',
      prefilledText
        ? `| **Pesan Otomatis (\`?text=\`)** | _"${prefilledText.slice(0, 160)}"_ |`
        : '',
      '',
      `#### 🕵️ Jejak Tautan \`wa.me\` & Kontak Bisnis di Web Publik`,
      ...mentionLines,
      '',
      `> 💡 Klik **Buka Profil / Cek Foto & Bio WA** di bawah untuk melihat ketersediaan akun, lencana *WhatsApp Business*, katalog toko, dan jam operasional publiknya.`,
    ].filter(Boolean);

    return {
      content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
      actionLinks,
    };
  }

  // Mode 5: Public WhatsApp Group Keyword Dorker (site:chat.whatsapp.com "<keyword>")
  const groupHits = await searchPublicWebSnippets(
    `site:chat.whatsapp.com "${trimmed}"`,
    6,
    signal
  );

  const lines = [
    `### 🔎 Pencarian Grup WhatsApp Publik Terindeks — "${trimmed}"`,
    '',
    ...(groupHits.length > 0
      ? groupHits.map(
          (g, idx) =>
            `${idx + 1}. **[${g.title}](${g.url})**\n   _${g.snippet || g.url}_`
        )
      : [
          `Tidak ditemukan undangan \`chat.whatsapp.com\` publik yang terindeks untuk kata kunci **"${trimmed}"**. Coba kata kunci yang lebih umum atau tempel link undangan grup langsung untuk diaudit.`,
        ]),
    '',
    `> 💡 Tip: Salin salah satu tautan \`https://chat.whatsapp.com/...\` di atas lalu jalankan kembali di \`/waosint\` untuk memeriksa apakah link grup tersebut masih **AKTIF** atau sudah **DICABUT**.`,
  ];

  return {
    content: lines.join('\n'),
  };
}

// ============================================================================
// 2. TIKTOK DEEP OSINT (/ttosint — Rehydration + Snowflake Timestamp + TikWM)
// ============================================================================

export function decodeTikTokSnowflakeTimestamp(idStr: string): number | null {
  if (!/^\d{17,20}$/.test(idStr.trim())) return null;
  try {
    const unixSec = Number(BigInt(idStr.trim()) >> 32n);
    if (unixSec > 1420070400 && unixSec < 2208988800) {
      return unixSec;
    }
    return null;
  } catch {
    return null;
  }
}

export async function analyzeTikTokOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error(
      'Masukkan `@username` TikTok, URL profil (`https://www.tiktok.com/@username`), atau URL video TikTok.'
    );
  }

  let workingUrl = trimmed;
  // Resolve short vt.tiktok.com / vm.tiktok.com links
  if (/^https?:\/\/(?:vt|vm)\.tiktok\.com\//i.test(trimmed)) {
    const resolved = await fetchProxyTextSafe(trimmed, { timeoutMs: 8000, signal });
    if (resolved?.finalUrl) {
      workingUrl = resolved.finalUrl;
    }
  }

  // Check if input is a Video URL or bare 19-digit Snowflake Video ID
  const videoIdMatch =
    workingUrl.match(/\/(?:video|photo)\/(\d{17,20})/) ||
    (/^\d{18,20}$/.test(workingUrl) ? [workingUrl, workingUrl] : null);
  const urlHandleMatch = workingUrl.match(/tiktok\.com\/@([A-Za-z0-9._-]+)/i);

  let videoCreatedWib: string | null = null;
  const extractedVideoId = videoIdMatch ? videoIdMatch[1] : '';
  if (extractedVideoId) {
    const ts = decodeTikTokSnowflakeTimestamp(extractedVideoId);
    videoCreatedWib = formatUnixToWib(ts || undefined);
  }

  const handle = (
    urlHandleMatch
      ? urlHandleMatch[1]
      : !extractedVideoId
      ? trimmed.replace(/^@/, '').split(/[/?#\s]/)[0]
      : ''
  ).trim();

  // If ONLY a bare video ID was supplied without @username, query tikwm post info too
  if (extractedVideoId && !handle) {
    const postJson = await fetchJsonSafe(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(workingUrl)}`,
      { timeoutMs: 8000, signal, proxyFirst: true }
    );
    const data =
      postJson && !Array.isArray(postJson)
        ? ((postJson as Record<string, unknown>).data as Record<string, unknown> | undefined)
        : undefined;
    const author = (data?.author as Record<string, unknown> | undefined) || {};
    const authorHandle = String(author.unique_id || '').trim();

    const lines = [
      `### 🎵 Hasil Forensik Timestamp Video TikTok (Snowflake ID)`,
      '',
      `| Parameter | Hasil Dekode |`,
      `| :--- | :--- |`,
      `| **Video / Post ID** | \`${extractedVideoId}\` |`,
      `| **Waktu Upload Eksak (Snowflake \`id >> 32\`)** | **${
        videoCreatedWib || 'Tidak terdekode'
      }** |`,
      authorHandle ? `| **Kreator Pengunggah** | **@${authorHandle}** (${author.nickname || '-'}) |` : '',
      data?.region ? `| **Region Unggahan** | \`${String(data.region).toUpperCase()}\` |` : '',
      data?.title ? `| **Caption Video** | ${String(data.title).slice(0, 180)} |` : '',
    ].filter(Boolean);

    return {
      content: lines.join('\n'),
      actionLinks: authorHandle
        ? [
            {
              label: `🎵 Buka Profil @${authorHandle}`,
              url: `https://www.tiktok.com/@${authorHandle}`,
              kind: 'external',
            },
          ]
        : undefined,
    };
  }

  if (!handle) {
    throw new Error('Username TikTok tidak valid. Contoh: `/ttosint @khaby.lame`');
  }

  // Layer 1: Fetch TikTok Public Profile SSR (__UNIVERSAL_DATA_FOR_REHYDRATION__) + Layer 2: TikWM API in parallel
  const [ssrRes, tikwmJson] = await Promise.all([
    fetchProxyTextSafe(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, {
      headers: { 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8' },
      timeoutMs: 8500,
      signal,
    }),
    fetchJsonSafe(
      `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(handle)}`,
      { timeoutMs: 8500, signal, proxyFirst: true }
    ),
  ]);

  let userObj: Record<string, unknown> = {};
  let statsObj: Record<string, unknown> = {};

  if (ssrRes?.body) {
    const scriptMatch = ssrRes.body.match(
      /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (scriptMatch?.[1]) {
      try {
        const parsed = JSON.parse(scriptMatch[1]) as Record<string, unknown>;
        const scope = (parsed.__DEFAULT_SCOPE__ || {}) as Record<string, unknown>;
        const detail = (scope['webapp.user-detail'] || {}) as Record<string, unknown>;
        const info = (detail.userInfo || {}) as Record<string, unknown>;
        if (info.user && typeof info.user === 'object') {
          userObj = info.user as Record<string, unknown>;
        }
        if (info.stats && typeof info.stats === 'object') {
          statsObj = info.stats as Record<string, unknown>;
        }
      } catch {
        // continue to TikWM fallback
      }
    }
  }

  if (
    Object.keys(userObj).length === 0 &&
    tikwmJson &&
    !Array.isArray(tikwmJson) &&
    (tikwmJson as Record<string, unknown>).data
  ) {
    const d = (tikwmJson as Record<string, unknown>).data as Record<string, unknown>;
    if (d.user && typeof d.user === 'object') {
      userObj = d.user as Record<string, unknown>;
    }
    if (d.stats && typeof d.stats === 'object') {
      statsObj = d.stats as Record<string, unknown>;
    }
  }

  if (Object.keys(userObj).length === 0) {
    throw new Error(
      `Profil publik TikTok \`@${handle}\` tidak ditemukan atau sedang dibatasi. Pastikan ejaan username benar.`
    );
  }

  const uniqueId = String(userObj.uniqueId || handle);
  const nickname = String(userObj.nickname || uniqueId);
  const userId = String(userObj.id || '-');
  const signature = String(userObj.signature || '').trim();
  const region = String(userObj.region || userObj.language || '').toUpperCase();
  const verified = Boolean(userObj.verified);
  const isPrivate = Boolean(userObj.privateAccount || userObj.secret);
  const ttSeller = Boolean(userObj.ttSeller);
  const bioLinkObj = userObj.bioLink as Record<string, unknown> | undefined;
  const bioLink = bioLinkObj?.link ? String(bioLinkObj.link) : '';

  const createdWib = formatUnixToWib(userObj.createTime as number | undefined);
  const handleModifiedWib = formatUnixToWib(
    userObj.uniqueIdModifyTime as number | undefined
  );

  const followers = Number(statsObj.followerCount || 0);
  const following = Number(statsObj.followingCount || 0);
  const hearts = Number(statsObj.heartCount || statsObj.heart || 0);
  const videos = Number(statsObj.videoCount || 0);
  const likesPerFollower = followers > 0 ? (hearts / followers).toFixed(2) : '0.00';

  const integrityNotes: string[] = [];
  if (verified) integrityNotes.push('✅ Akun Terverifikasi Resmi (Centang Biru)');
  if (ttSeller) integrityNotes.push('🛍️ Terdaftar sebagai **TikTok Shop Seller**');
  if (followers >= 10000 && hearts / Math.max(followers, 1) < 0.35 && videos > 0) {
    integrityNotes.push(
      `⚠️ Rasio Likes/Follower sangat rendah (${likesPerFollower}x) — patut diwaspadai indikasi *followers* pasif/suntikan.`
    );
  } else if (followers >= 100) {
    integrityNotes.push(
      `✅ Rasio interaksi organik wajar (${likesPerFollower} likes per follower).`
    );
  }

  const bioClues = extractBioContactsAndCity(signature);
  const actionLinks: ToolActionLink[] = [];

  if (bioClues.detectedCity) {
    actionLinks.push({
      label: `📍 Buka Lokasi Bio (${bioClues.detectedCity}) di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${bioClues.detectedCity}, Indonesia`),
      kind: 'maps',
    });
  }
  actionLinks.push({
    label: `🎵 Buka Profil TikTok @${uniqueId}`,
    url: `https://www.tiktok.com/@${uniqueId}`,
    kind: 'external',
  });
  if (bioLink) {
    actionLinks.push({
      label: '🔗 Buka Tautan Bio Eksternal',
      url: bioLink.startsWith('http') ? bioLink : `https://${bioLink}`,
      kind: 'external',
    });
  }
  if (bioClues.phones[0]) {
    const ph = bioClues.phones[0].startsWith('0')
      ? `62${bioClues.phones[0].slice(1)}`
      : bioClues.phones[0];
    actionLinks.push({
      label: '💬 Hubungi Nomor WA di Bio',
      url: `https://wa.me/${ph}`,
      kind: 'whatsapp',
    });
  }
  actionLinks.push({
    label: `📸 Cek Handle Sama di Instagram (@${uniqueId})`,
    url: `https://www.instagram.com/${uniqueId}/`,
    kind: 'external',
  });

  const lines = [
    `### 🎵 Hasil Deep TikTok OSINT — @${uniqueId}`,
    '',
    `| Parameter | Data Rehydration & Metadata |`,
    `| :--- | :--- |`,
    `| **Username & Nama** | **@${uniqueId}** (${nickname}) |`,
    `| **Numeric User ID** | \`${userId}\` |`,
    `| **Tanggal Akun Dibuat** | **${createdWib || 'Tidak diekspos'}** |`,
    handleModifiedWib
      ? `| **Terakhir Ganti Username** | ${handleModifiedWib} |`
      : '',
    `| **Region / Bahasa Akun** | \`${region || 'Global'}\` |`,
    `| **Status Privasi & Toko** | ${isPrivate ? '🔒 Akun Privat' : '🌐 Publik'} · ${
      ttSeller ? '🛍️ TikTok Shop Seller' : 'Kreator/Personal'
    } |`,
    `| **Statistik Utama** | **${followers.toLocaleString('id-ID')}** Followers · **${following.toLocaleString(
      'id-ID'
    )}** Following · **${hearts.toLocaleString('id-ID')}** Likes · **${videos.toLocaleString(
      'id-ID'
    )}** Video |`,
    videoCreatedWib
      ? `| **Waktu Upload Video (\`${extractedVideoId}\`)** | **${videoCreatedWib}** |`
      : '',
    bioLink ? `| **Tautan di Bio** | \`${bioLink}\` |` : '',
    '',
    signature ? `#### 📝 Bio / Signature\n> ${signature.replace(/\n/g, ' · ')}` : '',
    '',
    `#### 🛡️ Audit Integritas & Jejak Kontak`,
    ...integrityNotes.map((n) => `- ${n}`),
    bioClues.emails.length > 0
      ? `- 📧 **Email di Bio**: ${bioClues.emails.map((e) => `\`${e}\``).join(', ')}`
      : '',
    bioClues.phones.length > 0
      ? `- 📱 **Nomor Kontak di Bio**: ${bioClues.phones.map((p) => `\`${p}\``).join(', ')}`
      : '',
  ].filter(Boolean);

  return {
    content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 3. INSTAGRAM (IG) PUBLIC OSINT (/igosint)
// ============================================================================

export async function analyzeInstagramOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const cleaned = rawInput.trim();
  const urlMatch = cleaned.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i);
  const username = (
    urlMatch ? urlMatch[1] : cleaned.replace(/^@/, '').split(/[/?#\s]/)[0]
  )
    .trim()
    .toLowerCase();

  if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
    throw new Error('Username Instagram tidak valid. Contoh: `/igosint @folkative`');
  }

  // Multi-layer keyless recon: IG Web API + IG OpenGraph HTML + DuckDuckGo public index
  const [igApiJson, igHtmlRes, webMentions] = await Promise.all([
    fetchJsonSafe(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
        username
      )}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          Referer: `https://www.instagram.com/${username}/`,
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
        },
        timeoutMs: 8500,
        signal,
        proxyFirst: true,
      }
    ),
    fetchProxyTextSafe(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: { 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8' },
      timeoutMs: 8000,
      signal,
    }),
    searchPublicWebSnippets(`site:instagram.com/${username} OR "@${username}" instagram`, 4, signal),
  ]);

  let fullName = '';
  let bio = '';
  let categoryName = '';
  let externalUrl = '';
  let followersText = '-';
  let followingText = '-';
  let postsText = '-';
  let isPrivate = false;
  let isVerified = false;
  let isBusiness = false;
  let userId = '-';

  const apiData =
    igApiJson && !Array.isArray(igApiJson)
      ? ((igApiJson as Record<string, unknown>).data as Record<string, unknown> | undefined)
      : undefined;
  const apiUser = apiData?.user as Record<string, unknown> | undefined;

  if (apiUser) {
    fullName = String(apiUser.full_name || '').trim();
    bio = String(apiUser.biography || '').trim();
    categoryName = String(apiUser.category_name || '').trim();
    externalUrl = String(apiUser.external_url || '').trim();
    isPrivate = Boolean(apiUser.is_private);
    isVerified = Boolean(apiUser.is_verified);
    isBusiness = Boolean(apiUser.is_business_account || apiUser.is_professional_account);
    userId = String(apiUser.id || '-');

    const edgeFollowed = apiUser.edge_followed_by as Record<string, unknown> | undefined;
    const edgeFollow = apiUser.edge_follow as Record<string, unknown> | undefined;
    const edgeMedia = apiUser.edge_owner_to_timeline_media as
      | Record<string, unknown>
      | undefined;

    if (typeof edgeFollowed?.count === 'number') {
      followersText = edgeFollowed.count.toLocaleString('id-ID');
    }
    if (typeof edgeFollow?.count === 'number') {
      followingText = edgeFollow.count.toLocaleString('id-ID');
    }
    if (typeof edgeMedia?.count === 'number') {
      postsText = edgeMedia.count.toLocaleString('id-ID');
    }
  } else if (igHtmlRes?.body) {
    const ogTitle = extractMetaContent(igHtmlRes.body, 'og:title');
    const ogDesc = extractMetaContent(igHtmlRes.body, 'og:description');
    const nameMatch = ogTitle.match(/^(.+?)\s*\(@/);
    if (nameMatch) fullName = nameMatch[1].trim();

    const statsMatch = ogDesc.match(
      /([0-9.,KMBrbjt]+)\s+Followers?,\s*([0-9.,KMBrbjt]+)\s+Following,\s*([0-9.,KMBrbjt]+)\s+Posts?/i
    );
    if (statsMatch) {
      followersText = statsMatch[1];
      followingText = statsMatch[2];
      postsText = statsMatch[3];
    }
    if (ogDesc && !bio) {
      bio = ogDesc;
    }
  }

  if (!fullName && webMentions.length > 0) {
    const titleHit = webMentions[0].title.match(/^([^(@|-]+)\s*\(@/i);
    if (titleHit) fullName = titleHit[1].trim();
    if (!bio) bio = webMentions[0].snippet;
  }

  const bioClues = extractBioContactsAndCity(`${bio} ${externalUrl}`);
  const actionLinks: ToolActionLink[] = [];

  if (bioClues.detectedCity) {
    actionLinks.push({
      label: `📍 Buka Lokasi "${bioClues.detectedCity}" di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${fullName || username} ${bioClues.detectedCity} Indonesia`),
      kind: 'maps',
    });
  }
  actionLinks.push({
    label: `📸 Buka Profil Instagram @${username}`,
    url: `https://www.instagram.com/${username}/`,
    kind: 'external',
  });
  actionLinks.push({
    label: `🧵 Cek Akun Threads (@${username})`,
    url: `https://www.threads.net/@${username}`,
    kind: 'external',
  });
  actionLinks.push({
    label: `🎵 Cek Handle Sama di TikTok (@${username})`,
    url: `https://www.tiktok.com/@${username}`,
    kind: 'external',
  });
  if (externalUrl) {
    actionLinks.push({
      label: '🔗 Buka Link Bio Instagram',
      url: externalUrl,
      kind: 'external',
    });
  }
  if (bioClues.phones[0]) {
    const waNum = bioClues.phones[0].startsWith('0')
      ? `62${bioClues.phones[0].slice(1)}`
      : bioClues.phones[0];
    actionLinks.push({
      label: '💬 Chat Nomor WA di Bio IG',
      url: `https://wa.me/${waNum}`,
      kind: 'whatsapp',
    });
  }

  const mentionSection =
    webMentions.length > 0
      ? webMentions.map(
          (m, idx) =>
            `${idx + 1}. **[${m.title}](${m.url})**\n   _${m.snippet || 'Terindeks di web publik.'}_`
        )
      : ['- Belum ada kutipan eksternal tambahan di mesin pencari.'];

  const lines = [
    `### 📸 Hasil Instagram (IG) Public OSINT — @${username}`,
    '',
    `| Parameter | Intelijen Profil Publik |`,
    `| :--- | :--- |`,
    `| **Username & Nama** | **@${username}**${fullName ? ` (${fullName})` : ''} |`,
    userId !== '-' ? `| **Instagram Numeric ID** | \`${userId}\` |` : '',
    `| **Statistik Akun** | **${followersText}** Followers · **${followingText}** Following · **${postsText}** Posts |`,
    `| **Status Akun** | ${isPrivate ? '🔒 Privat' : '🌐 Publik'}${
      isVerified ? ' · ✅ Verified' : ''
    }${isBusiness ? ' · 🏢 Akun Bisnis/Profesional' : ''} |`,
    categoryName ? `| **Kategori Bisnis** | ${categoryName} |` : '',
    externalUrl ? `| **Tautan Eksternal Bio** | \`${externalUrl}\` |` : '',
    '',
    bio ? `#### 📝 Bio / Deskripsi Publik\n> ${bio.replace(/\n/g, ' · ')}` : '',
    ...(bioClues.emails.length > 0 || bioClues.phones.length > 0 || bioClues.detectedCity
      ? [
          '',
          `#### 📌 Kontak & Lokasi yang Diekstrak dari Bio`,
          bioClues.detectedCity ? `- **Kota/Lokasi Terdeteksi**: **${bioClues.detectedCity}**` : '',
          bioClues.phones.length > 0
            ? `- **Nomor Kontak/WA**: ${bioClues.phones.map((p) => `\`${p}\``).join(', ')}`
            : '',
          bioClues.emails.length > 0
            ? `- **Email Bisnis**: ${bioClues.emails.map((e) => `\`${e}\``).join(', ')}`
            : '',
        ]
      : []),
    '',
    `#### 🌐 Jejak Indeks Publik Terkait \`@${username}\``,
    ...mentionSection,
  ].filter(Boolean);

  return {
    content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 4. PURE CLIENT-SIDE BINARY PHOTO EXIF & GPS TRACKER (/exif)
// ============================================================================

export const EXIF_PARSED_PREFIX = '__EXIF_JSON__:';

export interface ExtractedExifMetadata {
  fileName?: string;
  byteSize?: number;
  make?: string;
  model?: string;
  software?: string;
  dateTimeOriginal?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
  width?: number;
  height?: number;
  gpsLat?: number;
  gpsLon?: number;
  gpsAltitude?: number;
}

function readAscii(view: DataView, start: number, count: number): string {
  let out = '';
  const max = Math.min(view.byteLength, start + count);
  for (let i = start; i < max; i++) {
    const ch = view.getUint8(i);
    if (ch === 0) break;
    if (ch >= 32 && ch <= 126) out += String.fromCharCode(ch);
  }
  return out.trim();
}

function readRational(view: DataView, offset: number, little: boolean): number | null {
  if (offset + 8 > view.byteLength) return null;
  const num = view.getUint32(offset, little);
  const den = view.getUint32(offset + 4, little);
  if (den === 0) return null;
  return num / den;
}

function parseTiffHeaderBlock(
  view: DataView,
  tiffStart: number
): ExtractedExifMetadata {
  const meta: ExtractedExifMetadata = {};
  if (tiffStart + 8 > view.byteLength) return meta;

  const endian = view.getUint16(tiffStart, false);
  const little = endian === 0x4949;
  if (!little && endian !== 0x4d4d) return meta;

  const magic = view.getUint16(tiffStart + 2, little);
  if (magic !== 0x002a) return meta;

  const ifd0Offset = view.getUint32(tiffStart + 4, little);

  const readIfd = (relOffset: number): Map<number, { type: number; count: number; valueOffset: number }> => {
    const entries = new Map<number, { type: number; count: number; valueOffset: number }>();
    const abs = tiffStart + relOffset;
    if (abs + 2 > view.byteLength) return entries;
    const count = view.getUint16(abs, little);
    for (let i = 0; i < count; i++) {
      const entryPos = abs + 2 + i * 12;
      if (entryPos + 12 > view.byteLength) break;
      const tag = view.getUint16(entryPos, little);
      const type = view.getUint16(entryPos + 2, little);
      const numValues = view.getUint32(entryPos + 4, little);
      const typeSize =
        type === 1 || type === 2 || type === 7
          ? 1
          : type === 3
          ? 2
          : type === 4 || type === 9
          ? 4
          : type === 5 || type === 10
          ? 8
          : 1;
      const totalBytes = numValues * typeSize;
      const valueOffset =
        totalBytes <= 4
          ? entryPos + 8
          : tiffStart + view.getUint32(entryPos + 8, little);
      entries.set(tag, { type, count: numValues, valueOffset });
    }
    return entries;
  };

  const getShortOrLong = (e?: { type: number; valueOffset: number }): number | undefined => {
    if (!e || e.valueOffset + 2 > view.byteLength) return undefined;
    if (e.type === 3) return view.getUint16(e.valueOffset, little);
    if (e.valueOffset + 4 <= view.byteLength) return view.getUint32(e.valueOffset, little);
    return undefined;
  };

  const ifd0 = readIfd(ifd0Offset);
  const makeEntry = ifd0.get(0x010f);
  if (makeEntry) meta.make = readAscii(view, makeEntry.valueOffset, makeEntry.count);

  const modelEntry = ifd0.get(0x0110);
  if (modelEntry) meta.model = readAscii(view, modelEntry.valueOffset, modelEntry.count);

  const softEntry = ifd0.get(0x0131);
  if (softEntry) meta.software = readAscii(view, softEntry.valueOffset, softEntry.count);

  const dt0Entry = ifd0.get(0x0132);
  if (dt0Entry) meta.dateTimeOriginal = readAscii(view, dt0Entry.valueOffset, dt0Entry.count);

  // Exif SubIFD (0x8769)
  const exifPtr = ifd0.get(0x8769);
  if (exifPtr && exifPtr.valueOffset + 4 <= view.byteLength) {
    const exifRel = view.getUint32(exifPtr.valueOffset, little);
    const exifIfd = readIfd(exifRel);

    const dtOrig = exifIfd.get(0x9003);
    if (dtOrig) {
      meta.dateTimeOriginal = readAscii(view, dtOrig.valueOffset, dtOrig.count);
    }

    const exp = exifIfd.get(0x829a);
    if (exp && exp.valueOffset + 8 <= view.byteLength) {
      const n = view.getUint32(exp.valueOffset, little);
      const d = view.getUint32(exp.valueOffset + 4, little);
      if (d > 0) meta.exposureTime = n >= d ? `${(n / d).toFixed(1)}s` : `1/${Math.round(d / Math.max(n, 1))}s`;
    }

    const fNum = exifIfd.get(0x829d);
    if (fNum) {
      const r = readRational(view, fNum.valueOffset, little);
      if (r) meta.fNumber = `f/${r.toFixed(1)}`;
    }

    const iso = exifIfd.get(0x8827);
    const isoVal = getShortOrLong(iso);
    if (isoVal) meta.iso = isoVal;

    const focal = exifIfd.get(0x920a);
    if (focal) {
      const r = readRational(view, focal.valueOffset, little);
      if (r) meta.focalLength = `${r.toFixed(1)} mm`;
    }

    meta.width = getShortOrLong(exifIfd.get(0xa002));
    meta.height = getShortOrLong(exifIfd.get(0xa003));
  }

  // GPS SubIFD (0x8825)
  const gpsPtr = ifd0.get(0x8825);
  if (gpsPtr && gpsPtr.valueOffset + 4 <= view.byteLength) {
    const gpsRel = view.getUint32(gpsPtr.valueOffset, little);
    const gpsIfd = readIfd(gpsRel);

    const latRefEntry = gpsIfd.get(0x0001);
    const latEntry = gpsIfd.get(0x0002);
    const lonRefEntry = gpsIfd.get(0x0003);
    const lonEntry = gpsIfd.get(0x0004);
    const altEntry = gpsIfd.get(0x0006);

    const readDms = (e?: { count: number; valueOffset: number }): number | null => {
      if (!e || e.count < 3 || e.valueOffset + 24 > view.byteLength) return null;
      const deg = readRational(view, e.valueOffset, little);
      const min = readRational(view, e.valueOffset + 8, little);
      const sec = readRational(view, e.valueOffset + 16, little);
      if (deg === null || min === null || sec === null) return null;
      return deg + min / 60 + sec / 3600;
    };

    const rawLat = readDms(latEntry);
    const rawLon = readDms(lonEntry);
    if (rawLat !== null && rawLon !== null) {
      const latRef = latRefEntry ? readAscii(view, latRefEntry.valueOffset, 2).toUpperCase() : 'N';
      const lonRef = lonRefEntry ? readAscii(view, lonRefEntry.valueOffset, 2).toUpperCase() : 'E';
      meta.gpsLat = latRef === 'S' ? -rawLat : rawLat;
      meta.gpsLon = lonRef === 'W' ? -rawLon : rawLon;
    }

    if (altEntry) {
      const alt = readRational(view, altEntry.valueOffset, little);
      if (alt !== null) meta.gpsAltitude = Math.round(alt * 10) / 10;
    }
  }

  return meta;
}

export function parseExifFromArrayBuffer(
  buffer: ArrayBuffer,
  fileName?: string
): ExtractedExifMetadata {
  const view = new DataView(buffer);
  if (view.byteLength < 12) {
    return { fileName, byteSize: buffer.byteLength };
  }

  // Case 1: Raw TIFF (II / MM)
  const firstWord = view.getUint16(0, false);
  if (firstWord === 0x4949 || firstWord === 0x4d4d) {
    return {
      ...parseTiffHeaderBlock(view, 0),
      fileName,
      byteSize: buffer.byteLength,
    };
  }

  // Case 2: JPEG (0xFFD8) -> scan segments for APP1 (0xFFE1 "Exif\0\0")
  if (firstWord === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xda || marker === 0xd9) break; // SOS / EOI
      const segLen = view.getUint16(offset + 2, false);
      if (segLen < 2 || offset + 2 + segLen > view.byteLength) break;

      if (
        marker === 0xe1 &&
        offset + 10 <= view.byteLength &&
        readAscii(view, offset + 4, 4) === 'Exif'
      ) {
        return {
          ...parseTiffHeaderBlock(view, offset + 10),
          fileName,
          byteSize: buffer.byteLength,
        };
      }
      offset += 2 + segLen;
    }
  }

  return { fileName, byteSize: buffer.byteLength };
}

export async function extractExifTokenFromFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const parsed = parseExifFromArrayBuffer(buf, file.name);
  return `${EXIF_PARSED_PREFIX}${JSON.stringify(parsed)}`;
}

export async function analyzePhotoExifOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error(
      'Upload foto asli dari perangkat (menu `Scan Foto Asli EXIF & GPS`) atau masukkan URL gambar `.jpg` untuk dianalisis.'
    );
  }

  let meta: ExtractedExifMetadata = {};

  if (trimmed.startsWith(EXIF_PARSED_PREFIX)) {
    meta = JSON.parse(trimmed.slice(EXIF_PARSED_PREFIX.length)) as ExtractedExifMetadata;
  } else if (trimmed.startsWith('data:image/')) {
    const base64Part = trimmed.split(',')[1] || '';
    const binStr = atob(base64Part);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    meta = parseExifFromArrayBuffer(bytes.buffer, 'lampiran-foto.jpg');
  } else if (/^https?:\/\//i.test(trimmed)) {
    const fx = getShieldedFetch();
    const res = await fx('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ targetUrl: trimmed.split(/\s+/)[0], method: 'GET', timeoutMs: 14000 }),
      signal,
    });
    const json = (await res.json()) as { ok?: boolean; imageUrl?: string };
    if (res.ok && json.ok && json.imageUrl?.includes(',')) {
      const base64Part = json.imageUrl.split(',')[1] || '';
      const binStr = atob(base64Part);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      meta = parseExifFromArrayBuffer(bytes.buffer, trimmed.split('/').pop() || 'remote.jpg');
    } else {
      throw new Error('Gagal mengunduh berkas gambar dari URL tersebut untuk pembacaan EXIF.');
    }
  } else {
    throw new Error(
      'Input EXIF harus berupa unggahan berkas foto asli atau URL `https://...` gambar JPEG/TIFF.'
    );
  }

  const hasExifFields = Boolean(
    meta.make || meta.model || meta.dateTimeOriginal || meta.gpsLat !== undefined
  );

  let reverseAddress = '';
  const actionLinks: ToolActionLink[] = [];

  if (meta.gpsLat !== undefined && meta.gpsLon !== undefined) {
    const latStr = meta.gpsLat.toFixed(6);
    const lonStr = meta.gpsLon.toFixed(6);
    const revJson = await fetchJsonSafe(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        latStr
      )}&lon=${encodeURIComponent(lonStr)}`,
      { timeoutMs: 7000, signal, proxyFirst: true }
    );
    if (revJson && !Array.isArray(revJson) && revJson.display_name) {
      reverseAddress = String(revJson.display_name);
    }

    actionLinks.push({
      label: `📍 Buka Titik Koordinat GPS Foto (${latStr}, ${lonStr}) di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${latStr},${lonStr}`),
      kind: 'maps',
    });
  }

  const lines = [
    `### 📷 Hasil Forensik Metadata EXIF & Pelacak GPS Foto`,
    '',
    `| Parameter Forensik | Data Terekstrak |`,
    `| :--- | :--- |`,
    meta.fileName ? `| **Nama Berkas** | \`${meta.fileName}\` |` : '',
    meta.byteSize
      ? `| **Ukuran Berkas Asli** | ${(meta.byteSize / 1024).toFixed(1)} KB |`
      : '',
    `| **Merek & Tipe Perangkat** | **${
      [meta.make, meta.model].filter(Boolean).join(' ') || 'Tidak ada (EXIF kosong/dihapus)'
    }** |`,
    `| **Waktu Jepretan Asli** | \`${meta.dateTimeOriginal || 'Tidak tersedia'}\` |`,
    `| **Software Pengolah** | ${meta.software || 'Kamera Asli / Tidak tercatat'} |`,
    meta.exposureTime || meta.fNumber || meta.iso || meta.focalLength
      ? `| **Parameter Lensa & Sensor** | ${[
          meta.focalLength,
          meta.fNumber,
          meta.exposureTime,
          meta.iso ? `ISO ${meta.iso}` : '',
        ]
          .filter(Boolean)
          .join(' · ')} |`
      : '',
    meta.width && meta.height
      ? `| **Resolusi Sensor EXIF** | \`${meta.width} × ${meta.height}\` px |`
      : '',
    `| **Status Koordinat GPS** | ${
      meta.gpsLat !== undefined && meta.gpsLon !== undefined
        ? `✅ **DITEMUKAN** (\`${meta.gpsLat.toFixed(6)}, ${meta.gpsLon.toFixed(6)}\`${
            meta.gpsAltitude !== undefined ? ` · Alt ${meta.gpsAltitude}m` : ''
          })`
        : 'Tidak ada tag GPS di dalam file ini'
    } |`,
    reverseAddress ? `| **Alamat Titik Foto (OSM)** | **${reverseAddress}** |` : '',
    '',
    !hasExifFields
      ? `> ℹ️ **Mengapa EXIF Kosong?** Foto yang dikirim biasa lewat **WhatsApp, Instagram, Telegram, atau X** otomatis dihapus (*stripped*) metadata EXIF & GPS-nya oleh aplikasi demi privasi. Mintalah file dikirim sebagai **Dokumen (Document)** di WhatsApp atau gunakan file asli dari Galeri kamera.`
      : meta.gpsLat !== undefined
      ? `> 💡 **Koordinat GPS Asli Ditemukan!** Klik tombol **Google Maps** di bawah untuk melihat titik persis tempat foto ini diambil.`
      : `> ℹ️ Kamera perangkat mencatat info lensa/waktu, namun fitur *Save Location / Geo-tag* kamera sedang nonaktif saat foto diambil.`,
  ].filter(Boolean);

  return {
    content: lines.join('\n'),
    actionLinks,
  };
}

// ============================================================================
// 5. SHERLOCK / WHATSMYNAME USERNAME HUNTER (/username)
// ============================================================================

export async function analyzeUsernameOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const handle = rawInput
    .trim()
    .replace(/^@/, '')
    .split(/\s+/)[0]
    .trim();

  if (!handle || !/^[A-Za-z0-9._-]{2,36}$/.test(handle)) {
    throw new Error('Masukkan username yang valid (2–36 karakter). Contoh: `/username torvalds`');
  }

  interface PlatformProbe {
    platform: string;
    profileUrl: string;
    check: () => Promise<string | boolean>;
  }

  const probes: PlatformProbe[] = [
    {
      platform: 'GitHub',
      profileUrl: `https://github.com/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
          timeoutMs: 5500,
          signal,
          proxyFirst: true,
        });
        if (j && !Array.isArray(j) && j.login) {
          return `${j.name || j.login}${j.location ? ` · ${j.location}` : ''}`;
        }
        return false;
      },
    },
    {
      platform: 'GitLab',
      profileUrl: `https://gitlab.com/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://gitlab.com/api/v4/users?username=${encodeURIComponent(handle)}`,
          { timeoutMs: 5500, signal, proxyFirst: true }
        );
        return Array.isArray(j) && j.length > 0;
      },
    },
    {
      platform: 'Reddit',
      profileUrl: `https://www.reddit.com/user/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://www.reddit.com/user/${encodeURIComponent(handle)}/about.json`,
          { timeoutMs: 5500, signal, proxyFirst: true }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).data);
      },
    },
    {
      platform: 'Dev.to',
      profileUrl: `https://dev.to/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://dev.to/api/users/by_username?url=${encodeURIComponent(handle)}`,
          { timeoutMs: 5500, signal, proxyFirst: true }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).id);
      },
    },
    {
      platform: 'Keybase',
      profileUrl: `https://keybase.io/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${encodeURIComponent(handle)}`,
          { timeoutMs: 5500, signal, proxyFirst: true }
        );
        const them = j && !Array.isArray(j) ? (j as Record<string, unknown>).them : null;
        return Array.isArray(them) && Boolean(them[0]);
      },
    },
    {
      platform: 'HackerNews',
      profileUrl: `https://news.ycombinator.com/user?id=${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(handle)}.json`,
          { timeoutMs: 5000, signal }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).id);
      },
    },
    {
      platform: 'Chess.com',
      profileUrl: `https://www.chess.com/member/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://api.chess.com/pub/player/${encodeURIComponent(handle.toLowerCase())}`,
          { timeoutMs: 5000, signal }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).player_id);
      },
    },
    {
      platform: 'Lichess',
      profileUrl: `https://lichess.org/@/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(`https://lichess.org/api/user/${encodeURIComponent(handle)}`, {
          timeoutMs: 5000,
          signal,
        });
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).id);
      },
    },
    {
      platform: 'NPM Registry',
      profileUrl: `https://www.npmjs.com/~${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(
            handle
          )}&size=1`,
          { timeoutMs: 5500, signal }
        );
        return Boolean(
          j &&
            !Array.isArray(j) &&
            typeof (j as Record<string, unknown>).total === 'number' &&
            Number((j as Record<string, unknown>).total) > 0
        );
      },
    },
    {
      platform: 'DockerHub',
      profileUrl: `https://hub.docker.com/u/${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://hub.docker.com/v2/users/${encodeURIComponent(handle.toLowerCase())}/`,
          { timeoutMs: 5500, signal, proxyFirst: true }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).username);
      },
    },
    {
      platform: 'Telegram (t.me)',
      profileUrl: `https://t.me/${handle}`,
      check: async () => {
        const r = await fetchProxyTextSafe(`https://t.me/${encodeURIComponent(handle)}`, {
          timeoutMs: 5500,
          signal,
        });
        return Boolean(r?.body && /tgme_page_title/i.test(r.body));
      },
    },
    {
      platform: 'Linktree',
      profileUrl: `https://linktr.ee/${handle}`,
      check: async () => {
        const r = await fetchProxyTextSafe(`https://linktr.ee/${encodeURIComponent(handle)}`, {
          timeoutMs: 5500,
          signal,
        });
        return Boolean(r?.ok && r.status === 200 && !/page not found/i.test(r.body.slice(0, 600)));
      },
    },
    {
      platform: 'TikTok',
      profileUrl: `https://www.tiktok.com/@${handle}`,
      check: async () => {
        const j = await fetchJsonSafe(
          `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(handle)}`,
          { timeoutMs: 6000, signal, proxyFirst: true }
        );
        return Boolean(j && !Array.isArray(j) && (j as Record<string, unknown>).data);
      },
    },
  ];

  const settled = await Promise.allSettled(
    probes.map(async (p) => ({
      platform: p.platform,
      profileUrl: p.profileUrl,
      hit: await p.check(),
    }))
  );

  const found: Array<{ platform: string; url: string; note?: string }> = [];
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value.hit) {
      found.push({
        platform: s.value.platform,
        url: s.value.profileUrl,
        note: typeof s.value.hit === 'string' ? s.value.hit : undefined,
      });
    }
  }

  const actionLinks: ToolActionLink[] = [
    ...found.slice(0, 3).map((f) => ({
      label: `✅ Buka ${f.platform} (@${handle})`,
      url: f.url,
      kind: 'external' as const,
    })),
    {
      label: `📸 Cek Instagram @${handle}`,
      url: `https://www.instagram.com/${handle}/`,
      kind: 'external',
    },
    {
      label: `𝕏 Cek X / Twitter @${handle}`,
      url: `https://x.com/${handle}`,
      kind: 'external',
    },
  ];

  const lines = [
    `### 🕵️ Hasil Sherlock Username Recon — \`@${handle}\``,
    `Memindai **${probes.length} jaringan publik** secara serentak — ditemukan **${found.length} akun aktif terkonfirmasi**:`,
    '',
    ...(found.length > 0
      ? found.map(
          (f, i) =>
            `${i + 1}. ✅ **${f.platform}**: [${f.url}](${f.url})${
              f.note ? ` — _(${f.note})_` : ''
            }`
        )
      : [
          `- Tidak ditemukan kecocokan langsung pada ${probes.length} API terbuka untuk \`@${handle}\`.`,
        ]),
    '',
    `#### 🔗 Tautan Pivot Cepat Medsos & Marketplace Indonesia`,
    `- [Instagram (@${handle})](https://www.instagram.com/${handle}/) · [Threads](https://www.threads.net/@${handle}) · [TikTok](https://www.tiktok.com/@${handle}) · [X/Twitter](https://x.com/${handle}) · [Tokopedia](https://www.tokopedia.com/${handle}) · [Shopee](https://shopee.co.id/${handle})`,
  ];

  return {
    content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 6. DOMAIN RECON, RDAP/WHOIS, SSL SUBDOMAINS (crt.sh) & SERVER MAPS (/domain)
// ============================================================================

export async function analyzeDomainOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  let cleanDomain = rawInput.trim().toLowerCase();
  if (/^https?:\/\//i.test(cleanDomain)) {
    try {
      cleanDomain = new URL(cleanDomain).hostname;
    } catch {
      // keep raw
    }
  }
  cleanDomain = cleanDomain.replace(/^www\./, '').split(/[/?#\s:]/)[0];

  if (!/^[a-z0-9.-]+\.[a-z]{2,24}$/i.test(cleanDomain)) {
    throw new Error('Nama domain tidak valid. Contoh: `/domain blognodata.my.id`');
  }

  const [aRes, mxRes, nsRes, txtRes, rdapJson, crtJson, waybackJson] = await Promise.all([
    queryDnsOverHttps(cleanDomain, 'A', signal),
    queryDnsOverHttps(cleanDomain, 'MX', signal),
    queryDnsOverHttps(cleanDomain, 'NS', signal),
    queryDnsOverHttps(cleanDomain, 'TXT', signal),
    fetchJsonSafe(`https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`, {
      timeoutMs: 7500,
      signal,
      proxyFirst: true,
    }),
    fetchJsonSafe(
      `https://crt.sh/?q=${encodeURIComponent(`%.${cleanDomain}`)}&output=json`,
      { timeoutMs: 8500, signal, proxyFirst: true }
    ),
    fetchJsonSafe(
      `https://archive.org/wayback/available?url=${encodeURIComponent(cleanDomain)}`,
      { timeoutMs: 6000, signal, proxyFirst: true }
    ),
  ]);

  const ips = aRes.answers
    .map((r) => String(r.data || '').trim())
    .filter((ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip));
  const mxList = mxRes.answers.map((r) => String(r.data || '').trim()).slice(0, 4);
  const nsList = nsRes.answers.map((r) => String(r.data || '').trim()).slice(0, 4);
  const txtList = txtRes.answers.map((r) => String(r.data || '').trim()).slice(0, 4);

  // Server IP Geo -> Google Maps
  let ipGeo: Record<string, unknown> | null = null;
  if (ips[0]) {
    const g = await fetchJsonSafe(`https://ipwho.is/${encodeURIComponent(ips[0])}`, {
      timeoutMs: 5500,
      signal,
      proxyFirst: true,
    });
    if (g && !Array.isArray(g) && g.success !== false) ipGeo = g;
  }

  // Parse RDAP registration events
  let createdDate = '-';
  let expiryDate = '-';
  let domainStatus = '-';
  if (rdapJson && !Array.isArray(rdapJson)) {
    const events = Array.isArray(rdapJson.events)
      ? (rdapJson.events as Array<Record<string, unknown>>)
      : [];
    const regEv = events.find((e) => /registration/i.test(String(e.eventAction || '')));
    const expEv = events.find((e) => /expiration/i.test(String(e.eventAction || '')));
    if (regEv?.eventDate) createdDate = String(regEv.eventDate).slice(0, 10);
    if (expEv?.eventDate) expiryDate = String(expEv.eventDate).slice(0, 10);
    if (Array.isArray(rdapJson.status)) {
      domainStatus = (rdapJson.status as string[]).slice(0, 3).join(', ');
    }
  }

  // Parse crt.sh Certificate Transparency Subdomains
  const subdomains = new Set<string>();
  if (Array.isArray(crtJson)) {
    for (const row of crtJson.slice(0, 150)) {
      const nv = String((row as Record<string, unknown>)?.name_value || '');
      for (const sub of nv.split(/\s+/)) {
        const cl = sub.trim().toLowerCase().replace(/^\*\./, '');
        if (cl.endsWith(cleanDomain) && cl !== cleanDomain && subdomains.size < 20) {
          subdomains.add(cl);
        }
      }
    }
  }

  const archivedSnap =
    waybackJson && !Array.isArray(waybackJson)
      ? ((waybackJson.archived_snapshots as Record<string, unknown> | undefined)
          ?.closest as Record<string, unknown> | undefined)
      : undefined;

  const actionLinks: ToolActionLink[] = [];
  if (ipGeo && typeof ipGeo.latitude === 'number' && typeof ipGeo.longitude === 'number') {
    actionLinks.push({
      label: `📍 Lokasi Server (${String(ipGeo.city || cleanDomain)}) di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${ipGeo.latitude},${ipGeo.longitude}`),
      kind: 'maps',
    });
  }
  actionLinks.push({
    label: `🌐 Kunjungi ${cleanDomain}`,
    url: `https://${cleanDomain}`,
    kind: 'external',
  });
  if (archivedSnap?.url) {
    actionLinks.push({
      label: '🕰️ Lihat Arsip Wayback Machine',
      url: String(archivedSnap.url),
      kind: 'external',
    });
  }

  const conn = (ipGeo?.connection as Record<string, unknown> | undefined) || {};

  const lines = [
    `### 🌐 Hasil Deep Domain Recon, RDAP & Subdomain SSL (\`${cleanDomain}\`)`,
    '',
    `| Parameter | Hasil Investigasi |`,
    `| :--- | :--- |`,
    `| **Domain Target** | \`${cleanDomain}\` |`,
    `| **IP Server Utama (A)** | ${ips.length > 0 ? ips.map((i) => `\`${i}\``).join(', ') : '_Tidak terdeteksi_'} |`,
    ipGeo
      ? `| **Lokasi & ISP Server** | **${[ipGeo.city, ipGeo.region, ipGeo.country]
          .filter(Boolean)
          .join(', ')}** · ${String(conn.isp || conn.org || '-')} |`
      : '',
    `| **Tanggal Registrasi (RDAP)** | \`${createdDate}\` · Kedaluwarsa: \`${expiryDate}\` |`,
    domainStatus !== '-' ? `| **Status Domain** | \`${domainStatus}\` |` : '',
    `| **Nameserver (NS)** | ${nsList.length > 0 ? nsList.map((n) => `\`${n}\``).join(', ') : '-'} |`,
    `| **Mail Server (MX)** | ${mxList.length > 0 ? mxList.map((m) => `\`${m}\``).join(', ') : '-'} |`,
    '',
    `#### 🔐 Subdomain Certificate Transparency (\`crt.sh\` — ${subdomains.size} Ditemukan)`,
    subdomains.size > 0
      ? Array.from(subdomains)
          .map((s) => `\`${s}\``)
          .join(', ')
      : '- Tidak ada subdomain publik tambahan pada log sertifikat SSL.',
    ...(txtList.length > 0
      ? [
          '',
          `#### 📜 Record TXT / Verifikasi Domain`,
          ...txtList.map((t) => `- \`${t.slice(0, 120)}\``),
        ]
      : []),
  ].filter(Boolean);

  return {
    content: lines.join('\n').replace(/\n(#### )/g, '\n\n$1'),
    actionLinks,
  };
}

// ============================================================================
// 7. IP / ASN / ISP / GEOLOCATION OSINT (/ip)
// ============================================================================

export async function analyzeIpOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const ip = rawInput.trim().split(/\s+/)[0];
  const isV4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  const isV6 = /^[0-9a-fA-F:]{3,39}$/.test(ip) && ip.includes(':');

  if (!isV4 && !isV6) {
    throw new Error('Alamat IP tidak valid. Contoh: `/ip 1.1.1.1` atau `/ip 103.150.190.10`');
  }

  if (
    isV4 &&
    (/^(10\.|127\.|192\.168\.|169\.254\.)/.test(ip) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip))
  ) {
    return {
      content: [
        `### 🖥️ Analisis Alamat IP Jaringan Lokal / Privat (\`${ip}\`)`,
        '',
        `Alamat \`${ip}\` merupakan **IP Private / LAN Internal (RFC 1918 / Loopback)** untuk router Wi-Fi rumah/kantor atau perangkat lokal, sehingga tidak memiliki titik geolokasi internet publik.`,
      ].join('\n'),
    };
  }

  const ptrName = isV4 ? `${ip.split('.').reverse().join('.')}.in-addr.arpa` : '';
  const [geoJson, ptrRes] = await Promise.all([
    fetchJsonSafe(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      timeoutMs: 6500,
      signal,
      proxyFirst: true,
    }),
    ptrName ? queryDnsOverHttps(ptrName, 'NS', signal) : Promise.resolve({ answers: [], reachable: false }),
  ]);

  let data =
    geoJson && !Array.isArray(geoJson) && geoJson.success !== false ? geoJson : null;
  if (!data) {
    const fb = await fetchJsonSafe(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      timeoutMs: 6500,
      signal,
      proxyFirst: true,
    });
    if (fb && !Array.isArray(fb) && !fb.error) data = fb;
  }

  if (!data) {
    throw new Error(`Gagal mengambil data geolokasi untuk IP \`${ip}\`.`);
  }

  const conn = (data.connection as Record<string, unknown> | undefined) || {};
  const tz = (data.timezone as Record<string, unknown> | undefined) || {};
  const city = String(data.city || '-');
  const region = String(data.region || '-');
  const country = String(data.country || data.country_name || '-');
  const isp = String(conn.isp || data.org || '-');
  const asn = conn.asn ? `AS${conn.asn}` : String(data.asn || '-');
  const lat = typeof data.latitude === 'number' ? data.latitude : undefined;
  const lon = typeof data.longitude === 'number' ? data.longitude : undefined;

  const isCloudHosting =
    /\b(cloudflare|amazon|aws|google\s*cloud|microsoft|digitalocean|linode|akamai|vultr|hetzner|ovh|alibaba|tencent|contabo|hostinger|biznet\s*gio)\b/i.test(
      isp
    );

  const actionLinks: ToolActionLink[] = [];
  if (lat !== undefined && lon !== undefined) {
    actionLinks.push({
      label: `📍 Buka Lokasi IP (${city}) di Google Maps`,
      url: buildGoogleMapsSearchUrl(`${lat},${lon}`),
      kind: 'maps',
    });
  }

  const lines = [
    `### 🌍 Hasil Deep IP, ASN & Geolocation OSINT — \`${ip}\``,
    '',
    `| Parameter | Detail Jaringan |`,
    `| :--- | :--- |`,
    `| **Alamat IP** | \`${ip}\` |`,
    `| **Negara & Wilayah** | **${city}, ${region}, ${country}** |`,
    lat !== undefined && lon !== undefined
      ? `| **Koordinat Perkiraan** | \`${lat}, ${lon}\` |`
      : '',
    `| **ISP / Organisasi** | **${isp}** |`,
    `| **Nomor ASN** | \`${asn}\` |`,
    `| **Klasifikasi Jaringan** | ${
      isCloudHosting
        ? '☁️ **Cloud / Data Center / Hosting / CDN / VPN**'
        : '🏠 **ISP Residensial / Seluler / Korporat**'
    } |`,
    tz.id ? `| **Zona Waktu** | \`${String(tz.id)}\` (${String(tz.utc || '')}) |` : '',
    ptrRes.answers.length > 0
      ? `| **Delegasi Reverse DNS** | \`${String(ptrRes.answers[0].data || '')}\` |`
      : '',
  ].filter(Boolean);

  return {
    content: lines.join('\n'),
    actionLinks,
  };
}

// ============================================================================
// 8. 16-DIGIT INDONESIAN NIK STRUCTURE & WILAYAH DECODER (/ceknik — Offline Legal)
// ============================================================================

function getZodiacSign(day: number, month: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries ♈';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus ♉';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini ♊';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer ♋';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo ♌';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo ♍';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra ♎';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio ♏';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius ♐';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn ♑';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius ♒';
  return 'Pisces ♓';
}

function getPasaranWeton(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const pasaran = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
  // Reference: 1970-01-01 UTC was Kamis Wage (index 3 in pasaran)
  const utcDays = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  const pIdx = (((utcDays + 3) % 5) + 5) % 5;
  return `${days[date.getDay()]} ${pasaran[pIdx]}`;
}

export async function analyzeNikOsint(
  rawInput: string,
  signal?: AbortSignal
): Promise<OsintExecutionOutput> {
  const digits = rawInput.replace(/\D/g, '');
  if (digits.length !== 16) {
    throw new Error(
      `Panjang NIK harus tepat **16 digit angka** (input Anda ${digits.length} digit). Contoh: \`/ceknik 3171011708980001\`.`
    );
  }

  const provCode = digits.slice(0, 2);
  const kabCode = digits.slice(0, 4);
  const kecCode = digits.slice(4, 6);
  const rawDay = Number(digits.slice(6, 8));
  const month = Number(digits.slice(8, 10));
  const yy = Number(digits.slice(10, 12));
  const serial = digits.slice(12, 16);

  const provinceName = KEMENDAGRI_PROVINCES[provCode];
  if (!provinceName) {
    throw new Error(
      `Kode Provinsi \`${provCode}\` tidak terdaftar dalam standar Kemendagri RI.`
    );
  }

  const isFemale = rawDay > 40;
  const day = isFemale ? rawDay - 40 : rawDay;
  const currentTwoDigitYear = new Date().getFullYear() % 100;
  const fullYear = yy <= currentTwoDigitYear ? 2000 + yy : 1900 + yy;

  const birthDate = new Date(fullYear, month - 1, day);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    throw new Error(
      'Komponen tanggal lahir pada digit ke-7 s/d ke-12 NIK tidak valid menurut kalender.'
    );
  }

  const kabKotaName =
    KEMENDAGRI_KABKOTA[kabCode] || `Kabupaten/Kota Kode ${kabCode} (${provinceName})`;

  const now = new Date();
  let ageYears = now.getFullYear() - fullYear;
  if (
    now.getMonth() < month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() < day)
  ) {
    ageYears--;
  }

  const generation =
    fullYear >= 2013
      ? 'Generasi Alpha'
      : fullYear >= 1997
      ? 'Generasi Z (Gen Z)'
      : fullYear >= 1981
      ? 'Milenial (Gen Y)'
      : fullYear >= 1965
      ? 'Generasi X'
      : 'Baby Boomer';

  const geo = await geocodePlaceIndonesia(`${kabKotaName}, ${provinceName}`, signal);

  const actionLinks: ToolActionLink[] = [
    {
      label: `📍 Buka Wilayah ${kabKotaName.slice(0, 26)} di Google Maps`,
      url: buildGoogleMapsSearchUrl(
        geo ? `${geo.lat},${geo.lon}` : `${kabKotaName}, ${provinceName}, Indonesia`
      ),
      kind: 'maps',
    },
  ];

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const lines = [
    `### 🪪 Hasil Dekode Struktur 16-Digit NIK Kemendagri`,
    '',
    `| Segmen Kode | Hasil Pembacaan Rumus Administratif |`,
    `| :--- | :--- |`,
    `| **NIK Terformat** | \`${provCode}.${ digits.slice(2, 4)}.${kecCode}.${digits.slice(
      6,
      12
    )}.${serial}\` |`,
    `| **Provinsi Penerbit (\`${provCode}\`)** | **${provinceName}** |`,
    `| **Kabupaten / Kota (\`${kabCode}\`)** | **${kabKotaName}** |`,
    `| **Kode Kecamatan (\`${provCode}.${digits.slice(2, 4)}.${kecCode}\`)** | Kecamatan ke-\`${kecCode}\` pada wilayah ${kabKotaName} |`,
    `| **Jenis Kelamin** | **${isFemale ? '👩 Perempuan (Tanggal +40)' : '👨 Laki-Laki'}** |`,
    `| **Tanggal Lahir** | **${day} ${monthNames[month - 1]} ${fullYear}** (${getPasaranWeton(
      birthDate
    )}) |`,
    `| **Usia Saat Ini** | **${ageYears} Tahun** · ${generation} · ${getZodiacSign(
      day,
      month
    )} |`,
    `| **Nomor Urut Registrasi** | \`${serial}\` |`,
    geo ? `| **Koordinat Wilayah (OSM)** | \`${geo.lat}, ${geo.lon}\` |` : '',
    '',
    `> 🔒 **100% Rumus Offline & Legal**: Penguraian ini hanya membaca struktur matematis kode wilayah Kemendagri & tanggal lahir dari 16 digit angka (tanpa mengakses database kependudukan tertutup Dukcapil).`,
  ].filter(Boolean);

  return {
    content: lines.join('\n'),
    actionLinks,
  };
}
