import type { ReactNode } from 'react'
import SidebarNav from './SidebarNav'

const SHELL_CSS = `
  .dashboard-shell {
    display: flex;
    min-height: 100vh;
    background: #F7F6F3;
    font-family: 'Inter', sans-serif;
  }
  .dashboard-main {
    flex: 1;
    min-width: 0;
  }
  .dashboard-content {
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 40px 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .dashboard-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: stretch;
  }
  @media (min-width: 1280px) {
    .dashboard-content {
      padding: 40px 56px 72px;
      gap: 28px;
    }
    .dashboard-grid-2 {
      gap: 28px;
    }
  }
  @media (min-width: 1536px) {
    .dashboard-content {
      padding: 48px 64px 80px;
      gap: 32px;
    }
    .dashboard-grid-2 {
      gap: 32px;
    }
  }
  @media (max-width: 900px) {
    .dashboard-shell {
      flex-direction: column;
    }
    .dashboard-content {
      padding: 24px 20px 40px;
    }
    .dashboard-grid-2 {
      grid-template-columns: 1fr;
    }
  }
`

export default function DashboardShell({
  topBar,
  children,
}: {
  topBar?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="dashboard-shell">
      <SidebarNav />
      <div className="dashboard-main">
        {topBar}
        {children}
      </div>
      <style>{SHELL_CSS}</style>
    </div>
  )
}
