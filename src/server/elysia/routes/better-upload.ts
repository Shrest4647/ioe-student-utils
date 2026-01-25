import { handleRequest, type Router, route } from "@better-upload/server";
import { custom } from "@better-upload/server/clients";
import { Elysia } from "elysia";
import { appEnv } from "@/env";

const s3 = custom({
  host: appEnv.S3_ENDPOINT || "",
  accessKeyId: appEnv.S3_ACCESS_KEY_ID,
  secretAccessKey: appEnv.S3_SECRET_ACCESS_KEY,
  region: appEnv.S3_REGION,
});

const router: Router = {
  client: s3,
  bucketName: appEnv.S3_BUCKET_NAME,
  routes: {
    images: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 4,
    }),
    documents: route({
      fileTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      multipleFiles: true,
      maxFiles: 4,
    }),
  },
};

export const betterUploadRoutes = new Elysia({ prefix: "/upload" }).post(
  "/",
  ({ request }) => {
    return handleRequest(request, router);
  },
  {
    tags: ["Better Upload"],
  },
);
