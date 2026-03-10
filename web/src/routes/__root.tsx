import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryProvider from '@/integrations/tanstack-query/root-provider'
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'

import { authStore } from '@/store/auth'

interface RouterContext {
  queryClient: QueryClient
  auth: typeof authStore
  authPromise: Promise<boolean>
}

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

import { useEffect } from 'react'
import { resolveAuth, setAuth, clearAuth } from '@/store/auth'
import { api } from '@/lib/api'
import type { AuthUser } from '@/store/auth'

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const authenticate = async () => {
      if (authStore.state.accessToken) {
        return resolveAuth(true)
      }
      
      if (!document.cookie.includes('ls_session=1')) {
        clearAuth()
        return resolveAuth(false)
      }

      try {
        const user = await api.get<AuthUser>('/api/users/me')
        const token = authStore.state.accessToken
        if (token) {
          setAuth(user, token)
          resolveAuth(true)
        } else {
          clearAuth()
          resolveAuth(false)
        }
      } catch {
        clearAuth()
        resolveAuth(false)
      }
    }

    authenticate()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]" suppressHydrationWarning>
        <TanStackQueryProvider>
          {children}
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
              TanStackQueryDevtools,
            ]}
          />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
