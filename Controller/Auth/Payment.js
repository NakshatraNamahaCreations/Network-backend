const mongoose = require("mongoose");
const Booking = require("../../Model/Auth/Payment");
const Profile = require("../../Model/Auth/Profile");
const User = require("../../Model/Auth/User");
const Razorpay = require("razorpay");

const ONE_HOUR_MS = 60 * 60 * 1000;
const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const toId = (v) =>
  mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v;

function validateSlotWindow(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start) || isNaN(end)) return { ok: false, msg: "Invalid dates" };
  if (end - start !== ONE_HOUR_MS)
    return { ok: false, msg: "Slot must be exactly 1 hour" };

  if (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate()
  ) {
    return { ok: false, msg: "Start and end must be on the same day" };
  }

  const hStart = start.getHours();
  const hEnd = end.getHours();
  if (hStart < OPEN_HOUR || hEnd > CLOSE_HOUR) {
    return { ok: false, msg: "Allowed slots are 9 AM to 9 PM only" };
  }

  if (end <= new Date()) return { ok: false, msg: "Slot is in the past" };

  return { ok: true, start, end };
}

async function hasOverlap(profileId, start, end) {
  const clash = await Booking.findOne({
    profileId,
    status: { $in: ["pending", "success"] },
    $or: [{ start: { $lt: end }, end: { $gt: start } }],
  }).select("_id");
  return !!clash;
}

