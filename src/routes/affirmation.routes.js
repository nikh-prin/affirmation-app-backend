const { Router } = require("express");
const {
  getAffirmations,
  getAffirmationById,
  getDailyAffirmation,
  getRandomAffirmationEndpoint,
} = require("../controllers/affirmation.controller");
const { protect } = require("../middleware/auth.middleware");

const router = Router();

// Public routes
router.get("/", getAffirmations);
router.get("/random", getRandomAffirmationEndpoint);
router.get("/daily", getDailyAffirmation); // Works with or without auth
router.get("/:id", getAffirmationById);

module.exports = router;
