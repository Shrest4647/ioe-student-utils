# Database Schema Improvements Implementation Plan

## Overview
This plan addresses critical issues identified in the database schema review to improve performance, data integrity, and maintainability.

**Review Date**: 2026-01-26
**Schema File**: `src/server/db/schema.ts`
**Priority**: High

## Issues Summary

### Critical Issues (Must Fix)
1. ✅ Mixed status design pattern (`isActive` + `status` redundancy)
2. ✅ Missing critical indexes on slugs, timestamps, and foreign keys
3. ✅ Numeric data stored as text (GPA, percentages)
4. ✅ Missing check constraints for validation
5. ✅ Rating system vulnerabilities

### Medium Priority
6. ✅ Duplicate junction table pattern (7 identical rating tables)
7. ✅ JSONB overuse without validation
8. ✅ Inconsistent timestamp handling
9. ✅ Missing composite indexes
10. ✅ Cascade strategy inconsistency

### Low Priority
11. ✅ Missing audit fields
12. ✅ Date format inconsistency
13. ✅ Missing unique constraints

---

## Implementation Tasks

### Phase 1: Critical Data Integrity Fixes

#### Task 1.1: Fix Redundant Status Flags
**Files**: `src/server/db/schema.ts`

**Problem**:
- `scholarships` table has both `isActive` boolean and `status` enum
- Creates confusion about source of truth

**Solution**:
```typescript
// Remove isActive, rely only on status
status: text("status", {
  enum: ["active", "inactive", "archived", "draft", "pending_review"],
}).default("draft"),
```

**Migration Required**: Yes
- Drop `is_active` column
- Update existing data to map `isActive=true` → `status="active"`

**Affected Tables**:
- `scholarships` (line 279-282)

---

#### Task 1.2: Convert Numeric Text Fields to Decimal
**Files**: `src/server/db/schema.ts`

**Problem**:
- Numbers stored as text prevent mathematical operations and proper sorting

**Solution**:
```typescript
// gpaConversionRanges (lines 1188-1191)
minPercentage: decimal("min_percentage", { precision: 5, scale: 2 }).notNull(),
maxPercentage: decimal("max_percentage", { precision: 5, scale: 2 }).notNull(),
gpaValue: decimal("gpa_value", { precision: 3, scale: 2 }).notNull(),

// gpaConversions (line 1217)
cumulativeGPA: decimal("cumulative_gpa", { precision: 3, scale: 2 }).notNull(),
totalCredits: decimal("total_credits", { precision: 10, scale: 2 }).notNull(),
totalQualityPoints: decimal("total_quality_points", { precision: 10, scale: 2 }).notNull(),
courseCount: integer("course_count").notNull(),
```

**Migration Required**: Yes
- Create migration to alter column types
- Validate all existing data can be converted to decimal

**Affected Tables**:
- `gpaConversionRanges` (lines 1188-1191)
- `gpaConversions` (lines 1217-1220)

---

#### Task 1.3: Add Check Constraints for Ratings
**Files**: `src/server/db/schema.ts`

**Problem**:
- Ratings have no range validation
- Users can submit invalid ratings
- No protection against duplicate ratings from same user

**Solution**:
```typescript
// ratings table (line 596)
rating: integer("rating").notNull(),
// Add check constraint via SQL in migration
// CHECK (rating >= 1 AND rating <= 5)

// Add unique constraints to prevent duplicate ratings
// Each junction table needs:
// UNIQUE (user_id, entity_id)
```

**Migration Required**: Yes
- Add CHECK constraints
- Add UNIQUE constraints on all rating junction tables

**Affected Tables**:
- `ratings` (line 596)
- All rating junction tables (lines 608-746)

---

### Phase 2: Performance Optimization

#### Task 2.1: Add Missing Indexes on Slug Fields
**Files**: `src/server/db/schema.ts`

**Problem**:
- Slug fields are queried frequently but not indexed
- Causes full table scans on lookups

**Solution**:
```typescript
// scholarships (line 272)
index("scholarship_slug_idx").on(t.slug),

// universities (line 412)
index("university_slug_idx").on(t.slug),

// colleges (line 436)
index("college_slug_idx").on(t.slug),

// departments (line 455)
index("department_slug_idx").on(t.slug),
```

**Migration Required**: Yes
- Create indexes for all slug fields
- Measure query performance before/after

**Expected Impact**: 10-100x faster lookups on slug queries

---

