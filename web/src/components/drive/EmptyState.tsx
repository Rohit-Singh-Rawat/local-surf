import { FolderOpen, Trash2 } from 'lucide-react'

interface Props {
  variant?: 'folder' | 'trash' | 'search'
  query?: string
}

export function EmptyState({ variant = 'folder', query }: Props) {
  const config = {
    folder: {
      icon: FolderOpen,
      title: 'Nothing here yet',
      body: 'Upload files or create a folder to get started.',
    },
    trash: {
      icon: Trash2,
      title: 'Trash is empty',
      body: 'Items you delete will appear here.',
    },
    search: {
      icon: FolderOpen,
      title: query ? `No results for "${query}"` : 'Start searching',
      body: query ? 'Try a different name or check your spelling.' : 'Type something in the search bar.',
    },
  }[variant]

  const Icon = config.icon

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-normal text-foreground">{config.title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{config.body}</p>
    </div>
  )
}
