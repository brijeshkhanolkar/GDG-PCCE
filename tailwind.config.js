/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CourtFlight — Sovereign Juris palette
        charcoal: '#0B0B0C',
        'surface-dim': '#131314',
        'surface-mid': '#18181B',
        'surface-high': '#1E1E22',
        'surface-bright': '#2A2A2B',
        gold: '#C9A24B',
        'gold-light': '#EBC166',
        'dim-grey': '#6B6B6E',
        'steel-grey': '#8E8E93',
        'stamp-red': '#8C3B34',
        'off-white': '#F5F3EE',
        'bone-white': '#F3F3F4',
        'hairline': '#222226',
        'hairline-light': '#2E2E34',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      letterSpacing: {
        display: '-0.04em',
        headline: '-0.035em',
        'headline-sm': '-0.015em',
        label: '0.14em',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
