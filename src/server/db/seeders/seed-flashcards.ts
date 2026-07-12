import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../index";
import {
  flashcardCards,
  flashcardDecks,
  flashcardDeckTags,
  flashcardTags,
} from "../schema";

type AssetCard = {
  front: string;
  back: string;
};

type AssetDeck = {
  title: string;
  cards: AssetCard[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 255);
}

export async function seedFlashcards(createdById?: string) {
  const fallbackUser = createdById
    ? createdById
    : (
        await db.query.user.findFirst({
          columns: { id: true },
        })
      )?.id;

  if (!fallbackUser) {
    console.log("⏭️ Skipped flashcard seed because no user exists.");
    return;
  }

  const assetPath = path.join(process.cwd(), "assets", "yolox-flashcards.json");
  const raw = await readFile(assetPath, "utf8");
  const parsed = JSON.parse(raw) as AssetDeck;

  const slug = slugify(parsed.title || "yolox-flashcards");
  const existing = await db
    .select({ id: flashcardDecks.id })
    .from(flashcardDecks)
    .where(eq(flashcardDecks.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    console.log("⏭️ Sample flashcard deck already seeded.");
    return;
  }

  const [deck] = await db
    .insert(flashcardDecks)
    .values({
      slug,
      title: parsed.title,
      description: "Imported from assets/yolox-flashcards.json",
      status: "published",
      difficulty: "medium",
      estimatedMinutes: 20,
      srsAlgorithm: "sm2",
      createdById: fallbackUser,
      updatedById: fallbackUser,
      publishedAt: new Date(),
      version: 1,
    })
    .returning({ id: flashcardDecks.id });

  await db.insert(flashcardCards).values(
    parsed.cards.map((card, idx) => ({
      deckId: deck.id,
      orderNo: idx + 1,
      front: card.front,
      back: card.back,
      isActive: true,
    })),
  );

  const tagNames = ["computer-vision", "object-detection", "yolox"];
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const slugName = slugify(name);
    const existingTag = await db.query.flashcardTags.findFirst({
      where: { slug: slugName },
    });

    if (existingTag) {
      tagIds.push(existingTag.id);
      continue;
    }

    const [tag] = await db
      .insert(flashcardTags)
      .values({ name, slug: slugName })
      .returning({ id: flashcardTags.id });

    tagIds.push(tag.id);
  }

  await db.insert(flashcardDeckTags).values(
    tagIds.map((tagId) => ({
      deckId: deck.id,
      tagId,
    })),
  );

  console.log("✅ Seeded flashcard deck from assets/yolox-flashcards.json");
}

seedFlashcards()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    process.exit(1);
  });
