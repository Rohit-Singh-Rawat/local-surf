const SESSION_COOKIE = 'ls_session'
const MAX_AGE_DAYS = 7

export function setSessionCookie() {
  if (typeof window === 'undefined') return
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearSessionCookie() {
  if (typeof window === 'undefined') return
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
