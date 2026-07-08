import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'

export default function OnboardingNamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Carried from the OTP verification step. No account exists yet — names are
  // collected locally and only written at /complete-signup on the final step.
  const { signupToken, email } = (location.state as any) ?? {}
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  // Direct visit or expired wizard state — restart the flow.
  useEffect(() => {
    if (!signupToken) {
      navigate('/signin', { replace: true })
    }
  }, [signupToken, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first and last name are required')
      return
    }

    navigate('/onboarding/username', {
      replace: true,
      state: { signupToken, email, firstName: firstName.trim(), lastName: lastName.trim() },
    })
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
            margin: '0 auto',
            width: '100%',
          }}
        >
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

          {/* Step indicator */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: '#6B7280',
              fontWeight: 600,
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            STEP 1 OF 2
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 22,
              color: '#14213D',
              lineHeight: 1.5,
              margin: '0 0 12px 0',
            }}
          >
            WHAT'S YOUR
          </h1>
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 22,
              color: '#6D28D9',
              lineHeight: 1.5,
              margin: '0 0 24px 0',
            }}
          >
            NAME?
          </h1>

          {email && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#6B7280',
                marginBottom: 24,
              }}
            >
              Signing up as <strong style={{ color: '#14213D' }}>{email}</strong>
            </p>
          )}

          {/* Name form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PixelInput
              label="First Name"
              placeholder="Kasun"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <PixelInput
              label="Last Name"
              placeholder="Perera"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              disabled={!firstName || !lastName}
            >
              Continue
            </PixelButton>
          </form>
        </div>
      }
      right={<RightPanel />}
    />
  )
}
