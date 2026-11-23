import { useEffect, useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';

interface AnimeItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  url?: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  score?: number | null;
  year?: number | null;
  episodes?: number | null;
  type?: string | null;
  status?: string | null;
  synopsis?: string | null;
  genres?: Array<{ name: string }>;
}

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; items: AnimeItem[] }>();

export function AnimeDiscoverTool() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [heading, setHeading] = useState('Anime populer');

  const request = async (term: string, signal?: AbortSignal) => {
    const key = term.trim().toLowerCase() || '__top__';
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      setItems(cached.items);
      setError('');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const endpoint = key === '__top__'
        ? 'https://api.jikan.moe/v4/top/anime?limit=12&sfw'
        : `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(term.trim())}&limit=12&sfw`;
      const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
      if (response.status === 429) throw new Error('Jikan membatasi permintaan sementara. Tunggu sebentar lalu coba lagi.');
      if (!response.ok) throw new Error(`Layanan katalog anime merespons HTTP ${response.status}.`);
      const payload = await response.json() as { data?: AnimeItem[] };
      const result = Array.isArray(payload.data) ? payload.data : [];
      cache.set(key, { at: Date.now(), items: result });
      setItems(result);
      if (!result.length) setError('Belum ada hasil. Coba judul atau ejaan lain.');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Gagal memuat katalog anime.');
    } finally { setBusy(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    setHeading('Anime populer');
    void request('', controller.signal);
    return () => controller.abort();
  }, []);

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) {
      setHeading('Anime populer');
      void request('');
      return;
    }
    setHeading(`Hasil pencarian: ${clean}`);
    void request(clean);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-[radial-gradient(ellipse_at_80%_0%,rgba(217,70,239,.24),transparent_45%),linear-gradient(135deg,#111128,#09101f_62%,#1c1028)] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-fuchsia-200/10" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-200">NODATAGPT · ANIME CORNER</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Anime Discover</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Jelajahi judul populer dan cari anime berdasarkan nama. Katalog baca-saja, tanpa login.</p>
        <form onSubmit={search} className="mt-5 flex gap-2">
          <label className="sr-only" htmlFor="anime-discover-query">Cari judul anime</label>
          <input id="anime-discover-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Contoh: Frieren, One Piece…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-300/60 focus:outline-none" />
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-fuchsia-700 px-4 text-sm font-bold text-white hover:bg-fuchsia-600 disabled:opacity-50"><Search className="h-4 w-4" /><span className="hidden sm:inline">Cari</span></button>
        </form>
      </div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-white">{heading}</h3>
        {busy && <span className="inline-flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Memuat…</span>}
      </div>
      {error && <p role="status" className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100">{error}</p>}
      {!busy && items.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const poster = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
          return <article key={item.mal_id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 transition-colors hover:border-fuchsia-300/30">
            <a href={item.url || `https://myanimelist.net/anime/${item.mal_id}`} target="_blank" rel="noreferrer" className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-fuchsia-950 to-slate-900">
                {poster ? <img src={poster} alt={`Poster: ${item.title}`} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-8 w-8 text-fuchsia-200/50" /></div>}
                {item.score != null && item.score > 0 && <span className="absolute right-2 top-2 rounded-lg bg-black/75 px-2 py-1 text-xs font-bold text-amber-200">★ {item.score.toFixed(1)}</span>}
              </div>
              <div className="p-3">
                <h4 className="line-clamp-2 min-h-10 text-sm font-bold text-white">{item.title_english || item.title}</h4>
                <p className="mt-1 text-[11px] text-slate-400">{[item.type, item.year, item.episodes ? `${item.episodes} eps` : null].filter(Boolean).join(' · ') || 'Info tidak tersedia'}</p>
                {item.synopsis && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{item.synopsis}</p>}
              </div>
            </a>
          </article>;
        })}
      </div>}
      <p className="text-center text-[11px] leading-relaxed text-slate-500">Metadata dan poster dimuat dari Jikan API / MyAnimeList. Jikan adalah API komunitas tidak resmi dan tidak berafiliasi dengan MyAnimeList. <a className="underline hover:text-fuchsia-200" href="https://docs.api.jikan.moe/" target="_blank" rel="noreferrer">Dokumentasi Jikan</a>.</p>
    </div>
  );
}
