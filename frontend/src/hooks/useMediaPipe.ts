import { useEffect, useRef, useState } from 'react'
import {
PoseLandmarker,
FilesetResolver
} from '@mediapipe/tasks-vision'
export function useMediaPipe() {
const landmarkerRef = useRef<PoseLandmarker | null>(null)
const [ready, setReady] = useState(false)
useEffect(() => {
async function init() {
const vision = await FilesetResolver.forVisionTasks(
'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
)
landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
baseOptions: {
modelAssetPath:
'https://storage.googleapis.com/mediapipe-models/' +
'pose_landmarker/pose_landmarker_lite/float16/1/' +
'pose_landmarker_lite.task',
},
runningMode: 'VIDEO',
numPoses: 1,
})
setReady(true)
}
init()
}, [])
// Extract 132 features from one video frame
function extractFrame(video: HTMLVideoElement): number[] | null {
if (!landmarkerRef.current || !ready) return null
const result = landmarkerRef.current.detectForVideo(
video, performance.now()
)
if (!result.worldLandmarks.length) return null
// Flatten 33 landmarks x [x, y, z, visibility] = 132 values
return result.worldLandmarks[0].flatMap(
lm => [lm.x, lm.y, lm.z, lm.visibility ?? 0]
)
}
return { ready, extractFrame }
}