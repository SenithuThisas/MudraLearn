import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';
import PixelButton from '../components/auth/PixelButton'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // ProtectedRoute guarantees a resolved, authenticated user before this
  // page renders, so no loading state or redirect is needed here. This guard
  // is purely a type-narrowing safety net.
  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Simple header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '2px solid #000000',
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 12,
            color: '#6D28D9',
            textDecoration: 'none',
          }}
        >
          MUDRALEARN
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: '#14213D',
              fontWeight: 600,
            }}
          >
            {user.first_name} {user.last_name}{user.username ? ` (@${user.username})` : ''}
          </span>
          <PixelButton variant="secondary" onClick={handleSignOut}>
            Sign Out
          </PixelButton>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '80px 40px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 24,
            color: '#14213D',
            marginBottom: 16,
          }}
        >
          WELCOME,
        </h1>
        <h1
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 24,
            color: '#6D28D9',
            marginBottom: 24,
          }}
        >
          {user.first_name?.toUpperCase() || 'SIGNER'}!
        </h1>

        <p
          style={{
            fontSize: 16,
            color: '#6B7280',
            maxWidth: 500,
            margin: '0 auto 48px',
            lineHeight: 1.7,
          }}
        >
          Your account is ready. Start learning Sinhala Sign Language with interactive
          AI-powered lessons.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <PixelButton variant="primary" onClick={() => navigate('/practice')}>
            START LEARNING →
          </PixelButton>
          <PixelButton variant="secondary" onClick={() => navigate('/dictionary')}>
            BROWSE DICTIONARY
          </PixelButton>
        </div>
      </main>
    </div>
  )
}
