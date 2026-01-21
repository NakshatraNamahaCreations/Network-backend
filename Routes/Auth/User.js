// const express = require("express");
// const router = express.Router();
// const {
//   saveUser,
//   verifyOTP,
//   resendOTP,
// } = require("../../Controller/Auth/User");

// router.post("/signup", saveUser);
// router.post("/verifyOTP", verifyOTP);
// router.post("/resendOTP", resendOTP);
// module.exports = router;

const express = require("express");
const multer = require("multer");
const {
  saveUser,
  verifyOTP,
  resendOTP,
  updateProfileVerification,
  getParticularUser,
  updateUser,
  getBuyers,
  toggleProfileStatus,
  getSeller,
} = require("../../Controller/Auth/User");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const router = express.Router();

router.post("/saveUser", saveUser);
router.post("/verifyOTP", verifyOTP);
router.post("/resendOTP", resendOTP);
router.get("/getbyid/:id", getParticularUser);
router.put("/updateUser/:id", updateUser);
router.get("/getbuyers", getBuyers);
router.put("/update-status-buyer/:id", toggleProfileStatus);
// Seller
router.get("/getseller", getSeller);
router.post(
  "/update-profile-verification",
  upload.fields([
    { name: "panImage", maxCount: 1 },
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ]),
  updateProfileVerification
);

module.exports = router;
