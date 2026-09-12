import Link from 'next/link';
import { cases } from '@/lib/predictEta';

export const metadata = {
  title: 'CourtFlight — Manifest',
  description: 'Dataset manifest and system specifications.',
};

export default function ManifestPage() {
  const totalCases = cases.length;
  const disposed = cases.filter(c => c.disposal_date).length;
  const active = totalCases - disposed;
  const caseTypes = [...new Set(cases.map(c => c.case_type))];
  const courts = [...new Set(cases.map(c => c.filing_court))];
  const jurisdictions = [...new Set(cases.map(c => c.jurisdiction))];

  const totalAdjournments = cases.reduce((s, c) => s + c.num_adjournments, 0);
  const avgAdjournments = Math.round((totalAdjournments / totalCases) * 10) / 10;
  const maxAdjournments = Math.max(...cases.map(c => c.num_adjournments));
  const caseWithMaxAdj = cases.find(c => c.num_adjournments === maxAdjournments);

  const disposedCases = cases.filter(c => c.disposal_date);
  const avgDuration = disposedCases.length > 0
    ? Math.round((disposedCases.reduce((s, c) => s + c.total_duration_days, 0) / disposedCases.length) / 365.25 * 10) / 10
    : 0;

  const complexities = ['Low', 'Medium', 'High'];
  const complexityDist = complexities.map(level => ({
    level,
    count: cases.filter(c => c.complexity === level).length,
    pct: Math.round((cases.filter(c => c.complexity === level).length / totalCases) * 100),
  }));

  return (
    <main className="min-h-screen bg-charcoal text-off-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/"><span className="font-display font-semibold text-gold tracking-tight text-lg hover:text-gold-light transition-colors">COURTFLIGHT</span></Link>
          <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
          <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">System Manifest</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Dockets</Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Trajectory</Link>
          <Link href="/manifest" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase">Manifest</Link>
        </div>
      </nav>

      <div className="px-6 md:px-16 py-12 md:py-20">
        <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" /> System Manifest // Dataset & Architecture
        </div>
        <h1 className="font-display font-medium text-5xl md:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-4">Manifest.</h1>
        <p className="font-body text-dim-grey text-lg mb-16 max-w-xl">Complete specification of the CourtFlight telemetry system.</p>

        {/* Dataset overview */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2"><span className="w-2 h-2 bg-gold inline-block" /> Dataset Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border border-hairline">
            {[
              { label: 'Total Records', value: totalCases.toLocaleString() },
              { label: 'Active', value: active.toLocaleString() },
              { label: 'Disposed', value: disposed.toLocaleString(), gold: true },
              { label: 'Disposal Rate', value: `${Math.round((disposed / totalCases) * 100)}%`, gold: true },
            ].map(({ label, value, gold }) => (
              <div key={label} className="bg-charcoal px-6 py-6">
                <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-2">{label}</span>
                <span className={`font-display text-3xl ${gold ? 'text-gold' : 'text-off-white'}`}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Adjournment intelligence */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2"><span className="w-2 h-2 bg-gold inline-block" /> Adjournment Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border border-hairline">
            <div className="bg-charcoal p-8">
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-2">Total</span>
              <span className="font-display text-4xl text-off-white block">{totalAdjournments.toLocaleString()}</span>
            </div>
            <div className="bg-charcoal p-8">
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-2">Average per Case</span>
              <span className="font-display text-4xl text-gold block">{avgAdjournments}</span>
            </div>
            <div className="bg-charcoal p-8">
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-2">Maximum</span>
              <span className="font-display text-4xl text-stamp-red block">{maxAdjournments}</span>
              {caseWithMaxAdj && <Link href={`/case/${caseWithMaxAdj.id}`} className="font-mono text-[10px] text-gold mt-2 block">{caseWithMaxAdj.id} →</Link>}
            </div>
          </div>
        </section>

        {/* Complexity */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2"><span className="w-2 h-2 bg-gold inline-block" /> Complexity Distribution</h2>
          <div className="space-y-4">
            {complexityDist.map(({ level, count, pct }) => (
              <div key={level} className="flex items-center gap-4">
                <span className={`font-mono text-xs tracking-[0.14em] uppercase w-20 ${level === 'High' ? 'text-stamp-red' : level === 'Low' ? 'text-gold' : 'text-steel-grey'}`}>{level}</span>
                <div className="flex-1 h-[3px] bg-hairline-light max-w-md"><div className={`h-full ${level === 'High' ? 'bg-stamp-red' : level === 'Low' ? 'bg-gold' : 'bg-steel-grey'}`} style={{ width: `${pct}%` }} /></div>
                <span className="font-mono text-sm text-off-white w-16 text-right">{count}</span>
                <span className="font-mono text-[10px] text-dim-grey w-10 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Technical architecture */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2"><span className="w-2 h-2 bg-gold inline-block" /> Technical Architecture</h2>
          <div className="border border-hairline">
            {[
              ['Framework', 'Next.js 14 (App Router)'],
              ['Prediction', 'k-Means clustering (33-dim feature vectors) + cohort fallback'],
              ['Confidence', 'Composite score from pool size, IQR spread, centroid distance'],
              ['Data Store', 'JSON (cases.json + cluster-stats.json) — no external DB'],
              ['Styling', 'Tailwind CSS — Sovereign Juris Design System'],
              ['Typography', 'Space Grotesk / Inter / JetBrains Mono'],
              ['Videos', '6 ambient MP4 loops (Veo 3 generated)'],
              ['Deployment', 'Vercel — zero config'],
            ].map(([key, value], idx, arr) => (
              <div key={key} className={`flex items-center justify-between px-5 py-4 ${idx < arr.length - 1 ? 'border-b border-hairline' : ''}`}>
                <span className="font-mono text-xs text-steel-grey tracking-[0.14em] uppercase">{key}</span>
                <span className="font-body text-sm text-off-white text-right max-w-sm">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-hairline pt-8">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            This system operates on {totalCases.toLocaleString()} synthetic records. The prediction engine is production-grade and designed for live eCourts/NJDG integration.
          </p>
        </section>
      </div>
    </main>
  );
}
