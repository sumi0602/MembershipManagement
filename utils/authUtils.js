const crypto = require("crypto");

module.exports = {
  generateRandomToken: () => {
    return crypto.randomBytes(20).toString("hex");
  },
};
