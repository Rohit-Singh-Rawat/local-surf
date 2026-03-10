import { useStore } from '@tanstack/react-store'
import { uploadsStore, removeUpload } from '@/store/uploads'
import type { UploadItem } from '@/store/uploads'
import { formatBytes } from '@/lib/format'

function UploadProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

function UploadRow({ item }: { item: UploadItem }) {
  const percent = item.size > 0 ? (item.uploadedBytes / item.size) * 100 : 0

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card/95 px-4 py-3 shadow-md">
      <div className="flex items-center gap-2 text-xs">
        <span className="truncate text-foreground flex-1">{item.name}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {formatBytes(item.uploadedBytes)} / {formatBytes(item.size)}
        </span>
      </div>
      <UploadProgressBar value={percent} />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {item.status === 'uploading'
            ? 'Uploading…'
            : item.status === 'completed'
              ? 'Completed'
              : item.error || 'Failed'}
        </span>
        {item.status !== 'uploading' && (
          <button
            type="button"
            onClick={() => removeUpload(item.id)}
            className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export function UploadsTray() {
  // Show all items — completed ones auto-dismiss after 3s (see file-upload.ts),
  // errors stay until the user clicks Dismiss.
  const items = useStore(uploadsStore, (s) => s.items)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-90 flex max-w-sm flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {items.map((item) => (
          <UploadRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

