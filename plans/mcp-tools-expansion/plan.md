# MCP Tools Expansion Plan

## Overview
Comprehensive expansion of Model Context Protocol (MCP) tools to enable robust scholarship content management capabilities. The current tool set covers basic CRUD operations for scholarships, rounds, and events, but lacks critical functionality for taxonomy management, data validation, automation, and advanced operations.

## Current State

### Existing Tools
| Category      | Tools Available                                                                 | Status                      |
| ------------- | ------------------------------------------------------------------------------- | --------------------------- |
| Scholarships  | fetch, create, bulk_create, update, bulk_update, delete, bulk_delete, get_by_id | ✅ Complete                  |
| Rounds        | create, bulk_create, update                                                     | ⚠️ Missing delete operations |
| Events        | create, bulk_create, update, delete                                             | ✅ Complete                  |
| Taxonomy      | None                                                                            | ❌ Completely Missing        |
| Data Quality  | None                                                                            | ❌ Completely Missing        |
| Automation    | None                                                                            | ❌ Completely Missing        |
| Analytics     | None                                                                            | ❌ Completely Missing        |
| Import/Export | None                                                                            | ❌ Completely Missing        |

### API Endpoints Available
The backend API already has endpoints for:
- ✅ `/scholarships/admin/countries` - POST, PATCH
- ✅ `/scholarships/admin/degrees` - POST, PATCH
- ✅ `/scholarships/admin/fields` - POST, PATCH
- ✅ Taxonomy listing: `/scholarships/countries`, `/scholarships/degrees`, `/scholarships/fields`

**Gap**: MCP tools don't expose these endpoints.

## Implementation Plan

---

### Phase 1: Taxonomy Management (High Priority)
**Goal**: Enable scholarship creation with proper country, degree, and field associations.

#### 1.1 Countries
Create MCP tools for country management (add to `/src/server/mcp/tools/countries.ts`):

**`fetch_countries`**
- Description: List all countries in the database
- Returns: Array of countries with code, name, region
- Use cases: Dropdown population, filtering options

**`create_country`**
- Description: Add a new country to the database
- Parameters: code (2-letter ISO), name, region (optional)
- Returns: Created country record
- Use cases: Adding new destination countries

**`update_country`**
- Description: Update existing country details
- Parameters: code, name (optional), region (optional)
- Returns: Updated country record
- Use cases: Correcting country information

