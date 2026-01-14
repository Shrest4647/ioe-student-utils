### Phase 2: API Development

**Duration**: 2-3 days

**Tasks**:

- [ ] Create `src/server/elysia/routes/gpa-converter.ts`
  - [ ] Implement GET `/standards` endpoint
  - [ ] Implement POST `/calculate` endpoint with conversion logic
  - [ ] Implement POST `/save` endpoint (auth required)
  - [ ] Implement GET `/history` endpoint (auth required)
  - [ ] Implement DELETE `/:id` endpoint (auth required)
- [ ] Register routes in `src/server/elysia/index.ts`
- [ ] Test endpoints with curl/Postman
- [ ] Add error handling and validation

**Checklist**:

- [ ] All endpoints return correct responses
- [ ] Error handling works for edge cases
- [ ] Auth middleware properly restricts endpoints
- [ ] OpenAPI documentation auto-generated
