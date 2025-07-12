const express = require("express");
const router = express.Router();
const RenewalController = require("../controllers/RenewalController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware.verifyToken, RenewalController.renewMembership);

router.patch(
  "/auto-renew/:memberId",
  authMiddleware.verifyToken,
  RenewalController.toggleAutoRenew
);

module.exports = router;
