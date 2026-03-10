import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Folder } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { driveKeys } from '@/lib/drive-queries'
import { toast } from '@/store/toast'
import type { DriveFolder } from '@/types/drive'
import { cn } from '@/lib/utils'
import { ItemMenu, menuActions } from './ItemMenu'
import { RenameDialog } from './RenameDialog'

interface Props {
  folder: DriveFolder
  parentQueryKey: readonly unknown[]
  isTrash?: boolean
}

export function FolderCard({ folder, parentQueryKey, isTrash = false }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [renaming, setRenaming] = useState(false)

  const trash = useMutation({
    mutationFn: () => api.delete(`/api/folders/${folder.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      toast('Moved to trash', 'default')
    },
    onError: () => toast('Failed to move folder to trash', 'error'),
  })

  const restore = useMutation({
    mutationFn: () => api.post(`/api/folders/${folder.id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: driveKeys.trash() })
      qc.invalidateQueries({ queryKey: driveKeys.rootContents() })
      toast('Folder restored', 'success')
    },
    onError: () => toast('Failed to restore folder', 'error'),
  })

  const rename = useMutation({
    mutationFn: (name: string) => api.patch(`/api/folders/${folder.id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      setRenaming(false)
      toast('Folder renamed', 'success')
    },
    onError: () => toast('Failed to rename folder', 'error'),
  })

  const actions = isTrash
    ? [menuActions.restore(() => restore.mutate())]
    : [
        menuActions.rename(() => setRenaming(true)),
        menuActions.trash(() => trash.mutate()),
      ]

  return (
    <>
      <div
        onDoubleClick={() =>
          !isTrash && navigate({ to: '/drive/folders/$folderId', params: { folderId: folder.id } })
        }
        className={cn(
          'group relative flex items-center gap-4 rounded-2xl bg-card border border-transparent px-5 py-4 transition',
          !isTrash && 'cursor-pointer hover:bg-muted/40 hover:border-border/40 hover:shadow-sm',
          isTrash && 'opacity-70',
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Folder size={20} className="text-primary" />
        </span>
        <span className="flex-1 truncate text-sm font-normal text-foreground">{folder.name}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ItemMenu actions={actions} />
        </div>
      </div>

      <RenameDialog
        open={renaming}
        currentName={folder.name}
        onClose={() => setRenaming(false)}
        onSubmit={(name) => rename.mutate(name)}
        isPending={rename.isPending}
      />
    </>
  )
}
