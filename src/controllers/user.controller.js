const prisma = require("../prisma"); // Import the centralized Prisma client

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (requires authentication)
const getUserProfile = async (req, res) => {
  // The user ID is available on req.user because of the 'protect' middleware
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Not authorized, user ID not found" }); // Should not happen if protect middleware works
  }

  try {
    // Find the user by ID and include their subscription details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // Select fields to return
        id: true,
        email: true,
        createdAt: true,
        // Include subscription details
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            startDate: true,
            endDate: true,
            renewalDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (user) {
      res.json({
        // 200 OK
        id: user.id,
        email: user.email,
        // Determine if the user is premium based on subscription status
        isPremium: user.subscription?.status === "active",
        subscription: user.subscription, // Include subscription details
      });
    } else {
      res.status(404).json({ message: "User not found" }); // 404 Not Found
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
};

module.exports = { getUserProfile };
