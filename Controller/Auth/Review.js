const mongoose = require("mongoose");
const Review = require("../../Model/Auth/Review");
const Profile = require("../../Model/Auth/Profile");

async function recalcRating(profileId) {
  const result = await Review.aggregate([
    { $match: { profileId: new mongoose.Types.ObjectId(profileId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = result[0]?.avg ?? 0;
  const count = result[0]?.count ?? 0;
  await Profile.findByIdAndUpdate(profileId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

exports.addReview = async (req, res) => {
  try {
    const { reviewerId, profileId, rating, comment } = req.body;

    if (!reviewerId || !profileId || !rating) {
      return res
        .status(400)
        .json({ success: false, message: "reviewerId, profileId, rating required" });
    }

    if (!mongoose.isValidObjectId(reviewerId) || !mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be 1-5" });
    }

    const profileExists = await Profile.exists({ _id: profileId });
    if (!profileExists) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const review = await Review.findOneAndUpdate(
      { reviewerId, profileId },
      { rating: ratingNum, comment: comment?.trim() || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recalcRating(profileId);

    return res.status(200).json({ success: true, review });
  } catch (err) {
    console.error("addReview error", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

exports.getReviewsForProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    if (!mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ success: false, message: "Invalid profileId" });
    }

    const reviews = await Review.find({ profileId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "name profileImage")
      .lean();

    const profile = await Profile.findById(profileId).select("averageRating reviewCount").lean();

    return res.status(200).json({
      success: true,
      averageRating: profile?.averageRating ?? 0,
      reviewCount: profile?.reviewCount ?? 0,
      reviews,
    });
  } catch (err) {
    console.error("getReviewsForProfile error", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ success: false, message: "Invalid reviewId" });
    }

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    await recalcRating(review.profileId);

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("deleteReview error", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};
