const express = require("express");
const router  = express.Router();
const Message = require("../../Model/Auth/Message");
const SimpleBooking = require("../../Model/Auth/SimpleBooking");

// Send a message — only allowed if booking is accepted and sender is buyer or profile owner
router.post("/send", async (req, res) => {
  try {
    const { bookingId, senderId, text } = req.body;
    if (!bookingId || !senderId || !text?.trim()) {
      return res.status(400).json({ error: "bookingId, senderId, and text are required" });
    }

    const booking = await SimpleBooking.findById(bookingId).populate("profileId", "userId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "accepted") return res.status(403).json({ error: "Chat only available for accepted bookings" });

    const buyerIdStr   = String(booking.buyerId);
    const ownerIdStr   = String(booking.profileId?.userId || "");
    const senderIdStr  = String(senderId);

    if (senderIdStr !== buyerIdStr && senderIdStr !== ownerIdStr) {
      return res.status(403).json({ error: "Not a participant of this booking" });
    }

    const msg = await Message.create({ bookingId, senderId, text: text.trim() });
    res.status(201).json({ message: msg });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages for a booking (paginated, newest last)
router.get("/booking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { after } = req.query; // ISO timestamp — fetch messages after this time
    const query = { bookingId };
    if (after) query.createdAt = { $gt: new Date(after) };
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(200);
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
