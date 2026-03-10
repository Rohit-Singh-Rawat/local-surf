import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { setSessionCookie } from '@/lib/session-cookie'
import { type AuthUser, setAuth, clearAuth } from '@/store/auth'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    // Server sends a short-lived opaque code, not the JWT, to keep tokens out of URLs.
    code: typeof search.code === 'string' ? search.code : null,
  }),
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const { code } = Route.useSearch()
  const navigate = useNavigate()
  // Guard against React Strict Mode double-invocation
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    if (!code) {
      navigate({ to: '/login', replace: true })
      return
    }

    // Exchange the one-time code. The server sets the access_token as an httpOnly cookie;
    // this response has no body — the client never touches the raw JWT.
    api
      .post<void>('/api/auth/exchange', { code })
      .then(() => api.get<AuthUser>('/api/users/me'))
      .then((user) => {
        setSessionCookie()
        setAuth(user)
        navigate({ to: '/drive', replace: true })
      })
      .catch(() => {
        clearAuth()
        navigate({ to: '/login', replace: true })
      })
  }, [code, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  )
}
