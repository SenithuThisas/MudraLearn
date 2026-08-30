import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelButton from '../auth/PixelButton'
import { getPracticeContinue, practiceErrorMessage } from '../../services/practiceApi'

export default function PracticeTopBar({
  searchQuery,
  onSearchQuery,
}: {
  searchQuery: string
  onSearchQuery: (value: string) => void
}) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startLesson() {
    setStarting(true)
    setError(null)
    try {
      const batchId = await getPracticeContinue()
      if (batchId == null) {
        setError('No unlocked batch yet.')
        return
      }
      navigate(`/practice/batches/${batchId}`)
    } catch (err) {
      setError(practiceErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-primary bg-paper px-6 py-4 md:px-10">
      <label className="relative min-w-[220px] flex-1 max-w-md">
        <span className="sr-only">Search batches</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
        </span>
        <input
          value={searchQuery}
          onChange={(e) => onSearchQuery(e.target.value)}
          placeholder="Search signs or batches"
          className="w-full border-2 border-ink bg-white py-2.5 pl-9 pr-3 font-body text-sm text-ink shadow-hard-sm outline-none focus:border-primary"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-white text-ink shadow-hard-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3s3-2 3-9" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <PixelButton
          onClick={startLesson}
          disabled={starting}
          style={{ background: '#FBE24A', color: '#14213D' }}
        >
          {starting ? 'LOADING…' : 'START LESSON'}
        </PixelButton>
      </div>
      {error && (
        <p role="alert" className="w-full font-body text-sm text-danger">{error}</p>
      )}
    </div>
  )
}
