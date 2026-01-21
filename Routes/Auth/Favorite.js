const express = require("express");
const router = express.Router();
const {
  toggleFavoriteProfile,
  getMyFavoriteProfiles,
  getMyFavoriteProfileIds,
  isProfileFavorited,
} = require("../../Controller/Auth/Favorite");

router.post("/toggle", toggleFavoriteProfile);
router.get("/myFavorite/:userId", getMyFavoriteProfiles);
router.get("/profile/ids/:id", getMyFavoriteProfileIds);
router.get("/profile/is/:profileId", isProfileFavorited);

module.exports = router;
