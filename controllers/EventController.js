const Event = require("../models/Event");
const Member = require("../models/Member");
const EventPayment = require("../models/EventPayment");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("attendees.member");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("attendees.member")
      .populate("organizer");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.recordAttendance = async (req, res) => {
  try {
    const { memberId, attended } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendeeIndex = event.attendees.findIndex(
      (a) => a.member.toString() === memberId
    );

    if (attendeeIndex === -1) {
      return res
        .status(404)
        .json({ message: "Member not registered for this event" });
    }

    event.attendees[attendeeIndex].attended = attended;
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.recordEventPayment = async (req, res) => {
  try {
    const { memberId, amount, paymentMethod } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendeeIndex = event.attendees.findIndex(
      (a) => a.member.toString() === memberId
    );

    if (attendeeIndex === -1) {
      return res
        .status(404)
        .json({ message: "Member not registered for this event" });
    }

    // Create payment record
    const payment = new EventPayment({
      member: memberId,
      amount,
      paymentMethod,
      description: `Payment for event: ${event.title}`,
      event: event._id,
    });

    await payment.save();

    // Update event attendee payment status
    event.attendees[attendeeIndex].paymentStatus = "Paid";
    await event.save();

    // Add payment to member's payment history
    await Member.findByIdAndUpdate(memberId, {
      $push: { payments: payment._id },
    });

    res.json({ payment, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
