import Link from 'next/link';
import StatusSeal from './StatusSeal';

/**
 * CaseListRow — Flat departure-board-style row for listing cases.
 * Used on the landing page's featured cases section.
 * NOT a card — a clean horizontal row with hairline borders.
 */
export default function CaseListRow({ caseData, prediction, isLast = false }) {
  if (!caseData) return null;

  const riskLevel = prediction?.delayRiskLevel || 'Medium';
  const isDisposed = caseData.current_stage === 'Disposed';
  
  // Compute ETA display range
  const etaRange = prediction?.etaDateRange
    ? `${new Date(prediction.etaDateRange.earliest).getFullYear()}–${new Date(prediction.etaDateRange.latest).getFullYear()}`
    : '—';

  // Format stage for display
  const stageDisplay = isDisposed ? 'Resolved' : caseData.current_stage;

  // Compute trajectory percentage from days_elapsed / total_duration_days
  const trajectoryPct = caseData.total_duration_days > 0
    ? Math.min(100, Math.round((caseData.days_elapsed / caseData.total_duration_days) * 100))
    : 0;

  return (
    <Link href={`/case/${encodeURIComponent(caseData.id)}`} className="block group">
      <div className={`flex items-center justify-between py-5 px-5 transition-colors duration-200 hover:bg-[#141416] cursor-pointer ${
        !isLast ? 'border-b border-hairline' : ''
      }`}>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0 flex-grow min-w-0">
          {/* Case ID */}
          <div className="md:w-[140px] lg:w-[160px] flex-shrink-0">
            <span className="font-mono text-sm text-gold group-hover:text-gold-light transition-colors duration-200">
              {caseData.id}
            </span>
          </div>
          
          {/* Case Type + Court */}
          <div className="flex flex-col gap-0.5 md:flex-1 min-w-0 md:px-4">
            <span className="font-display text-off-white text-base truncate">
              {caseData.case_type}
            </span>
            <span className="font-body text-dim-grey text-xs truncate">
              {caseData.filing_court}
            </span>
          </div>
          
          {/* Current Stage + trajectory */}
          <div className="md:w-[180px] flex-shrink-0 md:px-4">
            <span className={`font-mono text-xs tracking-[0.14em] uppercase ${
              isDisposed ? 'text-gold' : 'text-steel-grey'
            }`}>
              {stageDisplay}
            </span>
            {/* Trajectory bar */}
            {!isDisposed && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="h-[2px] bg-hairline-light flex-1 max-w-[80px]">
                  <div 
                    className="h-full bg-gold transition-all duration-300"
                    style={{ width: `${trajectoryPct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-gold">
                  {trajectoryPct}%
                </span>
              </div>
            )}
          </div>
          
          {/* ETA Range */}
          <div className="md:w-[120px] flex-shrink-0 text-right hidden md:block">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-dim-grey block mb-0.5">
              Est. Resolution
            </span>
            <span className="font-mono text-sm text-off-white">
              {isDisposed ? 'Landed' : etaRange}
            </span>
          </div>
        </div>
        
        {/* Status Seal */}
        <div className="ml-4 flex-shrink-0">
          <StatusSeal level={riskLevel} showLabel={false} />
        </div>
        
      </div>
    </Link>
  );
}
