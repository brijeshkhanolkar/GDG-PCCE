export default function DelayReportRow({ adjournment, date, reason, stage, previousDate, index = 0 }) {
  const rawDate = adjournment?.date || date;
  const rawReason = adjournment?.reason || reason || 'Procedural delay';
  const rawStage = adjournment?.stage_at_time || stage || 'In Progress';

  let formattedDate = 'Recorded';
  let driftDays = 0;

  if (rawDate) {
    const dateObj = new Date(rawDate);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (previousDate) {
        const prevDateObj = new Date(previousDate);
        if (!isNaN(prevDateObj.getTime())) {
          driftDays = Math.max(0, Math.round((dateObj - prevDateObj) / (1000 * 60 * 60 * 24)));
        }
      }
    } else {
      formattedDate = String(rawDate);
    }
  }

  return (
    <div className="border-b border-gold/20 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="md:w-1/4 flex flex-col">
        <span className="font-mono text-sm text-bone-white">{formattedDate}</span>
        {driftDays > 0 && (
          <span className="font-mono text-xs text-stamp-red mt-1">+{driftDays} days drift</span>
        )}
      </div>
      <div className="md:w-1/2">
        <div className="font-display text-lg md:text-xl font-medium text-off-white">
          {rawReason}
        </div>
      </div>
      <div className="md:w-1/4 flex flex-col md:text-right">
        <span className="font-mono text-xs uppercase text-gold-light">
          {rawStage}
        </span>
        <span className="font-mono text-[10px] text-dim-grey mt-0.5">
          Ref: ADJ-{String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
