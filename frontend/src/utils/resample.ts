const NUM_FEATURES = 126

/**
 * Resample a variable-length frame sequence to a fixed length via linear
 * interpolation, matching `interpolate_to_fixed()` in extract_hand_landmarks.py.
 * Training data is always resampled to 60 frames; live capture must match.
 */
export function resampleSequence(frames: number[][], target = 60): number[][] {
  const actual = frames.length
  if (actual === 0) {
    return Array.from({ length: target }, () => new Array(NUM_FEATURES).fill(0))
  }
  if (actual === target) return frames
  const numFeatures = frames[0].length
  const result: number[][] = Array.from(
    { length: target }, () => new Array(numFeatures).fill(0)
  )
  for (let t = 0; t < target; t++) {
    const pos = (t * (actual - 1)) / (target - 1)
    const lo = Math.floor(pos)
    const hi = Math.min(lo + 1, actual - 1)
    const frac = pos - lo
    for (let f = 0; f < numFeatures; f++) {
      result[t][f] = frames[lo][f] * (1 - frac) + frames[hi][f] * frac
    }
  }
  return result
}
