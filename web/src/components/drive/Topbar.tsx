import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { LayoutGrid, List, LogOut, Menu, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { authStore, clearAuth } from '@/store/auth'
import { setViewMode, toggleSidebar, uiStore } from '@/store/ui'

export function Topbar() {
  const user = useStore(authStore, (s) => s.user)
  const viewMode = useStore(uiStore, (s) => s.viewMode)
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync search input with the URL query param when the user is on the search page
  const searchMatch = routerState.matches.find((m) => m.routeId === '/_drive/drive/search')
  const urlQ = (searchMatch?.search as { q?: string } | undefined)?.q ?? ''
  useEffect(() => {
    if (searchMatch && typeof urlQ === 'string') setQuery(urlQ)
  }, [searchMatch, urlQ])

  // Press '/' to focus the search bar (unless already in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate({ to: '/drive/search', search: { q: query.trim() } })
  }

  const handleLogout = async () => {
    await api.post('/api/auth/logout').catch(() => {})
    clearAuth()
    navigate({ to: '/login', replace: true })
  }

  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center gap-3 md:gap-6 bg-transparent">
      <div className="flex-1 flex items-center justify-start">
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={toggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted md:hidden"
        >
          <Menu size={22} aria-hidden />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex max-w-2xl flex-1" role="search">
          <label className="group flex flex-1 items-center gap-2 md:gap-3 rounded-full bg-muted px-3 md:px-4 py-1.5 md:py-2.5 transition-all focus-within:bg-card focus-within:ring-1 focus-within:ring-border shadow-sm">
            <Search size={18} className="shrink-0 text-foreground/70 md:size-5" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in Drive"
              aria-label="Search files"
              className="flex-1 bg-transparent text-sm md:text-base text-foreground placeholder:text-foreground/70 outline-none w-0"
            />
          </label>
        </form>
      </div>

      <div className="flex items-center justify-end gap-1.5 md:gap-3">
        {/* View mode toggle */}
        <div
          className="hidden xs:flex items-center gap-0.5 md:gap-1 rounded-full bg-muted p-1"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5',
            )}
          >
            <LayoutGrid size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5',
            )}
          >
            <List size={18} aria-hidden />
          </button>
        </div>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring ml-2"
            aria-label={`Account menu for ${user?.name ?? 'user'}`}
          >
            <Avatar size="default" className="h-9 w-9 border border-border sm:h-10 sm:w-10">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? 'User'} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-normal">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end" className="w-56 rounded-xl p-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-sm font-normal text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate font-normal mt-0.5">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2 rounded-lg text-foreground focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
