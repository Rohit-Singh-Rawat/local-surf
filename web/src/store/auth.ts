import { Store } from '@tanstack/store'
import { clearSessionCookie } from '@/lib/session-cookie'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string | null
  storageUsed: number
  storageQuota: number
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
}

// Only non-sensitive user metadata is persisted for display purposes (name, avatar, etc.).
// The access token lives in an httpOnly cookie set by the server — the client never sees or
// stores it, making it invisible to XSS. The server also manages the ls_session indicator.
const USER_STORAGE_KEY = 'ls:user'

function loadUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const authStore = new Store<AuthState>({ user: loadUser() })

authStore.subscribe(() => {
  if (typeof window === 'undefined') return
  const { user } = authStore.state
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
})

export function setAuth(user: AuthUser) {
  authStore.setState(() => ({ user }))
}

export function clearAuth() {
  authStore.setState(() => ({ user: null }))
  localStorage.removeItem(USER_STORAGE_KEY)
  clearSessionCookie()
}

let authResolve: (val: boolean) => void
export let authPromise = new Promise<boolean>((resolve) => {
  authResolve = resolve
})

export function resolveAuth(isAuthenticated: boolean) {
  authResolve(isAuthenticated)
}

export function resetAuthPromise() {
  authPromise = new Promise<boolean>((resolve) => {
    authResolve = resolve
  })
}
