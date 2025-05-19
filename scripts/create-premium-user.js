// Create a test user with premium access for testing
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Configuration for test user
const TEST_EMAIL = "premium@test.com";
const TEST_PASSWORD = "premiumtest123";
const TEST_NAME = "Premium Tester";

async function createPremiumTestUser() {
  try {
    console.log("Creating premium test user...");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      include: { subscription: true },
    });

    let user;

    if (existingUser) {
      console.log("User already exists, updating to premium...");
      user = existingUser;
    } else {
      // Create new user
      console.log("Creating new user...");
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

      user = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          password: hashedPassword,
          name: TEST_NAME,
        },
      });

      console.log("User created:", user.id);
    }

    // Check if subscription exists
    if (existingUser?.subscription) {
      // Update existing subscription
      console.log("Updating existing subscription...");

      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          status: "active",
          plan: "premium_monthly",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          paymentGateway: "test",
          gatewaySubscriptionId: "test_sub_" + Date.now(),
          gatewayCustomerId: "test_cust_" + user.id,
        },
      });
    } else {
      // Create new subscription
      console.log("Creating new subscription...");

      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: "active",
          plan: "premium_monthly",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          paymentGateway: "test",
          gatewaySubscriptionId: "test_sub_" + Date.now(),
          gatewayCustomerId: "test_cust_" + user.id,
        },
      });
    }

    // Verify the result
    const updatedUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      include: { subscription: true },
    });

    console.log("Premium test user created successfully:");
    console.log("----------------------------------------");
    console.log("Email:", TEST_EMAIL);
    console.log("Password:", TEST_PASSWORD);
    console.log("User ID:", updatedUser.id);
    console.log("Premium Status: Active");
    console.log("Subscription ends:", updatedUser.subscription.endDate);
    console.log("----------------------------------------");
    console.log("Use these credentials to log in to the app");
  } catch (error) {
    console.error("Error creating premium test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createPremiumTestUser();
