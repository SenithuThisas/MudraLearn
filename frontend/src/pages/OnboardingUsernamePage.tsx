import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import StepProgress from '../components/auth/StepProgress'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { useAuth } from '../contexts/AuthContext'
import { authErrorMessage } from '../services/auth'
import { useUsernameAvailability } from '../hooks/useUsernameAvailability'

/**
 * Signup wizard step 4/4 — username. This is the single write: on submit it
 * POSTs the whole accumulated payload (password + names + username) to
 * /complete-signup. Password now arrives via router state (collected at step 1),
 * so this page no longer collects it.
 *
 * The authenticated branch (no signupToken — e.g. Google, created before a
 * username exists) only sets the username on the already-signed-in user.
 */
export default function OnboardingUsernamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, completeSignup, completeUsername } = useAuth()
  const { signupToken, email, password, firstName, lastName } =
    (location.state as {
      signupToken?: string
      email?: string
      password?: string
      firstName?: string
      lastName?: string
    }) ?? {}
  const isSignup = Boolean(signupToken)

  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const availability = useUsernameAvailability(username)

  // Signup branch needs the full carried state; authenticated branch needs a user.
  useEffect(() => {
    if (isSignup) {
      if (!password || !firstName || !lastName) navigate('/signin', { replace: true })
    } else if (!authLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isSignup, password, firstName, lastName, authLoading, user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (availability.status !== 'available') {
      setError(availability.error || 'Please choose an available username')
      return
    }

    setLoading(true)
    try {
      if (isSignup) {
        await completeSignup(signupToken!, password!, firstName!, lastName!, username.trim())
      } else {
        await completeUsername(username.trim())
      }
      navigate('/welcome', { replace: true, state: { username: username.trim().toLowerCase(), firstName } })
    } catch (err) {
      setError(authErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const renderStatus = () => {
    if (availability.status === 'checking') {
      return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280' }}>Checking…</span>
    }
    if (availability.status === 'available') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: '#A8F0CE',
            border: '2px solid #14213D',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#14213D',
            letterSpacing: 0.5,
          }}
        >
          ✓ USERNAME AVAILABLE!
        </span>
      )
    }
    if (availability.status === 'taken') {
      return (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
          {availability.error || 'Already taken'}
        </span>
      )
    }
    return null
  }

  return (
    <AuthSplitLayout>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 64px', maxWidth: 520, margin: '0 auto', width: '100%' }}
      >
        <StepProgress current={4} total={4} />

        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 26, color: '#14213D', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          PICK YOUR
          <br />
          USERNAME.
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
          Your unique identity on MudraLearn. You can change this later.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PixelInput
            aria-label="Username"
            leading="@"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            autoComplete="off"
            autoFocus
            minLength={3}
            maxLength={20}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 24 }}>
            <div aria-live="polite">{renderStatus()}</div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
              3–20 characters. Letters, numbers, and underscores only.
            </span>
          </div>

          {error && (
            <p aria-live="polite" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#DC2626', margin: 0 }}>
              {error}
            </p>
          )}

          <PixelButton type="submit" variant="primary" fullWidth disabled={loading || availability.status !== 'available'}>
            {loading ? 'CREATING ACCOUNT…' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                CREATE MY ACCOUNT
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </PixelButton>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link
            to="/onboarding/last"
            state={{ signupToken, email, password, firstName, lastName }}
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#6B7280', textDecoration: 'none', letterSpacing: 0.5 }}
          >
            BACK TO STEP 3
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
