/**
 * RightPanel — dark illustration panel shared by every split auth page.
 *
 * ALL variants use the same layout template:
 *   - Same hand illustration card (320×280) at center
 *   - Same three badges (384 Signs top-left, Real-Time AI right, Free To Use
 *     bottom-left) with hard 6px offset shadow, no rotation
 *   - Same vertical grid-line texture background
 *   - Dot-cluster artifact removed
 *   - 'verify' no longer has the off-screen pink bleed or inconsistent badge styles
 *
 * The `variant` prop is kept for potential future specialisation but currently
 * only drives the 'onboarding' badge colour swap — all others render identically.
 */
export default function RightPanel({ variant = 'signin' }: { variant?: 'signin' | 'verify' | 'onboarding' | 'secure' }) {
  // Onboarding accent: swap top-left badge background to pastel-mint for variety.
  const topLeftBg  = variant === 'onboarding' ? '#C3F5E8' : '#FFF3B0'
  const bottomLeftBg = variant === 'onboarding' ? '#FFF3B0' : '#FFD6E0'

  return (
    <>
      {/* Faint vertical grid lines — background texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.06) 79px, rgba(255,255,255,0.06) 80px)',
          pointerEvents: 'none',
        }}
      />

      {/* — dot-cluster artifact intentionally removed — */}

      {/* Centered illustration card + overlapping badges */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* White illustration card */}
        <div
          style={{
            width: 320,
            height: 280,
            background: '#ffffff',
            border: '2px solid #1a2744',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          {/* Heart Hands Illustration */}
          <img
            src="/media/auth-illustration.jpg"
            alt="Two hands forming a heart shape"
            style={{ width: '260px', height: '220px', objectFit: 'contain' }}
          />
        </div>

        {/* ── Badge: top-left (384 Signs) ── */}
        {/* Same hard 6px shadow, no rotation — consistent across ALL variants */}
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: -24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            background: topLeftBg,
            border: '2px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {/* Wave hand icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 11V8a2 2 0 0 0-4 0v5M14 11V6a2 2 0 0 0-4 0v5M10 11V8a2 2 0 0 0-4 0v3a8 8 0 0 0 16 0v-3" />
          </svg>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#1a1a1a', letterSpacing: 0.5 }}>
            384 SIGNS
          </span>
        </div>

        {/* ── Badge: right (Real-Time AI) ── */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: -104,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            background: '#C3F5E8',
            border: '2px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {/* AI/brain icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#1a1a1a', letterSpacing: 0.5 }}>
            REAL-TIME AI
          </span>
        </div>

        {/* ── Badge: bottom-left (Free To Use) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: -14,
            left: -24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            background: bottomLeftBg,
            border: '2px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {/* Heart icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#1a1a1a', letterSpacing: 0.5 }}>
            FREE TO USE
          </span>
        </div>
      </div>
    </>
  )
}
