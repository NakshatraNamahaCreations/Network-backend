const User = require("../../Model/Auth/User");
const Otp = require("../../Model/Auth/Otp");
const crypto = require("crypto");

const normalizePhone = (p) => String(p || "").replace(/\D/g, "");

exports.saveUser = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    const { name, email, role } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    const expiry = new Date(Date.now() + 2 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNumber },
      { otp, expiry },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const user = await User.findOne({ phoneNumber });

    return res.status(200).json({
      message: "OTP sent successfully",
      otp,
      isNewUser: !user,
      name,
      email,
      role,
    });
  } catch (err) {
    console.error("saveUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    const otpInput = String(req.body.otp || "").trim();
    const { name, email, role } = req.body;

    if (!phoneNumber || !otpInput) {
      return res.status(400).json({
        message: "phoneNumber and otp are required",
      });
    }

    const record = await Otp.findOne({ phoneNumber });
    if (!record) {
      return res.status(400).json({
        message: "OTP not found. Please request a new one.",
      });
    }

    if (new Date(record.expiry) < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (String(record.otp) !== otpInput) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await Otp.deleteOne({ _id: record._id });

    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (!user) {
      if (!name || !email) {
        return res.status(400).json({
          message: "New user requires name and email",
        });
      }
      isNewUser = true;
      user = await User.create({
        phoneNumber,
        name,
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      user.updatedAt = new Date();
      await user.save();
    }

    return res.status(200).json({
      message: "OTP verified successfully",
      data: user,
      isNewUser,
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    const expiry = new Date(Date.now() + 2 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNumber },
      { otp, expiry },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "OTP resent successfully",
      otp,
    });
  } catch (err) {
    console.error("resendOTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfileVerification = async (req, res) => {
  try {
    const { userId, panNumber, aadhaarNumber, profileStatus } = req.body;

    console.log("req.body", req.body);
    console.log("req.files", req.files);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!panNumber || !aadhaarNumber) {
      return res
        .status(400)
        .json({ message: "PAN and Aadhaar details are required" });
    }

    const panImage = req.files?.panImage?.[0]?.path || null;
    const aadhaarFront = req.files?.aadhaarFront?.[0]?.path || null;
    const aadhaarBack = req.files?.aadhaarBack?.[0]?.path || null;
    const profileImage = req.files?.profileImage?.[0]?.path || null;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        profileImage,
        profileStatus,
        panNumber,
        panImage,
        aadhaarNumber,
        aadhaarFront,
        aadhaarBack,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile verification details updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("updateProfileVerification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getParticularUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("getParticularUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    console.log("Updating user:", id, req.body);

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getBuyers = async (req, res) => {
  try {
    const buyers = await User.find({ role: "buyer" });

    if (!buyers || buyers.length === 0) {
      return res.status(404).json({ message: "No buyers found" });
    }

    return res.status(200).json({
      message: "Buyers fetched successfully",
      data: buyers,
    });
  } catch (err) {
    console.error("getBuyers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.toggleProfileStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileStatus = !user.profileStatus;
    await user.save();

    return res.status(200).json({
      message: `User profileStatus updated successfully`,
      userId: user._id,
      profileStatus: user.profileStatus,
    });
  } catch (err) {
    console.error("toggleProfileStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getSeller = async (req, res) => {
  try {
    const seller = await User.find({ role: "seller" });

    if (!seller || seller.length === 0) {
      return res.status(404).json({ message: "No buyers found" });
    }

    return res.status(200).json({
      message: "Buyers fetched successfully",
      data: seller,
    });
  } catch (err) {
    console.error("getBuyers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
