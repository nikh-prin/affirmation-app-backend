const express = require("express");
const { getUserProfile } = require("../controllers/user.controller"); // Import controller function
const { protect } = require("../middleware/auth.middleware"); // Import the auth middleware

const router = express.Router();

// Protected route to get the logged-in user's profile
// The 'protect' middleware ensures only authenticated users can access this route
router.get("/profile", protect, getUserProfile);
router.get("/me", protect, getUserProfile); // Add this endpoint as well for compatibility

module.exports = router;
