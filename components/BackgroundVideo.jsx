'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * BackgroundVideo — Reusable full-bleed or contained video background.
 * 
 * Usage:
 *   <BackgroundVideo src="tracker-ontime" overlayOpacity={0.45}>
 *     <div>Content on top of video</div>
 *   </BackgroundVideo>
 * 
 * Features:
 * - Autoplay, muted, loop, playsInline (Safari mobile compatible)
 * - Poster image fallback (same name with -poster.jpg)
 * - onError graceful degradation to gradient placeholder
 * - Respects prefers-reduced-motion (shows static poster/gradient)
 * - Configurable overlay opacity
 */
export default function BackgroundVideo({ 
  src, 
  overlayOpacity = 0.45, 
  className = 'relative w-full min-h-screen',
  children 
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Check reduced motion preference
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

  // Attempt to play video when it loads
  useEffect(() => {
    const video = videoRef.current;
    if (video && !prefersReducedMotion && !videoError) {
      video.play().catch(() => {
        // Autoplay blocked — not an error, just show poster
      });
    }
  }, [prefersReducedMotion, videoError]);

  const videoSrc = `/assets/${src}.mp4`;
  const posterSrc = `/assets/${src}-poster.jpg`;

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Base Layer: Sleek Charcoal / Slate radial ambient glow */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 25%, #18181D 0%, #0B0B0C 75%)',
        }}
      />

      {/* Video Layer: Smooth full-bleed loop */}
      {!prefersReducedMotion && !videoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Contrast Overlay: Keeps foreground typography crisp & legible */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          backgroundColor: '#0B0B0C',
          opacity: overlayOpacity,
        }}
      />

      {/* Layer 5: Content (highest z-index) */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
