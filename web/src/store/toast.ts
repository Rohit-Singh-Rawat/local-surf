import { Store } from '@tanstack/store'

export type ToastVariant = 'default' | 'success' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
}

export const toastStore = new Store<ToastState>({ toasts: [] })

let counter = 0

export function toast(message: string, variant: ToastVariant = 'default', durationMs = 3500) {
  const id = `t-${++counter}`
  toastStore.setState((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
  setTimeout(() => dismissToast(id), durationMs)
  return id
}

export function dismissToast(id: string) {
  toastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}
