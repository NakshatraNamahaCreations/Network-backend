const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine for profile photos, extra photos, and videos
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "sell-your-time/profiles",
      resource_type: isVideo ? "video" : "image",
      ...(isVideo
        ? {}
        : { transformation: [{ quality: "auto:good", fetch_format: "auto" }] }),
    };
  },
});

// Storage engine for KYC documents
const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sell-your-time/kyc",
    resource_type: "image",
    transformation: [{ quality: "auto:good" }],
  },
});

const generalStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sell-your-time/general",
    resource_type: "image",
    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
  },
});

module.exports = { cloudinary, profileStorage, kycStorage, generalStorage };
