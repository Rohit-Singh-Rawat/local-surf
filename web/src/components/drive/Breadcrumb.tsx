import { Link } from '@tanstack/react-router'
import { ChevronRight, HardDrive } from 'lucide-react'
import type { BreadcrumbItem } from '@/types/drive'

interface Props {
  crumbs: BreadcrumbItem[]
}

export function Breadcrumb({ crumbs }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/drive"
        className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
      >
        <HardDrive size={13} />
        <span>My Drive</span>
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-border" />
            {isLast ? (
              <span className="font-normal text-foreground">{crumb.name}</span>
            ) : (
              <Link
                to="/drive/folders/$folderId"
                params={{ folderId: crumb.id }}
                className="text-muted-foreground transition hover:text-foreground"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
