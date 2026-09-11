'use client';

export default function ClusterStats({ prediction }) {
  const clusterSize = prediction?.matchedClusterSize || 4213;
  const formattedSize = new Intl.NumberFormat('en-US').format(clusterSize);
  const median = prediction?.etaRangeYears ? prediction.etaRangeYears : '2.8';
  const p25 = '1.4';
  const p75 = '5.2';
  
  const similarCases = [
    { id: 'CV-2021-****', type: 'Civil Suit / Property', count: 12, years: 2.1, match: 94 },
    { id: 'CV-2020-****', type: 'Civil Suit / Injunction', count: 18, years: 3.4, match: 89 },
    { id: 'CV-2019-****', type: 'Civil Suit / Property', count: 24, years: 4.8, match: 85 },
    { id: 'CV-2022-****', type: 'Civil Suit / Eviction', count: 8, years: 1.5, match: 81 },
  ];

  return (
    <div className="bg-[#0B0B0C] text-off-white font-body py-12">
      <div className="mb-16 border-b border-hairline pb-4">
        <div className="font-mono text-gold uppercase text-xs tracking-widest">
          // COHORT ANALYSIS · EMPIRICAL TRAJECTORY ARCHIVE
        </div>
      </div>

      <div className="mb-20 text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-8">
        <div>
          <div className="font-display text-7xl md:text-8xl leading-none">{formattedSize}</div>
          <div className="font-body text-dim-grey text-lg mt-2">similar cases found</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-y border-hairline divide-y md:divide-y-0 md:divide-x divide-hairline mb-20">
        <div className="p-8 text-center flex flex-col justify-center">
          <div className="font-display text-5xl md:text-6xl text-off-white mb-2">
            {p25}<span className="text-2xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-dim-grey">FASTEST 10%</div>
        </div>
        <div className="p-8 text-center flex flex-col justify-center bg-surface-dim">
          <div className="font-display text-6xl md:text-7xl text-gold mb-2">
            {median}<span className="text-3xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-off-white font-bold">MEDIAN DURATION</div>
        </div>
        <div className="p-8 text-center flex flex-col justify-center">
          <div className="font-display text-5xl md:text-6xl text-stamp-red mb-2">
            {p75}<span className="text-2xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-stamp-red">SLOWEST 10%</div>
        </div>
      </div>

      <div>
        <div className="font-mono text-dim-grey uppercase text-xs tracking-widest mb-6">
          PRECEDENT VECTORS · CLOSEST PROCEDURAL MATCH
        </div>
        
        <div className="border-t border-hairline">
          {similarCases.map((c, i) => (
            <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-hairline gap-2">
              <div className="font-mono text-gold md:w-1/4">{c.id}</div>
              <div className="text-sm md:w-1/3 truncate text-steel-grey font-body">{c.type}</div>
              <div className="text-sm md:w-1/6 font-mono text-dim-grey text-left md:text-center">{c.count} ADJS</div>
              <div className="text-sm md:w-1/6 text-left md:text-right font-mono">{c.years} YRS</div>
              <div className="font-mono text-xs bg-surface-dim px-2 py-1 ml-auto text-off-white">
                {c.match}% MATCH
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
