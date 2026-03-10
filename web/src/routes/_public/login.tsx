import { Link, createFileRoute } from '@tanstack/react-router'
import { Logo } from '@/components/Logo'
import { env } from '@/env'

export const Route = createFileRoute('/_public/login')({
  component: LoginPage,
})


function LoginPage() {
  const handleGoogleSignIn = () => {
    window.location.href = `${env.VITE_API_URL}/api/auth/google`
  }

  return (
    <div className="flex min-h-screen w-full   overflow-hidden bg-background">
      {/* Left: auth panel - taking remaining width */}
      <div className="z-10 flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-12">
            <Logo />
          </div>

          <h1 className="display-title mb-2 text-3xl font-normal text-foreground">
            Welcome back
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Sign in to continue to your files.
          </p>

          {/* Google sign-in button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-normal text-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="text-foreground underline underline-offset-2">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-foreground underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </p>

          <div className="mt-10 border-t border-border pt-6 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground no-underline transition hover:text-foreground"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Full-height image "stuck" to the right */}
      <div className="hidden xl:flex shrink-0 bg-secondary/30">
        <div className="rise-in h-screen overflow-hidden">
          <img 
            src="/images/auth.png" 
            alt="LocalSurf Interface Preview" 
            className="h-full w-auto object-cover object-left shadow-2xl"
          />
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}