#### Task 2.2: Add Composite Indexes for Common Query Patterns
**Files**: `src/server/db/schema.ts`

**Problem**:
- Common multi-column queries inefficient
- Individual indexes don't help with combined filters

**Solution**:
```typescript
// recommendationLetter (lines 1006-1009)
index("recommendation_letter_student_status_created").on(
  t.studentId,
  t.status,
  t.createdAt
),

// scholarships
index("scholarship_status_active_created").on(
  t.status,
  t.createdAt
),

// userApplications
index("user_application_user_status").on(
  t.userId,
  t.status
),
```

**Migration Required**: Yes
- Analyze query logs to identify patterns
- Create composite indexes

**Expected Impact**: 5-50x faster filtered queries

---

#### Task 2.3: Add Indexes on Timestamp and Flag Columns
**Files**: `src/server/db/schema.ts`

**Problem**:
- Frequent sorting/filtering on `createdAt`, `updatedAt`, `isActive`
- No indexes for these operations

**Solution**:
```typescript
// For all tables with these fields:
index("table_created_at_idx").on(t.createdAt),
index("table_updated_at_idx").on(t.updatedAt),
index("table_is_active_idx").on(t.isActive),
index("table_status_idx").on(t.status),
```

**Migration Required**: Yes
- Add indexes to major tables (scholarships, universities, etc.)

**Expected Impact**: Faster sorting and pagination

---

### Phase 3: Schema Refactoring

#### Task 3.1: Refactor Rating Junction Tables to Polymorphic Pattern
**Files**: `src/server/db/schema.ts`

**Problem**:
- 7 identical junction tables for ratings
- Maintenance nightmare
- Difficult to query across all ratings

**Solution**:
```typescript
// Replace 7 junction tables with single polymorphic table
export const entityRatings = pgTable("entity_rating", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  entityType: text("entity_type", {
    enum: ["university", "college", "department", "college_department",
           "program", "college_department_program", "course",
           "college_department_program_course"]
  }).notNull(),
  entityId: text("entity_id").notNull(),
  ratingId: text("rating_id")
    .notNull()
    .references(() => ratings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
}, (t) => [
  index("entity_rating_entity_idx").on(t.entityType, t.entityId),
  index("entity_rating_user_idx").on(t.userId),
  unique("unique_user_entity_rating").on(t.userId, t.entityType, t.entityId),
]);

// Helper view for each entity type can be created
```

**Migration Required**: Yes (complex)
- Create new `entityRatings` table
- Migrate data from all 7 junction tables
- Update application queries
- Drop old tables

**Effort**: High
**Impact**: Significantly simpler schema and queries

---

#### Task 3.2: Replace JSONB with Proper Tables
**Files**: `src/server/db/schema.ts`

**Problem**:
- JSONB fields without validation
- Can't query efficiently
- No DB-level constraints

**Areas to Fix**:

1. **Address Field** (line 759):
```typescript
// Replace with:
export const addresses = pgTable("address", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  street: text("street"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
});

// Then reference from resumeProfiles
addressId: text("address_id").references(() => addresses.id),
```

2. **Skills Field** (line 824):
```typescript
// Replace with:
export const skills = pgTable("skill", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
});

export const userProfileSkills = pgTable("user_profile_skill", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  proficiencyLevel: text("proficiency_level", {
    enum: ["beginner", "intermediate", "advanced", "expert"]
  }),
}, (t) => [
  unique("unique_profile_skill").on(t.profileId, t.skillId),
]);
```

3. **Resume Sections** (line 886):
```typescript
export const resumeSections = pgTable("resume_section", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  sectionType: text("section_type", {
    enum: ["contact", "summary", "experience", "education", "skills",
           "projects", "certifications", "languages", "references"]
  }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (t) => [
  unique("unique_resume_section_type").on(t.resumeId, t.sectionType),
  index("resume_section_resume_order").on(t.resumeId, t.sortOrder),
]);
```

4. **GPA Calculation Data** (line 1221):
```typescript
export const gpaCourses = pgTable("gpa_course", {
  id: text("id").primaryKey(),
  conversionId: text("conversion_id")
    .notNull()
    .references(() => gpaConversions.id, { onDelete: "cascade" }),
  courseName: text("course_name").notNull(),
  grade: text("grade").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  credits: decimal("credits", { precision: 5, scale: 2 }).notNull(),
  gpaValue: decimal("gpa_value", { precision: 3, scale: 2 }).notNull(),
});
```

