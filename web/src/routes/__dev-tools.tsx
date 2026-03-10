// Dev-only debug panels — this file is never imported in production builds.
// Separated so Vite/Rollup can exclude it from the production bundle entirely.
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'

export default function DevTools() {
  return (
    <TanStackDevtools
      config={{ position: 'bottom-right' }}
      plugins={[
        { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
        TanStackQueryDevtools,
      ]}
    />
  )
}
