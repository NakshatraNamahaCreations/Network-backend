const User = require("../../Model/Auth/User");
const Otp = require("../../Model/Auth/Otp"); // <-- model, not schema
const crypto = require("crypto");

const normalizePhone = (p) => String(p || "").replace(/\D/g, "");

// POST /auth/saveUser
exports.saveUser = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    if (!phoneNumber)
      return res.status(400).json({ message: "Mobile number is required" });

    const otp = String(crypto.randomInt(1000, 10000));
    const expiry = new Date(Date.now() + 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNumber },
      { otp, expiry },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const user = await User.findOne({ phoneNumber });
    return res.status(200).json({
      message: "OTP Sent successfully!",
      otp, // ⚠️ return only in dev/testing
      isNewUser: !user,
    });
  } catch (err) {
    console.error("saveUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/verifyOTP
exports.verifyOTP = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    const otpInput = String(req.body.otp || "");
    const { name, email } = req.body;

    if (!phoneNumber || !otpInput) {
      return res
        .status(400)
        .json({ message: "phoneNumber and otp are required" });
    }

    const record = await Otp.findOne({ phoneNumber });
    if (!record)
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    if (record.expiry < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otpInput) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await Otp.deleteOne({ _id: record._id }); // consume OTP

    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (!user) {
      // your User requires name, email
      if (!name || !email) {
        return res.status(400).json({
          message:
            "New user detected. Please provide name and email to complete signup.",
          needsProfile: true,
        });
      }
      isNewUser = true;
      user = await User.create({
        phoneNumber,
        name,
        email,
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
      status: "Online",
      isNewUser,
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/resendOTP
exports.resendOTP = async (req, res) => {
  try {
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    if (!phoneNumber)
      return res.status(400).json({ message: "Mobile number is required" });

    const otp = String(crypto.randomInt(1000, 10000));
    const expiry = new Date(Date.now() + 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNumber },
      { otp, expiry },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const existing = await User.findOne({ phoneNumber });

    return res.status(200).json({
      message: "OTP Re-sent",
      otp, // ⚠️ return only in dev/testing
      isNewUser: !existing,
    });
  } catch (err) {
    console.error("resendOTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
