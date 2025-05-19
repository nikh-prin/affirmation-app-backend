import { Router } from "express";
import {
  getAffirmations,
  getAffirmationById,
  getDailyAffirmation,
} from "../controllers/affirmation.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAffirmations);
router.get("/daily", getDailyAffirmation); // Works with or without auth
router.get("/:id", getAffirmationById);

export default router;
