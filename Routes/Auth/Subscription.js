const express = require("express");
const {
  createOrder,
  verifyPayment,
  getStatus,
  getAllSubscriptions,
} = require("../../Controller/Auth/Subscription");

const router = express.Router();

router.post("/create-order",   createOrder);
router.post("/verify",         verifyPayment);
router.get("/status/:userId",  getStatus);
router.get("/all",             getAllSubscriptions);

module.exports = router;
