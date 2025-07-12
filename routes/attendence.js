const express = require("express");
const router = express.Router();
const { recordAttendance } = require("../controllers/AttendanceController");

router.post("/record", recordAttendance); // POST /api/attendance/record

module.exports = router;
