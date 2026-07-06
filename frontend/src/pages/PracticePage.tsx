import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useHandLandmarker } from '../hooks/useHandLandmarker'
import { getNextSign, type NextSignResponse } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

// ─── Mode badge colours ───────────────────────────────────────────────────────
const MODE_STYLE: Record<string, string> = {
  cold_start: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  new:        'bg-emerald-100 text-emerald-700 border border-emerald-200',
  review:     'bg-amber-100 text-amber-700 border border-amber-200',
}
const MODE_LABEL: Record<string, string> = {
  cold_start: '🎓 Intro',
  new:        '✨ New Sign',
  review:     '🔄 Review',
}

// ─── Feedback colours ─────────────────────────────────────────────────────────
const FEEDBACK_STYLE: Record<string, string> = {
  great: 'bg-green-50 border-green-400 text-green-800',
  okay:  'bg-yellow-50 border-yellow-400 text-yellow-800',
  retry: 'bg-red-50 border-red-400 text-red-800',
}
const FEEDBACK_LABEL: Record<string, string> = {
  great: '✅ Great!',
  okay:  '👍 Good effort',
  retry: '❌ Try again',
}

export default function PracticePage() {
  const navigate                            = useNavigate()
  const { user }                            = useAuth()
  const videoRef                            = useRef<HTMLVideoElement>(null)
  const [nextSign,    setNextSign]          = useState<NextSignResponse | null>(null)
  const [loadingSign, setLoadingSign]       = useState(true)
  const [signError,   setSignError]         = useState<string | null>(null)


  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true })
    }
  }, [user, navigate])

  if (!user) return null

  const {
    isReady,
    isCapturing,
    prediction,
    error: hookError,
    frameCount,
    startCapture,
    stopCapture,
    SEQUENCE_LEN,
  } = useHandLandmarker()

  // ── Start webcam ────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setSignError('Camera permission denied — please allow webcam access.'))

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // ── Fetch next sign ─────────────────────────────────────────────────────────
  const fetchNextSign = useCallback(async () => {
    setLoadingSign(true)
    setSignError(null)
    try {
      const sign = await getNextSign(user!.id)
      setNextSign(sign)
    } catch {
      setSignError('Could not reach the server — is the backend running?')
    } finally {
      setLoadingSign(false)
    }
  }, [])

  useEffect(() => { fetchNextSign() }, [fetchNextSign])

  // ── Auto-advance to next sign after a result is received ────────────────────
  useEffect(() => {
    if (!prediction) return
    const timer = setTimeout(() => {
      fetchNextSign()
    }, 2500) // give user 2.5 s to read the result before the next sign loads
    return () => clearTimeout(timer)
  }, [prediction, fetchNextSign])

  // ── Start a capture ─────────────────────────────────────────────────────────
  function handleStart() {
    if (!videoRef.current || !isReady || !nextSign) return
    startCapture(videoRef.current, {
      userId:     user!.id,
      targetSign: nextSign.sign,
      category:   nextSign.category,
    })
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const masteryPercent = nextSign?.mastery != null ? Math.round(nextSign.mastery * 100) : null
  const isBusy         = isCapturing || loadingSign

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#16171d] font-sans">
      <Navigation />

      <div className="max-w-xl mx-auto px-6 py-10 flex flex-col items-center gap-6">

        {/* ── Header ── */}
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Practice
        </h1>

        {/* ── Sign prompt card ── */}
        <div className="w-full bg-white dark:bg-[#1f2028] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 text-center">
          {loadingSign ? (
            <p className="text-gray-400 animate-pulse">Loading next sign…</p>
          ) : signError ? (
            <p className="text-red-500 text-sm">{signError}</p>
          ) : nextSign ? (
            <>
              {/* Mode badge */}
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${MODE_STYLE[nextSign.mode] ?? MODE_STYLE.review}`}>
                {MODE_LABEL[nextSign.mode] ?? nextSign.mode}
              </span>

              {/* Sign name */}
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight mb-1">
                {nextSign.sign}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-widest">
                {nextSign.category}
              </p>

              {/* Mastery progress bar */}
              {masteryPercent !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Your mastery</span>
                    <span>{masteryPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${masteryPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── Webcam ── */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm aspect-video bg-black object-cover shadow-md"
        />

        {/* ── Frame progress ── */}
        {isCapturing && (
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Capturing frames…</span>
              <span>{frameCount} / {SEQUENCE_LEN}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${(frameCount / SEQUENCE_LEN) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Start / Stop button ── */}
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isBusy || !isReady || !nextSign}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40
                       disabled:cursor-not-allowed text-white font-semibold rounded-xl
                       shadow-md hover:shadow-lg transition-all"
          >
            {isCapturing ? 'Capturing…' : 'Start'}
          </button>

          {isCapturing && (
            <button
              onClick={stopCapture}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300
                         dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200
                         font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* ── MediaPipe not ready yet ── */}
        {!isReady && (
          <p className="text-xs text-gray-400 animate-pulse">
            Loading hand-tracking model…
          </p>
        )}

        {/* ── Result card ── */}
        {prediction && (
          <div className={`w-full rounded-2xl border-2 p-5 transition-all ${FEEDBACK_STYLE[prediction.feedback]}`}>
            <p className="text-lg font-bold mb-1">
              {FEEDBACK_LABEL[prediction.feedback]}
            </p>

            <p className="text-sm mb-2">
              Model saw: <span className="font-semibold">{prediction.top_sign}</span>
              {' '}— {(prediction.confidence * 100).toFixed(1)}% confidence
            </p>

            {/* Updated mastery bar */}
            {prediction.mastery && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1 opacity-70">
                  <span>Updated mastery for {prediction.mastery.sign_id}</span>
                  <span>{Math.round(prediction.mastery.score * 100)}%</span>
                </div>
                <div className="w-full bg-white/40 rounded-full h-2">
                  <div
                    className="bg-current h-2 rounded-full transition-all duration-700"
                    style={{ width: `${prediction.mastery.score * 100}%` }}
                  />
                </div>
                <p className="text-xs opacity-60 mt-1">
                  {prediction.mastery.attempts} attempt{prediction.mastery.attempts !== 1 ? 's' : ''} · Tier {prediction.mastery.tier}
                </p>
              </div>
            )}

            {/* Top 3 */}
            <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-70 space-y-0.5">
              {prediction.top3.map((r) => (
                <p key={r.sign}>
                  {r.sign} — {(r.confidence * 100).toFixed(1)}%
                </p>
              ))}
            </div>

            <p className="text-xs opacity-50 mt-3">Next sign loading in a moment…</p>
          </div>
        )}

        {/* ── Hook error ── */}
        {hookError && (
          <p className="text-sm text-red-500 text-center">{hookError}</p>
        )}

      </div>
    </div>
  )
}