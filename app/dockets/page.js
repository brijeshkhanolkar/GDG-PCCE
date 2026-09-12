'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CaseListRow from '@/components/CaseListRow';
import SearchBar from '@/components/SearchBar';
import { predictEta, cases } from '@/lib/predictEta';

export default function DocketsPage() {
  const allCaseIds = useMemo(() => cases.map(c => c.id), []);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedVector, setSelectedVector] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const stages = ['ALL', 'Filed', 'Notice Issued', 'Evidence Stage', 'Arguments', 'Judgment Reserved', 'Disposed'];
  const vectors = useMemo(() => ['ALL', ...new Set(cases.map(c => c.case_type))].sort(), []);

  const totalActive = useMemo(() => cases.filter(c => !c.disposal_date).length, []);
  const totalResolved = useMemo(() => cases.filter(c => c.disposal_date).length, []);
  const courts = useMemo(() => [...new Set(cases.map(c => c.filing_court))], []);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (selectedStage !== 'ALL' && c.current_stage !== selectedStage) {
        return false;
      }
      if (selectedVector !== 'ALL' && c.case_type !== selectedVector) {
        return false;
      }
      return true;
    });
  }, [selectedStage, selectedVector]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage).map(c => ({
      caseData: c,
      prediction: predictEta(c),
    }));
  }, [filteredCases, currentPage]);

  return (
    <main className="min-h-screen bg-charcoal text-off-white font-body selection:bg-gold selection:text-charcoal">
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
            Docket Registry
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Overview
          </Link>
          <Link href="/analyze" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-charcoal transition-colors">
            Analyze Case
          </Link>
          <Link href="/dockets" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase font-bold">
            Dockets
          </Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Trajectory
          </Link>
          <Link href="/manifest" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Manifest
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <span className="font-mono text-[10px] text-dim-grey">
            FEED: <span className="text-gold font-medium">LIVE</span>
          </span>
        </div>
      </nav>

      <div className="px-6 md:px-16 py-12 md:py-16 max-w-7xl mx-auto">
        {/* Header */}
        <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Primary Carrier Docket // Departure Board Feeds
        </div>
        <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-4">
          Docket registry.
        </h1>
        <p className="font-body text-dim-grey text-base md:text-lg mb-10 max-w-2xl leading-relaxed">
          Real-time departure board tracking active litigations across India. Select any stage filter or enter a reference to track procedural velocity.
        </p>

        {/* Search */}
        <div className="mb-10 max-w-2xl">
          <SearchBar caseIds={allCaseIds} />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border border-hairline mb-10">
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">Total Dockets</span>
            <span className="font-display text-2xl text-off-white font-medium">{cases.length.toLocaleString()}</span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">Active Carriers</span>
            <span className="font-display text-2xl text-off-white font-medium">{totalActive.toLocaleString()}</span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">Landed Cases</span>
            <span className="font-display text-2xl text-gold font-medium">{totalResolved.toLocaleString()}</span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">High Courts</span>
            <span className="font-display text-2xl text-off-white font-medium">{courts.length}</span>
          </div>
        </div>

        {/* ─── Stage Filters ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-hairline">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-dim-grey mr-2 hidden md:inline">Filter Stage:</span>
            {stages.map(st => (
              <button
                key={st}
                onClick={() => { setSelectedStage(st); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-mono border transition-colors ${
                  selectedStage === st
                    ? 'border-gold text-gold bg-charcoal font-medium'
                    : 'border-hairline text-steel-grey hover:text-off-white'
                }`}
              >
                {st === 'ALL' ? 'All Stages' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-dim-grey">Vector:</span>
            <select
              value={selectedVector}
              onChange={(e) => { setSelectedVector(e.target.value); setCurrentPage(1); }}
              className="bg-[#0E0E10] text-off-white text-xs font-mono border border-hairline px-3 py-1 outline-none focus:border-gold"
            >
              {vectors.map(v => (
                <option key={v} value={v}>{v === 'ALL' ? 'All Vectors' : v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Case list board */}
        <div className="border border-hairline bg-surface-dim mb-8">
          <div className="flex justify-between items-center px-5 py-4 border-b border-hairline bg-[#0E0E10]">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
              Flight Telemetry // Showing {filteredCases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} Matching
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
              Departure Feed
            </span>
          </div>

          {paginatedCases.length > 0 ? (
            paginatedCases.map(({ caseData, prediction }, idx) => (
              <CaseListRow
                key={caseData.id}
                caseData={caseData}
                prediction={prediction}
                isLast={idx === paginatedCases.length - 1}
              />
            ))
          ) : (
            <div className="py-16 text-center text-dim-grey font-body">
              No dockets matched the selected stage or vector filter.
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2 font-mono text-xs">
            <span className="text-dim-grey">
              Page <span className="text-off-white">{currentPage}</span> of <span className="text-off-white">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 uppercase border border-hairline text-steel-grey hover:text-off-white hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Prev
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 uppercase border border-hairline text-steel-grey hover:text-off-white hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
