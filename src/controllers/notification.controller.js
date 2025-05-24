const notificationService = require("../services/notificationService");
const prisma = require("../prisma");

const registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user?.id; // Assuming you have auth middleware that sets req.user

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!token) {
      return res.status(400).json({ error: "Push token is required" });
    }

    await notificationService.registerToken(userId, token, platform);

    res.status(200).json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json({ error: "Failed to register push token" });
  }
};

const removeToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Push token is required" });
    }

    await notificationService.removeToken(token);

    res.status(200).json({
      success: true,
      message: "Push token removed successfully",
    });
  } catch (error) {
    console.error("Error removing push token:", error);
    res.status(500).json({ error: "Failed to remove push token" });
  }
};

const scheduleNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      body,
      data,
      scheduledFor,
      timezone,
      isRecurring,
      recurringPattern,
    } = req.body;
    const requestUserId = req.user?.id;

    // Only allow users to schedule notifications for themselves, or admins to schedule for anyone
    if (userId && userId !== requestUserId) {
      // You might want to check for admin role here
      return res
        .status(403)
        .json({ error: "Cannot schedule notifications for other users" });
    }

    if (!title || !body || !scheduledFor) {
      return res
        .status(400)
        .json({ error: "Title, body, and scheduledFor are required" });
    }

    const notificationId = await notificationService.scheduleNotification({
      userId: userId || requestUserId,
      title,
      body,
      data,
      scheduledFor: new Date(scheduledFor),
      timezone,
      isRecurring,
      recurringPattern,
    });

    res.status(200).json({
      success: true,
      notificationId,
      message: "Notification scheduled successfully",
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
    res.status(500).json({ error: "Failed to schedule notification" });
  }
};

const sendImmediateNotification = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    // This endpoint might be restricted to admins only
    // You can add admin role check here

    await notificationService.sendImmediateNotification({
      userIds,
      title,
      body,
      data,
    });

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending immediate notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

const sendDailyAffirmations = async (req, res) => {
  try {
    // This endpoint should be restricted to admins or internal use
    await notificationService.sendDailyAffirmations();

    res.status(200).json({
      success: true,
      message: "Daily affirmations sent successfully",
    });
  } catch (error) {
    console.error("Error sending daily affirmations:", error);
    res.status(500).json({ error: "Failed to send daily affirmations" });
  }
};

const getScheduledNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const notifications = await prisma.scheduledNotification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // Global notifications
        ],
        isActive: true,
      },
      orderBy: { scheduledFor: "asc" },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    res.status(500).json({ error: "Failed to get scheduled notifications" });
  }
};

const cancelScheduledNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if the notification belongs to the user
    const notification = await prisma.scheduledNotification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId },
          { userId: null }, // Allow canceling global notifications if user is admin
        ],
      },
    });

    if (!notification) {
      return res
        .status(404)
        .json({ error: "Notification not found or access denied" });
    }

    await prisma.scheduledNotification.update({
      where: { id: notificationId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "Notification cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling notification:", error);
    res.status(500).json({ error: "Failed to cancel notification" });
  }
};

const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      prisma.notificationHistory.findMany({
        where: { userId },
        orderBy: { sentAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.notificationHistory.count({
        where: { userId },
      }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting notification history:", error);
    res.status(500).json({ error: "Failed to get notification history" });
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await notificationService.getUserNotificationStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting notification stats:", error);
    res.status(500).json({ error: "Failed to get notification stats" });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { enableDailyAffirmations, preferredTime, timezone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // You might want to store notification preferences in a separate table
    // For now, we'll use the user's existing scheduled notifications

    if (enableDailyAffirmations === false) {
      // Disable daily affirmations for this user
      await prisma.scheduledNotification.updateMany({
        where: {
          userId,
          title: "Today's Affirmation 🌟",
          isRecurring: true,
        },
        data: { isActive: false },
      });
    } else if (enableDailyAffirmations === true && preferredTime) {
      // Schedule daily affirmations at preferred time
      const [hours, minutes] = preferredTime.split(":").map(Number);
      const scheduledFor = new Date();
      scheduledFor.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduledFor <= new Date()) {
        scheduledFor.setDate(scheduledFor.getDate() + 1);
      }

      await notificationService.scheduleNotification({
        userId,
        title: "Today's Affirmation 🌟",
        body: "Your daily dose of positivity is ready! 💫",
        scheduledFor,
        timezone: timezone || "UTC",
        isRecurring: true,
        recurringPattern: "daily",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({ error: "Failed to update notification preferences" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await prisma.notificationHistory.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { status: "read" },
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

module.exports = {
  registerToken,
  removeToken,
  scheduleNotification,
  sendImmediateNotification,
  sendDailyAffirmations,
  getScheduledNotifications,
  cancelScheduledNotification,
  getNotificationHistory,
  getNotificationStats,
  updateNotificationPreferences,
  markNotificationAsRead,
};
