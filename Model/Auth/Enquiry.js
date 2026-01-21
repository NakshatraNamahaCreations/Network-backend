const mongoose = require("mongoose");
const { Schema } = mongoose;

const EnquirySchema = new Schema({
  userId: {
    type: String,
  },
  slotTime: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Enquiry", EnquirySchema);
