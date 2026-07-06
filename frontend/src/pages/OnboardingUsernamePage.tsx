import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SplitLayout from '../components/auth/SplitLayout'
import RightPanel from '../components/auth/RightPanel'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'
import { useAuth } from '../contexts/AuthContext'
import { checkUsername } from '../services/auth'

export default function OnboardingUsernamePage() {
  const navigate = useNavigate()
  const { completeUsername } = useAuth()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<{ available: boolean; error?: string } | null>(null)

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailability(null)
      setChecking(false)
      return
    }

    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsername(username)
        setAvailability(result)
      } catch {
        setAvailability({ available: false, error: 'Failed to check availability' })
      } finally {
        setChecking(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    if (!availability?.available) {
      setError(availability?.error || 'Username is not available')
      return
    }

    setLoading(true)
    try {
      await completeUsername(username.trim())
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndicator = () => {
    if (!username || username.length < 3) return null
    if (checking) return <span style={{ color: '#6B7280', fontSize: 13 }}>Checking...</span>
    if (availability?.available) {
      return (
        <span style={{ color: '#059669', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="7" fill="#059669" />
            <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Available
        </span>
      )
    }
    return (
      <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="7" fill="#dc2626" />
          <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {availability?.error || 'Already taken'}
      </span>
    )
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
            STEP 2 OF 2
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
            PICK A
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
            USERNAME.
          </h1>

          {/* Username form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <PixelInput
                label="Username"
                placeholder="kasun_perera"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                style={{ marginBottom: 8 }}
              />
              <div style={{ minHeight: 20, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {getStatusIndicator()}
              </div>
            </div>

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
              disabled={loading || !username || !availability?.available}
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
