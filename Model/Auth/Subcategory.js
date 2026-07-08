const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

subcategorySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Subcategory", subcategorySchema);