**Migration Required**: Yes (complex)
- Create new tables
- Migrate and validate JSONB data
- Update application code
- Remove JSONB columns

**Effort**: High
**Impact**: Better queryability, validation, and data integrity

---

### Phase 4: Consistency & Best Practices

#### Task 4.1: Standardize Timestamp Handling
**Files**: `src/server/db/schema.ts`

**Problem**:
- Inconsistent timestamp defaults
- Some have `.notNull()`, some don't

**Solution**:
```typescript
// Standard pattern for all tables:
createdAt: timestamp("created_at")
  .$defaultFn(() => new Date())
  .notNull(),
updatedAt: timestamp("updated_at")
  .$onUpdate(() => new Date())
  .notNull(),
```

**Migration Required**: Yes
- Update all timestamp columns to use consistent pattern
- Add missing `.notNull()` constraints

**Affected Tables**:
- `session` (lines 52-63)
- `account` (lines 65-81)
- Any others missing proper defaults

---

#### Task 4.2: Document Cascade Strategy
**Files**: `src/server/db/schema.ts`, new docs file

**Problem**:
- Mix of `cascade`, `set null`, `restrict`
- No clear documentation of why each is used

**Solution**:

Create `docs/database-cascade-strategy.md`:
```markdown
# Database Cascade Strategy

## Policy

### ON DELETE CASCADE
Use for:
- User-owned data (applications, profiles, sessions)
- Child entities that shouldn't exist without parent
- Many-to-many junction tables

Examples:
- `userApplications.userId` → `user.id`
- `resumeProfiles.userId` → `user.id`

### ON DELETE SET NULL
Use for:
- Optional references
- Categorization (categories, content types)
- Non-critical metadata

Examples:
- `resources.contentTypeId` → `resourceContentTypes.id`
- `scholarships.createdById` → `user.id`

### ON DELETE RESTRICT (default)
Use for:
- Critical business data
- References that require explicit handling
- Audit trails

Examples:
- `scholarshipsToCountries.scholarshipId` → prevent deletion if countries exist
```

**Action Required**: Document current strategy and ensure consistency

---

#### Task 4.3: Add Validation Constraints
**Files**: `src/server/db/schema.ts`

**Problem**:
- Email fields lack format validation
- URL fields lack format validation
- Missing check constraints

**Solution**:
```typescript
// user.email (line 36)
email: text("email")
  .notNull()
  .unique(),
// Add check: email ~ '^[^@]+@[^@]+\.[^@]+$'

// All URL fields
websiteUrl: text("website_url"),
// Add check: website_url ~ '^https?://'

// apikey.key (line 103)
key: text("key").notNull().unique(),

// scholarhipRounds.deadlineDate
deadlineDate: timestamp("deadline_date"),
// Add check: deadline_date > open_date
```

**Migration Required**: Yes
- Add check constraints via SQL
- Validate existing data meets constraints

---

#### Task 4.4: Standardize Date Handling
**Files**: `src/server/db/schema.ts`

**Problem**:
- Mix of `timestamp` and `text` for dates
- "Year-month" format stored as text

**Solution**:
```typescript
// For dates without time components:
startDate: date("start_date"), // Instead of text
endDate: date("end_date"),
dateOfBirth: date("date_of_birth"),

// For dates with time:
deadlineDate: timestamp("deadline_date", { withTimezone: true }),
openDate: timestamp("open_date", { withTimezone: true }),
```

**Migration Required**: Yes
- Convert text dates to `date` type
- Validate format consistency
- Update application code

**Affected Tables**:
- `workExperiences` (lines 778-779)
- `educationRecords` (lines 794-796)
- `projectRecords` (lines 812-813)
- All other text date fields

---

### Phase 5: Audit & Tracking

#### Task 5.1: Add Audit Fields Consistently
**Files**: `src/server/db/schema.ts`

**Problem**:
- Some tables have `createdById`/`updatedById`, many don't
- No accountability for data changes

**Solution**:
Add to major tables:
```typescript
createdById: text("created_by_id")
  .references(() => user.id, { onDelete: "set null" }),
updatedById: text("updated_by_id")
  .references(() => user.id, { onDelete: "set null" }),
```

**Affected Tables** (add where missing):
- `resources`
- `resourceCategories`
- `universities`
- `colleges`
- `departments`

**Migration Required**: Yes
- Add columns
- Create triggers to auto-populate `updatedById`

