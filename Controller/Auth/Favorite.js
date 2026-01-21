const mongoose = require("mongoose");
const FavoriteProfile = require("../../Model/Auth/Favorite");
const DatingProfile = require("../../Model/Auth/Profile");

exports.toggleFavoriteProfile = async (req, res) => {
  try {
    const { profileId, userId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!profileId || !mongoose.isValidObjectId(profileId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid profileId" });
    }

    const exists = await DatingProfile.exists({ _id: profileId });
    if (!exists)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });

    const found = await FavoriteProfile.findOne({ userId, profileId });
    if (found) {
      await FavoriteProfile.deleteOne({ _id: found._id });
      return res.status(200).json({
        success: true,
        favorited: false,
        message: "Removed from favorites",
      });
    }

    await FavoriteProfile.create({ userId, profileId });
    return res
      .status(201)
      .json({ success: true, favorited: true, message: "Added to favorites" });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(200)
        .json({ success: true, favorited: true, message: "Already favorited" });
    }
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getMyFavoriteProfiles = async (req, res) => {
  try {
    const userId = req.params?.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const favs = await FavoriteProfile.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "profileId",
        model: "Profile",
        select: "basics about preferences photos createdAt",
      })
      .lean();

    const data = favs.map((f) => ({
      favoriteId: f._id,
      profile: f.profileId,
      createdAt: f.createdAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getMyFavoriteProfileIds = async (req, res) => {
  try {
    const id = req.user?.id || req.params?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId" });
    }

    const ids = await FavoriteProfile.find({ id }).distinct("profileId");

    return res.status(200).json({
      success: true,
      ids: ids.map(String),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.isProfileFavorited = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { profileId } = req.params;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!mongoose.isValidObjectId(profileId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid profileId" });
    }

    const found = await FavoriteProfile.exists({ userId, profileId });
    return res.status(200).json({ success: true, favorited: !!found });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};
