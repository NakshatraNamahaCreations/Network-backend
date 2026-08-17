const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title:      { type: String, default: "" },
    subtitle:   { type: String, default: "" },
    imageUrl:   { type: String, required: true },
    link:       { type: String, default: "" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    isActive:   { type: Boolean, default: true },
    sortOrder:  { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
