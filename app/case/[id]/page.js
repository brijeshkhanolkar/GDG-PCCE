import { notFound } from 'next/navigation';
import BackgroundVideo from '@/components/BackgroundVideo';
import BoardingPass from '@/components/BoardingPass';
import JourneyTimeline from '@/components/JourneyTimeline';
import DelayReportRow from '@/components/DelayReportRow';
import ClusterStats from '@/components/ClusterStats';
import { predictEta, getCaseById } from '@/lib/predictEta';
import Link from 'next/link';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

export default function CaseDetailPage({ params }) {
  const { id } = params;
  const caseData = getCaseById(id);
  if (!caseData) notFound();

  const prediction = predictEta(caseData);
  if (!prediction) notFound();

  const isDisposed = caseData.current_stage === 'Disposed';
  const isHighRisk = prediction.delayRiskLevel === 'High';
  const turbulence = prediction.turbulence;

  const trackerVideoSrc = isDisposed
    ? 'tracker-landed'
    : isHighRisk ? 'tracker-delayed' : 'tracker-ontime';

  const velocityPct = Math.min(100, Math.round((caseData.days_elapsed / (caseData.total_duration_days || 1000)) * 100));
  const etaDisplay = prediction.etaDateRange
    ? `${formatDate(prediction.etaDateRange.earliest)} – ${formatDate(prediction.etaDateRange.latest)}`
    : '—';

  return (
    <main className="bg-charcoal min-h-screen text-off-white font-body selection:bg-gold selection:text-charcoal">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display font-semibold text-gold tracking-tight text-lg hover:text-gold-light transition-colors">COURTFLIGHT</span>
          </Link>
          <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
          <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">Case Telemetry</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Overview</Link>
          <Link href="/analyze" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-charcoal transition-colors">Analyze Case</Link>
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Dockets</Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Trajectory</Link>
          <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Manifest</Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-dim-grey hidden sm:inline">
            ● Flight: <span className={isDisposed ? 'text-gold' : isHighRisk ? 'text-stamp-red' : 'text-gold'}>{isDisposed ? 'Landed' : 'In Flight'}</span>
          </span>
          <span className="font-mono text-[10px] text-off-white hidden md:inline">{caseData.id}</span>
          <span className="font-mono text-[10px] text-gold hidden lg:inline">{prediction.confidence}% Confidence</span>
        </div>
      </nav>

      {/* ─── Section A: Boarding Pass ──────────────────────────────────── */}
      <section className="px-6 md:px-16 py-12 md:py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Official Litigation Manifest // Departure Stub
          </div>
          <Link href="/dockets" className="font-mono text-[10px] text-dim-grey hover:text-gold transition-colors tracking-[0.14em] uppercase">
            ← Back to Docket Registry
          </Link>
        </div>
        <BoardingPass caseData={caseData} prediction={prediction} />
      </section>

      {/* ─── Section B: Tracker Hero ───────────────────────────────────── */}
      <section className="relative">
        <BackgroundVideo src={trackerVideoSrc} overlayOpacity={0.82} className="relative w-full min-h-[70vh]">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24 min-h-[70vh] flex flex-col justify-center bg-gradient-to-b from-charcoal/50 via-transparent to-charcoal/80">
            <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
              {isDisposed ? 'Docket Resolved // Final Disposition' : 'Orbital Docket // Active Trajectory Stream'}
            </div>

            <h2 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[-0.04em] text-off-white leading-[0.95] mb-6">
              {isDisposed
                ? <>Landed at<br />{caseData.predicted_final_court}</>
                : <>Currently cruising<br />over {caseData.filing_court}</>
              }
            </h2>

            {/* Flight stats row */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-[10px] text-steel-grey mb-8 tracking-[0.14em] uppercase">
              <span>Case <span className="text-off-white">{caseData.id}</span></span>
              <span className="text-dim-grey">●</span>
              <span>ETA: <span className="text-off-white">{etaDisplay}</span></span>
              <span className="text-dim-grey">●</span>
              <span>{caseData.num_adjournments} adjournments</span>
              <span className="text-dim-grey">●</span>
              <span className="text-gold">Route {velocityPct}% complete</span>
            </div>

            {/* Confidence + Turbulence + Method badges */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              {/* Confidence */}
              <div className="border border-hairline-light px-4 py-2.5 flex items-center gap-3 bg-charcoal/90 backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] text-steel-grey tracking-[0.14em] uppercase">Calibrated Confidence</span>
                  <span className={`font-display text-xl font-bold ${prediction.confidence >= 70 ? 'text-gold' : prediction.confidence >= 40 ? 'text-off-white' : 'text-stamp-red'}`}>
                    {prediction.confidence}%
                  </span>
                </div>
              </div>

              {/* Turbulence */}
              {turbulence && (
                <div className={`border px-4 py-2.5 flex items-center gap-3 bg-charcoal/90 backdrop-blur-md ${turbulence.badgeColor || 'border-hairline-light text-gold'}`}>
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] opacity-80 uppercase tracking-[0.14em]">Flight Turbulence</span>
                    <span className="font-mono text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-ping" />
                      {turbulence.level} ({turbulence.score}/100)
                    </span>
                  </div>
                </div>
              )}

              {/* Method */}
              <div className="border border-hairline-light px-4 py-2.5 bg-charcoal/90 backdrop-blur-md">
                <span className="font-mono text-[9px] text-steel-grey tracking-[0.14em] uppercase block">Engine</span>
                <span className="font-mono text-xs text-gold">k-NN Multi-Dim (k={prediction.k || 15})</span>
              </div>

              {/* Precedent Pool */}
              <div className="border border-hairline-light px-4 py-2.5 hidden md:block bg-charcoal/90 backdrop-blur-md">
                <span className="font-mono text-[9px] text-steel-grey tracking-[0.14em] uppercase block">Cohort Pool</span>
                <span className="font-mono text-xs text-off-white">{prediction.matchedClusterSize} Precedents</span>
              </div>
            </div>

            {/* Journey Timeline */}
            <JourneyTimeline
              currentStage={caseData.current_stage}
              filingDate={caseData.filing_date}
              prediction={prediction}
              adjournmentReasons={caseData.adjournment_reasons}
            />
          </div>
        </BackgroundVideo>
      </section>

      {/* ─── Section C: "Why This Estimate?" ───────────────────────────── */}
      {prediction.whyFactors && prediction.whyFactors.length > 0 && (
        <section className="px-6 md:px-16 py-16 md:py-24 bg-charcoal">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block" />
            Explainable AI // Why This Estimate?
          </div>
          <h2 className="font-display font-medium text-4xl md:text-5xl tracking-[-0.04em] text-off-white mb-4 leading-[0.95]">
            {prediction.etaRangeYears.median} years median resolution.
          </h2>
          <p className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase mb-12">
            Derived from multi-factor procedural weighting against {prediction.matchedClusterSize} similar historical precedents
          </p>

          {/* Factor cards */}
          <div className="space-y-0 border-t border-hairline">
            {prediction.whyFactors.map((factor, idx) => (
              <div key={idx} className="border-b border-hairline py-6 md:py-8 flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="md:w-[240px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 inline-block rounded-full ${
                      factor.impact === 'positive' ? 'bg-gold' :
                      factor.impact === 'negative' ? 'bg-stamp-red' :
                      'bg-dim-grey'
                    }`} />
                    <span className={`font-mono text-[10px] tracking-[0.14em] uppercase font-medium ${
                      factor.impact === 'positive' ? 'text-gold' :
                      factor.impact === 'negative' ? 'text-stamp-red' :
                      'text-steel-grey'
                    }`}>
                      {factor.impact === 'positive' ? 'Favorable Factor' :
                       factor.impact === 'negative' ? 'Procedural Friction' :
                       'Baseline Metric'}
                    </span>
                  </div>
                  <span className="font-display text-lg text-off-white block">
                    {factor.title}
                  </span>
                  {factor.metric && (
                    <span className="font-mono text-xs text-dim-grey mt-0.5 block">
                      {factor.metric}
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-dim-grey leading-relaxed flex-1">
                  {factor.detail}
                </p>
              </div>
            ))}
          </div>

          {/* ETA Range visualization */}
          <div className="mt-14 pt-8 border-t border-hairline">
            <span className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase block mb-6">
              Empirical Resolution Quartiles // Range Telemetry
            </span>
            <div className="flex items-end gap-0 max-w-2xl">
              <div className="flex-1 text-center border-r border-hairline-light pb-4">
                <span className="font-display text-3xl md:text-4xl text-steel-grey block">{prediction.etaRangeYears.p25} yrs</span>
                <span className="font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase block mt-1">25th Percentile (Fastest)</span>
                <span className="font-mono text-[10px] text-dim-grey block">{formatDate(prediction.etaDateRange.earliest)}</span>
              </div>
              <div className="flex-1 text-center border-r border-hairline-light pb-4 bg-surface-dim -mb-4 pt-4 border border-gold/30">
                <span className="font-display text-4xl md:text-5xl text-gold block font-semibold">{prediction.etaRangeYears.median} yrs</span>
                <span className="font-mono text-[10px] text-off-white tracking-[0.14em] uppercase block mt-1 font-bold">Likely Resolution (Median)</span>
                <span className="font-mono text-[10px] text-gold block">{formatDate(prediction.etaDateRange.likely)}</span>
              </div>
              <div className="flex-1 text-center pb-4">
                <span className="font-display text-3xl md:text-4xl text-stamp-red block">{prediction.etaRangeYears.p75} yrs</span>
                <span className="font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase block mt-1">75th Percentile (Lagging)</span>
                <span className="font-mono text-[10px] text-dim-grey block">{formatDate(prediction.etaDateRange.latest)}</span>
              </div>
            </div>
            <div className="h-[3px] bg-hairline-light max-w-2xl mt-4 relative">
              <div className="absolute left-0 h-full bg-steel-grey" style={{ width: '25%' }} />
              <div className="absolute left-1/4 h-full bg-gold" style={{ width: '25%' }} />
              <div className="absolute left-1/2 h-full bg-gold/50" style={{ width: '25%' }} />
              <div className="absolute left-3/4 h-full bg-stamp-red/40" style={{ width: '25%' }} />
            </div>
          </div>
        </section>
      )}

      {/* ─── Section D: Delay Report ───────────────────────────────────── */}
      {caseData.num_adjournments > 0 && caseData.adjournment_reasons?.length > 0 && (
        <section className="px-6 md:px-16 py-16 md:py-24 bg-surface-dim">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
            Trajectory Variance
            <span className="text-dim-grey">// {caseData.id}</span>
          </div>

          <h2 className="font-display font-medium text-5xl sm:text-6xl md:text-7xl tracking-[-0.04em] text-off-white mb-4 leading-[0.95]">
            {caseData.num_adjournments} adjournment{caseData.num_adjournments !== 1 ? 's' : ''}.
          </h2>

          <p className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase mb-12">
            Cohort benchmark average: {prediction.clusterAvgAdjournments} // Procedural turbulence: {turbulence?.level || prediction.delayRiskLevel}
          </p>

          <div className="border-t border-gold/20">
            {caseData.adjournment_reasons.map((adj, idx) => (
              <DelayReportRow
                key={idx}
                adjournment={adj}
                previousDate={idx > 0 ? caseData.adjournment_reasons[idx - 1].date : caseData.filing_date}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Section E: Similar Cases / Cluster ────────────────────────── */}
      <section className="relative">
        <BackgroundVideo src="cluster-ambient" overlayOpacity={0.7} className="relative w-full min-h-[60vh]">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24">
            <ClusterStats prediction={prediction} />
          </div>
        </BackgroundVideo>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t border-hairline bg-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            Multi-dimensional k-NN prediction calibrated across {prediction.matchedClusterSize} precedent cases.
            Confidence: {prediction.confidence}%. Built on synthetic data with real public benchmark validation.
          </p>
          <span className="font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase">
            Ref: {caseData.id}
          </span>
        </div>
      </footer>
    </main>
  );
}
