const Member = require('../models/Member');
const Event = require('../models/Event');

exports.recordAttendance = async (req, res) => {
  try {
    const { memberId, eventId, status } = req.body;

    if (!memberId || !eventId) {
      return res.status(400).json({ message: "memberId and eventId are required" });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const alreadyRecorded = member.attendances.find(
      (att) => att.eventId.toString() === eventId
    );

    if (alreadyRecorded) {
      return res.status(400).json({ message: "Attendance already recorded for this event" });
    }

    member.attendances.push({
      eventId,
      status: status || "present"
    });

    await member.save();

    res.status(200).json({
      message: "Attendance recorded successfully",
      attendance: member.attendances
    });
  } catch (error) {
    console.error("Error recording attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
