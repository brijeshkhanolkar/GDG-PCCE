import Link from 'next/link';
import { cases, predictEta } from '@/lib/predictEta';

export const metadata = {
  title: 'CourtFlight — Trajectory Analysis',
  description: 'Judicial trajectory patterns and prediction methodology.',
};

export default function TrajectoryPage() {
  // Compute trajectory stats across the dataset
  const disposedCases = cases.filter(c => c.disposal_date);
  const activeCases = cases.filter(c => !c.disposal_date);

  // Stage distribution
  const stages = ['Filed', 'Notice Issued', 'Evidence Stage', 'Arguments', 'Judgment Reserved', 'Disposed'];
  const stageCounts = stages.map(stage => ({
    stage,
    count: cases.filter(c => c.current_stage === stage).length,
    pct: Math.round((cases.filter(c => c.current_stage === stage).length / cases.length) * 100),
  }));

  // Case type durations
  const caseTypes = [...new Set(cases.map(c => c.case_type))];
  const typeStats = caseTypes.map(type => {
    const ofType = disposedCases.filter(c => c.case_type === type);
    if (ofType.length === 0) return { type, avgYears: 0, count: 0 };
    const avgDays = ofType.reduce((s, c) => s + c.total_duration_days, 0) / ofType.length;
    return { type, avgYears: Math.round((avgDays / 365.25) * 10) / 10, count: ofType.length };
  }).sort((a, b) => b.avgYears - a.avgYears);

  // Court stats
  const courts = [...new Set(cases.map(c => c.filing_court))];
  const courtStats = courts.map(court => {
    const ofCourt = cases.filter(c => c.filing_court === court);
    const disposed = ofCourt.filter(c => c.disposal_date);
    const avgAdj = ofCourt.reduce((s, c) => s + c.num_adjournments, 0) / ofCourt.length;
    return {
      court,
      total: ofCourt.length,
      disposed: disposed.length,
      avgAdjournments: Math.round(avgAdj * 10) / 10,
    };
  }).sort((a, b) => b.total - a.total);

  // Prediction methodology
  const sampleCase = activeCases[0];
  const samplePrediction = sampleCase ? predictEta(sampleCase) : null;

  return (
    <main className="min-h-screen bg-charcoal text-off-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display font-semibold text-gold tracking-tight text-lg hover:text-gold-light transition-colors">
              COURTFLIGHT
            </span>
          </Link>
          <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
          <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">
            Trajectory Analysis
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Overview</Link>
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Dockets</Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase font-bold">Trajectory</Link>
          <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Manifest</Link>
        </div>
      </nav>

      <div className="px-6 md:px-16 py-12 md:py-20">
        {/* Header */}
        <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Orbital Analytics // Jurisdictional Trajectory Patterns
        </div>
        <h1 className="font-display font-medium text-5xl md:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-4">
          Trajectory analysis.
        </h1>
        <p className="font-body text-dim-grey text-lg mb-16 max-w-xl">
          How the prediction engine works — stage distribution, case type durations, and court-level analytics derived from {cases.length.toLocaleString()} docket records.
        </p>

        {/* ─── Prediction Methodology ──────────────────────────────────── */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Prediction Methodology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border border-hairline">
            <div className="bg-charcoal p-8">
              <span className="font-display text-4xl text-gold block mb-3">01</span>
              <span className="font-display text-lg text-off-white block mb-2">Cluster Matching</span>
              <p className="font-body text-sm text-dim-grey leading-relaxed">
                For each case, the engine filters the dataset by case type and filing court to find procedurally similar cases. Falls back to jurisdiction-level matching if the court has fewer than 30 disposed records.
              </p>
            </div>
            <div className="bg-charcoal p-8">
              <span className="font-display text-4xl text-gold block mb-3">02</span>
              <span className="font-display text-lg text-off-white block mb-2">Duration Computation</span>
              <p className="font-body text-sm text-dim-grey leading-relaxed">
                From the matched cluster, only disposed cases are used. The engine computes years-to-disposal for each and returns the 25th, 50th, and 75th percentile as the ETA range.
              </p>
            </div>
            <div className="bg-charcoal p-8">
              <span className="font-display text-4xl text-gold block mb-3">03</span>
              <span className="font-display text-lg text-off-white block mb-2">Risk Assessment</span>
              <p className="font-body text-sm text-dim-grey leading-relaxed">
                The case&apos;s adjournment count is compared to the cluster average. Significantly above average triggers a &ldquo;High&rdquo; risk level; below average is &ldquo;Low&rdquo;. This directly influences the projected ETA.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Stage Distribution ──────────────────────────────────────── */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Stage Distribution
          </h2>
          <div className="space-y-4">
            {stageCounts.map(({ stage, count, pct }) => (
              <div key={stage} className="flex items-center gap-4">
                <span className="font-mono text-xs text-steel-grey tracking-[0.14em] uppercase w-44 flex-shrink-0">
                  {stage}
                </span>
                <div className="flex-1 h-[2px] bg-hairline-light relative max-w-lg">
                  <div
                    className={`h-full ${stage === 'Disposed' ? 'bg-gold' : 'bg-steel-grey'}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-off-white w-12 text-right">{count}</span>
                <span className="font-mono text-[10px] text-dim-grey w-10 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Case Type Durations ─────────────────────────────────────── */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Average Duration by Case Type (Disposed Cases)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-hairline border border-hairline">
            {typeStats.map(({ type, avgYears, count }) => (
              <div key={type} className="bg-charcoal px-6 py-6">
                <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-2">{type}</span>
                <span className="font-display text-3xl text-off-white block">
                  {avgYears}<span className="text-lg text-dim-grey ml-1">yrs</span>
                </span>
                <span className="font-mono text-[10px] text-dim-grey mt-1 block">{count} disposed cases</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Court Analytics ─────────────────────────────────────────── */}
        <section className="mb-20">
          <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Court-Level Analytics
          </h2>
          <div className="border border-hairline">
            <div className="grid grid-cols-4 px-5 py-3 border-b border-hairline bg-surface-dim">
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase">Court</span>
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase text-center">Total</span>
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase text-center">Disposed</span>
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase text-right">Avg Adjournments</span>
            </div>
            {courtStats.map(({ court, total, disposed, avgAdjournments }, idx) => (
              <div key={court} className={`grid grid-cols-4 px-5 py-3 ${idx < courtStats.length - 1 ? 'border-b border-hairline' : ''} hover:bg-surface-dim transition-colors`}>
                <span className="font-body text-sm text-off-white truncate pr-4">{court}</span>
                <span className="font-mono text-sm text-off-white text-center">{total}</span>
                <span className="font-mono text-sm text-gold text-center">{disposed}</span>
                <span className={`font-mono text-sm text-right ${avgAdjournments > 5 ? 'text-stamp-red' : 'text-off-white'}`}>{avgAdjournments}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sample prediction */}
        {samplePrediction && sampleCase && (
          <section className="mb-20">
            <h2 className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
              Sample Prediction // {sampleCase.id}
            </h2>
            <div className="border border-hairline p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-1">Cluster Size</span>
                  <span className="font-display text-2xl text-off-white">{samplePrediction.matchedClusterSize}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-1">ETA (Median)</span>
                  <span className="font-display text-2xl text-gold">{samplePrediction.etaRangeYears?.median} yrs</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-1">Risk Level</span>
                  <span className={`font-display text-2xl ${samplePrediction.delayRiskLevel === 'High' ? 'text-stamp-red' : 'text-off-white'}`}>
                    {samplePrediction.delayRiskLevel}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase block mb-1">Similar Cases</span>
                  <span className="font-display text-2xl text-off-white">{samplePrediction.similarCases?.length || 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-hairline">
                <Link href={`/case/${sampleCase.id}`} className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase hover:text-gold-light transition-colors">
                  View Full Case Telemetry →
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
