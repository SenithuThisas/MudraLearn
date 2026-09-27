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
          {/* Hand illustration — cartoon style with black outlines, blue + yellow */}
          <svg
            width="260"
            height="220"
            viewBox="0 0 260 220"
            fill="none"
            aria-label="Two hands making an OK/connect sign language gesture"
          >
            {/* ── Blue hand (left) ── */}
            {/* Wrist */}
            <rect x="18" y="150" width="52" height="36" rx="4" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Palm */}
            <rect x="14" y="90" width="60" height="68" rx="6" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Thumb */}
            <rect x="-2" y="100" width="20" height="38" rx="8" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Index finger — curved into circle */}
            <ellipse cx="46" cy="62" rx="12" ry="30" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Middle finger */}
            <ellipse cx="64" cy="54" rx="11" ry="34" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Ring finger */}
            <ellipse cx="80" cy="64" rx="10" ry="28" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* Pinky */}
            <ellipse cx="93" cy="78" rx="8" ry="20" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            {/* OK circle — index meets thumb */}
            <circle cx="22" cy="88" r="14" fill="#7CB9E8" stroke="#1a1a1a" strokeWidth="3" />
            <circle cx="22" cy="88" r="7" fill="#ffffff" />

            {/* ── Yellow hand (right) ── */}
            {/* Wrist */}
            <rect x="188" y="150" width="52" height="36" rx="4" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Palm */}
            <rect x="184" y="90" width="60" height="68" rx="6" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Thumb */}
            <rect x="240" y="100" width="20" height="38" rx="8" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Index */}
            <ellipse cx="214" cy="62" rx="12" ry="30" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Middle */}
            <ellipse cx="196" cy="54" rx="11" ry="34" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Ring */}
            <ellipse cx="180" cy="64" rx="10" ry="28" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* Pinky */}
            <ellipse cx="167" cy="78" rx="8" ry="20" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            {/* OK circle */}
            <circle cx="238" cy="88" r="14" fill="#F5D06B" stroke="#1a1a1a" strokeWidth="3" />
            <circle cx="238" cy="88" r="7" fill="#ffffff" />

            {/* Connection point — fingertips touching */}
            <circle cx="130" cy="105" r="8" fill="#1a1a1a" opacity="0.12" />
          </svg>
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
