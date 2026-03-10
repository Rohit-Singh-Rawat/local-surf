import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { FolderPlus, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { api } from '@/lib/api'
import { driveKeys } from '@/lib/drive-queries'
import { uploadFile } from '@/lib/file-upload'
import { toast } from '@/store/toast'
import { NewFolderDialog } from './NewFolderDialog'

function resolveCurrentFolderId(pathname: string): string | null {
  const m = pathname.match(/^\/drive\/folders\/([^/]+)$/)
  return m ? m[1] : null
}

export function NewButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const folderId = resolveCurrentFolderId(pathname)
  const qc = useQueryClient()

  const [menuOpen, setMenuOpen] = useState(false)
  const [folderDialog, setFolderDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parentQueryKey = folderId
    ? driveKeys.folderContents(folderId)
    : driveKeys.rootContents()

  const createFolder = useMutation({
    mutationFn: (name: string) =>
      api.post('/api/folders', folderId ? { name, parentId: folderId } : { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      setFolderDialog(false)
      toast('Folder created', 'success')
    },
    onError: () => toast('Failed to create folder', 'error'),
  })

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file, folderId),
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      qc.invalidateQueries({ queryKey: driveKeys.me() })
      toast(`${name} uploaded`, 'success')
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.error('[NewButton] Upload failed:', err)
      toast('Upload failed', 'error')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      toast(`Uploading ${file.name}…`)
      upload.mutate(file)
    }
    e.target.value = ''
    setMenuOpen(false)
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={upload.isPending}
          className="flex items-center gap-3 rounded-2xl bg-popover px-5 py-4 text-sm font-normal text-foreground shadow-sm transition hover:bg-muted disabled:opacity-70 group border border-border/50"
        >
          {upload.isPending ? (
            <Loader2 size={24} className="animate-spin text-foreground" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center">
              {/* Google Drive uses a distinctive plus sign with four colors. We can approximate it or use a minimalist plus. */}
              <svg viewBox="0 0 36 36" className="h-full w-full">
                <path fill="#34A853" d="M16 16v14h4V20z" />
                <path fill="#4285F4" d="M30 16H20l-4 4h14z" />
                <path fill="#FBBC05" d="M6 16v4h10l4-4z" />
                <path fill="#EA4335" d="M20 16V6h-4v14z" />
                <path fill="none" d="M0 0h36v36H0z" />
              </svg>
            </div>
          )}
          <span className="text-base font-normal">
            {upload.isPending ? 'Uploading…' : 'New'}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg py-1">
              <button
                type="button"
                onClick={() => { setFolderDialog(true); setMenuOpen(false) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
              >
                <FolderPlus size={18} className="text-foreground/70" />
                New folder
              </button>
              <div className="my-1 h-px w-full bg-border" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
              >
                <Upload size={18} className="text-foreground/70" />
                File upload
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <NewFolderDialog
        open={folderDialog}
        onClose={() => setFolderDialog(false)}
        onSubmit={(name) => createFolder.mutate(name)}
        isPending={createFolder.isPending}
      />
    </>
  )
}
