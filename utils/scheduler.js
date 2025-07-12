// utils/scheduler.js
const cron = require("node-cron");
const NotificationService = require("../services/notificationService");
const RenewalController = require("../controllers/RenewalController");

// Daily at 9 AM
cron.schedule("0 9 * * *", () => {
  NotificationService.sendRenewalReminders();
  NotificationService.sendExpiryNotification();
});

// Monthly on 1st at midnight
cron.schedule("0 0 1 * *", () => {
  RenewalController.processAutoRenewals();
});
