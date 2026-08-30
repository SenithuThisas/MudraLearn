import { createContext, useContext, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell'
import PracticeTopBar from '../components/practice/PracticeTopBar'

interface PracticeLayoutContext {
  searchQuery: string
}

const PracticeCtx = createContext<PracticeLayoutContext>({ searchQuery: '' })

export function usePracticeLayout() {
  return useContext(PracticeCtx)
}

export default function PracticeLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const value = useMemo(() => ({ searchQuery }), [searchQuery])

  return (
    <DashboardShell topBar={<PracticeTopBar searchQuery={searchQuery} onSearchQuery={setSearchQuery} />}>
      <PracticeCtx.Provider value={value}>
        <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </PracticeCtx.Provider>
    </DashboardShell>
  )
}
