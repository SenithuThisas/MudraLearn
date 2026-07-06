import type { ReactNode } from 'react'

interface SplitLayoutProps {
  left: ReactNode
  right: ReactNode
}

export default function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
      className="split-layout"
    >
      <div
        style={{
          flex: '0 0 50%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
        }}
        className="split-left"
      >
        {left}
      </div>
      <div
        style={{
          flex: '0 0 50%',
          background: '#14213D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="split-right"
      >
        {right}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .split-layout { flex-direction: column-reverse !important; }
          .split-left { flex: 1 1 auto !important; }
          .split-right { flex: 0 0 300px !important; min-height: 300px !important; }
        }
      `}</style>
    </div>
  )
}
