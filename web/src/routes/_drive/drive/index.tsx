import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { driveKeys, driveFetchers } from '@/lib/drive-queries'
import { DropZone } from '@/components/drive/DropZone'
import { FolderContents } from '@/components/drive/FolderContents'
import { PageHeader } from '@/components/drive/PageHeader'

export const Route = createFileRoute('/_drive/drive/')({
  component: DriveIndex,
})

function DriveIndex() {
  const { data, isPending, isError } = useQuery({
    queryKey: driveKeys.rootContents(),
    queryFn: driveFetchers.rootContents,
  })

  return (
    <DropZone folderId={null} parentQueryKey={driveKeys.rootContents()}>
      <div className="flex flex-col gap-4  p-6">
        <PageHeader title="My Drive" />
        {isPending && <GridSkeleton />}
        {isError && <ErrorMessage />}
        {data && (
          <FolderContents data={data} parentQueryKey={driveKeys.rootContents()} />
        )}
      </div>
    </DropZone>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-40 flex-col items-center justify-center rounded-2xl bg-card p-4 transition">
          <div className="mb-4 h-24 w-full animate-pulse rounded-xl bg-muted/10" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted/10 px-1" />
        </div>
      ))}
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm text-destructive">Failed to load files. Please refresh.</p>
    </div>
  )
}
