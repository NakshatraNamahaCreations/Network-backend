const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

module.exports = mongoose.model("Block", blockSchema);
