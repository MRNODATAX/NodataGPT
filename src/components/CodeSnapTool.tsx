import { useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Download, FileCode2 } from 'lucide-react';
import { ToolsPageFrame } from './ToolsPageFrame';

interface CodeSnapToolProps { onBack: () => void; onClose: () => void; }
type ThemeId = 'midnight' | 'paper' | 'berry';
const THEMES: Record<ThemeId, { label: string; outer: string; panel: string; title: string; code: string; number: string; chip: string }> = {
  midnight: { label: 'Midnight', outer: '#111827', panel: '#0B1020', title: '#F8FAFC', code: '#DCE7F5', number: '#64748B', chip: '#172033' },
  paper: { label: 'Paper', outer: '#E8EDF4', panel: '#FCFCFD', title: '#1E293B', code: '#263449', number: '#8994A5', chip: '#E8EDF4' },
  berry: { label: 'Berry', outer: '#2A1630', panel: '#1C1023', title: '#FFF7FC', code: '#F4DCEC', number: '#B889AA', chip: '#3A2140' },
};
const MAX_PREVIEW_LINES = 48;
const MAX_CODE_CHARS = 12000;

function getWrappedLines(code: string): string[] {
  const result: string[] = [];
  for (const sourceLine of code.replace(/\r\n?/g, '\n').split('\n')) {
    if (!sourceLine) { result.push(''); continue; }
    for (let index = 0; index < sourceLine.length; index += 76) result.push(sourceLine.slice(index, index + 76));
  }
  return result;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
}

export function CodeSnapTool({ onBack, onClose }: CodeSnapToolProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [code, setCode] = useState('const greeting = "Halo, NodataGPT!";\nconsole.log(greeting);');
  const [language, setLanguage] = useState('JavaScript');
  const [theme, setTheme] = useState<ThemeId>('midnight');
  const [ready, setReady] = useState(false);
  const lines = useMemo(() => getWrappedLines(code), [code]);
  const overflow = lines.length > MAX_PREVIEW_LINES;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || overflow) { setReady(false); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { setReady(false); return; }
    const palette = THEMES[theme];
    const width = 1280;
    const lineHeight = 38;
    const top = 128;
    const bottom = 54;
    const height = top + Math.max(lines.length, 1) * lineHeight + bottom;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    roundedRect(ctx, 0, 0, width, height, 30);
    ctx.fillStyle = palette.outer;
    ctx.fill();
    roundedRect(ctx, 42, 42, width - 84, height - 84, 20);
    ctx.fillStyle = palette.panel;
    ctx.fill();

    for (const [index, color] of ['#FB7185', '#FBBF24', '#34D399'].entries()) {
      ctx.beginPath(); ctx.arc(78 + index * 30, 77, 8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    }
    ctx.font = '600 20px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = palette.title;
    ctx.fillText('Code Snap', 168, 84);
    const languageWidth = Math.max(100, ctx.measureText(language).width + 36);
    roundedRect(ctx, width - 72 - languageWidth, 60, languageWidth, 34, 12);
    ctx.fillStyle = palette.chip; ctx.fill();
    ctx.font = '600 15px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = palette.code;
    ctx.fillText(language, width - 54 - languageWidth, 82);

    ctx.font = '22px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    lines.forEach((line, index) => {
      const y = top + index * lineHeight + lineHeight / 2;
      ctx.fillStyle = palette.number;
      ctx.textAlign = 'right';
      ctx.fillText(String(index + 1), 112, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = palette.code;
      ctx.fillText(line, 144, y, width - 220);
    });
    setReady(true);
  }, [language, lines, overflow, theme]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready || overflow) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'nodatagpt-code-snap.png';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  return (
    <ToolsPageFrame title="Code Snap" eyebrow="MAKER · EKSPOR PNG LOKAL" description="Susun cuplikan kode menjadi kartu gambar. Pratinjau dan ekspor dilakukan di browser; kode tidak dijalankan atau diunggah." Icon={Code2} onBack={onBack} onClose={onClose}>
      <div className="grid gap-4 xl:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div><label htmlFor="code-snap-source" className="mb-2 block text-sm font-semibold text-white">Kode</label><textarea id="code-snap-source" value={code} maxLength={MAX_CODE_CHARS} onChange={(event) => setCode(event.target.value)} rows={15} spellCheck={false} className="w-full resize-y rounded-xl border border-white/12 bg-[#070910] p-3 font-mono text-xs leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-cyan-200/60 focus:outline-none" placeholder="Tempel cuplikan kode…" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="code-snap-language" className="mb-1.5 block text-xs font-semibold text-slate-200">Label bahasa</label><select id="code-snap-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="min-h-10 w-full rounded-lg border border-white/10 bg-[#131522] px-3 text-sm text-white"><option>JavaScript</option><option>TypeScript</option><option>Python</option><option>HTML</option><option>CSS</option><option>JSON</option><option>SQL</option><option>Plain text</option></select></div>
            <div><label htmlFor="code-snap-theme" className="mb-1.5 block text-xs font-semibold text-slate-200">Tema kartu</label><select id="code-snap-theme" value={theme} onChange={(event) => setTheme(event.target.value as ThemeId)} className="min-h-10 w-full rounded-lg border border-white/10 bg-[#131522] px-3 text-sm text-white">{Object.entries(THEMES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></div>
          </div>
          <p className="text-[11px] text-slate-400">{code.length.toLocaleString('id-ID')}/{MAX_CODE_CHARS.toLocaleString('id-ID')} karakter · {lines.length} baris pratinjau</p>
          {overflow && <p role="alert" className="rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-2.5 text-xs text-amber-100">Pratinjau dibatasi {MAX_PREVIEW_LINES} baris. Pendekkan kode agar seluruh cuplikan masuk ke gambar.</p>}
          <button type="button" disabled={!ready || overflow} onClick={downloadPng} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Unduh gambar PNG</button>
        </section>
        <section className="min-w-0 space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-white">Pratinjau kartu</h2><span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><FileCode2 className="h-3.5 w-3.5" />Ekspor lokal</span></div>
          <div className="overflow-x-auto rounded-xl bg-[#090B12] p-3 sm:p-4">{overflow ? <div className="flex min-h-48 items-center justify-center text-center text-xs text-slate-400">Pendekkan cuplikan untuk melihat pratinjau utuh.</div> : <canvas ref={canvasRef} className="block h-auto w-full" aria-label="Pratinjau gambar cuplikan kode" />}</div>
        </section>
      </div>
    </ToolsPageFrame>
  );
}
