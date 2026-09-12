'use client';

import { useState, useRef } from 'react';
import StatusSeal from './StatusSeal';
import GlossaryTerm from './GlossaryTerm';

export default function BoardingPass({ caseData, prediction }) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!caseData) return null;

  const petitioner = caseData.parties?.petitioner || 'Unknown';
  const respondent = caseData.parties?.respondent || 'Unknown';
  const filingCourt = caseData.filing_court || 'Unknown Court';
  const finalCourt = caseData.predicted_final_court || filingCourt;
  
  const riskLevel = prediction?.delayRiskLevel || 'Low';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const formattedDate = formatDate(caseData.filing_date);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        // Exclude the video element to prevent black rectangle in canvas render
        filter: (node) => node.tagName !== 'VIDEO',
        backgroundColor: '#F5F5F7',
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
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Boarding Pass Card Container */}
      <div
        ref={cardRef}
        className="relative flex w-full rounded-md shadow-2xl bg-off-white text-charcoal font-body overflow-hidden border-l-2 border-gold"
      >
        {/* Shine Video Effect */}
        <video
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-10 pointer-events-none"
          src="/assets/boardingpass-shine.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        
        {/* Main Section */}
        <div className="flex-1 flex flex-col p-6 z-10 border-r-2 border-dashed border-steel-grey/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="font-display text-sm tracking-widest text-dim-grey uppercase mb-1">Boarding Pass</div>
              <div className="font-display font-bold text-2xl tracking-wide">{caseData.id}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-sm tracking-widest text-dim-grey uppercase mb-1">Class</div>
              <div className="font-bold">
                <GlossaryTerm term={caseData.case_type} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Origin</div>
              <div className="font-display text-3xl mb-1">{filingCourt.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}</div>
              <div className="text-sm truncate w-48" title={filingCourt}>{filingCourt}</div>
            </div>
            
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full h-px bg-steel-grey relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold">✈</div>
              </div>
              <div className="text-xs text-dim-grey mt-2">Flight Time</div>
              <div className="text-sm font-mono">{caseData.days_elapsed}d elapsed</div>
            </div>
            
            <div className="flex-1 text-right">
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Dest</div>
              <div className="font-display text-3xl mb-1 text-gold">{finalCourt.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}</div>
              <div className="text-sm truncate w-48 float-right" title={finalCourt}>{finalCourt}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Petitioner</div>
              <div className="font-bold truncate" title={petitioner}>{petitioner}</div>
            </div>
            <div>
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Respondent</div>
              <div className="font-bold truncate" title={respondent}>{respondent}</div>
            </div>
            <div>
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Filing Date</div>
              <div className="font-mono">{formattedDate}</div>
            </div>
            <div>
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">ETA</div>
              <div className="font-mono text-stamp-red font-bold">
                {prediction?.etaDateRange?.likely ? formatDate(prediction.etaDateRange.likely) : 'TBD'}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-steel-grey/20">
            <div className="font-mono text-xs opacity-50 tracking-[0.3em] h-8 flex items-center barcode-font">
              ||| | || ||| || ||| | | || ||| || | ||| || || | | ||| | || ||
            </div>
          </div>
        </div>

        {/* Stub Section */}
        <div className="w-1/3 p-6 z-10 flex flex-col justify-between bg-white bg-opacity-40">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="font-display font-bold text-xl">{caseData.id}</div>
            </div>
            <div className="mb-4">
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Passenger</div>
              <div className="text-sm truncate" title={petitioner}>{petitioner}</div>
            </div>
            <div className="mb-4">
              <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Risk Profile</div>
              <div className="text-sm font-bold">{riskLevel}</div>
            </div>
          </div>

          <div className="mt-auto flex justify-center items-center">
            <StatusSeal level={riskLevel} />
          </div>
        </div>
      </div>

      {/* Understated Download CTA */}
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
            {isDownloading ? 'Generating PNG...' : 'Download boarding pass'}
          </span>
        </button>
      </div>
    </div>
  );
}
