import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, X } from 'lucide-react';

interface ToolsPageFrameProps {
  title: string;
  eyebrow: string;
  description: string;
  Icon: LucideIcon;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
}

export function ToolsPageFrame({ title, eyebrow, description, Icon, onBack, onClose, children }: ToolsPageFrameProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#0e0b18] text-white">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0e0b18]/95 px-4 py-3 backdrop-blur sm:px-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200">
          <ArrowLeft className="h-4 w-4" /> Kembali ke tools
        </button>
        <button type="button" onClick={onClose} aria-label="Kembali ke chat" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200">
          <span className="hidden sm:inline">Ke Chat</span><X className="h-4 w-4" />
        </button>
      </div>
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
