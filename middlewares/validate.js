// middlewares/validate.js
const logger = require("../config/logger");

module.exports = (schema) => (req, res, next) => {
  logger.debug(`Validation input: ${JSON.stringify(req.body)}`);
  if (!schema || typeof schema.validate !== "function") {
    console.error(
      "Invalid Joi schema passed to validate middleware:",
      schema
    );
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error in validation middleware",
      });
  }
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    logger.warn(`Validation failed: ${JSON.stringify(error.details)}`);
    const errors = error.details.map((err) => ({
      field: err.path.join("."),
      message: err.message.replace(/"/g, ""),
    }));

    return res.status(400).json({
      success: false,
      errors,
    });
  }

  req.body = value;
  next();
};
