const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    link:  { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QRCode", qrCodeSchema);
