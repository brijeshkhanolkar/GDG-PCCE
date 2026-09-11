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

export default function JourneyTimeline({ currentStage, filingDate, prediction }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = containerRef.current?.querySelectorAll('.timeline-stage');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const currentIndex = STAGES.indexOf(currentStage) === -1 ? 0 : STAGES.indexOf(currentStage);

  return (
    <div className="font-body text-off-white" ref={containerRef}>
      <div className="relative pl-6 md:pl-10">
        {/* Vertical Gold Line */}
        <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-gold opacity-50"></div>

        {STAGES.map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          let stageDate = '';
          if (isPast && index === 0) stageDate = filingDate;
          if (isCurrent) stageDate = 'Present';

          return (
            <div
              key={stage}
              className={`timeline-stage relative mb-12 transition-all duration-700 ease-out opacity-0 translate-y-4 ${
                isFuture ? 'opacity-30' : ''
              }`}
            >
              {/* Dot on timeline */}
              <div className={`absolute -left-[3px] md:-left-[3px] top-2 w-[7px] h-[7px] rounded-none ${isCurrent ? 'bg-gold' : 'bg-dim-grey'}`}></div>

              <div className={`flex flex-col md:flex-row md:items-baseline gap-2 mb-2 ${isCurrent ? 'p-6 bg-[#131314] border-l border-gold shadow-md -ml-6 md:-ml-10 pl-6 md:pl-10' : ''}`}>
                <div className="font-mono text-dim-grey uppercase text-xs tracking-widest w-16">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-4">
                    <h3 className={`font-display ${isCurrent ? 'text-4xl text-gold' : isPast ? 'text-2xl text-dim-grey' : 'text-2xl text-steel-grey'}`}>
                      {stage}
                    </h3>
                    {isPast && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-dim-grey border border-dim-grey px-2 py-0.5">
                        Completed
                      </span>
                    )}
                  </div>

                  {(isCurrent || stageDate) && (
                    <div className="font-mono text-xs text-dim-grey mt-2 uppercase tracking-widest">
                      {stageDate}
                    </div>
                  )}

                  {isCurrent && prediction && (
                    <div className="mt-4 font-mono text-sm text-gold">
                      Took {prediction.monthsSoFar || '14'} months so far · avg is {prediction.etaRangeYears || '2.5'} years
                    </div>
                  )}
                  {isCurrent && (
                     <p className="mt-2 text-steel-grey max-w-xl font-body">
                       Awaiting completion of {stage.toLowerCase()}. This phase has high variance in duration based on party cooperation.
                     </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-16 font-mono text-[10px] uppercase text-dim-grey tracking-widest border-t border-hairline pt-4 text-right">
        // Positioned in top 15% of fastest progressing cases in cohort
      </div>
    </div>
  );
}
