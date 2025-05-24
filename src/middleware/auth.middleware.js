const jwt = require("jsonwebtoken");

// Middleware to protect routes
const protect = (req, res, next) => {
  let token;

  // Check for token in the Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user information to the request object
      // Note: In a real app, you might fetch the user from the DB here
      // to ensure they still exist and are active.
      req.user = { id: decoded.id };

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" }); // 401 Unauthorized
    }
  }

  // If no token is found
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" }); // 401 Unauthorized
  }
};

module.exports = { protect };
