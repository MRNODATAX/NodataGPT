import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Link2, QrCode } from 'lucide-react';
import * as QRCode from 'qrcode';
import { ToolsPageFrame } from './ToolsPageFrame';

interface QrGeneratorToolProps { onBack: () => void; onClose: () => void; }
type CorrectionLevel = 'L' | 'M' | 'Q' | 'H';
type FrameId = 'aurora' | 'midnight' | 'paper' | 'plum';

const QR_FRAMES: Record<FrameId, { name: string; from: string; to: string; surface: string; ink: string; accent: string; soft: string }> = {
  aurora: { name: 'Aurora', from: '#102C3C', to: '#29244D', surface: '#111827', ink: '#F8FAFC', accent: '#67E8F9', soft: '#26374B' },
  midnight: { name: 'Midnight', from: '#111827', to: '#0B1020', surface: '#0B1020', ink: '#F8FAFC', accent: '#A5B4FC', soft: '#20283A' },
  paper: { name: 'Paper', from: '#E7E9E3', to: '#F5F2E9', surface: '#FFFEFA', ink: '#29332F', accent: '#27796F', soft: '#E8ECE6' },
  plum: { name: 'Plum', from: '#39213D', to: '#211B37', surface: '#21172A', ink: '#FFF7FC', accent: '#F0ABCF', soft: '#3C2A42' },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r); ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r); ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] || char);
}

function createFramedSvg(qrSvg: string, size: number, frameId: FrameId, title: string, detail: string) {
  const frame = QR_FRAMES[frameId];
  const width = size + 152;
  const height = size + 310;
  const innerQr = qrSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)?.[1] || '';
  const qrViewBox = qrSvg.match(/\bviewBox="([^"]+)"/i)?.[1] || `0 0 ${size} ${size}`;
  const safeTitle = escapeXml(title.trim() || 'SCAN ME');
  const safeDetail = escapeXml(detail.trim() || 'Scan menggunakan kamera ponsel');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${frame.from}"/><stop offset="100%" stop-color="${frame.to}"/></linearGradient></defs><rect width="${width}" height="${height}" rx="34" fill="url(#frame)"/><rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="27" fill="${frame.surface}" stroke="${frame.accent}" stroke-opacity=".2"/><circle cx="40" cy="40" r="5" fill="${frame.accent}"/><circle cx="${width - 40}" cy="40" r="5" fill="${frame.accent}" fill-opacity=".55"/><text x="${width / 2}" y="82" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="2" fill="${frame.ink}">${safeTitle}</text><text x="${width / 2}" y="111" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="${frame.accent}">${safeDetail}</text><rect x="60" y="132" width="${size + 32}" height="${size + 32}" rx="18" fill="#fff"/><svg x="76" y="148" width="${size}" height="${size}" viewBox="${escapeXml(qrViewBox)}" shape-rendering="crispEdges">${innerQr}</svg><text x="${width / 2}" y="${height - 48}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="600" letter-spacing="1.6" fill="${frame.accent}">SCAN WITH YOUR CAMERA</text></svg>`;
}

