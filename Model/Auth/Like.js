const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    toProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

likeSchema.index({ fromUserId: 1, toProfileId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
