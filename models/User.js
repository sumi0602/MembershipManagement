const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ["admin", "member", "staff"],
      default: "member",
    },
    memberRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    verifyEmailToken: String,
    verifyEmailExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ memberRef: 1 }, { unique: true, sparse: true });

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(config.auth.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      role: this.role,
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateVerifyEmailToken = function () {
  const verifyToken = crypto.randomBytes(20).toString("hex");

  this.verifyEmailToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  this.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verifyToken;
};

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Static method for login tracking and account locking
userSchema.statics.failedLogin = async function (email) {
  const user = await this.findOne({ email });

  if (!user) return;

  // If account is already locked, do nothing
  if (user.isLocked) return;

  // Increment login attempts
  user.loginAttempts += 1;

  // Lock account if max attempts reached
  if (user.loginAttempts >= config.auth.maxLoginAttempts) {
    user.lockUntil = Date.now() + config.auth.lockTime;
  }

  await user.save();
};

// Static method for successful login
userSchema.statics.successfulLogin = async function (email) {
  const user = await this.findOne({ email });

  if (!user) return;

  // Reset login attempts and unlock account
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = Date.now();

  await user.save();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
