import { useAnimate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { SignResult } from '../../services/api'
import type { Verdict } from '../../services/practiceApi'
import { referenceClipUrl } from '../../services/referenceClips'

export function HardCard({
  children,
  className = '',
  tone = 'white',
}: {
  children: ReactNode
  className?: string
  tone?: 'white' | 'yellow' | 'mint' | 'navy'
}) {
  const bg = {
    white: 'bg-white',
    yellow: 'bg-sticker-yellow',
    mint: 'bg-sticker-mint',
    navy: 'bg-navy text-white',
  }[tone]
  return (
    <div className={`border-2 border-ink shadow-hard ${bg} ${className}`}>
      {children}
    </div>
  )
}

export function ReferencePlaceholder({ label = 'REFERENCE VIDEO UNAVAILABLE' }: { label?: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center border-2 border-ink bg-navy shadow-hard">
      <p className="px-4 text-center font-pixel text-[10px] leading-5 text-white">{label}</p>
    </div>
  )
}

export function ReferenceVideo({
  signId,
  label,
}: {
  signId: string
  label?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  // Tracked per sign rather than as a plain boolean so moving to the next sign
  // retries its clip instead of inheriting the previous one's failure.
  const [failedSign, setFailedSign] = useState<string | null>(null)

  if (failedSign === signId) return <ReferencePlaceholder label={label} />

  function replay() {
    const video = ref.current
    if (!video) return
    video.currentTime = 0
    void video.play()
  }

  return (
    <div className="space-y-2">
      <video
        ref={ref}
        key={signId}
        src={referenceClipUrl(signId)}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setFailedSign(signId)}
        className="aspect-video w-full border-2 border-ink bg-navy object-contain shadow-hard"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="font-pixel text-[10px] leading-4 text-muted">{label ?? 'REFERENCE'}</p>
        <button
          type="button"
          onClick={replay}
          className="border-2 border-ink bg-white px-3 py-1 font-pixel text-[10px] leading-4 text-ink shadow-hard-sm"
        >
          REPLAY
        </button>
      </div>
    </div>
  )
}

const VERDICT_STYLE: Record<Verdict, { fill: string; label: string }> = {
  great: { fill: 'bg-sticker-mint', label: 'GREAT!' },
  okay: { fill: 'bg-sticker-yellow', label: 'NICE' },
  retry: { fill: 'bg-danger-soft', label: 'TRY AGAIN' },
}

export function VerdictCard({
  verdict,
  attempt,
  children,
}: {
  verdict: Verdict
  // Only the identity of this value matters — a new result object re-fires the
  // flash, which lets two identical scores in a row still register as separate.
  attempt: unknown
  children?: ReactNode
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduceMotion = useReducedMotion()
  const style = VERDICT_STYLE[verdict]

  useEffect(() => {
    if (reduceMotion || !scope.current) return
    animate(scope.current, { opacity: [0.9, 0, 0.6, 0] }, { duration: 0.5, ease: 'easeOut' })
  }, [attempt, verdict, reduceMotion, animate, scope])

  return (
    <div className={`relative border-2 border-ink shadow-hard ${style.fill}`}>
      <div ref={scope} className="pointer-events-none absolute inset-0 bg-white opacity-0" />
      <div className="relative space-y-3 p-4">
        <p className="font-pixel text-xs text-ink">{style.label}</p>
        {children}
      </div>
    </div>
  )
}

export function ModelSaw({
  topSign,
  confidence,
  top3,
}: {
  topSign: string
  confidence: number
  top3: SignResult[]
}) {
  return (
    <div className="space-y-2 font-body text-sm">
      <p className="text-ink">
        Model saw: <span className="font-semibold">{topSign}</span>
        {' '}— {(confidence * 100).toFixed(1)}%
      </p>
      <div className="space-y-0.5 text-xs text-muted">
        {top3.map((row) => (
          <p key={row.sign}>{row.sign} — {(row.confidence * 100).toFixed(1)}%</p>
        ))}
      </div>
    </div>
  )
}

export function WebcamPanel({
  videoRef,
  isCapturing,
  frameCount,
  sequenceLen,
  isReady,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  isCapturing: boolean
  frameCount: number
  sequenceLen: number
  isReady: boolean
}) {
  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-video w-full border-2 border-ink bg-black object-cover shadow-hard"
      />
      {isCapturing && (
        <div>
          <div className="mb-1 flex justify-between font-body text-xs text-muted">
            <span>Capturing frames…</span>
            <span>{frameCount} / {sequenceLen}</span>
          </div>
          <div className="h-2 w-full border-2 border-ink bg-white">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (frameCount / sequenceLen) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {!isReady && (
        <p className="animate-pulse font-body text-xs text-muted">Loading hand-tracking model…</p>
      )}
    </div>
  )
}

export function StatusBanner({ children, tone }: { children: ReactNode; tone: 'yellow' | 'purple' | 'red' }) {
  const cls = {
    yellow: 'bg-sticker-yellow',
    purple: 'bg-primary text-white',
    red: 'bg-danger text-white',
  }[tone]
  return (
    <div className={`border-2 border-ink px-4 py-2 text-center font-pixel text-[10px] leading-4 shadow-hard-sm ${cls}`}>
      {children}
    </div>
  )
}
