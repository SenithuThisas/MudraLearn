import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// ── Predict ──────────────────────────────────────────────────────────────────

export interface SignResult {
  sign:       string
  confidence: number
}

export interface MasteryInfo {
  sign_id:  string
  score:    number
  attempts: number
  tier:     number
}

export interface PredictResponse {
  top_sign:   string
  confidence: number
  correct:    boolean
  feedback:   'great' | 'okay' | 'retry'
  top3:       SignResult[]
  mastery:    MasteryInfo | null
}

export async function predictSign(
  sequence:    number[][],
  userId:      number,
  targetSign:  string,
  category:    string,
  responseMs:  number = 0,
): Promise<PredictResponse> {
  const { data } = await api.post('/predict', {
    sequence,
    user_id:     userId,
    target_sign: targetSign,
    category,
    response_ms: responseMs,
  })
  return data
}

// ── Session / Adaptive Engine ─────────────────────────────────────────────────

export interface NextSignResponse {
  sign:     string
  category: string
  mode:     'cold_start' | 'review' | 'new'
  mastery:  number | null
}

export async function getNextSign(userId: number): Promise<NextSignResponse> {
  const { data } = await api.get('/session/next', { params: { user_id: userId } })
  return data
}

export interface MasteryRow {
  sign_id:   string
  score:     number
  attempts:  number
  tier:      number
  last_seen: string | null
}

export async function getMastery(userId: number): Promise<{ signs: MasteryRow[]; total: number }> {
  const { data } = await api.get('/session/mastery', { params: { user_id: userId } })
  return data
}

// ── Progress history ──────────────────────────────────────────────────────────

export async function getProgressHistory(userId: number, limit = 50) {
  const { data } = await api.get('/progress/history', { params: { user_id: userId, limit } })
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string) {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export async function register(username: string, email: string, password: string) {
  const { data } = await api.post('/auth/register', { username, email, password })
  return data
}