import Link from 'next/link';
import StatusSeal from './StatusSeal';

export default function CaseListRow({ caseData, prediction, isLast = false }) {
  if (!caseData) return null;

  const riskLevel = prediction?.delayRiskLevel || 'Medium';
  const etaRange = prediction?.etaDateRange
    ? `${new Date(prediction.etaDateRange.earliest).getFullYear()}–${new Date(prediction.etaDateRange.latest).getFullYear()}`
    : '—';

  return (
    <Link href={`/case/${encodeURIComponent(caseData.id)}`} className="block group">
      <div className={`flex items-center justify-between py-5 px-5 transition-colors duration-200 hover:bg-[#141416] cursor-pointer ${!isLast ? 'border-b border-hairline' : ''}`}>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0 flex-grow min-w-0">
          {/* Case ID */}
          <div className="md:w-[160px] flex-shrink-0">
            <span className="font-mono text-sm text-gold group-hover:text-gold-light transition-colors duration-200">
              {caseData.id}
            </span>
          </div>
          
          {/* Case Type + Court */}
          <div className="flex flex-col gap-0.5 md:flex-1 min-w-0">
            <span className="font-display text-off-white text-base truncate">
              {caseData.case_type}
            </span>
            <span className="font-body text-steel-grey text-xs truncate">
              {caseData.filing_court}
            </span>
          </div>
          
          {/* Current Stage */}
          <div className="md:w-[180px] flex-shrink-0">
            <span className="font-mono text-xs tracking-label uppercase text-dim-grey">
              {caseData.current_stage === 'Disposed' ? (
                <span className="text-gold">Resolved</span>
              ) : (
                caseData.current_stage
              )}
            </span>
          </div>
          
          {/* ETA Range */}
          <div className="md:w-[120px] flex-shrink-0 text-right hidden md:block">
            <span className="font-mono text-sm text-off-white">
              {caseData.current_stage === 'Disposed' ? 'Landed' : etaRange}
            </span>
          </div>
        </div>
        
        {/* Status Seal */}
        <div className="ml-4 flex-shrink-0">
          <StatusSeal level={riskLevel} />
        </div>
        
      </div>
    </Link>
  );
}
