import { notFound } from 'next/navigation';
import BackgroundVideo from '@/components/BackgroundVideo';
import BoardingPass from '@/components/BoardingPass';
import JourneyTimeline from '@/components/JourneyTimeline';
import DelayReportRow from '@/components/DelayReportRow';
import ClusterStats from '@/components/ClusterStats';
import WhyEtaBreakdown from '@/components/WhyEtaBreakdown';
import { predictEta, getCaseById } from '@/lib/predictEta';
import Link from 'next/link';

/** Format a date string as "12 Sep 2023" */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

export default function CaseDetailPage({ params }) {
  const { id } = params;
  const caseData = getCaseById(id);

  if (!caseData) {
    notFound();
  }

  const prediction = predictEta(caseData) || {};
  const isDisposed = caseData.current_stage === 'Disposed';
  const isHighRisk = prediction.delayRiskLevel === 'High';

  // Determine which background video to use for the tracker hero
  const trackerVideoSrc = isDisposed
    ? 'tracker-landed'
    : isHighRisk
      ? 'tracker-delayed'
      : 'tracker-ontime';

  // Deterministic derived values (no Math.random — avoids hydration mismatches)
  const durationTotal = caseData.total_duration_days || 1000;
  const velocityPct = Math.min(100, Math.round((caseData.days_elapsed / durationTotal) * 100));
  const confidence = Math.min(99.9, Math.round((50 + (prediction.matchedClusterSize || 0) * 0.1) * 10) / 10);

  // ETA display
  const etaDisplay = prediction.etaDateRange
    ? `${new Date(prediction.etaDateRange.earliest).getFullYear()}–${new Date(prediction.etaDateRange.latest).getFullYear()}`
    : '—';

  // Delay insight
  const clusterAvgAdj = prediction.clusterAvgAdjournments || 0;
  const adjDiff = caseData.num_adjournments - clusterAvgAdj;
  const adjDiffMonths = Math.abs(Math.round(adjDiff * 3.5));
  
  const insightSentence = adjDiff > 1
    ? `Cases with ${caseData.num_adjournments}+ adjournments in ${caseData.case_type} take on average ${adjDiffMonths} months longer than the cluster median.`
    : adjDiff < -1
      ? `This case has fewer adjournments than average for ${caseData.case_type} cases, suggesting a smoother trajectory.`
      : `This case\'s adjournment pattern is typical for ${caseData.case_type} cases in this jurisdiction.`;

  return (
    <main className="bg-charcoal min-h-screen">
      {/* ─── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display font-semibold text-gold tracking-tight text-lg hover:text-gold-light transition-colors">
              COURTFLIGHT
            </span>
          </Link>
          <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
          <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">
            Case Telemetry
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Overview</Link>
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Dockets</Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Trajectory</Link>
          <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">Manifest</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-dim-grey hidden sm:inline">
            ● Holding Pattern:{' '}
            <span className={isDisposed ? 'text-gold' : isHighRisk ? 'text-stamp-red' : 'text-gold'}>
              {isDisposed ? 'Landed' : 'Active'}
            </span>
          </span>
          <span className="font-mono text-[10px] text-steel-grey hidden md:inline">
            Docket <span className="text-off-white font-medium">{caseData.id}</span>
          </span>
          <span className="font-mono text-[10px] text-steel-grey hidden lg:inline">
            Jurisdiction <span className="text-gold">{caseData.jurisdiction}</span>
          </span>
        </div>
      </nav>

      {/* ─── Section A: Boarding Pass ──────────────────────────────────── */}
      <section className="px-6 md:px-16 py-12 md:py-20">
        <div className="mb-6 flex items-center justify-between">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-gold inline-block status-seal-dot" />
            Official Litigation Manifest // Transmission Carrier Record
          </div>
          <Link href="/" className="font-mono text-[10px] text-dim-grey hover:text-gold transition-colors tracking-[0.14em] uppercase">
            ← Back to Overview
          </Link>
        </div>
        <BoardingPass caseData={caseData} prediction={prediction} />
      </section>

      {/* ─── Section B: Tracker Hero ───────────────────────────────────── */}
      <section className="relative">
        <BackgroundVideo src={trackerVideoSrc} overlayOpacity={0.6} className="relative w-full min-h-[70vh]">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24 min-h-[70vh] flex flex-col justify-center">
            <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block status-seal-dot" />
              {isDisposed ? 'Orbital Docket // Resolved' : 'Orbital Docket // Case Trajectory'}
            </div>

            <div className="hidden md:flex items-center gap-8 mb-4">
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase">
                Alt: FL{String(caseData.days_elapsed % 400 + 100).padStart(3, '0')} // Sub-Regional
              </span>
              <span className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase">
                Coordinates: {caseData.jurisdiction}
              </span>
            </div>

            <h2 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[-0.04em] text-off-white leading-[0.95] mb-6">
              {isDisposed
                ? <>Landed at<br />{caseData.predicted_final_court}</>
                : <>Currently cruising<br />over {caseData.filing_court}</>
              }
            </h2>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-[10px] text-steel-grey mb-4 tracking-[0.14em] uppercase">
              <span>
                Case No. <span className="text-off-white">{caseData.id}</span>
              </span>
              <span className="text-dim-grey">●</span>
              <span>
                Expected landing: <span className="text-off-white">{etaDisplay}</span>
              </span>
              <span className="text-dim-grey">●</span>
              <span>
                {caseData.num_adjournments} adjournments
              </span>
              <span className="text-dim-grey">●</span>
              <span className="text-gold">
                Velocity {(velocityPct / 100).toFixed(2)} Knots/Docket
              </span>
            </div>

            {/* Why This Estimate Expandable Breakdown */}
            <WhyEtaBreakdown etaFactors={prediction.etaFactors} />

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

      {/* ─── Section C: Delay Report ───────────────────────────────────── */}
      {caseData.num_adjournments > 0 && (
        <section className="px-6 md:px-16 py-16 md:py-24 bg-charcoal">
          <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
            Trajectory Variance
            <span className="text-dim-grey">
              // {caseData.id} · {caseData.parties.petitioner} v. {caseData.parties.respondent}
            </span>
          </div>

          <h2 className="font-display font-medium text-5xl sm:text-6xl md:text-7xl tracking-[-0.04em] text-off-white mb-4 leading-[0.95]">
            {caseData.num_adjournments} adjournment{caseData.num_adjournments !== 1 ? 's' : ''}.
          </h2>

          <p className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase mb-16">
            Case No. {caseData.id} · {caseData.jurisdiction}
          </p>

          {/* Adjournment rows */}
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

          {/* Editorial insight */}
          <div className="mt-16 pt-8 border-t border-hairline">
            <span className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase block mb-4">
              Predictive Trajectory Insight
            </span>
            <p className="font-display text-2xl md:text-3xl text-off-white leading-snug max-w-3xl">
              &ldquo;{insightSentence}&rdquo;
            </p>
            <p className="font-mono text-[10px] text-dim-grey mt-4 tracking-[0.14em] uppercase">
              Derived from {prediction.matchedClusterSize?.toLocaleString() || '—'} parallel docket vectors // {confidence}% model confidence
            </p>

            {/* Comparison bars */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 max-w-lg">
              <div className="flex-1 border border-hairline px-4 py-3">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
                  Baseline Trajectory
                </span>
                <span className="font-display text-lg text-off-white">
                  {prediction.etaRangeYears?.median || '—'} yr
                </span>
                <div className="h-[2px] bg-steel-grey/30 mt-2 w-3/4" />
              </div>
              <div className="flex-1 border border-gold/40 px-4 py-3">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold block mb-1">
                  + With Observed Pattern
                </span>
                <span className="font-display text-lg text-gold">
                  {prediction.etaRangeYears ? (prediction.etaRangeYears.median + Math.max(0, adjDiff * 0.3)).toFixed(1) : '—'} yr
                  {adjDiff > 1 && (
                    <span className="text-stamp-red text-sm ml-2">(+{(adjDiff * 0.3).toFixed(1)} yr)</span>
                  )}
                </span>
                <div className="h-[2px] bg-gold mt-2" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Section D: Similar Cases / Cluster Insight ────────────────── */}
      <section className="relative">
        <BackgroundVideo src="cluster-ambient" overlayOpacity={0.7} className="relative w-full min-h-[60vh]">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24">
            <ClusterStats prediction={prediction} />
          </div>
        </BackgroundVideo>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-16 py-8 border-t border-hairline bg-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            Built on a synthetic dataset modeled on public pendency patterns —
            clustering logic is real and swappable with live eCourts/NJDG data.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
              CourtFlight Jurisdictional Analytics // Model Run 1.0
            </span>
            <span className="font-mono text-[10px] text-dim-grey">
              Ref: {caseData.id}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
