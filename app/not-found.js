import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-charcoal text-off-white flex flex-col items-center justify-center font-body selection:bg-gold selection:text-charcoal p-6">
      <div className="text-center">
        <h1 className="font-display text-8xl text-gold mb-6 font-bold tracking-tighter">404</h1>
        <p className="font-mono text-xl text-dim-grey uppercase tracking-widest mb-12">
          Case not found in the docket system
        </p>
        <Link 
          href="/" 
          className="inline-block px-8 py-4 border-2 border-gold text-gold hover:bg-gold hover:text-charcoal transition-colors font-display tracking-wide uppercase text-sm"
        >
          Return to Terminal
        </Link>
      </div>
    </div>
  );
}
