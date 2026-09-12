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
 * StageDurationComparison — Feature 5 two-bar visual
 * Compares current case duration at this stage against cluster average.
 */
function StageDurationComparison({ stageComparison, alignRight = false }) {
  if (!stageComparison) return null;

  const userMonths = stageComparison.timeAtCurrentStageMonths || 1;
  const avgMonths = stageComparison.avgTimeAtStageForClusterMonths || 1;
  const maxMonths = Math.max(userMonths, avgMonths, 1);

  const userPct = Math.max(6, Math.min(100, Math.round((userMonths / maxMonths) * 100)));
  const avgPct = Math.max(6, Math.min(100, Math.round((avgMonths / maxMonths) * 100)));

  return (
    <div className={`mt-3 pt-2.5 border-t border-hairline/60 w-full max-w-[280px] flex flex-col gap-2.5 ${alignRight ? 'md:ml-auto' : ''}`}>
      {/* Your Case Bar */}
      <div>
        <div className="flex justify-between items-center text-[10px] font-mono tracking-[0.1em] uppercase mb-1">
          <span className="text-gold">Your case</span>
          <span className="text-off-white font-medium">
            {userMonths} {userMonths === 1 ? 'month' : 'months'}
          </span>
        </div>
        <div className="h-[2px] bg-charcoal/90 w-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${userPct}%` }}
          />
        </div>
      </div>

      {/* Cluster Average Bar */}
      <div>
        <div className="flex justify-between items-center text-[10px] font-mono tracking-[0.1em] uppercase mb-1">
          <span className="text-steel-grey">Average</span>
          <span className="text-dim-grey">
            {avgMonths} {avgMonths === 1 ? 'month' : 'months'}
          </span>
        </div>
        <div className="h-[2px] bg-charcoal/90 w-full overflow-hidden">
          <div
            className="h-full bg-dim-grey transition-all duration-500"
            style={{ width: `${avgPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function JourneyTimeline({ currentStage, filingDate, prediction, adjournmentReasons = [] }) {
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

  const getStageDate = (index) => {
    if (!filingDate) return '';
    const date = new Date(filingDate);
    if (index === 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (index < currentStageIndex) {
      date.setMonth(date.getMonth() + index * 4);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (index === currentStageIndex) {
      return `Commenced ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    return '';
  };

  return (
    <div className="relative py-8" ref={containerRef}>
      <div className="absolute left-6 md:left-[50%] top-0 bottom-0 w-[1px] bg-surface-dim" />
      
      <div className="flex flex-col gap-12">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isFuture = idx > currentStageIndex;
          const showComparison = isCurrent && !isDisposed && prediction?.stageComparison;
          
          let stageClass = 'timeline-stage';
          if (isFuture) stageClass += ' future-stage';

          return (
            <div key={idx} className={`${stageClass} relative flex flex-col md:flex-row items-start md:items-center w-full`}>
              {/* Central Node / Dot */}
              <div className="absolute left-6 md:left-[50%] -translate-x-[50%] bg-charcoal p-1">
                <div className={`status-seal-dot w-3 h-3 ${isPast || isCurrent ? 'bg-gold' : 'bg-surface-mid'}`} />
              </div>

              {/* Content Left (Mobile: right of dot, Desktop: left half) */}
              <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12 text-left md:text-right flex flex-col justify-center min-h-[3rem]">
                {idx % 2 === 0 ? (
                  <>
                    <div className="font-mono text-[10px] uppercase text-gold-light mb-1">
                      Stage {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className={`font-display text-lg ${isCurrent ? 'text-bone-white font-medium' : isPast ? 'text-off-white' : 'text-surface-mid'}`}>
                      {stage}
                    </div>
                    {(isPast || isCurrent) && (
                      <div className="font-mono text-xs text-dim-grey mt-1">
                        {getStageDate(idx)}
                      </div>
                    )}
                    {/* Stage duration comparison for even index */}
                    {showComparison && (
                      <StageDurationComparison
                        stageComparison={prediction.stageComparison}
                        alignRight={true}
                      />
                    )}
                  </>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              {/* Content Right (Mobile: same side, Desktop: right half) */}
              <div className="w-full md:w-1/2 pl-12 md:pl-12 flex flex-col justify-center min-h-[3rem] mt-2 md:mt-0">
                {idx % 2 !== 0 ? (
                  <>
                    <div className="font-mono text-[10px] uppercase text-gold-light mb-1 md:hidden">
                      Stage {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className={`font-display text-lg md:text-xl ${isCurrent ? 'text-bone-white font-medium' : isPast ? 'text-off-white' : 'text-surface-mid'}`}>
                      {stage}
                    </div>
                    {(isPast || isCurrent) && (
                      <div className="font-mono text-xs text-dim-grey mt-1">
                        {getStageDate(idx)}
                      </div>
                    )}
                    {/* Stage duration comparison for odd index */}
                    {showComparison && (
                      <StageDurationComparison
                        stageComparison={prediction.stageComparison}
                        alignRight={false}
                      />
                    )}
                  </>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {prediction?.matchedClusterSize && (
        <div className="mt-16 text-center font-mono text-xs text-dim-grey">
          Based on analysis of {prediction.matchedClusterSize.toLocaleString()} similar cases
        </div>
      )}
    </div>
  );
}
