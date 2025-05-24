const express = require("express");
const notificationController = require("../controllers/notification.controller");
const { protect: authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Register/manage push tokens
router.post(
  "/tokens/register",
  authenticateToken,
  notificationController.registerToken
);
router.post("/tokens/remove", notificationController.removeToken);

// Schedule notifications
router.post(
  "/schedule",
  authenticateToken,
  notificationController.scheduleNotification
);
router.get(
  "/scheduled",
  authenticateToken,
  notificationController.getScheduledNotifications
);
router.delete(
  "/scheduled/:notificationId",
  authenticateToken,
  notificationController.cancelScheduledNotification
);

// Send immediate notifications
router.post(
  "/send",
  authenticateToken,
  notificationController.sendImmediateNotification
);
router.post(
  "/send/daily-affirmations",
  authenticateToken,
  notificationController.sendDailyAffirmations
);

// Notification history and stats
router.get(
  "/history",
  authenticateToken,
  notificationController.getNotificationHistory
);
router.get(
  "/stats",
  authenticateToken,
  notificationController.getNotificationStats
);
router.patch(
  "/history/:notificationId/read",
  authenticateToken,
  notificationController.markNotificationAsRead
);

// User preferences
router.put(
  "/preferences",
  authenticateToken,
  notificationController.updateNotificationPreferences
);

module.exports = router;
