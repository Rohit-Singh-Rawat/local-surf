import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  UserGroupIcon,
  GlobalIcon,
  Copy01Icon,
  Tick02Icon,
  Link02Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'
import type { DriveFile, FileShare, MyShareItem } from '@/types/drive'

const MY_SHARES_KEY = ['shares', 'my-shares'] as const

interface Props {
  open: boolean
  file: DriveFile | null
  onClose: () => void
}

export function ShareDialog({ open, file, onClose }: Props) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'user' | 'link'>('user')
  const [email, setEmail] = useState('')
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: myShares } = useQuery({
    queryKey: MY_SHARES_KEY,
    queryFn: () => api.get<MyShareItem[]>('/api/shares/my-shares'),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setEmail('')
      setCopied(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const existingToken =
    open && file && myShares
      ? myShares.find((s) => s.file.id === file.id && s.share.isPublic && s.share.publicToken)
          ?.share.publicToken ?? null
      : null
  const existingPublicLink = existingToken
    ? `${window.location.origin}/share/${existingToken}`
    : null
  const displayLink = publicLink ?? existingPublicLink

  useEffect(() => {
    if (!open) setPublicLink(null)
  }, [open])

  const shareWithUser = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      return api.post<FileShare>('/api/shares/user', { fileId: file.id, email, permission: 'download' })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MY_SHARES_KEY })
      toast(`Shared with ${email}`, 'success')
      setEmail('')
      onClose()
    },
    onError: () => toast('Failed to share — check the email address', 'error'),
  })

  const createLink = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      return api.post<FileShare>('/api/shares/link', { fileId: file.id, permission: 'download' })
    },
    onSuccess: (share) => {
      void qc.invalidateQueries({ queryKey: MY_SHARES_KEY })
      const token = share?.publicToken
      setPublicLink(token ? `${window.location.origin}/share/${token}` : null)
      toast('Link created', 'success')
    },
    onError: () => toast('Failed to create link', 'error'),
  })

  const handleCopy = () => {
    if (!displayLink) return
    navigator.clipboard.writeText(displayLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 gap-0 overflow-hidden ring-1 ring-border shadow-2xl">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60">
          <DialogTitle className="truncate text-sm font-medium">Share "{file.name}"</DialogTitle>
        </DialogHeader>

        <div role="tablist" aria-label="Share method" className="flex bg-muted/30 p-1 mx-5 mt-4 rounded-lg">
          <TabButton
            active={tab === 'user'}
            icon={UserGroupIcon}
            label="People"
            onClick={() => setTab('user')}
          />
          <TabButton
            active={tab === 'link'}
            icon={GlobalIcon}
            label="Link"
            onClick={() => setTab('link')}
          />
        </div>

        <div className="flex flex-col p-5 pt-4">
          {tab === 'user' ? (
            <form
              onSubmit={(e) => { e.preventDefault(); shareWithUser.mutate() }}
              className="flex flex-col gap-4"
            >
              <div className="space-y-2">
                <label htmlFor="share-email" className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground ml-0.5">Invite People</label>
                <Input
                  id="share-email"
                  ref={inputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="h-10 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-all"
                  disabled={shareWithUser.isPending}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={onClose} className="rounded-full px-4 text-muted-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full px-6 shadow-sm"
                  disabled={!email.trim() || shareWithUser.isPending}
                >
                  {shareWithUser.isPending ? 'Sharing…' : 'Share'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground ml-0.5">
                  <HugeiconsIcon icon={GlobalIcon} className="size-3.5" aria-hidden="true" />
                  <p className="text-xs">
                    Anyone with the link can view and download.
                  </p>
                </div>

                {displayLink ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/50 px-3 py-2.5 group transition-colors focus-within:border-primary/50">
                    <HugeiconsIcon icon={Link02Icon} className="shrink-0 text-muted-foreground group-focus-within:text-primary size-4" aria-hidden="true" />
                    <span className="min-w-0 flex-1 break-all text-[10px] leading-tight text-foreground font-medium">{displayLink}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label={copied ? 'Copied' : 'Copy link'}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted-foreground/10 hover:text-foreground active:scale-95"
                    >
                      {copied
                        ? <HugeiconsIcon icon={Tick02Icon} className="text-primary size-4" aria-hidden="true" />
                        : <HugeiconsIcon icon={Copy01Icon} className="size-4" aria-hidden="true" />
                      }
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted/30 p-4 border border-dashed border-border/60 text-center">
                    <p className="text-sm text-foreground/70">
                      No public link created yet.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={onClose} className="rounded-full px-4 text-muted-foreground hover:bg-muted">
                  {displayLink ? 'Done' : 'Cancel'}
                </Button>
                {!displayLink && (
                  <Button
                    type="button"
                    onClick={() => createLink.mutate()}
                    className="rounded-full px-6 shadow-sm"
                    disabled={createLink.isPending}
                  >
                    {createLink.isPending ? 'Creating…' : 'Create link'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: IconSvgElement
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
          : "text-muted-foreground hover:text-foreground hover:bg-background/40"
      )}
    >
      <HugeiconsIcon icon={icon} className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}
