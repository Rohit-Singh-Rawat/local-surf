import { env } from '@/env'
import { setSessionCookie } from '@/lib/session-cookie'
import { clearAuth } from '@/store/auth'

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

// Singleton — if multiple requests 401 simultaneously (e.g. on page load or after token expiry)
// only ONE refresh is fired. All callers share the same promise and retry once it resolves.
// Without this, concurrent 401s each spawn their own refresh, and since the refresh token is
// single-use (atomic DELETE), only the first succeeds — the rest 401 and log the user out.
let pendingRefresh: Promise<boolean> | null = null

function silentRefresh(): Promise<boolean> {
  if (pendingRefresh) return pendingRefresh
  pendingRefresh = fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => {
      if (res.ok) setSessionCookie()
      return res.ok
    })
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null
    })
  return pendingRefresh
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  // The access token travels as an httpOnly cookie — the browser attaches it automatically.
  // We never read or store the raw JWT on the client side.
  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (res.status === 401 && !isRetry) {
    const ok = await silentRefresh()
    if (ok) return request<T>(path, init, true)
    clearAuth()
    throw new ApiError('UNAUTHORIZED', 'Session expired. Please sign in again.')
  }

  const text = await res.text()
  if (!text) return undefined as T
  const json = JSON.parse(text) as ApiResponse<T>
  if (!json.success) throw new ApiError(json.error.code, json.error.message)
  return json.data
}

// Multipart upload — skips JSON Content-Type so fetch sets the correct multipart boundary.
// Uses the same 401 → singleton refresh → retry pattern as request().
async function upload<T>(path: string, formData: FormData, isRetry = false): Promise<T> {
  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (res.status === 401 && !isRetry) {
    const ok = await silentRefresh()
    if (ok) return upload<T>(path, formData, true)
    clearAuth()
    throw new ApiError('UNAUTHORIZED', 'Session expired. Please sign in again.')
  }

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
