const prisma = require("../prisma");

// Fallback static data
const fallbackData = require("../data/fallbackAffirmations.json");

/**
 * Get a random affirmation from the database
 * Falls back to static data if no affirmations exist in the database
 */
const getRandomAffirmation = async () => {
  try {
    // Count total affirmations in database
    const count = await prisma.affirmation.count();

    if (count > 0) {
      // If there are affirmations in the database, get a random one
      const randomIndex = Math.floor(Math.random() * count);

      const affirmation = await prisma.affirmation.findFirst({
        skip: randomIndex,
        take: 1,
      });

      return affirmation;
    } else {
      // If no affirmations in database, return a random one from static data
      const randomIndex = Math.floor(Math.random() * fallbackData.length);
      const fallbackAffirmation = fallbackData[randomIndex];

      // Ensure the fallback has consistent properties
      return {
        ...fallbackAffirmation,
        id: fallbackAffirmation.id,
        text: fallbackAffirmation.text,
        category: fallbackAffirmation.category || "General",
        isPremium: fallbackAffirmation.isPremium === true,
      };
    }
  } catch (error) {
    console.error("Error getting random affirmation:", error);
    // Fallback to static data in case of any error
    const randomIndex = Math.floor(Math.random() * fallbackData.length);
    const fallbackAffirmation = fallbackData[randomIndex];

    // Ensure the fallback has consistent properties
    return {
      ...fallbackAffirmation,
      id: fallbackAffirmation.id,
      text: fallbackAffirmation.text,
      category: fallbackAffirmation.category || "General",
      isPremium: fallbackAffirmation.isPremium === true,
    };
  }
};

module.exports = { getRandomAffirmation };
