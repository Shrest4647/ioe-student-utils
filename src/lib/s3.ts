import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { appEnv } from "@/env";

const s3Client = new S3Client({
  region: appEnv.S3_REGION,
  credentials: {
    accessKeyId: appEnv.S3_ACCESS_KEY_ID,
    secretAccessKey: appEnv.S3_SECRET_ACCESS_KEY,
  },
  endpoint: appEnv.S3_ENDPOINT,
  forcePathStyle: true, // Useful for MinIO and some custom S3 providers
});

/**
 * Upload a file to S3 and return the public URL (if available) or the key.
 */
export async function uploadToS3(params: {
  file: Buffer | Uint8Array | Blob | string;
  fileName: string;
  contentType: string;
}) {
  const { file, fileName, contentType } = params;
  const key = `resources/${crypto.randomUUID()}-${fileName}`;

  let body: Buffer | Uint8Array | string;
  if (file instanceof Blob) {
    body = new Uint8Array(await file.arrayBuffer());
  } else {
    body = file as Buffer | Uint8Array | string;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: appEnv.S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      // ACL: "public-read", // Uncomment if your bucket is public-read
    }),
  );

  // Construct URL. In production, this might be a CDN URL or a specialized S3 URL.
  const url = appEnv.S3_ENDPOINT
    ? `${appEnv.S3_ENDPOINT}/${appEnv.S3_BUCKET_NAME}/${key}`
    : `https://${appEnv.S3_BUCKET_NAME}.s3.${appEnv.S3_REGION}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
}

/**
 * Generate a presigned URL for uploading a file to S3.
 */
export async function generatePresignedUploadUrl(params: {
  fileName: string;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const { fileName, contentType } = params;
  const key = `resources/${crypto.randomUUID()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: appEnv.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return { url, key };
}

/**
 * Generate a presigned URL for previewing/downloading a file from S3.
 */
export async function generatePresignedPreviewUrl(
  key: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: appEnv.S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return url;
}

/**
 * Extract the S3 key from a full S3 URL.
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Remove leading slash
    return path.startsWith("/") ? path.slice(1) : path;
  } catch {
    return null;
  }
}
