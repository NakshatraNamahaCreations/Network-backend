const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  { url: { type: String, required: true } },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String },
    confirmAccountNumber: { type: String },
    ifscCode: { type: String, uppercase: true, trim: true },
    bankName: { type: String },
    branchName: { type: String, default: "" },
    accountType: {
      type: String,
      enum: ["Savings", "Current", "Other"],
      default: "Savings",
    },
  },
  { _id: false }
);

const kycSchema = new mongoose.Schema(
  {
    panNumber: { type: String, trim: true, uppercase: true },
    panImageUrl: { type: String, default: "" },
    aadhaarNumber: { type: String, trim: true },
    aadhaarFrontUrl: { type: String, default: "" },
    aadhaarBackUrl: { type: String, default: "" },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },

    // ── Identity ──────────────────────────────────────────────
    displayName: { type: String, trim: true, required: true },
    bio: { type: String, default: "", maxlength: 500 },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },
    dateOfBirth: { type: Date, default: null },
    height: { type: Number, default: null },          // cm
    interests: { type: [String], default: [] },

    // ── Category ──────────────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    expertise: {
      areas: { type: [String], default: [] },
      skills: { type: [String], default: [] },
    },
    experience: { years: { type: Number, min: 0, default: 0 } },

    // ── Contact / Business ────────────────────────────────────
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, default: "India" },
    languages: { type: [String], default: ["English"] },

    // ── Pricing ───────────────────────────────────────────────
    hourlyRate: { type: Number, min: 0, default: 0 },

    // ── Media (8 photos + 1 video) ────────────────────────────
    profilePhoto: { type: String, default: "" },     // main photo
    photos: { type: [photoSchema], default: [], validate: { validator: a => a.length <= 8, message: "Max 8 photos" } },
    videoUrl: { type: String, default: "" },

    // ── Social ────────────────────────────────────────────────
    social: {
      website: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    // ── KYC & Bank ───────────────────────────────────────────
    kyc: { type: kycSchema, default: {} },
    bankDetails: { type: bankSchema, default: {} },

    // ── Admin approval ────────────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },

    // ── Seller on/off toggle ──────────────────────────────────
    profilestatus: { type: Boolean, default: true },

    // ── Stats ─────────────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    termsAccepted: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
