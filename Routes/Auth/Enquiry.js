const express = require("express");
const router = express.Router();
const EnquiryController = require("../../Controller/Auth/Enquiry");

router.post("/addenquiry", EnquiryController.addEnquiry);
router.get("/getenquiry", EnquiryController.getEnquiry);
router.get("/getenquirybyid/:id", EnquiryController.getEnquiryByid);
router.put("/updateenquiry/:id", EnquiryController.updateEnquiry);
router.delete("/deleteenquiry/:id", EnquiryController.DeleteEnquiry);

module.exports = router;
