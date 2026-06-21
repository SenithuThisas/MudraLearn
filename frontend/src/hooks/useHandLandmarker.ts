import { useRef, useCallback, useEffect, useState } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

// ── Constants — must match training pipeline ────────────────
const NUM_LANDMARKS = 21;
const NUM_COORDS = 3;
const FEATURES_PER_HAND = NUM_LANDMARKS * NUM_COORDS; // 63
const NUM_FEATURES = FEATURES_PER_HAND * 2;            // 126
const SEQUENCE_LEN = 60;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

// ── Types ───────────────────────────────────────────────────
export interface PredictionResult {
  top_sign: string;
  confidence: number;
  top3: { sign: string; confidence: number }[];
  feedback: string;
}

// ── Normalisation (must match extract_hand_landmarks.py) ────
function normaliseHand(landmarks: { x: number; y: number; z: number }[]): number[] {
  // 1. Centre at wrist (landmark 0)
  const wrist = { x: landmarks[0].x, y: landmarks[0].y, z: landmarks[0].z };
  const centred = landmarks.map((lm) => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z,
  }));

  // 2. Scale by wrist-to-middle-finger-MCP distance (landmark 9)
  const mcp = centred[9];
  const scale = Math.sqrt(mcp.x ** 2 + mcp.y ** 2 + mcp.z ** 2) + 1e-8;

  // Flatten to [x0, y0, z0, x1, y1, z1, ...] = 63 values
  const flat: number[] = [];
  for (const pt of centred) {
    flat.push(pt.x / scale, pt.y / scale, pt.z / scale);
  }
  return flat; // length 63
}

function extractFrameFeatures(result: ReturnType<HandLandmarker['detect']>): number[] {
  const leftHand = new Array(FEATURES_PER_HAND).fill(0);
  const rightHand = new Array(FEATURES_PER_HAND).fill(0);

  if (result.landmarks && result.handedness) {
    for (let i = 0; i < result.landmarks.length; i++) {
      const handedness = result.handedness[i][0].categoryName;
      const normalised = normaliseHand(result.landmarks[i]);

      // MediaPipe reports handedness as mirrored (camera view)
      // "Left" in result = signer's right hand
      if (handedness === 'Left') {
        for (let j = 0; j < FEATURES_PER_HAND; j++) rightHand[j] = normalised[j];
      } else {
        for (let j = 0; j < FEATURES_PER_HAND; j++) leftHand[j] = normalised[j];
      }
    }
  }

  return [...leftHand, ...rightHand]; // length 126
}

// ── Hook ────────────────────────────────────────────────────
export function useHandLandmarker() {
  const detectorRef = useRef<HandLandmarker | null>(null);
  const frameBuffer = useRef<number[][]>([]);
  const isRecording = useRef(false);
  const animFrameRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  // Initialise HandLandmarker
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        const detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });
        if (!cancelled) {
          detectorRef.current = detector;
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) setError(`Failed to load HandLandmarker: ${err}`);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Start recording frames from a video element
  const startCapture = useCallback(
    (videoEl: HTMLVideoElement) => {
      if (!detectorRef.current || isRecording.current) return;

      frameBuffer.current = [];
      isRecording.current = true;
      setIsCapturing(true);
      setPrediction(null);
      setError(null);
      setFrameCount(0);

      let lastTimestamp = -1;

      function processFrame() {
        if (!isRecording.current || !detectorRef.current) return;

        const now = performance.now();
        // Ensure monotonically increasing timestamp
        const ts = now > lastTimestamp ? now : lastTimestamp + 1;
        lastTimestamp = ts;

        try {
          const result = detectorRef.current.detectForVideo(videoEl, ts);
          const features = extractFrameFeatures(result);
          frameBuffer.current.push(features);
          setFrameCount(frameBuffer.current.length);

          if (frameBuffer.current.length >= SEQUENCE_LEN) {
            // We have enough frames — stop and predict
            isRecording.current = false;
            setIsCapturing(false);
            sendPrediction(frameBuffer.current.slice(0, SEQUENCE_LEN));
            return;
          }
        } catch (err) {
          console.warn('Frame detection error:', err);
        }

        animFrameRef.current = requestAnimationFrame(processFrame);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    },
    [],
  );

  // Stop recording early
  const stopCapture = useCallback(() => {
    isRecording.current = false;
    setIsCapturing(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Send the 60-frame sequence to the backend
  async function sendPrediction(frames: number[][]) {
    try {
      const resp = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: frames }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        setError(`Prediction failed (${resp.status}): ${text}`);
        return;
      }

      const data: PredictionResult = await resp.json();
      setPrediction(data);
    } catch (err) {
      setError(`Network error: ${err}`);
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      detectorRef.current?.close();
    };
  }, []);

  return {
    isReady,
    isCapturing,
    prediction,
    error,
    frameCount,
    startCapture,
    stopCapture,
    SEQUENCE_LEN,
  };
}
