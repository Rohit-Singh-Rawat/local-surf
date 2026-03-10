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
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Preview area */}
        {preview === 'image' && data.viewUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={data.viewUrl}
              alt={data.file.name}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
        {preview === 'pdf' && data.viewUrl && (
          <div className="h-[70vh] overflow-hidden rounded-xl border border-border bg-card">
            <iframe
              src={data.viewUrl}
              title={data.file.name}
              className="h-full w-full"
            />
          </div>
        )}
        {preview === 'video' && data.viewUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <video src={data.viewUrl} controls className="w-full" />
          </div>
        )}
        {preview === 'audio' && data.viewUrl && (
          <div className="rounded-xl border border-border bg-card p-6">
            <audio src={data.viewUrl} controls className="w-full" />
          </div>
        )}

        {/* File info card */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
              <FileIcon mimeType={data.file.mimeType} size={24} className="text-muted-foreground" />
            </div>
            <div>
              <h1 className="truncate text-base font-normal text-foreground">{data.file.name}</h1>
              <p className="text-sm text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-center gap-2 sm:justify-end">
            {!preview && data.viewUrl && (
              <a
                href={data.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                <ExternalLink size={15} />
                Open
              </a>
            )}
            {data.downloadUrl ? (
              <a
                href={data.downloadUrl}
                download={data.file.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-normal text-primary-foreground transition hover:opacity-90"
              >
                <Download size={15} />
                Download
              </a>
            ) : (
              <span className="rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                View only — download not permitted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
