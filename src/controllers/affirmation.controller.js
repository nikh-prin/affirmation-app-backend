const prisma = require("../prisma");
const { getRandomAffirmation } = require("../utils/affirmation.utils");

// @desc    Get all affirmations
// @route   GET /api/affirmations
// @access  Public
const getAffirmations = async (req, res) => {
  try {
    const category = req.query.category;

    // Query affirmations from database with optional category filter
    const affirmations = await prisma.affirmation.findMany({
      where: category && category !== "All" ? { category } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no affirmations in database, respond with a fallback array
    if (affirmations.length === 0) {
      // Fallback to static array
      const fallbackData = require("../data/fallbackAffirmations.json");
      return res.json({ affirmations: fallbackData });
    }

    res.json({ affirmations });
  } catch (error) {
    console.error("Error fetching affirmations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single affirmation by ID
// @route   GET /api/affirmations/:id
// @access  Public
const getAffirmationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Affirmation ID is required" });
    }

    // Try to get affirmation from database
    const affirmation = await prisma.affirmation.findUnique({
      where: { id },
    });

    // If affirmation not found in database, check the static fallback data
    if (!affirmation) {
      // Fallback to static array
      const fallbackData = require("../data/fallbackAffirmations.json");
      const fallbackAffirmation = fallbackData.find((a) => a.id === id);

      if (fallbackAffirmation) {
        return res.json(fallbackAffirmation);
      }

      return res.status(404).json({ message: "Affirmation not found" });
    }

    res.json(affirmation);
  } catch (error) {
    console.error("Error fetching affirmation by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get daily affirmation
// @route   GET /api/affirmations/daily
// @access  Public (with optional authentication for personalization)
const getDailyAffirmation = async (req, res) => {
  try {
    const userId = req.user?.id; // Optional user ID from auth middleware

    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    let dailyAffirmation;

    // If authenticated, check for user-specific daily affirmation
    if (userId) {
      // Try to get user's daily affirmation from database
      const userDailyAffirmation = await prisma.userDailyAffirmation.findFirst({
        where: {
          userId,
          date: today,
        },
        include: {
          affirmation: true,
        },
      });

      if (userDailyAffirmation?.affirmation) {
        dailyAffirmation = userDailyAffirmation.affirmation;
      }
    }

    // If no user-specific daily affirmation, get the global daily affirmation
    if (!dailyAffirmation) {
      const globalDaily = await prisma.dailyAffirmation.findFirst({
        where: {
          date: today,
        },
        include: {
          affirmation: true,
        },
      });

      if (globalDaily?.affirmation) {
        dailyAffirmation = globalDaily.affirmation;
      }
    }

    // If no daily affirmation in database, generate a random one
    if (!dailyAffirmation) {
      dailyAffirmation = await getRandomAffirmation();

      // Store this as today's global daily affirmation if it came from database
      if (dailyAffirmation.id) {
        await prisma.dailyAffirmation.create({
          data: {
            date: today,
            affirmationId: dailyAffirmation.id,
          },
        });
      }
    }

    res.json({ affirmation: dailyAffirmation });
  } catch (error) {
    console.error("Error fetching daily affirmation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get random affirmation
// @route   GET /api/affirmations/random
// @access  Public
const getRandomAffirmationEndpoint = async (req, res) => {
  try {
    const affirmation = await getRandomAffirmation();

    if (!affirmation) {
      return res.status(404).json({ message: "Affirmation not found" });
    }

    res.json(affirmation);
  } catch (error) {
    console.error("Error fetching random affirmation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAffirmations,
  getAffirmationById,
  getDailyAffirmation,
  getRandomAffirmationEndpoint,
};
