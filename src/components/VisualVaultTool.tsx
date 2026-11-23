import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const VISUALS = [
  { id: 'aurora', title: 'Aurora Holografik', label: 'GRADIENT', style: 'from-cyan-400/60 via-violet-500/45 to-fuchsia-500/50' },
  { id: 'orbit', title: 'Orbit Kosmik', label: 'CSS ORBIT', style: 'from-indigo-500/50 via-sky-400/30 to-slate-950' },
  { id: 'sakura', title: 'Sakura Senja', label: 'ANIME MOOD', style: 'from-pink-300/50 via-rose-500/30 to-violet-950' },
  { id: 'neon', title: 'Neon Grid', label: 'PERSPECTIVE', style: 'from-emerald-400/40 via-cyan-500/25 to-slate-950' },
  { id: 'moon', title: 'Moon Garden', label: 'NIGHTSCAPE', style: 'from-blue-300/45 via-indigo-600/35 to-slate-950' },
  { id: 'prism', title: 'Prism Bloom', label: 'COLOR STUDY', style: 'from-amber-300/45 via-fuchsia-500/35 to-indigo-950' },
];

export function VisualVaultTool() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6">
      <div className="rounded-3xl border border-cyan-200/15 bg-[radial-gradient(ellipse_at_80%_0%,rgba(34,211,238,.18),transparent_50%),linear-gradient(125deg,#0c1228,#101026_60%,#101e28)] p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">NODATAGPT · VISUAL LAB</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Visual Vault</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Eksplorasi visual orisinal berbasis CSS. Ringan, berjalan lokal, dan tidak memuat aset dari situs referensi.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VISUALS.map((item, index) => {
          const isActive = active === item.id;
          return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65">
            <div className={`relative isolate flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br ${item.style}`}>
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_30%,rgba(255,255,255,.24),transparent_28%),radial-gradient(circle_at_78%_68%,rgba(255,255,255,.17),transparent_20%)]" />
              {item.id === 'orbit' ? <div className={`relative h-20 w-20 rounded-full border border-white/45 shadow-[0_0_36px_rgba(165,243,252,.4)] ${isActive ? 'vv-orbit' : ''}`}><span className="absolute -right-3 top-1/2 h-3 w-3 rounded-full bg-cyan-100 shadow-[0_0_16px_4px_rgba(165,243,252,.7)]" /><span className="absolute inset-4 rounded-full bg-indigo-200/50 blur-md" /></div> : item.id === 'neon' ? <div className="absolute inset-x-0 bottom-0 h-2/3 origin-bottom -skew-y-6 border-t border-emerald-100/30 bg-[linear-gradient(rgba(167,243,208,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(167,243,208,.18)_1px,transparent_1px)] bg-[size:26px_26px] [transform:perspective(180px)_rotateX(24deg)]" /> : <Sparkles className={`h-12 w-12 text-white/80 drop-shadow-[0_0_18px_rgba(255,255,255,.6)] ${isActive ? 'vv-glow' : ''}`} />}
              <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/25 px-2 py-1 text-[9px] font-bold tracking-[0.16em] text-white/85">{item.label}</span>
              {index === 2 && <span className="absolute right-3 top-3 text-lg" aria-hidden="true">🌸</span>}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <button type="button" aria-pressed={isActive} onClick={() => setActive(isActive ? null : item.id)} className="min-h-9 shrink-0 rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 hover:border-cyan-200/35 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">{isActive ? 'Hentikan' : 'Pratinjau'}</button>
            </div>
          </article>;
        })}
      </div>
      <style>{`@keyframes vv-orbit{to{transform:rotate(360deg)}}@keyframes vv-glow{50%{opacity:.5;filter:drop-shadow(0 0 24px rgba(255,255,255,.8))}}@media(prefers-reduced-motion:no-preference){.vv-orbit{animation:vv-orbit 8s linear infinite}.vv-glow{animation:vv-glow 1.6s ease-in-out infinite}}`}</style>
    </div>
  );
}
