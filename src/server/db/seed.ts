import { db } from "./index";
import {
  resourceAttachments,
  resourceCategories,
  resourceContentTypes,
  resources,
  resourcesToCategories,
} from "./schema";

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

    console.log("✨ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
