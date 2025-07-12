const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  service: config.email.service,
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});
// services/emailService.js
async function sendPaymentConfirmationEmail(member, payment) {
  const subject = `Payment Confirmation #${payment.invoiceNumber}`;
  const html = `
    <h2>Payment Receipt</h2>
    <p>Hello ${member.firstName},</p>
    <p>Thank you for your payment of ₹${payment.amount}.</p>
    
    <h3>Payment Details</h3>
    <ul>
      <li>Invoice Number: ${payment.invoiceNumber}</li>
      <li>Date: ${payment.createdAt.toLocaleDateString()}</li>
      <li>Payment Method: ${payment.paymentMethod}</li>
      <li>Status: ${payment.status}</li>
    </ul>
    
    <p>Your membership is now active until ${calculateExpiryDate()}.</p>
  `;

  await sendEmail({
    to: member.email,
    subject,
    html,
  });
}
module.exports = {
  sendEmail: async ({ to, subject, html }) => {
    try {
      await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      throw error;
    }
  },
};
