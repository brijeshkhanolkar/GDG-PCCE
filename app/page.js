import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo';
import SearchBar from '@/components/SearchBar';
import CaseListRow from '@/components/CaseListRow';
import { predictEta, getCaseById, cases } from '@/lib/predictEta';

/**
 * Handpicked demo case IDs — a diverse mix of case types, stages, 
 * and risk levels for a reliable, interesting demo experience.
 * These are verified to exist in the dataset.
 */
function getFeaturedCases() {
  // Pick cases with interesting characteristics
  const candidates = cases.filter(c => c.num_adjournments >= 3);
  const types = [...new Set(candidates.map(c => c.case_type))];
  const featured = [];
  
  // Get one case from each type for diversity
  for (const type of types.slice(0, 6)) {
    const ofType = candidates.filter(c => c.case_type === type);
    if (ofType.length > 0) {
      featured.push(ofType[0]);
    }
  }

  // Fallback: if we don't have enough, just take the first 6
  while (featured.length < 6 && featured.length < cases.length) {
    const next = cases[featured.length];
    if (!featured.find(f => f.id === next.id)) {
      featured.push(next);
    }
  }

  return featured.slice(0, 6);
}

// Get all case IDs for the search component
const allCaseIds = cases.map(c => c.id);

export default function LandingPage() {
  const featuredCases = getFeaturedCases().map(caseData => ({
    caseData,
    prediction: predictEta(caseData),
  }));

  // Stats for the telemetry panel
  const activeDockets = cases.filter(c => !c.disposal_date).length;
  const resolvedDockets = cases.filter(c => c.disposal_date).length;

  return (
    <main className="relative min-h-screen">
      {/* ─── Hero Section with Background Video ────────────────────────── */}
      <BackgroundVideo src="hero-loop" overlayOpacity={0.55}>
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation */}
          <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline">
            <div className="flex items-center gap-4">
              <span className="font-display font-semibold text-gold tracking-tight text-lg">
                COURTFLIGHT
              </span>
              <span className="text-dim-grey font-mono text-xs hidden sm:inline">//</span>
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hidden sm:inline">
                Overview
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase font-bold">
                Overview
              </Link>
              <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
                Dockets
              </Link>
              <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
                Trajectory
              </Link>
              <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
                Manifest
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-dim-grey hidden sm:inline">
                SYS: <span className="text-gold">Online</span>
              </span>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col lg:flex-row px-6 md:px-16 pt-16 md:pt-24 gap-12">
            {/* Left column — headline + search */}
            <div className="flex-1 max-w-3xl">
              <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-gold inline-block" />
                Orbital Jurisdiction Telemetry // Sector India
              </div>

              <h1 className="font-display font-medium text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.04em] text-off-white leading-[0.95] mb-6">
                Track your case.
                <br />
                Like a flight.
              </h1>


              <p className="font-body text-lg text-dim-grey max-w-xl mb-10 leading-relaxed">
                Real-time docket telemetry, judicial trajectory mapping, and
                milestone intelligence designed for precision litigation management.
              </p>

              <SearchBar caseIds={allCaseIds} />
            </div>

            {/* Right column — telemetry panel (desktop only) */}
            <div className="hidden lg:block w-80 xl:w-96">
              <div className="border border-hairline">
                <div className="flex justify-between items-center px-5 py-4 border-b border-hairline">
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
                    Radar Telemetry
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold">
                    Feed Active
                  </span>
                </div>
                <div className="px-5 py-6 border-b border-hairline">
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
                    System Target
                  </span>
                  <p className="font-display text-xl text-off-white mt-2">
                    Indian Judiciary
                  </p>
                  <p className="font-mono text-[10px] text-gold mt-1 tracking-[0.14em] uppercase">
                    Active Session 2026
                  </p>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-5 py-4 border-r border-hairline">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
                      Active Dockets
                    </span>
                    <p className="font-display text-lg text-off-white">
                      {activeDockets.toLocaleString()}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
                      Resolved
                    </span>
                    <p className="font-display text-lg text-gold">
                      {resolvedDockets.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BackgroundVideo>

      {/* ─── Featured Cases — Departure Board ──────────────────────────── */}
      <section className="px-6 md:px-16 py-16 md:py-24 bg-charcoal">
        <div className="border border-hairline">
          <div className="flex justify-between items-center px-5 py-4 border-b border-hairline">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
              Flight Telemetry // Primary Carrier Docket
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block status-seal-dot" />
              <span className="text-gold">Station Online</span>
            </span>
          </div>

          {featuredCases.map(({ caseData, prediction }, idx) => (
            <CaseListRow
              key={caseData.id}
              caseData={caseData}
              prediction={prediction}
              isLast={idx === featuredCases.length - 1}
            />
          ))}
        </div>
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
              CourtFlight Core Telemetry v1.0
            </span>
            <span className="font-mono text-[10px] text-dim-grey">
              SYS Stat: <span className="text-gold">Nominal</span>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
