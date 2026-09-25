/**
 * resampleSequence.ts
 * ====================
 * Pure-JS linear interpolation that resamples a variable-length frame sequence
 * to a fixed number of output frames. This mirrors the scipy.interpolate.interp1d
 * logic used in ml/scripts/extract_hand_landmarks.py:resample_sequence().
 *
 * Training pipeline context:
 *   - Source videos are ~3.0–3.2 seconds at 10 fps (avg 31.7 raw frames).
 *   - Each video is resampled to exactly SEQUENCE_LEN (60) frames via
 *     interp1d over normalised time [0, 1].
 *   - Live capture must apply the same resampling so the model sees
 *     the same temporal structure at inference time.
 */

/**
 * Number of features per frame (21 landmarks × 3 coords × 2 hands = 126).
 * Only used as a fallback when the input is empty.
 */
const NUM_FEATURES = 126;

/**
 * Linearly interpolate a sequence of `frames` (each a number[] of the same
 * length) to exactly `targetLen` frames.
 *
 * Algorithm (matches Python pipeline):
 *   originalIndices = np.linspace(0, 1, N)
 *   targetIndices   = np.linspace(0, 1, targetLen)
 *   interpolator    = interp1d(originalIndices, frames, axis=0, kind="linear")
 *   return interpolator(targetIndices)
 *
 * @param frames    - Variable-length array of frame vectors.
 * @param targetLen - Desired output length (default 60, matching SEQUENCE_LEN).
 * @returns Array of exactly `targetLen` frames.
 */
export function resampleSequence(
  frames: number[][],
  targetLen: number = 60,
): number[][] {
  const N = frames.length;

  // Edge case: no frames captured — return zero-filled sequence
  if (N === 0) {
    return Array.from({ length: targetLen }, () =>
      new Array(NUM_FEATURES).fill(0),
    );
  }

  // Edge case: single frame — replicate it
  if (N === 1) {
    return Array.from({ length: targetLen }, () => [...frames[0]]);
  }

  // Already the right length — return as-is
  if (N === targetLen) {
    return frames;
  }

  const numFeatures = frames[0].length;
  const result: number[][] = [];

  for (let t = 0; t < targetLen; t++) {
    // Map output index to normalised position in [0, 1], then to source index
    const pos = (t / (targetLen - 1)) * (N - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, N - 1);
    const frac = pos - lo;

    const interpolated = new Array(numFeatures);
    for (let f = 0; f < numFeatures; f++) {
      interpolated[f] = frames[lo][f] * (1 - frac) + frames[hi][f] * frac;
    }
    result.push(interpolated);
  }

  return result;
}
