import { describe, it, expect } from 'vitest';
import { resampleSequence } from './resampleSequence';

/**
 * Unit tests for resampleSequence — the JS linear-interpolation utility
 * that mirrors ml/scripts/extract_hand_landmarks.py:resample_sequence().
 */

describe('resampleSequence', () => {
  // ── Output length ──────────────────────────────────────────────────────────

  it('returns exactly targetLen frames for a longer input', () => {
    // Simulate ~180 frames captured at 60Hz over 3s → resample to 60
    const raw = Array.from({ length: 180 }, (_, i) =>
      Array.from({ length: 126 }, (_, f) => i * 126 + f),
    );
    const result = resampleSequence(raw, 60);
    expect(result).toHaveLength(60);
    expect(result[0]).toHaveLength(126);
  });

  it('returns exactly targetLen frames for a shorter input', () => {
    // Only 20 raw frames → upsample to 60
    const raw = Array.from({ length: 20 }, (_, i) =>
      Array.from({ length: 126 }, (_, f) => i + f * 0.01),
    );
    const result = resampleSequence(raw, 60);
    expect(result).toHaveLength(60);
  });

  it('returns exactly targetLen frames when input already matches', () => {
    const raw = Array.from({ length: 60 }, (_, i) =>
      Array.from({ length: 126 }, () => i),
    );
    const result = resampleSequence(raw, 60);
    expect(result).toHaveLength(60);
  });

  // ── Boundary preservation ──────────────────────────────────────────────────

  it('preserves the first frame exactly at the start', () => {
    const first = Array.from({ length: 126 }, (_, f) => f * 1.23);
    const raw = [first, ...Array.from({ length: 99 }, () => new Array(126).fill(0))];
    const result = resampleSequence(raw, 60);

    for (let f = 0; f < 126; f++) {
      expect(result[0][f]).toBeCloseTo(first[f], 10);
    }
  });

  it('preserves the last frame exactly at the end', () => {
    const last = Array.from({ length: 126 }, (_, f) => f * 7.77);
    const raw = [
      ...Array.from({ length: 99 }, () => new Array(126).fill(0)),
      last,
    ];
    const result = resampleSequence(raw, 60);

    for (let f = 0; f < 126; f++) {
      expect(result[59][f]).toBeCloseTo(last[f], 10);
    }
  });

  // ── Interpolation correctness ──────────────────────────────────────────────

  it('interpolates linearly between frames (ramp input)', () => {
    // Create a simple ramp: frame i has all features set to i
    const N = 100;
    const raw = Array.from({ length: N }, (_, i) =>
      new Array(126).fill(i),
    );
    const result = resampleSequence(raw, 60);

    // The midpoint output frame should map to the midpoint of the input range
    // Output index 30 (of 60) → normalised pos = 30/59 → source pos = (30/59)*99 ≈ 50.34
    // Feature value should be ≈ 50.34
    const midVal = result[30][0];
    const expected = (30 / 59) * (N - 1);
    expect(midVal).toBeCloseTo(expected, 5);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns zero-filled frames when input is empty', () => {
    const result = resampleSequence([], 60);
    expect(result).toHaveLength(60);
    for (const frame of result) {
      expect(frame).toHaveLength(126);
      expect(frame.every((v) => v === 0)).toBe(true);
    }
  });

  it('replicates a single frame to fill the entire sequence', () => {
    const single = Array.from({ length: 126 }, (_, f) => f * 3.14);
    const result = resampleSequence([single], 60);
    expect(result).toHaveLength(60);

    for (const frame of result) {
      for (let f = 0; f < 126; f++) {
        expect(frame[f]).toBeCloseTo(single[f], 10);
      }
    }
  });

  it('works with a non-default target length', () => {
    const raw = Array.from({ length: 50 }, (_, i) =>
      new Array(4).fill(i),
    );
    const result = resampleSequence(raw, 30);
    expect(result).toHaveLength(30);
    expect(result[0]).toHaveLength(4);
    // First and last should match
    expect(result[0][0]).toBeCloseTo(0, 10);
    expect(result[29][0]).toBeCloseTo(49, 10);
  });
});
