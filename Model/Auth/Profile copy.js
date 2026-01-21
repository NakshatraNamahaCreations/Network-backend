const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
  },
  { _id: false }
);

const datingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

      // index: true,
    },

    basics: {
      fullName: { type: String, trim: true },
      mobile: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      age: { type: Number, min: 18, max: 100 },
      gender: {
        type: String,
        enum: ["Woman", "Man", "Non-binary", "Other"],
      },
      // orientation: {
      //   type: String,
      //   enum: [
      //     "Straight",
      //     "Gay",
      //     "Lesbian",
      //     "Bisexual",
      //     "Asexual",
      //     "Pansexual",
      //     "Queer",
      //     "Prefer not to say",
      //   ],
      // },
      dob: { type: String, default: "" },
      heightCm: { type: String, default: "" },
      city: { type: String, trim: true },
      state: { type: String, default: "", trim: true },
      country: { type: String, trim: true, default: "India" },
      showAge: { type: Boolean, default: true },
    },

    photos: {
      type: [photoSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 6,
        message: "Maximum 6 photos allowed",
      },
    },

    about: {
      bio: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
      company: { type: String, default: "" },
      education: { type: String, default: "" },
      interests: { type: [String], default: [] },
      lifestyle: {
        drinking: { type: String, default: "" },
        smoking: { type: String, default: "" },
        fitness: { type: String, default: "" },
      },
      instagram: { type: String, default: "" },
      xaccount: { type: String, default: "" },
      category: { type: String, default: "" },
      subcategory: { type: String, defauly: "" },
    },

    preferences: {
      distanceKm: { type: String, default: "25" },
      ageMin: { type: String, default: "21" },
      ageMax: { type: String, default: "34" },

      sellMyTime: { type: String, default: "" },
      friendlyMeetUp: { type: String, default: "" },
    },

    aadharimage: {
      type: String,
    },
    panimage: {
      type: String,
    },
    aadharNumber: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    verificationStatus: {
      type: String,
      // enum: ["none", "pending", "approved", "rejected"],
      default: "pending",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

datingProfileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Profile", datingProfileSchema);
