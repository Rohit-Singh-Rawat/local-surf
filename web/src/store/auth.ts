import { Store } from '@tanstack/store'

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
  accessToken: string | null
}

const STORAGE_KEY = 'ls:auth'

function loadState(): AuthState {
  if (typeof window === 'undefined') return { user: null, accessToken: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, accessToken: null }
    return JSON.parse(raw) as AuthState
  } catch {
    return { user: null, accessToken: null }
  }
}

export const authStore = new Store<AuthState>(loadState())

authStore.subscribe(() => {
  if (typeof window === 'undefined') return
  const { user, accessToken } = authStore.state
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }))

  if (accessToken) {
    document.cookie = `ls_session=1; path=/; max-age=604800; samesite=lax`
  } else {
    document.cookie = `ls_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
})

export function setAuth(user: AuthUser, accessToken: string) {
  authStore.setState(() => ({ user, accessToken }))
}

export function clearAuth() {
  authStore.setState(() => ({ user: null, accessToken: null }))
  localStorage.removeItem(STORAGE_KEY)
  if (typeof window !== 'undefined') {
    document.cookie = `ls_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
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
