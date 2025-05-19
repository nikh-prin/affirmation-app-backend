// /Volumes/Prince SSD/Development/my-affirmation-app/AffirmationAppBackend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed operation...");

  // Read the fallback affirmations from the JSON file
  const dataPath = path.join(
    __dirname,
    "../src/data/fallbackAffirmations.json"
  );
  const affirmationsData = JSON.parse(
    fs.readFileSync(dataPath, "utf8")
  ) as Array<{
    id: string;
    text: string;
    category?: string;
    isPremium?: boolean;
  }>;

  console.log(`Read ${affirmationsData.length} affirmations from file`);

  // Check if we already have affirmations in the database
  const existingCount = await prisma.affirmation.count();
  if (existingCount > 0) {
    console.log(
      `Database already has ${existingCount} affirmations, skipping seed`
    );
    return;
  }

  // Transform the affirmations data for database insertion
  const affirmations = affirmationsData.map(
    (aff: {
      id: string;
      text: string;
      category?: string;
      isPremium?: boolean;
    }) => {
      // Use provided category or determine it from the text if not available
      let category = aff.category || "General";
      if (!aff.category) {
        if (aff.text.toLowerCase().includes("love")) {
          category = "Love";
        } else if (
          aff.text.toLowerCase().includes("success") ||
          aff.text.toLowerCase().includes("achieve")
        ) {
          category = "Success";
        } else if (
          aff.text.toLowerCase().includes("peace") ||
          aff.text.toLowerCase().includes("calm")
        ) {
          category = "Peace";
        } else if (
          aff.text.toLowerCase().includes("health") ||
          aff.text.toLowerCase().includes("strong")
        ) {
          category = "Health";
        }
      }

      // Use provided isPremium flag or determine it based on ID if not available
      const isPremium =
        aff.isPremium !== undefined
          ? aff.isPremium
          : parseInt(aff.id) % 5 === 0;

      return {
        // Don't include the id from the JSON to let Prisma generate UUIDs
        text: aff.text,
        category,
        isPremium,
        author: "Affirmation App Team", // Default author
      };
    }
  );

  // Insert the affirmations
  const result = await prisma.affirmation.createMany({
    data: affirmations,
    skipDuplicates: true, // Skip any duplicates (based on unique constraints)
  });

  console.log(`Inserted ${result.count} affirmations`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
