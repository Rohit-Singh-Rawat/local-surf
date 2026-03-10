import { Store } from '@tanstack/store'
import type { ViewMode } from '@/types/drive'

interface UiState {
  viewMode: ViewMode
}

const STORAGE_KEY = 'ls:ui'

function loadState(): UiState {
  if (typeof window === 'undefined') return { viewMode: 'grid' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { viewMode: 'grid' }
    return JSON.parse(raw) as UiState
  } catch {
    return { viewMode: 'grid' }
  }
}

export const uiStore = new Store<UiState>(loadState())

uiStore.subscribe(() => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uiStore.state))
})

export function setViewMode(mode: ViewMode) {
  uiStore.setState(() => ({ viewMode: mode }))
}
