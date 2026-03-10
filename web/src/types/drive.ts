export interface DriveFolder {
  id: string
  parentId: string | null
  name: string
  trashedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface DriveFile {
  id: string
  folderId: string | null
  name: string
  mimeType: string
  size: number
  trashedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface FolderContents {
  folder: DriveFolder | null
  folders: DriveFolder[]
  files: DriveFile[]
}

export interface TrashContents {
  folders: DriveFolder[]
  files: DriveFile[]
}

export interface BreadcrumbItem {
  id: string
  name: string
}

export type ViewMode = 'grid' | 'list'

export type SharePermission = 'view' | 'download'

export interface FileShare {
  id: string
  isPublic: boolean
  publicToken?: string | null
  permission: SharePermission
  expiresAt: string | null
  createdAt: string
}

export interface SharedWithMeItem {
  share: FileShare
  file: DriveFile
  owner: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
}

export interface MyShareItem {
  share: FileShare
  file: DriveFile
  sharedWith: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
}
