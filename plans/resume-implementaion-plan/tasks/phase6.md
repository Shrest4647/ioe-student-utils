### Phase 6: PDF Export (Week 3, Days 3-4)

**Goal**: Enable PDF download of resumes

#### Task 6.1: Install PDF Generation Library

**Files**: `package.json`
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. Choose library: `@react-pdf/renderer` (recommended)
   - Alternative: `puppeteer` (server-side)
   - Alternative: `html2pdf.js` (client-side)
2. Run: `npm install @react-pdf/renderer`
3. Install types if needed: `@types/react-pdf`

#### Task 6.2: Create PDF Document Template

**File**: `src/components/resume-builder/pdf/resume-pdf.tsx`
**Complexity**: Complex
**Dependencies**: Task 6.1

**Steps**:

1. Import from `@react-pdf/renderer`:
   - `Document`, `Page`, `Text`, `View`, `Image`, `Font`
2. Create PDF document component:
   ```tsx
   <Document>
     <Page size="A4" style={styles.page}>
       {/* Resume content */}
     </Page>
   </Document>
   ```
3. Define styles object matching Europass:
   - Page margins, fonts, colors
   - Section headers with EC Blue background
   - Proper spacing and alignment
4. Map resume data to PDF components
5. Support multiple pages (2-3 pages max)

**Europass PDF Styles**:

```tsx
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  header: {
    backgroundColor: "#004494",
    color: "white",
    padding: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    backgroundColor: "#004494",
    color: "white",
    padding: 5,
    marginTop: 10,
    marginBottom: 5,
  },
});
```

#### Task 6.3: PDF Download Button

**File**: `src/components/resume-builder/shared/pdf-download-button.tsx`
**Complexity**: Moderate
**Dependencies**: Task 6.2

**Steps**:

1. Create button component with loading state
2. On click, generate PDF using `pdf()` and `blob()` from `@react-pdf/renderer`
3. Create download link and trigger click
4. Filename format: `{resume-name}-{date}.pdf`
5. Show error toast if generation fails
6. Disable button while generating

**Implementation**:

```tsx
const handleDownload = async () => {
  try {
    setIsLoading(true);
    const doc = <ResumePDF data={resumeData} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resumeName}.pdf`;
    link.click();
    toast.success("PDF downloaded successfully");
  } catch (error) {
    toast.error("Failed to generate PDF");
  } finally {
    setIsLoading(false);
  }
};
```

#### Task 6.4: Add Print Styles

**File**: `src/app/globals.css` (or resume-specific CSS module)
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. Add `@media print` queries
2. Hide editor panels, show only preview
3. Set page size to A4
4. Remove backgrounds/shadows
5. Ensure proper page breaks

```css
@media print {
  .editor-panel,
  .navigation {
    display: none !important;
  }
  .preview-panel {
    width: 100% !important;
    position: static !important;
  }
  @page {
    size: A4;
    margin: 0;
  }
}
```
