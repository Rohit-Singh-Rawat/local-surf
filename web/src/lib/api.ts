import { env } from '@/env'
import { authStore, clearAuth } from '@/store/auth'

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = { success: false; error: { code: string; message: string } }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null

    const json = (await res.json()) as ApiResponse<{ accessToken: string }>
    return json.success ? json.data.accessToken : null
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const store = authStore
  const token = store.state.accessToken

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  // Token expired — attempt one silent refresh
  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      store.setState((s) => ({ ...s, accessToken: newToken }))
      return request<T>(path, init, true)
    }
    clearAuth()
    throw new ApiError('UNAUTHORIZED', 'Session expired. Please sign in again.')
  }

  const json = (await res.json()) as ApiResponse<T>
  if (!json.success) throw new ApiError(json.error.code, json.error.message)
  return json.data
}

// Multipart upload — skips JSON Content-Type so fetch sets the right boundary
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const store = authStore
  const token = store.state.accessToken

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const json = (await res.json()) as ApiResponse<T>
  if (!json.success) throw new ApiError(json.error.code, json.error.message)
  return json.data
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),

  upload,
}
