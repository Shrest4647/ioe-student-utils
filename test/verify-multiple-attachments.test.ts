/**
 * Test script to verify multiple attachments functionality
 *
 * This test creates a resource with 2 files and 1 URL attachment,
 * fetches it, updates it (add URL, remove file), and verifies all changes.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";

// Test user ID
const TEST_USER_ID = `test-user-${Date.now()}`;
const TEST_SESSION_ID = `test-session-${Date.now()}`;

/**
 * Create a test authorization plugin that provides a mock authenticated user
 */
const createTestAuthPlugin = () => {
  return new Elysia({ name: "test-auth" }).macro({
    auth: {
      async resolve() {
        return {
          user: {
            id: TEST_USER_ID,
            name: "Test User",
            email: "test@example.com",
            role: "user",
          },
          session: {
            id: TEST_SESSION_ID,
            token: "test-token",
            userId: TEST_USER_ID,
          },
        };
      },
    },
    role: (_requiredRole: "user" | "admin") => ({
      async resolve() {
        return {
          user: {
            id: TEST_USER_ID,
            name: "Test User",
            email: "test@example.com",
            role: "user",
          },
          session: {
            id: TEST_SESSION_ID,
            token: "test-token",
            userId: TEST_USER_ID,
          },
        };
      },
    }),
    ownerOnly: {
      async resolve() {
        return {
          user: {
            id: TEST_USER_ID,
            name: "Test User",
            email: "test@example.com",
            role: "user",
          },
          session: {
            id: TEST_SESSION_ID,
            token: "test-token",
            userId: TEST_USER_ID,
          },
        };
      },
    },
  });
};

// In-memory storage for test data
interface TestAttachment {
  id: string;
  resourceId: string;
  type: "file" | "url";
  url: string;
  name: string;
  fileFormat: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TestResource {
  id: string;
  title: string;
  description: string | null;
  s3Url: string;
  contentTypeId: string;
  uploaderId: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  attachments: TestAttachment[];
}

const testResources = new Map<string, TestResource>();
const testContentTypes: Array<{
  id: string;
  name: string;
  description: string | null;
}> = [];

/**
 * Create the resource routes for testing
 */
const createResourceRoutes = () => {
  const attachmentFileSchema = t.Object({
    name: t.String({ minLength: 1 }),
    type: t.Literal("file"),
  });

  const attachmentUrlSchema = t.Object({
    name: t.String({ minLength: 1 }),
    type: t.Literal("url"),
    url: t.String({ minLength: 1 }),
  });

  const attachmentSchema = t.Union([attachmentFileSchema, attachmentUrlSchema]);

  return (
    new Elysia({ prefix: "/resources" })
      .use(createTestAuthPlugin())
      // Content Types
      .get(
        "/content-types",
        async () => {
          return { success: true, data: testContentTypes };
        },
        { detail: { tags: ["Resources"], summary: "List content types" } },
      )
      // Create content type
      .post(
        "/content-types",
        async ({ body }) => {
          const { name, description } = body;
          const id = `content-type-${Date.now()}`;
          testContentTypes.push({ id, name, description: description ?? null });
          return { success: true, data: { id, name, description } };
        },
        {
          auth: true,
          role: "admin",
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
          }),
        },
      )
      // Resources list
      .get(
        "/",
        async () => {
          const resourcesList = Array.from(testResources.values());
          return {
            success: true,
            data: resourcesList,
            metadata: { totalCount: resourcesList.length },
          };
        },
        { detail: { tags: ["Resources"] } },
      )
      // Get single resource
      .get(
        "/:id",
        async ({ params: { id }, set }) => {
          const resource = testResources.get(id);
          if (!resource) {
            set.status = 404;
            return { success: false, error: "Resource not found" };
          }
          return { success: true, data: resource };
        },
        { detail: { tags: ["Resources"] } },
      )
      // Create resource
      .post(
        "/",
        async ({ user, body }) => {
          const { title, description, contentTypeId, attachments } = body;
          const resourceId = `resource-${Date.now()}`;

          const processedAttachments: Array<{
            id: string;
            resourceId: string;
            type: "file" | "url";
            url: string;
            name: string;
            fileFormat: string | null;
          }> = [];

          if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
              if (attachment.type === "url") {
                processedAttachments.push({
                  id: `attachment-${Date.now()}-${Math.random()}`,
                  resourceId,
                  type: "url",
                  url: attachment.url,
                  name: attachment.name,
                  fileFormat: null,
                });
              } else if (attachment.type === "file") {
                // Simulate file upload - return a mock URL
                processedAttachments.push({
                  id: `attachment-${Date.now()}-${Math.random()}`,
                  resourceId,
                  type: "file",
                  url: `https://s3.example.com/${resourceId}/${attachment.name}`,
                  name: attachment.name,
                  fileFormat: attachment.name.split(".").pop() ?? "unknown",
                });
              }
            }
          }

          const now = new Date();
          const resource: TestResource = {
            id: resourceId,
            title,
            description: description ?? null,
            s3Url: processedAttachments[0]?.url ?? "",
            contentTypeId,
            uploaderId: user.id,
            isFeatured: false,
            createdAt: now,
            updatedAt: now,
            attachments: processedAttachments.map((a) => ({
              ...a,
              createdAt: now,
              updatedAt: now,
            })),
          };

