import type { SignResult } from './api'

/** Keep in sync with backend/app/services/hint_rules.py */
export type HintClass = 'ok' | 'near_miss' | 'low_conf' | 'other'

const OKAY_CONFIDENCE = 0.6
const AUTO_HINT_STREAK = 2

export function classifyPracticeAttempt(
  targetSign: string,
  top3: SignResult[],
  confidence: number,
  okayConfidence = OKAY_CONFIDENCE,
): HintClass {
  const names = top3.map((row) => row.sign)
  const top = names[0] ?? ''
  if (top === targetSign && confidence >= okayConfidence) return 'ok'
  if (names.slice(1).includes(targetSign)) return 'near_miss'
  if (confidence < okayConfidence) return 'low_conf'
  return 'other'
}

export function shouldAutoHint(history: HintClass[], streak = AUTO_HINT_STREAK): boolean {
  if (streak < 1 || history.length < streak) return false
  const window = history.slice(-streak)
  const first = window[0]
  return (first === 'near_miss' || first === 'low_conf') && window.every((kind) => kind === first)
}
