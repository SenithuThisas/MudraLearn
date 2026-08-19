import { api, type SignResult, type MasteryInfo } from './api'

export type BatchStatus = 'locked' | 'in_progress' | 'needs_review' | 'completed'
export type Verdict = 'great' | 'okay' | 'retry'

export interface PracticeBatchCard {
  batchId: number
  levelNumber: number
  tier: number
  tierLabel: string
  title: string
  signIds: string[]
  signCount: number
  status: BatchStatus
  bestScore: number
  attempts: number
  practicedCount: number
  challengeUnlocked: boolean
}

export interface PracticeMap {
  batches: PracticeBatchCard[]
  continueBatchId: number | null
}

export interface OverviewSign {
  signId: string
  category: string
  practiced: boolean
  unlocked: boolean
  review: boolean
}

export interface BatchOverview {
  batchId: number
  levelNumber: number
  tier: number
  tierLabel: string
  title: string
  status: BatchStatus
  bestScore: number
  practicedCount: number
  challengeUnlocked: boolean
  signs: OverviewSign[]
  nextPracticeSignId: string | null
}

export interface SignAttemptResult {
  verdict: Verdict
  confidence: number
  topSign: string
  top3: SignResult[]
  hintUsed: boolean
  xp: number
  correct: boolean
  rerecord?: {
    verdict: Verdict
    confidence: number
    topSign: string
    top3: SignResult[]
  }
}

export interface BatchResult {
  score: number
  total: number
  passed: boolean
  signXp: number
  bonusXp: number
  streakXp: number
  totalXp: number
  bonuses: { reason: string; amount: number }[]
  hintsUsed: number
  fromNeedsReview: boolean
  tierUp: string | null
  nextBatchId: number | null
  failedSigns: string[]
}

export interface ChallengeState {
  batchId: number
  levelNumber: number
  tierLabel: string
  title: string
  status: BatchStatus
  order: string[]
  index: number
  currentSignId: string | null
  currentResult: SignAttemptResult | null
  hintPending: boolean
  results: Record<string, SignAttemptResult>
  done: boolean
  batchResult: BatchResult | null
  fromNeedsReview: boolean
  verdict?: Verdict
  confidence?: number
  topSign?: string
  top3?: SignResult[]
  xpAwarded?: number
  mastery?: MasteryInfo | null
  scored?: boolean
}

function mapCard(raw: Record<string, unknown>): PracticeBatchCard {
  return {
    batchId: Number(raw.batch_id),
    levelNumber: Number(raw.level_number),
    tier: Number(raw.tier),
    tierLabel: String(raw.tier_label),
    title: String(raw.title),
    signIds: (raw.sign_ids as string[]) ?? [],
    signCount: Number(raw.sign_count),
    status: raw.status as BatchStatus,
    bestScore: Number(raw.best_score ?? 0),
    attempts: Number(raw.attempts ?? 0),
    practicedCount: Number(raw.practiced_count ?? 0),
    challengeUnlocked: Boolean(raw.challenge_unlocked),
  }
}

function mapSign(raw: Record<string, unknown>): OverviewSign {
  return {
    signId: String(raw.sign_id),
    category: String(raw.category),
    practiced: Boolean(raw.practiced),
    unlocked: Boolean(raw.unlocked),
    review: Boolean(raw.review),
  }
}

function mapOverview(raw: Record<string, unknown>): BatchOverview {
  return {
    batchId: Number(raw.batch_id),
    levelNumber: Number(raw.level_number),
    tier: Number(raw.tier),
    tierLabel: String(raw.tier_label),
    title: String(raw.title),
    status: raw.status as BatchStatus,
    bestScore: Number(raw.best_score ?? 0),
    practicedCount: Number(raw.practiced_count ?? 0),
    challengeUnlocked: Boolean(raw.challenge_unlocked),
    signs: ((raw.signs as Record<string, unknown>[]) ?? []).map(mapSign),
    nextPracticeSignId: (raw.next_practice_sign_id as string | null) ?? null,
  }
}

function mapAttempt(raw: Record<string, unknown> | null | undefined): SignAttemptResult | null {
  if (!raw) return null
  const rerecordRaw = raw.rerecord as Record<string, unknown> | undefined
  return {
    verdict: raw.verdict as Verdict,
    confidence: Number(raw.confidence ?? 0),
    topSign: String(raw.top_sign ?? ''),
    top3: (raw.top3 as SignResult[]) ?? [],
    hintUsed: Boolean(raw.hint_used),
    xp: Number(raw.xp ?? 0),
    correct: Boolean(raw.correct),
    rerecord: rerecordRaw
      ? {
          verdict: rerecordRaw.verdict as Verdict,
          confidence: Number(rerecordRaw.confidence ?? 0),
          topSign: String(rerecordRaw.top_sign ?? ''),
          top3: (rerecordRaw.top3 as SignResult[]) ?? [],
        }
      : undefined,
  }
}

