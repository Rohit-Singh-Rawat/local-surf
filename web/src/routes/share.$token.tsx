import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Download, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { FileIcon } from '@/components/drive/FileIcon'
import type { DriveFile } from '@/types/drive'

interface PublicShareResponse {
  file: DriveFile
  viewUrl: string
  downloadUrl: string | null
  permission: 'view' | 'download'
}

function isPreviewable(mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | false {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return false
}

export const Route = createFileRoute('/share/$token')({
  component: PublicSharePage,
})

function PublicSharePage() {
  const { token } = Route.useParams()

  const { data, isPending, isError } = useQuery({
    queryKey: ['shares', 'public', token],
    queryFn: () => api.get<PublicShareResponse>(`/api/shares/public/${token}`),
  })

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <p className="text-lg font-normal text-foreground">Link not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This link may have expired or been revoked.
          </p>
        </div>
      </div>
    )
  }

  const preview = isPreviewable(data.file.mimeType)

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background px-4 py-6 md:py-8">
      <div className="w-full max-w-3xl space-y-4 md:space-y-6">
        {/* Preview area */}
        {preview === 'image' && data.viewUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={data.viewUrl}
              alt={data.file.name}
              className="max-h-[60vh] md:max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
        {preview === 'pdf' && data.viewUrl && (
          <div className="h-[60vh] md:h-[70vh] overflow-hidden rounded-xl border border-border bg-card">
            <iframe
              src={data.viewUrl}
              title={data.file.name}
              className="h-full w-full border-0"
            />
          </div>
        )}
        {preview === 'video' && data.viewUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-card bg-black">
            <video src={data.viewUrl} controls className="w-full max-h-[70vh]" />
          </div>
        )}
        {preview === 'audio' && data.viewUrl && (
          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            <audio src={data.viewUrl} controls className="w-full" />
          </div>
        )}

        {/* File info card */}
        <div className="flex flex-col gap-4 rounded-xl md:rounded-2xl border border-border bg-card p-4 md:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-muted">
              <FileIcon mimeType={data.file.mimeType} size={20} className="text-muted-foreground md:size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm md:text-base font-normal text-foreground" title={data.file.name}>{data.file.name}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!preview && data.viewUrl && (
              <a
                href={data.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg md:rounded-xl border border-border bg-background px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:bg-muted"
              >
                <ExternalLink size={14} className="md:size-[15px]" />
                Open
              </a>
            )}
            {data.downloadUrl ? (
              <a
                href={data.downloadUrl}
                download={data.file.name}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg md:rounded-xl bg-primary px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-normal text-primary-foreground transition hover:opacity-90"
              >
                <Download size={14} className="md:size-[15px]" />
                Download
              </a>
            ) : (
              <span className="w-full sm:w-auto text-center rounded-lg md:rounded-xl border border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs text-muted-foreground">
                View only — download not permitted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
