const express = require("express");
const multer = require("multer");
const { generalStorage } = require("../../utills/cloudinary");
const {
  addSubcategory, getSubcategories, updateSubcategory, deleteSubcategory,
} = require("../../Controller/Auth/Subcategory");

const router = express.Router();
const upload = multer({ storage: generalStorage });

router.get("/",       getSubcategories);
router.post("/",      upload.single("image"), addSubcategory);
router.put("/:id",    upload.single("image"), updateSubcategory);
router.delete("/:id", deleteSubcategory);

module.exports = router;
