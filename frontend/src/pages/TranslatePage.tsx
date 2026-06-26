import { useEffect, useRef, useState } from 'react';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import Navigation from '../components/Navigation';

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
    <div className="w-full flex-1 bg-gray-50 dark:bg-[#16171d] text-gray-800 dark:text-gray-200 font-sans text-left">
      <Navigation />
      
      <main className="max-w-5xl mx-auto py-10 px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">Live Translation</h1>
          <p className="text-gray-500 dark:text-gray-400">Sign to the camera to see the AI prediction in real-time.</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Camera View */}
          <div className="flex-1 bg-white dark:bg-[#1f2028] p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                  <p className="text-gray-300 animate-pulse">Requesting camera access...</p>
                </div>
              )}
              {isCapturing && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-md animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div> Recording
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => startCapture(videoRef.current!, { userId: 1, targetSign: 'unknown', category: 'free' })}
                disabled={!isReady || !cameraActive || isCapturing}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-md active:scale-[0.98]"
              >
                {!isReady ? 'Loading AI Model...' : isCapturing ? 'Recording...' : 'Record Sign (2s)'}
              </button>
              {isCapturing && (
                <button 
                  onClick={stopCapture}
                  className="py-3 px-4 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-75 ease-linear"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              {frameCount} / {SEQUENCE_LEN} frames captured
            </p>
          </div>

          {/* Results Panel */}
          <div className="w-full md:w-80 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1f2028] p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 flex-1">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-100 dark:border-gray-700">Prediction</h2>
              
              {prediction ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center mb-6">
                    <span className="block text-sm text-gray-500 uppercase tracking-wider mb-1">Top Sign</span>
                    <span className="text-4xl font-bold text-blue-700 dark:text-blue-400">{prediction.top_sign}</span>
                    <span className="block text-sm font-medium mt-2 text-green-600 bg-green-50 dark:bg-green-900/30 rounded-full px-3 py-1 inline-block">
                      {(prediction.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase text-gray-400 mb-2 block">Alternatives</span>
                    <ul className="space-y-2">
                      {prediction.top3.slice(1).map((alt, i) => (
                        <li key={i} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{alt.sign}</span>
                          <span className="text-gray-500">{(alt.confidence * 100).toFixed(1)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                  <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  <p>Click "Record Sign" and perform a gesture to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
