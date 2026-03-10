'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { DriveFile } from '@/types/drive'

interface ShareDialogContextValue {
  open: boolean
  file: DriveFile | null
  openShareDialog: (file: DriveFile) => void
  closeShareDialog: () => void
}

const ShareDialogContext = createContext<ShareDialogContextValue | null>(null)

export function ShareDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<DriveFile | null>(null)

  const openShareDialog = useCallback((f: DriveFile) => {
    setFile(f)
    setOpen(true)
  }, [])

  const closeShareDialog = useCallback(() => {
    setOpen(false)
    setFile(null)
  }, [])

  return (
    <ShareDialogContext.Provider
      value={{ open, file, openShareDialog, closeShareDialog }}
    >
      {children}
    </ShareDialogContext.Provider>
  )
}

export function useShareDialog() {
  const ctx = useContext(ShareDialogContext)
  if (!ctx) throw new Error('useShareDialog must be used within ShareDialogProvider')
  return ctx
}
