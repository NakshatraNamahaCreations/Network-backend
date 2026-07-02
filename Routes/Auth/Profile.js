const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createProfile, updateProfile, getProfileById, getMyProfile,
  deleteProfile, getAllProfile, toggleProfileStatus,
  updateBankDetails, updateKycDetails, getProfileByUserId,
  discoverProfiles, getCategories, toggleGeneralAccess,
} = require("../../Controller/Auth/Profile");

const router = express.Router();

const uploadDir = "uploads/profiles";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "media-" + suffix + path.extname(file.originalname));
  },
});

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/x-msvideo"];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE.includes(file.mimetype) || ALLOWED_VIDEO.includes(file.mimetype))
    return cb(null, true);
  return cb(new Error("Only images or videos allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024, files: 10 } });

const profileUpload = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "photos", maxCount: 8 },
  { name: "video", maxCount: 1 },
]);

const kycUpload = upload.fields([
  { name: "panImage", maxCount: 1 },
  { name: "aadhaarFront", maxCount: 1 },
  { name: "aadhaarBack", maxCount: 1 },
]);

// Profile CRUD
router.post("/addprofile", profileUpload, createProfile);
router.put("/editprofiles", profileUpload, updateProfile);
router.get("/discover", discoverProfiles);
router.get("/all", getAllProfile);
router.get("/categories", getCategories);
router.get("/me/my-profile", getMyProfile);
router.get("/get-profile-by-id/:id", getProfileById);
router.get("/userprofile/:userId", getProfileByUserId);
router.delete("/:id", deleteProfile);
router.put("/toggle-status/:profileId", toggleProfileStatus);
router.patch("/:id/general-access", toggleGeneralAccess);

// Bank & KYC
router.patch("/profile/:profileId/bank", updateBankDetails);
router.patch("/profile/:profileId/kyc", kycUpload, updateKycDetails);

module.exports = router;