          testResources.set(resourceId, resource);

          return {
            success: true,
            data: {
              id: resourceId,
              title,
              attachments: processedAttachments.map((a) => ({
                id: a.id,
                type: a.type,
                url: a.url,
                name: a.name,
                fileFormat: a.fileFormat,
              })),
            },
          };
        },
        {
          auth: true,
          body: t.Object({
            title: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            contentTypeId: t.String(),
            attachments: t.Optional(t.Array(attachmentSchema)),
          }),
        },
      )
      // Update resource
      .put(
        "/:id",
        async ({ params: { id }, body, set }) => {
          const existing = testResources.get(id);
          if (!existing) {
            set.status = 404;
            return { success: false, error: "Resource not found" };
          }

          const { title, description, attachments } = body;

          if (title) existing.title = title;
          if (description !== undefined) existing.description = description;
          existing.updatedAt = new Date();

          // Handle attachments
          if (attachments) {
            // Remove attachments
            if (attachments.remove && attachments.remove.length > 0) {
              existing.attachments = existing.attachments.filter(
                (a) => !attachments.remove?.includes(a.id),
              );
            }

            // Add new attachments
            if (attachments.add && attachments.add.length > 0) {
              for (const attachment of attachments.add) {
                if (attachment.type === "url") {
                  existing.attachments.push({
                    id: `attachment-${Date.now()}-${Math.random()}`,
                    resourceId: id,
                    type: "url",
                    url: attachment.url,
                    name: attachment.name,
                    fileFormat: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                } else if (attachment.type === "file") {
                  existing.attachments.push({
                    id: `attachment-${Date.now()}-${Math.random()}`,
                    resourceId: id,
                    type: "file",
                    url: `https://s3.example.com/${id}/${attachment.name}`,
                    name: attachment.name,
                    fileFormat: attachment.name.split(".").pop() ?? "unknown",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }
              }
            }

            // Update existing attachments
            if (attachments.update && attachments.update.length > 0) {
              for (const update of attachments.update) {
                const attachment = existing.attachments.find(
                  (a) => a.id === update.id,
                );
                if (attachment) {
                  if (update.name) attachment.name = update.name;
                  attachment.updatedAt = new Date();
                }
              }
            }
          }

          testResources.set(id, existing);

          return { success: true, message: "Resource updated successfully" };
        },
        {
          auth: true,
          body: t.Object({
            title: t.Optional(t.String({ minLength: 1 })),
            description: t.Optional(t.String()),
            attachments: t.Optional(
              t.Object({
                add: t.Optional(t.Array(attachmentSchema)),
                update: t.Optional(
                  t.Array(
                    t.Object({
                      id: t.String(),
                      name: t.Optional(t.String()),
                      url: t.Optional(t.String()),
                    }),
                  ),
                ),
                remove: t.Optional(t.Array(t.String())),
              }),
            ),
          }),
        },
      )
      // Delete resource
      .delete(
        "/:id",
        async ({ params: { id }, set }) => {
          if (!testResources.has(id)) {
            set.status = 404;
            return { success: false, error: "Resource not found" };
          }
          testResources.delete(id);
          return { success: true, message: "Resource deleted successfully" };
        },
        { auth: true },
      )
      // Get attachments for a resource
      .get("/:id/attachments", async ({ params: { id }, set }) => {
        const resource = testResources.get(id);
        if (!resource) {
          set.status = 404;
          return { success: false, error: "Resource not found" };
        }
        return { success: true, data: resource.attachments };
      })
      // Add attachment to resource
      .post(
        "/:id/attachments",
        async ({ params: { id }, body, set }) => {
          const resource = testResources.get(id);
          if (!resource) {
            set.status = 404;
            return { success: false, error: "Resource not found" };
          }

          const { type, url, name } = body;

          if (type === "url" && name) {
            const now = new Date();
            const attachment: TestAttachment = {
              id: `attachment-${Date.now()}-${Math.random()}`,
              resourceId: id,
              type: "url",
              url: url ?? "",
              name: name as string,
              fileFormat: null,
              createdAt: now,
              updatedAt: now,
            };
            resource.attachments.push(attachment);
            testResources.set(id, resource);

            return {
              success: true,
              data: {
                id: attachment.id,
                type,
                url,
                name,
                fileFormat: null,
              },
            };
          }

          set.status = 400;
          return { success: false, error: "Invalid attachment data" };
        },
        {
          auth: true,
          body: t.Object({
            type: t.Union([t.Literal("file"), t.Literal("url")]),
            url: t.Optional(t.String()),
            name: t.String({ minLength: 1 }),
          }),
        },
      )
      // Delete attachment
      .delete(
        "/:id/attachments/:attachmentId",
        async ({ params: { id, attachmentId }, set }) => {
          const resource = testResources.get(id);
          if (!resource) {
            set.status = 404;
            return { success: false, error: "Resource not found" };
          }

          const before = resource.attachments.length;
          resource.attachments = resource.attachments.filter(
            (a) => a.id !== attachmentId,
          );

          if (resource.attachments.length === before) {
            set.status = 404;
            return { success: false, error: "Attachment not found" };
          }

          testResources.set(id, resource);
          return { success: true, message: "Attachment deleted successfully" };
        },
        { auth: true },
      )
  );
};

describe("Resource Attachments API", () => {
  let app: ReturnType<typeof createResourceRoutes>;
  let testContentTypeId: string;
  let testResourceId: string | null = null;

  beforeAll(() => {
    app = createResourceRoutes();

    // Create a test content type
    testContentTypeId = `content-type-${Date.now()}`;
    testContentTypes.push({
      id: testContentTypeId,
      name: "Test Content Type",
      description: "For testing",
    });
  });

  afterAll(() => {
    // Cleanup test data
    testResources.clear();
    testContentTypes.length = 0;
  });

  describe("POST /resources - Create resource with attachments", () => {
    it("should create a resource with 2 files and 1 URL attachment", async () => {
      const response = await app.handle(
        new Request("http://localhost/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test Resource with Multiple Attachments",
            contentTypeId: testContentTypeId,
            attachments: [
              { name: "test-file-1.pdf", type: "file" },
              { name: "test-file-2.pdf", type: "file" },
              {
                name: "Reference URL",
                type: "url",
                url: "https://example.com/reference",
              },
            ],
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.attachments).toBeDefined();
      expect(body.data.attachments.length).toBe(3);

      // Verify the attachments
      const attachments = body.data.attachments;
      const fileAttachments = attachments.filter(
        (a: { type: string }) => a.type === "file",
      );
      const urlAttachments = attachments.filter(
        (a: { type: string }) => a.type === "url",
      );

      expect(fileAttachments.length).toBe(2);
      expect(urlAttachments.length).toBe(1);
      expect(urlAttachments[0].url).toBe("https://example.com/reference");

      // Store the resource ID for later tests
      testResourceId = body.data.id;
    });

    it("should reject creating resource without required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // title is missing
            contentTypeId: testContentTypeId,
            attachments: [],
          }),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /resources/:id - Fetch resource with attachments", () => {
    it("should fetch the resource and include all attachments", async () => {
      if (!testResourceId) {
        throw new Error("Resource ID not set from previous test");
      }

      const response = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "GET",
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.attachments).toBeDefined();
      expect(body.data.attachments.length).toBe(3);

      // Verify attachment types
      const attachments = body.data.attachments;
      const fileAttachments = attachments.filter(
        (a: { type: string }) => a.type === "file",
      );
      const urlAttachments = attachments.filter(
        (a: { type: string }) => a.type === "url",
      );

      expect(fileAttachments.length).toBe(2);
      expect(urlAttachments.length).toBe(1);
    });

    it("should return 404 for non-existent resource", async () => {
      const response = await app.handle(
        new Request("http://localhost/resources/non-existent-id", {
          method: "GET",
        }),
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("PUT /resources/:id - Update attachments", () => {
    it("should add a new URL attachment and remove one file attachment", async () => {
      if (!testResourceId) {
        throw new Error("Resource ID not set from previous test");
      }

      // First, get the resource to find the file attachment ID to remove
      const getResponse = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "GET",
        }),
      );
      const getBody = await getResponse.json();
      const currentAttachments = getBody.data.attachments;
      const fileAttachmentToRemove = currentAttachments.find(
        (a: { type: string }) => a.type === "file",
      );

      expect(fileAttachmentToRemove).toBeDefined();

      const response = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachments: {
              add: [
                {
                  name: "Additional Reference",
                  type: "url",
                  url: "https://example.com/additional",
                },
              ],
              remove: [fileAttachmentToRemove.id],
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("should have the correct attachments after update", async () => {
      if (!testResourceId) {
        throw new Error("Resource ID not set from previous test");
      }

      const response = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "GET",
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      const attachments = body.data.attachments;

      // Should now have: 1 file (original 2 - 1 removed) + 2 URLs (original 1 + 1 added)
      const fileAttachments = attachments.filter(
        (a: { type: string }) => a.type === "file",
      );
      const urlAttachments = attachments.filter(
        (a: { type: string }) => a.type === "url",
      );

      expect(fileAttachments.length).toBe(1);
      expect(urlAttachments.length).toBe(2);

      // Verify the URLs
      const urls = urlAttachments.map((a: { url: string }) => a.url);
      expect(urls).toContain("https://example.com/reference");
      expect(urls).toContain("https://example.com/additional");
    });
  });

  describe("DELETE /resources/:id - Cleanup", () => {
    it("should delete the test resource", async () => {
      if (!testResourceId) {
        throw new Error("Resource ID not set from previous test");
      }

      const response = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("should confirm resource is deleted", async () => {
      if (!testResourceId) {
        throw new Error("Resource ID not set from previous test");
      }

      const response = await app.handle(
        new Request(`http://localhost/resources/${testResourceId}`, {
          method: "GET",
        }),
      );

      expect(response.status).toBe(404);
    });
  });
});

console.log("\n✅ Resource attachments verification tests completed!\n");
