const mongoose = require("mongoose");
const Block = require("../../Model/Auth/Block");

exports.blockUser = async (req, res) => {
  try {
    const { blockerId, blockedUserId } = req.body;
    if (!blockerId || !blockedUserId)
      return res.status(400).json({ success: false, message: "blockerId and blockedUserId required" });
    if (String(blockerId) === String(blockedUserId))
      return res.status(400).json({ success: false, message: "Cannot block yourself" });

    const existing = await Block.findOne({ blockerId, blockedUserId });
    if (existing) {
      await Block.deleteOne({ _id: existing._id });
      return res.status(200).json({ success: true, blocked: false, message: "Unblocked" });
    }
    await Block.create({ blockerId, blockedUserId });
    return res.status(200).json({ success: true, blocked: true, message: "Blocked" });
  } catch (err) {
    if (err?.code === 11000) return res.status(200).json({ success: true, blocked: true });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBlocked = async (req, res) => {
  try {
    const { userId } = req.params;
    const Profile = require("../../Model/Auth/Profile");

    const blocked = await Block.find({ blockerId: userId }).lean();
    const blockedUserIds = blocked.map(b => b.blockedUserId);

    const profiles = await Profile.find({ userId: { $in: blockedUserIds } })
      .populate("category", "name")
      .select("userId displayName profilePhoto city category")
      .lean();

    const profileMap = {};
    profiles.forEach(p => { profileMap[String(p.userId)] = p; });

    const result = blocked.map(b => ({
      ...b,
      profile: profileMap[String(b.blockedUserId)] || null,
    }));

    return res.status(200).json({ success: true, blocked: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.isBlocked = async (req, res) => {
  try {
    const { blockerId, blockedUserId } = req.query;
    const found = await Block.exists({ blockerId, blockedUserId });
    return res.status(200).json({ success: true, blocked: !!found });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
