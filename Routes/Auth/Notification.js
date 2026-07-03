const express = require("express");
const { getMyNotifications, markAllRead, markOneRead, deleteNotification, getUnreadCount } = require("../../Controller/Auth/Notification");
const router = express.Router();

router.get("/unread/:userId", getUnreadCount);
router.get("/:userId", getMyNotifications);
router.put("/read-all/:userId", markAllRead);
router.put("/read/:id", markOneRead);
router.delete("/:id", deleteNotification);

module.exports = router;
