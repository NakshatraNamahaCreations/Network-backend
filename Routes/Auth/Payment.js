const express = require("express");
const router = express.Router();

const {
  createBooking,
  markBookingStatus,
  getMyBookings,
  getBookingsForProfile,
  getTakenSlotsForDate,
  getContactForUserProfile,
  // getUserProfileData,
  getProfileByUserId,
  getUserAndBookings,
  getAllBookingsWithUserAndProfile,
  createRazorpayOrderAndBooking,
  verifyRazorpayAndMarkBooking
} = require("../../Controller/Auth/Payment");

// router.post("/create", createBooking);

router.post("/status", markBookingStatus);

router.get("/my/:userId", getMyBookings);
router.get("/for/:profileId", getBookingsForProfile);
router.get("/slots/:profileId", getTakenSlotsForDate);
router.get("/contact/:profileId", getContactForUserProfile);
// router.get("/user-profile", getUserProfileData);
router.get("/profile/:userId", getProfileByUserId);
router.get("/user-bookings/:profileId", getUserAndBookings);
router.get("/allbooking", getAllBookingsWithUserAndProfile);
router.post("/razorpay/create-order", createRazorpayOrderAndBooking);
router.post("/razorpay/verify", verifyRazorpayAndMarkBooking);


module.exports = router;
