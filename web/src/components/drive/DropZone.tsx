import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { api } from '@/lib/api'
import { driveKeys } from '@/lib/drive-queries'
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
    mutationFn: async (file: File) => {
      const { uploadUrl, file: createdFile } = await api.post<{ uploadUrl: string; file: { id: string } }>(
        '/api/files/upload',
        {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          ...(folderId ? { folderId } : {}),
        },
      )
      
      const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!uploadRes.ok) throw new Error('S3 upload failed')

      await api.post(`/api/files/${createdFile.id}/confirm`)
      return file.name
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: parentQueryKey })
      qc.invalidateQueries({ queryKey: driveKeys.me() })
      toast(`${name} uploaded`, 'success')
    },
    onError: () => toast('Upload failed', 'error'),
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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="relative flex-1"
    >
      {children}

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Upload size={20} className="text-primary" />
          </div>
          <p className="text-sm font-normal text-foreground">Drop to upload</p>
        </div>
      )}
    </div>
  )
}
