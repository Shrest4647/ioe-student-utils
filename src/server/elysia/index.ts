import { Elysia } from "elysia";
import { authorizationPlugin } from "./plugins/authorization";
import { betterAuthPlugin } from "./plugins/better-auth";
import { corsPlugin } from "./plugins/cors";
import { openApiPlugin } from "./plugins/openapi";
import { certificationRoutes } from "./routes/certifications";
import { collegeRoutes } from "./routes/colleges";
import { departmentRoutes } from "./routes/departments";
import { educationRoutes } from "./routes/education";
import { gpaConverterRoutes } from "./routes/gpa-converter";
import { languageSkillRoutes } from "./routes/language-skills";
import { positionRoutes } from "./routes/positions";
import { profileRoutes } from "./routes/profiles";
import { courseRoutes, programRoutes } from "./routes/programs";
import { projectRoutes } from "./routes/projects";
import { ratingRoutes } from "./routes/ratings";
import { recommendationRoutes } from "./routes/recommendations";
import { savedRecommendationsRoutes } from "./routes/recommendations-saved";
import { referenceRoutes } from "./routes/references";
import { resourceRoutes } from "./routes/resources";
import { resumeRoutes } from "./routes/resumes";
import { scholarshipRoutes } from "./routes/scholarships";
import { skillRoutes } from "./routes/skills";
import { universityRoutes } from "./routes/universities";
import { userRoutes } from "./routes/user";
import { workExperienceRoutes } from "./routes/work-experiences";

export const elysiaApi = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(betterAuthPlugin)
  .use(authorizationPlugin)
  .use(openApiPlugin)
  .use(userRoutes)
  .use(resourceRoutes)
  .use(profileRoutes)
  .use(workExperienceRoutes)
  .use(educationRoutes)
  .use(skillRoutes)
  .use(projectRoutes)
  .use(positionRoutes)
  .use(certificationRoutes)
  .use(languageSkillRoutes)
  .use(referenceRoutes)
  .use(resumeRoutes)
  .use(scholarshipRoutes)
  .use(universityRoutes)
  .use(collegeRoutes)
  .use(departmentRoutes)
  .use(ratingRoutes)
  .use(programRoutes)
  .use(courseRoutes)
  .use(recommendationRoutes)
  .use(savedRecommendationsRoutes)
  .use(gpaConverterRoutes)
  .get("/", () => "👋 Hello from IOESU", {
    detail: {
      tags: ["App"],
    },
  })
  .get("/health", () => ({ status: "ok" }), {
    detail: {
      tags: ["App"],
    },
  })
  .get("/protected", ({ user }) => `Hello ${user.name}!`, {
    auth: true,
    detail: {
      tags: ["Auth"],
    },
  });

export type App = typeof elysiaApi;