function mapBatchResult(raw: Record<string, unknown> | null | undefined): BatchResult | null {
  if (!raw) return null
  return {
    score: Number(raw.score),
    total: Number(raw.total),
    passed: Boolean(raw.passed),
    signXp: Number(raw.sign_xp ?? 0),
    bonusXp: Number(raw.bonus_xp ?? 0),
    streakXp: Number(raw.streak_xp ?? 0),
    totalXp: Number(raw.total_xp ?? 0),
    bonuses: ((raw.bonuses as { reason: string; amount: number }[]) ?? []),
    hintsUsed: Number(raw.hints_used ?? 0),
    fromNeedsReview: Boolean(raw.from_needs_review),
    tierUp: (raw.tier_up as string | null) ?? null,
    nextBatchId: (raw.next_batch_id as number | null) ?? null,
    failedSigns: (raw.failed_signs as string[]) ?? [],
  }
}

function mapChallenge(raw: Record<string, unknown>): ChallengeState {
  const resultsRaw = (raw.results as Record<string, Record<string, unknown>>) ?? {}
  const results: Record<string, SignAttemptResult> = {}
  for (const [signId, row] of Object.entries(resultsRaw)) {
    const mapped = mapAttempt(row)
    if (mapped) results[signId] = mapped
  }
  return {
    batchId: Number(raw.batch_id),
    levelNumber: Number(raw.level_number),
    tierLabel: String(raw.tier_label),
    title: String(raw.title),
    status: raw.status as BatchStatus,
    order: (raw.order as string[]) ?? [],
    index: Number(raw.index ?? 0),
    currentSignId: (raw.current_sign_id as string | null) ?? null,
    currentResult: mapAttempt(raw.current_result as Record<string, unknown> | null),
    hintPending: Boolean(raw.hint_pending),
    results,
    done: Boolean(raw.done),
    batchResult: mapBatchResult(raw.batch_result as Record<string, unknown> | null),
    fromNeedsReview: Boolean(raw.from_needs_review),
    verdict: raw.verdict as Verdict | undefined,
    confidence: raw.confidence as number | undefined,
    topSign: raw.top_sign as string | undefined,
    top3: raw.top3 as SignResult[] | undefined,
    xpAwarded: raw.xp_awarded as number | undefined,
    mastery: (raw.mastery as MasteryInfo | null) ?? null,
    scored: raw.scored as boolean | undefined,
  }
}

export function practiceErrorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

export async function getPracticeMap(): Promise<PracticeMap> {
  const { data } = await api.get('/practice/map')
  return {
    batches: (data.batches ?? []).map(mapCard),
    continueBatchId: data.continue_batch_id ?? null,
  }
}

export async function getPracticeContinue(): Promise<number | null> {
  const { data } = await api.get('/practice/continue')
  return data.batch_id ?? data.batchId ?? null
}

export async function getBatchOverview(batchId: number): Promise<BatchOverview> {
  const { data } = await api.get(`/practice/batches/${batchId}`)
  return mapOverview(data)
}

export async function markSignPracticed(batchId: number, signId: string): Promise<BatchOverview> {
  const { data } = await api.post(`/practice/batches/${batchId}/practiced`, { sign_id: signId })
  return mapOverview(data)
}

export async function restartBatch(batchId: number): Promise<BatchOverview> {
  const { data } = await api.post(`/practice/batches/${batchId}/restart`)
  return mapOverview(data)
}

export async function startChallenge(batchId: number): Promise<ChallengeState> {
  const { data } = await api.post(`/practice/batches/${batchId}/challenge/start`)
  return mapChallenge(data)
}

export async function getChallenge(batchId: number): Promise<ChallengeState> {
  const { data } = await api.get(`/practice/batches/${batchId}/challenge`)
  return mapChallenge(data)
}

export async function useChallengeHint(batchId: number): Promise<ChallengeState> {
  const { data } = await api.post(`/practice/batches/${batchId}/challenge/hint`)
  return mapChallenge(data)
}

export async function skipChallengeRetry(batchId: number): Promise<ChallengeState> {
  const { data } = await api.post(`/practice/batches/${batchId}/challenge/skip`)
  return mapChallenge(data)
}

export async function submitChallengeAttempt(
  batchId: number,
  signId: string,
  sequence: number[][],
  responseMs: number,
): Promise<ChallengeState> {
  const { data } = await api.post(`/practice/batches/${batchId}/challenge/attempt`, {
    sign_id: signId,
    sequence,
    response_ms: responseMs,
  })
  return mapChallenge(data)
}
