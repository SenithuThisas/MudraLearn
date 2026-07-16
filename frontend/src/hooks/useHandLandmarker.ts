import { useRef, useCallback, useEffect, useState } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { predictSign, type PredictResponse } from '../services/api';

// ── Constants — must match training pipeline ─────────────────────────────────
const NUM_LANDMARKS     = 21;
const NUM_COORDS        = 3;
const FEATURES_PER_HAND = NUM_LANDMARKS * NUM_COORDS; // 63

export const SEQUENCE_LEN = 60;

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Context passed into startCapture so every predict call carries full metadata. */
export interface PredictContext {
  targetSign: string
  category:   string
}

// ── Normalisation (must match extract_hand_landmarks.py) ─────────────────────

function normaliseHand(landmarks: { x: number; y: number; z: number }[]): number[] {
  const wrist   = landmarks[0];
  const centred = landmarks.map((lm) => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z,
  }));

  const mcp   = centred[9];
  const scale = Math.sqrt(mcp.x ** 2 + mcp.y ** 2 + mcp.z ** 2) + 1e-8;

  const flat: number[] = [];
  for (const pt of centred) {
    flat.push(pt.x / scale, pt.y / scale, pt.z / scale);
  }
  return flat; // length 63
}

function extractFrameFeatures(result: ReturnType<HandLandmarker['detect']>): number[] {
  const leftHand  = new Array(FEATURES_PER_HAND).fill(0);
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHandLandmarker() {
  const detectorRef     = useRef<HandLandmarker | null>(null);
  const frameBuffer     = useRef<number[][]>([]);
  const isRecording     = useRef(false);
  const animFrameRef    = useRef<number>(0);
  const captureStartRef = useRef<number>(0);           // for response_ms tracking
  const predictCtxRef   = useRef<PredictContext | null>(null); // set on startCapture

  const [isReady,     setIsReady]     = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [prediction,  setPrediction]  = useState<PredictResponse | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [frameCount,  setFrameCount]  = useState(0);

  // Initialise HandLandmarker
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        const detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions:                 { modelAssetPath: MODEL_URL },
          runningMode:                 'VIDEO',
          numHands:                    2,
          minHandDetectionConfidence:  0.3,
          minHandPresenceConfidence:   0.3,
          minTrackingConfidence:       0.3,
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
    return () => { cancelled = true; };
  }, []);

  /**
   * Start recording frames from a video element.
   * @param videoEl  — the <video> element to detect from
   * @param ctx      — adaptive learning context (targetSign, category)
   */
  const startCapture = useCallback(
    (videoEl: HTMLVideoElement, ctx: PredictContext) => {
      if (!detectorRef.current || isRecording.current) return;

      frameBuffer.current     = [];
      isRecording.current     = true;
      captureStartRef.current = performance.now();
      predictCtxRef.current   = ctx;

      setIsCapturing(true);
      setPrediction(null);
      setError(null);
      setFrameCount(0);

      let lastTimestamp = -1;

      function processFrame() {
        if (!isRecording.current || !detectorRef.current) return;

        const now = performance.now();
        const ts  = now > lastTimestamp ? now : lastTimestamp + 1;
        lastTimestamp = ts;

        try {
          const result   = detectorRef.current.detectForVideo(videoEl, ts);
          const features = extractFrameFeatures(result);
          frameBuffer.current.push(features);
          setFrameCount(frameBuffer.current.length);

          if (frameBuffer.current.length >= SEQUENCE_LEN) {
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

  // Stop recording early without predicting
  const stopCapture = useCallback(() => {
    isRecording.current = false;
    setIsCapturing(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Send the 60-frame sequence to the backend
  async function sendPrediction(frames: number[][]) {
    const ctx         = predictCtxRef.current;
    const responseMs  = Math.round(performance.now() - captureStartRef.current);

    if (!ctx) {
      setError('No predict context — was startCapture called with a PredictContext?');
      return;
    }

    try {
      const data = await predictSign(
        frames,
        ctx.targetSign,
        ctx.category,
        responseMs,
      );
      setPrediction(data);
    } catch (err) {
      setError(`Prediction failed: ${err}`);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      detectorRef.current?.close();
    };
  }, []);

  return {
    isReady,
    isCapturing,
    prediction,   // full PredictResponse including correct, mastery, feedback
    error,
    frameCount,
    startCapture,
    stopCapture,
    SEQUENCE_LEN,
  };
}
