import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo';
import SearchBar from '@/components/SearchBar';
import CaseListRow from '@/components/CaseListRow';
import StatusSeal from '@/components/StatusSeal';
import { predictEta, getCaseById, cases } from '@/lib/predictEta';

// Handpicked demo case IDs — a mix of on-time, delayed, and high-adjournment
// cases for a reliable demo experience
const FEATURED_CASE_IDS = [
  'NYR-00001', // Criminal, Arguments stage, 6 adjournments
  'NYR-00006', // Civil, Arguments, 5 adjournments
  'NYR-00009', // Property, Evidence, 5 adjournments — High complexity
  'NYR-00015', // Criminal, Judgment, 9 adjournments — High complexity
  'NYR-00017', // Family, Judgment, 3 adjournments — Low complexity
  'NYR-00013', // Property, Judgment, 5 adjournments
];

// Get all case IDs for the search component
const allCaseIds = cases.map(c => c.id);

export default function LandingPage() {
  // Fetch featured cases and their predictions server-side
  const featuredCases = FEATURED_CASE_IDS.map(id => {
    const caseData = getCaseById(id);
    if (!caseData) return null;
    const prediction = predictEta(caseData);
    return { caseData, prediction };
  }).filter(Boolean);

  return (
    <main className="relative min-h-screen">
      {/* Hero Section */}
      <BackgroundVideo src="hero-loop" overlayOpacity={0.55}>
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation */}
          <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-hairline">
            <div className="flex items-center gap-4">
              <span className="font-display font-semibold text-gold tracking-headline-sm text-lg">
                COURTFLIGHT
              </span>
              <span className="text-dim-grey font-mono text-xs">//</span>
              <span className="font-mono text-xs text-steel-grey tracking-label uppercase">
                Overview
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <span className="font-mono text-xs text-steel-grey tracking-label uppercase hover:text-off-white transition-colors cursor-pointer">
                Dockets
              </span>
              <span className="font-mono text-xs text-steel-grey tracking-label uppercase hover:text-off-white transition-colors cursor-pointer">
                Trajectory
              </span>
              <span className="font-mono text-xs text-steel-grey tracking-label uppercase hover:text-off-white transition-colors cursor-pointer">
                Manifest
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-dim-grey hidden sm:inline">
                SYS: <span className="text-gold">ONLINE</span>
              </span>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col lg:flex-row px-6 md:px-16 pt-16 md:pt-24 gap-12">
            {/* Left column — headline + search */}
            <div className="flex-1 max-w-3xl">
              <div className="font-mono text-xs text-gold tracking-label uppercase mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-gold inline-block" />
                Orbital Jurisdiction Telemetry // Sector India
              </div>

              <h1 className="font-display font-medium text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-display text-off-white leading-[0.95] mb-8">
                Track your case.
                <br />
                Like a flight.
              </h1>

              <p className="font-body text-lg text-dim-grey max-w-xl mb-12 leading-relaxed">
                Real-time docket telemetry, judicial trajectory mapping, and
                milestone intelligence designed for precision litigation management.
              </p>

              <SearchBar caseIds={allCaseIds} />
            </div>

            {/* Right column — telemetry panel (desktop only) */}
            <div className="hidden lg:block w-80 xl:w-96">
              <div className="border border-hairline">
                <div className="flex justify-between items-center px-5 py-4 border-b border-hairline">
                  <span className="font-mono text-xs tracking-label uppercase text-steel-grey">
                    Radar Telemetry
                  </span>
                  <span className="font-mono text-xs tracking-label uppercase text-gold">
                    Feed Active
                  </span>
                </div>
                <div className="px-5 py-6 border-b border-hairline">
                  <span className="font-mono text-xs tracking-label uppercase text-steel-grey">
                    System Target
                  </span>
                  <p className="font-display text-xl text-off-white mt-2">
                    Indian Judiciary
                  </p>
                  <p className="font-mono text-xs text-gold mt-1 tracking-label uppercase">
                    Active Session 2026
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-px bg-hairline">
                  <div className="bg-charcoal px-5 py-4">
                    <span className="font-mono text-[10px] tracking-label uppercase text-steel-grey">
                      Active Dockets
                    </span>
                    <p className="font-display text-lg text-off-white mt-1">
                      {cases.filter(c => !c.disposal_date).length.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-charcoal px-5 py-4">
                    <span className="font-mono text-[10px] tracking-label uppercase text-steel-grey">
                      Signal Lock
                    </span>
                    <p className="font-mono text-sm text-gold mt-1">
                      100% Coherent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BackgroundVideo>

      {/* Featured Cases — Departure Board */}
      <section className="px-6 md:px-16 py-16 md:py-24 bg-charcoal">
        <div className="border border-hairline mb-0">
          <div className="flex justify-between items-center px-5 py-4 border-b border-hairline">
            <span className="font-mono text-xs tracking-label uppercase text-steel-grey">
              Flight Telemetry // Primary Carrier Docket
            </span>
            <span className="font-mono text-xs tracking-label uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
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

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t border-hairline bg-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            Built on a synthetic dataset modeled on public pendency patterns —
            clustering logic is real and swappable with live eCourts/NJDG data.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] tracking-label uppercase text-steel-grey">
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
