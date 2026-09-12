'use client';

import { useState, useEffect } from 'react';

/**
 * NationalPendingCounter — Live-ticking national pendency telemetry
 * Shows an estimated national pendency stat in the 5-crore range
 * formatted with Indian number grouping (lakh/crore commas).
 * Animates the trailing digits rapidly on mount before settling.
 */
export default function NationalPendingCounter() {
  const TARGET_TOTAL = 50234275;
  const BASE_PREFIX = 50230000; // Fixed leading part: 5,02,30,000
  const TARGET_TAIL = TARGET_TOTAL - BASE_PREFIX; // 4275
  
  // Format full number using Indian numbering system
  const formatIndian = (num) => {
    return num.toLocaleString('en-IN');
  };

  const [displayValue, setDisplayValue] = useState(TARGET_TOTAL);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const duration = 1500; // ~1.5s
    const startTime = performance.now();

    // Start with a randomized tail on client mount
    const initialRandomTail = Math.floor(1000 + Math.random() * 9000);
    setDisplayValue(BASE_PREFIX + initialRandomTail);

    let animationFrameId;

    const tick = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Fast random flutter on the last 4 digits, converging towards TARGET_TAIL
        if (progress > 0.85) {
          // Final convergence smoothly towards target
          const lerped = Math.round(TARGET_TAIL * (progress - 0.85) / 0.15 + (Math.random() * 200 - 100));
          const clamped = Math.max(1000, Math.min(9999, lerped));
          setDisplayValue(BASE_PREFIX + clamped);
        } else {
          // Rapid random digit fluctuation
          const randomTail = Math.floor(1000 + Math.random() * 9000);
          setDisplayValue(BASE_PREFIX + randomTail);
        }
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(TARGET_TOTAL);
        setIsSettled(true);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="mb-8 pt-2">
      <div className="inline-flex flex-col">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-off-white font-variant-numeric tabular-nums">
            {formatIndian(displayValue)}
          </span>
          <span className="font-body text-xs sm:text-sm text-steel-grey uppercase tracking-wider">
            pending cases across India
          </span>
          <span className={`w-1.5 h-1.5 rounded-full inline-block mb-1 transition-colors duration-500 ${
            isSettled ? 'bg-gold' : 'bg-stamp-red animate-pulse'
          }`} />
        </div>
        <span className="font-mono text-[10px] text-dim-grey tracking-[0.08em] mt-1">
          Estimated, based on publicly reported pendency figures
        </span>
      </div>
    </div>
  );
}
