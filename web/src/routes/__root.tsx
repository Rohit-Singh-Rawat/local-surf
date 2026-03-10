import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import TanStackQueryProvider from '@/integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { authStore, resolveAuth, setAuth, clearAuth } from '@/store/auth'
import { api } from '@/lib/api'
import type { AuthUser } from '@/store/auth'

interface RouterContext {
  queryClient: QueryClient
  auth: typeof authStore
  authPromise: Promise<boolean>
}

// Dev tools are lazy-loaded so they are excluded from the production bundle entirely.
// Vite dead-code-eliminates the import when import.meta.env.DEV is false.
const DevTools = import.meta.env.DEV
  ? lazy(() => import('./__dev-tools'))
  : null

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-normal">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LocalSurf — Your files, everywhere.' },
      { name: 'description', content: 'LocalSurf — Your files, everywhere. Upload, organise and share files from any device. Fast, private cloud storage.' },
      { name: 'application-name', content: 'LocalSurf' },
      { name: 'apple-mobile-web-app-title', content: 'LocalSurf' },
      { name: 'theme-color', content: '#4D00FF' },
      { name: 'msapplication-TileColor', content: '#4D00FF' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'LocalSurf — Your files, everywhere.' },
      { property: 'og:description', content: 'Upload, organise and share files from any device. Fast, private cloud storage.' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'LocalSurf' },
      { name: 'twitter:description', content: 'Your files, everywhere. Fast, private cloud storage.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '192x192', href: '/logo192.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The access token is an httpOnly cookie — the browser sends it automatically.
    // On page load we just call /api/users/me. If the token is expired, the api
    // client fires one silent refresh (singleton promise — safe under concurrent calls),
    // rotates both cookies, and retries. No manual token management needed here.
    const initAuth = async () => {
      if (!document.cookie.includes('ls_session=1')) {
        clearAuth()
        return resolveAuth(false)
      }

      try {
        const user = await api.get<AuthUser>('/api/users/me')
        setAuth(user)
        resolveAuth(true)
      } catch {
        clearAuth()
        resolveAuth(false)
      }
    }

    initAuth()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]" suppressHydrationWarning>
        <TanStackQueryProvider>
          {children}
          {DevTools && (
            <Suspense>
              <DevTools />
            </Suspense>
          )}
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
