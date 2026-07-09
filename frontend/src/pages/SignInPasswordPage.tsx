import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { authErrorMessage } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'

export default function SignInPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, signInWithPassword } = useAuth()
  // Carried from the entry page after /check-email confirmed this email exists.
  const email = (location.state as any)?.email as string | undefined
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Direct visit with no email in state → restart at the entry page.
  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true })
    }
  }, [email, navigate])

  // Already signed in? Skip straight to the dashboard.
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      await signInWithPassword(email!, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      // Backend messages are already specific: 401 "Incorrect email or
      // password", 423 lockout "Account temporarily locked…". authErrorMessage
      // surfaces those and swaps a generic line in for network/5xx failures.
      setError(authErrorMessage(err, 'Incorrect email or password'))
      setPassword('')
    } finally {
      setLoading(false)
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
            maxWidth: 480,
            width: '100%',
          }}
          className="signin-left-inner"
        >
          {/* Logo wordmark */}
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

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              color: '#14213D',
              lineHeight: 1.6,
              margin: '0 0 16px 0',
            }}
          >
            WELCOME
            <br />
            BACK.
          </h1>

          {email && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                color: '#6B7280',
                marginBottom: 40,
                lineHeight: 1.6,
              }}
            >
              Signing in as <strong style={{ color: '#14213D' }}>{email}</strong>
            </p>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PixelInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />

            {error && (
              <p
                aria-live="polite"
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
              disabled={loading || !password}
            >
              {loading ? 'SIGNING IN...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  SIGN IN
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </PixelButton>
          </form>

          {/* Back to email entry */}
          <div style={{ marginTop: 24 }}>
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
              Use a different email
            </Link>
          </div>

          {/* Responsive tweaks (match SignInPage) */}
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
