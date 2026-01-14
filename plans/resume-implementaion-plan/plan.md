# Europass-Inspired Resume Builder - Implementation Plan

## Executive Summary

Build a comprehensive resume builder web app inspired by the EU's Europass CV designer, integrated into the existing IOE Student Utils platform. The application will follow Europass's proven UX patterns while leveraging the existing tech stack (Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/ui, Drizzle ORM, Elysia API).

**Key Features:**

- Step-by-step wizard with detailed instructions
- Split-view editor (60% form, 40% live preview)
- Profile-based system (central data feeds multiple resumes)
- Europass-compliant data structure and sections
- Real-time preview updates
- PDF export functionality
- Full integration with existing auth and database

To adhere to the "Europass" style, the design will focus on:

- Structure: distinct left column (personal info) and right column (details).
- Aesthetics: Clean typography, blue/yellow color accents, and standardized skill chips.
- UX: A "Wizard" style editor on one side and a "Live Preview" on the other.

---

## Architecture Overview

### Tech Stack Alignment

- **Framework**: Next.js 16.1.1 with App Router
- **Frontend**: React 19.2.3 + TypeScript 5
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui (59 existing components + new resume-specific ones)
- **State Management**: TanStack React Query for server state, React hooks for form state
- **Forms**: TanStack React Form
- **Database**: Drizzle ORM with PostgreSQL
- **API**: Elysia (following existing `/api/[[...slugs]]/route.ts` pattern)
- **Auth**: Better Auth (existing integration)
- **File Storage**: S3 (existing integration for profile photos)
- **Icons**: Lucide React.
- **PDF Generation**: @react-pdf/renderer (Crucial: HTML-to-PDF libraries often fail at pagination. This library builds a real PDF document using React components).

### Route Structure

```
/dashboard/resume-builder                # Main dashboard
  /profile                               # Create/edit profile
  /resume/new                                # Create new resume from profile
  /resume/[id]                            # Edit existing resume
  /resume                           # List all user resumes
```

### Database Schema (New Tables)

```sql
resume_profiles              # Central user profile data
work_experiences            # Linked to profiles
education_records           # Linked to profiles
skill_records               # Linked to profiles (languages, digital, etc.)
resumes                     # Created from profile data
resume_sections             # Section configuration per resume
```

---

### [Phase 1](./tasks/phase1.md)

#### [Phase 1.1](./tasks/phase1.1.md)

### [Phase 2](./tasks/phase2.md)

### [Phase 3](./tasks/phase3.md)

### [Phase 4](./tasks/phase4.md)

### [Phase 5](./tasks/phase5.md)

### [Phase 6](./tasks/phase6.md)

### [Phase 7](./tasks/phase7.md)

---

## Critical Files Summary

### Files to Create

1. `src/server/db/schema.ts` - Add resume tables
2. `src/server/elysia/routes/resumes.ts` - API routes
3. `src/app/(protected)/dashboard/resume-builder/profile/page.tsx` - Profile creation
4. `src/app/(protected)/dashboard/resume-builder/create/page.tsx` - Resume creation
5. `src/app/(protected)/dashboard/resume-builder/my-resumes/page.tsx` - Dashboard
6. `src/app/(protected)/dashboard/resume-builder/edit/[id]/page.tsx` - Editor
7. `src/components/resume-builder/forms/*` - All form components
8. `src/components/resume-builder/editor/*` - Editor components
9. `src/components/resume-builder/preview/*` - Preview components
10. `src/components/resume-builder/pdf/*` - PDF generation

### Files to Reference (Existing Patterns)

1. `src/server/db/schema.ts` (lines 218-240) - Table structure pattern
2. `src/server/elysia/routes/resources.ts` - API route pattern
3. `src/app/(protected)/dashboard/resources/page.tsx` - Dashboard page pattern
4. `src/components/resources/upload-resource-modal.tsx` - Modal and form pattern
5. `src/app/api/[[...slugs]]/route.ts` - API export pattern

---

## Europass Design Specifications

### Typography

- **Font**: Arial (primary), Times New Roman (fallback)
- **Size**: 11pt (body), 12pt (headers)
- **Line Height**: 1.4

### Layout

- **Width**: A4 (210mm)
- **Margins**: 20mm all sides
- **Structure**: Single-column, NOT two-column
- **Max Pages**: 2-3 pages

### Sections Order

1. Personal Information (top)
2. About Me / Personal Profile (optional)
3. Work Experience (reverse chronological)
4. Education & Training (reverse chronological)
5. Personal Skills:
   - Language Skills (CEFR levels)
   - Digital Skills
   - Communication Skills
   - Organizational/Managerial Skills
   - Job-related Skills
   - Computer/IT Skills
6. Additional Information:
   - Personal Interests
   - Driving License
   - Attachments
   - Other Info

---

## Testing Checklist

