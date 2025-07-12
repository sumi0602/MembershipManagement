const Member = require("../models/Member");
const Payment = require("../models/EventPayment");
const { sendEmail } = require("../services/emailService");

module.exports = {
  // Process manual renewal
  renewMembership: async (req, res) => {
    try {
      const { memberId, paymentMethod, durationMonths } = req.body;

      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Calculate new expiry and amount
      const renewalAmount = calculateRenewalFee(durationMonths);
      const newExpiry = new Date(member.membershipExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

      // Create payment record
      const payment = new Payment({
        member: memberId,
        amount: renewalAmount,
        paymentMethod,
        purpose: "renewal",
        status: paymentMethod === "cash" ? "pending" : "completed",
      });

      // Update member record
      member.membershipExpiry = newExpiry;
      member.membershipStatus = "active";
      member.renewalHistory.push({
        date: new Date(),
        amount: renewalAmount,
        paymentMethod,
      });

      await Promise.all([payment.save(), member.save()]);

      // Send confirmation
      await sendRenewalConfirmation(member, payment, durationMonths);

      res.json({
        success: true,
        member,
        payment,
        newExpiry: member.membershipExpiry,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Process automatic renewals (cron job)
  processAutoRenewals: async () => {
    const expiringSoon = await Member.find({
      autoRenew: true,
      membershipExpiry: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    for (const member of expiringSoon) {
      try {
        // Process payment via saved payment method
        const paymentResult = await processPayment(
          member.defaultPaymentMethod,
          member.id
        );

        // Update member record
        const newExpiry = new Date(member.membershipExpiry);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);

        member.membershipExpiry = newExpiry;
        member.renewalHistory.push({
          date: new Date(),
          amount: paymentResult.amount,
          paymentMethod: member.defaultPaymentMethod,
        });

        await member.save();
        await sendRenewalConfirmation(member, paymentResult, 12);
      } catch (error) {
        console.error(`Auto-renew failed for member ${member.id}:`, error);
        await sendRenewalFailureNotification(member, error);
      }
    }
  },
};

function calculateRenewalFee(months) {
  const baseFee = 100; // $100/year
  return Math.round(baseFee * (months / 12));
}
