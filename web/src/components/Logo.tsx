import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface LogoIconProps {
  width?: number
  height?: number
  className?: string
}

export function LogoIcon({ width = 32, height = 38, className }: LogoIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 52 61"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M25.7584 43.8363C19.797 43.8363 14.7937 41.8136 10.7485 37.7684C6.91616 33.5102 5 28.507 5 22.7585C5 16.797 6.91616 11.9002 10.7485 8.06787C14.7937 4.02262 19.797 2 25.7584 2C31.7199 2 36.6167 4.02262 40.449 8.06787C44.4943 11.9002 46.5169 16.797 46.5169 22.7585C46.5169 28.507 44.4943 33.5102 40.449 37.7684C36.6167 41.8136 31.7199 43.8363 25.7584 43.8363Z"
        fill="#FF0000"
      />
      <path d="M26 20L52 61H0L26 20Z" fill="#4D00FF" />
    </svg>
  )
}

interface LogoProps {
  iconOnly?: boolean
  className?: string
  iconWidth?: number
  iconHeight?: number
  textClassName?: string
}

export function Logo({ 
  iconOnly = false, 
  className, 
  iconWidth = 24, 
  iconHeight = 28,
  textClassName 
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon width={iconWidth} height={iconHeight} />
      {!iconOnly && (
        <span className={cn("text-xl font-normal tracking-tight text-foreground", textClassName)}>
          LocalSurf
        </span>
      )}
    </div>
  )

  return (
    <Link 
      to="/" 
      className="no-underline hover:opacity-80 transition-opacity"
      activeOptions={{ exact: true }}
    >
      {content}
    </Link>
  )
}
