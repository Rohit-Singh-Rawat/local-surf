import {
  File,
  FileImage,
  FileText,
  FileVideo,
  FileArchive,
  FileCode,
  Sheet,
  Presentation,
} from 'lucide-react'

interface Props {
  mimeType: string
  size?: number
  className?: string
}

export function FileIcon({ mimeType, size = 18, className }: Props) {
  const props = { size, className }

  if (mimeType.startsWith('image/')) return <FileImage {...props} />
  if (mimeType.startsWith('video/')) return <FileVideo {...props} />
  if (mimeType === 'application/pdf') return <FileText {...props} />
  if (mimeType.startsWith('text/')) return <FileCode {...props} />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <Sheet {...props} />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <Presentation {...props} />
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz'))
    return <FileArchive {...props} />
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText {...props} />

  return <File {...props} />
}
