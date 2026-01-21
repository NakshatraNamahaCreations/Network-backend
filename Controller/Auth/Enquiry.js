const Enquiry = require("../../Model/Auth/Enquiry");

exports.addEnquiry = async (req, res) => {
  try {
    const addenquirydata = req.body;
    const newEnquiry = new Enquiry(addenquirydata);
    await newEnquiry.save();
    res.status(200).json(newEnquiry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEnquiry = async (req, res) => {
  try {
    const Enquirydata = await Enquiry.find();
    if (!Enquirydata)
      return res.status(400).json({ error: "Enquiry data not found" });
    res.json(Enquirydata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEnquiryByid = async (req, res) => {
  try {
    const Enquirydata = await Enquiry.findById(req.params.id);
    if (!Enquirydata)
      return res.status(400).json({ error: "Enquiry data not found" });
    res.json(Enquirydata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEnquiry = async (req, res) => {
  try {
    const Enquirydata = await Enquiry.findById(req.params.id);
    if (!Enquirydata)
      return res.status(404).json({ error: "Enquiry data not found" });
    Object.assign(Enquirydata, req.body);
    Enquirydata.updatedAt = Date.now();
    await Enquirydata.save();
    res.json(Enquirydata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.DeleteEnquiry = async (req, res) => {
  try {
    const Enquirydata = await Enquiry.findByIdAndDelete(req.params.id);
    if (!Enquirydata)
      return res.status(400).json({ error: "Enquiry data not found" });
    res.json(Enquirydata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
