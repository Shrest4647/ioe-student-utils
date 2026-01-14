### Phase 1: Foundation (Database & Backend)

**Duration**: 2-3 days

**Tasks**:

- [ ] Create database schema in `src/server/db/schema.ts`
  - [ ] Add `gpa_conversion_standards` table
  - [ ] Add `gpa_conversion_ranges` table
  - [ ] Add `gpa_conversions` table (for saved calculations)
- [ ] Create database migration
  - [ ] Run migration: `bun run db:push`
- [ ] Update `src/server/db/seed.ts`
  - [ ] Add WES standard with ranges
  - [ ] Add Scholaro standard with ranges
- [ ] Run seed: `bun run db:seed`
- [ ] Test database queries manually

**Checklist**:

- [ ] Schema validates successfully
- [ ] Migration runs without errors
- [ ] Seed data inserted correctly
- [ ] Can query standards and ranges
