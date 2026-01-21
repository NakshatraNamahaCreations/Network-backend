const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
  },
  profileStatus: {
    type: Boolean,
    // default: false,
  },
  panNumber: {
    type: String,
    default: null,
  },
  panImage: {
    type: String,
    default: null,
  },
  aadhaarNumber: {
    type: String,
    default: null,
  },
  aadhaarFront: {
    type: String,
    default: null,
  },
  aadhaarBack: {
    type: String,
    default: null,
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

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
