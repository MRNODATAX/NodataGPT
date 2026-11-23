import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Mail, RefreshCw, Trash2 } from 'lucide-react';

const API = 'https://api.mail.tm';
interface TempMailToolProps { onBack: () => void; onClose: () => void; }
type DomainItem = { domain: string; isActive: boolean; isPrivate?: boolean };
type MailSummary = {
  id: string;
  from?: { name?: string; address?: string };
  subject?: string;
  intro?: string;
  createdAt?: string;
  seen?: boolean;
};
type MailDetail = MailSummary & { text?: string; html?: string[]; hasAttachments?: boolean };
type Mailbox = { address: string; accountId: string; token: string };

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as (T & { detail?: string; message?: string }) | null;
  if (!response.ok) {
    if (response.status === 429) throw new Error('Batas permintaan Mail.tm tercapai. Tunggu sebentar sebelum mencoba lagi.');
    throw new Error(body?.detail || body?.message || `Layanan email merespons HTTP ${response.status}.`);
  }
  if (!body) throw new Error('Respons layanan email tidak valid.');
  return body;
}

function randomName(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `nd${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function TempMailTool({ onBack, onClose }: TempMailToolProps) {
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [messages, setMessages] = useState<MailSummary[]>([]);
  const [selected, setSelected] = useState<MailDetail | null>(null);
  const [busy, setBusy] = useState<'create' | 'refresh' | 'delete' | ''>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => () => {
    // Tokens and mailbox state intentionally live only in component memory; they are never written to storage.
  }, []);

  const createMailbox = async () => {
    setBusy('create'); setError(''); setNotice(''); setSelected(null); setMessages([]);
    try {
      const domainResponse = await fetch(`${API}/domains?page=1`, { headers: { Accept: 'application/ld+json' } });
      const domainPayload = await readJson<{ 'hydra:member'?: DomainItem[] }>(domainResponse);
      const domain = (domainPayload['hydra:member'] || []).find((d) => d.isActive && !d.isPrivate)?.domain
        || (domainPayload['hydra:member'] || []).find((d) => d.isActive)?.domain;
      if (!domain) throw new Error('Belum ada domain email aktif yang tersedia. Coba lagi nanti.');
      const address = `${randomName()}@${domain}`;
      const password = `${randomName()}!${randomName()}`;
      const created = await readJson<{ id: string }>(await fetch(`${API}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        body: JSON.stringify({ address, password }),
      }));
      const tokenPayload = await readJson<{ token: string }>(await fetch(`${API}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        body: JSON.stringify({ address, password }),
      }));
      if (!tokenPayload.token) throw new Error('Token inbox tidak diberikan oleh Mail.tm.');
      setMailbox({ address, accountId: created.id, token: tokenPayload.token });
      setNotice('Inbox sementara siap. Token akses hanya disimpan sementara di memori halaman ini.');
      await refreshInbox({ token: tokenPayload.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat inbox.');
    } finally { setBusy(''); }
  };

  const refreshInbox = async (target: { token: string } = mailbox || { token: '' }) => {
    if (!target.token) return;
    setBusy('refresh'); setError('');
    try {
      const payload = await readJson<{ 'hydra:member'?: MailSummary[] }>(await fetch(`${API}/messages?page=1`, {
        headers: { Authorization: `Bearer ${target.token}`, Accept: 'application/ld+json' },
      }));
      setMessages(payload['hydra:member'] || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat inbox.'); }
    finally { setBusy(''); }
  };

  const openMessage = async (item: MailSummary) => {
    if (!mailbox) return;
    setError('');
    try {
      const detail = await readJson<MailDetail>(await fetch(`${API}/messages/${encodeURIComponent(item.id)}`, {
        headers: { Authorization: `Bearer ${mailbox.token}`, Accept: 'application/ld+json' },
      }));
      setSelected(detail);
      setMessages((list) => list.map((m) => m.id === item.id ? { ...m, seen: true } : m));
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal membuka pesan.'); }
  };

  const deleteMailbox = async () => {
    if (!mailbox || !window.confirm('Hapus inbox sementara ini beserta aksesnya? Tindakan ini tidak dapat dibatalkan.')) return;
    setBusy('delete'); setError('');
    try {
      const response = await fetch(`${API}/accounts/${encodeURIComponent(mailbox.accountId)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${mailbox.token}` },
      });
      if (!response.ok && response.status !== 204) await readJson(response);
      setMailbox(null); setMessages([]); setSelected(null);
      setNotice('Inbox sementara telah dihapus.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus inbox.'); }
    finally { setBusy(''); }
  };

  const leaveTool = async (exit: () => void) => {
    if (!mailbox) { exit(); return; }
    const accepted = window.confirm('Jika keluar, akses inbox hanya di memori halaman ini akan hilang. Hapus inbox sebelum keluar?');
    if (!accepted) return;
    setBusy('delete'); setError('');
    try {
      const response = await fetch(`${API}/accounts/${encodeURIComponent(mailbox.accountId)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${mailbox.token}` },
      });
      if (!response.ok && response.status !== 204) await readJson(response);
      setMailbox(null); setMessages([]); setSelected(null);
      exit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inbox belum terhapus; tetap di halaman ini agar akses tidak hilang.');
    } finally { setBusy(''); }
  };

  const copyAddress = async () => {
    if (!mailbox) return;
    try { await navigator.clipboard.writeText(mailbox.address); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setError('Clipboard tidak tersedia. Pilih dan salin alamat secara manual.'); }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-5 sm:px-6">
      <div className="flex justify-between gap-2">
        <button type="button" onClick={() => void leaveTool(onBack)} disabled={Boolean(busy)} className="min-h-10 rounded-lg border border-white/15 px-3 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-50">← Kembali ke tools</button>
        <button type="button" onClick={() => void leaveTool(onClose)} disabled={Boolean(busy)} className="min-h-10 rounded-lg border border-white/15 px-3 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-50">Tutup</button>
      </div>
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">UTILITY · EMAIL SEMENTARA</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Temp Mail</h2>
        <p className="mt-1 text-sm text-slate-300">Buat alamat penerima sementara dan cek pesan masuk. Inbox disediakan oleh Mail.tm.</p>
      </header>
      <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
        Gunakan hanya untuk pengujian atau mengurangi spam pada layanan yang mengizinkan alamat sementara. Jangan gunakan untuk akun penting, finansial, atau informasi sensitif. Pengiriman pesan bergantung pada kebijakan situs tujuan; jangan gunakan untuk menghindari pembatasan atau verifikasi yang diwajibkan.
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
        {!mailbox ? <button type="button" disabled={Boolean(busy)} onClick={createMailbox} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-50">
          {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}Buat alamat sementara
        </button> : <>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-black/30 px-3 py-2 text-sm text-cyan-100">{mailbox.address}</code>
            <button type="button" onClick={copyAddress} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/15 px-3 text-xs text-white">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Tersalin' : 'Salin'}</button>
            <button type="button" disabled={busy === 'refresh'} onClick={() => refreshInbox()} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/15 px-3 text-xs text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy === 'refresh' ? 'animate-spin' : ''}`} />Perbarui</button>
            <button type="button" disabled={busy === 'delete'} onClick={deleteMailbox} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-red-300/25 px-3 text-xs text-red-200 disabled:opacity-50"><Trash2 className="h-4 w-4" />Hapus inbox</button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Jangan bagikan alamat ini jika pesan yang diterima bersifat pribadi. Token inbox tidak disimpan setelah halaman ditutup atau dimuat ulang.</p>
        </>}
      </div>
      {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {mailbox && <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-xl border border-white/10 bg-slate-950/50 p-3" aria-label="Daftar pesan masuk">
          <h3 className="mb-2 text-sm font-bold text-white">Pesan masuk · {messages.length}</h3>
          {messages.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">Belum ada pesan. Tekan Perbarui untuk memeriksa inbox.</p> : <ul className="max-h-80 space-y-1 overflow-y-auto">
            {messages.map((item) => <li key={item.id}><button type="button" onClick={() => openMessage(item)} className={`w-full rounded-lg p-2 text-left hover:bg-white/8 ${selected?.id === item.id ? 'bg-cyan-400/10' : ''}`}>
              <span className="block truncate text-xs font-semibold text-slate-100">{item.subject || '(Tanpa subjek)'}</span>
              <span className="mt-1 block truncate text-[11px] text-slate-400">{item.from?.name || item.from?.address || 'Pengirim'} · {item.intro || ''}</span>
            </button></li>)}
          </ul>}
        </section>
        <section className="min-h-48 rounded-xl border border-white/10 bg-slate-950/50 p-4" aria-label="Isi pesan">
          {selected ? <>
            <p className="text-xs text-slate-400">Dari: {selected.from?.address || 'tidak diketahui'}</p>
            <h3 className="mt-1 break-words text-base font-bold text-white">{selected.subject || '(Tanpa subjek)'}</h3>
            <p className="mt-1 text-[11px] text-slate-500">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</p>
            {selected.hasAttachments && <p className="mt-3 text-xs text-amber-200">Pesan memiliki lampiran. Lampiran tidak dibuka di tool ini.</p>}
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-200">{selected.text?.slice(0, 20000) || selected.intro || 'Tidak ada isi teks yang dapat ditampilkan.'}</pre>
            {selected.html?.length ? <p className="mt-3 text-[11px] text-slate-500">Versi HTML tidak dirender demi keamanan.</p> : null}
          </> : <p className="pt-12 text-center text-xs text-slate-400">Pilih pesan untuk membaca isinya dengan aman.</p>}
        </section>
      </div>}
      <p className="text-center text-[11px] text-slate-500">Email sementara disediakan oleh <a className="underline underline-offset-2 hover:text-cyan-200" href="https://mail.tm/" target="_blank" rel="noreferrer">Mail.tm</a> · API publik tunduk pada kuota dan ketentuan Mail.tm.</p>
    </div>
  );
}
