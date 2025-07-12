const Member = require("../models/Member");
const Event = require("../models/Event");

exports.getMemberAttendanceReport = async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId)
      .populate("attendances.eventId", "title startDate")
      .select("firstName lastName attendances");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({
      member: `${member.firstName} ${member.lastName}`,
      attendance: member.attendances,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEventAttendanceReport = async (req, res) => {
  try {
    const members = await Member.find({ "attendances.eventId": req.params.eventId })
      .select("firstName lastName attendances")
      .lean();

    const attendees = members.map((member) => {
      const attendance = member.attendances.find(
        (a) => a.eventId.toString() === req.params.eventId
      );
      return {
        name: `${member.firstName} ${member.lastName}`,
        status: attendance.status,
        date: attendance.date,
      };
    });

    res.json({
      eventId: req.params.eventId,
      attendees,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const members = await Member.find().select("firstName lastName attendances").lean();

    const summary = members.map((member) => {
      const total = member.attendances.length;
      const present = member.attendances.filter((a) => a.status === "present").length;
      const absent = member.attendances.filter((a) => a.status === "absent").length;

      return {
        name: `${member.firstName} ${member.lastName}`,
        totalEvents: total,
        present,
        absent,
        attendanceRate: total > 0 ? `${((present / total) * 100).toFixed(1)}%` : "N/A",
      };
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
