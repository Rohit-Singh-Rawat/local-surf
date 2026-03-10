import { Outlet, createFileRoute } from '@tanstack/react-router'
import { guardPublic } from '@/lib/auth-guards'

export const Route = createFileRoute('/_public')({
  beforeLoad: ({ context }) => guardPublic(context),
  component: () => <Outlet />,
})
