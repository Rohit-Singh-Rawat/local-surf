import { api } from '@/lib/api'
import { completeUpload, failUpload, removeUpload, startUpload, updateUploadProgress } from '@/store/uploads'

// S3 recommends 3-5 concurrent connections per multipart upload.
// Higher values risk throttling from S3 on large uploads.
const PART_CONCURRENCY = 5
const MAX_PART_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500  // delays: 500ms, 1000ms before attempts 2 & 3

type SingleUploadDescriptor = { uploadUrl: string }
type MultipartUploadDescriptor = {
  type: 'multipart'
  uploadId: string
  partSize: number
  parts: Array<{ partNumber: number; uploadUrl: string }>
}
type InitiateUploadResponse = {
  file: { id: string; name: string; size: number }
  upload: SingleUploadDescriptor | MultipartUploadDescriptor
}

/**
 * Uploads one part (or the whole file for single-part) to S3 via a presigned PUT URL.
 * Reports byte-level progress via `onProgress` and honours the AbortSignal.
 */
function uploadPartOnce(params: {
  url: string
  body: ArrayBuffer
  contentType?: string
  signal: AbortSignal
  onProgress: (loaded: number) => void
}): Promise<string> {
  const { url, body, contentType, signal, onProgress } = params

  return new Promise<string>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Upload aborted', 'AbortError'))
      return
    }

    const xhr = new XMLHttpRequest()

    const onAbort = () => {
      xhr.abort()
      reject(new DOMException('Upload aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded)
    }

    xhr.onload = () => {
      signal.removeEventListener('abort', onAbort)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader('ETag') ?? '')
      } else {
        reject(new Error(`Part upload failed: HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      signal.removeEventListener('abort', onAbort)
      reject(new Error('Part upload network error'))
    }

    xhr.open('PUT', url)
    if (contentType) xhr.setRequestHeader('Content-Type', contentType)
    xhr.send(body)
  })
}

/**
 * Wraps `uploadPartOnce` with up to MAX_PART_RETRIES attempts and exponential backoff.
 * Resets progress to 0 before each retry so the caller's aggregation stays accurate.
 * Immediately re-throws AbortError without retrying.
 */
async function uploadPartWithRetry(params: {
  url: string
  body: ArrayBuffer
  contentType?: string
  signal: AbortSignal
  onProgress: (loaded: number) => void
}): Promise<string> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_PART_RETRIES; attempt++) {
    if (params.signal.aborted) throw new DOMException('Upload aborted', 'AbortError')

    if (attempt > 0) {
      params.onProgress(0)  // reset this part's contribution before retrying
      await new Promise<void>((r) => setTimeout(r, RETRY_BASE_DELAY_MS * attempt))
    }

    try {
      return await uploadPartOnce(params)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      lastError = err
    }
  }

  throw lastError
}

/**
 * Runs `tasks` in parallel with at most `concurrency` in-flight at once.
 * Uses a queue cursor so workers pick up the next task as soon as they finish.
 * If any task throws, Promise.all propagates the rejection; in-flight tasks
 * are cancelled via the shared AbortSignal passed into their work.
 */
async function runConcurrent<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const i = cursor++  // JS is single-threaded; increment is safe between awaits
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
  return results
}

/**
 * Uploads a file to S3 via the API.
 * - Small files (≤ MAX_SINGLE_UPLOAD_SIZE): single PUT with retry.
 * - Large files: S3 multipart — parts are uploaded in parallel (PART_CONCURRENCY at a time),
 *   each with individual retry. Progress is aggregated across all in-flight parts.
 * - On any permanent failure: aborts in-flight XHRs, calls /abort to clean up
 *   the partial S3 multipart upload (avoids lingering storage charges), and marks
 *   the upload as failed in the UI.
 */
export async function uploadFile(file: File, folderId: string | null): Promise<string> {
  const { file: createdFile, upload: uploadDesc } =
    await api.post<InitiateUploadResponse>('/api/files/upload', {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      ...(folderId ? { folderId } : {}),
    })

  startUpload({ id: createdFile.id, name: createdFile.name, size: createdFile.size })

  const abort = new AbortController()

  try {
    if ('uploadUrl' in uploadDesc) {
      // ── Single-part upload ──────────────────────────────────────────────────
      const body = await file.arrayBuffer()
      await uploadPartWithRetry({
        url: uploadDesc.uploadUrl,
        body,
        contentType: file.type || 'application/octet-stream',
        signal: abort.signal,
        onProgress: (loaded) => updateUploadProgress(createdFile.id, loaded),
      })
      await api.post(`/api/files/${createdFile.id}/confirm`)
    } else {
      // ── Multipart upload ────────────────────────────────────────────────────
      // Each part tracks its own progress independently.
      // The total shown in the UI is the live sum across all parts — this means
      // the progress bar reflects true bytes in transit, not just completed parts.
      const partProgress = new Array<number>(uploadDesc.parts.length).fill(0)

      const reportProgress = (partIndex: number, loaded: number) => {
        partProgress[partIndex] = loaded
        updateUploadProgress(
          createdFile.id,
          partProgress.reduce((acc, bytes) => acc + bytes, 0),
        )
      }

      const tasks = uploadDesc.parts.map((part, i) => async () => {
        const offset = (part.partNumber - 1) * uploadDesc.partSize
        const length = Math.min(file.size - offset, uploadDesc.partSize)
        const body = await file.slice(offset, offset + length).arrayBuffer()

        return uploadPartWithRetry({
          url: part.uploadUrl,
          body,
          signal: abort.signal,
          onProgress: (loaded) => reportProgress(i, loaded),
        })
      })

      const etags = await runConcurrent(tasks, PART_CONCURRENCY)

      await api.post(`/api/files/${createdFile.id}/complete`, {
        uploadId: uploadDesc.uploadId,
        parts: uploadDesc.parts.map((part, i) => ({ partNumber: part.partNumber, etag: etags[i] })),
      })
    }

    completeUpload(createdFile.id)
    // Auto-dismiss the completed row after 3 s — errors stay until explicitly dismissed
    setTimeout(() => removeUpload(createdFile.id), 3_000)
    return file.name
  } catch (err) {
    abort.abort()
    // Clean up the partial multipart upload on S3 to avoid storage charges.
    // Fire-and-forget — we don't want a cleanup failure to mask the original error.
    if (!('uploadUrl' in uploadDesc)) {
      api.post(`/api/files/${createdFile.id}/abort`).catch(() => undefined)
    }
    failUpload(createdFile.id)
    throw err
  }
}
