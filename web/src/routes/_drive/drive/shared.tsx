import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_drive/drive/shared')({
  component: SharedLayout,
})

function SharedLayout() {
  return <Outlet />
}
