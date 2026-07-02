const express = require("express");
const { likeProfile, getMyLikes, whoLikedMe } = require("../../Controller/Auth/Like");
const router = express.Router();

router.post("/toggle", likeProfile);
router.get("/my/:userId", getMyLikes);
router.get("/who-liked/:profileId", whoLikedMe);

module.exports = router;
