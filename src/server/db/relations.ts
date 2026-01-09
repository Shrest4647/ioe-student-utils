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

  // --- Scholarship Relations ---

  scholarships: {
    rounds: r.many.scholarshipRounds({
      from: r.scholarships.id,
      to: r.scholarshipRounds.scholarshipId,
    }),
    countries: r.many.scholarshipsToCountries({
      from: r.scholarships.id,
      to: r.scholarshipsToCountries.scholarshipId,
    }),
    degrees: r.many.scholarshipsToDegrees({
      from: r.scholarships.id,
      to: r.scholarshipsToDegrees.scholarshipId,
    }),
    fields: r.many.scholarshipsToFields({
      from: r.scholarships.id,
      to: r.scholarshipsToFields.scholarshipId,
    }),
  },

  scholarshipRounds: {
    scholarship: r.one.scholarships({
      from: r.scholarshipRounds.scholarshipId,
      to: r.scholarships.id,
    }),
    events: r.many.roundEvents({
      from: r.scholarshipRounds.id,
      to: r.roundEvents.roundId,
    }),
  },

  roundEvents: {
    round: r.one.scholarshipRounds({
      from: r.roundEvents.roundId,
      to: r.scholarshipRounds.id,
    }),
  },

  countries: {
    scholarships: r.many.scholarships({
      from: r.countries.code.through(r.scholarshipsToCountries.countryCode),
      to: r.scholarships.id.through(r.scholarshipsToCountries.scholarshipId),
    }),
  },
  degreeLevels: {
    scholarships: r.many.scholarships({
      from: r.degreeLevels.id.through(r.scholarshipsToDegrees.degreeId),
      to: r.scholarships.id.through(r.scholarshipsToDegrees.scholarshipId),
    }),
  },
  fieldsOfStudy: {
    scholarships: r.many.scholarships({
      from: r.fieldsOfStudy.id.through(r.scholarshipsToFields.fieldId),
      to: r.scholarships.id.through(r.scholarshipsToFields.scholarshipId),
    }),
  },

  // Junction Tables Relations (needed for many-to-many lookups via `with`)
  scholarshipsToCountries: {
    scholarship: r.one.scholarships({
      from: r.scholarshipsToCountries.scholarshipId,
      to: r.scholarships.id,
    }),
    country: r.one.countries({
      from: r.scholarshipsToCountries.countryCode,
      to: r.countries.code,
    }),
  },
  scholarshipsToDegrees: {
    scholarship: r.one.scholarships({
      from: r.scholarshipsToDegrees.scholarshipId,
      to: r.scholarships.id,
    }),
    degree: r.one.degreeLevels({
      from: r.scholarshipsToDegrees.degreeId,
      to: r.degreeLevels.id,
    }),
  },
  scholarshipsToFields: {
    scholarship: r.one.scholarships({
      from: r.scholarshipsToFields.scholarshipId,
      to: r.scholarships.id,
    }),
    field: r.one.fieldsOfStudy({
      from: r.scholarshipsToFields.fieldId,
      to: r.fieldsOfStudy.id,
    }),
  },
}));
