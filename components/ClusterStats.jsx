'use client';

export default function ClusterStats({ prediction }) {
  if (!prediction) return null;

  const clusterSize = prediction.matchedClusterSize || 0;
  const formattedSize = clusterSize.toLocaleString();
  const median = prediction.etaRangeYears?.median ?? 0;
  const p25 = prediction.etaRangeYears?.p25 ?? 0;
  const p75 = prediction.etaRangeYears?.p75 ?? 0;
  const similarCases = prediction.similarCases || [];
  const confidence = prediction.confidence || 0;

  return (
    <div className="text-off-white font-body">
      {/* Header */}
      <div className="mb-12 border-b border-hairline pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="font-mono text-gold uppercase text-[10px] tracking-[0.14em] flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Cohort Analysis // Empirical Trajectory Archive
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
            Method: <span className="text-gold">{prediction.method === 'cluster' ? 'k-Means' : 'Cohort'}</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
            Conf: <span className={confidence >= 70 ? 'text-gold' : 'text-off-white'}>{confidence}%</span>
          </span>
        </div>
      </div>

      {/* Oversized cluster number */}
      <div className="mb-16">
        <div className="font-display text-7xl md:text-8xl lg:text-9xl leading-none text-off-white">{formattedSize}</div>
        <div className="font-body text-dim-grey text-lg mt-2">
          similar cases found in {prediction.method === 'cluster' ? 'k-means cluster' : 'jurisdictional cohort'}
        </div>
      </div>

      {/* Distribution: p25 / median / p75 */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-y border-hairline divide-y md:divide-y-0 md:divide-x divide-hairline mb-16">
        <div className="p-6 md:p-8 text-center flex flex-col justify-center">
          <div className="font-display text-4xl md:text-5xl text-off-white mb-1">
            {p25}<span className="text-xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-grey">25th Percentile</div>
        </div>
        <div className="p-6 md:p-8 text-center flex flex-col justify-center bg-surface-dim/50">
          <div className="font-display text-5xl md:text-6xl text-gold mb-1">
            {median}<span className="text-2xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-off-white font-bold">Median Duration</div>
        </div>
        <div className="p-6 md:p-8 text-center flex flex-col justify-center">
          <div className="font-display text-4xl md:text-5xl text-stamp-red mb-1">
            {p75}<span className="text-xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stamp-red">75th Percentile</div>
        </div>
      </div>

      {/* Similar cases list */}
      {similarCases.length > 0 && (
        <div>
          <div className="font-mono text-dim-grey uppercase text-[10px] tracking-[0.14em] mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-dim-grey inline-block" />
            Precedent Vectors // Closest Procedural Match
          </div>

          <div className="border-t border-hairline">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-4 border-b border-hairline">
              <span className="col-span-2 font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase">Case ID</span>
              <span className="col-span-3 font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase">Type / Court</span>
              <span className="col-span-2 font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase text-center">Adjournments</span>
              <span className="col-span-2 font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase text-center">Duration</span>
              <span className="col-span-3 font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase text-right">Resolved</span>
            </div>

            {similarCases.map((c, i) => {
              // Compute similarity to median
              const distToMedian = Math.abs(c.yearsToDisposal - median);
              const similarity = Math.max(60, Math.min(99, Math.round(100 - distToMedian * 12)));

              return (
                <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 py-4 px-4 border-b border-hairline hover:bg-surface-dim/30 transition-colors">
                  <div className="md:col-span-2">
                    <span className="font-mono text-sm text-gold">{c.id}</span>
                    <span className="font-mono text-[10px] text-dim-grey ml-2">{similarity}%</span>
                  </div>
                  <div className="md:col-span-3 flex flex-col">
                    <span className="font-body text-sm text-off-white truncate">{c.case_type}</span>
                    <span className="font-mono text-[10px] text-dim-grey truncate">{c.filing_court}</span>
                  </div>
                  <div className="md:col-span-2 text-left md:text-center">
                    <span className="font-mono text-sm text-off-white">{c.num_adjournments}</span>
                    <span className="font-mono text-[10px] text-dim-grey ml-1 md:hidden">adj</span>
                  </div>
                  <div className="md:col-span-2 text-left md:text-center">
                    <span className="font-mono text-sm text-off-white">{c.yearsToDisposal}</span>
                    <span className="font-mono text-[10px] text-dim-grey ml-1">yrs</span>
                  </div>
                  <div className="md:col-span-3 text-left md:text-right col-span-2">
                    <span className="font-mono text-[10px] text-steel-grey">
                      {c.disposal_date ? new Date(c.disposal_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
