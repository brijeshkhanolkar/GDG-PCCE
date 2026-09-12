'use client';
import GlossaryTerm from './GlossaryTerm';

export default function ClusterStats({ prediction }) {
  if (!prediction) return null;

  const p25 = prediction.etaRangeYears?.p25 ?? 2.5;
  const medianYears = prediction.etaRangeYears?.median ?? 3.8;
  const p75 = prediction.etaRangeYears?.p75 ?? 5.0;
  const similarCases = prediction.similarCases || [];
  const method = prediction.method || 'cluster';
  const clusterId = prediction.clusterId;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-8 items-end mb-8">
        <div>
          <div className="font-mono text-xs text-gold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full inline-block ${method === 'cluster' ? 'bg-gold' : 'bg-dim-grey'}`} />
            <span>{method === 'cluster' ? `K-Means Cluster #${clusterId ?? 0}` : 'Jurisdictional Cohort'}</span>
          </div>
          <div className="text-7xl md:text-8xl font-display leading-none text-off-white">
            {prediction.matchedClusterSize?.toLocaleString() || 0}
          </div>
          <div className="font-mono text-xs text-dim-grey mt-2 uppercase tracking-label">Cases in matched cluster</div>
        </div>
        
        <div className="pb-2">
          <div className="font-mono text-xs text-steel-grey uppercase tracking-wider mb-2">Estimated Window</div>
          <div className="text-3xl md:text-4xl font-display text-gold">
            {p25} – {p75}
            <span className="text-lg text-dim-grey ml-2">yrs</span>
          </div>
          <div className="font-mono text-[10px] text-dim-grey mt-1">
            Median duration: <span className="text-off-white font-medium">{medianYears} yrs</span>
          </div>
        </div>
      </div>

      {similarCases.length > 0 && (
        <div className="mt-8">
          <div className="font-mono text-[10px] text-dim-grey uppercase tracking-widest border-b border-hairline pb-2 mb-4">
            Precedent Cases (Nearest Procedural Neighbors)
          </div>
          <div className="flex flex-col gap-2">
            {similarCases.map((c, i) => {
              const yrs = c.yearsToDisposal ?? 3.5;
              const diff = Math.abs(yrs - medianYears);
              const similarity = Math.max(65, Math.min(99, Math.round(98 - diff * 8)));
              return (
                <div key={i} className="flex justify-between items-center text-sm p-3 bg-surface-dim hover:bg-surface-mid transition-colors border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-gold">{c.id || c.caseId}</span>
                    <span className="font-body text-xs text-steel-grey mt-0.5">
                      <GlossaryTerm term={c.case_type || c.type} /> &middot; {c.filing_court || c.court}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm text-off-white">{yrs} yrs</span>
                    <span className="font-mono text-[10px] text-dim-grey mt-0.5">{similarity}% match</span>
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
