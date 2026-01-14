import { db } from "../index";
import {
  countries,
  degreeLevels,
  fieldsOfStudy,
  gpaConversionRanges,
  gpaConversionStandards,
  resourceAttachments,
  resourceCategories,
  resourceContentTypes,
  resources,
  resourcesToCategories,
  roundEvents,
  scholarshipRounds,
  scholarships,
  scholarshipsToCountries,
  scholarshipsToDegrees,
  scholarshipsToFields,
} from "../schema";

const categories = [
  {
    id: crypto.randomUUID(),
    name: "CV",
    description: "Curriculum Vitae templates and guides",
  },
  {
    id: crypto.randomUUID(),
    name: "Resume",
    description: "Resume templates and samples",
  },
  {
    id: crypto.randomUUID(),
    name: "LOR",
    description: "Letter of Recommendation samples",
  },
  {
    id: crypto.randomUUID(),
    name: "SOP",
    description: "Statement of Purpose samples",
  },
  {
    id: crypto.randomUUID(),
    name: "Graduate Application",
    description: "Resources for higher education applications",
  },
  {
    id: crypto.randomUUID(),
    name: "Lab Works",
    description: "Lab reports and manuals",
  },
  {
    id: crypto.randomUUID(),
    name: "Instructions",
    description: "Tutorials and guides",
  },
  {
    id: crypto.randomUUID(),
    name: "Visa Applications",
    description: "Visa process resources",
  },
  { id: crypto.randomUUID(), name: "GPA", description: "GPA related tools" },
  {
    id: crypto.randomUUID(),
    name: "Credits Calculator",
    description: "Tools for calculating academic credits",
  },
];

const contentTypes = [
  {
    id: crypto.randomUUID(),
    name: "Tool",
    description: "Interactive tools and calculators",
  },
  {
    id: crypto.randomUUID(),
    name: "Ebook",
    description: "Digital books and long-form guides",
  },
  {
    id: crypto.randomUUID(),
    name: "Book",
    description: "Textbooks and references",
  },
  {
    id: crypto.randomUUID(),
    name: "Guide",
    description: "Short guides and tutorials",
  },
  {
    id: crypto.randomUUID(),
    name: "Template",
    description: "Ready-to-use templates",
  },
];

