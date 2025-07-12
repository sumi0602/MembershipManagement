const Event = require("../models/Event");
const Member = require("../models/Member");
const EventPayment = require("../models/EventPayment");
const razorpay = require("../config/razorpay");

module.exports = {
  // Process event registration payment
  processEventPayment: async (req, res) => {
    try {
      console.log("📥 Received payment request:", req.body);
      const { eventId, memberId, ticketType, paymentMethod } = req.body;

      if (!eventId || !memberId || !ticketType || !paymentMethod) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
      }

      const event = await Event.findById(eventId);
      if (!event) {
        console.log("❌ Event not found");
        return res.status(404).json({ error: "Event not found" });
      }

      const ticket = event.ticketTypes.find((t) => t.name === ticketType);
      if (!ticket) {
        console.log("❌ Invalid ticket type");
        return res.status(400).json({ error: "Invalid ticket type" });
      }

      console.log("✅ Found ticket:", ticket);

      // Create new EventPayment
      const payment = new EventPayment({
        event: eventId,
        member: memberId,
        amount: ticket.price,
        paymentMethod,
        ticketType,
        status: paymentMethod === "cash" ? "pending" : "paid",
      });

      const shortReceiptId = `evt_${Date.now()}`;

      // Razorpay integration
      if (paymentMethod === "razorpay") {
        console.log("💳 Creating Razorpay order...");
        const razorpayOrder = await razorpay.orders.create({
          amount: ticket.price * 100, // Razorpay accepts paise
          currency: "INR",
          receipt: shortReceiptId,
        });
        payment.transactionId = razorpayOrder.id;
        console.log("✅ Razorpay order created:", razorpayOrder.id);
      }

      await payment.save();
      console.log("💾 Payment saved to DB:", payment._id);

      // Update Event
      await Event.findByIdAndUpdate(eventId, {
        $inc: { totalRevenue: ticket.price },
        $push: { payments: payment._id },
      });

      // Update Member: event registration + receipt record
      await Member.findByIdAndUpdate(memberId, {
        $addToSet: { eventRegistrations: eventId },
        $push: {
          receiptRecords: {
            amount: ticket.price,
            paymentMethod,
            transactionId: payment.transactionId || null,
            recordedBy: req.user?._id || "687131a4120a85c160e509bc", // Fallback or use JWT
          },
        },
      });

      console.log("✅ Event and Member updated with payment and receipt");

      res.status(201).json({
        success: true,
        payment,
        razorpayOrderId:
          paymentMethod === "razorpay" ? payment.transactionId : null,
      });
    } catch (error) {
      console.error("🔥 Error in processEventPayment:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  },

  // Get all payments for an event (Admin)
  getEventPayments: async (req, res) => {
    try {
      const payments = await EventPayment.find({ event: req.params.eventId })
        .populate("member", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({ success: true, payments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const payment = await EventPayment.findByIdAndUpdate(
        req.params.paymentId,
        { status },
        { new: true }
      );

      if (!payment) return res.status(404).json({ error: "Payment not found" });

      res.json({ success: true, payment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
