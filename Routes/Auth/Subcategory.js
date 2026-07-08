const express = require("express");
const {
  addSubcategory, getSubcategories, updateSubcategory, deleteSubcategory,
} = require("../../Controller/Auth/Subcategory");

const router = express.Router();

router.get("/",     getSubcategories);
router.post("/",    addSubcategory);
router.put("/:id",  updateSubcategory);
router.delete("/:id", deleteSubcategory);

module.exports = router;
