const Joi = require("joi");

module.exports = {
  processPayment: Joi.object({
    memberId: Joi.string().hex().length(24).required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid("credit_card", "bank_transfer", "paypal", "cash", "other")
      .required(),
    description: Joi.string().max(255),
    eventId: Joi.string().hex().length(24), // Optional for event payments
  }),
};
