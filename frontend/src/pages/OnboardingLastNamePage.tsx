import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import StepProgress from '../components/auth/StepProgress'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'

/**
 * Signup wizard step 3/4 — last name. Standardised on the split layout (the
 * reference screenshot's centred column is drift). Carries the accumulated
 * signup state forward to the final username step.
 */
export default function OnboardingLastNamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { signupToken?: string; password?: string; firstName?: string }) ?? {}
  const { signupToken, password, firstName } = state

  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!signupToken || !password || !firstName) {
      navigate('/signin', { replace: true })
    }
  }, [signupToken, password, firstName, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!lastName.trim()) {
      setError('Please enter your last name')
      return
    }
    navigate('/onboarding/username', {
      replace: true,
      state: { ...state, lastName: lastName.trim() },
    })
  }

  return (
    <AuthSplitLayout>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 64px', maxWidth: 520, margin: '0 auto', width: '100%' }}
      >
        <StepProgress current={3} total={4} />

        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 26, color: '#14213D', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          AND YOUR
          <br />
          LAST NAME?
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
          Almost there — just one more step after this.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PixelInput
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            autoFocus
            error={error || undefined}
          />

          <PixelButton type="submit" variant="primary" fullWidth disabled={!lastName.trim()}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              CONTINUE
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </PixelButton>
        </form>
      </div>
    </AuthSplitLayout>
  )
}