**`delete_country`**
- Description: Archive a country (soft delete not applicable - countries don't delete)
- Parameters: code
- Returns: Success confirmation
- Use cases: Removing invalid entries

#### 1.2 Degree Levels
Create MCP tools for degree level management (add to `/src/server/mcp/tools/degrees.ts`):

**`fetch_degrees`**
- Description: List all degree levels (Undergraduate, Masters, PhD, etc.)
- Returns: Array of degree levels with id, name, rank
- Use cases: Filtering scholarships by academic level

**`create_degree`**
- Description: Add a new degree level
- Parameters: name, rank (optional)
- Returns: Created degree level record
- Use cases: Adding new academic qualifications

**`update_degree`**
- Description: Update existing degree level
- Parameters: id, name (optional), rank (optional)
- Returns: Updated degree level record
- Use cases: Renaming or reordering degrees

**`delete_degree`**
- Description: Archive a degree level
- Parameters: id
- Returns: Success confirmation
- Use cases: Removing obsolete degree types

#### 1.3 Fields of Study
Create MCP tools for field of study management (add to `/src/server/mcp/tools/fields-of-study.ts`):

**`fetch_fields_of_study`**
- Description: List all fields of study (Computer Science, Engineering, etc.)
- Returns: Array of fields with id, name
- Use cases: Filtering scholarships by subject area

**`create_field_of_study`**
- Description: Add a new field of study
- Parameters: name
- Returns: Created field record
- Use cases: Adding new academic disciplines

**`update_field_of_study`**
- Description: Update existing field of study
- Parameters: id, name (optional)
- Returns: Updated field record
- Use cases: Renaming or merging fields

**`delete_field_of_study`**
- Description: Archive a field of study
- Parameters: id
- Returns: Success confirmation
- Use cases: Removing unused fields

#### 1.4 Taxonomy Lookup Tool

Look up country codes, degree levels, or field of study IDs by their names. (add to `/src/server/mcp/tools/taxonomy.ts`)
```ts

server.registerTool(
    "lookup_taxonomy",
    {
      title: "Lookup Taxonomy Values",
      description: `
        Look up country codes, degree levels, or field of study IDs
        by their names. Use this tool to convert user-provided names
        (e.g., "Germany", "Masters", "Computer Science") to their
        corresponding IDs required for scholarship creation.
        
        Returns mapping of names to IDs that can be used in create_scholarship.
      `.trim(),
      inputSchema: z.object({
        type: z
          .enum(["country", "degree", "field"])
          .describe("Type of taxonomy to look up"),
        names: z
          .array(z.string())
          .describe("Array of names to look up (e.g., ['Germany', 'Masters'])"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;
        if (!apiKey) {
          throw new Error("MCP Authorization key is required");
        }

        const results: Record<string, string[]> = {};

        if (params.type === "country") {
          const response = await api.api.scholarships.countries.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const countries = response.data.data || [];
            const nameToCodeMap: Record<string, string> = {};
            countries.forEach((c) => {
              nameToCodeMap[c.name.toLowerCase()] = c.code;
              nameToCodeMap[c.code.toLowerCase()] = c.code;
            });

            const codes: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedCode =
                nameToCodeMap[name.toLowerCase()] ||
                nameToCodeMap[name.toLowerCase()];
              if (matchedCode) {
                codes.push(matchedCode);
              } else {
                notFound.push(name);
              }
            });

            results["countryCodes"] = codes;
            if (notFound.length > 0) {
              results["notFound"] = notFound;
            }
          }
        } else if (params.type === "degree") {
          const response = await api.api.scholarships.degrees.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const degrees = response.data.data || [];
            const nameToIdMap: Record<string, string> = {};
            degrees.forEach((d) => {
              nameToIdMap[d.name.toLowerCase()] = d.id;
            });

            const ids: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedId = nameToIdMap[name.toLowerCase()];
              if (matchedId) {
                ids.push(matchedId);
              } else {
                notFound.push(name);
              }
            });

            results["degreeIds"] = ids;
            if (notFound.length > 0) {
              results["notFound"] = notFound;
            }
          }
        } else if (params.type === "field") {
          const response = await api.api.scholarships.fields.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const fields = response.data.data || [];
            const nameToIdMap: Record<string, string> = {};
            fields.forEach((f) => {
              nameToIdMap[f.name.toLowerCase()] = f.id;
            });

            const ids: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedId = nameToIdMap[name.toLowerCase()];
              if (matchedId) {
                ids.push(matchedId);
              } else {
                notFound.push(name);
              }
            });

            results["fieldIds"] = ids;
            if (notFound.length > 0) {
              results["notFound"] = notFound;
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, data: results }, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("lookup_taxonomy error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to lookup taxonomy",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

```

#### Implementation Details
- Reuse existing API routes in `/scholarships/admin/countries|degrees|fields`
- Follow same error handling pattern as scholarship tools
- Add to server registration in `/src/server/mcp/server.ts`

---

### Phase 2: Data Quality & Validation (High Priority)
**Goal**: Prevent duplicate entries and ensure data integrity.

#### 2.1 Duplicate Detection

**`check_duplicate_scholarship`**
- Description: Verify if a scholarship already exists in the database
- Parameters:
  - `name` (required): Scholarship name
  - `providerName` (optional): Provider/organization name
  - `websiteUrl` (optional): Official website URL
  - `year` (optional): Scholarship year (e.g., 2026)
- Checks:
  - Exact name match
  - Similar name (80% similarity using string distance)
  - Use this library for string similarity: string-similarity-js https://github.com/stephenjjbrown/string-similarity-js

  - Provider + year combination
  - Website URL match
  - Slug patterns (e.g., daad-2024 vs daad-2025)
- Returns:
  ```typescript
  {
    isDuplicate: boolean,
    confidence: number, // 0-100
    matches: Array<{
      id: string,
      name: string,
      similarityScore: number,
      reason: string
    }>
  }
  ```
- Use cases:
  - Before creating new scholarship
  - Detecting variations of same program
  - Data deduplication

#### Implementation Details
- Use Drizzle ORM to query scholarships table
- Implement string similarity (Levenshtein distance or similar)
- Compare normalized strings (lowercase, trim, remove special chars)
- Slug pattern detection: extract year from slug, compare with year parameter

#### 2.2 Data Validation

**`validate_scholarship_data`**
- Description: Validate scholarship data for completeness and accuracy before creation
- Parameters: Full scholarship object (same as create_scholarship)
- Validations:
  - **Required Fields**:
    - name: present and non-empty
    - slug: present, URL-friendly, unique
  - **Data Format**:
    - websiteUrl: valid URL format
    - fundingType: valid enum value
    - status: valid enum value
  - **Taxonomy Existence**:
    - countryCodes: all codes exist in countries table
    - degreeIds: all IDs exist in degree_levels table
    - fieldIds: all IDs exist in fields_of_study table
  - **URL Accessibility** (optional, can be slow):
    - websiteUrl: reachable (200-299 status code)
  - **Date Format** (if rounds included):
    - openDate, deadlineDate: valid ISO 8601 format
- Returns:
  ```typescript
  {
    isValid: boolean,
    errors: Array<{
      field: string,
      message: string,
      severity: "error" | "warning"
    }>,
    warnings: Array<string>,
    suggestions: Array<string>
  }
  ```
- Use cases:
  - Pre-creation validation
  - Data quality checks
  - Bulk import validation

#### Implementation Details
- Use Zod schema validation for format checks
- Query taxonomy tables for existence checks
- Use fetch for URL accessibility (with timeout)
- Group errors by severity for user-friendly display

---

### Phase 3: Automation & Convenience (Medium Priority)
**Goal**: Reduce repetitive tasks and improve efficiency.

#### 3.1 Smart Taxonomy Lookup

**`lookup_taxonomy`**
- Description: Convert human-readable names to database IDs
- Parameters:
  ```typescript
  {
    countries?: string[], // e.g., ["Germany", "USA", "UK"]
    degrees?: string[],   // e.g., ["Masters", "PhD", "Bachelors"]
    fields?: string[]     // e.g., ["Computer Science", "Engineering"]
  }
  ```
- Returns:
  ```typescript
  {
    countries: Record<string, string>, // "Germany": "DE", "USA": "US"
    degrees: Record<string, string>,   // "Masters": "deg-xxx", "PhD": "deg-yyy"
    fields: Record<string, string>,     // "Computer Science": "field-aaa"
    notFound: {
      countries: string[],
      degrees: string[],
      fields: string[]
    }
  }
  ```
- Use cases:
  - Natural language scholarship creation
  - User-facing input conversion
  - Batch operations

#### Implementation Details
- Query countries table with case-insensitive matching
- Query degrees table with case-insensitive matching
- Query fields table with case-insensitive matching
- Track which names couldn't be found
- Support partial matching (fuzzy) for typos



### Phase 4: Advanced Content Management (Medium Priority)
**Goal**: Complete CRUD operations for all entities.

#### 4.1 Round Management

**`delete_scholarship_round`**
- Description: Remove an application round
- Parameters: id
- Returns: Success confirmation
- Use cases: Removing cancelled intakes

**`bulk_delete_scholarship_rounds`**
- Description: Archive multiple rounds
- Parameters: ids[]
- Returns: Bulk operation result
- Use cases: Removing old/unused rounds

**`duplicate_round`**
- Description: Copy a round with all its events for a new intake
- Parameters: sourceRoundId, newScholarshipId, newYear
- Returns: Created round with copied events
- Use cases: Yearly intake replication (Fall 2025 → Fall 2026)

#### 4.2 Event Management

**`fetch_events_by_round`**
- Description: Get all events for a specific round
- Parameters: roundId
- Returns: Array of events with details
- Use cases: Event management interface

**`fetch_upcoming_events`**
- Description: Get all upcoming events across all scholarships
- Parameters: daysAhead (default: 30)
- Returns: Array of events sorted by date
- Use cases: Calendar view, notifications

**`bulk_delete_round_events`**
- Description: Delete multiple events
- Parameters: ids[]
- Returns: Bulk operation result
- Use cases: Cleaning up event data

---

### Phase 5: Search & Analytics (Low Priority)
**Goal**: Provide insights and powerful search capabilities.

#### 5.1 Advanced Search

**`search_scholarships_fuzzy`**
- Description: Fuzzy search for scholarships (handles typos)
- Parameters:
  - `query`: Search string
  - `fuzziness`: Number of edits allowed (default: 2)
  - `limit`: Max results
- Uses: Levenshtein distance or similar algorithm
- Returns: Array of scholarships with match scores
- Use cases: User searches with typos ("DAAD" finds "Daad", "daaad")

**`search_by_deadline`**
- Description: Find scholarships with deadlines in a date range
- Parameters:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `limit`: Max results
- Returns: Array of scholarships with active rounds in range
- Use cases: "What's due this month?", "Find deadlines in 2026"

**`search_by_funding_amount`**
- Description: Filter scholarships by scholarship amount range
- Parameters:
  - `minAmount`: Minimum amount
  - `maxAmount`: Maximum amount
  - `currency`: Currency code (default: USD)
- Returns: Array of scholarships with amounts in range
- Use cases: "Find scholarships over $10,000"

---

## Implementation Plan

### Phase 1: Taxonomy Management (Week 1)
- Implement country, degree, field CRUD tools
- Add taxonomy associations to scholarship schema
- Create database migrations

### Phase 2: Data Quality (Week 2)
- Implement duplicate detection
- Add data validation rules
- Create validation tools

### Phase 3: Automation (Week 3)
- Implement taxonomy lookup
- Add URL parsing tool
- Create bulk operation tools

### Phase 4: Content Management (Week 4)
- Implement scholarship CRUD tools
- Add round/event management tools
- Create bulk operations

### Phase 5: Search & Analytics (Week 5)
- Implement advanced search tools
- Add analytics tools
- Create reporting tools

## Technical Considerations

### Error Handling
- Follow existing error pattern in scholarship tools
- Return structured error responses with clear messages
- Log errors to server console for debugging
- Use try/catch blocks with appropriate error types

### Performance
- Use database indexes where appropriate
- Implement pagination for large result sets
- Cache frequently accessed taxonomy data
- Parallelize independent operations in bulk tools

### Security
- Validate all input parameters using Zod schemas
- Sanitize user input to prevent injection attacks
- Enforce API key permissions (scholarships: read/write/delete)
- Rate limit expensive operations (like URL parsing)

### Testing
- Write unit tests for each tool
- Test edge cases (empty data, invalid input)
- Test bulk operations with various sizes
- Integration test with real database

### Documentation
- Keep tool descriptions up-to-date
- Provide examples in docstrings
- Update AGENTS.md with new tools
- Update MCP server README

---

## Success Criteria

### Phase 1: Taxonomy Management
- ✅ Can create, read, update, delete countries
- ✅ Can create, read, update, delete degrees
- ✅ Can create, read, update, delete fields
- ✅ Scholarships can be created with taxonomy associations

### Phase 2: Data Quality
- ✅ Duplicate detection prevents 95% of duplicates
- ✅ Data validation catches 90% of invalid data
- ✅ False positive rate < 5%

### Phase 3: Automation
- ✅ Taxonomy lookup成功率 > 90% for common names
- ✅ URL parsing extracts 80%+ of required fields
- ✅ Bulk operations complete within 10 seconds for 100 items

### Phase 4: Content Management
- ✅ All entities have complete CRUD operations
- ✅ Round duplication works correctly
- ✅ Events can be managed by round

---



## Open Questions


1. **Fuzzy Search Algorithm**: Implement custom Levenshtein or use a library like `fuzzysearch` or `fuse.js`? Recommendation: `fuse.js` for advanced fuzzy matching.


