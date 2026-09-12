'use client';
import { useEffect, useRef } from 'react';

const STAGES = ['Filed', 'Notice Issued', 'Written Statement Filed', 'Evidence Stage', 'Arguments', 'Judgment Reserved', 'Disposed'];

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

  const getStageDate = (index) => {
    if (!filingDate) return '';
    const date = new Date(filingDate);
    if (index === 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (index < currentStageIndex) {
      date.setMonth(date.getMonth() + index * 4); // Fake past dates
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
          
          let stageClass = 'timeline-stage';
          if (isFuture) stageClass += ' future-stage';

          return (
            <div key={idx} className={`${stageClass} relative flex flex-col md:flex-row items-start md:items-center w-full`}>
              {/* Dot */}
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
                  </>
                ) : (
                  <div className="hidden md:block">
                    {/* Desktop alternating empty side */}
                  </div>
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
                  </>
                ) : (
                  <div className="hidden md:block text-left text-sm text-dim-grey">
                    {isCurrent && prediction && (
                      <span>
                        Took {prediction.currentDurationMonths} months so far &middot; avg is {prediction.avgDurationForStage} months
                      </span>
                    )}
                  </div>
                )}
                
                {idx % 2 !== 0 && isCurrent && prediction && (
                  <div className="md:hidden text-left text-xs text-dim-grey mt-2">
                    Took {prediction.currentDurationMonths} months so far &middot; avg is {prediction.avgDurationForStage} months
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {prediction?.matchedClusterSize && (
        <div className="mt-16 text-center font-mono text-xs text-dim-grey">
          Based on analysis of {prediction.matchedClusterSize} similar cases
        </div>
      )}
    </div>
  );
}
