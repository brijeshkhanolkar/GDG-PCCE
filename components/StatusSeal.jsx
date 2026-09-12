'use client';

/**
 * StatusSeal — Circular stamp shape (gold = on time / low risk, red = delayed / high risk, gold check = disposed)
 * Never a rounded pill badge.
 */
export default function StatusSeal({ level = 'Medium', isDisposed = false, showLabel = true, size = 'normal' }) {
  const isLanded = isDisposed || level === 'Disposed' || level === 'Landed';

  let borderColor = 'border-dim-grey';
  let dotColor = 'bg-dim-grey';
  let textColor = 'text-dim-grey';
  let label = level;

  if (isLanded) {
    borderColor = 'border-gold';
    dotColor = 'bg-gold';
    textColor = 'text-gold';
    label = 'Disposed';
  } else if (level === 'Low') {
    borderColor = 'border-gold';
    dotColor = 'bg-gold';
    textColor = 'text-gold';
    label = 'On Time';
  } else if (level === 'High') {
    borderColor = 'border-stamp-red';
    dotColor = 'bg-stamp-red';
    textColor = 'text-stamp-red';
    label = 'Delayed';
  } else {
    borderColor = 'border-gold/60';
    dotColor = 'bg-gold/60';
    textColor = 'text-steel-grey';
    label = 'Standard';
  }

  const dimensions = size === 'small' ? 'w-7 h-7' : 'w-10 h-10';
  const dotDimensions = size === 'small' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex flex-col items-center gap-1.5 inline-flex">
      <div className={`status-seal ${dimensions} border-2 ${borderColor} flex items-center justify-center relative bg-charcoal/80 shadow-md`}>
        {isLanded ? (
          <svg className="w-4 h-4 text-gold" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <div className={`status-seal-dot ${dotDimensions} ${dotColor} transition-colors`} />
        )}
      </div>
      {showLabel && (
        <span className={`font-mono uppercase text-[9px] tracking-[0.14em] ${textColor} font-medium`}>
          {label}
        </span>
      )}
    </div>
  );
}
