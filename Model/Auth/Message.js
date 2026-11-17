const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "SimpleBooking", required: true, index: true },
  senderId:  { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  text:      { type: String, required: true, maxlength: 2000 },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
