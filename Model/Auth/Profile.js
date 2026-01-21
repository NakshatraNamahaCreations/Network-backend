const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
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
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },

    media: {
      logoUrl: { type: String, default: "" },
      profilePhotoUrl: { type: String, required: true },
      portfolio: { type: [photoSchema], default: [] },
      gallery: { type: [photoSchema], default: [] },
    },

    business: {
      displayName: { type: String, trim: true, required: true },
      languages: {
        type: [String],
        default: ["English"],
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length >= 1,
          message: "Select at least one language",
        },
      },
      email: { type: String, trim: true, lowercase: true, required: true },
      mobile: { type: String, trim: true, required: true },
    },

    location: {
      city: { type: String, trim: true, required: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
      address: { type: String, default: "" },
      geo: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: undefined },
      },
    },

    expertise: {
      categories: { type: [String], default: [] },
      // subcategories: { type: [String], default: [] },
      areas: {
        type: [String],
        default: [],
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length >= 1,
          message: "Add at least one area of expertise",
        },
      },
      skills: { type: [String], default: [] },
      industries: { type: [String], default: [] },
      tags: { type: [String], default: [] },
    },

    experience: {
      years: { type: Number, min: 0, max: 60, required: true },
      clients: {
        total: { type: Number, min: 0, default: 0 },
        notable: { type: [clientSchema], default: [] },
      },
    },

    descriptions: {
      short: { type: String, default: "" },
      detailed: { type: String, default: "" },
    },

    kyc: { type: kycSchema, default: {} },

    bankDetails: { type: bankSchema, default: {} },

    social: {
      website: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    profilestatus: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
