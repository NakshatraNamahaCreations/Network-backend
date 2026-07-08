const express = require("express");
const {
  createBooking, getMyBookings, getProfileBookings,
  getAllBookings, updateBookingStatus, cancelBooking,
} = require("../../Controller/Auth/SimpleBooking");

const router = express.Router();

router.post("/",                       createBooking);
router.get("/my/:userId",              getMyBookings);
router.get("/profile/:profileId",      getProfileBookings);
router.get("/",                        getAllBookings);
router.put("/:id/status",             updateBookingStatus);
router.put("/:id/cancel",             cancelBooking);

module.exports = router;
