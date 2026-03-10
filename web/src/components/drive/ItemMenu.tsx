import { useRef, useState, useEffect } from 'react'
import { Download, ExternalLink, MoreVertical, Pencil, RotateCcw, Share2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MenuAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface Props {
  actions: MenuAction[]
  className?: string
}

export function ItemMenu({ actions, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                action.onClick()
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-muted',
                action.variant === 'danger'
                  ? 'text-destructive'
                  : 'text-foreground',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Pre-built action factories for DRY usage across cards
export const menuActions = {
  open: (onClick: () => void): MenuAction => ({
    label: 'Open',
    icon: <ExternalLink size={13} />,
    onClick,
  }),
  download: (onClick: () => void): MenuAction => ({
    label: 'Download',
    icon: <Download size={13} />,
    onClick,
  }),
  rename: (onClick: () => void): MenuAction => ({
    label: 'Rename',
    icon: <Pencil size={13} />,
    onClick,
  }),
  trash: (onClick: () => void): MenuAction => ({
    label: 'Move to trash',
    icon: <Trash2 size={13} />,
    onClick,
    variant: 'danger',
  }),
  restore: (onClick: () => void): MenuAction => ({
    label: 'Restore',
    icon: <RotateCcw size={13} />,
    onClick,
  }),
  share: (onClick: () => void): MenuAction => ({
    label: 'Share',
    icon: <Share2 size={13} />,
    onClick,
  }),
}
