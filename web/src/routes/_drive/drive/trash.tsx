import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { driveKeys, driveFetchers } from '@/lib/drive-queries'
import { FolderContents } from '@/components/drive/FolderContents'
import { PageHeader } from '@/components/drive/PageHeader'
import type { FolderContents as FolderContentsType } from '@/types/drive'

export const Route = createFileRoute('/_drive/drive/trash')({
  component: TrashPage,
})

function TrashPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: driveKeys.trash(),
    queryFn: driveFetchers.trash,
  })

  // TrashContents has { folders, files } — same shape as FolderContents minus `folder`
  const normalized: FolderContentsType | undefined = data
    ? { folder: null, folders: data.folders, files: data.files }
    : undefined

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Trash" />
      {isPending && <GridSkeleton />}
      {isError && <ErrorMessage />}
      {normalized && (
        <FolderContents
          data={normalized}
          parentQueryKey={driveKeys.trash()}
          isTrash
        />
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i} 
          className="aspect-[4/3] animate-pulse rounded-2xl bg-card border border-border" 
        />
      ))}
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm text-destructive">Failed to load trash. Please refresh.</p>
    </div>
  )
}
