import { useQuery } from '@tanstack/react-query'
import { Download, ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { FileIcon } from '@/components/drive/FileIcon'
import { useFilePreview } from '@/contexts/file-preview'
import type { DriveFile } from '@/types/drive'

interface SharedFileResponse {
  file: DriveFile
  permission: 'view' | 'download'
  viewUrl: string
  downloadUrl: string | null
}

function isPreviewable(mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | false {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.startsWith('video/')) return 'video'
  if (mimeType?.startsWith('audio/')) return 'audio'
  return false
}

export function FilePreviewModal() {
  const { open, payload, closePreview } = useFilePreview()

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['file-preview', payload?.source, payload?.source === 'own' ? payload.file.id : payload?.source === 'shared' ? payload.shareId : null],
    queryFn: async () => {
      if (!payload) return null
      if (payload.source === 'own') {
        const [viewRes, downloadRes] = await Promise.all([
          api.get<{ file: DriveFile; viewUrl: string }>(`/api/files/${payload.file.id}/view`),
          api.get<{ downloadUrl: string }>(`/api/files/${payload.file.id}/download`),
        ])
        return {
          file: viewRes.file,
          viewUrl: viewRes.viewUrl,
          downloadUrl: downloadRes.downloadUrl,
          permission: 'download' as const,
        }
      }
      return api.get<SharedFileResponse>(`/api/shares/${payload.shareId}/access`)
    },
    enabled: open && payload !== null,
  })

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview()
    },
    [closePreview],
  )

  useEffect(() => {
    if (open) {
      refetch()
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, refetch, handleKeyDown])

  if (!payload) return null

  const file = payload.file
  const preview = isPreviewable(file.mimeType)
  const canDownload = data?.permission === 'download' && data?.downloadUrl
  const viewUrl = data?.viewUrl ?? null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) closePreview() }}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileIcon mimeType={file.mimeType} size={18} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-normal">{file.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canDownload && data.downloadUrl && (
              <a
                href={data.downloadUrl}
                download={file.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-normal transition hover:bg-muted"
              >
                <Download size={14} />
                Download
              </a>
            )}
            {!canDownload && preview && (
              <span className="text-xs text-muted-foreground">View only</span>
            )}
            <button
              type="button"
              onClick={closePreview}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview — takes all available height, width auto */}
        <div className="flex-1 min-h-0 flex flex-col overflow-auto bg-muted/30">
          {isPending && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
            </div>
          )}
          {isError && (
            <div className="flex flex-1 items-center justify-center text-sm text-destructive">
              Failed to load preview
            </div>
          )}
          {data && viewUrl && (
            <>
              {preview === 'image' && (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 bg-black/90">
                  <img
                    src={viewUrl}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              {preview === 'pdf' && (
                <div className="flex-1 min-h-0 w-full">
                  <iframe src={viewUrl} title={file.name} className="h-full w-full border-0" />
                </div>
              )}
              {preview === 'video' && (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-black/90 p-0">
                  <video src={viewUrl} controls className="h-full w-full object-contain" />
                </div>
              )}
              {preview === 'audio' && (
                <div className="flex justify-center p-8">
                  <audio src={viewUrl} controls className="w-full max-w-md" />
                </div>
              )}
              {!preview && (
                <div className="flex flex-col items-center justify-center gap-4 p-8">
                  <FileIcon mimeType={file.mimeType} size={48} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Preview not available</p>
                  <div className="flex gap-2">
                    {viewUrl && (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-normal transition hover:bg-muted"
                      >
                        <ExternalLink size={14} />
                        Open
                      </a>
                    )}
                    {canDownload && data.downloadUrl && (
                      <a
                        href={data.downloadUrl}
                        download={file.name}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-primary-foreground transition hover:opacity-90"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
