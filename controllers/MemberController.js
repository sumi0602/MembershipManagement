const Member = require("../models/Member");
const fs = require("fs");
const path = require("path");

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().populate("payments");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const memberData = req.body;

    if (req.file) {
      memberData.receipts = [req.file.path];
    }

    const member = new Member(memberData);
    await member.save();

    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate("payments");
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    Object.keys(req.body).forEach((key) => {
      member[key] = req.body[key];
    });

    if (req.file) {
      if (!member.receipts) member.receipts = [];
      member.receipts.push(req.file.path);
    }

    await member.save();
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Member deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMemberQRCode = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member || !member.qrCode) {
      return res.status(404).json({ message: "QR Code not found" });
    }

    const base64Data = member.qrCode.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": imgBuffer.length,
    });
    res.end(imgBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.filterMembers = async (req, res) => {
  try {
    const { zone, status, membershipType } = req.query;
    const filter = {};

    if (zone) filter.zone = zone;
    if (status) filter.status = status;
    if (membershipType) filter.membershipType = membershipType;

    const members = await Member.find(filter).populate("payments");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.renewMembership = async (req, res) => {
  try {
    const { memberId, durationInMonths = 12 } = req.body;

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const today = new Date();

    // Extend expiryDate (from today or from existing expiryDate if in future)
    const currentExpiry = member.expiryDate && member.expiryDate > today
      ? new Date(member.expiryDate)
      : today;

    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + durationInMonths));
    member.expiryDate = newExpiry;
    member.status = "Active";

    // Optional: log renewal history
    if (!member.renewalHistory) member.renewalHistory = [];
    member.renewalHistory.push({
      date: new Date(),
      renewedBy: req.user?._id || null,
      notes: req.body.notes || ""
    });

    await member.save();

    res.json({
      message: "Membership renewed successfully",
      newExpiryDate: member.expiryDate
    });

  } catch (error) {
    console.error("Error renewing membership:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

