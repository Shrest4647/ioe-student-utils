import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
