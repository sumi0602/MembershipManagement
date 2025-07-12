const express = require("express");
const router = express.Router();
const {
  getMemberAttendanceReport,
  getEventAttendanceReport,
  getAttendanceSummary,
} = require("../controllers/reportController");

router.get("/member/:memberId", getMemberAttendanceReport);        // /api/reports/member/:memberId
router.get("/event/:eventId", getEventAttendanceReport);           // /api/reports/event/:eventId
router.get("/attendance/summary", getAttendanceSummary);           // /api/reports/attendance/summary

module.exports = router;
