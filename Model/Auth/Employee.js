const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    mobileNumber: { type: String, required: true, trim: true },
    referralCode: { type: String, unique: true, trim: true },
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code;
    let exists = true;
    while (exists) {
      code = "EMP-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      exists = await mongoose.model("Employee").exists({ referralCode: code });
    }
    this.referralCode = code;
  }
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);
