/**
 * AdaptiveReviewPage — /practice/review
 *
 * KEY DESIGN CONSTRAINT: the <video> element (inside WebcamPanel) MUST remain
 * mounted for the entire component lifetime. If it unmounts, useCamera's cleanup
 * fires, MediaStream.stop() is called, and the camera goes black. Early-return
 * patterns that swap JSX trees on isLoading/isError must NOT be used here —
 * instead, show loading/error state inside the left column while the right column
 * (webcam) stays in the DOM untouched.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
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

// ── Mode badge ────────────────────────────────────────────────────────────────

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

// ── Completion card ───────────────────────────────────────────────────────────

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

// ── Left column — sign info card ──────────────────────────────────────────────

function SignCard({
  sign,
  category,
  mode,
  mastery,
}: {
  sign: string
  category: string
  mode: 'cold_start' | 'review' | 'new'
  mastery: number | null
}) {
  return (
    <HardCard tone="white" className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs text-muted">{category}</p>
          <p className="font-pixel text-sm leading-6 text-ink">{sign}</p>
        </div>
        <ModeBadge mode={mode} />
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
  const [fetchKey, setFetchKey] = useState(0)

  const signQuery = useQuery({
    queryKey: ['adaptive', 'next', fetchKey],
    queryFn:  getNextSign,
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
    setFetchKey((k) => k + 1)
  }

  const nextSign   = signQuery.data
  const isLoading  = signQuery.isLoading
  const isQueryErr = signQuery.isError
  const isComplete = nextSign?.mode === 'complete'
  const activeSign = (!isLoading && !isQueryErr && nextSign && !isComplete)
    ? (nextSign as { sign: string; category: string; mode: 'cold_start' | 'review' | 'new'; mastery: number | null })
    : null
  const busy = isCapturing || isSubmitting

  // Completion is the only case where we don't need the webcam at all.
  if (isComplete) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="font-pixel text-[10px] text-primary">ADAPTIVE REVIEW</p>
          <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">YOU'RE DONE</h1>
        </div>
        <CompletionCard />
      </div>
    )
  }

  // ALL other states render the two-column layout so <video> stays mounted.
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="font-pixel text-[10px] text-primary">ADAPTIVE REVIEW</p>
        <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">PRACTICE SIGN</h1>
        <p className="mt-3 max-w-2xl font-body text-sm text-muted">
          The engine picks what you need most. Sign each prompt — it learns from every attempt.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Left column: sign info ────────────────────────────────── */}
        <div className="space-y-4">
          {isLoading && (
            <HardCard tone="white" className="p-5">
              <p className="animate-pulse font-body text-sm text-muted" role="status">
                Choosing your next sign…
              </p>
            </HardCard>
          )}

          {isQueryErr && (
            <HardCard tone="yellow" className="p-5 space-y-3">
              <p className="font-body text-sm text-danger" role="alert">
                Couldn't fetch your next sign. Check your connection.
              </p>
              <PixelButton onClick={() => setFetchKey((k) => k + 1)}>RETRY</PixelButton>
            </HardCard>
          )}

          {activeSign && (
            <>
              <SignCard
                sign={activeSign.sign}
                category={activeSign.category}
                mode={activeSign.mode}
                mastery={activeSign.mastery}
              />
              <ReferenceVideo
                signId={activeSign.sign}
                label={`REFERENCE — ${activeSign.sign.toUpperCase()}`}
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
          {activeSign && prediction && !isCapturing && (
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
          {activeSign && !prediction && (
            <div className="flex gap-3">
              <PixelButton
                id="adaptive-capture-btn"
                onClick={() => handleCapture(activeSign.sign, activeSign.category)}
                disabled={busy || !isReady || !!cameraError}
              >
                {isCapturing
                  ? `CAPTURING… ${frameCount}/${SEQUENCE_LEN}`
                  : isSubmitting
                    ? 'SCORING…'
                    : 'SIGN NOW'}
              </PixelButton>

              <Link to="/practice">
                <PixelButton>← BACK</PixelButton>
              </Link>
            </div>
          )}

          {/* Show back button when loading or errored so user isn't stuck */}
          {(isLoading || isQueryErr) && (
            <Link to="/practice">
              <PixelButton>← BACK</PixelButton>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
