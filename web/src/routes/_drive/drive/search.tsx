import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { driveKeys, driveFetchers } from '@/lib/drive-queries'
import { FileCard } from '@/components/drive/FileCard'
import { EmptyState } from '@/components/drive/EmptyState'
import { PageHeader } from '@/components/drive/PageHeader'

const searchSchema = z.object({ q: z.string().optional().default('') })

export const Route = createFileRoute('/_drive/drive/search')({
  validateSearch: searchSchema,
  component: SearchPage,
})

function SearchPage() {
  const { q } = Route.useSearch()

  const { data, isPending, isError } = useQuery({
    queryKey: driveKeys.search(q),
    queryFn: () => driveFetchers.search(q),
    enabled: q.trim().length > 0,
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title={q ? `Results for "${q}"` : 'Search'} />

      {q.trim().length === 0 && <EmptyState variant="search" />}
      {q.trim().length > 0 && isPending && <GridSkeleton />}
      {isError && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-destructive">Search failed. Please try again.</p>
        </div>
      )}
      {data && data.length === 0 && <EmptyState variant="search" query={q} />}
      {data && data.length > 0 && (
        <div className="space-y-1">
          {data.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              parentQueryKey={driveKeys.search(q)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex h-12 animate-pulse items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
          <div className="h-7 w-7 rounded-md bg-muted/20" />
          <div className="h-4 flex-1 rounded-full bg-muted/20" />
        </div>
      ))}
    </div>
  )
}
