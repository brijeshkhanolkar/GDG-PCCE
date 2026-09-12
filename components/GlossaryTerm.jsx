'use client';

import { useState, useRef, useEffect } from 'react';
import { getGlossaryExplanation } from '@/lib/legalGlossary';

/**
 * GlossaryTerm — Plain-language legal term tooltip component
 * Shows a subtle dotted underline under legal terms.
 * On hover (desktop) or tap (mobile), displays an accessible plain-language translation.
 * If term is not in the glossary, renders plain text without error or underline.
 */
export default function GlossaryTerm({ term, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const termText = term || (typeof children === 'string' ? children : '');
  const explanation = getGlossaryExplanation(termText);

  // Close tooltip on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  // If no explanation is found, render plain text
  if (!explanation) {
    return <span className={className}>{children || term}</span>;
  }

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }}
    >
      <span
        tabIndex={0}
        role="button"
        aria-label={`Definition for ${termText}`}
        className="cursor-help border-b border-dotted border-steel-grey/70 hover:border-gold transition-colors duration-150 focus:outline-none"
      >
        {children || term}
      </span>

      {isOpen && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#18181B] text-off-white text-xs font-body font-normal rounded-none border border-[#2D2D32] shadow-2xl pointer-events-none leading-relaxed transition-all animate-fadeIn"
        >
          <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-gold mb-1">
            Plain Language Definition
          </span>
          <span className="block text-off-white/90">
            {explanation}
          </span>
          {/* Subtle triangle indicator */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#2D2D32]" />
        </span>
      )}
    </span>
  );
}
