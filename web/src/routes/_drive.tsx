import { Outlet, createFileRoute } from '@tanstack/react-router'
import { guardAuthenticated } from '@/lib/auth-guards'
import { FilePreviewProvider } from '@/contexts/file-preview'
import { ShareDialogProvider, useShareDialog } from '@/contexts/share-dialog'
import { Sidebar } from '@/components/drive/Sidebar'
import { FilePreviewModal } from '@/components/drive/FilePreviewModal'
import { ShareDialog } from '@/components/drive/ShareDialog'
import { Topbar } from '@/components/drive/Topbar'
import { Toaster } from '@/components/drive/Toaster'

export const Route = createFileRoute('/_drive')({
  beforeLoad: ({ context }) => guardAuthenticated(context),
  component: DriveLayout,
})

function DriveLayout() {
  return (
    <ShareDialogProvider>
      <FilePreviewProvider>
        <DriveLayoutInner />
      </FilePreviewProvider>
    </ShareDialogProvider>
  )
}

function DriveLayoutInner() {
  const { open, file, closeShareDialog } = useShareDialog()

  return (
    <div className="flex h-screen overflow-hidden bg-background p-4 gap-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl ">
        <Topbar />
        <main className="flex-1 overflow-y-auto  bg-secondary mt-2 rounded-2xl">
          <Outlet />
        </main>
      </div>
      <ShareDialog open={open} file={file} onClose={closeShareDialog} />
      <FilePreviewModal />
      <Toaster />
    </div>
  )
}
