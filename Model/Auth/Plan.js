const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, unique: true },
    price:        { type: Number, required: true, min: 0 },
    description:  { type: String, default: "" },
    durationDays: { type: Number, default: 30, min: 1 },
    isActive:     { type: Boolean, default: true },
    sortOrder:    { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
