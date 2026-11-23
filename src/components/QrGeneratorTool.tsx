import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Link2, QrCode } from 'lucide-react';
import * as QRCode from 'qrcode';
import { ToolsPageFrame } from './ToolsPageFrame';

interface QrGeneratorToolProps { onBack: () => void; onClose: () => void; }

type CorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export function QrGeneratorTool({ onBack, onClose }: QrGeneratorToolProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [value, setValue] = useState('');
  const [size, setSize] = useState(320);
  const [correction, setCorrection] = useState<CorrectionLevel>('M');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const content = value.trim();
    let cancelled = false;
    setError('');
    setSvg('');
    setReady(false);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);
    if (!content) return;

    void Promise.all([
      QRCode.toCanvas(canvas, content, {
        width: size,
        margin: 2,
        errorCorrectionLevel: correction,
        color: { dark: '#11121A', light: '#FFFFFF' },
      }),
      QRCode.toString(content, {
        type: 'svg',
        width: size,
        margin: 2,
        errorCorrectionLevel: correction,
        color: { dark: '#11121A', light: '#FFFFFF' },
      }),
    ]).then(([, svgText]) => {
      if (cancelled) return;
      setSvg(svgText);
      setReady(true);
    }).catch(() => {
      if (!cancelled) setError('Teks terlalu panjang atau tidak dapat dibuat menjadi QR. Periksa isi lalu coba lagi.');
    });
    return () => { cancelled = true; };
  }, [value, size, correction]);

  const copyContents = async () => {
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Clipboard tidak tersedia. Pilih teks secara manual untuk menyalinnya.');
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = 'nodatagpt-qr.png';
    anchor.click();
  };

  const downloadSvg = () => {
    if (!svg || !ready) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nodatagpt-qr.svg';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  let targetHost = '';
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') targetHost = parsed.hostname;
  } catch { /* Plain text is also a valid QR payload. */ }

  return (
    <ToolsPageFrame title="QR Generator" eyebrow="MAKER · PROSES LOKAL" description="Buat kode QR dari teks atau tautan. Isi QR ditampilkan sebelum diunduh dan diproses di perangkat ini." Icon={QrCode} onBack={onBack} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div>
            <label htmlFor="qr-payload" className="mb-2 block text-sm font-semibold text-white">Teks atau URL</label>
            <textarea id="qr-payload" value={value} onChange={(event) => setValue(event.target.value)} maxLength={2800} rows={5} placeholder="Contoh: https://nodata.example atau teks apa pun…" className="w-full resize-y rounded-xl border border-white/12 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/60 focus:outline-none" />
            <div className="mt-1 flex justify-between gap-2 text-[11px] text-slate-400"><span>{targetHost ? <span className="inline-flex items-center gap-1 text-cyan-100"><Link2 className="h-3 w-3" />Domain tujuan: {targetHost}</span> : 'QR akan berisi teks persis seperti yang dimasukkan.'}</span><span>{value.length}/2800</span></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="qr-size" className="mb-2 block text-xs font-semibold text-slate-200">Ukuran keluaran <span className="font-normal text-slate-400">{size}px</span></label><input id="qr-size" type="range" min={220} max={520} step={20} value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full accent-cyan-300" /></div>
            <div><label htmlFor="qr-correction" className="mb-2 block text-xs font-semibold text-slate-200">Koreksi kesalahan</label><select id="qr-correction" value={correction} onChange={(event) => setCorrection(event.target.value as CorrectionLevel)} className="min-h-10 w-full rounded-lg border border-white/10 bg-[#131522] px-3 text-sm text-white focus:border-cyan-200/50 focus:outline-none"><option value="L">Rendah · L</option><option value="M">Sedang · M</option><option value="Q">Tinggi · Q</option><option value="H">Maksimum · H</option></select></div>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-100">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!ready} onClick={downloadPng} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-xs font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Unduh PNG</button>
            <button type="button" disabled={!ready} onClick={downloadSvg} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-slate-100 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Unduh SVG</button>
            <button type="button" disabled={!value.trim()} onClick={() => void copyContents()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-slate-100 hover:bg-white/5 disabled:opacity-40">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Isi tersalin' : 'Salin isi QR'}</button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">Sebelum membagikan QR, pastikan isi dan domain tujuan benar. Generator ini tidak membuat atau memverifikasi bukti pembayaran.</p>
        </section>
        <aside className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Pratinjau QR</p>
          <div className="flex min-h-[280px] w-full items-center justify-center rounded-xl bg-white p-3">
            {value.trim() ? <canvas ref={canvasRef} className="max-h-full max-w-full" aria-label="Pratinjau kode QR" /> : <div className="flex flex-col items-center gap-2 text-slate-400"><QrCode className="h-12 w-12" /><span className="text-xs">Masukkan teks atau tautan</span></div>}
          </div>
          <span className="text-[11px] text-slate-400">{ready ? 'Siap diunduh · dibuat lokal' : value.trim() ? 'Membuat pratinjau…' : 'Data tidak dikirim ke server'}</span>
        </aside>
      </div>
    </ToolsPageFrame>
  );
}
