const express = require("express");
const {
  AdminUserSignup, AdminUserSignin, AdmingetAlluser, getDashboardStats,
  getPendingProfiles, getAllProfilesAdmin, approveProfile, rejectProfile,
  addCategory, getAllCategories, updateCategory, deleteCategory,
  getAllBookings,
} = require("../../Controller/Auth/Admin");

const router = express.Router();

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

// Categories
router.get("/categories", getAllCategories);
router.post("/categories", addCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Bookings
router.get("/bookings", getAllBookings);

module.exports = router;
