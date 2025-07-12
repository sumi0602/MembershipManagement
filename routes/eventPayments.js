const express = require('express');
const router = express.Router();
const EventPaymentController = require('../controllers/EventPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Member routes
router.post('/',
   EventPaymentController.processEventPayment
);

// Admin routes
router.get('/event/:eventId',
  EventPaymentController.getEventPayments
);


module.exports = router;