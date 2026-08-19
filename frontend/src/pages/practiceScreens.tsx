import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PixelButton from '../components/auth/PixelButton'
import { HardCard, ModelSaw, ReferenceVideo, StatusBanner, VerdictCard, WebcamPanel } from '../components/practice/PracticeUi'
import { useHandLandmarker } from '../hooks/useHandLandmarker'
import {
  getBatchOverview,
  getChallenge,
  markSignPracticed,
  practiceErrorMessage,
  restartBatch,
  skipChallengeRetry,
  startChallenge,
  submitChallengeAttempt,
  useChallengeHint,
  type ChallengeState,
  type Verdict,
} from '../services/practiceApi'
import { classifyPracticeAttempt, shouldAutoHint, type HintClass } from '../services/hintRules'
import type { PredictResponse } from '../services/api'

function useBatchId(): number {
  const { batchId } = useParams()
  return Number(batchId)
}

function signPath(signId: string): string {
  return encodeURIComponent(signId)
}

function useCamera(videoRef: RefObject<HTMLVideoElement | null>, setError: (msg: string) => void) {
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

export function BatchOverviewPage() {
  const batchId = useBatchId()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['practice', 'batch', batchId],
    queryFn: () => getBatchOverview(batchId),
    enabled: Number.isFinite(batchId),
  })

  if (query.isLoading) {
    return <p role="status" className="animate-pulse font-body text-sm text-muted">Loading batch…</p>
  }
  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <p role="alert" className="font-body text-sm text-danger">{practiceErrorMessage(query.error) || 'This batch is locked or missing.'}</p>
        <Link to="/practice" className="font-body text-sm font-semibold text-primary">Back to map</Link>
      </div>
    )
  }

  const data = query.data

  return (
    <div className="space-y-6">
      <Link to="/practice" className="font-body text-xs font-semibold text-primary">← BATCH MAP</Link>
      <div>
        <p className="font-pixel text-[10px] text-primary">{data.tierLabel.toUpperCase()}</p>
        <h1 className="mt-2 font-pixel text-lg leading-7 text-ink">{data.title}</h1>
        <p className="mt-2 font-body text-sm text-muted">
          Preview each sign, then practice. Challenge unlocks after all five.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {data.signs.map((sign, index) => {
          const tile = (
            <HardCard
              tone={sign.practiced ? 'mint' : 'white'}
              className={`p-4 ${sign.unlocked ? '' : 'opacity-40'}`}
            >
              <p className="font-pixel text-[9px] text-muted">0{index + 1}</p>
              <p className="mt-2 font-pixel text-[10px] leading-4 text-ink">{sign.signId}</p>
              <p className="mt-2 font-body text-[11px] text-muted">{sign.category}</p>
              <p className="mt-3 font-body text-[11px] font-semibold text-ink">
                {sign.practiced ? 'PRACTICED' : sign.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </p>
            </HardCard>
          )
          if (!sign.unlocked) return <div key={sign.signId}>{tile}</div>
          return (
            <Link
              key={sign.signId}
              to={`/practice/batches/${batchId}/preview/${signPath(sign.signId)}`}
              className="block no-underline"
            >
              {tile}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {data.challengeUnlocked && (
          <PixelButton onClick={() => navigate(`/practice/batches/${batchId}/challenge`)}>
            START CHALLENGE
          </PixelButton>
        )}
        {data.status === 'needs_review' && (
          <PixelButton
            variant="secondary"
            onClick={async () => {
              await restartBatch(batchId)
              await query.refetch()
            }}
          >
            RESTART BATCH
          </PixelButton>
        )}
        {data.nextPracticeSignId && (
          <PixelButton
            variant="secondary"
            onClick={() => navigate(`/practice/batches/${batchId}/preview/${signPath(data.nextPracticeSignId!)}`)}
          >
            CONTINUE PRACTICE
          </PixelButton>
        )}
      </div>
    </div>
  )
}

export function PreviewPage() {
  const batchId = useBatchId()
  const { signId: rawSign } = useParams()
  const signId = decodeURIComponent(rawSign ?? '')
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['practice', 'batch', batchId],
    queryFn: () => getBatchOverview(batchId),
  })
  const sign = query.data?.signs.find((s) => s.signId === signId)

  if (query.isLoading) return <p className="animate-pulse font-body text-sm text-muted">Loading…</p>
  if (!sign || !sign.unlocked) {
    return <p className="font-body text-sm text-danger">This sign isn’t unlocked yet.</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link to={`/practice/batches/${batchId}`} className="font-body text-xs font-semibold text-primary">← {query.data?.title}</Link>
      <p className="font-pixel text-[10px] text-primary">PREVIEW</p>
      <h1 className="font-pixel text-xl leading-8 text-ink">{sign.signId}</h1>
      <p className="font-body text-sm text-muted">{sign.category}</p>
      <ReferenceVideo signId={sign.signId} label="WATCH, THEN TRY IT YOURSELF" />
      <PixelButton fullWidth onClick={() => navigate(`/practice/batches/${batchId}/practice/${signPath(sign.signId)}`)}>
        START PRACTICE
      </PixelButton>
    </div>
  )
}

export function PracticeSignPage() {
  const batchId = useBatchId()
  const { signId: rawSign } = useParams()
  const signId = decodeURIComponent(rawSign ?? '')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const overview = useQuery({
    queryKey: ['practice', 'batch', batchId],
    queryFn: () => getBatchOverview(batchId),
  })
  const sign = overview.data?.signs.find((s) => s.signId === signId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastPredRef = useRef<PredictResponse | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, setHintHistory] = useState<HintClass[]>([])
  const [showHint, setShowHint] = useState(false)
  const {
    isReady, isCapturing, isSubmitting, prediction, error, frameCount, startCapture, stopCapture, SEQUENCE_LEN,
  } = useHandLandmarker()

  useCamera(videoRef, setCamError)

  useEffect(() => {
    lastPredRef.current = null
    setHintHistory([])
    setShowHint(false)
  }, [signId])

  useEffect(() => {
    if (!prediction || !sign || prediction === lastPredRef.current) return
    lastPredRef.current = prediction
    const kind = classifyPracticeAttempt(sign.signId, prediction.top3, prediction.confidence)
    setHintHistory((prev) => {
      const next = kind === 'ok' ? [] : [...prev, kind]
      if (shouldAutoHint(next)) setShowHint(true)
      return next
    })
    if (kind === 'ok') setShowHint(false)
  }, [prediction, sign])

  if (overview.isLoading) {
    return <p className="animate-pulse font-body text-sm text-muted">Loading…</p>
  }

  async function goNext() {
    if (!sign) return
    setBusy(true)
    try {
      const next = await markSignPracticed(batchId, sign.signId)
      await queryClient.invalidateQueries({ queryKey: ['practice'] })
      const upcoming = next.signs.find((s) => !s.practiced && s.unlocked)
      if (upcoming) {
        navigate(`/practice/batches/${batchId}/preview/${signPath(upcoming.signId)}`)
      } else {
        navigate(`/practice/batches/${batchId}`)
      }
    } catch (err) {
      setCamError(practiceErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!sign || !sign.unlocked) {
    return <p className="font-body text-sm text-danger">This sign isn’t unlocked yet.</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <StatusBanner tone="yellow">PRACTICE MODE — NO XP</StatusBanner>
      <h1 className="font-pixel text-lg leading-7 text-ink">{sign.signId}</h1>
      <p className="font-body text-sm text-muted">{sign.category}</p>
      {showHint && (
        <HardCard tone="yellow" className="space-y-3 p-4">
          <p className="font-pixel text-[10px] leading-4 text-ink">HINT — WATCH THE REFERENCE</p>
          <ReferenceVideo signId={sign.signId} label="WATCH THE REFERENCE, THEN TRY AGAIN" />
        </HardCard>
      )}
      <WebcamPanel
        videoRef={videoRef}
        isCapturing={isCapturing}
        frameCount={frameCount}
        sequenceLen={SEQUENCE_LEN}
        isReady={isReady}
      />
      <div className="flex flex-wrap gap-3">
        <PixelButton
          disabled={!isReady || isCapturing || isSubmitting}
          onClick={() => {
            if (!videoRef.current) return
            startCapture(videoRef.current, { targetSign: sign.signId, category: sign.category })
          }}
        >
          {isCapturing ? 'CAPTURING…' : isSubmitting ? 'SCORING…' : 'START RECORD'}
        </PixelButton>
        {isCapturing && (
          <PixelButton variant="secondary" onClick={stopCapture}>CANCEL</PixelButton>
        )}
        {prediction && (
          <PixelButton variant="secondary" disabled={busy} onClick={goNext}>NEXT</PixelButton>
        )}
      </div>
      {(camError || error) && <p className="font-body text-sm text-danger">{camError || error}</p>}
      {prediction && (
        <VerdictCard verdict={prediction.feedback} attempt={prediction}>
          <ModelSaw topSign={prediction.top_sign} confidence={prediction.confidence} top3={prediction.top3} />
        </VerdictCard>
      )}
    </div>
  )
}

const BONUS_LABEL: Record<string, string> = {
  batch_first_pass: 'First-pass bonus',
  perfect_batch: 'Perfect batch',
  needs_review_pass: 'Needs-review pass',
}

export function ChallengePage() {
  const batchId = useBatchId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const overview = useQuery({
    queryKey: ['practice', 'batch', batchId],
    queryFn: () => getBatchOverview(batchId),
  })
  const [state, setState] = useState<ChallengeState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const submitSequence = useCallback(async (frames: number[][], ctx: { targetSign: string; category: string }, responseMs: number) => {
    const next = await submitChallengeAttempt(batchId, ctx.targetSign, frames, responseMs)
    setState(next)
    setShowResult(true)
    await queryClient.invalidateQueries({ queryKey: ['practice'] })
    if (next.done) {
      navigate(`/practice/batches/${batchId}/result`)
    }
  }, [batchId, navigate, queryClient])

  const {
    isReady, isCapturing, isSubmitting, error, frameCount, startCapture, stopCapture, SEQUENCE_LEN,
  } = useHandLandmarker(submitSequence)

  useCamera(videoRef, setCamError)

  useEffect(() => {
    startChallenge(batchId)
      .then((payload) => {
        if (payload.done) {
          navigate(`/practice/batches/${batchId}/result`, { replace: true })
          return
        }
        setState(payload)
      })
      .catch((err) => setLoadError(practiceErrorMessage(err)))
  }, [batchId, navigate])

  const category = overview.data?.signs.find((s) => s.signId === state?.currentSignId)?.category ?? 'Uncategorized'
  const lastVerdict: Verdict | undefined = state?.verdict
  const lastTop3 = state?.top3 ?? []
  const nice = lastVerdict === 'great' || lastVerdict === 'okay'

  async function onHint() {
    const next = await useChallengeHint(batchId)
    setState(next)
    setShowResult(false)
  }

  async function onSkip() {
    const next = await skipChallengeRetry(batchId)
    setState(next)
    setShowResult(false)
    if (next.done) navigate(`/practice/batches/${batchId}/result`)
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="font-body text-sm text-danger">{loadError}</p>
        <Link to={`/practice/batches/${batchId}`} className="font-body text-sm font-semibold text-primary">Back</Link>
      </div>
    )
  }
  if (!state) {
    return <p className="animate-pulse font-body text-sm text-muted">Starting Challenge…</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <StatusBanner tone="purple">GRADED CHALLENGE — XP ON</StatusBanner>
      <p className="font-pixel text-[10px] text-muted">
        SIGN {Math.min(state.index + 1, state.order.length)} / {state.order.length}
      </p>
      <h1 className="font-pixel text-lg leading-7 text-ink">{state.currentSignId}</h1>
      <WebcamPanel
        videoRef={videoRef}
        isCapturing={isCapturing}
        frameCount={frameCount}
        sequenceLen={SEQUENCE_LEN}
        isReady={isReady}
      />
      {!showResult && !state.hintPending && (
        <div className="flex flex-wrap gap-3">
          <PixelButton
            disabled={!isReady || isCapturing || isSubmitting || !state.currentSignId}
            onClick={() => {
              if (!videoRef.current || !state.currentSignId) return
              startCapture(videoRef.current, { targetSign: state.currentSignId, category })
            }}
          >
            {isCapturing ? 'CAPTURING…' : isSubmitting ? 'SCORING…' : 'START RECORD'}
          </PixelButton>
          {isCapturing && <PixelButton variant="secondary" onClick={stopCapture}>CANCEL</PixelButton>}
        </div>
      )}
      {state.hintPending && state.currentSignId && (
        <HardCard tone="yellow" className="space-y-3 p-4">
          <p className="font-pixel text-[10px] text-ink">HINT — XP ZEROED FOR THIS SIGN</p>
          <ReferenceVideo signId={state.currentSignId} label="WATCH THE REFERENCE, THEN RE-RECORD" />
          <PixelButton
            disabled={!isReady || isCapturing || isSubmitting}
            onClick={() => {
              if (!videoRef.current || !state.currentSignId) return
              startCapture(videoRef.current, { targetSign: state.currentSignId, category })
            }}
          >
            RECORD AGAIN
          </PixelButton>
        </HardCard>
      )}
      {(camError || error) && <p className="font-body text-sm text-danger">{camError || error}</p>}
      {showResult && state.topSign && lastVerdict && (
        <VerdictCard verdict={lastVerdict} attempt={state}>
          {typeof state.xpAwarded === 'number' && (
            <p className="font-body text-sm text-ink">+{state.xpAwarded} XP</p>
          )}
          <ModelSaw topSign={state.topSign} confidence={state.confidence ?? 0} top3={lastTop3} />
          {!nice && (
            <div>
              <p className="mb-1 font-pixel text-[9px] text-muted">DID YOU MEAN</p>
              {lastTop3.slice(0, 3).map((row) => (
                <p key={row.sign} className="font-body text-sm text-ink">
                  {row.sign} — {(row.confidence * 100).toFixed(1)}%
                </p>
              ))}
            </div>
          )}
          {nice ? (
            <PixelButton onClick={() => setShowResult(false)}>CONTINUE</PixelButton>
          ) : (
            <div className="flex flex-wrap gap-3">
              <PixelButton onClick={onHint}>HINT</PixelButton>
              <PixelButton variant="secondary" onClick={onSkip}>SKIP</PixelButton>
            </div>
          )}
        </VerdictCard>
      )}
    </div>
  )
}

export function BatchResultPage() {
  const batchId = useBatchId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [payload, setPayload] = useState<ChallengeState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tierDismissed, setTierDismissed] = useState(false)

  useEffect(() => {
    getChallenge(batchId)
      .then((data) => {
        if (!data.done || !data.batchResult) {
          navigate(`/practice/batches/${batchId}`, { replace: true })
          return
        }
        setPayload(data)
      })
      .catch((err) => setError(practiceErrorMessage(err)))
  }, [batchId, navigate])

  const result = payload?.batchResult
  const showTier = Boolean(result?.tierUp) && !tierDismissed

  if (error) return <p className="font-body text-sm text-danger">{error}</p>
  if (!result) return <p className="animate-pulse font-body text-sm text-muted">Loading results…</p>

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {showTier && result.tierUp && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/70 p-4">
          <HardCard tone="yellow" className="max-w-sm space-y-4 p-6">
            <p className="font-pixel text-xs leading-5 text-ink">TIER UNLOCKED</p>
            <p className="font-pixel text-sm text-ink">{result.tierUp.toUpperCase()}</p>
            <PixelButton onClick={() => setTierDismissed(true)}>CONTINUE</PixelButton>
          </HardCard>
        </div>
      )}

      {result.passed ? (
        <HardCard tone="mint" className="space-y-3 p-6">
          <p className="font-pixel text-xs text-ink">BATCH COMPLETE</p>
          <p className="font-pixel text-lg text-ink">{result.score}/{result.total}</p>
          <p className="font-body text-sm text-ink">Total XP +{result.totalXp}</p>
          <ul className="space-y-1 font-body text-sm text-ink">
            <li>Signs +{result.signXp}</li>
            {result.bonuses.map((b) => (
              <li key={b.reason}>{BONUS_LABEL[b.reason] ?? b.reason} +{b.amount}</li>
            ))}
            {result.streakXp > 0 && <li>Daily streak +{result.streakXp}</li>}
          </ul>
          <PixelButton
            onClick={() => {
              const next = result.nextBatchId
              navigate(next ? `/practice/batches/${next}` : '/practice')
            }}
          >
            CONTINUE
          </PixelButton>
        </HardCard>
      ) : (
        <HardCard tone="yellow" className="space-y-3 p-6">
          <p className="font-pixel text-xs text-ink">NEEDS REVIEW</p>
          <p className="font-pixel text-lg text-ink">{result.score}/{result.total}</p>
          <p className="font-body text-sm text-ink">Score 3/5 or better to unlock the next batch. Restart the full loop.</p>
          {result.failedSigns.length > 0 && (
            <p className="font-body text-xs text-muted">Missed: {result.failedSigns.join(', ')}</p>
          )}
          <PixelButton
            onClick={async () => {
              await restartBatch(batchId)
              await queryClient.invalidateQueries({ queryKey: ['practice'] })
              navigate(`/practice/batches/${batchId}`)
            }}
          >
            RESTART BATCH
          </PixelButton>
        </HardCard>
      )}
    </div>
  )
}
