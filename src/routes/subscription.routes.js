const express = require("express");
const {
  getUserSubscription,
} = require("../controllers/subscription.controller"); // Import controller function
const { protect } = require("../middleware/auth.middleware"); // Import the auth middleware

const router = express.Router();

// Protected route to get the logged-in user's subscription details
router.get("/", protect, getUserSubscription);

module.exports = router;
