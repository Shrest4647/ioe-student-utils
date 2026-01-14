#### Task 1.3: Create API Route Structure

**File**: `src/server/elysia/routes/resumes.ts`
**Complexity**: Moderate
**Dependencies**: Task 1.1

**Steps**:

1. Create new Elysia router: `new Elysia({ prefix: "/resumes" })`
2. Apply `authorizationPlugin` (line 16 in resources.ts)
3. Define validation schemas using `t.Object()` and `t.String()`
4. Create CRUD endpoints:

```typescript
// Profile endpoints
.get("/profile", async ({ user }) => {
  // Fetch or create user's resume profile (one to one)
})
.post("/profile", async ({ user, body }) => {
  // Create/update profile
})
.patch("/profile", async ({ user, body }) => {
  // Update profile
})
.delete("/profile", async ({ user }) => {
  // Delete profile
})

// Work experience endpoints
.get("/profile/experiences", async ({ user }) => {
  // Get all work experiences for user's profile
})
.post("/profile/experiences", async ({ user, body }) => {
  // Add work experience
})
.patch("/profile/experiences/:id", async ({ params, body }) => {
  // Update experience
})
.delete("/profile/experiences/:id", async ({ params }) => {
  // Delete experience
})

// Similar endpoints for education, skills
// Education endpoints
.get("/profile/education", async ({ user }) => {
  // Get all education records for user's profile
})
.post("/profile/education", async ({ user, body }) => {
  // Add education record
})
.patch("/profile/education/:id", async ({ params, body }) => {
  // Update education record
})
.delete("/profile/education/:id", async ({ params }) => {
  // Delete education record
})

// Skills endpoints
.get("/profile/skills", async ({ user }) => {
  // Get all skills for user's profile
})
.post("/profile/skills", async ({ user, body }) => {
  // Add skill
})
.patch("/profile/skills/:id", async ({ params, body }) => {
  // Update skill
})
.delete("/profile/skills/:id", async ({ params }) => {
  // Delete skill
})

// Projects endpoints
.get("/profile/projects", async ({ user }) => {
  // Get all projects for user's profile
})
.post("/profile/projects", async ({ user, body }) => {
  // Add project
})
.patch("/profile/projects/:id", async ({ params, body }) => {
  // Update project
})
.delete("/profile/projects/:id", async ({ params }) => {
  // Delete project
})

// Positions of Responsibility endpoints
.get("/profile/positions", async ({ user }) => {
  // Get all positions for user's profile
})
.post("/profile/positions", async ({ user, body }) => {
  // Add position
})
.patch("/profile/positions/:id", async ({ params, body }) => {
  // Update position
})
.delete("/profile/positions/:id", async ({ params }) => {
  // Delete position
})

// Certifications endpoints
.get("/profile/certifications", async ({ user }) => {
  // Get all certifications for user's profile
})
.post("/profile/certifications", async ({ user, body }) => {
  // Add certification
})
.patch("/profile/certifications/:id", async ({ params, body }) => {
  // Update certification
})
.delete("/profile/certifications/:id", async ({ params }) => {
  // Delete certification
})


// languageSkills endpoints
.get("/profile/languageSkills", async ({ user }) => {
  // Get all languageSkills for user's profile
})
.post("/profile/languageSkills", async ({ user, body }) => {
  // Add languageSkill
})
.patch("/profile/languageSkills/:id", async ({ params, body }) => {
  // Update languageSkill
})
.delete("/profile/languageSkills/:id", async ({ params }) => {
  // Delete languageSkill
})

// References endpoints
.get("/profile/references", async ({ user }) => {
  // Get all references for user's profile
})
.post("/profile/references", async ({ user, body }) => {
  // Add reference
})
.patch("/profile/references/:id", async ({ params, body }) => {
  // Update reference
})
.delete("/profile/references/:id", async ({ params }) => {
  // Delete reference
})

// Resume endpoints
.get("/profile/resumes/mine", async ({ user }) => {
  // List all user's own resumes
})
.post("/profile/resumes", async ({ user, body }) => {
  // Create new resume from profile
})
.get("/profile/resumes/:id", async ({ params }) => {
  // Get resume details including all sections
})
.patch("/profile/resumes/:id", async ({ params, body }) => {
  // Update resume
})
.delete("/profile/resumes/:id", async ({ params }) => {
  // Delete resume
})
```

**Reference Pattern**: Follow `resources.ts` structure (lines 55-100)
**Drizzle where Query**: In drizzle v1, where query function db.query.findMany has breaking changes from v0. Check the documentation for the correct syntax at [here](../../docs/drizzle-v1-changes.md) and [here](../../docs/drizzle-queries.md)

---
