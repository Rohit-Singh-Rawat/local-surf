import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { type AuthUser, setAuth, clearAuth } from '@/store/auth'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : null,
  }),
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  // Guard against React Strict Mode double-invocation
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    if (!token) {
      navigate({ to: '/login', replace: true })
      return
    }

    // Temporarily store the token so api.get can attach it as Authorization header
    import('@/store/auth').then(({ authStore }) => {
      authStore.setState((s) => ({ ...s, accessToken: token }))

      api
        .get<AuthUser>('/api/users/me')
        .then((user) => {
          setAuth(user, token)
          navigate({ to: '/drive', replace: true })
        })
        .catch(() => {
          clearAuth()
          navigate({ to: '/login', replace: true })
        })
    })
  }, [token, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  )
}
