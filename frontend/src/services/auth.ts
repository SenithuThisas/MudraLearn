import axios from 'axios'

const authApi = axios.create({
  baseURL: 'http://localhost:8000/api/auth',
  withCredentials: true,
})

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  username?: string
  auth_provider: 'google' | 'email'
  onboarding_complete: boolean
  is_new?: boolean
}

export interface AuthResponse {
  user: UserProfile
  access_token: string
}

export async function googleCallback(idToken: string): Promise<AuthResponse> {
  const { data } = await authApi.post('/google/callback', { id_token: idToken })
  return data
}

// Email-first branch point: does this email already have an account? Existing
// accounts go to the password login page; new emails go to the OTP signup flow.
export async function checkEmail(email: string): Promise<{ registered: boolean }> {
  const { data } = await authApi.post('/check-email', { email })
  return data
}

export async function requestOTP(email: string): Promise<{ message: string; expires_in_minutes: number }> {
  const { data } = await authApi.post('/email/request-otp', { email })
  return data
}

// Returning-user login with password only (no OTP). Establishes the same
// cookie session as completeSignup.
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await authApi.post('/login', { email, password })
  return data
}

export interface VerifyOTPResponse {
  signup_token: string
  email: string
  expires_in_minutes: number
}

// Verifying the OTP does NOT create an account or a session — it proves email
// ownership and returns a short-lived signup_token, exchanged later at
// completeSignup() together with the password/name/username.
export async function verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
  const { data } = await authApi.post('/email/verify-otp', { email, otp })
  return data
}

export async function completeSignup(
  signupToken: string,
  password: string,
  firstName: string,
  lastName: string,
  username: string,
): Promise<AuthResponse> {
  const { data } = await authApi.post('/complete-signup', {
    signup_token: signupToken,
    password,
    first_name: firstName,
    last_name: lastName,
    username,
  })
  return data
}

export async function checkUsername(u: string): Promise<{ available: boolean; error?: string }> {
  const { data } = await authApi.get('/username-available', { params: { u } })
  return data
}

export async function saveUsername(username: string): Promise<{ user: UserProfile }> {
  const { data } = await authApi.post('/onboarding/username', { username })
  return data
}

export async function logout(): Promise<void> {
  await authApi.post('/logout')
}

export async function getMe(): Promise<{ user: UserProfile }> {
  const { data } = await authApi.get('/me')
  return data
}

// Turn an axios error into a message the user can act on. Distinguishes
// "server unreachable / response blocked" (no err.response — network failure,
// CORS block, timeout) and unexpected 5xx from an actual 4xx rejection whose
// `detail` is the message to show. Without this, every failure used to render
// as the fallback (e.g. "Invalid code") and mask the real problem.
export function authErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { detail?: unknown } }; request?: unknown }
  if (!e?.response) {
    return "Can't reach the server. Please check your connection and try again."
  }
  const status = e.response.status ?? 0
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.'
  }
  const detail = e.response.data?.detail
  return typeof detail === 'string' && detail ? detail : fallback
}
