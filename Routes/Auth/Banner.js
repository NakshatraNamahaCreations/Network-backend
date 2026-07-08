const express = require("express");
const multer = require("multer");
const { generalStorage } = require("../../utills/cloudinary");
const { addBanner, getBanners, updateBanner, deleteBanner } = require("../../Controller/Auth/Banner");

const router = express.Router();
const upload = multer({ storage: generalStorage });

router.get("/",       getBanners);
router.post("/",      upload.single("image"), addBanner);
router.put("/:id",    upload.single("image"), updateBanner);
router.delete("/:id", deleteBanner);

module.exports = router;
