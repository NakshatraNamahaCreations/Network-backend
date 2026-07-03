const mongoose = require("mongoose");
const Like = require("../../Model/Auth/Like");
const Profile = require("../../Model/Auth/Profile");
const Notification = require("../../Model/Auth/Notification");
const User = require("../../Model/Auth/User");

exports.likeProfile = async (req, res) => {
  try {
    const { fromUserId, toProfileId } = req.body;

    if (!fromUserId || !toProfileId) {
      return res.status(400).json({ success: false, message: "fromUserId and toProfileId required" });
    }
    if (!mongoose.isValidObjectId(fromUserId) || !mongoose.isValidObjectId(toProfileId)) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    const profile = await Profile.findById(toProfileId).select("userId displayName profilePhoto likeCount").lean();
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    const existing = await Like.findOne({ fromUserId, toProfileId });
    if (existing) {
      // Unlike
      await Like.deleteOne({ _id: existing._id });
      await Profile.findByIdAndUpdate(toProfileId, { $inc: { likeCount: -1 } });
      return res.status(200).json({ success: true, liked: false, message: "Unliked" });
    }

    await Like.create({ fromUserId, toProfileId });
    await Profile.findByIdAndUpdate(toProfileId, { $inc: { likeCount: 1 } });

    // In-app notification to profile owner
    const liker = await User.findById(fromUserId).select("name profileImage").lean();
    const likerName = liker?.name || "Someone";
    await Notification.create({
      userId: profile.userId,
      type: "like",
      title: `${likerName} liked your profile! ❤️`,
      body: `${likerName} liked your profile`,
      relatedId: String(fromUserId),
      senderName: liker?.name || "",
      senderPhoto: liker?.profileImage || "",
    });

    return res.status(200).json({ success: true, liked: true, message: "Liked" });
  } catch (err) {
    if (err?.code === 11000) return res.status(200).json({ success: true, liked: true });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyLikes = async (req, res) => {
  try {
    const { userId } = req.params;
    const likes = await Like.find({ fromUserId: userId })
      .populate({ path: "toProfileId", select: "displayName profilePhoto category hourlyRate city approvalStatus" })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, likes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.whoLikedMe = async (req, res) => {
  try {
    const { profileId } = req.params;
    const likes = await Like.find({ toProfileId: profileId })
      .populate({ path: "fromUserId", select: "name profileImage" })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, likes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
