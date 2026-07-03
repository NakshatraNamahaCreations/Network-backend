const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["like", "booking", "payment_success", "profile_approved", "profile_rejected", "message", "new_review"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: String, default: null },
    senderName: { type: String, default: "" },
    senderPhoto: { type: String, default: "" },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
