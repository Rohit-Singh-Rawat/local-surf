import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const hasSessionCookie = createServerFn().handler(() => {
  const req = getRequest()
  if (!req) return false
  return req.headers.get('cookie')?.includes('ls_session=1') ?? false
})