// Sample resources data
const sampleResources = [
  {
    id: crypto.randomUUID(),
    title: "Professional CV Template for Engineers",
    description:
      "A modern, ATS-friendly CV template specifically designed for engineering graduates and professionals.",
    s3Url: "https://example.com/templates/professional-cv-engineer.pdf",
    fileFormat: "pdf",
    contentTypeId: "", // Will be set after content types are inserted
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: true,
  },
  {
    id: crypto.randomUUID(),
    title: "Resume Samples for Fresh Graduates",
    description:
      "Collection of resume samples tailored for fresh engineering graduates entering the job market.",
    s3Url: "https://example.com/templates/fresh-grad-resume-samples.pdf",
    fileFormat: "pdf",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
  {
    id: crypto.randomUUID(),
    title: "LOR Template for Academic References",
    description:
      "Professional letter of recommendation template for professors and academic advisors.",
    s3Url: "https://example.com/templates/academic-lor-template.docx",
    fileFormat: "docx",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: true,
  },
  {
    id: crypto.randomUUID(),
    title: "SOP Writing Guide for MS Applications",
    description:
      "Comprehensive guide on writing effective Statements of Purpose for Master's programs.",
    s3Url: "https://example.com/guides/sop-writing-guide.pdf",
    fileFormat: "pdf",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Graduate Application Checklist",
    description:
      "Complete checklist for international students applying to graduate programs abroad.",
    s3Url: "https://example.com/checklists/graduate-application-checklist.pdf",
    fileFormat: "pdf",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: true,
  },
  {
    id: crypto.randomUUID(),
    title: "Lab Report Template - Electronics",
    description:
      "Standardized template for electronics lab reports with proper formatting and structure.",
    s3Url: "https://example.com/templates/electronics-lab-report.docx",
    fileFormat: "docx",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Python Programming Tutorial",
    description:
      "Beginner-friendly tutorial covering Python fundamentals for engineering students.",
    s3Url: "https://example.com/tutorials/python-programming-basics.pdf",
    fileFormat: "pdf",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Visa Application Process Guide",
    description:
      "Step-by-step guide for international students applying for student visas.",
    s3Url: "https://example.com/guides/visa-application-guide.pdf",
    fileFormat: "pdf",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: true,
  },
  {
    id: crypto.randomUUID(),
    title: "GPA Calculator Tool",
    description:
      "Interactive tool to calculate and track your semester and cumulative GPA.",
    s3Url: "https://example.com/tools/gpa-calculator.html",
    fileFormat: "html",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Credit Transfer Calculator",
    description:
      "Calculator to estimate credit transfers between different educational systems.",
    s3Url: "https://example.com/tools/credit-transfer-calculator.html",
    fileFormat: "html",
    contentTypeId: "",
    uploaderId: "G2qPoU2AOCVLyQR0EbMWiyKFmqEo0S7O",
    isFeatured: false,
  },
];

async function seed() {
  console.log("🌱 Seeding initial data...");

  try {
    // Check if data already exists to avoid duplicates (optional but good)
    const existingCats = await db.query.resourceCategories.findMany();
    if (existingCats.length === 0) {
      await db.insert(resourceCategories).values(categories);
      console.log(`✅ Inserted ${categories.length} categories.`);
    } else {
      console.log("⏭️ Categories already seeded.");
    }

    const existingTypes = await db.query.resourceContentTypes.findMany();
    if (existingTypes.length === 0) {
      await db.insert(resourceContentTypes).values(contentTypes);
      console.log(`✅ Inserted ${contentTypes.length} content types.`);
    } else {
      console.log("⏭️ Content types already seeded.");
    }

    // Get content types for mapping
    const contentTypesResult = await db.query.resourceContentTypes.findMany();
    const templateType = contentTypesResult.find(
      (ct) => ct.name === "Template",
    );
    const guideType = contentTypesResult.find((ct) => ct.name === "Guide");
    const ebookType = contentTypesResult.find((ct) => ct.name === "Ebook");
    const toolType = contentTypesResult.find((ct) => ct.name === "Tool");

    // Get categories for mapping
    const categoriesResult = await db.query.resourceCategories.findMany();
    const cvCategory = categoriesResult.find((c) => c.name === "CV");
    const resumeCategory = categoriesResult.find((c) => c.name === "Resume");
    const lorCategory = categoriesResult.find((c) => c.name === "LOR");
    const sopCategory = categoriesResult.find((c) => c.name === "SOP");
    const gradAppCategory = categoriesResult.find(
      (c) => c.name === "Graduate Application",
    );
    const labWorksCategory = categoriesResult.find(
      (c) => c.name === "Lab Works",
    );
    const instructionsCategory = categoriesResult.find(
      (c) => c.name === "Instructions",
    );
    const visaCategory = categoriesResult.find(
      (c) => c.name === "Visa Applications",
    );
    const gpaCategory = categoriesResult.find((c) => c.name === "GPA");
    const creditsCategory = categoriesResult.find(
      (c) => c.name === "Credits Calculator",
    );

    // Check if resources already exist
    const existingResources = await db.query.resources.findMany();
    if (existingResources.length === 0) {
      // Update sample resources with proper content type IDs
      sampleResources.forEach((resource) => {
        if (resource.title.includes("Template")) {
          resource.contentTypeId = templateType?.id || "";
        } else if (
          resource.title.includes("Guide") ||
          resource.title.includes("Tutorial")
        ) {
          resource.contentTypeId = guideType?.id || "";
        } else if (resource.title.includes("Calculator")) {
          resource.contentTypeId = toolType?.id || "";
        } else {
          resource.contentTypeId = ebookType?.id || "";
        }
      });

      // Insert resources
      await db.insert(resources).values(sampleResources);
      console.log(`✅ Inserted ${sampleResources.length} sample resources.`);

      // Create resource-category mappings
      const resourceCategoryMappings = [
        { resourceId: sampleResources[0].id, categoryId: cvCategory?.id || "" },
        {
          resourceId: sampleResources[1].id,
          categoryId: resumeCategory?.id || "",
        },
        {
          resourceId: sampleResources[2].id,
          categoryId: lorCategory?.id || "",
        },
        {
          resourceId: sampleResources[3].id,
          categoryId: sopCategory?.id || "",
        },
        {
          resourceId: sampleResources[4].id,
          categoryId: gradAppCategory?.id || "",
        },
        {
          resourceId: sampleResources[5].id,
          categoryId: labWorksCategory?.id || "",
        },
        {
          resourceId: sampleResources[6].id,
          categoryId: instructionsCategory?.id || "",
        },
        {
          resourceId: sampleResources[7].id,
          categoryId: visaCategory?.id || "",
        },
        {
          resourceId: sampleResources[8].id,
          categoryId: gpaCategory?.id || "",
        },
        {
          resourceId: sampleResources[9].id,
          categoryId: creditsCategory?.id || "",
        },
      ];

      // Insert resource-category mappings
      await db.insert(resourcesToCategories).values(resourceCategoryMappings);
      console.log(
        `✅ Inserted ${resourceCategoryMappings.length} resource-category mappings.`,
      );

      // Create resource attachments
      const resourceAttachmentData = sampleResources.map((resource) => ({
        id: crypto.randomUUID(),
        resourceId: resource.id,
        type: "file" as const,
        url: resource.s3Url,
        name: `${resource.title.replace(/[^a-zA-Z0-9]/g, "_")}.${resource.fileFormat}`,
        fileFormat: resource.fileFormat,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(resourceAttachments).values(resourceAttachmentData);
      console.log(
        `✅ Inserted ${resourceAttachmentData.length} resource attachments.`,
      );
    } else {
      console.log("⏭️ Resources already seeded.");
    }

    // --- Seeding Scholarship Data ---

    const existingCountries = await db.query.countries.findMany();
    if (existingCountries.length === 0) {
      await db.insert(countries).values([
        { code: "NP", name: "Nepal", region: "Asia" },
        { code: "US", name: "United States", region: "North America" },
        { code: "GB", name: "United Kingdom", region: "Europe" },
        { code: "DE", name: "Germany", region: "Europe" },
        { code: "AU", name: "Australia", region: "Oceania" },
        { code: "CA", name: "Canada", region: "North America" },
      ]);
      console.log("✅ Inserted countries.");
    }

    const existingDegrees = await db.query.degreeLevels.findMany();
    if (existingDegrees.length === 0) {
      await db.insert(degreeLevels).values([
        { id: crypto.randomUUID(), name: "Bachelors", rank: "1" },
        { id: crypto.randomUUID(), name: "Masters", rank: "2" },
        { id: crypto.randomUUID(), name: "PhD", rank: "3" },
      ]);
      console.log("✅ Inserted degree levels.");
    }

    const existingFields = await db.query.fieldsOfStudy.findMany();
    if (existingFields.length === 0) {
      await db.insert(fieldsOfStudy).values([
        { id: crypto.randomUUID(), name: "Computer Science" },
        { id: crypto.randomUUID(), name: "Engineering" },
        { id: crypto.randomUUID(), name: "Data Science" },
        { id: crypto.randomUUID(), name: "Business" },
      ]);
      console.log("✅ Inserted fields of study.");
    }

    const existingScholarships = await db.query.scholarships.findMany();
    if (existingScholarships.length === 0) {
      // Fetch helpers
      const degrees = await db.query.degreeLevels.findMany();
      const fields = await db.query.fieldsOfStudy.findMany();
      const masters = degrees.find((d) => d.name === "Masters");
      const phd = degrees.find((d) => d.name === "PhD");

      const cs = fields.find((f) => f.name === "Computer Science");
      const eng = fields.find((f) => f.name === "Engineering");

      // 1. Erasmus Mundus
      const erasmusId = crypto.randomUUID();
      await db.insert(scholarships).values({
        id: erasmusId,
        name: "Erasmus Mundus Joint Master Degrees",
        slug: "erasmus-mundus",
        description:
          "Prestigious integrated study programmes offered by consortia of EU universities.",
        providerName: "European Union",
        websiteUrl: "https://erasmus-plus.ec.europa.eu/",
        fundingType: "fully_funded",
      });

      // Link Erasmus to EU countries (mocking with DE and GB for now)
      await db.insert(scholarshipsToCountries).values([
        { scholarshipId: erasmusId, countryCode: "DE" },
        { scholarshipId: erasmusId, countryCode: "GB" },
      ]);

      if (masters) {
        await db.insert(scholarshipsToDegrees).values({
          scholarshipId: erasmusId,
          degreeId: masters.id,
        });
      }

      if (cs && eng) {
        await db.insert(scholarshipsToFields).values([
          { scholarshipId: erasmusId, fieldId: cs.id },
          { scholarshipId: erasmusId, fieldId: eng.id },
        ]);
      }

      // Add Round for Erasmus
      const erasmusRoundId = crypto.randomUUID();
      await db.insert(scholarshipRounds).values({
        id: erasmusRoundId,
        scholarshipId: erasmusId,
        roundName: "2026-2028 Intake",
        isActive: true,
        openDate: new Date("2025-10-01"),
        deadlineDate: new Date("2026-01-15"),
        scholarshipAmount: "Full tuition + €1,400 monthly stipend",
      });

      await db.insert(roundEvents).values([
        {
          id: crypto.randomUUID(),
          roundId: erasmusRoundId,
          name: "Application Deadline",
          date: new Date("2026-01-15"),
          type: "deadline",
        },
        {
          id: crypto.randomUUID(),
          roundId: erasmusRoundId,
          name: "Results Announced",
          date: new Date("2026-04-01"),
          type: "result_announcement",
        },
      ]);

      // 2. DAAD
      const daadId = crypto.randomUUID();
      await db.insert(scholarships).values({
        id: daadId,
        name: "DAAD EPOS Scholarship",
        slug: "daad-epos",
        description:
          "Development-related postgraduate courses for professionals from developing countries.",
        providerName: "DAAD (German Academic Exchange Service)",
        websiteUrl: "https://www2.daad.de/",
        fundingType: "fully_funded",
      });

      await db
        .insert(scholarshipsToCountries)
        .values({ scholarshipId: daadId, countryCode: "DE" });
      if (masters && phd) {
        await db.insert(scholarshipsToDegrees).values([
          { scholarshipId: daadId, degreeId: masters.id },
          { scholarshipId: daadId, degreeId: phd.id },
        ]);
      }

      // Add Round for DAAD
      const daadRoundId = crypto.randomUUID();
      await db.insert(scholarshipRounds).values({
        id: daadRoundId,
        scholarshipId: daadId,
        roundName: "2026 Intake",
        isActive: true, // currently active
        openDate: new Date("2025-08-01"),
        deadlineDate: new Date("2025-10-31"), // Soon
        scholarshipAmount: "€934 monthly + insurance + travel",
      });

      await db.insert(roundEvents).values({
        id: crypto.randomUUID(),
        roundId: daadRoundId,
        name: "Deadline",
        date: new Date("2025-10-31"),
        type: "deadline",
      });

      // 3. Fulbright
      const fulbrightId = crypto.randomUUID();
      await db.insert(scholarships).values({
        id: fulbrightId,
        name: "Fulbright Foreign Student Program",
        slug: "fulbright",
        description:
          "Enables graduate students, young professionals and artists from abroad to study and conduct research in the United States.",
        providerName: "US Department of State",
        websiteUrl: "https://foreign.fulbrightonline.org/",
        fundingType: "fully_funded",
      });
      await db
        .insert(scholarshipsToCountries)
        .values({ scholarshipId: fulbrightId, countryCode: "US" });

      console.log("✅ Inserted sample scholarships.");
    } else {
      console.log("⏭️ Scholarships already seeded.");
    }

    // --- Seeding GPA Converter Data ---

    const existingGPAStandards =
      await db.query.gpaConversionStandards.findMany();
    if (existingGPAStandards.length === 0) {
      // 1. WES Standard
      const wesStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: wesStandardId,
        name: "WES",
        description:
          "World Education Services conversion standard for Nepal/Tribhuvan University. Most widely used credential evaluation service for US university applications.",
        isActive: true,
      });

      // WES conversion ranges
      const wesRanges = [
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "80",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "A",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "75",
          maxPercentage: "79",
          gpaValue: "3.7",
          gradeLabel: "A-",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "70",
          maxPercentage: "74",
          gpaValue: "3.3",
          gradeLabel: "B+",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "65",
          maxPercentage: "69",
          gpaValue: "3.0",
          gradeLabel: "B",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "60",
          maxPercentage: "64",
          gpaValue: "2.7",
          gradeLabel: "B-",
          sortOrder: "5",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "55",
          maxPercentage: "59",
          gpaValue: "2.3",
          gradeLabel: "C+",
          sortOrder: "6",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "50",
          maxPercentage: "54",
          gpaValue: "2.0",
          gradeLabel: "C",
          sortOrder: "7",
        },
        {
          id: crypto.randomUUID(),
          standardId: wesStandardId,
          minPercentage: "0",
          maxPercentage: "49",
          gpaValue: "0.0",
          gradeLabel: "F",
          sortOrder: "8",
        },
      ];

      await db.insert(gpaConversionRanges).values(wesRanges);
      console.log(`✅ Inserted WES standard with ${wesRanges.length} ranges.`);

      // 2. Scholaro Standard
      const scholaroStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: scholaroStandardId,
        name: "Scholaro",
        description:
          "Scholaro GPA conversion standard for Nepal/Tribhuvan University. Alternative credential evaluation service accepted by many European and international universities.",
        isActive: true,
      });

      // Scholaro conversion ranges
      const scholaroRanges = [
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "90",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "A",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "85",
          maxPercentage: "89",
          gpaValue: "3.7",
          gradeLabel: "A-",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "80",
          maxPercentage: "84",
          gpaValue: "3.3",
          gradeLabel: "B+",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "75",
          maxPercentage: "79",
          gpaValue: "3.0",
          gradeLabel: "B",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "70",
          maxPercentage: "74",
          gpaValue: "2.7",
          gradeLabel: "B-",
          sortOrder: "5",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "65",
          maxPercentage: "69",
          gpaValue: "2.3",
          gradeLabel: "C+",
          sortOrder: "6",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "60",
          maxPercentage: "64",
          gpaValue: "2.0",
          gradeLabel: "C",
          sortOrder: "7",
        },
        {
          id: crypto.randomUUID(),
          standardId: scholaroStandardId,
          minPercentage: "0",
          maxPercentage: "59",
          gpaValue: "0.0",
          gradeLabel: "F",
          sortOrder: "8",
        },
      ];

      await db.insert(gpaConversionRanges).values(scholaroRanges);
      console.log(
        `✅ Inserted Scholaro standard with ${scholaroRanges.length} ranges.`,
      );

      // 3. UK Standard
      const ukStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: ukStandardId,
        name: "UK (4.0 Scale)",
        description:
          "UK degree classification converted to US 4.0 GPA scale. Used for UK university applications.",
        isActive: true,
      });

      const ukRanges = [
        {
          id: crypto.randomUUID(),
          standardId: ukStandardId,
          minPercentage: "70",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "First-Class",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: ukStandardId,
          minPercentage: "60",
          maxPercentage: "69",
          gpaValue: "3.5",
          gradeLabel: "Upper Second (2:1)",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: ukStandardId,
          minPercentage: "50",
          maxPercentage: "59",
          gpaValue: "3.0",
          gradeLabel: "Lower Second (2:2)",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: ukStandardId,
          minPercentage: "40",
          maxPercentage: "49",
          gpaValue: "2.0",
          gradeLabel: "Third-Class",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: ukStandardId,
          minPercentage: "0",
          maxPercentage: "39",
          gpaValue: "0.0",
          gradeLabel: "Fail",
          sortOrder: "5",
        },
      ];

      await db.insert(gpaConversionRanges).values(ukRanges);
      console.log(`✅ Inserted UK standard with ${ukRanges.length} ranges.`);

      // 4. Canada Standard
      const canadaStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: canadaStandardId,
        name: "Canada",
        description:
          "Canadian percentage-based grading converted to US 4.0 GPA scale. Used for Canadian university applications.",
        isActive: true,
      });

      const canadaRanges = [
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "90",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "A+",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "85",
          maxPercentage: "89",
          gpaValue: "4.0",
          gradeLabel: "A",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "80",
          maxPercentage: "84",
          gpaValue: "3.7",
          gradeLabel: "A-",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "75",
          maxPercentage: "79",
          gpaValue: "3.3",
          gradeLabel: "B+",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "70",
          maxPercentage: "74",
          gpaValue: "3.0",
          gradeLabel: "B",
          sortOrder: "5",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "65",
          maxPercentage: "69",
          gpaValue: "2.7",
          gradeLabel: "B-",
          sortOrder: "6",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "60",
          maxPercentage: "64",
          gpaValue: "2.3",
          gradeLabel: "C+",
          sortOrder: "7",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "55",
          maxPercentage: "59",
          gpaValue: "2.0",
          gradeLabel: "C",
          sortOrder: "8",
        },
        {
          id: crypto.randomUUID(),
          standardId: canadaStandardId,
          minPercentage: "0",
          maxPercentage: "54",
          gpaValue: "0.0",
          gradeLabel: "F",
          sortOrder: "9",
        },
      ];

      await db.insert(gpaConversionRanges).values(canadaRanges);
      console.log(
        `✅ Inserted Canada standard with ${canadaRanges.length} ranges.`,
      );

      // 5. Australia Standard
      const australiaStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: australiaStandardId,
        name: "Australia (7.0 Scale)",
        description:
          "Australian 7.0 GPA scale converted to US 4.0 scale. Used for Australian university applications.",
        isActive: true,
      });

      const australiaRanges = [
        {
          id: crypto.randomUUID(),
          standardId: australiaStandardId,
          minPercentage: "85",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "HD (High Distinction)",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: australiaStandardId,
          minPercentage: "75",
          maxPercentage: "84",
          gpaValue: "3.4",
          gradeLabel: "D (Distinction)",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: australiaStandardId,
          minPercentage: "65",
          maxPercentage: "74",
          gpaValue: "2.9",
          gradeLabel: "C (Credit)",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: australiaStandardId,
          minPercentage: "50",
          maxPercentage: "64",
          gpaValue: "2.3",
          gradeLabel: "P (Pass)",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: australiaStandardId,
          minPercentage: "0",
          maxPercentage: "49",
          gpaValue: "0.0",
          gradeLabel: "F (Fail)",
          sortOrder: "5",
        },
      ];

      await db.insert(gpaConversionRanges).values(australiaRanges);
      console.log(
        `✅ Inserted Australia standard with ${australiaRanges.length} ranges.`,
      );

      // 6. Germany Standard (Modified Bavarian Formula)
      const germanyStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: germanyStandardId,
        name: "Germany (1.0-5.0)",
        description:
          "German grading scale using Modified Bavarian Formula. Lower grades are better. Used for German university applications.",
        isActive: true,
      });

      const germanyRanges = [
        {
          id: crypto.randomUUID(),
          standardId: germanyStandardId,
          minPercentage: "90",
          maxPercentage: "100",
          gpaValue: "1.0",
          gradeLabel: "Sehr Gut (Very Good)",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: germanyStandardId,
          minPercentage: "80",
          maxPercentage: "89",
          gpaValue: "2.0",
          gradeLabel: "Gut (Good)",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: germanyStandardId,
          minPercentage: "70",
          maxPercentage: "79",
          gpaValue: "3.0",
          gradeLabel: "Befriedigend (Satisfactory)",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: germanyStandardId,
          minPercentage: "60",
          maxPercentage: "69",
          gpaValue: "4.0",
          gradeLabel: "Ausreichend (Sufficient)",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: germanyStandardId,
          minPercentage: "0",
          maxPercentage: "59",
          gpaValue: "5.0",
          gradeLabel: "Nicht Ausreichend (Fail)",
          sortOrder: "5",
        },
      ];

      await db.insert(gpaConversionRanges).values(germanyRanges);
      console.log(
        `✅ Inserted Germany standard with ${germanyRanges.length} ranges.`,
      );

      // 7. ECTS Standard
      const ectsStandardId = crypto.randomUUID();
      await db.insert(gpaConversionStandards).values({
        id: ectsStandardId,
        name: "ECTS (European)",
        description:
          "European Credit Transfer and Accumulation System using relative grading. Based on percentile distribution.",
        isActive: true,
      });

      const ectsRanges = [
        {
          id: crypto.randomUUID(),
          standardId: ectsStandardId,
          minPercentage: "90",
          maxPercentage: "100",
          gpaValue: "4.0",
          gradeLabel: "A (Outstanding)",
          sortOrder: "1",
        },
        {
          id: crypto.randomUUID(),
          standardId: ectsStandardId,
          minPercentage: "75",
          maxPercentage: "89",
          gpaValue: "3.3",
          gradeLabel: "B (Above Average)",
          sortOrder: "2",
        },
        {
          id: crypto.randomUUID(),
          standardId: ectsStandardId,
          minPercentage: "60",
          maxPercentage: "74",
          gpaValue: "2.7",
          gradeLabel: "C (Average)",
          sortOrder: "3",
        },
        {
          id: crypto.randomUUID(),
          standardId: ectsStandardId,
          minPercentage: "50",
          maxPercentage: "59",
          gpaValue: "2.0",
          gradeLabel: "D (Satisfactory)",
          sortOrder: "4",
        },
        {
          id: crypto.randomUUID(),
          standardId: ectsStandardId,
          minPercentage: "0",
          maxPercentage: "49",
          gpaValue: "0.0",
          gradeLabel: "E/F (Fail)",
          sortOrder: "5",
        },
      ];

      await db.insert(gpaConversionRanges).values(ectsRanges);
      console.log(
        `✅ Inserted ECTS standard with ${ectsRanges.length} ranges.`,
      );
    } else {
      console.log("⏭️ GPA conversion standards already seeded.");
    }

    console.log("✨ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
