const express = require("express");
const { getMyNotifications, markAllRead, markOneRead, deleteNotification } = require("../../Controller/Auth/Notification");
const router = express.Router();

router.get("/:userId", getMyNotifications);
router.put("/read-all/:userId", markAllRead);
router.put("/read/:id", markOneRead);
router.delete("/:id", deleteNotification);

module.exports = router;
