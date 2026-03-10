import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { guardAuthenticated } from '@/lib/auth-guards'
import { FilePreviewProvider } from '@/contexts/file-preview'
import { ShareDialogProvider, useShareDialog } from '@/contexts/share-dialog'
import { Sidebar } from '@/components/drive/Sidebar'
import { FilePreviewModal } from '@/components/drive/FilePreviewModal'
import { ShareDialog } from '@/components/drive/ShareDialog'
import { Topbar } from '@/components/drive/Topbar'
import { Toaster } from '@/components/drive/Toaster'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { uiStore, setSidebarOpen } from '@/store/ui'

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
  const sidebarOpen = useStore(uiStore, (s) => s.sidebarOpen)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background p-2 md:p-4 gap-2 md:gap-4">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 border-none bg-sidebar [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl md:rounded-2xl ">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-secondary mt-1 md:mt-2 rounded-xl md:rounded-2xl">
          <Outlet />
        </main>
      </div>
      <ShareDialog open={open} file={file} onClose={closeShareDialog} />
      <FilePreviewModal />
      <Toaster />
    </div>
  )
}
