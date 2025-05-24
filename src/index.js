const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const prisma = require("./prisma"); // Import the centralized Prisma client
const notificationService = require("./services/notificationService"); // Import notification service

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Use port from environment or default to 3001

// Initialize notification service (this will start the cron jobs)
// notificationService.start(); // Uncomment if you have a start function

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
// Use express.json() for most routes
app.use(express.json());
// Use express.raw() specifically for the webhook route BEFORE it's defined
// This is needed to verify the raw body signature from payment gateways
// The payment routes file will handle applying this middleware to the webhook route
// app.use('/api/payments/webhook', express.raw({ type: 'application/json' })); // Alternative: apply specifically here if needed

// Basic route to check if the server is running
app.get("/", (req, res) => {
  res.send("Affirmation App Backend is running!");
});

// Health check endpoint for monitoring
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
      },
      message: "Cannot connect to database",
    });
  }
});

// Import and use authentication routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Import and use user routes
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

// Import and use favorite routes
const favoriteRoutes = require("./routes/favorite.routes");
app.use("/api/favorites", favoriteRoutes);

// Import and use subscription routes
const subscriptionRoutes = require("./routes/subscription.routes");
app.use("/api/subscriptions", subscriptionRoutes);

// Import and use payment routes (includes webhook)
const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);

// Import and use affirmation routes
const affirmationRoutes = require("./routes/affirmation.routes");
app.use("/api/affirmations", affirmationRoutes);

// Import and use notification routes
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle server shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect(); // Disconnect Prisma Client
    console.log("Prisma client disconnected");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect(); // Disconnect Prisma Client
    console.log("Prisma client disconnected");
    process.exit(0);
  });
});

// Disconnect Prisma Client when the application exits
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Prisma client disconnected on beforeExit");
});
