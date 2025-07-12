const mongoose = require("mongoose");

const eventPaymentSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cash", "bank_transfer"],
      required: true,
    },
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    ticketType: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    receiptUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventPayment", eventPaymentSchema);
