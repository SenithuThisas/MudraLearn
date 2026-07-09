import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PixelButton from '../components/auth/PixelButton'

const REDIRECT_MS = 2500

/** A rotated sticker badge floating on the navy field. */
function Sticker({
  label,
  bg,
  style,
  icon,
}: {
  label: string
  bg: string
  style: React.CSSProperties
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: bg,
        border: '2px solid #14213D',
        boxShadow: '4px 4px 0px #14213D',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 14,
        color: '#14213D',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ display: 'flex' }}>{icon}</span>
      {label}
    </div>
  )
}

/**
 * Signup completion screen. Auto-redirects to the dashboard after 2.5s, but the
 * timer is cancelled if a keyboard/screen-reader user tabs into the page (they
 * likely haven't finished reading) or on unmount. Under prefers-reduced-motion
 * the entrance animation is skipped but the timer is kept.
 */
export default function WelcomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, firstName } = (location.state as { username?: string; firstName?: string }) ?? {}

  const timerRef = useRef<number | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  const goToDashboard = () => navigate('/dashboard', { replace: true })

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    timerRef.current = window.setTimeout(goToDashboard, REDIRECT_MS)
    const cancel = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    // A keyboard/AT user entering the page hasn't finished reading in 2.5s.
    window.addEventListener('keydown', cancel, { once: true })

    return () => {
      cancel()
      window.removeEventListener('keydown', cancel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1B2340',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 24,
        fontFamily: "'Inter', sans-serif",
        animation: reduceMotion ? undefined : 'welcome-in 320ms ease-out',
      }}
    >
      <Sticker
        label="384 Signs Await"
        bg="#FBE24A"
        style={{ top: '14%', left: '12%', transform: 'rotate(-4deg)' }}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        }
      />
      <Sticker
        label="Level 1 Unlocked"
        bg="#F9A8C4"
        style={{ top: '42%', right: '10%', transform: 'rotate(3deg)' }}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        }
      />
      <Sticker
        label="Your Streak Starts Now"
        bg="#A8F0CE"
        style={{ bottom: '16%', right: '16%', transform: 'rotate(-3deg)' }}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        }
      />

      {/* Confetti tile */}
      <div
        style={{
          width: 88,
          height: 88,
          background: '#6D28D9',
          border: '3px solid #ffffff',
          boxShadow: '6px 6px 0px rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5.8 11.3 2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24.75a3 3 0 0 0-1.83 4.14M17 12l1.5 1.5M13 5l3 3M9 8l2.5 2.5" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(24px, 4vw, 40px)',
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: '0 0 20px 0',
        }}
      >
        YOU'RE IN,
        <br />
        @{(username ?? 'friend').toUpperCase()}!
      </h1>

      <p style={{ fontSize: 16, color: '#B6BCD0', textAlign: 'center', maxWidth: 460, lineHeight: 1.6, margin: '0 0 40px 0' }}>
        {firstName ? `Nice to meet you, ${firstName}. ` : ''}Your MudraLearn journey starts now. Let's learn your first sign.
      </p>

      <PixelButton variant="primary" onClick={goToDashboard}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          GO TO MY DASHBOARD
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </PixelButton>

      <p style={{ position: 'absolute', bottom: 24, fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#6B7280', letterSpacing: 1 }}>
        MUDRALEARN © {new Date().getFullYear()} — GAMIFIED SIGN LANGUAGE
      </p>

      <style>{`@keyframes welcome-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
