/**
 * MudraLearn design tokens — pixel / neo-brutalist auth system.
 *
 * Palette sampled from the auth reference screenshots. Everything the new auth
 * UI needs lives here so components carry no hardcoded hex. Values are also
 * mirrored as CSS variables in index.css for the legacy inline-styled pages
 * that have not been migrated yet.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        paper: '#F7F6F3',       // off-white page background
        ink: '#14213D',         // borders, shadows, headings, body-on-light
        navy: '#1B2340',        // right panel + welcome full-bleed background
        primary: {
          DEFAULT: '#6D28D9',   // buttons, progress fill, logo tile
          dark: '#5B21B6',
        },
        // Sticker accents — floating badges only
        sticker: {
          yellow: '#FBE24A',
          pink: '#F9A8C4',
          mint: '#A8F0CE',
        },
        // Feedback
        danger: '#DC2626',
        muted: '#6B7280',
        hairline: '#E5E7EB',
      },
      fontFamily: {
        pixel: ["'Press Start 2P'", 'monospace'],
        body: ["'Inter'", 'sans-serif'],
      },
      spacing: {
        // Collapsed sidebar rail width — icon + padding only.
        18: '4.5rem',
      },
      boxShadow: {
        // Hard offset, no blur, navy — the signature element.
        'hard-sm': '2px 2px 0 #14213D',
        hard: '4px 4px 0 #14213D',
        'hard-lg': '6px 6px 0 #14213D',
      },
    },
  },
  plugins: [],
}
