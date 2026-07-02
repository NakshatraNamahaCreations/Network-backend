const express = require("express");
const { addReview, getReviewsForProfile, deleteReview } = require("../../Controller/Auth/Review");

const router = express.Router();

router.post("/add", addReview);
router.get("/profile/:profileId", getReviewsForProfile);
router.delete("/:reviewId", deleteReview);

module.exports = router;
