import { redirect } from '@tanstack/react-router'
import { hasSessionCookie } from './auth-functions'
import type { authStore, authPromise } from '@/store/auth'

export async function guardAuthenticated(ctx: {
  auth: typeof authStore
  authPromise: typeof authPromise
}) {
  if (typeof window === 'undefined') {
    const hasSession = await hasSessionCookie()
    if (!hasSession) throw redirect({ to: '/login', replace: true })
    return
  }

  await ctx.authPromise

  if (!ctx.auth.state.user) {
    throw redirect({ to: '/login', replace: true })
  }
}

export async function guardPublic(ctx: {
  auth: typeof authStore
  authPromise: typeof authPromise
}) {
  if (typeof window === 'undefined') {
    const hasSession = await hasSessionCookie()
    if (hasSession) throw redirect({ to: '/drive', replace: true })
    return
  }

  await ctx.authPromise

  if (ctx.auth.state.user) {
    throw redirect({ to: '/drive', replace: true })
  }
}
