export default function StatusSeal({ level = 'Medium', showLabel = true }) {
  let borderColor = '';
  let dotColor = '';

  switch (level.toLowerCase()) {
    case 'low':
      borderColor = 'border-gold';
      dotColor = 'bg-gold';
      break;
    case 'high':
      borderColor = 'border-stamp-red';
      dotColor = 'bg-stamp-red';
      break;
    case 'medium':
    default:
      borderColor = 'border-dim-grey';
      dotColor = 'bg-dim-grey';
      break;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-10 h-10 rounded-full border-2 ${borderColor} flex items-center justify-center`}
      >
        <div className={`w-3 h-3 rounded-full ${dotColor}`} />
      </div>
      
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-steel-grey">
          {level}
        </span>
      )}
    </div>
  );
}
