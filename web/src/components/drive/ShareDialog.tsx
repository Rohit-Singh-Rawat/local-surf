import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Globe, Link2, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import type { DriveFile, FileShare, SharePermission } from '@/types/drive'

interface Props {
  open: boolean
  file: DriveFile | null
  onClose: () => void
}

export function ShareDialog({ open, file, onClose }: Props) {
  const [tab, setTab] = useState<'user' | 'link'>('user')
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setEmail('')
      setPublicLink(null)
      setCopied(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const shareWithUser = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      return api.post<FileShare>('/api/shares/user', { fileId: file.id, email, permission })
    },
    onSuccess: () => {
      toast(`Shared with ${email}`, 'success')
      setEmail('')
      onClose()
    },
    onError: () => toast('Failed to share — check the email address', 'error'),
  })

  const createLink = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      return api.post<FileShare>('/api/shares/link', { fileId: file.id, permission })
    },
    onSuccess: (share) => {
      const url = `${window.location.origin}/share/${share.publicToken}`
      setPublicLink(url)
      toast('Link created', 'success')
    },
    onError: () => toast('Failed to create link', 'error'),
  })

  const handleCopy = () => {
    if (!publicLink) return
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="truncate text-sm">Share "{file.name}"</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton
            active={tab === 'user'}
            icon={<Users size={13} />}
            label="People"
            onClick={() => setTab('user')}
          />
          <TabButton
            active={tab === 'link'}
            icon={<Globe size={13} />}
            label="Link"
            onClick={() => setTab('link')}
          />
        </div>

        <div className="p-5">
          {/* Permission selector */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Permission</span>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              className="ml-auto rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
            >
              <option value="view">View only</option>
              <option value="download">View &amp; download</option>
            </select>
          </div>

          {tab === 'user' ? (
            <form
              onSubmit={(e) => { e.preventDefault(); shareWithUser.mutate() }}
              className="flex flex-col gap-3"
            >
              <Input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={shareWithUser.isPending}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={!email.trim() || shareWithUser.isPending}
                >
                  {shareWithUser.isPending ? 'Sharing…' : 'Share'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              {publicLink ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <Link2 size={13} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs text-muted-foreground">{publicLink}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 text-muted-foreground transition hover:text-foreground"
                  >
                    {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Create a public link anyone can use to access this file.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={onClose}>
                  {publicLink ? 'Done' : 'Cancel'}
                </Button>
                {!publicLink && (
                  <Button
                    type="button"
                    onClick={() => createLink.mutate()}
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
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-normal transition-colors ${
        active
          ? 'border-b-2 border-primary text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
