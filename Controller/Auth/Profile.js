const path = require("path");
const mongoose = require("mongoose");
const Profile = require("../../Model/Auth/Profile");

const emailOk = (s) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
const mobileOk = (s) => /^\+?\d{10,15}$/.test(String(s || "").trim());

const parseBodyMaybeJSON = (val) => {
  if (!val) return {};
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val;
};
const parseMaybeJSON = (val) => {
  if (val == null) return undefined;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  return val;
};
const listFromMaybe = (v) => {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const a = JSON.parse(v);
      if (Array.isArray(a)) return a;
    } catch {}
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
};

const toWebPath = (fileObj) => `/${String(fileObj.path).replace(/\\/g, "/")}`;
const toPhoto = (fileObj) => ({ url: toWebPath(fileObj) });

const normalizeKeepPhoto = (val) => {
  const s = String(val || "").trim();
  if (!s) return null;
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/")
  ) {
    return { url: s };
  }
  return { url: `/${s}` };
};

const requireUserId = (req) => {
  const uid = req.user?.userId || req.body?.userId;
  if (!uid) return null;
  return mongoose.isValidObjectId(uid) ? new mongoose.Types.ObjectId(uid) : uid;
};

exports.createProfile = async (req, res) => {
  try {
    const userId = requireUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const business = parseBodyMaybeJSON(req.body.business);
    const location = parseBodyMaybeJSON(req.body.location);
    const expertise = parseBodyMaybeJSON(req.body.expertise);
    const experience = parseBodyMaybeJSON(req.body.experience);
    const descriptions = parseBodyMaybeJSON(req.body.descriptions);
    const social = parseBodyMaybeJSON(req.body.social);

    if (business.languages == null)
      business.languages =
        listFromMaybe(req.body.languages) ?? business.languages;
    if (expertise.areas == null)
      expertise.areas = listFromMaybe(req.body.areas) ?? expertise.areas;

    if (!business?.displayName)
      return res.status(400).json({ error: "Name is required" });
    if (!business?.email || !emailOk(business.email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!business?.mobile || !mobileOk(business.mobile)) {
      return res.status(400).json({
        error:
          "Valid phone number is required (10–15 digits, may start with +)",
      });
    }
    if (!Array.isArray(business.languages) || business.languages.length < 1) {
      return res.status(400).json({ error: "Select at least one language" });
    }
    if (!location?.city)
      return res.status(400).json({ error: "City is required" });
    if (!Array.isArray(expertise?.areas) || expertise.areas.length < 1) {
      return res
        .status(400)
        .json({ error: "Add at least one area of expertise" });
    }
    if (experience?.years == null || Number.isNaN(Number(experience.years))) {
      return res.status(400).json({ error: "Years of experience is required" });
    }

    const exists = await Profile.findOne({ userId });
    if (exists)
      return res
        .status(400)
        .json({ error: "Profile already exists for this user" });
    const profilePhotoFile = req.files?.profilePhoto?.[0] || req.file;
    const portfolioFiles = req.files?.portfolio || [];
    const galleryFiles = req.files?.gallery || [];
    const media = {
      logoUrl: business.logoUrl || "",
      profilePhotoUrl: profilePhotoFile
        ? toWebPath(profilePhotoFile)
        : req.body.profilePhotoUrl || "",
      portfolio: portfolioFiles.map(toPhoto),
      gallery: galleryFiles.map(toPhoto),
    };

    if (!media.profilePhotoUrl) {
      return res.status(400).json({ error: "Profile photo is required" });
    }

    const doc = {
      userId,
      media,
      business,
      location,
      expertise,
      experience,
      descriptions,
      social,
    };
    const profile = await Profile.create(doc);
    return res.status(201).json({ message: "Profile created", profile });
  } catch (err) {
    console.error("Create Profile error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = requireUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const existing = await Profile.findOne({ userId });
    if (!existing)
      return res
        .status(404)
        .json({ error: "Profile not found. Create it first." });
    const business = parseMaybeJSON(req.body.business);
    const location = parseMaybeJSON(req.body.location);
    const expertise = parseMaybeJSON(req.body.expertise);
    const experience = parseMaybeJSON(req.body.experience);
    const descriptions = parseMaybeJSON(req.body.descriptions);
    const social = parseMaybeJSON(req.body.social);
    const languagesMaybe = listFromMaybe(req.body.languages);
    const areasMaybe = listFromMaybe(req.body.areas);
    if (business?.email && !emailOk(business.email))
      return res.status(400).json({ error: "Invalid email format" });
    if (business?.mobile && !mobileOk(business.mobile))
      return res.status(400).json({ error: "Invalid phone format" });
    if (experience?.years != null) {
      const y = Number(experience.years);
      if (!Number.isFinite(y) || y < 0)
        return res
          .status(400)
          .json({ error: "Years of experience must be ≥ 0" });
    }
    const profilePhotoFile = req.files?.profilePhoto?.[0] || req.file;
    const portfolioFiles = req.files?.portfolio || [];
    const galleryFiles = req.files?.gallery || [];
    const keepPortfolio = parseMaybeJSON(req.body.keepPortfolio);
    const keepGallery = parseMaybeJSON(req.body.keepGallery);
    const $set = { updatedAt: new Date() };
    if (business || languagesMaybe) {
      $set.business = { ...(existing.business || {}), ...(business || {}) };
      if (languagesMaybe) $set.business.languages = languagesMaybe;
    }
    if (location) $set.location = { ...(existing.location || {}), ...location };
    if (expertise || areasMaybe) {
      $set.expertise = { ...(existing.expertise || {}), ...(expertise || {}) };
      if (areasMaybe) $set.expertise.areas = areasMaybe;
    }
    if (experience)
      $set.experience = { ...(existing.experience || {}), ...experience };
    if (descriptions)
      $set.descriptions = { ...(existing.descriptions || {}), ...descriptions };
    if (social) $set.social = { ...(existing.social || {}), ...social };
    const media = { ...(existing.media?.toObject?.() || existing.media || {}) };
    if (
      typeof req.body.profilePhotoUrl === "string" &&
      req.body.profilePhotoUrl.trim()
    ) {
      media.profilePhotoUrl = req.body.profilePhotoUrl.trim();
    }
    if (profilePhotoFile) {
      media.profilePhotoUrl = toWebPath(profilePhotoFile);
    }
    if (Array.isArray(keepPortfolio) || portfolioFiles.length) {
      const kept = Array.isArray(keepPortfolio)
        ? keepPortfolio.map(normalizeKeepPhoto).filter(Boolean)
        : media.portfolio || [];
      const added = portfolioFiles.map(toPhoto);
      media.portfolio = [...(kept || []), ...added];
    }
    if (Array.isArray(keepGallery) || galleryFiles.length) {
      const kept = Array.isArray(keepGallery)
        ? keepGallery.map(normalizeKeepPhoto).filter(Boolean)
        : media.gallery || [];
      const added = galleryFiles.map(toPhoto);
      media.gallery = [...(kept || []), ...added];
    }
    if (Object.keys(media).length) $set.media = media;
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set },
      { new: true }
    );
    if (!profile)
      return res.status(500).json({ error: "Failed to update profile" });
    return res.status(200).json({ message: "Profile updated", profile });
  } catch (err) {
    console.error("Update Profile error:", err);
    return res.status(500).json({ error: "Server error during update" });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid profile id" });
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    console.error("GetProfileById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getAllProfiles = async (_req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    return res.status(200).json(profiles);
  } catch (err) {
    console.error("GetAllProfiles error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = requireUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await Profile.findOne({ userId }).populate(
      "userId",
      "username email"
    );
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    console.error("GetMyProfile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const userId = requireUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await Profile.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!profile)
      return res.status(404).json({ error: "Not found or unauthorized" });
    return res.status(200).json({ message: "Profile deleted" });
  } catch (err) {
    console.error("DeleteProfile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getProfilesByAreaExceptUser = async (req, res) => {
  try {
    const value = (req.query.value ?? "").toString().trim();
    const rawUserId = (req.query.userId ?? req.body?.userId ?? "")
      .toString()
      .trim();
    if (!value)
      return res.status(400).json({ error: "Query 'value' is required" });
    const exclude = rawUserId
      ? {
          userId: {
            $ne: mongoose.isValidObjectId(rawUserId)
              ? new mongoose.Types.ObjectId(rawUserId)
              : rawUserId,
          },
        }
      : {};
    const rx = new RegExp(
      `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    );
    const profiles = await Profile.find({
      "expertise.areas": rx,
      ...exclude,
    });
    return res.status(200).json({ count: profiles.length, profiles });
  } catch (err) {
    console.error("getProfilesByAreaExceptUser error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getProfilesByCategory = async (req, res) => {
  try {
    const categories = listFromMaybe(req.query.category);
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      const allProfiles = await Profile.find({}).sort({ createdAt: -1 });

      const expertiseCategories = await Profile.distinct(
        "expertise.categories"
      );
      const aboutCategories = await Profile.distinct("about.category");
      const uniqueCategories = [
        ...new Set([
          ...expertiseCategories.flat(),
          ...aboutCategories.filter(Boolean),
        ]),
      ].filter((cat) => cat && cat.trim());

      return res.status(200).json({
        message: "All unique categories and full profiles retrieved",
        count: {
          categories: uniqueCategories.length,
          profiles: allProfiles.length,
        },
        categories: uniqueCategories.sort(),
        profiles: allProfiles,
      });
    }

    const validCategories = categories.filter(
      (c) => typeof c === "string" && c.trim()
    );
    if (validCategories.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or empty categories provided" });
    }

    const profiles = await Profile.find({
      $or: [
        {
          "expertise.categories": {
            $in: validCategories.map((c) => new RegExp(`^${c.trim()}$`, "i")),
          },
        },
        {
          "about.category": {
            $in: validCategories.map((c) => new RegExp(`^${c.trim()}$`, "i")),
          },
        },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Full profiles retrieved by category",
      count: profiles.length,
      categories: validCategories,
      profiles,
    });
  } catch (err) {
    console.error("getProfilesByCategory error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateBankDetails = async (req, res) => {
  try {
    const userId = requireUserId(req);
    const { profileId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ error: "Invalid profileId" });
    }

    const {
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
    } = req.body;

    if (
      !accountHolderName ||
      !accountNumber ||
      !confirmAccountNumber ||
      !ifscCode ||
      !bankName
    ) {
      return res
        .status(400)
        .json({ error: "All required bank fields must be filled" });
    }

    if (accountNumber !== confirmAccountNumber) {
      return res.status(400).json({ error: "Account numbers do not match" });
    }

    const profile = await Profile.findOneAndUpdate(
      { _id: profileId, userId },
      {
        $set: {
          bankDetails: {
            accountHolderName,
            accountNumber,
            confirmAccountNumber,
            ifscCode,
            bankName,
            branchName,
            accountType,
          },
        },
      },
      { new: true }
    );

    if (!profile)
      return res
        .status(404)
        .json({ error: "Profile not found or unauthorized" });

    return res.status(200).json({
      message: "Bank details updated",
      bankDetails: profile.bankDetails,
    });
  } catch (err) {
    console.error("updateBankDetails error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateKycDetails = async (req, res) => {
  try {
    const userId = requireUserId(req);
    const { profileId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ error: "Invalid profileId" });
    }

    const { panNumber, aadhaarNumber } = req.body;

    // files
    const panImageUrl = req.files?.panImage?.[0]?.path || "";
    const aadhaarFrontUrl = req.files?.aadhaarFront?.[0]?.path || "";
    const aadhaarBackUrl = req.files?.aadhaarBack?.[0]?.path || "";

    const profile = await Profile.findOneAndUpdate(
      { _id: profileId, userId },
      {
        $set: {
          "kyc.panNumber": panNumber,
          "kyc.panImageUrl": panImageUrl,
          "kyc.aadhaarNumber": aadhaarNumber,
          "kyc.aadhaarFrontUrl": aadhaarFrontUrl,
          "kyc.aadhaarBackUrl": aadhaarBackUrl,
        },
      },
      { new: true }
    );

    if (!profile) {
      return res
        .status(404)
        .json({ error: "Profile not found or unauthorized" });
    }

    return res.status(200).json({
      message: "KYC details updated",
      kyc: profile.kyc,
    });
  } catch (err) {
    console.error("updateKycDetails error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getProfileByUserAndId = async (req, res) => {
  try {
    const userId = requireUserId(req);
    const { profileId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ error: "Invalid profileId" });
    }

    const profile = await Profile.findOne({ _id: profileId, userId }).populate(
      "userId"
    );

    if (!profile) {
      return res
        .status(404)
        .json({ error: "Profile not found or unauthorized" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("getProfileByUserAndId error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res
        .status(404)
        .json({ error: "Profile not found for this userId" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("getProfileByUserId error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.toggleProfileStatus = async (req, res) => {
  try {
    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    profile.profilestatus = !profile.profilestatus;
    await profile.save();

    return res.status(200).json({
      message: `Profile ${
        profile.profilestatus ? "activated" : "deactivated"
      } successfully`,
      profilestatus: profile.profilestatus,
    });
  } catch (err) {
    console.error("Toggle Profile Status error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

exports.createDatingProfile = exports.createProfile;
exports.updateDatingProfile = exports.updateProfile;
exports.getDatingProfileById = exports.getProfileById;
exports.getAllProfile = exports.getAllProfiles;
exports.getMyDatingProfile = exports.getMyProfile;
exports.deleteDatingProfile = exports.deleteProfile;
