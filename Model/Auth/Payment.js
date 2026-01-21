const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    start: { type: Date, required: true },
    end: { type: Date, required: true },

    mode: {
      type: String,
      enum: ["chat", "call"],
      required: true,
    },

    amount: { type: Number, required: true, default: 500 },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    date: {
      type: String,
    },
    payment: {
      gateway: { type: String },
      orderId: { type: String },
      paymentId: { type: String },
      signature: { type: String },
      raw: { type: Object },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
