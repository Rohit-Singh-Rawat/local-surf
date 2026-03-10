import { useStore } from '@tanstack/react-store'
import { X } from 'lucide-react'
import { dismissToast, toastStore } from '@/store/toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const toasts = useStore(toastStore, (s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm',
            'animate-in slide-in-from-bottom-2 fade-in duration-200',
            t.variant === 'error'
              ? 'border-destructive/30 bg-card text-destructive'
              : t.variant === 'success'
                ? 'border-primary/30 bg-card text-foreground'
                : 'border-border bg-card text-foreground',
          )}
        >
          {t.variant === 'success' && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
          {t.variant === 'error' && (
            <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
          )}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="shrink-0 text-muted-foreground transition hover:text-foreground"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
