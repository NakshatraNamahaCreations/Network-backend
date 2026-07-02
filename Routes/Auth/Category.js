const express = require("express");
const { addCategory, getAllCategories, updateCategory, deleteCategory } = require("../../Controller/Auth/Category");
const router = express.Router();

router.get("/", getAllCategories);
router.post("/", addCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
