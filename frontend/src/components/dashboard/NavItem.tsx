import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavItemProps {
  icon: ReactNode
  label: string
  path?: string // no path = not wired to a real route yet, rendered as inactive
  active: boolean
  collapsed: boolean
}

export default function NavItem({ icon, label, path, active, collapsed }: NavItemProps) {
  const soon = !path
  const className = [
    'sidebar-nav-item',
    active && 'sidebar-nav-item--active',
    soon && 'sidebar-nav-item--soon',
  ].filter(Boolean).join(' ')

  const content = (
    <>
      <span className="sidebar-nav-item-icon">{icon}</span>
      <span className="sidebar-nav-item-content">
        <span className="sidebar-nav-item-label">{label}</span>
        {soon && <span className="sidebar-nav-item-soon-badge">SOON</span>}
      </span>
      {collapsed && (
        <span className="sidebar-nav-item-tooltip" role="tooltip">{label}</span>
      )}
    </>
  )

  // Styles for these classes live in SidebarNav's single <style> block (the
  // shell that mounts this component), not here — NavItem renders once per
  // nav row, so an embedded <style> tag would duplicate the stylesheet N times.
  return path ? (
    <Link to={path} className={className}>{content}</Link>
  ) : (
    <span className={className} title="Coming soon">{content}</span>
  )
}
