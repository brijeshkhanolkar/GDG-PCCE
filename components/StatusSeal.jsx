export default function StatusSeal({ level = 'Medium', showLabel = true }) {
  let borderColor = 'border-dim-grey';
  let dotColor = 'bg-dim-grey';
  let textColor = 'text-dim-grey';

  if (level === 'Low') {
    borderColor = 'border-gold';
    dotColor = 'bg-gold';
    textColor = 'text-gold';
  } else if (level === 'High') {
    borderColor = 'border-stamp-red';
    dotColor = 'bg-stamp-red';
    textColor = 'text-stamp-red';
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`status-seal w-10 h-10 border-2 ${borderColor} flex items-center justify-center`}>
        <div className={`status-seal-dot w-3 h-3 ${dotColor}`} />
      </div>
      {showLabel && (
        <span className={`font-mono uppercase text-[10px] ${textColor}`}>
          {level || 'Unknown'}
        </span>
      )}
    </div>
  );
}