exports.createRazorpayOrderAndBooking = async (req, res) => {
  try {
    const {
      userId,
      profileId,
      start,
      end,
      mode,
      amount = 500,
      currency = "INR",
      date,
    } = req.body;

    if (!userId || !profileId || !start || !end || !mode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (!["chat", "call"].includes(mode)) {
      return res
        .status(400)
        .json({ success: false, message: "mode must be 'chat' or 'call'" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId/profileId" });
    }

    const valid = validateSlotWindow(start, end);
    if (!valid.ok) {
      return res.status(400).json({ success: false, message: valid.msg });
    }

    const overlap = await hasOverlap(profileId, valid.start, valid.end);
    if (overlap) {
      return res
        .status(409)
        .json({ success: false, message: "Slot already taken" });
    }

    // (Optional) ensure profile exists
    const prof = await Profile.findById(profileId).select("_id").lean();
    if (!prof) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Razorpay amount is in paise
    const amountPaise = Math.round(amt * 100);

    const receipt = `bk_${Date.now()}_${String(profileId).slice(-6)}`;

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        userId: String(userId),
        profileId: String(profileId),
        mode,
      },
    });

    // ✅ Create booking as pending, store orderId
    const booking = await Booking.create({
      userId,
      profileId,
      start: valid.start,
      end: valid.end,
      mode,
      amount: amt,
      currency,
      status: "pending",
      date,
      payment: {
        gateway: "razorpay",
        orderId: order.id,
        raw: order,
      },
    });

    return res.status(201).json({
      success: true,
      booking,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID, // safe to send keyId to frontend
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (err) {
    console.error("createRazorpayOrderAndBooking error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.verifyRazorpayAndMarkBooking = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid bookingId" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.payment?.gateway !== "razorpay") {
      return res.status(400).json({ success: false, message: "Not a Razorpay booking" });
    }

    // ✅ Ensure order_id matches the booking
    if (booking.payment?.orderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "OrderId mismatch" });
    }

    // ✅ Verify signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      // mark failed
      booking.status = "failed";
      booking.payment = {
        ...booking.payment,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        raw: { ...(booking.payment?.raw || {}), verify: "failed" },
      };
      await booking.save();

      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }

    // ✅ Mark success
    booking.status = "success";
    booking.payment = {
      ...booking.payment,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      raw: { ...(booking.payment?.raw || {}), verify: "success" },
    };

    await booking.save();

    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error("verifyRazorpayAndMarkBooking error", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       userId,
//       profileId,
//       start,
//       end,
//       mode,
//       amount = 500,
//       currency = "INR",
//       status,
//       date,
//     } = req.body;

//     if (!userId || !profileId || !start || !end || !mode) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing fields" });
//     }

//     if (!["chat", "call"].includes(mode)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "mode must be 'chat' or 'call'" });
//     }

//     const valid = validateSlotWindow(start, end);
//     if (!valid.ok) {
//       return res.status(400).json({ success: false, message: valid.msg });
//     }

//     const overlap = await hasOverlap(profileId, valid.start, valid.end);
//     if (overlap) {
//       return res
//         .status(409)
//         .json({ success: false, message: "Slot already taken" });
//     }

//     const finalStatus =
//       status && ["pending", "success", "failed", "cancelled"].includes(status)
//         ? status
//         : "pending";

//     const booking = await Booking.create({
//       userId,
//       profileId,
//       start: valid.start,
//       end: valid.end,
//       mode,
//       amount,
//       currency,
//       status: finalStatus,
//       date,
//     });

//     return res.status(201).json({ success: true, booking });
//   } catch (err) {
//     console.error("createBooking error", err);
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Server error" });
//   }
// };

exports.markBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (!bookingId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId & status required" });
    }
    if (!["pending", "success", "failed", "cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error("markBookingStatus error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "userId required" });

    const data = await Booking.find({ userId }).sort({ start: -1 }).lean();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getMyBookings error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getBookingsForProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    if (!profileId)
      return res
        .status(400)
        .json({ success: false, message: "profileId required" });
    const data = await Booking.find({ profileId }).sort({ start: 1 }).lean();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getBookingsForProfile error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getTakenSlotsForDate = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { date } = req.query;
    if (!profileId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "profileId and date required" });
    }
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }
    const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    const data = await Booking.find({
      profileId,
      status: { $in: ["pending", "success"] },
      start: { $gte: dayStart, $lte: dayEnd },
    })
      .select("start end status")
      .lean();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getTakenSlotsForDate error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getContactForUserProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId } = req.query;

    console.log("----", profileId, userId);
    if (!userId || !profileId) {
      return res
        .status(400)
        .json({ success: false, message: "userId and profileId required" });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const profileIdObj = new mongoose.Types.ObjectId(profileId);

    const latest = await Booking.findOne({
      $or: [{ userId: userIdObj }, { userId }],
      $or: [{ profileId: profileIdObj }, { profileId }],
      status: "success",
    })
      .sort({ start: -1 })
      .select("start end status")
      .lean();

    if (!latest) {
      return res.status(200).json({
        success: true,
        allowed: false,
        message: "No booking found.",
      });
    }

    const now = Date.now();

    const GRACE_BEFORE_MS = 10 * 60 * 1000;
    const GRACE_AFTER_MS = 5 * 60 * 1000;

    const startMs = new Date(latest.start).getTime();
    const endMs = new Date(latest.end).getTime();

    const allowed =
      now >= startMs - GRACE_BEFORE_MS && now <= endMs + GRACE_AFTER_MS;

    const until = Math.min(endMs + GRACE_AFTER_MS, endMs);
    const unlocksAt = startMs - GRACE_BEFORE_MS;

    if (!allowed) {
      return res.status(200).json({
        success: true,
        allowed: false,
        message: "Booked, but contact unlocks closer to the slot.",
        unlocksAt,
        startsAt: startMs,
        endsAt: endMs,
      });
    }

    const prof = await Profile.findById(profileIdObj)
      .select("basics.email basics.mobile basics.fullName")
      .lean();

    if (!prof) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({
      success: true,
      allowed: true,
      email: prof?.basics?.email || "",
      mobile: prof?.basics?.mobile || "",
      until: new Date(endMs).toISOString(),
      profileName: prof?.basics?.fullName || "User",
    });
  } catch (err) {
    console.error("getContactForUserProfile error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};



exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid userId required" });
    }

    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this user",
      });
    }

    const profileIds = [...new Set(bookings.map((b) => b.profileId))];

    const profiles = await Profile.find({ _id: { $in: profileIds } }).lean();

    const profileMap = {};
    profiles.forEach((profile) => {
      profileMap[profile._id] = profile;
    });

    const data = bookings.map((booking) => ({
      booking,
      profile: profileMap[booking.profileId] || null,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("getProfileByUserId error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};



exports.getUserAndBookings = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid profileId required" });
    }

    const data = await Booking.aggregate([
      { $match: { profileId: new mongoose.Types.ObjectId(profileId) } },

      // join user
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // join profile
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" },

      // no $project -> keep everything
      { $sort: { createdAt: -1 } }, // latest bookings first
    ]);

    return res.status(200).json({ success: true, bookings: data });
  } catch (err) {
    console.error("getBookingsWithUserByProfile error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

exports.getAllBookingsWithUserAndProfile = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" },

      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      bookings: data,
    });
  } catch (err) {
    console.error("getAllBookingsWithUserAndProfile error", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};
