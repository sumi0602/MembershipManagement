const Joi = require("joi");

module.exports = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid("admin", "member", "staff"),
    memberRef: Joi.string().hex().length(24),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  update: Joi.object({
    email: Joi.string().email(),
    role: Joi.string().valid("admin", "member", "staff"),
    memberRef: Joi.string().hex().length(24),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),
};
