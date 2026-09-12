import StatusSeal from './StatusSeal';

export default function BoardingPass({ caseData, prediction }) {
  if (!caseData) return null;

  const petitioner = caseData.parties?.petitioner || 'Unknown';
  const respondent = caseData.parties?.respondent || 'Unknown';
  const filingCourt = caseData.filing_court || 'Unknown Court';
  const finalCourt = caseData.predicted_final_court || filingCourt;
  
  const riskLevel = prediction?.delayRiskLevel || 'Low';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const formattedDate = formatDate(caseData.filing_date);

  return (
    <div className="relative flex w-full max-w-4xl mx-auto rounded-md shadow-2xl bg-off-white text-charcoal font-body overflow-hidden border-l-2 border-gold mb-12">
      {/* Shine Video Effect */}
      <video
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-10 pointer-events-none"
        src="/assets/boardingpass-shine.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      
      {/* Main Section */}
      <div className="flex-1 flex flex-col p-6 z-10 border-r-2 border-dashed border-steel-grey/30">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="font-display text-sm tracking-widest text-dim-grey uppercase mb-1">Boarding Pass</div>
            <div className="font-display font-bold text-2xl tracking-wide">{caseData.id}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-sm tracking-widest text-dim-grey uppercase mb-1">Class</div>
            <div className="font-bold">{caseData.case_type}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Origin</div>
            <div className="font-display text-3xl mb-1">{filingCourt.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}</div>
            <div className="text-sm truncate w-48" title={filingCourt}>{filingCourt}</div>
          </div>
          
          <div className="flex-1 flex flex-col items-center px-4">
            <div className="w-full h-px bg-steel-grey relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold">✈</div>
            </div>
            <div className="text-xs text-dim-grey mt-2">Flight Time</div>
            <div className="text-sm font-mono">{caseData.days_elapsed}d elapsed</div>
          </div>
          
          <div className="flex-1 text-right">
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Dest</div>
            <div className="font-display text-3xl mb-1 text-gold">{finalCourt.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}</div>
            <div className="text-sm truncate w-48 float-right" title={finalCourt}>{finalCourt}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Petitioner</div>
            <div className="font-bold truncate" title={petitioner}>{petitioner}</div>
          </div>
          <div>
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Respondent</div>
            <div className="font-bold truncate" title={respondent}>{respondent}</div>
          </div>
          <div>
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Filing Date</div>
            <div className="font-mono">{formattedDate}</div>
          </div>
          <div>
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">ETA</div>
            <div className="font-mono text-stamp-red font-bold">
              {prediction?.etaDateRange?.likely ? formatDate(prediction.etaDateRange.likely) : 'TBD'}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-steel-grey/20">
          <div className="font-mono text-xs opacity-50 tracking-[0.3em] h-8 flex items-center barcode-font">
            ||| | || ||| || ||| | | || ||| || | ||| || || | | ||| | || ||
          </div>
        </div>
      </div>

      {/* Stub Section */}
      <div className="w-1/3 p-6 z-10 flex flex-col justify-between bg-white bg-opacity-40">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="font-display font-bold text-xl">{caseData.id}</div>
          </div>
          <div className="mb-4">
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Passenger</div>
            <div className="text-sm truncate" title={petitioner}>{petitioner}</div>
          </div>
          <div className="mb-4">
            <div className="font-display text-xs tracking-widest text-dim-grey uppercase mb-1">Risk Profile</div>
            <div className="text-sm font-bold">{riskLevel}</div>
          </div>
        </div>

        <div className="mt-auto flex justify-center items-center">
           <StatusSeal level={riskLevel} />
        </div>
      </div>
    </div>
  );
}
