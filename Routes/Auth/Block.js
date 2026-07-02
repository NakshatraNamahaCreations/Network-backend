const express = require("express");
const { blockUser, getMyBlocked, isBlocked } = require("../../Controller/Auth/Block");
const router = express.Router();

router.post("/toggle", blockUser);
router.get("/my/:userId", getMyBlocked);
router.get("/check", isBlocked);

module.exports = router;
