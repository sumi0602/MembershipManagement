const express = require("express");
const router = express.Router();
const EventController = require("../controllers/EventController");
const authMiddleware = require("../middlewares/authMiddleware");

const verifyToken = authMiddleware.verifyToken(); // ✅ get middleware

router.get("/", verifyToken, EventController.getAllEvents);
router.post("/", verifyToken, EventController.createEvent);
router.get("/:id", verifyToken, EventController.getEventById);
router.put("/:id", verifyToken, EventController.updateEvent);
router.delete("/:id", verifyToken, EventController.deleteEvent);
router.post("/:id/attend", verifyToken, EventController.recordAttendance);
router.post("/:id/payment", verifyToken, EventController.recordEventPayment);

module.exports = router;
