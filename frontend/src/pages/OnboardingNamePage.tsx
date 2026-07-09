import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import StepProgress from '../components/auth/StepProgress'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'

/**
 * Signup wizard step 2/4 — first name only. Password (step 1) is carried in
 * router state and forwarded, unchanged, to the last-name step. No account
 * exists yet; everything is written once at the final username step.
 */
export default function OnboardingNamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { signupToken?: string; email?: string; password?: string }) ?? {}
  const { signupToken, password } = state

  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')

  // Direct visit or lost wizard state (e.g. refresh) — restart the flow.
  useEffect(() => {
    if (!signupToken || !password) {
      navigate('/signin', { replace: true })
    }
  }, [signupToken, password, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) {
      setError('Please enter your first name')
      return
    }
    navigate('/onboarding/last', {
      replace: true,
      state: { ...state, firstName: firstName.trim() },
    })
  }

  return (
    <AuthSplitLayout>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 64px', maxWidth: 520, margin: '0 auto', width: '100%' }}
      >
        <StepProgress current={2} total={4} />

        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 26, color: '#14213D', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          WHAT'S YOUR
          <br />
          FIRST NAME?
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
          This is how you'll appear to the MudraLearn community.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PixelInput
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            autoFocus
            error={error || undefined}
          />

          <PixelButton type="submit" variant="primary" fullWidth disabled={!firstName.trim()}>
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
