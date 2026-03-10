import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { FileIcon } from '@/components/drive/FileIcon'
import type { DriveFile } from '@/types/drive'

interface SharedFileAccessResponse {
  file: DriveFile
  viewUrl: string
  downloadUrl: string
}

function isPreviewable(mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | false {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return false
}

export const Route = createFileRoute('/_drive/drive/shared/$shareId')({
  component: SharedFileViewPage,
})

function SharedFileViewPage() {
  const { shareId } = Route.useParams()

  const { data, isPending, isError } = useQuery({
    queryKey: ['shares', 'access', shareId],
    queryFn: () => api.get<SharedFileAccessResponse>(`/api/shares/${shareId}/access`),
  })

  if (isPending) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-base font-normal text-foreground">File not found</p>
        <Link
          to="/drive/shared"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Shared with me
        </Link>
      </div>
    )
  }

  const preview = isPreviewable(data.file.mimeType)

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        to="/drive/shared"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Shared with me
      </Link>

      <div className="space-y-6">
        {preview === 'image' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={data.viewUrl}
              alt={data.file.name}
              className="max-h-[65vh] w-full object-contain"
            />
          </div>
        )}
        {preview === 'pdf' && (
          <div className="h-[65vh] overflow-hidden rounded-xl border border-border bg-card">
            <iframe src={data.viewUrl} title={data.file.name} className="h-full w-full" />
          </div>
        )}
        {preview === 'video' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <video src={data.viewUrl} controls className="w-full" />
          </div>
        )}
        {preview === 'audio' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <audio src={data.viewUrl} controls className="w-full" />
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileIcon mimeType={data.file.mimeType} size={20} className="text-muted-foreground" />
            </div>
            <div>
              <h1 className="truncate font-normal text-foreground">{data.file.name}</h1>
              <p className="text-sm text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!preview && (
              <a
                href={data.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-normal transition hover:bg-muted"
              >
                <ExternalLink size={14} />
                Open
              </a>
            )}
            <a
              href={data.downloadUrl}
              download={data.file.name}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-primary-foreground transition hover:opacity-90"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
