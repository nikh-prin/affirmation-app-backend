const { Router } = require("express");
const {
  addFavorite,
  removeFavorite,
  getFavorites,
} = require("../controllers/favorite.controller");
const { protect } = require("../middleware/auth.middleware"); // Importing the correct middleware name

const router = Router();

// All favorite routes require authentication
router.use(protect);

router.post("/", addFavorite);
router.get("/", getFavorites);
router.delete("/:affirmationId", removeFavorite);

module.exports = router;
