import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    account: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    session: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    profile: r.one.userProfile({
      from: r.user.id,
      to: r.userProfile.userId,
    }),
    resources: r.many.resources({
      from: r.user.id,
      to: r.resources.uploaderId,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  userProfile: {
    user: r.one.user({
      from: r.userProfile.userId,
      to: r.user.id,
    }),
  },

  resourceAttachments: {
    resource: r.one.resources({
      from: r.resourceAttachments.resourceId,
      to: r.resources.id,
    }),
  },
  resourceCategories: {
    resources: r.many.resources({
      from: r.resourceCategories.id.through(r.resourcesToCategories.categoryId),
      to: r.resources.id.through(r.resourcesToCategories.resourceId),
    }),
  },

  resourceContentTypes: {
    resources: r.many.resources({
      from: r.resourceContentTypes.id,
      to: r.resources.contentTypeId,
    }),
  },
  resources: {
    uploader: r.one.user({
      from: r.resources.uploaderId,
      to: r.user.id,
    }),
    attachments: r.many.resourceAttachments({
      from: r.resources.id,
      to: r.resourceAttachments.resourceId,
    }),
    categories: r.many.resourceCategories({
      from: r.resources.id.through(r.resourcesToCategories.resourceId),
      to: r.resourceCategories.id.through(r.resourcesToCategories.categoryId),
    }),
    contentType: r.one.resourceContentTypes({
      from: r.resources.contentTypeId,
      to: r.resourceContentTypes.id,
    }),
  },
}));
