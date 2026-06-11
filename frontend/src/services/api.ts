import axios from 'axios'
const api = axios.create({
baseURL: 'http://localhost:8000/api',
})
export interface PredictResponse {
top_sign: string
confidence: number
feedback: 'great' | 'okay' | 'retry'
top3: { sign: string; confidence: number }[]
}
export async function predictSign(
sequence: number[][]
): Promise<PredictResponse> {
const { data } = await api.post('/predict', { sequence })
return data
}
export async function login(username: string, password: string) {
const { data } = await api.post('/auth/login', { username, password })
return data
}
export async function register(
username: string, email: string, password: string
) {
const { data } = await api.post('/auth/register',
{ username, email, password })
return data
}