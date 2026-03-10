import type { ReactNode } from 'react'
import type { BreadcrumbItem } from '@/types/drive'
import { Breadcrumb } from './Breadcrumb'

interface Props {
  title: string
  crumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({ title, crumbs, actions }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 ? (
            <Breadcrumb crumbs={crumbs} />
          ) : (
            <h1 className="text-2xl text-foreground font-normal">{title}</h1>
          )}
          {crumbs && crumbs.length > 0 && (
            <h1 className="mt-1 text-2xl font-normal text-foreground truncate">
              {crumbs[crumbs.length - 1]?.name ?? title}
            </h1>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
