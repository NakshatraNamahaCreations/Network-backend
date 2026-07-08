const mongoose = require("mongoose");
const SimpleBooking = require("../../Model/Auth/SimpleBooking");

exports.createBooking = async (req, res) => {
  try {
    const { buyerId, profileId, date, timeSlot, mode, notes } = req.body;
    if (!buyerId || !profileId || !date || !timeSlot)
      return res.status(400).json({ success: false, message: "buyerId, profileId, date and timeSlot are required" });

    const booking = await SimpleBooking.create({ buyerId, profileId, date, timeSlot, mode: mode || "Online", notes: notes || "" });
    await booking.populate([
      { path: "profileId", select: "displayName profilePhoto hourlyRate city" },
      { path: "buyerId",   select: "name phoneNumber" },
    ]);
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid userId" });
    const bookings = await SimpleBooking.find({ buyerId: userId })
      .sort({ createdAt: -1 })
      .populate("profileId", "displayName profilePhoto hourlyRate city category")
      .lean();
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfileBookings = async (req, res) => {
  try {
    const { profileId } = req.params;
    const bookings = await SimpleBooking.find({ profileId })
      .sort({ createdAt: -1 })
      .populate("buyerId", "name phoneNumber")
      .lean();
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      SimpleBooking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("profileId", "displayName profilePhoto hourlyRate city mobile")
        .populate("buyerId",   "name phoneNumber")
        .lean(),
      SimpleBooking.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, bookings, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "accepted", "rejected", "cancelled"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });
    const booking = await SimpleBooking.findByIdAndUpdate(id, { status }, { new: true })
      .populate("profileId", "displayName")
      .populate("buyerId", "name phoneNumber");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;
    const booking = await SimpleBooking.findOne({ _id: id, buyerId });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found or unauthorized" });
    if (booking.status !== "pending")
      return res.status(400).json({ success: false, message: "Only pending bookings can be cancelled" });
    booking.status = "cancelled";
    await booking.save();
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
