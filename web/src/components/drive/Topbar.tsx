import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { CircleHelp, Settings, LayoutGrid, List, LogOut, Search, Settings2 } from 'lucide-react'
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
import { authStore, clearAuth } from '@/store/auth'
import { setViewMode, uiStore } from '@/store/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Topbar() {
  const user = useStore(authStore, (s) => s.user)
  const viewMode = useStore(uiStore, (s) => s.viewMode)
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync search input with URL when on search page
  const searchMatch = routerState.matches.find((m) => m.routeId === '/_drive/drive/search')
  const urlQ = (searchMatch?.search as { q?: string } | undefined)?.q ?? ''
  useEffect(() => {
    if (searchMatch && typeof urlQ === 'string') setQuery(urlQ)
  }, [searchMatch, urlQ])

  // '/' → focus search bar (when not already in an input)
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
    <header className="flex h-16 shrink-0 items-center gap-6 bg-transparent ">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex max-w-2xl flex-1">
        <label className="group flex flex-1 items-center gap-3 rounded-full bg-muted px-4 py-2.5 transition-all focus-within:bg-card focus-within:ring-1 focus-within:ring-border shadow-sm">
          <Search size={20} className="shrink-0 text-foreground/70" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in Drive"
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-foreground/70 outline-none"
          />
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors">
             <Settings2 size={20} className="text-foreground/70" />
          </button>
        </label>
      </form>

      <div className="flex flex-1 items-center justify-end gap-3">
        {/* Help & Settings */}
        <div className="flex items-center gap-1 mr-2">
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors">
            <CircleHelp size={22} />
          </button>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors">
            <Settings size={22} />
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5',
            )}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5',
            )}
          >
            <List size={18} />
          </button>
        </div>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring ml-2">
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
                <LogOut size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
