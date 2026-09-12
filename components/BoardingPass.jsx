'use client';

import { useState, useRef } from 'react';
import StatusSeal from './StatusSeal';
import GlossaryTerm from './GlossaryTerm';

export default function BoardingPass({ caseData, prediction }) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!caseData) return null;

  const petitioner = caseData.parties?.petitioner || 'Petitioner';
  const respondent = caseData.parties?.respondent || 'Respondent';
  const filingCourt = caseData.filing_court || 'Filing Court';
  const finalCourt = caseData.predicted_final_court || filingCourt;
  const isDisposed = caseData.current_stage === 'Disposed';
  
  const riskLevel = prediction?.delayRiskLevel || 'Medium';

  const getAirportCode = (name) => {
    if (!name) return 'CRT';
    const words = name.replace(/Court|High|District|Sessions|India|of/gi, '').trim().split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    }
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.substring(0, 3) || 'CRT';
  };

  const originCode = getAirportCode(filingCourt);
  const destCode = getAirportCode(finalCourt);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const formattedFilingDate = formatDate(caseData.filing_date);
  const formattedDisposalDate = formatDate(caseData.disposal_date || prediction?.etaDateRange?.likely);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        filter: (node) => node.tagName !== 'VIDEO',
        backgroundColor: '#0B0B0C',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `courtflight-${caseData.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate boarding pass image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-16">
      {/* Boarding Pass Outer Container */}
      <div
        ref={cardRef}
        className="relative flex flex-col md:flex-row w-full bg-[#111114] text-off-white font-body overflow-hidden border border-gold/40 border-l-4 border-l-gold shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
      >
        {/* Shine Video Effect */}
        <video
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-15 pointer-events-none z-0"
          src="/assets/boardingpass-shine.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* ─── Main Pass Section (Left ~70%) ────────────────────────────── */}
        <div className="flex-1 flex flex-col p-6 sm:p-8 z-10 relative">
          {/* Top Pass Bar: Parties & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-hairline/80 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-gold tracking-[0.2em] uppercase font-semibold">
                COURTFLIGHT // JUDICIAL PASS
              </span>
              <span className="text-dim-grey text-xs font-mono">•</span>
              <span className="font-mono text-[10px] text-steel-grey tracking-[0.14em] uppercase">
                {caseData.jurisdiction || 'India'}
              </span>
            </div>

            {/* Petitioner v. Respondent */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-body truncate max-w-md">
              <span className="text-off-white font-medium truncate" title={petitioner}>{petitioner}</span>
              <span className="font-serif italic text-gold px-0.5">v.</span>
              <span className="text-off-white font-medium truncate" title={respondent}>{respondent}</span>
            </div>
          </div>

          {/* Primary Case ID & Route Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              <span className="font-mono text-[10px] text-steel-grey uppercase tracking-[0.14em] block mb-1">
                Docket Identifier
              </span>
              <h2 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-off-white tracking-[-0.03em] leading-none">
                {caseData.id}
              </h2>
            </div>

            {/* Flight Route Visual (Origin → Destination) */}
            <div className="flex items-center gap-4 sm:gap-6 bg-surface-dim/80 px-4 py-3 border border-hairline/60">
              <div className="text-left">
                <span className="font-display font-semibold text-2xl text-off-white block leading-none">{originCode}</span>
                <span className="font-mono text-[9px] text-dim-grey uppercase tracking-wider block mt-1">Filing Port</span>
              </div>

              <div className="flex flex-col items-center px-2">
                <div className="flex items-center gap-1 text-gold">
                  <span className="w-4 sm:w-6 h-[1px] bg-gold/50" />
                  <span className="text-xs">✈</span>
                  <span className="w-4 sm:w-6 h-[1px] bg-gold/50" />
                </div>
                <span className="font-mono text-[9px] text-steel-grey mt-1">
                  {caseData.days_elapsed ? `${caseData.days_elapsed}d elapsed` : 'Active'}
                </span>
              </div>

              <div className="text-right">
                <span className="font-display font-semibold text-2xl text-gold block leading-none">{destCode}</span>
                <span className="font-mono text-[9px] text-dim-grey uppercase tracking-wider block mt-1">Final Court</span>
              </div>
            </div>
          </div>

          {/* Four Labeled Fields Specification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-hairline/80 mb-6 bg-surface-dim/40 px-2">
            <div>
              <span className="font-mono text-[10px] text-steel-grey uppercase tracking-[0.14em] block mb-1">
                Filing Court
              </span>
              <span className="font-display text-sm sm:text-base text-off-white font-medium block truncate" title={filingCourt}>
                {filingCourt}
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-steel-grey uppercase tracking-[0.14em] block mb-1">
                {isDisposed ? 'Disposal Court' : 'Predicted Final Court'}
              </span>
              <span className="font-display text-sm sm:text-base text-gold font-medium block truncate" title={finalCourt}>
                {finalCourt}
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-steel-grey uppercase tracking-[0.14em] block mb-1">
                Current Stage
              </span>
              <span className="font-display text-sm sm:text-base text-off-white font-medium block truncate flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDisposed ? 'bg-gold' : 'bg-gold animate-pulse'}`} />
                {caseData.current_stage || 'Filed'}
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-steel-grey uppercase tracking-[0.14em] block mb-1">
                {isDisposed ? 'Disposed Date' : 'Filing Date'}
              </span>
              <span className="font-mono text-xs sm:text-sm text-off-white block font-medium">
                {isDisposed ? formattedDisposalDate : formattedFilingDate}
              </span>
            </div>
          </div>

          {/* Bottom Row: Case Type Tag + Barcode Graphic */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto pt-2">
            {/* Tag-like text element (not a pill badge) */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="font-mono text-xs text-gold border-b border-gold/40 pb-0.5 tracking-wider uppercase">
                <GlossaryTerm term={caseData.case_type} />
              </span>
              <span className="text-dim-grey font-mono text-[10px] ml-2">
                // {caseData.num_adjournments} adjournments recorded
              </span>
            </div>

            {/* Aesthetic procedural barcode */}
            <div className="flex items-center gap-1 opacity-70">
              <div className="font-mono text-[9px] text-dim-grey tracking-[0.25em] select-none">
                ||| | |||| | ||| || |||| | || ||| | ||| || ||| | ||||
              </div>
            </div>
          </div>
        </div>

        {/* ─── Perforated Tear-Line & Notches ───────────────────────────── */}
        <div className="relative hidden md:flex items-stretch">
          {/* Top Notch Cutout */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-charcoal border-b border-hairline z-20" />
          
          {/* Dashed Line */}
          <div className="w-px border-r border-dashed border-hairline-light h-full" />
          
          {/* Bottom Notch Cutout */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-charcoal border-t border-hairline z-20" />
        </div>

        {/* ─── Stub Section (Right ~30%) ────────────────────────────────── */}
        <div className="w-full md:w-72 p-6 sm:p-8 z-10 relative bg-[#0D0D10] border-t md:border-t-0 md:border-l border-hairline flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[9px] text-steel-grey uppercase tracking-[0.16em]">
                DOCKET STUB
              </span>
              <span className="font-mono text-[10px] text-gold font-bold">
                {originCode} ➔ {destCode}
              </span>
            </div>

            <div className="font-display font-semibold text-lg text-off-white mb-4">
              {caseData.id}
            </div>

            <div className="space-y-3 mb-6 text-xs">
              <div>
                <span className="font-mono text-[9px] text-dim-grey uppercase tracking-wider block">Litigant</span>
                <span className="font-body text-off-white truncate block font-medium" title={petitioner}>
                  {petitioner}
                </span>
              </div>
              <div>
                <span className="font-mono text-[9px] text-dim-grey uppercase tracking-wider block">Target Window</span>
                <span className="font-mono text-gold block font-semibold">
                  {prediction?.etaRangeYears ? `${prediction.etaRangeYears.p25} – ${prediction.etaRangeYears.p75} yrs` : 'TBD'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Seal Placement (bottom right of stub) */}
          <div className="pt-4 border-t border-hairline/60 flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] text-dim-grey uppercase tracking-wider block mb-0.5">
                Status Seal
              </span>
              <span className="font-mono text-[10px] text-steel-grey">
                {isDisposed ? 'Finalized' : `${riskLevel} Risk`}
              </span>
            </div>

            <StatusSeal level={riskLevel} isDisposed={isDisposed} showLabel={false} size="small" />
          </div>
        </div>
      </div>

      {/* Download Action */}
      <div className="flex justify-end items-center mt-3 pr-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="group inline-flex items-center gap-2 font-mono text-xs text-steel-grey hover:text-gold transition-colors duration-150 focus:outline-none"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isDownloading ? 'animate-bounce text-gold' : 'group-hover:translate-y-0.5 text-steel-grey group-hover:text-gold'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="tracking-[0.1em] uppercase text-[11px]">
            {isDownloading ? 'Exporting High-Res PNG...' : 'Download boarding pass'}
          </span>
        </button>
      </div>
    </div>
  );
}
