import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { checkEmail, requestOTP, authErrorMessage } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'

export default function SignInPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Already signed in? Skip the login form and go straight to the dashboard.
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      // Branch on whether the email already has an account. Existing users log
      // in with their password (no OTP); new emails go through the OTP signup.
      const { registered } = await checkEmail(email)
      if (registered) {
        navigate('/login', { state: { email } })
      } else {
        await requestOTP(email)
        navigate('/verify-email', { state: { email } })
      }
    } catch (err: any) {
      setError(authErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // In production this would redirect to Google OAuth.
    // For development, we simulate with a message.
    setError('Google OAuth requires client ID configuration. Use email sign-in instead.')
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
            maxWidth: 480,
            width: '100%',
          }}
          className="signin-left-inner"
        >
          {/* Logo wordmark — black, pixel font, top-left */}
          <Link
            to="/"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 11,
              color: '#000000',
              textDecoration: 'none',
              marginBottom: 64,
              display: 'inline-block',
              letterSpacing: 1,
            }}
          >
            MudraLearn
          </Link>

          {/* Heading — both lines dark navy, tight line-height */}
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              color: '#14213D',
              lineHeight: 1.6,
              margin: '0 0 16px 0',
            }}
          >
            WELCOME.
            <br />
            SIGN IN.
          </h1>

          {/* Subheading — exact copy from reference */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: '#6B7280',
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            Continue your Sinhala Sign Language journey.
          </p>

          {/* Google button */}
          <PixelButton
            variant="secondary"
            fullWidth
            onClick={handleGoogleSignIn}
            style={{ marginBottom: 28 }}
          >
            {/* Google G logo SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            CONTINUE WITH GOOGLE
          </PixelButton>

          {/* OR divider — pixel font */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, borderTop: '2px solid #e5e7eb' }} />
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: '#6B7280',
              }}
            >
              OR
            </span>
            <div style={{ flex: 1, borderTop: '2px solid #e5e7eb' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PixelInput
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#dc2626',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <PixelButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || !email}
            >
              {loading ? 'SENDING...' : 'CONTINUE WITH EMAIL'}
              {/* Right arrow → */}
              {!loading && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ marginLeft: 8, flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </PixelButton>
          </form>

          {/* Legal text — sentence paragraph, bottom of column */}
          <p
            style={{
              marginTop: 'auto',
              paddingTop: 40,
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: '#6B7280',
              lineHeight: 1.6,
            }}
          >
            By continuing, you agree to MudraLearn's{' '}
            <a
              href="#"
              style={{ color: '#6B7280', textDecoration: 'underline' }}
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a
              href="#"
              style={{ color: '#6B7280', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>
            .
          </p>

          {/* Responsive tweaks */}
          <style>{`
            @media (max-width: 900px) {
              .signin-left-inner {
                padding: 40px 32px !important;
                max-width: 100% !important;
              }
            }
          `}</style>
        </div>
      }
      right={<RightPanel />}
    />
  )
}

