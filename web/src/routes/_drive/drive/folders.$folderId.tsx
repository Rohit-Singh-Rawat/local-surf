import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { driveKeys, driveFetchers } from '@/lib/drive-queries'
import { DropZone } from '@/components/drive/DropZone'
import { FolderContents } from '@/components/drive/FolderContents'
import { PageHeader } from '@/components/drive/PageHeader'

export const Route = createFileRoute('/_drive/drive/folders/$folderId')({
  component: FolderView,
})

function FolderView() {
  const { folderId } = Route.useParams()

  const contents = useQuery({
    queryKey: driveKeys.folderContents(folderId),
    queryFn: () => driveFetchers.folderContents(folderId),
  })

  const breadcrumb = useQuery({
    queryKey: driveKeys.breadcrumb(folderId),
    queryFn: () => driveFetchers.breadcrumb(folderId),
    enabled: contents.isSuccess,
  })

  return (
    <DropZone folderId={folderId} parentQueryKey={driveKeys.folderContents(folderId)}>
      <div className="flex flex-col gap-4 p-6">
        <PageHeader title="Folder" crumbs={breadcrumb.data} />
        {contents.isPending && <GridSkeleton />}
        {contents.isError && <ErrorMessage />}
        {contents.data && (
          <FolderContents
            data={contents.data}
            parentQueryKey={driveKeys.folderContents(folderId)}
          />
        )}
      </div>
    </DropZone>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm text-destructive">Failed to load folder. Please refresh.</p>
    </div>
  )
}
