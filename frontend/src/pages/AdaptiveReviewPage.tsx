/**
 * AdaptiveReviewPage — /practice/review
 *
 * KEY DESIGN CONSTRAINT: the <video> element (inside WebcamPanel) MUST remain
 * mounted for the entire component lifetime. If it unmounts, useCamera's cleanup
 * fires, MediaStream.stop() is called, and the camera goes black. Early-return
 * patterns that swap JSX trees on isLoading/isError must NOT be used here —
 * instead, show loading/error state inside the left column while the right column
 * (webcam) stays in the DOM untouched.
 *
 * Two modes, chosen by URL query params, share one render path below:
 *   - Global mode (default, no params): the original behaviour — queries
 *     getNextSign() (the adaptive algorithm) each round, endless spaced-repetition
 *     loop, "complete" terminal state when the whole curriculum is mastered.
 *   - Batch mode (?mode=batch&batchId=N): walks a fixed, already-computed
 *     recommendation list from getBatchRecommendations(batchId) — a snapshot,
 *     not re-adaptive. Never calls getNextSign(). Terminates after the last
 *     recommended sign instead of looping forever.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { RefObject } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PixelButton from '../components/auth/PixelButton'
import {
  HardCard,
  ModelSaw,
  ReferenceVideo,
  StatusBanner,
  VerdictCard,
  WebcamPanel,
} from '../components/practice/PracticeUi'
import { useHandLandmarker, SEQUENCE_LEN } from '../hooks/useHandLandmarker'
import { getNextSign } from '../services/api'
import type { NextSignResponse } from '../services/api'
import { getBatchRecommendations, type RecommendationReason } from '../services/practiceApi'

// ── Mode badge (global mode) ────────────────────────────────────────────────

const MODE_LABEL: Record<NonNullable<NextSignResponse['mode']>, string> = {
  cold_start: 'NEW SIGN',
  new:        'FIRST LOOK',
  review:     'NEEDS REVIEW',
  complete:   'COMPLETE',
}

function ModeBadge({ mode }: { mode: NextSignResponse['mode'] }) {
  if (!mode || mode === 'complete') return null
  return (
    <span className="inline-block border-2 border-ink bg-sticker-yellow px-2 py-0.5 font-pixel text-[9px] tracking-wide text-ink shadow-hard-sm">
      {MODE_LABEL[mode]}
    </span>
  )
}

// ── Reason badge (batch list-walk mode) ─────────────────────────────────────

const REASON_LABEL: Record<RecommendationReason, string> = {
  weak_this_batch: 'JUST STRUGGLED',
  decayed:         'FADING',
}

function ReasonBadge({ reason }: { reason: RecommendationReason }) {
  return (
    <span className="inline-block border-2 border-ink bg-sticker-yellow px-2 py-0.5 font-pixel text-[9px] tracking-wide text-ink shadow-hard-sm">
      {REASON_LABEL[reason]}
    </span>
  )
}

// ── useCamera — duplicated from practiceScreens.tsx (14 lines) ────────────────
// Kept local so zero existing files are modified.

function useCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  setError: (msg: string) => void,
) {
  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setError('Camera permission denied — please allow webcam access.'))
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [videoRef, setError])
}

// ── Completion cards ────────────────────────────────────────────────────────

function CompletionCard() {
  return (
    <HardCard tone="mint" className="p-6 text-center space-y-4">
      <p className="font-pixel text-xs text-ink">🎓 CURRICULUM COMPLETE</p>
      <p className="font-body text-sm text-ink">
        You've mastered every sign in the catalogue. Exceptional work!
      </p>
      <p className="font-body text-xs text-muted">
        Signs will still cycle in review mode to keep your skills sharp.
      </p>
      <Link to="/practice">
        <PixelButton>← BACK TO PRACTICE</PixelButton>
      </Link>
    </HardCard>
  )
}

function BatchWalkDoneCard({ batchId, reviewedCount }: { batchId: number; reviewedCount: number }) {
  return (
    <HardCard tone="mint" className="p-6 text-center space-y-4">
      <p className="font-pixel text-xs text-ink">✅ REVIEW COMPLETE</p>
      <p className="font-body text-sm text-ink">
        {reviewedCount > 0
          ? `You've reviewed all ${reviewedCount} recommended sign${reviewedCount === 1 ? '' : 's'}.`
          : 'No recommended signs to review right now.'}
      </p>
      <Link to={`/practice/batches/${batchId}`}>
        <PixelButton>← BACK TO BATCH</PixelButton>
      </Link>
    </HardCard>
  )
}

// ── Left column — sign info card ──────────────────────────────────────────────

function SignCard({
  sign,
  category,
  badge,
  mastery,
}: {
  sign: string
  category: string
  badge: ReactNode
  mastery: number | null
}) {
  return (
    <HardCard tone="white" className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs text-muted">{category}</p>
          <p className="font-pixel text-sm leading-6 text-ink">{sign}</p>
        </div>
        {badge}
      </div>

      {mastery !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between font-body text-xs text-muted">
            <span>Your mastery</span>
            <span>{(mastery * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full border-2 border-ink bg-white">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, mastery * 100)}%` }}
            />
          </div>
        </div>
      )}
    </HardCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdaptiveReviewPage() {
  const [searchParams] = useSearchParams()
  const batchIdRaw = searchParams.get('batchId')
  const batchIdParam = batchIdRaw !== null ? Number(batchIdRaw) : NaN
  const isBatchMode = searchParams.get('mode') === 'batch' && Number.isFinite(batchIdParam)

  const [fetchKey, setFetchKey] = useState(0)
  const [walkIndex, setWalkIndex] = useState(0)

  // Global mode only — never fired in batch mode.
  const signQuery = useQuery({
    queryKey: ['adaptive', 'next', fetchKey],
    queryFn:  getNextSign,
    staleTime: 0,
    enabled: !isBatchMode,
  })

  // Batch mode only — a one-shot snapshot fetch, not re-adaptive. Walked
  // locally via walkIndex; getNextSign() is never called in this mode.
  const recommendationsQuery = useQuery({
    queryKey: ['practice', 'batch', batchIdParam, 'recommendations'],
    queryFn:  () => getBatchRecommendations(batchIdParam),
    enabled:  isBatchMode,
    staleTime: 0,
  })

  const videoRef   = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const setError = useCallback((msg: string) => setCameraError(msg), [])

  // Always called — hooks must not be inside conditionals.
  // useCamera owns the MediaStream for the lifetime of this component.
  useCamera(videoRef, setError)

  const {
    isReady,
    isCapturing,
    isSubmitting,
    prediction,
    error: captureError,
    frameCount,
    startCapture,
    clearPrediction,
  } = useHandLandmarker()

  function handleCapture(sign: string, category: string) {
    if (!videoRef.current) return
    clearPrediction()
    startCapture(videoRef.current, { targetSign: sign, category })
  }

  function handleNext() {
    clearPrediction()
    if (isBatchMode) {
      setWalkIndex((i) => i + 1)
    } else {
      setFetchKey((k) => k + 1)
    }
  }

  const busy = isCapturing || isSubmitting
  const backLink = isBatchMode ? `/practice/batches/${batchIdParam}` : '/practice'

  // ── Normalize both modes into one shared shape for the shared render below ──
  const isLoading  = isBatchMode ? recommendationsQuery.isLoading : signQuery.isLoading
  const isQueryErr = isBatchMode ? recommendationsQuery.isError : signQuery.isError

  const recommendations = recommendationsQuery.data?.recommendations ?? []
  const nextSign = signQuery.data

  const isDone = isBatchMode
    ? (!isLoading && !isQueryErr && walkIndex >= recommendations.length)
    : nextSign?.mode === 'complete'

  const current = isBatchMode
    ? ((!isLoading && !isQueryErr && !isDone) ? recommendations[walkIndex] : null)
    : ((!isLoading && !isQueryErr && nextSign && !isDone)
        ? (nextSign as { sign: string; category: string; mode: 'cold_start' | 'review' | 'new'; mastery: number | null })
        : null)

  const currentBadge: ReactNode = isBatchMode
    ? (current ? <ReasonBadge reason={(current as { reason: RecommendationReason }).reason} /> : null)
    : (current ? <ModeBadge mode={(current as { mode: NextSignResponse['mode'] }).mode} /> : null)

  const headerTitle = isBatchMode ? 'RECOMMENDED REVIEW' : 'PRACTICE SIGN'
  const headerSubtitle = isBatchMode
    ? (recommendations.length > 0
        ? `Sign ${Math.min(walkIndex + 1, recommendations.length)} of ${recommendations.length} — signs the system flagged from your last batch.`
        : '')
    : 'The engine picks what you need most. Sign each prompt — it learns from every attempt.'

  // Completion is the only case where we don't need the webcam at all.
  if (isDone) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="font-pixel text-[10px] text-primary">ADAPTIVE REVIEW</p>
          <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">
            {isBatchMode ? 'REVIEW COMPLETE' : "YOU'RE DONE"}
          </h1>
        </div>
        {isBatchMode
          ? <BatchWalkDoneCard batchId={batchIdParam} reviewedCount={recommendations.length} />
          : <CompletionCard />}
      </div>
    )
  }

  // ALL other states render the two-column layout so <video> stays mounted.
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="font-pixel text-[10px] text-primary">ADAPTIVE REVIEW</p>
        <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">{headerTitle}</h1>
        <p className="mt-3 max-w-2xl font-body text-sm text-muted">
          {headerSubtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Left column: sign info ────────────────────────────────── */}
        <div className="space-y-4">
          {isLoading && (
            <HardCard tone="white" className="p-5">
              <p className="animate-pulse font-body text-sm text-muted" role="status">
                {isBatchMode ? 'Loading your recommendations…' : 'Choosing your next sign…'}
              </p>
            </HardCard>
          )}

          {isQueryErr && (
            <HardCard tone="yellow" className="p-5 space-y-3">
              <p className="font-body text-sm text-danger" role="alert">
                {isBatchMode
                  ? "Couldn't load recommendations. Check your connection."
                  : "Couldn't fetch your next sign. Check your connection."}
              </p>
              {isBatchMode ? (
                <Link to={backLink}><PixelButton>← BACK TO BATCH</PixelButton></Link>
              ) : (
                <PixelButton onClick={() => setFetchKey((k) => k + 1)}>RETRY</PixelButton>
              )}
            </HardCard>
          )}

          {current && (
            <>
              <SignCard
                sign={current.sign}
                category={current.category}
                badge={currentBadge}
                mastery={current.mastery}
              />
              <ReferenceVideo
                signId={current.sign}
                label={`REFERENCE — ${current.sign.toUpperCase()}`}
              />
            </>
          )}
        </div>

        {/* ── Right column: webcam — ALWAYS mounted ─────────────────── */}
        <div className="space-y-4">
          {cameraError ? (
            <StatusBanner tone="red">{cameraError}</StatusBanner>
          ) : (
            <WebcamPanel
              videoRef={videoRef}
              isCapturing={isCapturing}
              frameCount={frameCount}
              sequenceLen={SEQUENCE_LEN}
              isReady={isReady}
            />
          )}

          {captureError && (
            <StatusBanner tone="red">{captureError}</StatusBanner>
          )}

          {/* Verdict shown after a scored attempt */}
          {current && prediction && !isCapturing && (
            <VerdictCard
              verdict={prediction.feedback as 'great' | 'okay' | 'retry'}
              attempt={prediction}
            >
              <ModelSaw
                topSign={prediction.top_sign}
                confidence={prediction.confidence}
                top3={prediction.top3}
              />
              <div className="pt-2">
                <PixelButton id="adaptive-next-sign-btn" onClick={handleNext}>
                  NEXT SIGN →
                </PixelButton>
              </div>
            </VerdictCard>
          )}

          {/* Capture controls — only when a sign is active and not yet scored */}
          {current && !prediction && (
            <div className="flex gap-3">
              <PixelButton
                id="adaptive-capture-btn"
                onClick={() => handleCapture(current.sign, current.category)}
                disabled={busy || !isReady || !!cameraError}
              >
                {isCapturing
                  ? `CAPTURING… ${frameCount}/${SEQUENCE_LEN}`
                  : isSubmitting
                    ? 'SCORING…'
                    : 'SIGN NOW'}
              </PixelButton>

              <Link to={backLink}>
                <PixelButton>← BACK</PixelButton>
              </Link>
            </div>
          )}

          {/* Show back button when loading or errored so user isn't stuck */}
          {(isLoading || isQueryErr) && (
            <Link to={backLink}>
              <PixelButton>← BACK</PixelButton>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
