import { Store } from '@tanstack/store'

type UploadStatus = 'uploading' | 'completed' | 'error'

export interface UploadItem {
  id: string
  name: string
  size: number
  uploadedBytes: number
  status: UploadStatus
  error?: string
}

interface UploadState {
  items: UploadItem[]
}

export const uploadsStore = new Store<UploadState>({ items: [] })

export function startUpload(item: { id: string; name: string; size: number }) {
  uploadsStore.setState((s) => ({
    items: [
      ...s.items,
      {
        id: item.id,
        name: item.name,
        size: item.size,
        uploadedBytes: 0,
        status: 'uploading',
      },
    ],
  }))
}

export function updateUploadProgress(id: string, uploadedBytes: number) {
  uploadsStore.setState((s) => ({
    items: s.items.map((u) =>
      u.id === id
        ? {
            ...u,
            uploadedBytes: uploadedBytes > u.size ? u.size : uploadedBytes,
          }
        : u,
    ),
  }))
}

export function completeUpload(id: string) {
  uploadsStore.setState((s) => ({
    items: s.items.map((u) =>
      u.id === id
        ? {
            ...u,
            uploadedBytes: u.size,
            status: 'completed',
          }
        : u,
    ),
  }))
}

export function failUpload(id: string, message?: string) {
  uploadsStore.setState((s) => ({
    items: s.items.map((u) =>
      u.id === id
        ? {
            ...u,
            status: 'error',
            error: message,
          }
        : u,
    ),
  }))
}

export function removeUpload(id: string) {
  uploadsStore.setState((s) => ({
    items: s.items.filter((u) => u.id !== id),
  }))
}

