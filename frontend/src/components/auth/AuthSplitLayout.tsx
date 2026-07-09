import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SplitLayout from './SplitLayout'
import RightPanel from './RightPanel'

/** Purple pixel logo tile — a small OK-hand glyph on the primary square. */
function LogoTile() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        background: '#6D28D9',
        border: '2px solid #14213D',
        boxShadow: '2px 2px 0px #14213D',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V8a2 2 0 0 0-4 0v5M14 11V6a2 2 0 0 0-4 0v5M10 11V8a2 2 0 0 0-4 0v3a8 8 0 0 0 16 0v-3" />
      </svg>
    </span>
  )
}

/**
 * Standard header shared by every split auth screen: logo tile + MUDRALEARN
 * wordmark on the left, HELP / EXIT on the right.
 */
function AuthHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '2px solid #14213D',
        background: '#ffffff',
      }}
    >
      <Link
        to="/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
      >
        <LogoTile />
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', letterSpacing: 1 }}>
          MUDRALEARN
        </span>
      </Link>
      <nav style={{ display: 'flex', gap: 28 }}>
        <Link to="/" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#14213D', textDecoration: 'none', letterSpacing: 1 }}>
          HELP
        </Link>
        <Link to="/" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#14213D', textDecoration: 'none', letterSpacing: 1 }}>
          EXIT
        </Link>
      </nav>
    </header>
  )
}

/**
 * The single layout for all split pre-dashboard screens (password, first, last,
 * username). Standard header on top, the form column on the left, the navy
 * illustration panel on the right, and a dynamic-year footer. Below `lg` the
 * navy panel stacks below the form (handled by SplitLayout's media query).
 */
export default function AuthSplitLayout({
  children,
  rightVariant = 'secure',
}: {
  children: ReactNode
  rightVariant?: 'signin' | 'verify' | 'onboarding' | 'secure'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F6F3' }}>
      <SplitLayout header={<AuthHeader />} left={children} right={<RightPanel variant={rightVariant} />} />
      <footer
        style={{
          padding: '16px 32px',
          borderTop: '2px solid #14213D',
          background: '#ffffff',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: '#6B7280',
          letterSpacing: 1,
        }}
      >
        MUDRALEARN © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
