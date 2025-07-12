const express = require("express");
const router = express.Router();
const MemberController = require("../controllers/MemberController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const verifyToken = authMiddleware.verifyToken(); // ✅ returns middleware
router.post("/renew", MemberController.renewMembership); // POST /api/members/renew

router.get("/", verifyToken, adminMiddleware, MemberController.getAllMembers);
router.post(
  "/",
  verifyToken,
  adminMiddleware,
  uploadMiddleware.single("receipt"),
  MemberController.createMember
);
router.get("/:id", verifyToken, MemberController.getMemberById);
router.put(
  "/:id",
  verifyToken,
  adminMiddleware,
  uploadMiddleware.single("receipt"),
  MemberController.updateMember
);
router.delete(
  "/:id",
  verifyToken,
  adminMiddleware,
  MemberController.deleteMember
);
router.get("/:id/qrcode", verifyToken, MemberController.getMemberQRCode);
router.get(
  "/filter/search",
  verifyToken,
  adminMiddleware,
  MemberController.filterMembers
);

module.exports = router;
