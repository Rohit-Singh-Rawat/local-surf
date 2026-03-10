import { api } from '@/lib/api'
import type { AuthUser } from '@/store/auth'
import type { BreadcrumbItem, DriveFile, FolderContents, TrashContents } from '@/types/drive'

// Centralised query key factory — prevents typos and makes cache invalidation explicit
export const driveKeys = {
  rootContents: () => ['folders', 'root', 'contents'] as const,
  folderContents: (id: string) => ['folders', id, 'contents'] as const,
  breadcrumb: (id: string) => ['folders', id, 'breadcrumb'] as const,
  trash: () => ['folders', 'trash'] as const,
  search: (q: string) => ['files', 'search', q] as const,
  me: () => ['users', 'me'] as const,
}

export const driveFetchers = {
  rootContents: () => api.get<FolderContents>('/api/folders/root/contents'),
  folderContents: (id: string) => api.get<FolderContents>(`/api/folders/${id}/contents`),
  breadcrumb: (id: string) => api.get<BreadcrumbItem[]>(`/api/folders/${id}/path`),
  trash: () => api.get<TrashContents>('/api/folders/trash'),
  search: (q: string) => api.get<DriveFile[]>(`/api/files/search?q=${encodeURIComponent(q)}`),
  me: () => api.get<AuthUser>('/api/users/me'),
}
