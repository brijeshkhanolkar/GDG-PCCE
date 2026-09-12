'use client';

import { useEffect, useRef } from 'react';

const STAGES = [
  'Filed',
  'Notice Issued',
  'Written Statement Filed',
  'Evidence Stage',
  'Arguments',
  'Judgment Reserved',
  'Disposed'
];

/**
 * StageDurationComparison — Two-bar milestone comparison
 * Compares current case duration at this stage against cluster average.
 */
function StageDurationComparison({ stageComparison, alignRight = false }) {
  if (!stageComparison) return null;

  const userMonths = stageComparison.timeAtCurrentStageMonths || 1;
  const avgMonths = stageComparison.avgTimeAtStageForClusterMonths || 1;
  const maxMonths = Math.max(userMonths, avgMonths, 1);

  const userPct = Math.max(8, Math.min(100, Math.round((userMonths / maxMonths) * 100)));
  const avgPct = Math.max(8, Math.min(100, Math.round((avgMonths / maxMonths) * 100)));

  return (
    <div className={`mt-3.5 pt-3 border-t border-hairline/80 w-full max-w-[320px] flex flex-col gap-2.5 bg-surface-dim/95 p-3 border border-hairline ${alignRight ? 'md:ml-auto' : ''}`}>
      {/* Your Case Bar */}
      <div>
        <div className="flex justify-between items-center text-[10px] font-mono tracking-[0.12em] uppercase mb-1">
          <span className="text-gold font-semibold">Your case cadence</span>
          <span className="text-off-white font-mono font-medium">
            {userMonths} {userMonths === 1 ? 'month' : 'months'}
          </span>
        </div>
        <div className="h-[3px] bg-charcoal w-full overflow-hidden border border-hairline/60">
          <div
            className="h-full bg-gold transition-all duration-500 shadow-[0_0_8px_rgba(201,162,75,0.6)]"
            style={{ width: `${userPct}%` }}
          />
        </div>
      </div>

      {/* Cluster Average Bar */}
      <div>
        <div className="flex justify-between items-center text-[10px] font-mono tracking-[0.12em] uppercase mb-1">
          <span className="text-steel-grey">Cohort Benchmark</span>
          <span className="text-steel-grey font-mono">
            {avgMonths} {avgMonths === 1 ? 'month' : 'months'}
          </span>
        </div>
        <div className="h-[3px] bg-charcoal w-full overflow-hidden border border-hairline/60">
          <div
            className="h-full bg-steel-grey/70 transition-all duration-500"
            style={{ width: `${avgPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function JourneyTimeline({ currentStage, filingDate, prediction }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });

    const items = containerRef.current?.querySelectorAll('.timeline-stage');
    items?.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const currentStageIndex = STAGES.indexOf(currentStage) === -1 ? 0 : STAGES.indexOf(currentStage);
  const isDisposed = currentStage === 'Disposed';
  const turbulence = prediction?.turbulence;

  const getStageDate = (index) => {
    if (!filingDate) return '';
    const date = new Date(filingDate);
    if (index === 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (index < currentStageIndex) {
      date.setMonth(date.getMonth() + index * 4);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (index === currentStageIndex) {
      return `Cruising active since ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    return 'Projected milestone';
  };

  return (
    <div className="relative py-12 max-w-5xl mx-auto w-full" ref={containerRef}>
      {/* Central Flight Route Spine Line */}
      <div className="absolute left-6 md:left-[50%] -translate-x-[50%] top-0 bottom-0 w-[2px] bg-gradient-to-b from-gold via-hairline-light to-hairline/30 z-0" />
      
      <div className="flex flex-col gap-12 relative z-10">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isFuture = idx > currentStageIndex;
          const showComparison = isCurrent && !isDisposed && prediction?.stageComparison;
          
          let stageClass = 'timeline-stage';
          if (isFuture) stageClass += ' future-stage';

          return (
            <div key={idx} className={`${stageClass} relative flex flex-col md:flex-row items-start md:items-center w-full`}>
              {/* Central Node Badge — Displays Airplane on Current Stage */}
              <div className="absolute left-6 md:left-[50%] -translate-x-[50%] z-20 flex items-center justify-center">
                {isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    {/* Radar Pulse Ring */}
                    <span className="absolute w-12 h-12 rounded-full bg-gold/25 animate-ping pointer-events-none" />
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-charcoal border-2 border-gold ring-4 ring-gold/30 shadow-[0_0_24px_rgba(201,162,75,0.75)] z-10">
                      {/* Airplane Flight Glyph */}
                      <svg 
                        className="w-5 h-5 text-gold transform -rotate-45 translate-x-[1px] translate-y-[-1px] filter drop-shadow-[0_0_4px_rgba(201,162,75,0.9)]" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-charcoal border-2 transition-all duration-300 ${
                    isPast 
                      ? 'border-gold/70 bg-gold/10' 
                      : 'border-hairline-light bg-surface-dim'
                  }`}>
                    <div className={`rounded-full transition-all duration-300 ${
                      isPast 
                        ? 'w-2 h-2 bg-gold/80' 
                        : 'w-1.5 h-1.5 bg-steel-grey/40'
                    }`} />
                  </div>
                )}
              </div>

              {/* Content Left (Mobile: right of central dot, Desktop: left column) */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 md:pr-10 text-left md:text-right flex flex-col justify-center min-h-[3.5rem]">
                {idx % 2 === 0 ? (
                  <div className={`p-5 md:p-6 border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-charcoal/95 backdrop-blur-xl border-gold/80 shadow-[0_8px_32px_rgba(0,0,0,0.85)] ring-1 ring-gold/40' 
                      : isPast 
                        ? 'bg-charcoal/90 backdrop-blur-md border-hairline-light/90 hover:border-gold/40 shadow-[0_4px_20px_rgba(0,0,0,0.7)]' 
                        : 'bg-charcoal/80 backdrop-blur-md border-hairline/60 shadow-md'
                  }`}>
                    <div className={`font-mono text-[10px] uppercase tracking-[0.16em] mb-1.5 flex items-center gap-2 ${
                      isCurrent ? 'text-gold font-bold md:justify-end' : isPast ? 'text-steel-grey md:justify-end' : 'text-dim-grey md:justify-end'
                    }`}>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 text-gold px-2 py-0.5 bg-gold/10 border border-gold/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
                          AIRPLANE IN FLIGHT
                        </span>
                      )}
                      <span>Stage {String(idx + 1).padStart(2, '0')} // {isCurrent ? 'ACTIVE HOLD' : isPast ? 'COMPLETED' : 'PROJECTED'}</span>
                    </div>

                    <div className={`font-display ${
                      isCurrent 
                        ? 'text-xl md:text-2xl text-off-white font-medium tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]' 
                        : isPast 
                          ? 'text-lg md:text-xl text-off-white font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' 
                          : 'text-base md:text-lg text-steel-grey/90 font-normal'
                    }`}>
                      {stage}
                    </div>

                    {/* Turbulence Indicator for Current Stage */}
                    {isCurrent && turbulence && (
                      <div className={`mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 border text-[10px] font-mono uppercase tracking-[0.12em] ${turbulence.badgeColor || 'border-gold/30 text-gold bg-gold/10'} md:ml-auto`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-ping" />
                        <span>{turbulence.level}</span>
                        <span className="text-dim-grey">({turbulence.score}/100 FRICTION)</span>
                      </div>
                    )}

                    <div className={`font-mono text-xs mt-2 ${
                      isCurrent ? 'text-gold font-medium' : isPast ? 'text-steel-grey' : 'text-dim-grey'
                    }`}>
                      {getStageDate(idx)}
                    </div>

                    {/* Stage duration comparison for even index */}
                    {showComparison && (
                      <StageDurationComparison
                        stageComparison={prediction.stageComparison}
                        alignRight={true}
                      />
                    )}
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              {/* Content Right (Mobile: same side, Desktop: right column) */}
              <div className="w-full md:w-1/2 pl-16 md:pl-10 flex flex-col justify-center min-h-[3.5rem] mt-3 md:mt-0">
                {idx % 2 !== 0 ? (
                  <div className={`p-5 md:p-6 border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-charcoal/95 backdrop-blur-xl border-gold/80 shadow-[0_8px_32px_rgba(0,0,0,0.85)] ring-1 ring-gold/40' 
                      : isPast 
                        ? 'bg-charcoal/90 backdrop-blur-md border-hairline-light/90 hover:border-gold/40 shadow-[0_4px_20px_rgba(0,0,0,0.7)]' 
                        : 'bg-charcoal/80 backdrop-blur-md border-hairline/60 shadow-md'
                  }`}>
                    <div className={`font-mono text-[10px] uppercase tracking-[0.16em] mb-1.5 flex items-center gap-2 ${
                      isCurrent ? 'text-gold font-bold' : isPast ? 'text-steel-grey' : 'text-dim-grey'
                    }`}>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 text-gold px-2 py-0.5 bg-gold/10 border border-gold/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
                          AIRPLANE IN FLIGHT
                        </span>
                      )}
                      <span>Stage {String(idx + 1).padStart(2, '0')} // {isCurrent ? 'ACTIVE HOLD' : isPast ? 'COMPLETED' : 'PROJECTED'}</span>
                    </div>

                    <div className={`font-display ${
                      isCurrent 
                        ? 'text-xl md:text-2xl text-off-white font-medium tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]' 
                        : isPast 
                          ? 'text-lg md:text-xl text-off-white font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' 
                          : 'text-base md:text-lg text-steel-grey/90 font-normal'
                    }`}>
                      {stage}
                    </div>

                    {/* Turbulence Indicator for Current Stage */}
                    {isCurrent && turbulence && (
                      <div className={`mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 border text-[10px] font-mono uppercase tracking-[0.12em] ${turbulence.badgeColor || 'border-gold/30 text-gold bg-gold/10'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-ping" />
                        <span>{turbulence.level}</span>
                        <span className="text-dim-grey">({turbulence.score}/100 FRICTION)</span>
                      </div>
                    )}

                    <div className={`font-mono text-xs mt-2 ${
                      isCurrent ? 'text-gold font-medium' : isPast ? 'text-steel-grey' : 'text-dim-grey'
                    }`}>
                      {getStageDate(idx)}
                    </div>

                    {/* Stage duration comparison for odd index */}
                    {showComparison && (
                      <StageDurationComparison
                        stageComparison={prediction.stageComparison}
                        alignRight={false}
                      />
                    )}
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {prediction?.matchedClusterSize && (
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-charcoal/90 backdrop-blur-md border border-hairline font-mono text-xs text-steel-grey tracking-[0.12em] uppercase shadow-lg">
            <span className="w-2 h-2 rounded-full bg-gold/80 inline-block" />
            Empirical telemetry calibrated across {prediction.matchedClusterSize.toLocaleString()} precedents in cohort
          </div>
        </div>
      )}
    </div>
  );
}
