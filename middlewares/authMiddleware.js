const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");
const logger = require("../config/logger");

const authMiddleware = {
  // Verify JWT token
  verifyToken: (requiredRole) => async (req, res, next) => {
    try {
      // 1. Get token from header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      // 2. Verify token
      const decoded = jwt.verify(token, config.auth.jwtSecret);

      // 3. Find user
      const user = await User.findOne({
        _id: decoded.userId,
        isVerified: true,
        //status: 'active'
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found or account not verified",
        });
      }

      // 4. Check role if required

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      // 5. Attach user to request
      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      logger.error(`Authentication error: ${err.message}`);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  },

  // Role-based access control
  requireRole: (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: "Access denied",
    });
  },

  // Check if user is authenticated (without failing)
  optionalAuth: async (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (token) {
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        const user = await User.findOne({
          _id: decoded.userId,
          isVerified: true,
          /// status: 'active'
        });

        if (user) {
          req.user = user;
          req.token = token;
        }
      }
      next();
    } catch (err) {
      // Don't fail for optional auth
      next();
    }
  },
};

module.exports = authMiddleware;
