import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DOWNLOAD_URL_EXPIRY_SECONDS, UPLOAD_URL_EXPIRY_SECONDS } from '../lib/constants';
import { env } from './env';

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
}

export async function generateDownloadUrl(key: string, filename: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS });
}

/** Inline URL for viewing in browser (images, PDFs, videos). */
export async function generateViewUrl(
  key: string,
  contentType?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: 'inline',
    ...(contentType && { ResponseContentType: contentType }),
  });
  return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS });
}

export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string | undefined }> {
  const response = await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return { size: response.ContentLength ?? 0, contentType: response.ContentType };
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const BATCH_SIZE = 1000;
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: env.S3_BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    );
  }
}

export { s3 as s3Client };
