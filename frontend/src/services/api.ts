import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends the httpOnly session cookie automatically
})

// If a protected data call comes back 401 (session expired mid-use), send the
// user to sign in. Guarded so we never loop while already on an auth page.
// The auth service (getMe) is intentionally NOT wrapped: a 401 there is the
// normal "not logged in yet" signal that AuthContext handles on load.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      const onAuthPage = ['/signin', '/verify-email', '/onboarding'].some((p) =>
        path.startsWith(p),
      )
      if (!onAuthPage) {
        window.location.assign('/signin')
      }
    }
    return Promise.reject(error)
  },
)

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
  userId:      number | string,
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

export async function getNextSign(userId: number | string): Promise<NextSignResponse> {
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

export async function getMastery(userId: number | string): Promise<{ signs: MasteryRow[]; total: number }> {
  const { data } = await api.get('/session/mastery', { params: { user_id: userId } })
  return data
}

// ── Progress history ──────────────────────────────────────────────────────────

export async function getProgressHistory(userId: number | string, limit = 50) {
  const { data } = await api.get('/progress/history', { params: { user_id: userId, limit } })
  return data
}

// Auth lives in services/auth.ts — this app uses the passwordless OTP + Google
// cookie flow, not username/password. The old login()/register() helpers pointed
// at backend routes that do not exist and have been removed.