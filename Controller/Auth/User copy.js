const userSchema = require("../../Model/Auth/User");
const otpSchema = require("../../Model/Auth/Otp");
const crypto = require("crypto");

exports.saveUser = async (req, res) => {
  try {
    const { phoneNumber, name, email } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otp = crypto.randomInt(1000, 10000);
    const expiry = new Date(Date.now() + 60 * 1000);
    await otpSchema.create({ phoneNumber, otp, expiry });

    const user = await userSchema.findOne({ phoneNumber, name, email });

    res.status(200).json({
      message: "OTP Sent successfully!",
      otp: otp,
      isNewUser: user ? false : true,
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const record = await otpSchema.findOne({ phoneNumber, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await otpSchema.deleteMany({ phoneNumber });

    let user = await userSchema.findOne({ phoneNumber });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = new userSchema({
        phoneNumber,
      });
      await user.save();
    }

    res.status(200).json({
      message: "OTP verified successfully",
      data: user,
      status: "Online",
      isNewUser: isNewUser,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const user = await userSchema.findOne({ phoneNumber });
    if (!user) {
      console.log("Mobile Number not match");
      return res.status(400).json({ message: "mobile number not match" });
    }

    const otp = crypto.randomInt(1000, 10000);
    const expiry = new Date(Date.now() + 60 * 1000);

    await otpSchema.create({ phoneNumber, otp, expiry });

    res.status(200).json({
      message: "OTP Re-sent",
      user,
      otp: otp,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
