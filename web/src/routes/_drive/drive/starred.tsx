import { createFileRoute } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/drive/PageHeader'

export const Route = createFileRoute('/_drive/drive/starred')({
  component: StarredPage,
})

function StarredPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Starred" />
      <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Star size={22} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-normal text-foreground">Coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">Starred files will appear here.</p>
      </div>
    </div>
  )
}
