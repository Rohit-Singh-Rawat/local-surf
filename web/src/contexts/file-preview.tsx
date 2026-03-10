'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { DriveFile } from '@/types/drive'

export type FilePreviewSource = 'own' | 'shared'

interface OwnFilePreview {
  source: 'own'
  file: DriveFile
}

interface SharedFilePreview {
  source: 'shared'
  file: DriveFile
  shareId: string
}

export type FilePreviewPayload = OwnFilePreview | SharedFilePreview

interface FilePreviewContextValue {
  open: boolean
  payload: FilePreviewPayload | null
  openPreview: (p: FilePreviewPayload) => void
  closePreview: () => void
}

const FilePreviewContext = createContext<FilePreviewContextValue | null>(null)

export function FilePreviewProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<FilePreviewPayload | null>(null)

  const openPreview = useCallback((p: FilePreviewPayload) => {
    setPayload(p)
  }, [])

  const closePreview = useCallback(() => {
    setPayload(null)
  }, [])

  return (
    <FilePreviewContext.Provider
      value={{
        open: payload !== null,
        payload,
        openPreview,
        closePreview,
      }}
    >
      {children}
    </FilePreviewContext.Provider>
  )
}

export function useFilePreview() {
  const ctx = useContext(FilePreviewContext)
  if (!ctx) throw new Error('useFilePreview must be used within FilePreviewProvider')
  return ctx
}
