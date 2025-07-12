const mongoose = require("mongoose");
// models/Event.js
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  location: String,
  maxAttendees: Number,
  fee: Number,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
  attendees: [
    {
      member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
      attended: { type: Boolean, default: false },
      paymentStatus: {
        type: String,
        enum: ["Paid", "Unpaid", "Free"],
        default: "Unpaid",
      },
    },
  ],
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
    default: "Upcoming",
  },
  ticketTypes: [
    {
      name: String,
      price: Number,
      quantityAvailable: Number,
    },
  ],
  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventPayment",
    },
  ],
  totalRevenue: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Event", eventSchema);
