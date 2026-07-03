const mongoose = require("mongoose");
const Profile = require("../../Model/Auth/Profile");
const Block = require("../../Model/Auth/Block");
const { CATEGORIES } = require("../../utills/categories");

const toWebPath = (f) => `/${String(f.path).replace(/\\/g, "/")}`;

// ── Create Profile ───────────────────────────────────────────────────────────
exports.createProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId))
      return res.status(400).json({ success: false, error: "Valid userId required" });

    const exists = await Profile.findOne({ userId });
    if (exists) return res.status(400).json({ success: false, error: "Profile already exists" });

    const {
      displayName, bio, gender, dateOfBirth, height,
      email, mobile, city, state, country, languages,
      hourlyRate, category, termsAccepted,
      socialInstagram, socialLinkedin, socialWebsite,
    } = req.body;

    if (!displayName) return res.status(400).json({ success: false, error: "Display name required" });

    const profilePhotoFile = req.files?.profilePhoto?.[0];
    const photoFiles = req.files?.photos || [];
    const videoFile = req.files?.video?.[0];

    if (!profilePhotoFile)
      return res.status(400).json({ success: false, error: "Profile photo required" });

    const expertiseRaw = req.body.expertise;
    let expertise = {};
    try { expertise = expertiseRaw ? JSON.parse(expertiseRaw) : {}; } catch {}

    const interestsRaw = req.body.interests;
    let interests = [];
    try { interests = interestsRaw ? JSON.parse(interestsRaw) : []; } catch {}

    const languagesParsed = (() => {
      try { return JSON.parse(req.body.languages); } catch { return typeof languages === "string" ? [languages] : (languages || ["English"]); }
    })();

    const profile = await Profile.create({
      userId,
      displayName: displayName.trim(),
      bio: bio || "",
      gender: gender || "Prefer not to say",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      height: height ? Number(height) : null,
      email: email || "",
      mobile: mobile || "",
      city: city || "",
      state: state || "",
      country: country || "India",
      languages: languagesParsed,
      hourlyRate: hourlyRate ? Number(hourlyRate) : 0,
      category: category && mongoose.isValidObjectId(category) ? category : null,
      interests,
      expertise,
      experience: { years: req.body.experienceYears ? Number(req.body.experienceYears) : 0 },
      profilePhoto: toWebPath(profilePhotoFile),
      photos: photoFiles.slice(0, 8).map(f => ({ url: toWebPath(f) })),
      videoUrl: videoFile ? toWebPath(videoFile) : "",
      termsAccepted: termsAccepted === "true" || termsAccepted === true,
      approvalStatus: "pending",
      social: {
        instagram: socialInstagram || "",
        linkedin:  socialLinkedin  || "",
        website:   socialWebsite   || "",
      },
    });

    await profile.populate("category", "name icon");
    return res.status(201).json({ success: true, message: "Profile submitted for approval", profile });
  } catch (err) {
    console.error("createProfile error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId required" });

    const existing = await Profile.findOne({ userId });
    if (!existing) return res.status(404).json({ success: false, error: "Profile not found" });

    const $set = {};
    const fields = ["displayName","bio","gender","email","mobile","city","state","country","hourlyRate","category"];
    for (const f of fields) {
      if (req.body[f] != null) $set[f] = req.body[f];
    }
    if (req.body.socialInstagram != null) $set["social.instagram"] = req.body.socialInstagram;
    if (req.body.socialLinkedin  != null) $set["social.linkedin"]  = req.body.socialLinkedin;
    if (req.body.socialWebsite   != null) $set["social.website"]   = req.body.socialWebsite;
    if (req.body.dateOfBirth) $set.dateOfBirth = new Date(req.body.dateOfBirth);
    if (req.body.height) $set.height = Number(req.body.height);
    if (req.body.interests) {
      try { $set.interests = JSON.parse(req.body.interests); } catch {}
    }
    if (req.body.languages) {
      try { $set.languages = JSON.parse(req.body.languages); } catch {}
    }
    if (req.body.expertise) {
      try { $set.expertise = JSON.parse(req.body.expertise); } catch {}
    }

    const profilePhotoFile = req.files?.profilePhoto?.[0];
    const photoFiles = req.files?.photos || [];
    const videoFile = req.files?.video?.[0];

    if (profilePhotoFile) $set.profilePhoto = toWebPath(profilePhotoFile);
    if (videoFile) $set.videoUrl = toWebPath(videoFile);

    if (photoFiles.length > 0) {
      const keepPhotos = (() => {
        try { return JSON.parse(req.body.keepPhotos || "[]"); } catch { return []; }
      })();
      const kept = keepPhotos.map(u => ({ url: u }));
      const newPhotos = photoFiles.map(f => ({ url: toWebPath(f) }));
      $set.photos = [...kept, ...newPhotos].slice(0, 8);
    }

    const profile = await Profile.findOneAndUpdate({ userId }, { $set }, { new: true }).populate("category", "name icon");
    return res.status(200).json({ success: true, message: "Profile updated", profile });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Discovery Feed (only active, exclude blocked) ────────────────────────────
