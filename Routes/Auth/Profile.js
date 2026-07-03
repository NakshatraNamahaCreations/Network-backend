require("dotenv").config();
const express = require("express");
const multer  = require("multer");
const { profileStorage, kycStorage } = require("../../utills/cloudinary");

const {
  createProfile, updateProfile, getProfileById, getMyProfile,
  deleteProfile, getAllProfile, toggleProfileStatus,
  updateBankDetails, updateKycDetails, getProfileByUserId,
  discoverProfiles, getCategories, toggleGeneralAccess,
} = require("../../Controller/Auth/Profile");

const router = express.Router();

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/x-msvideo"];

const profileFileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE.includes(file.mimetype) || ALLOWED_VIDEO.includes(file.mimetype))
    return cb(null, true);
  return cb(new Error("Only images or videos allowed"), false);
};

const kycFileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only images allowed for KYC"), false);
};

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "photos",       maxCount: 8 },
  { name: "video",        maxCount: 1 },
]);

const kycUpload = multer({
  storage: kycStorage,
  fileFilter: kycFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: "panImage",     maxCount: 1 },
  { name: "aadhaarFront", maxCount: 1 },
  { name: "aadhaarBack",  maxCount: 1 },
]);

// Profile CRUD
router.post("/addprofile",           profileUpload, createProfile);
router.put("/editprofiles",          profileUpload, updateProfile);
router.get("/discover",              discoverProfiles);
router.get("/all",                   getAllProfile);
router.get("/categories",            getCategories);
router.get("/me/my-profile",         getMyProfile);
router.get("/get-profile-by-id/:id", getProfileById);
router.get("/userprofile/:userId",   getProfileByUserId);
router.delete("/:id",               deleteProfile);
router.put("/toggle-status/:profileId", toggleProfileStatus);
router.patch("/:id/general-access",    toggleGeneralAccess);

// Bank & KYC
router.patch("/profile/:profileId/bank", updateBankDetails);
router.patch("/profile/:profileId/kyc",  kycUpload, updateKycDetails);

module.exports = router;