---

#### Task 5.2: Add Soft Delete Support
**Files**: `src/server/db/schema.ts`

**Problem**:
- Only `gpaConversions` has `isDeleted` (line 1222)
- Inconsistent soft delete pattern

**Solution**:
For tables where soft delete is needed:
```typescript
deletedAt: timestamp("deleted_at"),
// Alternative: boolean isDeleted
```

**Policy**: Use soft deletes for:
- User-generated content (applications, profiles)
- Important business data (scholarships, rounds)

**Migration Required**: Yes
- Add `deletedAt` columns
- Update queries to filter `WHERE deletedAt IS NULL`
- Add indexes on `deletedAt`

---

## Migration Strategy

### Development Phase
1. **Create migration files** using Drizzle Kit
2. **Test migrations** on development database
3. **Update application code** to use new schema
4. **Run tests** to ensure no regressions

### Staging Phase
1. **Backup staging database**
2. **Run migrations** on staging
3. **Perform data validation**
4. **Load test** with new indexes
5. **Monitor query performance**

### Production Phase
1. **Create backup** of production database
2. **Schedule maintenance window** (if needed)
3. **Run migrations during low traffic**
4. **Monitor for issues**
5. **Have rollback plan ready**

### Rollback Plan
- Keep migration files reversible
- Test rollback procedure
- Document pre-migration state
- Have point-in-time recovery ready

---

## Testing Checklist

### Unit Tests
- [ ] All model tests pass
- [ ] Migration tests pass
- [ ] Validation tests work

### Integration Tests
- [ ] API endpoints work with new schema
- [ ] Query performance acceptable
- [ ] Data constraints enforced

### Performance Tests
- [ ] Benchmark queries before/after
- [ ] Verify index usage with EXPLAIN ANALYZE
- [ ] Load test with production-like data

### Data Validation
- [ ] All existing data migrates correctly
- [ ] No data loss during conversion
- [ ] Constraints accept valid data
- [ ] Constraints reject invalid data

---

## Performance Monitoring

### Metrics to Track
- Query execution times (before/after)
- Index usage statistics
- Table size growth
- Query plan changes

### Tools
- `pg_stat_statements` for query performance
- `EXPLAIN ANALYZE` for specific queries
- Drizzle Studio for development
- Application-level metrics

---

## Estimated Effort

| Phase | Tasks | Estimated Effort | Priority |
|-------|-------|------------------|----------|
| Phase 1 | Data Integrity Fixes | 2-3 days | Critical |
| Phase 2 | Performance Optimization | 1-2 days | High |
| Phase 3 | Schema Refactoring | 5-7 days | Medium |
| Phase 4 | Consistency & Best Practices | 2-3 days | Medium |
| Phase 5 | Audit & Tracking | 1-2 days | Low |

**Total**: 11-17 days

---

## Risks & Mitigations

### Risk 1: Migration Failures
- **Mitigation**: Test thoroughly in dev/staging
- **Mitigation**: Create backups before each migration
- **Mitigation**: Make migrations reversible

### Risk 2: Application Downtime
- **Mitigation**: Use zero-downtime migration techniques
- **Mitigation**: Schedule during low-traffic periods
- **Mitigation**: Have rollback plan ready

### Risk 3: Performance Regression
- **Mitigation**: Benchmark before/after
- **Mitigation**: Load test in staging
- **Mitigation**: Monitor production metrics closely

### Risk 4: Data Loss
- **Mitigation**: Multiple backups
- **Mitigation**: Validate migrations thoroughly
- **Mitigation**: Keep original data until verified

---

## Success Criteria

- [ ] All critical data integrity issues resolved
- [ ] Query performance improved (measurable)
- [ ] All migrations successful in production
- [ ] Zero data loss
- [ ] Application tests passing
- [ ] Performance benchmarks met or exceeded
- [ ] Documentation updated

---

## Related Documentation

- [Drizzle ORM Documentation](./docs/drizzle.md)
- [Database Relations](./docs/drizzle-relations.md)
- [Database Queries](./docs/drizzle-queries.md)
- [Database Views](./docs/drizzle-views.md)

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Create Phase 1 migrations** (data integrity fixes)
3. **Set up development environment** for testing
4. **Begin implementation** starting with highest priority items
5. **Track progress** in this document

---

**Last Updated**: 2026-01-26
**Status**: Draft - Awaiting Review
