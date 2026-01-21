const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phoneNumber: { type: String },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true, index: { expires: 0 } },
});

otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("Otp", otpSchema);
