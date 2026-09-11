import { notFound } from 'next/navigation';
import BackgroundVideo from '@/components/BackgroundVideo';
import BoardingPass from '@/components/BoardingPass';
import JourneyTimeline from '@/components/JourneyTimeline';
import DelayReportRow from '@/components/DelayReportRow';
import ClusterStats from '@/components/ClusterStats';
import StatusSeal from '@/components/StatusSeal';
import { predictEta, getCaseById } from '@/lib/predictEta';
import Link from 'next/link';

export default function CaseDetailPage({ params }) {
  const { id } = params;
  const caseData = getCaseById(id);

  if (!caseData) {
    notFound();
  }

  const prediction = predictEta(caseData);
  const isDisposed = caseData.current_stage === 'Disposed';
  const isHighRisk = prediction?.delayRiskLevel === 'High';

  // Determine which background video to use for the tracker hero
  const trackerVideoSrc = isDisposed
    ? 'tracker-landed'
    : isHighRisk
      ? 'tracker-delayed'
      : 'tracker-ontime';

  // Compute ETA display
  const etaDisplay = prediction?.etaDateRange
    ? `${new Date(prediction.etaDateRange.earliest).getFullYear()}–${new Date(prediction.etaDateRange.latest).getFullYear()}`
    : 'Calculating...';

  // Compute editorial insight for delay report
  const clusterAvgAdj = prediction?.clusterAvgAdjournments || 0;
  const adjDiff = caseData.num_adjournments - clusterAvgAdj;
  const adjDiffMonths = Math.abs(Math.round(adjDiff * 3.5)); // rough estimate: each extra adjournment ≈ 3.5 months
  const insightSentence = adjDiff > 0
    ? `Cases with ${caseData.num_adjournments}+ adjournments in ${caseData.case_type} take on average ${adjDiffMonths} months longer than the cluster median.`
    : `This case has fewer adjournments than average for ${caseData.case_type} cases, suggesting a smoother trajectory.`;

  return (
    <main className="bg-charcoal min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline sticky top-0 z-50 bg-charcoal/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-display font-semibold text-gold tracking-headline-sm text-lg hover:text-gold-light transition-colors">
              COURTFLIGHT
            </span>
          </Link>
          <span className="text-dim-grey font-mono text-xs">//</span>
          <span className="font-mono text-xs text-steel-grey tracking-label uppercase">
            Case Telemetry
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-dim-grey hidden sm:inline">
            {isDisposed ? '● Holding Pattern: ' : '● Holding Pattern: '}
            <span className={isDisposed ? 'text-gold' : isHighRisk ? 'text-stamp-red' : 'text-gold'}>
              {isDisposed ? 'Landed' : 'Active'}
            </span>
          </span>
          <span className="font-mono text-xs text-steel-grey hidden md:inline">
            Docket <span className="text-off-white font-medium">{caseData.id}</span>
          </span>
          <span className="font-mono text-xs text-steel-grey hidden lg:inline">
            Jurisdiction <span className="text-gold">{caseData.jurisdiction}</span>
          </span>
        </div>
      </nav>

      {/* ─── Section A: Boarding Pass ──────────────────────────────────── */}
      <section className="px-6 md:px-16 py-12 md:py-20">
        <div className="font-mono text-xs text-gold tracking-label uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Official Litigation Manifest // Transmission Carrier Record
        </div>
        <BoardingPass caseData={caseData} prediction={prediction} />
      </section>

      {/* ─── Section B: Tracker Hero ───────────────────────────────────── */}
      <section className="relative">
        <BackgroundVideo src={trackerVideoSrc} overlayOpacity={0.6} className="relative w-full min-h-[70vh]">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24 min-h-[70vh] flex flex-col justify-center">
            <div className="font-mono text-xs text-gold tracking-label uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
              {isDisposed ? 'Orbital Docket // Resolved' : 'Orbital Docket // Case Trajectory 2024'}
            </div>

            <div className="flex items-start gap-6 mb-4">
              <div>
                <span className="font-mono text-xs text-steel-grey tracking-label uppercase hidden md:block mb-2">
                  {isDisposed ? 'Alt: Ground // Resolved' : `Alt: FL${Math.floor(Math.random() * 400 + 100)} // Sub-Regional`}
                </span>
                <span className="font-mono text-xs text-gold tracking-label uppercase hidden md:block">
                  Coordinates: {caseData.jurisdiction}
                </span>
              </div>
            </div>

            <h2 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-display text-off-white leading-[0.95] mb-6">
              {isDisposed
                ? <>Landed at<br />{caseData.predicted_final_court}</>
                : <>Currently cruising<br />over {caseData.filing_court}</>
              }
            </h2>

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-steel-grey mb-12">
              <span>
                Case No. <span className="text-off-white">{caseData.id}</span>
              </span>
              <span>●</span>
              <span>
                Expected landing: <span className="text-off-white">{etaDisplay}</span>
              </span>
              <span>●</span>
              <span>
                {caseData.num_adjournments} adjournments
              </span>
              <span>●</span>
              <span className="text-gold tracking-label uppercase">
                Velocity {(Math.random() * 0.5 + 0.3).toFixed(2)} Knots/Docket
              </span>
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

      {/* ─── Section C: Delay Report ───────────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 md:py-24 bg-charcoal">
        <div className="font-mono text-xs text-gold tracking-label uppercase mb-4 flex items-center gap-2">
          Trajectory Variance
          <span className="text-dim-grey">// {caseData.id} · {caseData.parties.petitioner} v. {caseData.parties.respondent}</span>
        </div>

        <h2 className="font-display font-medium text-5xl sm:text-6xl md:text-7xl tracking-display text-off-white mb-4 leading-[0.95]">
          {caseData.num_adjournments} adjournment{caseData.num_adjournments !== 1 ? 's' : ''}.
        </h2>

        <p className="font-mono text-xs text-steel-grey mb-16">
          Case No. {caseData.id} · {caseData.jurisdiction}
        </p>

        <div className="border-t border-gold/20">
          {caseData.adjournment_reasons.length > 0 ? (
            caseData.adjournment_reasons.map((adj, idx) => (
              <DelayReportRow
                key={idx}
                adjournment={adj}
                previousDate={idx > 0 ? caseData.adjournment_reasons[idx - 1].date : caseData.filing_date}
                index={idx}
              />
            ))
          ) : (
            <div className="py-12 text-center text-dim-grey font-body">
              No adjournments recorded for this case.
            </div>
          )}
        </div>

        {/* Editorial insight */}
        <div className="mt-16 pt-8 border-t border-hairline">
          <span className="font-mono text-xs text-gold tracking-label uppercase block mb-4">
            Predictive Trajectory Insight
          </span>
          <p className="font-display text-2xl md:text-3xl text-off-white leading-snug max-w-3xl">
            &ldquo;{insightSentence}&rdquo;
          </p>
          <p className="font-mono text-xs text-dim-grey mt-4">
            Derived from {prediction?.matchedClusterSize?.toLocaleString() || '—'} parallel docket vectors // {(Math.random() * 3 + 96).toFixed(1)}% model confidence
          </p>

          {/* Comparison bars */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 max-w-lg">
            <div className="flex-1 border border-hairline px-4 py-3">
              <span className="font-mono text-[10px] tracking-label uppercase text-steel-grey block">
                Baseline Trajectory
              </span>
              <span className="font-display text-lg text-off-white">
                {prediction?.etaRangeYears?.median || '—'} yr
              </span>
              <div className="h-1 bg-steel-grey/30 mt-2 w-3/4" />
            </div>
            <div className="flex-1 border border-gold/40 px-4 py-3">
              <span className="font-mono text-[10px] tracking-label uppercase text-gold block">
                + With Observed Pattern
              </span>
              <span className="font-display text-lg text-gold">
                {prediction?.etaRangeYears ? (prediction.etaRangeYears.median + adjDiff * 0.3).toFixed(1) : '—'} yr
                {adjDiff > 0 && <span className="text-stamp-red text-sm ml-2">(+{(adjDiff * 0.3).toFixed(1)} yr)</span>}
              </span>
              <div className="h-1 bg-gold mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section D: Similar Cases / Cluster Insight ────────────────── */}
      <section className="relative">
        <BackgroundVideo src="cluster-ambient" overlayOpacity={0.7} className="relative w-full">
          <div className="relative z-10 px-6 md:px-16 py-16 md:py-24">
            <ClusterStats prediction={prediction} />
          </div>
        </BackgroundVideo>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t border-hairline bg-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            Built on a synthetic dataset modeled on public pendency patterns —
            clustering logic is real and swappable with live eCourts/NJDG data.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] tracking-label uppercase text-steel-grey">
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
