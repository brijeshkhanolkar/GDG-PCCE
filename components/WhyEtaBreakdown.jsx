'use client';

import { useState } from 'react';

/**
 * WhyEtaBreakdown — Expandable explanation of ETA factors
 * Placed beneath the ETA banner in the Tracker Hero.
 * Collapsed by default. Displays 3-4 computed factors deriving the estimate.
 */
export default function WhyEtaBreakdown({ etaFactors = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!etaFactors || etaFactors.length === 0) {
    return null;
  }

  // Format factor text: highlight numbers, years, percentages in off-white / gold
  const formatFactorText = (text) => {
    // Regex matches numbers, years, cluster ids, etc.
    const parts = text.split(/(\b\d+(?:\.\d+)?(?:\+)?\s*(?:years|yr|months|adjournments|cases)?\b)/gi);
    return parts.map((part, idx) => {
      if (/\d/.test(part)) {
        return (
          <span key={idx} className="text-off-white font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="mt-4 mb-8">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="group inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase text-dim-grey hover:text-gold transition-colors duration-150 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <span>Why this estimate?</span>
        <svg
          className={`w-3 h-3 transform transition-transform duration-200 text-steel-grey group-hover:text-gold ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable factor list */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100 mt-3 pt-3 border-t border-hairline/60' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-2 max-w-xl">
          {etaFactors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-gold font-mono text-xs select-none">›</span>
              <p className="font-body text-xs text-dim-grey leading-relaxed">
                {formatFactorText(factor)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
