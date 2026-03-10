export const ACCESS_TOKEN_EXPIRY = '15m';
export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_FOLDER_DEPTH = 10;

/**
 * Hard upper bound enforced by the API.
 * S3 supports much larger objects, but keeping a product-level cap simplifies quota management.
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

/** Use single PUT uploads for files up to this size; larger uses S3 multipart. */
export const MAX_SINGLE_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB

/** Multipart part size. Must be >= 5MB for S3 multipart uploads. */
export const MULTIPART_PART_SIZE = 30 * 1024 * 1024; // 30 MB
export const UPLOAD_URL_EXPIRY_SECONDS = 900; // 15 min
export const DOWNLOAD_URL_EXPIRY_SECONDS = 7 * 24 * 3600; // 7 days (S3 presign max)
