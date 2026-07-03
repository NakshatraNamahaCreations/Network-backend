const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  { versionKey: false, timestamps: true }
);

// one review per buyer per profile
reviewSchema.index({ reviewerId: 1, profileId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
