import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { conn, db } from "../index";
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

function validateDeck(deck: AssetDeck) {
  if (
    !deck.title?.trim() ||
    !Array.isArray(deck.cards) ||
    deck.cards.length === 0
  ) {
    throw new Error(
      "Flashcard asset must include a title and at least one card.",
    );
  }

  deck.cards.forEach((card, cardIndex) => {
    if (!card.front?.trim() || !card.back?.trim()) {
      throw new Error(`Flashcard ${cardIndex + 1} must have a front and back.`);
    }
  });
}

export async function seedFlashcards(createdById?: string) {
  const assetPath = path.join(process.cwd(), "assets", "yolox-flashcards.json");
  const raw = await readFile(assetPath, "utf8");
  const parsed = JSON.parse(raw) as AssetDeck;
  validateDeck(parsed);

  const slug = slugify(parsed.title || "yolox-flashcards");
  const existing = await db
    .select({ id: flashcardDecks.id })
    .from(flashcardDecks)
    .where(eq(flashcardDecks.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    console.log(`⏭️ Flashcard deck already seeded: ${slug}`);
    return;
  }

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

  const tagNames = ["computer-vision", "object-detection", "yolox"];
  await db.transaction(async (tx) => {
    const [deck] = await tx
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

    await tx.insert(flashcardCards).values(
      parsed.cards.map((card, index) => ({
        deckId: deck.id,
        orderNo: index + 1,
        front: card.front,
        back: card.back,
        isActive: true,
      })),
    );

    const tagIds: string[] = [];
    for (const name of tagNames) {
      const tagSlug = slugify(name);
      const existingTag = await tx.query.flashcardTags.findFirst({
        where: { slug: tagSlug },
      });

      if (existingTag) {
        tagIds.push(existingTag.id);
        continue;
      }

      const [tag] = await tx
        .insert(flashcardTags)
        .values({ name, slug: tagSlug })
        .returning({ id: flashcardTags.id });
      tagIds.push(tag.id);
    }

    await tx.insert(flashcardDeckTags).values(
      tagIds.map((tagId) => ({
        deckId: deck.id,
        tagId,
      })),
    );
  });

  console.log(
    `✅ Seeded ${parsed.title} with ${parsed.cards.length} cards and ${tagNames.length} tags.`,
  );
}

if (import.meta.main) {
  seedFlashcards()
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await conn.end();
    });
}
