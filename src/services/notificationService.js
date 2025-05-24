const { Expo } = require("expo-server-sdk");
const prisma = require("../prisma");
const cron = require("node-cron");

class NotificationService {
  constructor() {
    this.expo = new Expo();
    this.initializeCronJobs();
  }

  /**
   * Register a push notification token for a user
   */
  async registerToken(userId, token, platform = "unknown") {
    try {
      // Validate the token format
      if (!Expo.isExpoPushToken(token)) {
        throw new Error("Invalid Expo push token format");
      }

      // Check if token already exists for this user
      const existingToken = await prisma.notificationToken.findFirst({
        where: { userId, token },
      });

      if (existingToken) {
        // Update the existing token
        await prisma.notificationToken.update({
          where: { id: existingToken.id },
          data: {
            isActive: true,
            platform,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new token record
        await prisma.notificationToken.create({
          data: {
            userId,
            token,
            platform,
            isActive: true,
          },
        });
      }

      console.log(
        `Registered push token for user ${userId}: ${token.substring(0, 20)}...`
      );
    } catch (error) {
      console.error("Error registering push token:", error);
      throw error;
    }
  }

  /**
   * Remove a push notification token
   */
  async removeToken(token) {
    try {
      await prisma.notificationToken.deleteMany({
        where: { token },
      });
      console.log(`Removed push token: ${token.substring(0, 20)}...`);
    } catch (error) {
      console.error("Error removing push token:", error);
      throw error;
    }
  }

  /**
   * Schedule a notification to be sent later
   */
  async scheduleNotification(params) {
    try {
      const scheduledNotification = await prisma.scheduledNotification.create({
        data: {
          userId: params.userId,
          title: params.title,
          body: params.body,
          data: params.data || {},
          scheduledFor: params.scheduledFor,
          timezone: params.timezone || "UTC",
          isRecurring: params.isRecurring || false,
          recurringPattern: params.recurringPattern,
        },
      });

      console.log(
        `Scheduled notification ${scheduledNotification.id} for ${params.scheduledFor}`
      );
      return scheduledNotification.id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  /**
   * Send immediate notifications to specific users or all users
   */
  async sendImmediateNotification(params) {
    try {
      let tokens = [];

      if (params.userIds && params.userIds.length > 0) {
        // Send to specific users
        const userTokens = await prisma.notificationToken.findMany({
          where: {
            userId: { in: params.userIds },
            isActive: true,
          },
          select: { token: true, userId: true },
        });
        tokens = userTokens;
      } else {
        // Send to all users
        const allTokens = await prisma.notificationToken.findMany({
          where: { isActive: true },
          select: { token: true, userId: true },
        });
        tokens = allTokens;
      }

      if (tokens.length === 0) {
        console.log("No active tokens found for notification");
        return;
      }

      await this.sendNotificationToTokens(
        tokens,
        params.title,
        params.body,
        params.data
      );
    } catch (error) {
      console.error("Error sending immediate notification:", error);
      throw error;
    }
  }

  /**
   * Send daily affirmation notifications
   */
  async sendDailyAffirmations() {
    try {
      console.log("Starting daily affirmation notifications...");

      // Get all active users with their tokens and subscription status
      const users = await prisma.user.findMany({
        where: {
          notificationTokens: {
            some: { isActive: true },
          },
        },
        include: {
          notificationTokens: {
            where: { isActive: true },
          },
          subscription: true,
        },
      });

      if (users.length === 0) {
        console.log("No users with active tokens found");
        return;
      }

      // Get today's affirmations
      const today = new Date().toISOString().split("T")[0];

      // Try to get global daily affirmation first
      let globalAffirmation = await prisma.dailyAffirmation.findUnique({
        where: { date: today },
        include: { affirmation: true },
      });

      // If no global affirmation exists, create one
      if (!globalAffirmation) {
        const affirmations = await prisma.affirmation.findMany({
          where: { isPremium: false },
        });

        if (affirmations.length > 0) {
          const randomAffirmation =
            affirmations[Math.floor(Math.random() * affirmations.length)];
          globalAffirmation = await prisma.dailyAffirmation.create({
            data: {
              date: today,
              affirmationId: randomAffirmation.id,
            },
            include: { affirmation: true },
          });
        }
      }

      // Send notifications to each user
      for (const user of users) {
        if (user.notificationTokens.length === 0) continue;

        const isPremium = user.subscription?.status === "active";
        let affirmationToSend = globalAffirmation?.affirmation;

        // For premium users, check if they have a personal daily affirmation
        if (isPremium) {
          const personalAffirmation =
            await prisma.userDailyAffirmation.findUnique({
              where: {
                userId_date: {
                  userId: user.id,
                  date: today,
                },
              },
              include: { affirmation: true },
            });

          if (personalAffirmation) {
            affirmationToSend = personalAffirmation.affirmation;
          } else {
            // Create a personal affirmation for premium user
            const premiumAffirmations = await prisma.affirmation.findMany();
            const randomAffirmation =
              premiumAffirmations[
                Math.floor(Math.random() * premiumAffirmations.length)
              ];

            const createdPersonalAffirmation =
              await prisma.userDailyAffirmation.create({
                data: {
                  userId: user.id,
                  date: today,
                  affirmationId: randomAffirmation.id,
                },
                include: { affirmation: true },
              });
            affirmationToSend = createdPersonalAffirmation.affirmation;
          }
        }

        if (!affirmationToSend) continue;

        const tokens = user.notificationTokens.map((token) => ({
          token: token.token,
          userId: user.id,
        }));

        await this.sendNotificationToTokens(
          tokens,
          "Today's Affirmation 🌟",
          affirmationToSend.text,
          {
            affirmationId: affirmationToSend.id,
            category: affirmationToSend.category,
            isPremium: affirmationToSend.isPremium,
            type: "daily_affirmation",
          }
        );
      }

      console.log(`Daily affirmations sent to ${users.length} users`);
    } catch (error) {
      console.error("Error sending daily affirmations:", error);
      throw error;
    }
  }

  /**
   * Send notifications to a list of tokens and log the results
   */
  async sendNotificationToTokens(tokens, title, body, data) {
    try {
      // Prepare messages
      const messages = tokens
        .filter(({ token }) => Expo.isExpoPushToken(token))
        .map(({ token }) => ({
          to: token,
          sound: "default",
          title,
          body,
          data: data || {},
        }));

      if (messages.length === 0) {
        console.log("No valid tokens to send notifications to");
        return;
      }

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending notification chunk:", error);
        }
      }

      // Log notification history for each user
      for (let i = 0; i < tokens.length; i++) {
        const { userId } = tokens[i];
        const ticket = tickets[i];

        await prisma.notificationHistory.create({
          data: {
            userId,
            title,
            body,
            data: data || {},
            status: ticket?.status === "ok" ? "sent" : "failed",
            expoReceiptId: ticket?.status === "ok" ? ticket?.id : null,
            failureReason:
              ticket?.status === "error" ? ticket.message : undefined,
          },
        });
      }

      console.log(
        `Sent ${messages.length} notifications, ${
          tickets.filter((t) => t.status === "ok").length
        } successful`
      );

      // Handle receipts (optional, for tracking delivery)
      setTimeout(() => this.handleNotificationReceipts(tickets), 15000);
    } catch (error) {
      console.error("Error in sendNotificationToTokens:", error);
      throw error;
    }
  }

  /**
   * Handle notification receipts to track delivery status
   */
  async handleNotificationReceipts(tickets) {
    try {
      const receiptIds = tickets
        .filter((ticket) => ticket.id)
        .map((ticket) => ticket.id);

      if (receiptIds.length === 0) return;

      const receiptIdChunks =
        this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(
            chunk
          );

          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            const { status } = receipt;
            const message = receipt.message;

            // Update notification history with delivery status
            await prisma.notificationHistory.updateMany({
              where: { expoReceiptId: receiptId },
              data: {
                status: status === "ok" ? "delivered" : "failed",
                failureReason: status === "error" ? message : undefined,
              },
            });
          }
        } catch (error) {
          console.error("Error processing receipt chunk:", error);
        }
      }
    } catch (error) {
      console.error("Error handling notification receipts:", error);
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();

      const dueNotifications = await prisma.scheduledNotification.findMany({
        where: {
          scheduledFor: { lte: now },
          isActive: true,
        },
        include: {
          user: {
            include: {
              notificationTokens: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      for (const notification of dueNotifications) {
        try {
          if (notification.userId) {
            // Send to specific user
            if (notification.user?.notificationTokens.length) {
              const tokens = notification.user.notificationTokens.map(
                (token) => ({
                  token: token.token,
                  userId: notification.userId,
                })
              );

              await this.sendNotificationToTokens(
                tokens,
                notification.title,
                notification.body,
                notification.data
              );
            }
          } else {
            // Send to all users (global notification)
            await this.sendImmediateNotification({
              title: notification.title,
              body: notification.body,
              data: notification.data,
            });
          }

          // Update last sent time
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: { lastSent: now },
          });

          // Handle recurring notifications
          if (notification.isRecurring && notification.recurringPattern) {
            const nextScheduledTime = this.calculateNextRecurrence(
              notification.scheduledFor,
              notification.recurringPattern
            );

            if (nextScheduledTime) {
              await prisma.scheduledNotification.update({
                where: { id: notification.id },
                data: { scheduledFor: nextScheduledTime },
              });
            }
          } else {
            // Deactivate one-time notifications
            await prisma.scheduledNotification.update({
              where: { id: notification.id },
              data: { isActive: false },
            });
          }
        } catch (error) {
          console.error(
            `Error processing scheduled notification ${notification.id}:`,
            error
          );
        }
      }

      if (dueNotifications.length > 0) {
        console.log(
          `Processed ${dueNotifications.length} scheduled notifications`
        );
      }
    } catch (error) {
      console.error("Error processing scheduled notifications:", error);
    }
  }

  /**
   * Calculate next recurrence time based on pattern
   */
  calculateNextRecurrence(lastTime, pattern) {
    const next = new Date(lastTime);

    switch (pattern) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        // For cron expressions or other patterns, you could implement cron parsing here
        return null;
    }

    return next;
  }

  /**
   * Initialize cron jobs for scheduled tasks
   */
  initializeCronJobs() {
    // Process scheduled notifications every minute
    cron.schedule("* * * * *", () => {
      this.processScheduledNotifications().catch(console.error);
    });

    // Send daily affirmations at 9:00 AM every day
    cron.schedule("0 9 * * *", () => {
      this.sendDailyAffirmations().catch(console.error);
    });

    console.log("Notification cron jobs initialized");
  }

  /**
   * Get notification statistics for a user
   */
  async getUserNotificationStats(userId) {
    try {
      const stats = await prisma.notificationHistory.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      });

      const totalNotifications = await prisma.notificationHistory.count({
        where: { userId },
      });

      const lastNotification = await prisma.notificationHistory.findFirst({
        where: { userId },
        orderBy: { sentAt: "desc" },
      });

      return {
        totalNotifications,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {}),
        lastNotificationSent: lastNotification?.sentAt,
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
