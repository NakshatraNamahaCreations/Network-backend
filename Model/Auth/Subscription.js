const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId:       { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    planName:     { type: String },
    planPrice:    { type: Number },
    durationDays: { type: Number },
    startDate:    { type: Date, default: Date.now },
    endDate:      { type: Date, required: true },
    status:       { type: String, enum: ["active", "expired"], default: "active" },
    payment: {
      gateway:   { type: String, default: "razorpay" },
      orderId:   String,
      paymentId: String,
      signature: String,
      amount:    Number,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
