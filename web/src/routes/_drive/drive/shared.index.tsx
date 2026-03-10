import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { formatBytes, formatDate } from '@/lib/format'
import { useFilePreview } from '@/contexts/file-preview'
import { EmptyState } from '@/components/drive/EmptyState'
import { FileIcon } from '@/components/drive/FileIcon'
import { PageHeader } from '@/components/drive/PageHeader'
import type { SharedWithMeItem } from '@/types/drive'

export const Route = createFileRoute('/_drive/drive/shared/')({
  component: SharedListPage,
})

function SharedListPage() {
  const { openPreview } = useFilePreview()
  const { data, isPending, isError } = useQuery({
    queryKey: ['shares', 'shared-with-me'],
    queryFn: () => api.get<SharedWithMeItem[]>('/api/shares/shared-with-me'),
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Shared with me" />

      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex h-12 animate-pulse items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
              <div className="h-7 w-7 rounded-md bg-muted/20" />
              <div className="h-4 flex-1 rounded-full bg-muted/20" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-destructive">Failed to load shared files.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <EmptyState variant="folder" />
      )}

      {data && data.length > 0 && (
        <div className="space-y-1">
          {data.map(({ share, file }) => (
            <button
              key={share.id}
              type="button"
              onClick={() => openPreview({ source: 'shared', file, shareId: share.id })}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition hover:border-ring/40 hover:bg-muted/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileIcon mimeType={file.mimeType} size={14} className="text-muted-foreground" />
              </span>
              <span className="flex-1 truncate text-sm font-normal text-foreground">{file.name}</span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                {share.permission}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatDate(share.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
