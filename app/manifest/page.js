'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cases } from '@/lib/predictEta';
import StatusSeal from '@/components/StatusSeal';
import GlossaryTerm from '@/components/GlossaryTerm';

export default function ManifestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCourt, setSelectedCourt] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const caseTypes = useMemo(() => ['ALL', ...new Set(cases.map(c => c.case_type))].sort(), []);
  const courts = useMemo(() => ['ALL', ...new Set(cases.map(c => c.filing_court))].sort(), []);

  // Filter and sort logic
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = c.id.toLowerCase().includes(q);
        const matchPetitioner = c.parties?.petitioner?.toLowerCase().includes(q);
        const matchRespondent = c.parties?.respondent?.toLowerCase().includes(q);
        const matchCourt = c.filing_court.toLowerCase().includes(q);
        const matchType = c.case_type.toLowerCase().includes(q);
        if (!matchId && !matchPetitioner && !matchRespondent && !matchCourt && !matchType) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'ALL' && c.case_type !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'ACTIVE' && c.disposal_date !== null) {
        return false;
      }
      if (selectedStatus === 'RESOLVED' && c.disposal_date === null) {
        return false;
      }

      // Court filter
      if (selectedCourt !== 'ALL' && c.filing_court !== selectedCourt) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
      if (sortBy === 'id-desc') return b.id.localeCompare(a.id);
      if (sortBy === 'date-desc') return new Date(b.filing_date) - new Date(a.filing_date);
      if (sortBy === 'date-asc') return new Date(a.filing_date) - new Date(b.filing_date);
      if (sortBy === 'adj-desc') return b.num_adjournments - a.num_adjournments;
      if (sortBy === 'adj-asc') return a.num_adjournments - b.num_adjournments;
      return 0;
    });
  }, [searchQuery, selectedType, selectedStatus, selectedCourt, sortBy]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  const totalActive = cases.filter(c => !c.disposal_date).length;
  const totalResolved = cases.filter(c => c.disposal_date).length;

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
            Carrier Manifest
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Overview
          </Link>
          <Link href="/dockets" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Dockets
          </Link>
          <Link href="/trajectory" className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase hover:text-gold transition-colors">
            Trajectory
          </Link>
          <Link href="/manifest" className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase font-bold">
            Manifest
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <span className="font-mono text-[10px] text-dim-grey">
            RECORDS: <span className="text-gold font-medium">{cases.length.toLocaleString()}</span>
          </span>
        </div>
      </nav>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <div className="px-6 md:px-16 py-12 md:py-16 max-w-7xl mx-auto">
        {/* Header telemetry prompt */}
        <div className="font-mono text-[10px] text-gold tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Master Carrier Record // Sector India Active Database
        </div>
        <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em] text-off-white leading-[0.95] mb-4">
          Litigation manifest.
        </h1>
        <p className="font-body text-dim-grey text-base md:text-lg mb-10 max-w-2xl leading-relaxed">
          Comprehensive flight roster indexing all {cases.length.toLocaleString()} procedural vectors across high courts. Search, filter by jurisdiction, or inspect any carrier record.
        </p>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-hairline border border-hairline mb-10">
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
              Indexed Dockets
            </span>
            <span className="font-display text-2xl text-off-white font-medium">
              {cases.length.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
              En Route (Active)
            </span>
            <span className="font-display text-2xl text-off-white font-medium">
              {totalActive.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
              Landed (Disposed)
            </span>
            <span className="font-display text-2xl text-gold font-medium">
              {totalResolved.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-dim px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey block mb-1">
              Jurisdictions
            </span>
            <span className="font-display text-2xl text-off-white font-medium">
              {courts.length - 1} Courts
            </span>
          </div>
        </div>

        {/* ─── Interactive Filters Bar ──────────────────────────────────── */}
        <div className="bg-surface-dim border border-hairline p-5 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Docket ID, Party, Court, or Vector..."
              className="w-full bg-[#0E0E10] text-off-white placeholder-steel-grey/50 px-4 py-2.5 text-xs font-mono border border-hairline focus:border-gold outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim-grey hover:text-off-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-steel-grey uppercase">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="bg-[#0E0E10] text-off-white text-xs font-mono border border-hairline px-3 py-2 outline-none focus:border-gold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">En Route (Active)</option>
                <option value="RESOLVED">Landed (Disposed)</option>
              </select>
            </div>

            {/* Type */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-steel-grey uppercase">Vector:</span>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="bg-[#0E0E10] text-off-white text-xs font-mono border border-hairline px-3 py-2 outline-none focus:border-gold"
              >
                {caseTypes.map(t => (
                  <option key={t} value={t}>{t === 'ALL' ? 'All Vectors' : t}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-steel-grey uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0E0E10] text-off-white text-xs font-mono border border-hairline px-3 py-2 outline-none focus:border-gold"
              >
                <option value="id-asc">Docket ID (Asc)</option>
                <option value="id-desc">Docket ID (Desc)</option>
                <option value="date-desc">Filing Date (Newest)</option>
                <option value="date-asc">Filing Date (Oldest)</option>
                <option value="adj-desc">Adjournments (High → Low)</option>
                <option value="adj-asc">Adjournments (Low → High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Manifest Table ────────────────────────────────────────────── */}
        <div className="border border-hairline bg-surface-dim overflow-x-auto">
          <div className="flex justify-between items-center px-5 py-3 border-b border-hairline bg-[#0E0E10]">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
              Carrier Flight Roster // Showing {filteredCases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} Matching
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold">
              Active Satellite Link
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey bg-charcoal/50">
                <th className="py-3 px-5">Docket ID</th>
                <th className="py-3 px-5">Parties In Interest</th>
                <th className="py-3 px-5">Litigation Vector</th>
                <th className="py-3 px-5">Filing Court</th>
                <th className="py-3 px-5">Current Stage</th>
                <th className="py-3 px-5 text-center">Adjournments</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {paginatedCases.length > 0 ? (
                paginatedCases.map((c) => {
                  const isDisposed = c.disposal_date !== null;
                  return (
                    <tr key={c.id} className="hover:bg-surface-mid transition-colors group">
                      <td className="py-4 px-5">
                        <Link href={`/case/${c.id}`} className="font-mono text-sm text-gold group-hover:text-gold-light transition-colors font-medium">
                          {c.id}
                        </Link>
                        <span className="block font-mono text-[10px] text-dim-grey mt-0.5">
                          Filed {new Date(c.filing_date).getFullYear()}
                        </span>
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-display text-sm text-off-white truncate" title={c.parties?.petitioner}>
                          {c.parties?.petitioner || 'Petitioner'}
                        </div>
                        <div className="font-body text-xs text-dim-grey truncate mt-0.5" title={c.parties?.respondent}>
                          vs. {c.parties?.respondent || 'Respondent'}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono border border-hairline bg-charcoal text-off-white">
                          <GlossaryTerm term={c.case_type} />
                        </span>
                      </td>

                      <td className="py-4 px-5 max-w-[200px]">
                        <div className="font-body text-xs text-off-white truncate" title={c.filing_court}>
                          {c.filing_court}
                        </div>
                        <span className="font-mono text-[10px] text-steel-grey">
                          {c.jurisdiction}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isDisposed ? 'bg-gold' : 'bg-steel-grey'}`} />
                          <span className="font-mono text-xs text-off-white">
                            {isDisposed ? 'Disposed (Landed)' : c.current_stage}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center font-mono text-xs">
                        <span className={c.num_adjournments > 5 ? 'text-stamp-red font-medium' : 'text-off-white'}>
                          {c.num_adjournments}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/case/${c.id}`}
                          className="inline-block font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-hairline hover:border-gold text-steel-grey hover:text-gold transition-colors"
                        >
                          Telemetry →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-dim-grey font-body">
                    No dockets matched your search query or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Bar ────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
            <span className="font-mono text-xs text-dim-grey">
              Page <span className="text-off-white">{currentPage}</span> of <span className="text-off-white">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 font-mono text-xs uppercase border border-hairline text-steel-grey hover:text-off-white hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Prev
              </button>

              {/* Page indicator pills */}
              <div className="hidden sm:flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center border ${
                        currentPage === pageNum
                          ? 'border-gold text-gold font-bold bg-charcoal'
                          : 'border-hairline text-steel-grey hover:text-off-white'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 font-mono text-xs uppercase border border-hairline text-steel-grey hover:text-off-white hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t border-hairline bg-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto">
          <p className="font-body text-xs text-dim-grey max-w-2xl leading-relaxed">
            Built on a synthetic dataset modeled on public pendency patterns — clustering logic is real and swappable with live eCourts/NJDG data.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
              CourtFlight Master Manifest // v1.0
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
