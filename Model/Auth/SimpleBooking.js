const mongoose = require("mongoose");

const simpleBookingSchema = new mongoose.Schema({
  buyerId:   { type: mongoose.Schema.Types.ObjectId, ref: "user",    required: true, index: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
  date:      { type: String, required: true },      // "2024-01-15"
  timeSlot:  { type: String, required: true },      // "10:00 AM – 11:00 AM"
  mode:      { type: String, enum: ["Online", "In-Person"], default: "Online" },
  notes:     { type: String, default: "", maxlength: 500 },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending",
    index: true,
  },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("SimpleBooking", simpleBookingSchema);
