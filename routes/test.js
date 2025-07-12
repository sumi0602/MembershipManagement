// routes/test.js - Temporary route for validation testing
const express = require('express');
const router = express.Router();
const { registerValidation } = require('../validations/authValidation');

router.post('/test-validation', (req, res) => {
  const { error, value } = registerValidation.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    return res.status(400).json({
      isValid: false,
      errors: error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.type
      }))
    });
  }

  res.json({
    isValid: true,
    validatedData: value
  });
});

module.exports = router;