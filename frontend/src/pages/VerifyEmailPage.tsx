import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelButton from '../components/auth/PixelButton'
import { verifyOTP, requestOTP, authErrorMessage } from '../services/auth'

const DIGITS = 6
const RESEND_COOLDOWN = 30

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as any)?.email || 'user@email.com' // fallback for direct visits in dev

  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true })
    }
  }, [email, navigate])

  // Countdown timer for resend (internal state logic kept, UI hides countdown based on design)
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleDigitChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    setError('')

    // Auto-advance to next input
    if (value && index < DIGITS - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS)
    const newDigits = [...digits]
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i]
    }
    setDigits(newDigits)
    setError('')
    const nextFocus = Math.min(paste.length, DIGITS - 1)
    inputRefs.current[nextFocus]?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const otp = digits.join('')
    if (otp.length !== DIGITS) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      // Proves email ownership only — no account or session exists yet. The
      // signup_token is exchanged for both at the end of the onboarding wizard.
      const { signup_token: signupToken } = await verifyOTP(email, otp)
      navigate('/onboarding/password', { replace: true, state: { signupToken, email } })
    } catch (err: any) {
      setError(authErrorMessage(err, 'Invalid code. Please try again.'))
      setDigits(Array(DIGITS).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(RESEND_COOLDOWN)
    setError('')

    try {
      await requestOTP(email)
    } catch (err) {
      setError(authErrorMessage(err, 'Failed to resend code. Please try again.'))
    }
  }

  return (
    <SplitLayout
      left={
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 64px',
            maxWidth: 520,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 11,
              color: '#000000',
              textDecoration: 'none',
              marginBottom: 80,
              display: 'inline-block',
              letterSpacing: 1,
            }}
          >
            MudraLearn
          </Link>

          {/* Badge */}
          <div style={{ display: 'flex', marginBottom: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: '#C6F6D5',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="square">
                <path d="M4 4h16v16H4z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#000000', letterSpacing: 0.5, marginTop: 1 }}>
                CHECK YOUR EMAIL
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: '#152238',
              lineHeight: 1.4,
              margin: '0 0 20px 0',
            }}
          >
            Enter The
            <br />
            Code.
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: '#4B5563',
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            We sent a 6-digit code to <strong style={{ color: '#6D28D9' }}>{email}</strong>. It expires in 10 minutes.
          </p>

          {/* OTP input form */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 24,
                justifyContent: 'space-between',
              }}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  aria-label={`Digit ${i + 1}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1.1',
                    textAlign: 'center',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    border: `2px solid ${error ? '#ef4444' : '#000000'}`,
                    boxShadow: '4px 4px 0px #000000',
                    borderRadius: 0,
                    background: '#ffffff',
                    color: '#152238',
                    outline: 'none',
                    transition: 'box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '2px 2px 0px #000000';
                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = '4px 4px 0px #000000';
                    e.currentTarget.style.transform = 'translate(0, 0)';
                  }}
                />
              ))}
            </div>

            {error && (
              <p
                aria-live="polite"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#ef4444',
                  marginBottom: 16,
                  marginTop: -8,
                }}
              >
                {error}
              </p>
            )}

            <PixelButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || digits.join('').length !== DIGITS}
            >
              {loading ? 'VERIFYING...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  VERIFY CODE
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </PixelButton>
          </form>

          {/* Links */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <button
              onClick={handleResend}
              type="button"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: canResend ? '#6D28D9' : '#9CA3AF',
                background: 'none',
                border: 'none',
                cursor: canResend ? 'pointer' : 'default',
                textDecoration: canResend ? 'underline' : 'none',
                padding: 0,
              }}
            >
              Resend Code
            </button>
            <Link
              to="/signin"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#6D28D9',
                textDecoration: 'underline',
              }}
            >
              Change Email
            </Link>
          </div>
        </div>
      }
      right={<RightPanel variant="verify" />}
    />
  )
}
