const express = require("express");
const { registerUser, loginUser } = require("../controllers/auth.controller"); // Import controller functions

const router = express.Router();

// Public routes for authentication
router.post("/register", registerUser); // Route for user registration
router.post("/login", loginUser); // Route for user login

module.exports = router;
