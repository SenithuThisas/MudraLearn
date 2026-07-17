import { useRef, useState, useEffect, useCallback } from 'react'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { predictSign, type PredictResponse } from '../services/api'
const FRAMES_NEEDED = 60
const MS_PER_FRAME = 100 // capture one frame every 100ms
export default function WebcamCapture() {
const videoRef = useRef<HTMLVideoElement>(null)
const [capturing, setCapturing] = useState(false)
const [result, setResult] = useState<PredictResponse | null>(null)
const [loading, setLoading] = useState(false)
const [statusMsg, setStatusMsg] = useState('Press Start to begin')
const frameBuffer = useRef<number[][]>([])
const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
const { ready, extractFrame } = useMediaPipe()
// Start the webcam stream
useEffect(() => {
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
if (videoRef.current) videoRef.current.srcObject = stream
})
.catch(() => setStatusMsg('Camera permission denied'))
return () => {
if (intervalRef.current) clearInterval(intervalRef.current)
}
}, [])
const startCapture = useCallback(() => {
if (!ready || !videoRef.current) return
frameBuffer.current = []
setResult(null)
setCapturing(true)
setStatusMsg(`Capturing... 0 / ${FRAMES_NEEDED} frames`)
intervalRef.current = setInterval(async () => {
const frame = extractFrame(videoRef.current!)
if (frame) {
frameBuffer.current.push(frame)
setStatusMsg(
`Capturing... ${frameBuffer.current.length} / ${FRAMES_NEEDED} frames`
)
}
if (frameBuffer.current.length >= FRAMES_NEEDED) {
clearInterval(intervalRef.current)
setCapturing(false)
setLoading(true)
setStatusMsg('Sending to model...')
try {
const res = await predictSign(
                frameBuffer.current.slice(0, FRAMES_NEEDED),
                '',         // no target sign for free translation mode
                'translate',
                0,
              )
setResult(res)
setStatusMsg('Done!')
} catch {
setStatusMsg('Prediction failed — try again')
} finally {
setLoading(false)
}
}
}, MS_PER_FRAME)
}, [ready, extractFrame])
const feedbackColour = {
great: 'bg-green-100 border-green-500 text-green-800',
okay : 'bg-yellow-100 border-yellow-500 text-yellow-800',
retry: 'bg-red-100 border-red-500 text-red-800',
}
return (
<div className='flex flex-col items-center gap-4'>
<video ref={videoRef} autoPlay muted playsInline
className='rounded-xl border w-80 h-60 bg-black object-cover' />
<p className='text-sm text-gray-500'>{statusMsg}</p>
<button
onClick={startCapture}
disabled={!ready || capturing || loading}
className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium
disabled:opacity-50 disabled:cursor-not-allowed
hover:bg-blue-700 transition-colors'
>
{capturing ? 'Capturing...' : loading ? 'Predicting...' : 'Start'}
</button>
{result && (
<div className={`w-80 border-2 rounded-xl p-4
${feedbackColour[result.feedback]}`}>
<p className='text-xl font-bold'>{result.top_sign}</p>
<p className='text-sm'>
Confidence: {(result.confidence * 100).toFixed(1)}%
</p>
<div className='mt-2 text-xs opacity-70'>
{result.top3.map(r => (
<p key={r.sign}>
{r.sign} — {(r.confidence * 100).toFixed(1)}%
</p>
))}
</div>
</div>
)}
</div>
)
}