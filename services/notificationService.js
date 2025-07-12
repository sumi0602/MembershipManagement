const { sendEmail } = require("./emailService");
const Member = require("../models/Member");

module.exports = {
  // Send renewal reminders
  sendRenewalReminders: async () => {
    const members = await Member.find({
      membershipExpiry: {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days before expiry
        $gte: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // Only once
      },
    });

    for (const member of members) {
      await sendEmail({
        to: member.email,
        subject: "Membership Renewal Reminder",
        html: `Your membership expires on ${member.membershipExpiry.toDateString()}. Renew now!`,
      });
    }
  },

  // Payment confirmations
  sendPaymentConfirmation: async (member, payment) => {
    await sendEmail({
      to: member.email,
      subject: "Payment Received",
      html: `Thank you for your payment of $${payment.amount}.`,
    });
  },

  // Expiry notifications
  sendExpiryNotification: async () => {
    const expiredMembers = await Member.find({
      membershipExpiry: { $lte: new Date() },
      membershipStatus: { $ne: "expired" },
    });

    for (const member of expiredMembers) {
      member.membershipStatus = "expired";
      await Promise.all([
        member.save(),
        sendEmail({
          to: member.email,
          subject: "Membership Expired",
          html: "Your membership has expired. Please renew to continue benefits.",
        }),
      ]);
    }
  },
};
