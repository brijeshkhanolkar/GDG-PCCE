'use client';
import StatusSeal from './StatusSeal';

export default function BoardingPass({ caseData, prediction }) {
  const id = caseData?.id || 'NYR-00000';
  const petitioner = caseData?.parties?.petitioner || 'Unknown';
  const respondent = caseData?.parties?.respondent || 'Unknown';
  const filingCourt = caseData?.filing_court || 'District Court';
  const predictedCourt = caseData?.predicted_final_court || 'High Court';
  const currentStage = caseData?.current_stage || 'Filed';
  const filingDate = caseData?.filing_date || '2023-01-15';
  const caseType = caseData?.case_type || 'Civil';
  const riskLevel = prediction?.delayRiskLevel || 'Medium';

  // Format filing date for display
  const formattedDate = new Date(filingDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div className="relative bg-surface-dim text-off-white font-body border-l-2 border-gold flex flex-col md:flex-row overflow-hidden w-full">
      {/* Video Overlay — boardingpass-shine.mp4 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.08] mix-blend-screen pointer-events-none"
        onError={(e) => { e.target.style.display = 'none'; }}
      >
        <source src="/assets/boardingpass-shine.mp4" type="video/mp4" />
      </video>

      {/* ─── Main Body (Left ~65%) ─────────────────────────────────── */}
      <div className="relative flex-grow p-6 md:p-8 flex flex-col justify-between w-full md:w-[65%] border-b border-dashed border-hairline-light md:border-b-0 md:border-r md:border-dashed">
        {/* Top row: Litigation Vector + Case Number */}
        <div>
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="font-mono text-gold uppercase text-[10px] tracking-label block">
                Litigation Vector
              </span>
              <span className="font-mono text-gold uppercase text-[10px] tracking-label block mt-1">
                {caseType}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-1">
                Case Number
              </span>
              <span className="font-display text-2xl md:text-3xl text-off-white font-medium">
                {id}
              </span>
            </div>
          </div>
          
          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-2">
                Petitioner
              </span>
              <span className="font-display text-lg md:text-xl text-off-white">
                {petitioner}
              </span>
            </div>
            <div>
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-2">
                Respondent
              </span>
              <span className="font-display text-lg md:text-xl text-off-white">
                {respondent}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row: Court details */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t border-hairline">
            <div>
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-1">
                Filing Court
              </span>
              <span className="text-sm font-body truncate block">{filingCourt}</span>
              <span className="text-[10px] text-dim-grey font-mono">{caseData?.jurisdiction}</span>
            </div>
            <div>
              <span className="font-mono text-gold uppercase text-[10px] tracking-label block mb-1">
                Predicted Court
              </span>
              <span className="text-sm text-gold font-body truncate block">{predictedCourt}</span>
            </div>
            <div>
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-1">
                Current Stage
              </span>
              <span className="text-sm font-body">{currentStage}</span>
            </div>
            <div>
              <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-1">
                Filing Date
              </span>
              <span className="text-sm font-body font-medium">{formattedDate}</span>
            </div>
          </div>

          {/* Barcode + Reference */}
          <div className="flex items-end justify-between mt-6">
            <div className="flex gap-[2px] h-8 items-end opacity-40">
              {[...Array(45)].map((_, i) => (
                <div
                  key={i}
                  className="bg-dim-grey"
                  style={{
                    width: '1.5px',
                    height: i % 7 === 0 ? '100%' : i % 3 === 0 ? '60%' : '80%',
                  }}
                />
              ))}
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-dim-grey tracking-label uppercase block">
                CF-Barcode//{id.replace(/[^A-Z0-9]/g, '').substring(0, 8)}
              </span>
              <span className="font-mono text-[10px] text-gold tracking-label uppercase block mt-1">
                Stamp Ref: JUR-{id.substring(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stub (Right ~35%) ─────────────────────────────────────── */}
      <div className="relative w-full md:w-[35%] p-6 md:p-8 flex flex-col justify-between bg-surface-dim">
        <div className="flex justify-between items-start mb-6">
          <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label">
            Carrier Stub
          </span>
          <span className="font-mono text-dim-grey uppercase text-[10px] border border-hairline-light px-2 py-1">
            Gate<br />
            <span className="text-off-white font-medium">01</span>
          </span>
        </div>
        <span className="font-display text-sm text-off-white font-medium mb-6">
          Boarding Pass
        </span>
        
        {/* Status Seal */}
        <div className="flex items-center justify-center my-6">
          <div className="w-28 h-28 border-2 border-current flex flex-col items-center justify-center"
            style={{ 
              borderColor: riskLevel === 'High' ? '#8C3B34' : riskLevel === 'Low' ? '#C9A24B' : '#6B6B6E',
              borderRadius: '50%',
            }}
          >
            <span className="font-mono text-[8px] tracking-label uppercase text-dim-grey">
              {filingCourt.split(' ').slice(-2).join(' ')}
            </span>
            <span className="font-display text-sm font-bold mt-1"
              style={{ color: riskLevel === 'High' ? '#8C3B34' : '#C9A24B' }}
            >
              {currentStage === 'Disposed' ? 'RESOLVED' : riskLevel === 'High' ? 'DELAYED' : 'ON TRACK'}
            </span>
            <span className="font-mono text-[8px] tracking-label uppercase text-dim-grey mt-1">
              {caseType}
            </span>
          </div>
        </div>

        {/* Jurisdictional Status */}
        <div className="mt-4 mb-6">
          <span className="font-mono text-dim-grey uppercase text-[10px] tracking-label block mb-1">
            Jurisdictional Status
          </span>
          <span className="font-display text-sm text-off-white">
            {currentStage === 'Disposed' ? 'Case Resolved' : `In ${currentStage}`}
          </span>
        </div>

        {/* Details grid */}
        <div className="space-y-3 pt-4 border-t border-hairline">
          <div className="flex justify-between">
            <span className="font-body text-xs text-dim-grey">Case Type</span>
            <span className="font-body text-xs text-off-white text-right max-w-[140px] truncate">{caseType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-dim-grey">Case Number</span>
            <span className="font-mono text-xs text-gold">{id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-dim-grey">Hearings</span>
            <span className="font-body text-xs text-off-white font-medium">{caseData?.hearings || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-dim-grey">Adjournments</span>
            <span className="font-body text-xs text-off-white font-medium">{caseData?.num_adjournments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
