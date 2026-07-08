const express = require("express");
const { addBanner, getBanners, updateBanner, deleteBanner } = require("../../Controller/Auth/Banner");

const router = express.Router();

router.get("/",     getBanners);
router.post("/",    addBanner);
router.put("/:id",  updateBanner);
router.delete("/:id", deleteBanner);

module.exports = router;
