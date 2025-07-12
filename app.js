require("dotenv").config();

// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config/config");
const memberRoutes = require("./routes/members");
const eventRoutes = require("./routes/events");
const paymentRoutes = require("./routes/eventPayments");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendence");

const app = express();
// Add this as the first middleware in app.js
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Database connection
mongoose
  .connect(config.database.mongoURI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/members", memberRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/attendance", attendanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
