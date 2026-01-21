const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createDatingProfile,
  updateDatingProfile,
  getDatingProfileById,
  getMyDatingProfile,
  deleteDatingProfile,
  getAllProfile,
  getProfilesByAreaExceptUser,
  getProfilesByCategory,
  updateBankDetails,
  updateKycDetails,
  getProfileByUserAndId,
  getProfileByUserId,
  toggleProfileStatus,
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

const fileFilter = (_req, file, cb) => {
  if (file?.mimetype?.startsWith("image/")) return cb(null, true);
  return cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024, files: 25 },
});

router.post(
  "/addprofile",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "portfolio", maxCount: 12 },
    { name: "gallery", maxCount: 12 },
  ]),
  createDatingProfile
);

router.put(
  "/editprofiles",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "portfolio", maxCount: 12 },
    { name: "gallery", maxCount: 12 },
  ]),
  updateDatingProfile
);

router.get("/get-profile-by-id/:id", getDatingProfileById);
router.get("/me/my-profile", getMyDatingProfile);
router.get("/all", getAllProfile);

router.delete("/:id", deleteDatingProfile);

router.get("/by-area-except", getProfilesByAreaExceptUser);
router.get("/by-category", getProfilesByCategory);
router.patch("/profile/:profileId/bank", updateBankDetails);
// router.patch("/profile/:profileId/kyc", updateKycDetails);
router.patch(
  "/profile/:profileId/kyc",
  upload.fields([
    { name: "panImage", maxCount: 1 },
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
  ]),
  updateKycDetails
);
router.get("/:profileId/user", getProfileByUserAndId);
router.get("/userprofile/:userId", getProfileByUserId);
router.put("/toggle-status/:profileId", toggleProfileStatus);

module.exports = router;
