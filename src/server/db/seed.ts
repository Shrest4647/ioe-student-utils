import { db } from "./index";
import { resourceCategories, resourceContentTypes } from "./schema";

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

    console.log("✨ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
