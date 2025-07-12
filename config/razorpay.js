const Razorpay = require("razorpay");
const config = require("./config");

module.exports = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});
