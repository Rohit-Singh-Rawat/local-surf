import { Store } from '@tanstack/store'
import type { ViewMode } from '@/types/drive'

interface UiState {
  viewMode: ViewMode
  sidebarOpen: boolean
}

const STORAGE_KEY = 'ls:ui'

function loadState(): UiState {
  if (typeof window === 'undefined') return { viewMode: 'grid', sidebarOpen: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { viewMode: 'grid', sidebarOpen: false }
    const state = JSON.parse(raw) as UiState
    return { ...state, sidebarOpen: false } // Always start with sidebar closed on reload
  } catch {
    return { viewMode: 'grid', sidebarOpen: false }
  }
}

export const uiStore = new Store<UiState>(loadState())

uiStore.subscribe(() => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uiStore.state))
})

export function setViewMode(mode: ViewMode) {
  uiStore.setState((s) => ({ ...s, viewMode: mode }))
}

export function setSidebarOpen(open: boolean) {
  uiStore.setState((s) => ({ ...s, sidebarOpen: open }))
}

export function toggleSidebar() {
  uiStore.setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen }))
}
