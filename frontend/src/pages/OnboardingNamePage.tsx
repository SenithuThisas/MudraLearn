import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { useAuth } from '../contexts/AuthContext'

export default function OnboardingNamePage() {
  const navigate = useNavigate()
  const { user, completeProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first and last name are required')
      return
    }

    setLoading(true)
    try {
      await completeProfile(firstName.trim(), lastName.trim())
      navigate('/onboarding/username', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(msg)
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

          {user?.email && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#6B7280',
                marginBottom: 24,
              }}
            >
              Signed in as <strong style={{ color: '#14213D' }}>{user.email}</strong>
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
              disabled={loading || !firstName || !lastName}
            >
              {loading ? 'SAVING...' : 'Continue'}
            </PixelButton>
          </form>
        </div>
      }
      right={<RightPanel />}
    />
  )
}
