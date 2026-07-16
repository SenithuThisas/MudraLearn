import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { UserProfile } from '../../services/auth'
import LogoutConfirmModal from './LogoutConfirmModal'

interface SidebarUserSectionProps {
  user: UserProfile | null
  collapsed: boolean
  onLogout: () => void
}

const LOGOUT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export default function SidebarUserSection({ user, collapsed, onLogout }: SidebarUserSectionProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  // Compact treatment (avatar + popover) applies whenever the desktop rail is
  // collapsed OR the viewport is in the mobile row layout (<=900px) — kept in
  // sync live via matchMedia so a resize while a popover/modal is open (or
  // just sitting collapsed) never leaves JS state out of step with the CSS
  // breakpoints that already govern the rest of the sidebar.
  const [isCompact, setIsCompact] = useState(
    () => collapsed || !window.matchMedia('(min-width: 901px)').matches,
  )
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const logoutButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 901px)')
    const update = () => setIsCompact(collapsed || !mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [collapsed])

  useEffect(() => {
    if (!popoverOpen) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [popoverOpen])

  const initials = `${(user?.first_name?.[0] ?? '?').toUpperCase()}${(user?.last_name?.[0] ?? '').toUpperCase()}`
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  const displayLabel = user?.username ? `@${user.username}` : fullName || 'Signed in'

  const popoverVariants = {
    hidden: {
      opacity: 0,
      scale: reduceMotion ? 1 : 0.95,
      transition: { duration: reduceMotion ? 0.08 : 0.1, ease: 'easeIn' as const },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduceMotion ? 0.08 : 0.15, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  return (
    <div className="sidebar-user-section" ref={containerRef}>
      {isCompact ? (
        <button
          ref={avatarButtonRef}
          type="button"
          className="sidebar-user-avatar-trigger"
          onClick={() => setPopoverOpen((v) => !v)}
          aria-label="Account menu"
          aria-haspopup="true"
          aria-expanded={popoverOpen}
        >
          <span className="sidebar-user-avatar">{initials}</span>
        </button>
      ) : (
        <>
          <span className="sidebar-user-avatar">{initials}</span>
          <span className="sidebar-user-name">{displayLabel}</span>
          <button
            ref={logoutButtonRef}
            type="button"
            className="sidebar-user-logout-button"
            onClick={() => setModalOpen(true)}
            aria-label="Log out"
          >
            {LOGOUT_ICON}
          </button>
        </>
      )}

      <AnimatePresence>
        {isCompact && popoverOpen && (
          <motion.div
            className="sidebar-user-popover"
            role="menu"
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <span className="sidebar-user-popover-name">{fullName || displayLabel}</span>
            <button
              type="button"
              role="menuitem"
              className="sidebar-user-popover-logout"
              onClick={() => {
                setPopoverOpen(false)
                setModalOpen(true)
              }}
            >
              {LOGOUT_ICON}
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoutConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false)
          onLogout()
        }}
        triggerRef={isCompact ? avatarButtonRef : logoutButtonRef}
      />

      <style>{`
        .sidebar-user-section {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-top: 2px solid rgba(255, 255, 255, 0.15);
          position: relative;
          transition: padding 150ms ease;
        }
        .sidebar-user-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FBE24A;
          border: 2px solid #14213D;
          color: #14213D;
          box-shadow: 2px 2px 0px #ffffff;
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
        }
        .sidebar-user-avatar-trigger {
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0 auto;
          cursor: pointer;
        }
        .sidebar-user-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }
        .sidebar-user-logout-button {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 2px solid #ffffff;
          color: #ffffff;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .sidebar-user-logout-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .sidebar-user-popover {
          position: absolute;
          background: #ffffff;
          border: 2px solid #14213D;
          box-shadow: 4px 4px 0px #14213D;
          padding: 12px;
          min-width: 160px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-user-popover-name {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #14213D;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-user-popover-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 2px solid transparent;
          padding: 6px 8px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #14213D;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .sidebar-user-popover-logout:hover {
          background: rgba(20, 33, 61, 0.08);
          border-color: #14213D;
        }
        @media (min-width: 901px) {
          .sidebar-collapsed .sidebar-user-section {
            justify-content: center;
            padding: 16px 8px;
          }
          .sidebar-user-popover {
            bottom: calc(100% + 8px);
            left: 8px;
          }
        }
        @media (max-width: 900px) {
          .sidebar-user-section {
            border-top: none;
            padding: 8px;
          }
          .sidebar-user-popover {
            top: calc(100% + 8px);
            right: 8px;
          }
        }
      `}</style>
    </div>
  )
}
