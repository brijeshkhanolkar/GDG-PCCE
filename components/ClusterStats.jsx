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
  const turbulence = prediction.turbulence;

  return (
    <div className="text-off-white font-body">
      {/* Header */}
      <div className="mb-12 border-b border-hairline pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="font-mono text-gold uppercase text-[10px] tracking-[0.14em] flex items-center gap-2">
          <span className="w-2 h-2 bg-gold inline-block" />
          Precedent Archive // Empirical Nearest Neighbors (k-NN)
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
            Engine: <span className="text-gold">Multi-Dim k-NN (k={prediction.k || 15})</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-steel-grey">
            Calibrated Confidence: <span className={confidence >= 70 ? 'text-gold font-bold' : 'text-off-white font-bold'}>{confidence}%</span>
          </span>
        </div>
      </div>

      {/* Oversized precedent cohort number */}
      <div className="mb-16">
        <div className="font-display text-7xl md:text-8xl lg:text-9xl leading-none text-off-white">{formattedSize}</div>
        <div className="font-body text-dim-grey text-lg mt-2">
          empirical precedent cases evaluated in jurisdictional cohort
        </div>
      </div>

      {/* Distribution: p25 / median / p75 */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-y border-hairline divide-y md:divide-y-0 md:divide-x divide-hairline mb-16">
        <div className="p-6 md:p-8 text-center flex flex-col justify-center">
          <div className="font-display text-4xl md:text-5xl text-off-white mb-1">
            {p25}<span className="text-xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-grey">25th Percentile (Fastest Cadence)</div>
        </div>
        <div className="p-6 md:p-8 text-center flex flex-col justify-center bg-surface-dim/50 border-x border-gold/20">
          <div className="font-display text-5xl md:text-6xl text-gold mb-1">
            {median}<span className="text-2xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-off-white font-bold">Median Disposition Timeline</div>
        </div>
        <div className="p-6 md:p-8 text-center flex flex-col justify-center">
          <div className="font-display text-4xl md:text-5xl text-stamp-red mb-1">
            {p75}<span className="text-xl text-dim-grey ml-1">yrs</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stamp-red">75th Percentile (Procedural Drag)</div>
        </div>
      </div>

      {/* Similar cases / Precedent vectors */}
      {similarCases.length > 0 && (
        <div>
          <div className="font-mono text-dim-grey uppercase text-[10px] tracking-[0.14em] mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold inline-block" />
              <span>Closest Procedural Neighbors // Shared Feature Weights</span>
            </div>
            <span className="text-steel-grey">Top {similarCases.length} Disposed Precedents</span>
          </div>

          <div className="border-t border-hairline space-y-0">
            {similarCases.map((c, i) => {
              const similarity = c.similarityScore || Math.max(65, Math.min(99, Math.round(100 - (c.distance || 1) * 12)));
              const isPublic = Boolean(c.is_public_sample || c.id.startsWith('PUB-'));

              return (
                <div 
                  key={i} 
                  className="p-5 md:p-6 border-b border-hairline hover:bg-surface-dim/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left Column: ID, Court, Type, Public Badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="font-mono text-base text-gold font-medium">{c.id}</span>
                      
                      {isPublic && (
                        <span className="px-2 py-0.5 bg-gold/15 text-gold border border-gold/40 text-[9px] font-mono uppercase tracking-[0.14em]">
                          ★ Public Benchmark
                        </span>
                      )}

                      <span className="px-2 py-0.5 bg-surface-high text-off-white text-[10px] font-mono">
                        {similarity}% Procedural Match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim-grey font-body mb-2">
                      <span className="text-off-white font-medium">{c.case_type}</span>
                      <span>•</span>
                      <span>{c.filing_court}</span>
                      <span>•</span>
                      <span>{c.num_adjournments} Adjournments</span>
                      {c.complexity && (
                        <>
                          <span>•</span>
                          <span>{c.complexity} Complexity</span>
                        </>
                      )}
                    </div>

                    {/* Shared Features Chips */}
                    {c.sharedFeatures && c.sharedFeatures.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-steel-grey mr-1">Shared Vectors:</span>
                        {c.sharedFeatures.map((feat, fIdx) => (
                          <span 
                            key={fIdx} 
                            className="px-2 py-0.5 bg-charcoal border border-hairline text-steel-grey font-mono text-[9px] uppercase tracking-wider"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Public Record Citation */}
                    {c.source && (
                      <div className="font-mono text-[10px] text-dim-grey/90 mt-2 italic">
                        Citation: {c.source}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Duration Metric & Resolution Date */}
                  <div className="flex-shrink-0 text-left md:text-right flex md:flex-col items-baseline md:items-end justify-between w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-hairline/40">
                    <div>
                      <div className="font-display text-2xl md:text-3xl text-off-white font-medium">
                        {c.yearsToDisposal} <span className="text-sm font-mono text-dim-grey">years</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-grey block">
                        Resolved {c.disposal_date ? new Date(c.disposal_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
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
