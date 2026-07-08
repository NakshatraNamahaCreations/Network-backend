const express = require("express");
const multer = require("multer");
const { generalStorage } = require("../../utills/cloudinary");
const {
  AdminUserSignup, AdminUserSignin, AdmingetAlluser, getDashboardStats,
  getPendingProfiles, getAllProfilesAdmin, approveProfile, rejectProfile, verifyProfile,
  toggleProfileStatus,
  addCategory, getAllCategories, updateCategory, deleteCategory,
  getAllBookings,
} = require("../../Controller/Auth/Admin");

const router = express.Router();
const upload = multer({ storage: generalStorage });

// Auth
router.post("/signup", AdminUserSignup);
router.post("/signin", AdminUserSignin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users
router.get("/alluser", AdmingetAlluser);

// Profiles
router.get("/profiles/pending", getPendingProfiles);
router.get("/profiles", getAllProfilesAdmin);
router.put("/profiles/:profileId/approve", approveProfile);
router.put("/profiles/:profileId/reject", rejectProfile);
router.put("/profiles/:profileId/verify", verifyProfile);
router.put("/profiles/:profileId/toggle-status", toggleProfileStatus);

// Categories
router.get("/categories", getAllCategories);
router.post("/categories", upload.single("image"), addCategory);
router.put("/categories/:id", upload.single("image"), updateCategory);
router.delete("/categories/:id", deleteCategory);

// Bookings
router.get("/bookings", getAllBookings);

module.exports = router;
