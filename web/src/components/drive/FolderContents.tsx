import { useStore } from '@tanstack/react-store'
import type { FolderContents as FolderContentsType } from '@/types/drive'
import { uiStore } from '@/store/ui'
import { FolderCard } from './FolderCard'
import { FileCard } from './FileCard'
import { EmptyState } from './EmptyState'

interface Props {
  data: FolderContentsType
  parentQueryKey: readonly unknown[]
  isTrash?: boolean
}

export function FolderContents({ data, parentQueryKey, isTrash = false }: Props) {
  const viewMode = useStore(uiStore, (s) => s.viewMode)
  const { folders, files } = data

  const isEmpty = folders.length === 0 && files.length === 0

  if (isEmpty) {
    return <EmptyState variant={isTrash ? 'trash' : 'folder'} />
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-5">
        {folders.length > 0 && (
          <section>
            <SectionLabel>Folders</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((f) => (
                <FolderCard key={f.id} folder={f} parentQueryKey={parentQueryKey} isTrash={isTrash} />
              ))}
            </div>
          </section>
        )}

        {files.length > 0 && (
          <section>
            <SectionLabel>Files</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((f) => (
                <FileCard key={f.id} file={f} parentQueryKey={parentQueryKey} isTrash={isTrash} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {folders.length > 0 && (
        <section>
          <SectionLabel>Folders</SectionLabel>
          <ListHeader />
          <div className="space-y-1">
            {folders.map((f) => (
              <FolderCard key={f.id} folder={f} parentQueryKey={parentQueryKey} isTrash={isTrash} />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <SectionLabel>Files</SectionLabel>
          <ListHeader />
          <div className="space-y-1">
            {files.map((f) => (
              <FileCard key={f.id} file={f} parentQueryKey={parentQueryKey} isTrash={isTrash} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-normal uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function ListHeader() {
  return (
    <div className="mb-1 flex items-center gap-3 px-3 py-1 text-xs text-muted-foreground">
      <span className="flex h-7 w-7 shrink-0" />
      <span className="flex-1">Name</span>
      <span className="w-16 shrink-0 text-right">Size</span>
      <span className="hidden w-20 shrink-0 text-right sm:block">Modified</span>
      <span className="w-6 shrink-0" />
    </div>
  )
}
