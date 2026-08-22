import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usePracticeLayout } from './PracticeLayout'
import { getPracticeMap, type PracticeBatchCard } from '../services/practiceApi'
import { HardCard } from '../components/practice/PracticeUi'

const STATUS_LABEL: Record<PracticeBatchCard['status'], string> = {
  completed: 'CLEARED',
  needs_review: 'NEEDS REVIEW',
  in_progress: 'IN PROGRESS',
  locked: 'LOCKED',
}

function matchesQuery(batch: PracticeBatchCard, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    batch.title.toLowerCase().includes(q)
    || batch.tierLabel.toLowerCase().includes(q)
    || batch.signIds.some((sign) => sign.toLowerCase().includes(q))
  )
}

function BatchTile({ batch }: { batch: PracticeBatchCard }) {
  const locked = batch.status === 'locked'
  const tone = batch.status === 'completed'
    ? 'mint'
    : batch.status === 'needs_review'
      ? 'yellow'
      : 'white'

  const inner = (
    <HardCard tone={tone} className={`p-4 ${locked ? 'opacity-50' : ''}`}>
      <p className="font-pixel text-[9px] tracking-wide text-primary">{batch.tierLabel.toUpperCase()}</p>
      <h2 className="mt-2 font-pixel text-xs leading-5 text-ink">{batch.title}</h2>
      <p className="mt-3 font-body text-xs font-semibold text-ink">{STATUS_LABEL[batch.status]}</p>
      <p className="mt-1 font-body text-xs text-muted">
        {batch.practicedCount}/{batch.signCount} practiced
        {batch.bestScore > 0 ? ` · best ${batch.bestScore}/5` : ''}
      </p>
    </HardCard>
  )

  if (locked) {
    return <div aria-disabled="true">{inner}</div>
  }
  return <Link to={`/practice/batches/${batch.batchId}`} className="block no-underline">{inner}</Link>
}

export default function PracticePage() {
  const { searchQuery } = usePracticeLayout()
  const query = useQuery({ queryKey: ['practice', 'map'], queryFn: getPracticeMap })

  if (query.isLoading) {
    return <p role="status" className="animate-pulse font-body text-sm text-muted">Loading your path…</p>
  }
  if (query.isError || !query.data) {
    return <p role="alert" className="font-body text-sm text-danger">Couldn’t load the practice map.</p>
  }

  const visible = query.data.batches.filter((batch) => matchesQuery(batch, searchQuery))
  const tiers = [...new Map(visible.map((b) => [b.tier, b.tierLabel])).entries()]

  return (
    <div className="space-y-8">
      {/* ── Adaptive Review entry ─────────────────────────────────────── */}
      <Link to="/practice/review" className="block no-underline" id="adaptive-review-card-link">
        <HardCard tone="navy" className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-pixel text-[9px] tracking-wide text-sticker-yellow">ADAPTIVE ENGINE</p>
            <h2 className="mt-1 font-pixel text-xs leading-5 text-white">ADAPTIVE REVIEW</h2>
            <p className="mt-2 font-body text-xs text-white/70">
              Spaced repetition — the engine picks what you need most.
            </p>
          </div>
          <span className="shrink-0 border-2 border-sticker-yellow px-3 py-1 font-pixel text-[9px] text-sticker-yellow shadow-hard-sm">
            START →
          </span>
        </HardCard>
      </Link>

      {/* ── Batch Map ─────────────────────────────────────────────────── */}
      <div>
        <p className="font-pixel text-[10px] text-primary">PRACTICE PATH</p>
        <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">BATCH MAP</h1>
        <p className="mt-3 max-w-2xl font-body text-sm text-muted">
          Clear five signs, then take the graded Challenge. Score 3/5 or better to unlock the next batch.
        </p>
      </div>

      {tiers.length === 0 ? (
        <p className="font-body text-sm text-muted">No batches match that search.</p>
      ) : (
        tiers.map(([tier, label]) => (
          <section key={tier} className="space-y-3">
            <h2 className="font-pixel text-xs text-ink">TIER {tier} — {label.toUpperCase()}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.filter((b) => b.tier === tier).map((batch) => (
                <BatchTile key={batch.batchId} batch={batch} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