export function QrGeneratorTool({ onBack, onClose }: QrGeneratorToolProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [value, setValue] = useState('');
  const [size, setSize] = useState(320);
  const [correction, setCorrection] = useState<CorrectionLevel>('M');
  const [frameId, setFrameId] = useState<FrameId>('aurora');
  const [frameTitle, setFrameTitle] = useState('SCAN ME');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  let targetHost = '';
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') targetHost = parsed.hostname;
  } catch { /* Plain text is also a valid QR payload. */ }
  const detailLine = targetHost || (value.trim() ? 'Scan menggunakan kamera ponsel' : 'Masukkan teks atau tautan');

  useEffect(() => {
    const canvas = canvasRef.current;
    const content = value.trim();
    let cancelled = false;
    setError('');
    setSvg('');
    setReady(false);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!content) return;

    const qrCanvas = document.createElement('canvas');
    const frame = QR_FRAMES[frameId];
    const outputWidth = size + 152;
    const outputHeight = size + 310;
    void Promise.all([
      QRCode.toCanvas(qrCanvas, content, {
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
    ]).then(([, qrSvg]) => {
      if (cancelled) return;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const out = canvas.getContext('2d');
      if (!out) return;

      const gradient = out.createLinearGradient(0, 0, outputWidth, outputHeight);
      gradient.addColorStop(0, frame.from);
      gradient.addColorStop(1, frame.to);
      roundRect(out, 0, 0, outputWidth, outputHeight, 34);
      out.fillStyle = gradient;
      out.fill();
      roundRect(out, 12, 12, outputWidth - 24, outputHeight - 24, 27);
      out.fillStyle = frame.surface;
      out.fill();
      out.strokeStyle = `${frame.accent}35`;
      out.lineWidth = 1;
      out.stroke();

      out.beginPath(); out.arc(40, 40, 5, 0, Math.PI * 2); out.fillStyle = frame.accent; out.fill();
      out.beginPath(); out.arc(outputWidth - 40, 40, 5, 0, Math.PI * 2); out.fillStyle = `${frame.accent}88`; out.fill();
      out.textAlign = 'center';
      out.textBaseline = 'middle';
      out.fillStyle = frame.ink;
      out.font = '700 27px Arial, sans-serif';
      out.fillText((frameTitle.trim() || 'SCAN ME').slice(0, 32).toUpperCase(), outputWidth / 2, 75, outputWidth - 80);
      out.fillStyle = frame.accent;
      out.font = '13px Arial, sans-serif';
      out.fillText(detailLine.slice(0, 58), outputWidth / 2, 106, outputWidth - 80);

      const qrX = 76;
      const qrY = 148;
      roundRect(out, 60, 132, size + 32, size + 32, 18);
      out.fillStyle = '#FFFFFF'; out.fill();
      out.drawImage(qrCanvas, qrX, qrY, size, size);

      out.fillStyle = frame.accent;
      out.font = '600 11px Arial, sans-serif';
      out.letterSpacing = '1.6px';
      out.fillText('SCAN WITH YOUR CAMERA', outputWidth / 2, outputHeight - 48);
      out.letterSpacing = '0px';

      setSvg(createFramedSvg(qrSvg, size, frameId, frameTitle, detailLine));
      setReady(true);
    }).catch(() => {
      if (!cancelled) setError('Teks terlalu panjang atau tidak dapat dibuat menjadi QR. Periksa isi lalu coba lagi.');
    });
    return () => { cancelled = true; };
  }, [value, size, correction, frameId, frameTitle, detailLine]);

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
    anchor.download = 'nodatagpt-qr-frame.png';
    anchor.click();
  };

  const downloadSvg = () => {
    if (!svg || !ready) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nodatagpt-qr-frame.svg';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <ToolsPageFrame title="QR Generator" eyebrow="MAKER · PROSES LOKAL" description="Buat QR dari teks atau tautan, pilih bingkai visual, lalu ekspor sebagai gambar tanpa watermark. Semua diproses di perangkat." Icon={QrCode} onBack={onBack} onClose={onClose}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.95fr)]">
        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div>
            <label htmlFor="qr-payload" className="mb-2 block text-sm font-semibold text-white">Teks atau URL</label>
            <textarea id="qr-payload" value={value} onChange={(event) => setValue(event.target.value)} maxLength={2800} rows={4} placeholder="Contoh: https://nodata.example atau teks apa pun…" className="w-full resize-y rounded-xl border border-white/12 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/60 focus:outline-none" />
            <div className="mt-1 flex justify-between gap-2 text-[11px] text-slate-400"><span>{targetHost ? <span className="inline-flex items-center gap-1 text-cyan-100"><Link2 className="h-3 w-3" />Domain tujuan: {targetHost}</span> : 'QR akan berisi teks persis seperti yang dimasukkan.'}</span><span>{value.length}/2800</span></div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-200">Pilih bingkai</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.entries(QR_FRAMES) as Array<[FrameId, typeof QR_FRAMES[FrameId]]>).map(([id, frame]) => (
                <button key={id} type="button" aria-pressed={frameId === id} onClick={() => setFrameId(id)} className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${frameId === id ? 'border-cyan-100/45 ring-2 ring-cyan-200/10' : 'border-white/10 hover:border-white/25'}`} style={{ background: `linear-gradient(135deg, ${frame.from}, ${frame.to})` }}>
                  <span className="flex h-6 w-full items-center justify-between"><span className="h-1.5 w-1.5 rounded-full" style={{ background: frame.accent }} /><span className="h-4 w-5 rounded border border-white/25 bg-white/90" /></span>
                  <span className="text-[10px] font-semibold" style={{ color: frame.ink }}>{frame.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="qr-frame-title" className="mb-1.5 block text-xs font-semibold text-slate-200">Teks judul bingkai</label>
            <input id="qr-frame-title" value={frameTitle} onChange={(event) => setFrameTitle(event.target.value)} maxLength={32} placeholder="SCAN ME" className="min-h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/50 focus:outline-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="qr-size" className="mb-2 block text-xs font-semibold text-slate-200">Ukuran QR <span className="font-normal text-slate-400">{size}px</span></label><input id="qr-size" type="range" min={220} max={520} step={20} value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full accent-cyan-300" /></div>
            <div><label htmlFor="qr-correction" className="mb-2 block text-xs font-semibold text-slate-200">Koreksi kesalahan</label><select id="qr-correction" value={correction} onChange={(event) => setCorrection(event.target.value as CorrectionLevel)} className="min-h-10 w-full rounded-lg border border-white/10 bg-[#131522] px-3 text-sm text-white focus:border-cyan-200/50 focus:outline-none"><option value="L">Rendah · L</option><option value="M">Sedang · M</option><option value="Q">Tinggi · Q</option><option value="H">Maksimum · H</option></select></div>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-100">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!ready} onClick={downloadPng} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-xs font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />PNG + bingkai</button>
            <button type="button" disabled={!ready} onClick={downloadSvg} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-slate-100 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />SVG + bingkai</button>
            <button type="button" disabled={!value.trim()} onClick={() => void copyContents()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-slate-100 hover:bg-white/5 disabled:opacity-40">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Isi tersalin' : 'Salin isi QR'}</button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">Periksa isi dan domain tujuan sebelum membagikan. Bingkai dapat dikustom tanpa menutupi kode QR; QR ini bukan bukti pembayaran.</p>
        </section>
        <aside className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#080b12] p-4 text-center sm:p-5">
          <div className="flex w-full items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Pratinjau bingkai</p><span className="text-[10px] text-slate-500">{QR_FRAMES[frameId].name}</span></div>
          <div className="flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#06080e] p-3 sm:p-4">
            {value.trim() ? <canvas ref={canvasRef} className="block h-auto w-full max-w-[420px] rounded-xl shadow-[0_18px_42px_rgba(0,0,0,.35)]" aria-label="Pratinjau kode QR dengan bingkai" /> : <div className="flex flex-col items-center gap-2 text-slate-500"><QrCode className="h-12 w-12" /><span className="text-xs">Masukkan teks atau tautan</span></div>}
          </div>
          <span className="text-[11px] text-slate-400">{ready ? 'QR dan bingkai siap diekspor' : value.trim() ? 'Membuat pratinjau…' : 'Data tidak dikirim ke server'}</span>
        </aside>
      </div>
    </ToolsPageFrame>
  );
}
