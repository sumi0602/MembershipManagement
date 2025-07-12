require("dotenv").config();

module.exports = {
  // Application settings
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    apiPrefix: "/api",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ["image/jpeg", "image/png", "application/pdf"],
  },

  // Database configuration
  database: {
    mongoURI:
      process.env.MONGODB_URI || "mongodb://localhost:27017/membership_db",
    options: {},
    testMongoURI:
      process.env.TEST_MONGODB_URI ||
      "mongodb://localhost:27017/membership_test_db",
  },

   auth: {
    jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    jwtRefreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "604800", 10), // 7 days
    saltRounds: parseInt(process.env.SALT_ROUNDS || "10", 10),
    skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
    lockTime: parseInt(process.env.ACCOUNT_LOCK_TIME || "300000", 10) // 5 minutes
  },

  // Email settings (for notifications)
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || "no-reply@membership.org",
  },

  // QR Code settings
  qrCode: {
    size: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  },

  // CORS settings
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3001"],
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
};
