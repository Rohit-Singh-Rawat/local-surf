import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import type { authStore, authPromise } from '@/store/auth'
function hasSessionCookie() {
  const req = getRequest()
  if (!req) return false
  const cookieHeader = req.headers.get('cookie') || ''
  return cookieHeader.includes('ls_session=1')
}

export async function guardAuthenticated(ctx: {
  auth: typeof authStore
  authPromise: typeof authPromise
}) {
  if (typeof window === 'undefined') {
    if (!hasSessionCookie()) throw redirect({ to: '/login', replace: true })
    return
  }

  await ctx.authPromise

  if (!ctx.auth.state.accessToken) {
    throw redirect({ to: '/login', replace: true })
  }
}

export async function guardPublic(ctx: {
  auth: typeof authStore
  authPromise: typeof authPromise
}) {
  if (typeof window === 'undefined') {
    if (hasSessionCookie()) throw redirect({ to: '/drive', replace: true })
    return
  }

  await ctx.authPromise

  if (ctx.auth.state.accessToken) {
    throw redirect({ to: '/drive', replace: true })
  }
}
