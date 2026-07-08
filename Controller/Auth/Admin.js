const adminUser = require("../../Model/Auth/Admin");
const User = require("../../Model/Auth/User");
const Profile = require("../../Model/Auth/Profile");
const Booking = require("../../Model/Auth/Payment");
const Category = require("../../Model/Auth/Category");
const Notification = require("../../Model/Auth/Notification");
const bcrypt = require("bcrypt");

// ── Auth ─────────────────────────────────────────────────────────────────────
exports.AdminUserSignup = async (req, res) => {
  try {
    const { password, email } = req.body;
    if (!password || !email)
      return res.status(400).json({ message: "All fields are required." });
    if (await adminUser.findOne({ email }))
      return res.status(400).json({ message: "User already exists!" });
    const newUser = await adminUser.create({ email, password: await bcrypt.hash(password, 10) });
    return res.status(200).json({ message: "Admin created successfully!", user: newUser });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.AdminUserSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ status: false, error: "Email and password are required." });
    const existing = await adminUser.findOne({ email });
    if (!existing) return res.status(404).json({ status: false, error: "Admin not found!" });
    if (!await bcrypt.compare(password, existing.password))
      return res.status(400).json({ status: false, error: "Invalid password!" });
    return res.status(200).json({ status: true, message: "Signed in", data: { id: existing._id, email: existing.email } });
  } catch (e) {
    return res.status(500).json({ status: false, error: "Internal server error" });
  }
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalSellers, totalBuyers, pendingProfiles, activeProfiles,
      totalBookings, successBookings, totalRevenue] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "buyer" }),
      Profile.countDocuments({ approvalStatus: "pending" }),
      Profile.countDocuments({ approvalStatus: "active" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "success" }),
      Booking.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    return res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalSellers, totalBuyers,
        pendingProfiles, activeProfiles,
        totalBookings, successBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────
exports.AdmingetAlluser = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, total, users });
  } catch (e) {
    return res.status(500).json({ message: "Failed to get users - " + e.message });
  }
};

// ── Profile Approval ──────────────────────────────────────────────────────────
exports.getPendingProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ approvalStatus: "pending" })
      .populate("userId", "name phoneNumber")
      .populate("category", "name icon")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: profiles.length, profiles });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAllProfilesAdmin = async (req, res) => {
  try {
    const { approvalStatus, profilestatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (profilestatus === "true")  filter.profilestatus = true;
    if (profilestatus === "false") filter.profilestatus = false;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ displayName: rx }, { city: rx }, { mobile: rx }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .populate("userId", "name phoneNumber")
        .populate("category", "name icon")
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Profile.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, total, profiles });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.approveProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findByIdAndUpdate(
      profileId,
      { approvalStatus: "active", rejectionReason: "" },
      { new: true }
    ).populate("userId", "name");
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    await Notification.create({
      userId: profile.userId._id,
      type: "profile_approved",
      title: "Profile Approved ✅",
      body: "Your profile has been approved! You are now visible to users.",
      relatedId: String(profileId),
    });

    return res.status(200).json({ success: true, message: "Profile approved", profile });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.rejectProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { reason } = req.body;
    const profile = await Profile.findByIdAndUpdate(
      profileId,
      { approvalStatus: "rejected", rejectionReason: reason || "Does not meet guidelines" },
      { new: true }
    ).populate("userId", "name");
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    await Notification.create({
      userId: profile.userId._id,
      type: "profile_rejected",
      title: "Profile Rejected ❌",
      body: reason || "Your profile was rejected. Please update and resubmit.",
      relatedId: String(profileId),
    });

    return res.status(200).json({ success: true, message: "Profile rejected", profile });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.verifyProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    profile.isVerified = !profile.isVerified;
    await profile.save();

    if (profile.isVerified) {
      await Notification.create({
        userId: profile.userId,
        type: "profile_approved",
        title: "Profile Verified ✅",
        body: "Congratulations! Your profile has been verified and now shows a verified badge.",
        relatedId: String(profileId),
      });
    }

    return res.status(200).json({
      success: true,
      isVerified: profile.isVerified,
      message: profile.isVerified ? "Profile verified" : "Verification removed",
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.toggleProfileStatus = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    profile.profilestatus = !profile.profilestatus;
    await profile.save();

    await Notification.create({
      userId: profile.userId,
      type: "profile_approved",
      title: profile.profilestatus ? "Profile Activated ✅" : "Profile Deactivated ⏸",
      body: profile.profilestatus
        ? "Your profile is now active and visible to users."
        : "Your profile has been temporarily deactivated by admin.",
      relatedId: String(profileId),
    });

    return res.status(200).json({
      success: true,
      profilestatus: profile.profilestatus,
      message: profile.profilestatus ? "Profile activated" : "Profile deactivated",
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ── Category Management ───────────────────────────────────────────────────────
exports.addCategory = async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Category already exists" });
    const imageUrl = req.file?.path || "";
    const cat = await Category.create({ name: name.trim(), icon: icon || "", imageUrl, sortOrder: sortOrder || 0 });
    return res.status(201).json({ success: true, category: cat });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (req.file?.path) update.imageUrl = req.file.path;
    const cat = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, category: cat });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ── Bookings ──────────────────────────────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("userId", "name phoneNumber")
        .populate("profileId", "displayName profilePhoto mobile email")
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, total, bookings });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