exports.discoverProfiles = async (req, res) => {
  try {
    const {
      userId, viewerId, gender, category, minAge, maxAge,
      minPrice, maxPrice, minRating, city,
      sortBy, page = 1, limit = 20,
    } = req.query;

    // Determine if viewer is subscribed (use viewerId if provided, else userId)
    const checkId = viewerId || userId;
    let viewerSubscribed = false;
    if (checkId && mongoose.isValidObjectId(checkId)) {
      const Subscription = require("../../Model/Auth/Subscription");
      await Subscription.updateMany(
        { userId: checkId, status: "active", endDate: { $lt: new Date() } },
        { status: "expired" }
      );
      const sub = await Subscription.findOne({ userId: checkId, status: "active" });
      viewerSubscribed = !!sub;
    }

    // Get blocked user IDs to exclude
    let excludeUserIds = [];
    if (userId && mongoose.isValidObjectId(userId)) {
      const blocked = await Block.find({
        $or: [{ blockerId: userId }, { blockedUserId: userId }],
      }).lean();
      excludeUserIds = blocked.map(b =>
        String(b.blockerId) === String(userId) ? b.blockedUserId : b.blockerId
      );
    }

    const match = {
      approvalStatus: "active",
      profilestatus: true,
      // Non-subscribers only see profiles admin has enabled for general access
      ...(!viewerSubscribed && { generalAccess: true }),
      ...(excludeUserIds.length && { userId: { $nin: excludeUserIds } }),
      ...(userId && mongoose.isValidObjectId(userId) && { userId: { $ne: new mongoose.Types.ObjectId(userId), ...(excludeUserIds.length && { $nin: excludeUserIds }) } }),
    };

    if (gender) match.gender = gender;
    if (city) match.city = new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (category && mongoose.isValidObjectId(category)) match.category = new mongoose.Types.ObjectId(category);
    if (minPrice != null || maxPrice != null) {
      match.hourlyRate = {};
      if (minPrice != null) match.hourlyRate.$gte = Number(minPrice);
      if (maxPrice != null) match.hourlyRate.$lte = Number(maxPrice);
    }
    if (minRating != null) match.averageRating = { $gte: Number(minRating) };
    if (minAge != null || maxAge != null) {
      const now = new Date();
      match.dateOfBirth = {};
      if (maxAge != null) { const d = new Date(now); d.setFullYear(d.getFullYear() - Number(maxAge)); match.dateOfBirth.$gte = d; }
      if (minAge != null) { const d = new Date(now); d.setFullYear(d.getFullYear() - Number(minAge)); match.dateOfBirth.$lte = d; }
    }

    const sortMap = {
      price_asc: { hourlyRate: 1 }, price_desc: { hourlyRate: -1 },
      rating: { averageRating: -1 }, views: { viewCount: -1 }, newest: { createdAt: -1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [profiles, total] = await Promise.all([
      Profile.find(match).sort(sort).skip(skip).limit(Number(limit))
        .populate("category", "name icon").lean(),
      Profile.countDocuments(match),
    ]);

    return res.status(200).json({
      success: true, total,
      page: Number(page), pages: Math.ceil(total / Number(limit)),
      profiles,
    });
  } catch (err) {
    console.error("discoverProfiles error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Get single profile ───────────────────────────────────────────────────────
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewerId } = req.query;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const profile = await Profile.findById(id).populate("category", "name icon");
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    await Profile.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // Check if the viewer has an active subscription
    let isSubscribed = false;
    if (viewerId && mongoose.isValidObjectId(viewerId)) {
      const Subscription = require("../../Model/Auth/Subscription");
      await Subscription.updateMany(
        { userId: viewerId, status: "active", endDate: { $lt: new Date() } },
        { status: "expired" }
      );
      const sub = await Subscription.findOne({ userId: viewerId, status: "active" });
      isSubscribed = !!sub;
    }

    // Strip contact fields for non-subscribers
    const data = profile.toObject();
    if (!isSubscribed) {
      delete data.mobile;
      delete data.email;
    }

    return res.status(200).json({ profile: data, isSubscribed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId))
      return res.status(400).json({ error: "Invalid userId" });
    const profile = await Profile.findOne({ userId }).populate("category", "name icon");
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    if (!userId) return res.status(401).json({ error: "userId required" });
    const profile = await Profile.findOne({ userId }).populate("category", "name icon");
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const profile = await Profile.findOneAndDelete({ _id: id, userId });
    if (!profile) return res.status(404).json({ error: "Not found or unauthorized" });
    return res.status(200).json({ success: true, message: "Profile deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.toggleProfileStatus = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    profile.profilestatus = !profile.profilestatus;
    await profile.save();
    return res.status(200).json({ success: true, profilestatus: profile.profilestatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.toggleGeneralAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    profile.generalAccess = !profile.generalAccess;
    await profile.save();
    return res.status(200).json({ success: true, generalAccess: profile.generalAccess });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateBankDetails = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId, accountHolderName, accountNumber, confirmAccountNumber, ifscCode, bankName, branchName, accountType } = req.body;
    if (!accountHolderName || !accountNumber || !confirmAccountNumber || !ifscCode || !bankName)
      return res.status(400).json({ error: "All required bank fields must be filled" });
    if (accountNumber !== confirmAccountNumber)
      return res.status(400).json({ error: "Account numbers do not match" });
    const profile = await Profile.findOneAndUpdate(
      { _id: profileId, userId },
      { $set: { bankDetails: { accountHolderName, accountNumber, confirmAccountNumber, ifscCode, bankName, branchName, accountType } } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: "Profile not found or unauthorized" });
    return res.status(200).json({ success: true, message: "Bank details updated", bankDetails: profile.bankDetails });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateKycDetails = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId, panNumber, aadhaarNumber } = req.body;
    const panImageUrl = req.files?.panImage?.[0]?.path || "";
    const aadhaarFrontUrl = req.files?.aadhaarFront?.[0]?.path || "";
    const aadhaarBackUrl = req.files?.aadhaarBack?.[0]?.path || "";
    const profile = await Profile.findOneAndUpdate(
      { _id: profileId, userId },
      { $set: { "kyc.panNumber": panNumber, "kyc.panImageUrl": panImageUrl, "kyc.aadhaarNumber": aadhaarNumber, "kyc.aadhaarFrontUrl": aadhaarFrontUrl, "kyc.aadhaarBackUrl": aadhaarBackUrl } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: "Not found or unauthorized" });
    return res.status(200).json({ success: true, message: "KYC updated", kyc: profile.kyc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCategories = async (_req, res) => {
  return res.status(200).json({ success: true, categories: CATEGORIES });
};

// Aliases
exports.createDatingProfile = exports.createProfile;
exports.updateDatingProfile = exports.updateProfile;
exports.getDatingProfileById = exports.getProfileById;
exports.getAllProfile = async (_req, res) => {
  try {
    const profiles = await Profile.find({ approvalStatus: "active" }).sort({ createdAt: -1 }).populate("category", "name icon");
    return res.status(200).json(profiles);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.getMyDatingProfile = exports.getMyProfile;
exports.deleteDatingProfile = exports.deleteProfile;
