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
} = require("../../Controller/Auth/Profile");

const router = express.Router();

const uploadDir = "uploads/dating";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "photo-" + suffix + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024 },
});

const photosUpload = upload.array("photos", 6);

const handleMulter = (req, res, next) => {
  photosUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post("/addprofile", handleMulter, createDatingProfile);

router.get("/get-profile-by-id/:id", getDatingProfileById);
router.get("/me/my-profile", getMyDatingProfile);
router.get("/all", getAllProfile);

router.delete("/:id", deleteDatingProfile);

router.put(
  "/editprofiles",
  upload.fields([
    { name: "photos", maxCount: 6 },
    { name: "aadharimage", maxCount: 1 },
    { name: "panimage", maxCount: 1 },
  ]),
  handleMulter,
  updateDatingProfile
);

module.exports = router;
