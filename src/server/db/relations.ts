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
    recommendationLetters: r.many.recommendationLetter({
      from: r.user.id,
      to: r.recommendationLetter.studentId,
    }),
    recommendationTemplates: r.many.recommendationTemplate({
      from: r.user.id,
      to: r.recommendationTemplate.createdById,
    }),
    studentProfileData: r.one.studentProfileData({
      from: r.user.id,
      to: r.studentProfileData.userId,
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

  // --- University Yelper Relations ---

  universities: {
    colleges: r.many.colleges({
      from: r.universities.id,
      to: r.colleges.universityId,
    }),
    ratings: r.many.ratings({
      from: r.universities.id.through(r.universityToRatings.universityId),
      to: r.ratings.id.through(r.universityToRatings.ratingId),
    }),
  },

  colleges: {
    university: r.one.universities({
      from: r.colleges.universityId,
      to: r.universities.id,
    }),
    collegeDepartments: r.many.collegeDepartments({
      from: r.colleges.id,
      to: r.collegeDepartments.collegeId,
    }),
    ratings: r.many.ratings({
      from: r.colleges.id.through(r.collegeToRatings.collegeId),
      to: r.ratings.id.through(r.collegeToRatings.ratingId),
    }),
  },

  departments: {
    colleges: r.many.colleges({
      from: r.departments.id.through(r.collegeDepartments.departmentId),
      to: r.colleges.id.through(r.collegeDepartments.collegeId),
    }),
    ratings: r.many.ratings({
      from: r.departments.id.through(r.departmentToRatings.departmentId),
      to: r.ratings.id.through(r.departmentToRatings.ratingId),
    }),
  },

  collegeDepartments: {
    college: r.one.colleges({
      from: r.collegeDepartments.collegeId,
      to: r.colleges.id,
    }),
    department: r.one.departments({
      from: r.collegeDepartments.departmentId,
      to: r.departments.id,
    }),
    academicPrograms: r.many.academicPrograms({
      from: r.collegeDepartments.id.through(
        r.collegeDepartmentsToPrograms.collegeDepartmentId,
      ),
      to: r.academicPrograms.id.through(
        r.collegeDepartmentsToPrograms.programId,
      ),
    }),
    ratings: r.many.ratings({
      from: r.collegeDepartments.id.through(
        r.collegeDepartmentsToRatings.collegeDepartmentId,
      ),
      to: r.ratings.id.through(r.collegeDepartmentsToRatings.ratingId),
    }),
  },

  collegeDepartmentsToPrograms: {
    collegeDepartment: r.one.collegeDepartments({
      from: r.collegeDepartmentsToPrograms.collegeDepartmentId,
      to: r.collegeDepartments.id,
    }),
    program: r.one.academicPrograms({
      from: r.collegeDepartmentsToPrograms.programId,
      to: r.academicPrograms.id,
    }),
    ratings: r.many.ratings({
      from: r.collegeDepartmentsToPrograms.id.through(
        r.collegeDepartmentProgramsToRatings.collegeDepartmentProgramId,
      ),
      to: r.ratings.id.through(r.collegeDepartmentProgramsToRatings.ratingId),
    }),
  },

  academicPrograms: {
    collegeDepartments: r.many.collegeDepartments({
      from: r.academicPrograms.id.through(
        r.collegeDepartmentsToPrograms.programId,
      ),
      to: r.collegeDepartments.id.through(
        r.collegeDepartmentsToPrograms.collegeDepartmentId,
      ),
    }),
    academicCourses: r.many.academicCourses({
      from: r.academicPrograms.id.through(
        r.collegeDepartmentProgramToCourses.programId,
      ),
      to: r.academicCourses.id.through(
        r.collegeDepartmentProgramToCourses.courseId,
      ),
    }),
    ratings: r.many.ratings({
      from: r.academicPrograms.id.through(
        r.collegeDepartmentProgramsToRatings.collegeDepartmentProgramId,
      ),
      to: r.ratings.id.through(r.collegeDepartmentProgramsToRatings.ratingId),
    }),
  },

  academicCourses: {
    academicPrograms: r.many.academicPrograms({
      from: r.academicCourses.id.through(
        r.collegeDepartmentProgramToCourses.courseId,
      ),
      to: r.academicPrograms.id.through(
        r.collegeDepartmentProgramToCourses.programId,
      ),
    }),
    ratings: r.many.ratings({
      from: r.academicCourses.id.through(r.courseToRatings.courseId),
      to: r.ratings.id.through(r.courseToRatings.ratingId),
    }),
  },

  collegeDepartmentProgramToCourses: {
    program: r.one.collegeDepartmentsToPrograms({
      from: r.collegeDepartmentProgramToCourses.programId,
      to: r.collegeDepartmentsToPrograms.id,
    }),
    course: r.one.academicCourses({
      from: r.collegeDepartmentProgramToCourses.courseId,
      to: r.academicCourses.id,
    }),
    ratings: r.many.ratings({
      from: r.collegeDepartmentProgramToCourses.id.through(
        r.collegeDepartmentProgramCourseToRatings
          .collegeDepartmentProgramToCourseId,
      ),
      to: r.ratings.id.through(
        r.collegeDepartmentProgramCourseToRatings.ratingId,
      ),
    }),
  },

  universityToRatings: {
    university: r.one.universities({
      from: r.universityToRatings.universityId,
      to: r.universities.id,
    }),
    rating: r.one.ratings({
      from: r.universityToRatings.ratingId,
      to: r.ratings.id,
    }),
  },

  collegeToRatings: {
    college: r.one.colleges({
      from: r.collegeToRatings.collegeId,
      to: r.colleges.id,
    }),
    rating: r.one.ratings({
      from: r.collegeToRatings.ratingId,
      to: r.ratings.id,
    }),
  },

  collegeDepartmentsToRatings: {
    collegeDepartment: r.one.collegeDepartments({
      from: r.collegeDepartmentsToRatings.collegeDepartmentId,
      to: r.collegeDepartments.id,
    }),
    rating: r.one.ratings({
      from: r.collegeDepartmentsToRatings.ratingId,
      to: r.ratings.id,
    }),
  },

  collegeDepartmentProgramsToRatings: {
    collegeDepartmentProgram: r.one.collegeDepartmentsToPrograms({
      from: r.collegeDepartmentProgramsToRatings.collegeDepartmentProgramId,
      to: r.collegeDepartmentsToPrograms.id,
    }),
    rating: r.one.ratings({
      from: r.collegeDepartmentProgramsToRatings.ratingId,
      to: r.ratings.id,
    }),
  },

  collegeDepartmentProgramCourseToRatings: {
    collegeDepartmentProgramCourse: r.one.collegeDepartmentProgramToCourses({
      from: r.collegeDepartmentProgramCourseToRatings
        .collegeDepartmentProgramToCourseId,
      to: r.collegeDepartmentProgramToCourses.id,
    }),
    rating: r.one.ratings({
      from: r.collegeDepartmentProgramCourseToRatings.ratingId,
      to: r.ratings.id,
    }),
  },

  ratings: {
    user: r.one.user({
      from: r.ratings.userId,
      to: r.user.id,
    }),
    ratingCategory: r.one.ratingCategories({
      from: r.ratings.ratingCategoryId,
      to: r.ratingCategories.id,
    }),
  },

  ratingCategories: {
    ratings: r.many.ratings({
      from: r.ratingCategories.id,
      to: r.ratings.ratingCategoryId,
    }),
  },

  // Recommendation Letter Generator Relations
  recommendationTemplate: {
    createdBy: r.one.user({
      from: r.recommendationTemplate.createdById,
      to: r.user.id,
    }),
    updatedBy: r.one.user({
      from: r.recommendationTemplate.updatedById,
      to: r.user.id,
    }),
    recommendationLetters: r.many.recommendationLetter({
      from: r.recommendationTemplate.id,
      to: r.recommendationLetter.templateId,
    }),
  },

  recommendationLetter: {
    student: r.one.user({
      from: r.recommendationLetter.studentId,
      to: r.user.id,
    }),
    template: r.one.recommendationTemplate({
      from: r.recommendationLetter.templateId,
      to: r.recommendationTemplate.id,
    }),
  },

  studentProfileData: {
    user: r.one.user({
      from: r.studentProfileData.userId,
      to: r.user.id,
    }),
  },
}));
