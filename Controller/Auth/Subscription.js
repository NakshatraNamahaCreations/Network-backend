const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../../Model/Auth/Subscription");
const Plan = require("../../Model/Auth/Plan");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── helper: auto-expire past subscriptions for a user ── */
async function autoExpire(userId) {
  await Subscription.updateMany(
    { userId, status: "active", endDate: { $lt: new Date() } },
    { status: "expired" }
  );
}

/* ── Create Razorpay order for a plan purchase ── */
exports.createOrder = async (req, res) => {
  try {
    const { userId, planId } = req.body;
    if (!userId || !planId)
      return res.status(400).json({ success: false, message: "userId and planId required" });

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive)
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });

    const amountPaise = Math.round(plan.price * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      notes: { userId: String(userId), planId: String(planId) },
    });

    return res.status(200).json({
      success: true,
      razorpay: {
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
      },
      plan: {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        durationDays: plan.durationDays,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Verify payment and activate subscription ── */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      userId, planId,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: "Payment verification failed" });

    const plan = await Plan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Expire any existing active subscriptions
    await Subscription.updateMany({ userId, status: "active" }, { status: "expired" });

    const sub = await Subscription.create({
      userId,
      planId,
      planName: plan.name,
      planPrice: plan.price,
      durationDays: plan.durationDays,
      startDate,
      endDate,
      status: "active",
      payment: {
        gateway: "razorpay",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: plan.price,
      },
    });

    return res.status(200).json({ success: true, subscription: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Get subscription status for a user ── */
exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid userId" });

    await autoExpire(userId);

    const sub = await Subscription.findOne({ userId, status: "active" });
    if (!sub) return res.status(200).json({ success: true, isSubscribed: false });

    const msLeft = sub.endDate - new Date();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      isSubscribed: true,
      subscription: {
        planName: sub.planName,
        planPrice: sub.planPrice,
        durationDays: sub.durationDays,
        startDate: sub.startDate,
        endDate: sub.endDate,
        daysLeft,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Admin: list all subscriptions ── */
exports.getAllSubscriptions = async (req, res) => {
  try {
    await Subscription.updateMany(
      { status: "active", endDate: { $lt: new Date() } },
      { status: "expired" }
    );
    const subs = await Subscription.find()
      .populate("userId", "name phoneNumber email")
      .populate("planId", "name price durationDays")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, subscriptions: subs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
