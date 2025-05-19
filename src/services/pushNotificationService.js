// Example of sending push notifications from your backend

// You'd need to install these packages:
// npm install expo-server-sdk

const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
const expo = new Expo();

// Function to send affirmation notifications to all users
async function sendAffirmationNotifications() {
  // Step 1: Get all users with their push tokens from your database
  // This is just an example, you'd actually query your database
  const users = [
    {
      id: 1,
      pushToken: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      isPremium: true,
    },
    {
      id: 2,
      pushToken: "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
      isPremium: false,
    },
    // etc.
  ];

  // Step 2: Get your affirmations
  const affirmations = [
    { id: 1, text: "I am capable of amazing things", isPremium: false },
    { id: 2, text: "Today I choose joy and gratitude", isPremium: true },
    // etc.
  ];

  // Step 3: Prepare notification messages
  const messages = [];

  for (const user of users) {
    // Skip users without a valid Expo push token
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(
        `Push token ${user.pushToken} is not a valid Expo push token`
      );
      continue;
    }

    // Filter affirmations based on user's premium status
    const eligibleAffirmations = user.isPremium
      ? affirmations
      : affirmations.filter((a) => !a.isPremium);

    // Select a random affirmation
    const randomIndex = Math.floor(Math.random() * eligibleAffirmations.length);
    const affirmation = eligibleAffirmations[randomIndex];

    // Create a notification message
    messages.push({
      to: user.pushToken,
      sound: "default",
      title: "Today's Affirmation",
      body: affirmation.text,
      data: {
        affirmationId: affirmation.id,
        isPremium: affirmation.isPremium,
      },
    });
  }

  // Step 4: Send notifications in chunks
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("Notifications sent:", ticketChunk);
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  }

  // Step 5: Handle any errors by tracking the receipts (optional)
  const receiptIds = [];
  for (const ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information but no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      // Check receipts
      for (const receiptId in receipts) {
        const { status, message, details } = receipts[receiptId];

        if (status === "ok") {
          console.log(`Receipt ${receiptId}: Notification delivered`);
        } else if (status === "error") {
          console.error(
            `Receipt ${receiptId}: Error delivering notification:`,
            message,
            details
          );
        }
      }
    } catch (error) {
      console.error("Error checking receipts:", error);
    }
  }
}

// You'd call this function from a scheduled job
// For example, using a cron job with node-cron:
//
// const cron = require('node-cron');
//
// // Schedule to run every day at 9:00 AM
// cron.schedule('0 9 * * *', () => {
//   console.log('Sending daily affirmations');
//   sendAffirmationNotifications();
// });

// Export for use in your backend
module.exports = { sendAffirmationNotifications };
