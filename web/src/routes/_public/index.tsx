import { Link, createFileRoute } from '@tanstack/react-router'
import { Logo } from '@/components/Logo'

export const Route = createFileRoute('/_public/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500">
      {/* Top Navigation */}
      <header className="flex h-20 items-center justify-between px-8 sm:px-12">
        <Logo />
        <nav className="flex items-center gap-8 text-sm font-normal">
          <Link to="/" className="hover:opacity-60 transition-opacity">Home</Link>
          <Link to="/login" className="hover:opacity-60 transition-opacity">Login</Link>
          <Link to="/drive" className="hover:opacity-60 transition-opacity">App</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Contact Us</a>
        </nav>
      </header>

      {/* Main Content (Central CTA) */}
      <main className="flex flex-1 flex-col items-center justify-center -mt-20 px-6 text-center">
        <div className="rise-in max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-[12vw] font-normal leading-tight tracking-tight sm:text-[80px]">
              Your files, everywhere.
            </h1>
            <p className="text-[18px] opacity-60 font-normal">
              Secure, private, and ultra-fast cloud storage for the modern web.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/login" 
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-[16px] font-normal text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Sign in to Drive
            </Link>
            <Link 
              to="/drive" 
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-8 text-[16px] font-normal transition-all hover:bg-muted active:scale-[0.98]"
            >
              Open Web App
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="px-8 pb-10 sm:px-12">
        <div className="flex items-center justify-between text-[11px] opacity-30 uppercase tracking-[0.2em] font-normal">
          <span>&copy; 2026 LocalSurf</span>
          <span>Fast &bull; Private &bull; Secure</span>
        </div>
      </footer>
    </div>
  )
}
