import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard for authenticated-only pages.
 *
 * - While the session is being restored (getMe on load), shows a neutral
 *   status message instead of flashing the login page.
 * - If no user is present once resolved, redirects to /signin. The attempted
 *   path is stashed in history state as `from` for future return-to support.
 * - Otherwise renders the protected page.
 *
 * Session token itself lives in an httpOnly cookie set by the backend, so
 * there is nothing to read or attach here — the browser sends it automatically.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-500">Checking your session…</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
