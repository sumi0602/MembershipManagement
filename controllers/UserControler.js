const User = require("../models/User");
const Member = require("../models/Member");
const UserDTO = require("../dtos/UserDTO");
const { sendEmail } = require("../services/emailService");
const userValidation = require("../validations/userValidation");
const logger = require("../config/logger");
const config = require("../config/config");

exports.register = async (req, res) => {
  try {
    // Validate request body
    const { error } = userValidation.register.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, role, memberRef } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // If memberRef is provided, verify it exists
    if (memberRef) {
      const member = await Member.findById(memberRef);
      if (!member) {
        return res.status(400).json({ error: "Member reference not found" });
      }

      // Check if member already has a user account
      const memberUser = await User.findOne({ memberRef });
      if (memberUser) {
        return res.status(400).json({ error: "Member already has an account" });
      }
    }

    // Create new user
    const user = new User({ email, password, role, memberRef });
    await user.save();

    // Generate email verification token
    const verifyToken = user.generateVerifyEmailToken();
    await user.save();

    // Send verification email
    const verifyUrl = `${config.app.clientUrl}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email",
      html: `<p>Please click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    });

    // Return user data (without password)
    res.status(201).json(UserDTO.fromUser(user));
  } catch (err) {
    logger.error(`User registration error: ${err.message}`);
    res.status(500).json({ error: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    // Validate request body
    const { error } = userValidation.login.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      await User.failedLogin(email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        error: "Account locked. Try again later or reset your password.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await User.failedLogin(email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in",
      });
    }

    // Successful login - reset attempts and generate token
    await User.successfulLogin(email);
    const token = user.generateAuthToken();

    res.json({
      user: UserDTO.fromUser(user),
      token,
    });
  } catch (err) {
    logger.error(`User login error: ${err.message}`);
    res.status(500).json({ error: "Server error during login" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(UserDTO.fromUser(user));
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    res.status(500).json({ error: "Server error fetching user" });
  }
};