### Database Tests

- [ ] All tables created correctly
- [ ] Foreign key constraints work
- [ ] Cascading deletes work
- [ ] Indexes improve query performance

### API Tests

- [ ] All endpoints return correct data
- [ ] Authentication works properly
- [ ] Validation errors return clear messages
- [ ] CORS settings allow frontend access

### UI Tests

- [ ] All forms submit correctly
- [ ] Validation shows appropriate errors
- [ ] Navigation works between all pages
- [ ] Preview updates in real-time
- [ ] PDF downloads successfully

### Integration Tests

- [ ] Profile creation flow works end-to-end
- [ ] Resume creation from profile works
- [ ] Multiple resumes can be created
- [ ] Data persists across page refreshes
- [ ] Auth protection works on all routes

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader reads content correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators are visible
- [ ] Error messages are accessible

---

## Implementation Tips for Junior Developers

### Follow Existing Patterns

1. **Always reference existing files** before writing new code
2. **Copy import statements** from similar components
3. **Use existing UI components** from Shadcn before creating custom ones
4. **Match code style** (indentation, naming conventions) to existing codebase

### Common Mistakes to Avoid

1. **Don't bypass the API** - Always use Elysia routes, don't query database directly from components
2. **Don't forget TypeScript types** - Define interfaces for all data structures
3. **Don't skip validation** - Always validate on both client and server
4. **Don't ignore error handling** - Wrap all async calls in try/catch
5. **Don't hardcode values** - Use constants and environment variables

### Development Workflow

1. **Create database migration** → Run migration → Test in DB browser
2. **Create API endpoint** → Test with Postman/curl → Document endpoint
3. **Create UI component** → Test in isolation → Integrate into page
4. **Test end-to-end** → Fix bugs → Add polish

### Debugging Tips

1. **Use console.log** to check API responses
2. **Use React DevTools** to inspect component state
3. **Check Network tab** in browser DevTools for API calls
4. **Use Drizzle Studio** (`npm run db:studio`) to inspect database
5. **Check console for errors** if data doesn't appear

### Code Quality

1. **Run `npm run check`** (Biome linter) before committing
2. **Run `npm run typecheck`** to catch TypeScript errors
3. **Write meaningful commit messages** (e.g., "feat: add work experience form")
4. **Keep functions small** - Break complex logic into helper functions
5. **Add comments** for complex business logic

---

## Future Enhancements (Post-MVP)

1. **Multiple Templates**: Modern, Creative, Academic variations
2. **AI Content Suggestions**: GPT-4 integration for description suggestions
3. **LinkedIn Import**: Parse LinkedIn PDF exports
4. **Cover Letter Builder**: Integrated with resume data
5. **Multi-Language Support**: Create CVs in different languages
6. **Real-time Collaboration**: Allow multiple editors
7. **Version History**: Track changes and restore previous versions
8. **Analytics**: Track resume views and downloads
9. **Export to Word**: .docx format support
10. **Custom Themes**: User-defined color schemes and fonts

---

## Success Criteria

### MVP Must-Haves

✅ Users can create a profile with all Europass sections
✅ Users can create multiple resumes from profile data
✅ Split-view editor with real-time preview works
✅ PDF export generates proper Europass-format CV
✅ All data persists in database
✅ Authentication protects all routes
✅ Mobile-responsive design
✅ Basic validation and error handling
✅ Step-by-step instructions for each section

### Performance Targets

- Page load time: < 2 seconds
- API response time: < 500ms
- PDF generation: < 5 seconds
- Auto-save debounce: 5 seconds

### UX Goals

- Zero existing knowledge required (detailed instructions provided)
- No confusing UI (clear labels, help text, examples)
- No data loss (auto-save, confirmation before delete)
- No broken flows (can navigate freely without losing progress)

---

## Support Resources

### Europass Documentation

- [Official Europass CV Builder](https://europass.europa.eu/en/create-europass-cv)
- [Europass XML Schema](https://europass.europa.eu/en/document/developer-resources)
- [Europass Style Guide](https://ec.europa.eu/futurium/en/system/files/ged/epass_europass_communications_toolkit_styleguide_v1.pdf)

### Technical Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Elysia Docs](https://elysiajs.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React PDF](https://react-pdf.org/)

### Internal Resources

- `src/server/db/schema.ts` - Reference for table patterns
- `src/server/elysia/routes/resources.ts` - Reference for API patterns
- `src/components/resources/` - Reference for component patterns
- `src/app/(protected)/dashboard/resources/page.tsx` - Reference for page patterns

---

**End of Implementation Plan**

This plan provides a complete roadmap for building a Europass-inspired resume builder. Each task is broken down into actionable steps with clear file paths, code examples, and references to existing patterns in the codebase. Junior developers can follow this plan systematically to deliver a production-ready resume builder feature.
