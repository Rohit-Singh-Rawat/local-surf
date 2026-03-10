import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/error')({
  component: AuthError,
})

function AuthError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-3xl">✕</div>
        <h1 className="text-lg font-normal text-foreground">Sign-in failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't sign you in with Google. Please try again.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-normal text-primary-foreground transition hover:opacity-90"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
