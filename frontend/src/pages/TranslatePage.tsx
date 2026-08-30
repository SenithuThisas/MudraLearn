import { useEffect, useRef, useState } from 'react';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import DashboardShell from '../components/dashboard/DashboardShell';
import PixelButton from '../components/auth/PixelButton';
import { HardCard, StatusBanner } from '../components/practice/PracticeUi';

export default function TranslatePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isReady, isCapturing, prediction, error, frameCount, SEQUENCE_LEN, startCapture, stopCapture } = useHandLandmarker();
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const progressPct = Math.min((frameCount / SEQUENCE_LEN) * 100, 100);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-pixel text-lg leading-8 text-ink">Live Translation</h1>
          <p className="mt-2 font-body text-sm text-muted">
            Sign to the camera to see the AI prediction in real time.
          </p>
        </div>

        {error && <StatusBanner tone="red">{error.toUpperCase()}</StatusBanner>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
          {/* Camera View */}
          <HardCard className="space-y-4 p-4">
            <div className="relative aspect-video w-full overflow-hidden border-2 border-ink bg-black shadow-hard">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 transform object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/80">
                  <p className="animate-pulse font-pixel text-[10px] leading-5 text-white">
                    REQUESTING CAMERA ACCESS…
                  </p>
                </div>
              )}
              {isCapturing && (
                <div className="absolute right-3 top-3 flex items-center gap-2 border-2 border-ink bg-danger px-3 py-1 font-pixel text-[9px] leading-4 text-white shadow-hard-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-white" /> RECORDING
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <PixelButton
                disabled={!isReady || !cameraActive || isCapturing}
                onClick={() => startCapture(videoRef.current!, { targetSign: 'unknown', category: 'free' })}
              >
                {!isReady ? 'LOADING AI MODEL…' : isCapturing ? 'RECORDING…' : 'RECORD SIGN (2S)'}
              </PixelButton>
              {isCapturing && (
                <PixelButton variant="secondary" onClick={stopCapture}>
                  CANCEL
                </PixelButton>
              )}
            </div>

            {/* Progress Bar */}
            <div>
              <div className="h-2 w-full border-2 border-ink bg-white">
                <div
                  className="h-full bg-primary transition-all duration-75 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-center font-body text-xs text-muted">
                {frameCount} / {SEQUENCE_LEN} frames captured
              </p>
            </div>
          </HardCard>

          {/* Results Panel */}
          <HardCard className="space-y-4 p-6">
            <p className="border-b-2 border-ink pb-3 font-pixel text-[10px] leading-4 text-muted">
              PREDICTION
            </p>

            {prediction ? (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="mb-2 font-pixel text-[9px] uppercase leading-4 text-muted">Top Sign</p>
                  <p className="font-pixel text-2xl leading-tight text-primary">{prediction.top_sign}</p>
                  <span className="mt-3 inline-block border-2 border-ink bg-sticker-mint px-3 py-1 font-pixel text-[9px] leading-4 text-ink">
                    {(prediction.confidence * 100).toFixed(1)}% CONFIDENCE
                  </span>
                </div>

                <div>
                  <p className="mb-2 font-pixel text-[9px] uppercase leading-4 text-muted">Alternatives</p>
                  <ul className="space-y-2">
                    {prediction.top3.slice(1).map((alt, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between border-2 border-ink bg-white px-3 py-2 font-body text-sm"
                      >
                        <span className="font-semibold text-ink">{alt.sign}</span>
                        <span className="text-muted">{(alt.confidence * 100).toFixed(1)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <svg className="h-12 w-12 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="font-body text-sm text-muted">
                  Click "Record Sign" and perform a gesture to see results.
                </p>
              </div>
            )}
          </HardCard>
        </div>
      </div>
    </DashboardShell>
  );
}
