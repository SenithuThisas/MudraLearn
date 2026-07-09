import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import StepProgress from '../components/auth/StepProgress'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { usePasswordStrength, type PasswordChecks } from '../hooks/usePasswordStrength'

// Strength meter ramp — four segments filled up to `score`, coloured by strength.
const METER_COLORS = ['#DC2626', '#F59E0B', '#FCD34D', '#10B981']

const REQUIREMENTS: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'One uppercase' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'One special character' },
]

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#6B7280' }}
    >
      {shown ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

function CheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          border: '2px solid #14213D',
          background: met ? '#6D28D9' : '#ffffff',
          flexShrink: 0,
        }}
      >
        {met && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-6" />
          </svg>
        )}
      </span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#14213D' }}>{label}</span>
    </div>
  )
}

export default function OnboardingPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Carried from OTP verification. No account exists yet — the password is
  // collected locally and only written at /complete-signup on the final step.
  const { signupToken, email } = (location.state as { signupToken?: string; email?: string }) ?? {}

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const strength = usePasswordStrength(password)
  const matches = confirm.length > 0 && password === confirm
  const canContinue = strength.allMet && matches

  // Direct visit or expired wizard state — restart the flow.
  useEffect(() => {
    if (!signupToken) {
      navigate('/signin', { replace: true })
    }
  }, [signupToken, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!strength.allMet) {
      setError('Please meet all password requirements')
      return
    }
    if (!matches) {
      setError('Passwords do not match')
      return
    }
    navigate('/onboarding/name', { replace: true, state: { signupToken, email, password } })
  }

  return (
    <AuthSplitLayout>
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
        className="auth-form-col"
      >
        <StepProgress current={1} total={4} />

        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 26, color: '#14213D', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          SECURE YOUR
          <br />
          ACCOUNT.
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
          Create a password to keep your MudraLearn account safe.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <PixelInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              trailing={<EyeToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
            />

            {/* Strength meter — announced politely */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      height: 6,
                      background: i < strength.score ? METER_COLORS[strength.score - 1] : '#E5E7EB',
                      border: '1px solid #14213D',
                    }}
                  />
                ))}
              </div>
              <span aria-live="polite" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#14213D', minWidth: 56, textAlign: 'right' }}>
                {password ? strength.label.toUpperCase() : ''}
              </span>
            </div>

            {/* Requirement checklist — 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 16 }}>
              {REQUIREMENTS.map((r) => (
                <CheckItem key={r.key} met={strength.checks[r.key]} label={r.label} />
              ))}
            </div>
          </div>

          <div>
            <PixelInput
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <div aria-live="polite" style={{ minHeight: 28, marginTop: 8 }}>
              {matches && (
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
                  ✓ PASSWORDS MATCH
                </span>
              )}
            </div>
          </div>

          {error && (
            <p aria-live="polite" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#DC2626', margin: 0 }}>
              {error}
            </p>
          )}

          <PixelButton type="submit" variant="primary" fullWidth disabled={!canContinue}>
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
