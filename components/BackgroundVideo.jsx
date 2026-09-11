'use client';

import { useState, useEffect } from 'react';

export default function BackgroundVideo({ 
  src, 
  overlayOpacity = 0.45, 
  className = 'relative w-full min-h-screen',
  children 
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const videoSrc = `/assets/${src}.mp4`;
  const posterSrc = `/assets/${src}-poster.jpg`;

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Fallback/Poster layer */}
      <div 
        className="absolute inset-0 w-full h-full bg-charcoal"
        style={{
          backgroundImage: `url(${posterSrc}), linear-gradient(to bottom, #0B0B0C, #1E1E22)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Video layer */}
      {!prefersReducedMotion && !videoError && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setVideoError(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Overlay layer */}
      <div 
        className="absolute inset-0 w-full h-full bg-charcoal pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
