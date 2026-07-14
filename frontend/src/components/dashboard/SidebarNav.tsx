import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" />
    </svg>
  ),
  practice: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 12V6a2 2 0 0 1 4 0v5M12 11V5a2 2 0 0 1 4 0v6M16 12V8a2 2 0 0 1 4 0v6a8 8 0 0 1-16 0v-2l-1.5-2A1.5 1.5 0 0 1 5 11.5" />
    </svg>
  ),
  dictionary: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h13a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z" /><path d="M4 4v13a3 3 0 0 1 3-3h13" />
    </svg>
  ),
  translate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  progress: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
}

interface NavItem {
  label: string
  path?: string // no path = not wired to a real route yet, rendered as inactive
  icon: keyof typeof ICONS
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Practice', path: '/practice', icon: 'practice' },
  { label: 'Dictionary', path: '/dictionary', icon: 'dictionary' },
  { label: 'Live Translation', path: '/translate', icon: 'translate' },
  { label: 'Progress', icon: 'progress' },
]

export default function SidebarNav() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-top">
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '20px 20px 24px' }}>
          <span
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#6D28D9', border: '2px solid #ffffff',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V8a2 2 0 0 0-4 0v5M14 11V6a2 2 0 0 0-4 0v5M10 11V8a2 2 0 0 0-4 0v3a8 8 0 0 0 16 0v-3" />
            </svg>
          </span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: '#ffffff', letterSpacing: 1 }}>
            MUDRALEARN
          </span>
        </Link>

        <nav className="dashboard-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = item.path === pathname
            const content = (
              <>
                <span style={{ display: 'flex', color: active ? '#14213D' : '#ffffff' }}>{ICONS[item.icon]}</span>
                <span>{item.label}</span>
              </>
            )
            const sharedStyle: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 20px', margin: '0 12px', textDecoration: 'none',
              fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              color: active ? '#14213D' : '#ffffff',
              background: active ? '#A8F0CE' : 'transparent',
              border: active ? '2px solid #14213D' : '2px solid transparent',
              cursor: item.path ? 'pointer' : 'default',
              opacity: item.path ? 1 : 0.5,
            }
            return item.path ? (
              <Link key={item.label} to={item.path} style={sharedStyle}>{content}</Link>
            ) : (
              <span key={item.label} style={sharedStyle} title="Coming soon">{content}</span>
            )
          })}
        </nav>
      </div>

      <div className="dashboard-sidebar-footer">
        <span
          style={{
            width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#FBE24A', border: '2px solid #14213D', color: '#14213D',
            fontFamily: "'Press Start 2P', monospace", fontSize: 10,
          }}
        >
          {(user?.first_name?.[0] ?? '?').toUpperCase()}{(user?.last_name?.[0] ?? '').toUpperCase()}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontFamily: "'Inter', sans-serif" }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.first_name} {user?.last_name}
          </span>
          {user?.username && (
            <span style={{ display: 'block', fontSize: 12, color: '#9CA3AF' }}>@{user.username}</span>
          )}
        </span>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '2px solid #ffffff', color: '#ffffff', cursor: 'pointer',
          }}
        >
          {ICONS.logout}
        </button>
      </div>

      <style>{`
        .dashboard-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #1B2340;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .dashboard-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dashboard-sidebar-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-top: 2px solid rgba(255,255,255,0.15);
        }
        @media (max-width: 900px) {
          .dashboard-sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
          }
          .dashboard-sidebar-top {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .dashboard-sidebar-nav {
            flex-direction: row;
            gap: 4px;
          }
          .dashboard-sidebar-nav span:not(:first-child) {
            display: none;
          }
          .dashboard-sidebar-footer {
            border-top: none;
            padding: 8px;
          }
          .dashboard-sidebar-footer > span:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </aside>
  )
}
