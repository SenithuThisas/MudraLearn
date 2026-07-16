import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NavItem from './NavItem'
import SidebarUserSection from './SidebarUserSection'

const COLLAPSE_STORAGE_KEY = 'mudralearn-sidebar-collapsed'

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" />
    </svg>
  ),
  practice: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M8 12V6a2 2 0 0 1 4 0v5M12 11V5a2 2 0 0 1 4 0v6M16 12V8a2 2 0 0 1 4 0v6a8 8 0 0 1-16 0v-2l-1.5-2A1.5 1.5 0 0 1 5 11.5" />
    </svg>
  ),
  dictionary: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 4h13a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z" /><path d="M4 4v13a3 3 0 0 1 3-3h13" />
    </svg>
  ),
  translate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  progress: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
  collapse: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
}

interface NavItemData {
  label: string
  path?: string // no path = not wired to a real route yet, rendered as inactive
  icon: keyof typeof ICONS
}

const NAV_ITEMS: NavItemData[] = [
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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed))
    } catch {
      // storage may be unavailable (e.g. private browsing) — collapse still works for the session
    }
  }, [collapsed])

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <aside
      className={[
        'dashboard-sidebar',
        collapsed && 'sidebar-collapsed',
        collapsed ? 'min-[901px]:w-18' : 'min-[901px]:w-60',
      ].filter(Boolean).join(' ')}
    >
      <div className="dashboard-sidebar-top">
        <div className="dashboard-sidebar-brand-row">
          <Link to="/dashboard" className="dashboard-sidebar-logo-link">
            <span
              style={{
                width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#6D28D9', border: '2px solid #ffffff',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V8a2 2 0 0 0-4 0v5M14 11V6a2 2 0 0 0-4 0v5M10 11V8a2 2 0 0 0-4 0v3a8 8 0 0 0 16 0v-3" />
              </svg>
            </span>
            <span className="dashboard-sidebar-logo-text">MUDRALEARN</span>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className="sidebar-collapse-toggle"
          >
            <span className={`sidebar-collapse-toggle-icon${collapsed ? ' sidebar-collapse-toggle-icon--collapsed' : ''}`}>
              {ICONS.collapse}
            </span>
          </button>
        </div>

        <nav className="dashboard-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.label}
              icon={ICONS[item.icon]}
              label={item.label}
              path={item.path}
              active={item.path === pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>

      <SidebarUserSection user={user} collapsed={collapsed} onLogout={handleSignOut} />

      <style>{`
        .dashboard-sidebar {
          --sidebar-inset: 20px;
          flex-shrink: 0;
          background: #1B2340;
          border-right: 4px solid #6D28D9;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: width 150ms ease, padding 150ms ease;
        }
        .dashboard-sidebar-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 20px 12px 24px var(--sidebar-inset);
          transition: flex-direction 150ms ease, padding 150ms ease;
        }
        .dashboard-sidebar-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          text-decoration: none;
          transition: gap 150ms ease;
        }
        .dashboard-sidebar-logo-text {
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
          color: #ffffff;
          letter-spacing: 1px;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          max-width: 200px;
          transition: opacity 150ms ease, max-width 150ms ease;
        }
        .sidebar-collapse-toggle {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .sidebar-collapse-toggle:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }
        .sidebar-collapse-toggle-icon {
          display: flex;
          transition: transform 150ms ease;
        }
        .sidebar-collapse-toggle-icon--collapsed {
          transform: rotate(180deg);
        }
        .dashboard-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px 10px calc(var(--sidebar-inset) - 12px);
          margin: 0 12px;
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          background: transparent;
          border: 2px solid transparent;
          cursor: pointer;
          position: relative;
          transition: background 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out, padding 150ms ease, gap 150ms ease;
        }
        .sidebar-nav-item-icon {
          display: flex;
          flex-shrink: 0;
        }
        .sidebar-nav-item-content {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          white-space: nowrap;
          opacity: 1;
          max-width: 200px;
          transition: opacity 150ms ease, max-width 150ms ease;
        }
        .sidebar-nav-item-soon-badge {
          font-family: 'Press Start 2P', monospace;
          font-size: 7px;
          letter-spacing: 0.5px;
          color: #14213D;
          background: #FBE24A;
          border: 1px solid #14213D;
          padding: 3px 5px;
          flex-shrink: 0;
        }
        .sidebar-nav-item-tooltip {
          display: none;
        }
        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid #14213D;
          box-shadow: 2px 2px 0px #14213D;
        }
        .sidebar-nav-item--active {
          color: #14213D;
          background: #A8F0CE;
          border: 2px solid #14213D;
          box-shadow: 4px 4px 0px #14213D;
        }
        .sidebar-nav-item--active:hover {
          background: #A8F0CE;
          border: 2px solid #14213D;
          box-shadow: 4px 4px 0px #14213D;
        }
        .sidebar-nav-item--soon {
          color: #9CA3AF;
          cursor: default;
        }
        .sidebar-nav-item--soon:hover {
          background: transparent;
          border: 2px solid transparent;
          box-shadow: none;
        }
        @media (min-width: 901px) {
          .sidebar-collapsed .dashboard-sidebar-brand-row {
            flex-direction: column;
            padding: 20px 8px 16px;
            gap: 12px;
          }
          .sidebar-collapsed .dashboard-sidebar-logo-link {
            gap: 0;
          }
          .sidebar-collapsed .sidebar-nav-item {
            justify-content: center;
            padding: 10px 6px;
            gap: 0;
          }
          .sidebar-collapsed .sidebar-nav-item-content {
            opacity: 0;
            max-width: 0;
          }
          .sidebar-collapsed .sidebar-nav-item-tooltip {
            display: block;
            position: absolute;
            left: calc(100% + 10px);
            top: 50%;
            transform: translateY(-50%);
            background: #14213D;
            color: #ffffff;
            border: 2px solid #ffffff;
            padding: 6px 10px;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 150ms ease;
            z-index: 20;
          }
          .sidebar-collapsed .sidebar-nav-item:hover .sidebar-nav-item-tooltip,
          .sidebar-collapsed .sidebar-nav-item:focus-visible .sidebar-nav-item-tooltip {
            opacity: 1;
            visibility: visible;
          }
          .sidebar-collapsed .dashboard-sidebar-logo-text {
            opacity: 0;
            max-width: 0;
          }
        }
        @media (max-width: 900px) {
          .sidebar-collapse-toggle {
            display: none;
          }
          .dashboard-sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-right: none;
            border-bottom: 4px solid #6D28D9;
          }
          .dashboard-sidebar-top {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .dashboard-sidebar-brand-row {
            padding: 20px 20px 24px 20px;
          }
          .dashboard-sidebar-nav {
            flex-direction: row;
            gap: 4px;
          }
          .dashboard-sidebar-nav span:not(:first-child) {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-sidebar,
          .dashboard-sidebar-brand-row,
          .dashboard-sidebar-logo-link,
          .sidebar-collapse-toggle-icon {
            transition: none;
          }
          .dashboard-sidebar-logo-text {
            transition: opacity 150ms ease;
          }
          .sidebar-nav-item {
            transition: background 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out;
          }
          .sidebar-nav-item-content {
            transition: opacity 150ms ease;
          }
        }
      `}</style>
    </aside>
  )
}
