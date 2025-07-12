const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Member = require("../models/Member");
const config = require("../config/config");
const logger = require("../config/logger");
const { sendEmail } = require("../services/emailService");
const { generateRandomToken } = require("../utils/authUtils");


module.exports = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      const { email, password, role, memberRef, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "Email already in use",
          code: "EMAIL_EXISTS"
        });
      }

      // If memberRef is provided, verify the member exists
      if (memberRef) {
        const member = await Member.findById(memberRef);
        if (!member) {
          return res.status(404).json({ 
            success: false, 
            message: "Member not found",
            code: "MEMBER_NOT_FOUND"
          });
        }
      }

      // Hash password
      const saltRounds = parseInt(config.auth.saltRounds || 12);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const user = new User({
        email,
        password: hashedPassword,
        role: role || "member",
        memberRef,
        firstName,
        lastName,
        isVerified: config.auth.skipEmailVerification // For development/testing
      });

      await user.save();

      // Generate auth tokens
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        config.auth.jwtRefreshSecret,
        { expiresIn: config.auth.jwtRefreshExpiresIn }
      );

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: config.auth.jwtRefreshExpiresIn * 1000
      });

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;

      res.status(201).json({ 
        success: true, 
        token, 
        expiresIn: config.auth.jwtExpiresIn,
        user: userResponse 
      });

    } catch (error) {
      logger.error(`Registration error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error during registration",
        code: "SERVER_ERROR"
      });
    }
  },

login: async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // ✅ Fetch the user and explicitly include hidden fields
    const user = await User.findOne({ email }).select("+password +isLocked +lockUntil +loginAttempts");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }


   
    // ✅ Reset login attempts and update last login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();
    await user.save();

    // ✅ Generate tokens
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.auth.jwtRefreshSecret,
      { expiresIn: config.auth.jwtRefreshExpiresIn }
    );

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.auth.jwtRefreshExpiresIn * 1000
    });

    // Prepare user response without sensitive fields
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.loginAttempts;
    delete userResponse.lockUntil;

    res.json({ 
      success: true, 
      token, 
      expiresIn: config.auth.jwtExpiresIn,
      user: userResponse 
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`, { error });

    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        success: false, 
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED"
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error during login",
      code: "SERVER_ERROR"
    });
  }
},


  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ 
          success: false, 
          message: "Refresh token is required",
          code: "MISSING_TOKEN"
        });
      }

      const decoded = jwt.verify(refreshToken, config.auth.jwtRefreshSecret);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      // Generate new access token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      res.json({ 
        success: true, 
        token,
        expiresIn: config.auth.jwtExpiresIn
      });

    } catch (error) {
      logger.error(`Refresh token error: ${error.message}`, { error });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: "Refresh token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid refresh token",
          code: "INVALID_TOKEN"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Server error refreshing token",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required",
          code: "EMAIL_REQUIRED"
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal whether email exists for security
        return res.json({ 
          success: true, 
          message: "If an account exists with this email, a reset link has been sent"
        });
      }

      // Generate reset token
      const resetToken = generateRandomToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send reset email
      const resetUrl = `${config.app.clientUrl}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        template: 'password-reset',
        context: {
          name: user.firstName || 'User',
          resetUrl,
          expiryHours: 1
        }
      });

      res.json({ 
        success: true, 
        message: "Password reset email sent if account exists"
      });

    } catch (error) {
      logger.error(`Forgot password error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error processing request",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Token and new password are required",
          code: "MISSING_DATA"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 8 characters",
          code: "WEAK_PASSWORD"
        });
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired token",
          code: "INVALID_TOKEN"
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(config.auth.saltRounds || 12);
      user.password = await bcrypt.hash(password, salt);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      // Send confirmation email
      await sendEmail({
        to: user.email,
        subject: "Password Changed Successfully",
        template: 'password-changed',
        context: {
          name: user.firstName || 'User'
        }
      });

      res.json({ 
        success: true, 
        message: "Password updated successfully" 
      });

    } catch (error) {
      logger.error(`Reset password error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error resetting password",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Verify email with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Verification token is required",
          code: "MISSING_TOKEN"
        });
      }

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired verification token",
          code: "INVALID_TOKEN"
        });
      }

      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ 
        success: true, 
        message: "Email verified successfully" 
      });

    } catch (error) {
      logger.error(`Email verification error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error verifying email",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Resend verification email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required",
          code: "EMAIL_REQUIRED"
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      if (user.isVerified) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is already verified",
          code: "ALREADY_VERIFIED"
        });
      }

      // Generate new verification token
      const verificationToken = generateRandomToken();
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      // Send verification email
      const verificationUrl = `${config.app.clientUrl}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email",
        template: 'email-verification',
        context: {
          name: user.firstName || 'User',
          verificationUrl,
          expiryHours: 24
        }
      });

      res.json({ 
        success: true, 
        message: "Verification email sent" 
      });

    } catch (error) {
      logger.error(`Resend verification error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error resending verification",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout: async (req, res) => {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });

    } catch (error) {
      logger.error(`Logout error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error during logout",
        code: "SERVER_ERROR"
      });
    }
  },

  /**
   * Get current authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      res.json({ 
        success: true, 
        user 
      });

    } catch (error) {
      logger.error(`Get current user error: ${error.message}`, { error });
      res.status(500).json({ 
        success: false, 
        message: "Server error fetching user",
        code: "SERVER_ERROR"
      });
    }
  }
};