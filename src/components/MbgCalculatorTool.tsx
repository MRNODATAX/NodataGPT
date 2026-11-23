import { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { ToolsPageFrame } from './ToolsPageFrame';

interface MbgCalculatorToolProps { onBack: () => void; onClose: () => void; }
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function MbgCalculatorTool({ onBack, onClose }: MbgCalculatorToolProps) {
  const [budgetInput, setBudgetInput] = useState('');
  const [costInput, setCostInput] = useState('');
  const [dailyInput, setDailyInput] = useState('');
  const result = useMemo(() => {
    if (!budgetInput.trim() || !costInput.trim() || !dailyInput.trim()) return null;
    const budget = Number(budgetInput);
    const costPerPortion = Number(costInput);
    const portionsPerDay = Number(dailyInput);
    if (![budget, costPerPortion, portionsPerDay].every(Number.isFinite) || budget < 0 || costPerPortion <= 0 || portionsPerDay <= 0) return null;
    const portionCount = Math.floor(budget / costPerPortion);
    return { portionCount, days: portionCount / portionsPerDay, usedBudget: portionCount * costPerPortion, remainingBudget: budget - portionCount * costPerPortion };
  }, [budgetInput, costInput, dailyInput]);

  const numericInputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/60 focus:outline-none';
  return (
    <ToolsPageFrame title="Kalkulator MBG" eyebrow="TOOLS · ESTIMASI ANGGARAN" description="Perkirakan berapa porsi dan hari anggaran dapat mencukupi berdasarkan asumsi yang kamu masukkan." Icon={Calculator} onBack={onBack} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.9fr)]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div><label htmlFor="mbg-budget" className="text-sm font-semibold text-white">Anggaran tersedia</label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span><input id="mbg-budget" type="number" min="0" step="10000" inputMode="numeric" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} placeholder="Contoh: 10000000" className={`${numericInputClass} pl-9`} /></div></div>
          <div><label htmlFor="mbg-cost" className="text-sm font-semibold text-white">Asumsi biaya per porsi</label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span><input id="mbg-cost" type="number" min="1" step="500" inputMode="numeric" value={costInput} onChange={(event) => setCostInput(event.target.value)} placeholder="Masukkan biaya yang ingin dihitung" className={`${numericInputClass} pl-9`} /></div></div>
          <div><label htmlFor="mbg-daily" className="text-sm font-semibold text-white">Jumlah porsi per hari</label><input id="mbg-daily" type="number" min="1" step="1" inputMode="numeric" value={dailyInput} onChange={(event) => setDailyInput(event.target.value)} placeholder="Contoh: 250" className={numericInputClass} /></div>
          <div className="flex gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3 text-xs leading-relaxed text-amber-50/90"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>Ini simulasi matematika berdasarkan angka yang kamu masukkan, bukan tarif resmi atau proyeksi operasional pemerintah.</p></div>
          {budgetInput.trim() && costInput.trim() && dailyInput.trim() && !result && <p role="alert" className="text-xs text-red-200">Masukkan angka valid: anggaran tidak negatif, biaya per porsi dan porsi harian harus lebih dari nol.</p>}
        </section>
        <section aria-live="polite" className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <h2 className="text-sm font-bold text-white">Hasil estimasi</h2>
          {!result ? <div className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-center text-slate-400"><Calculator className="h-8 w-8" /><p className="max-w-xs text-xs">Lengkapi ketiga nilai untuk melihat perhitungan.</p></div> : <>
            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.06] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Porsi terjangkau</p><strong className="mt-1 block text-xl font-black text-cyan-100">{integer.format(result.portionCount)}</strong></article>
              <article className="rounded-xl border border-violet-200/15 bg-violet-200/[0.06] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Cakupan waktu</p><strong className="mt-1 block text-xl font-black text-violet-100">{new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(result.days)} hari</strong></article>
            </div>
            <dl className="space-y-2 rounded-xl border border-white/8 bg-black/20 p-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-400">Anggaran terpakai (porsi utuh)</dt><dd className="font-semibold text-white">{currency.format(result.usedBudget)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Sisa anggaran</dt><dd className="font-semibold text-white">{currency.format(result.remainingBudget)}</dd></div></dl>
            <p className="text-[11px] leading-relaxed text-slate-400">Rumus: porsi = pembulatan ke bawah (anggaran ÷ biaya/porsi); hari = porsi ÷ porsi/hari.</p>
          </>}
        </section>
      </div>
    </ToolsPageFrame>
  );
}
