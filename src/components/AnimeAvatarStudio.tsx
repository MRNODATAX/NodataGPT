import { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, Loader2 } from 'lucide-react';

const THEMES = [
  { id: 'violet', label: 'Violet', from: '#312e81', to: '#c026d3' },
  { id: 'sakura', label: 'Sakura', from: '#831843', to: '#fb7185' },
  { id: 'ocean', label: 'Ocean', from: '#0e7490', to: '#2563eb' },
  { id: 'forest', label: 'Forest', from: '#14532d', to: '#0f766e' },
];

export function AnimeAvatarStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [name, setName] = useState('My Anime Avatar');
  const [theme, setTheme] = useState(THEMES[0]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => image?.close(), [image]);
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = 900; const height = 1125;
    canvas.width = width; canvas.height = height;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, theme.from); gradient.addColorStop(1, theme.to);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    // Original graphic treatment, not copied from any referenced site.
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i < 36; i++) {
      const x = (i * 191 + 53) % width; const y = (i * 277 + 31) % height;
      ctx.beginPath(); ctx.arc(x, y, (i % 4) + 1.5, 0, Math.PI * 2); ctx.fill();
    }
    const cx = width / 2; const cy = 470; const radius = 274;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    if (image) {
      const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
      const iw = image.width * scale; const ih = image.height * scale;
      ctx.drawImage(image, cx - iw / 2, cy - ih / 2, iw, ih);
    } else {
      ctx.fillStyle = 'rgba(8,12,30,.48)'; ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '700 36px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Pilih foto', cx, cy + 12);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.font = '700 24px system-ui'; ctx.fillText('NODATAGPT · AVATAR STUDIO', cx, 850);
    ctx.fillStyle = '#fff'; ctx.font = '800 50px system-ui';
    const trimmed = name.trim().slice(0, 32) || 'My Anime Avatar';
    ctx.fillText(trimmed, cx, 925, 780);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 23px system-ui'; ctx.fillText('Original creator card', cx, 985);
  }, [image, name, theme]);

  const chooseFile = async (next?: File) => {
    if (!next) return;
    setError(''); setDownloadUrl('');
    if (!next.type.startsWith('image/')) { setError('Pilih file gambar.'); return; }
    if (next.size > 20 * 1024 * 1024) { setError('Ukuran maksimal gambar 20 MB.'); return; }
    try {
      const bitmap = await createImageBitmap(next, { imageOrientation: 'from-image' });
      setImage(bitmap); setFile(next);
    } catch { setError('Gambar tidak dapat dibuka oleh browser.'); }
  };

  const exportPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true); setError('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Ekspor PNG gagal.')), 'image/png'));
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal membuat gambar.'); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-200">NODATAGPT · CREATOR STUDIO</p><h2 className="mt-1 text-2xl font-black text-white">Anime Avatar Studio</h2><p className="mt-1 text-sm text-slate-300">Buat kartu avatar original dari fotomu. Semua pengolahan dilakukan lokal di browser.</p></header>
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)]">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-fuchsia-200/30 bg-white/[0.03] px-4 text-sm text-slate-100 hover:bg-white/[0.07]"><ImagePlus className="h-4 w-4" />{file ? file.name : 'Pilih foto dari perangkat · maks. 20 MB'}</button>
        <label className="block text-sm text-slate-200">Nama pada kartu<input value={name} maxLength={32} onChange={(e) => { setName(e.target.value); setDownloadUrl(''); }} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-white" /></label>
        <fieldset><legend className="mb-2 text-sm text-slate-200">Tema latar</legend><div className="flex flex-wrap gap-2">{THEMES.map((item) => <button key={item.id} type="button" aria-pressed={theme.id === item.id} onClick={() => { setTheme(item); setDownloadUrl(''); }} className={`min-h-10 rounded-lg border px-3 text-xs ${theme.id === item.id ? 'border-white/60 text-white' : 'border-white/15 text-slate-300'}`} style={{ background: `linear-gradient(120deg,${item.from},${item.to})` }}>{item.label}</button>)}</div></fieldset>
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/5 p-3 text-xs text-emerald-100">Privasi: foto tidak diunggah. Hindari gambar yang tidak kamu miliki atau tidak punya izin untuk digunakan.</div>
        {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
        <button type="button" onClick={exportPng} disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-700 px-4 text-sm font-bold text-white hover:bg-fuchsia-600 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Ekspor kartu PNG</button>
        {downloadUrl && <a href={downloadUrl} download="nodatagpt-anime-avatar.png" className="block rounded-xl border border-cyan-200/25 bg-cyan-400/10 p-3 text-center text-sm font-semibold text-cyan-100">Unduh PNG</a>}
      </div>
      <div className="flex items-start justify-center rounded-2xl border border-white/10 bg-black/20 p-3"><canvas ref={canvasRef} aria-label="Pratinjau kartu avatar" className="h-auto max-h-[65vh] w-full max-w-[420px] rounded-xl object-contain" /></div>
    </div>
  </div>;
}
