'use client';

export default function DelayReportRow({ adjournment, previousDate, index }) {
  const { date, reason, stage_at_time } = adjournment;

  // Simple drift calculation
  const driftDays = previousDate
    ? Math.round((new Date(date) - new Date(previousDate)) / (1000 * 60 * 60 * 24))
    : 14; // fallback

  return (
    <div className="py-8 md:py-12 border-b border-gold border-opacity-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-off-white">
      <div className="w-full md:w-1/4 flex flex-col">
        <span className="font-body text-lg">{date}</span>
        {driftDays > 0 && (
          <span className="font-mono text-stamp-red text-xs uppercase tracking-widest mt-1">
            +{driftDays} days drift
          </span>
        )}
      </div>

      <div className="w-full md:w-1/2 text-left md:text-center">
        <h4 className="font-display text-xl md:text-2xl font-bold text-bone-white">{reason}</h4>
      </div>

      <div className="w-full md:w-1/4 text-left md:text-right">
        <span className="font-mono uppercase text-sm text-dim-grey tracking-widest">
          {stage_at_time}
        </span>
      </div>
    </div>
  );
}
