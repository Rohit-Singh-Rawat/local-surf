import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { driveKeys } from '@/lib/drive-queries'
import { uploadFile } from '@/lib/file-upload'
import { toast } from '@/store/toast'

interface Props {
  folderId: string | null
  parentQueryKey: readonly unknown[]
  children: React.ReactNode
}

export function DropZone({ folderId, parentQueryKey, children }: Props) {
  const qc = useQueryClient()
  const [isDragOver, setIsDragOver] = useState(false)

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file, folderId),
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      qc.invalidateQueries({ queryKey: driveKeys.me() })
      toast(`${name} uploaded`, 'success')
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.error('[DropZone] Upload failed:', err)
      toast('Upload failed', 'error')
    },
  })

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      for (const file of files) {
        toast(`Uploading ${file.name}…`)
        upload.mutate(file)
      }
    },
    [upload],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  return (
    <div
      role="region"
      aria-label="File drop zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="relative flex-1"
    >
      {children}

      {isDragOver && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary/5"
          aria-live="polite"
          aria-label="Drop files to upload"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Upload size={20} className="text-primary" aria-hidden />
          </div>
          <p className="text-sm font-normal text-foreground">Drop to upload</p>
        </div>
      )}
    </div>
  )
}
