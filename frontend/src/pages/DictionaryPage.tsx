import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Navigation from '../components/Navigation'
import SignCard from '../components/SignCard'
import SignDetailModal from '../components/dictionary/SignDetailModal'
import type { TieredSign } from '../utils/signTiers'

type Sign = TieredSign
type FetchStatus = 'loading' | 'error' | 'ready'

export default function DictionaryPage() {
  const [signs, setSigns] = useState<Sign[]>([])
  const [status, setStatus] = useState<FetchStatus>('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [detailSign, setDetailSign] = useState<Sign | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    fetch('/signs_data.json')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((d) => {
        setSigns(d.signs)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const categories = ['All', ...new Set(signs.map((s) => s.category))]
  const filtered = signs.filter((s) => {
    const matchQuery = s.name.toLowerCase().includes(query.toLowerCase())
    const matchCategory = category === 'All' || s.category === category
    return matchQuery && matchCategory
  })

  function openSign(sign: Sign, e: MouseEvent<HTMLButtonElement>) {
    triggerRef.current = e.currentTarget
    setDetailSign(sign)
  }

  return (
    <div className='min-h-screen bg-paper'>
      <Navigation />
      <div className='mx-auto max-w-5xl px-6 py-8'>
        <h1 className='mb-6 font-pixel text-lg leading-8 text-ink'>Sign Dictionary</h1>

        <input
          type='text'
          placeholder='Search signs...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={status !== 'ready'}
          aria-label='Search signs'
          className='mb-4 w-full border-2 border-ink bg-white px-4 py-2 font-body text-sm text-ink shadow-hard-sm outline-none placeholder:text-muted disabled:opacity-50'
        />

        <div className='mb-6 flex flex-wrap gap-2' role='group' aria-label='Filter by category'>
          {categories.map((cat) => (
            <button
              key={cat}
              type='button'
              onClick={() => setCategory(cat)}
              disabled={status !== 'ready'}
              aria-pressed={category === cat}
              className={`border-2 border-ink px-3 py-1.5 font-pixel text-[9px] leading-4 shadow-hard-sm transition-[transform,box-shadow] duration-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 ${
                category === cat ? 'bg-primary text-white' : 'bg-white text-ink'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {status === 'loading' && (
          <div
            className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'
            role='status'
            aria-live='polite'
            aria-label='Loading signs'
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='h-[92px] animate-pulse border-2 border-ink bg-hairline' />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className='border-2 border-ink bg-danger-soft px-4 py-6 text-center' role='alert'>
            <p className='font-pixel text-[10px] leading-5 text-ink'>
              COULDN&apos;T LOAD THE DICTIONARY. CHECK YOUR CONNECTION AND TRY AGAIN.
            </p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className='mb-4 font-body text-sm text-muted'>
              Showing {filtered.length} of {signs.length} signs
            </p>

            {filtered.length === 0 ? (
              <p className='py-12 text-center font-body text-sm text-muted'>
                No signs match &quot;{query}&quot;.
              </p>
            ) : (
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
                {filtered.map((s) => (
                  <SignCard
                    key={s.name}
                    name={s.name}
                    category={s.category}
                    has_clip={s.has_clip}
                    recognizable={s.recognizable}
                    onOpen={(e) => openSign(s, e)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <SignDetailModal sign={detailSign} onClose={() => setDetailSign(null)} triggerRef={triggerRef} />
    </div>
  )
}
